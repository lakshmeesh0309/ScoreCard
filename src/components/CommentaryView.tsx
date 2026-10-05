import React, { useState } from 'react';
import { Match, InningsState, Delivery } from '../types/cricket';
import { Edit2, Check } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface CommentaryViewProps {
  match: Match;
  onUpdateCommentary?: (deliveryId: string, newText: string) => void;
}

export const CommentaryView: React.FC<CommentaryViewProps> = ({
  match,
  onUpdateCommentary,
}) => {
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(
    match.innings2.status !== 'not_started' ? 2 : 1
  );
  const [filter, setFilter] = useState<'all' | 'wickets' | 'boundaries' | 'extras'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const innings: InningsState = selectedInnings === 1 ? match.innings1 : match.innings2;
  const deliveries = [...innings.deliveries].reverse(); // latest on top

  const filteredDeliveries = deliveries.filter((d) => {
    if (filter === 'wickets') return !!d.wicket;
    if (filter === 'boundaries') return d.batterRuns === 4 || d.batterRuns === 6;
    if (filter === 'extras') return d.extraType !== 'none';
    return true;
  });

  const handleStartEdit = (d: Delivery) => {
    setEditingId(d.id);
    setEditText(d.commentary);
  };

  const handleSave = (id: string) => {
    sounds.playTap();
    if (onUpdateCommentary) {
      onUpdateCommentary(id, editText);
    }
    setEditingId(null);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header and Innings Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn-secondary ${selectedInnings === 1 ? 'active' : ''}`}
            style={{
              borderColor: selectedInnings === 1 ? 'var(--pitch-green)' : 'var(--border-subtle)',
              color: selectedInnings === 1 ? 'var(--pitch-green)' : 'inherit',
            }}
            onClick={() => setSelectedInnings(1)}
          >
            1st Innings
          </button>
          {match.innings2.status !== 'not_started' && (
            <button
              className={`btn-secondary ${selectedInnings === 2 ? 'active' : ''}`}
              style={{
                borderColor: selectedInnings === 2 ? 'var(--pitch-green)' : 'var(--border-subtle)',
                color: selectedInnings === 2 ? 'var(--pitch-green)' : 'inherit',
              }}
              onClick={() => setSelectedInnings(2)}
            >
              2nd Innings
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Balls' },
            { id: 'wickets', label: 'Wickets' },
            { id: 'boundaries', label: 'Boundaries (4s/6s)' },
            { id: 'extras', label: 'Extras' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background:
                  filter === f.id ? 'var(--pitch-green)' : 'var(--bg-elevated)',
                color: filter === f.id ? '#04240f' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Commentary List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredDeliveries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-muted)',
            }}
          >
            No deliveries match the selected filter.
          </div>
        ) : (
          filteredDeliveries.map((d) => {
            const isEditing = editingId === d.id;
            let typeClass = '';
            if (d.wicket) typeClass = 'wicket';
            else if (d.batterRuns === 4) typeClass = 'boundary-4';
            else if (d.batterRuns === 6) typeClass = 'boundary-6';

            return (
              <div
                key={d.id}
                className={`commentary-item ${typeClass}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-numbers)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--pitch-green)',
                      }}
                    >
                      {d.displayBall}
                    </span>

                    {d.wicket && (
                      <span
                        style={{
                          background: 'rgba(255, 23, 68, 0.2)',
                          color: 'var(--wicket-red)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        WICKET
                      </span>
                    )}

                    {d.batterRuns === 4 && (
                      <span
                        style={{
                          background: 'rgba(0, 230, 118, 0.2)',
                          color: 'var(--pitch-green)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        FOUR
                      </span>
                    )}

                    {d.batterRuns === 6 && (
                      <span
                        style={{
                          background: 'rgba(179, 136, 255, 0.2)',
                          color: 'var(--boundary-six)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        SIX
                      </span>
                    )}

                    {d.extraType !== 'none' && (
                      <span
                        style={{
                          background: 'rgba(255, 145, 0, 0.2)',
                          color: 'var(--extra-amber)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {d.extraType.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {!isEditing ? (
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {d.commentary}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleSave(d.id)}
                      >
                        <Check size={14} />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing && onUpdateCommentary && (
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => handleStartEdit(d)}
                    title="Edit Commentary"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
