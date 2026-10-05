import React, { useState } from 'react';
import { Match, Delivery, ExtraType } from '../types/cricket';
import { Trash2, Edit3, Undo2, Check, RefreshCw } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface DeliveryEditModalProps {
  match: Match;
  inningsNumber: 1 | 2;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDelivery: (updatedDelivery: Delivery) => void;
  onDeleteDelivery: (deliveryId: string) => void;
  onUndoLastBall: () => void;
}

export const DeliveryEditModal: React.FC<DeliveryEditModalProps> = ({
  match,
  inningsNumber,
  isOpen,
  onClose,
  onUpdateDelivery,
  onDeleteDelivery,
  onUndoLastBall,
}) => {
  const innings = inningsNumber === 1 ? match.innings1 : match.innings2;
  const deliveries = [...innings.deliveries].reverse(); // Latest deliveries first

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBatterRuns, setEditBatterRuns] = useState<number>(0);
  const [editExtraType, setEditExtraType] = useState<ExtraType>('none');
  const [editExtraRuns, setEditExtraRuns] = useState<number>(0);
  const [editCommentary, setEditCommentary] = useState<string>('');

  if (!isOpen) return null;

  const startEdit = (d: Delivery) => {
    setEditingId(d.id);
    setEditBatterRuns(d.batterRuns);
    setEditExtraType(d.extraType);
    setEditExtraRuns(d.extraRuns);
    setEditCommentary(d.commentary);
  };

  const saveEdit = (d: Delivery) => {
    sounds.playTap();
    const isLegal = editExtraType !== 'wide' && editExtraType !== 'noBall';
    const updated: Delivery = {
      ...d,
      batterRuns: Number(editBatterRuns),
      extraType: editExtraType,
      extraRuns: Number(editExtraRuns),
      totalRuns: Number(editBatterRuns) + Number(editExtraRuns),
      isLegalDelivery: isLegal,
      commentary: editCommentary,
    };
    onUpdateDelivery(updated);
    setEditingId(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Ball-by-Ball History & Event Correction
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Edit or delete any delivery in this innings. The engine will instantly recalculate all scores, strike rates, overs, and bowler figures.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              sounds.playTap();
              onUndoLastBall();
            }}
            disabled={innings.deliveries.length === 0}
            style={{ fontSize: '0.85rem' }}
          >
            <Undo2 size={16} />
            <span>Undo Last Ball</span>
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {deliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No deliveries have been recorded yet in this innings.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {deliveries.map((d) => {
                const isEditing = editingId === d.id;

                return (
                  <div
                    key={d.id}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-numbers)',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: 'var(--pitch-green)',
                          }}
                        >
                          Ball {d.displayBall}
                        </span>
                        {d.wicket && (
                          <span
                            style={{
                              background: 'rgba(255, 23, 68, 0.2)',
                              color: 'var(--wicket-red)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            OUT ({d.wicket.type})
                          </span>
                        )}
                        {d.extraType !== 'none' && (
                          <span
                            style={{
                              background: 'rgba(255, 145, 0, 0.2)',
                              color: 'var(--extra-amber)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {d.extraType.toUpperCase()} (+{d.extraRuns})
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          Total: {d.totalRuns} run{d.totalRuns !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!isEditing ? (
                          <>
                            <button
                              type="button"
                              className="icon-btn"
                              style={{ width: '32px', height: '32px' }}
                              onClick={() => startEdit(d)}
                              title="Edit delivery"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              style={{ width: '32px', height: '32px', color: 'var(--wicket-red)' }}
                              onClick={() => {
                                if (confirm(`Delete delivery ${d.displayBall}? All subsequent stats will recalculate.`)) {
                                  onDeleteDelivery(d.id);
                                }
                              }}
                              title="Delete delivery"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            onClick={() => saveEdit(d)}
                          >
                            <Check size={14} />
                            <span>Save</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {!isEditing ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {d.commentary}
                      </div>
                    ) : (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>
                              Batter Runs (0-6)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={editBatterRuns}
                              onChange={(e) => setEditBatterRuns(Number(e.target.value))}
                              style={{ width: '100%', padding: '6px 10px' }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>
                              Extra Type
                            </label>
                            <select
                              value={editExtraType}
                              onChange={(e) => {
                                const type = e.target.value as ExtraType;
                                setEditExtraType(type);
                                if (type !== 'none' && editExtraRuns === 0) {
                                  setEditExtraRuns(1);
                                } else if (type === 'none') {
                                  setEditExtraRuns(0);
                                }
                              }}
                              style={{ width: '100%', padding: '6px 10px' }}
                            >
                              <option value="none">None</option>
                              <option value="wide">Wide</option>
                              <option value="noBall">No Ball</option>
                              <option value="bye">Bye</option>
                              <option value="legBye">Leg Bye</option>
                              <option value="penalty">Penalty</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>
                              Extra Runs
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={editExtraRuns}
                              onChange={(e) => setEditExtraRuns(Number(e.target.value))}
                              style={{ width: '100%', padding: '6px 10px' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>
                            Commentary
                          </label>
                          <input
                            type="text"
                            value={editCommentary}
                            onChange={(e) => setEditCommentary(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
