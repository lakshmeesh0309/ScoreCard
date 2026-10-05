import React, { useState } from 'react';
import { Match, TossDecision } from '../types/cricket';
import { Award, CheckCircle, ShieldAlert } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface TossModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSaveToss: (winnerTeamId: string, decision: TossDecision) => void;
  isFirstBallDelivered: boolean;
}

export const TossModal: React.FC<TossModalProps> = ({
  match,
  isOpen,
  onClose,
  onSaveToss,
  isFirstBallDelivered,
}) => {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(
    match.toss?.winnerTeamId || match.teamA.id
  );
  const [selectedDecision, setSelectedDecision] = useState<TossDecision>(
    match.toss?.decision || 'bat'
  );
  const [adminOverride, setAdminOverride] = useState<boolean>(false);

  if (!isOpen) return null;

  const winnerTeam =
    selectedWinnerId === match.teamA.id ? match.teamA : match.teamB;
  const otherTeam =
    selectedWinnerId === match.teamA.id ? match.teamB : match.teamA;

  const battingFirstTeam =
    selectedDecision === 'bat' ? winnerTeam : otherTeam;
  const bowlingFirstTeam =
    selectedDecision === 'bat' ? otherTeam : winnerTeam;

  const isLocked = isFirstBallDelivered && !adminOverride;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playTap();
    onSaveToss(selectedWinnerId, selectedDecision);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 214, 0, 0.15)',
                color: 'var(--gold-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record Real-World Toss</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Enter the physical ground toss result decided by the captains and match referee.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isFirstBallDelivered && !adminOverride ? (
              <div
                style={{
                  background: 'rgba(255, 145, 0, 0.1)',
                  border: '1px solid rgba(255, 145, 0, 0.3)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--extra-amber)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} />
                  <span style={{ fontSize: '0.85rem' }}>
                    Toss is locked because deliveries have already been bowled.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setAdminOverride(true)}
                >
                  Admin Unlock
                </button>
              </div>
            ) : null}

            {/* Winner Team Selection */}
            <div className="form-group">
              <label className="form-label">Toss Winner</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setSelectedWinnerId(match.teamA.id)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      selectedWinnerId === match.teamA.id
                        ? '2px solid var(--pitch-green)'
                        : '1px solid var(--border-subtle)',
                    background:
                      selectedWinnerId === match.teamA.id
                        ? 'rgba(0, 230, 118, 0.12)'
                        : 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.05rem' }}>{match.teamA.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({match.teamA.shortName})
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setSelectedWinnerId(match.teamB.id)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      selectedWinnerId === match.teamB.id
                        ? '2px solid var(--pitch-green)'
                        : '1px solid var(--border-subtle)',
                    background:
                      selectedWinnerId === match.teamB.id
                        ? 'rgba(0, 230, 118, 0.12)'
                        : 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.05rem' }}>{match.teamB.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({match.teamB.shortName})
                  </div>
                </button>
              </div>
            </div>

            {/* Decision Selection */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Captain's Decision</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setSelectedDecision('bat')}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      selectedDecision === 'bat'
                        ? '2px solid var(--gold-accent)'
                        : '1px solid var(--border-subtle)',
                    background:
                      selectedDecision === 'bat'
                        ? 'rgba(255, 214, 0, 0.12)'
                        : 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                  }}
                >
                  🏏 Bat First
                </button>

                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setSelectedDecision('bowl')}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      selectedDecision === 'bowl'
                        ? '2px solid var(--sky-blue)'
                        : '1px solid var(--border-subtle)',
                    background:
                      selectedDecision === 'bowl'
                        ? 'rgba(0, 176, 255, 0.12)'
                        : 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                  }}
                >
                  ⚾ Bowl First
                </button>
              </div>
            </div>

            {/* Calculated Preview Card */}
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--gold-accent)',
                  marginBottom: '8px',
                }}
              >
                Derived Match Assignments
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>
                <strong>{winnerTeam.name}</strong> won the toss and elected to{' '}
                <strong>{selectedDecision === 'bat' ? 'bat' : 'bowl'}</strong>.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>1st Innings Batting:</span>
                  <div style={{ fontWeight: 700, color: 'var(--pitch-green)' }}>
                    {battingFirstTeam.name}
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>1st Innings Bowling:</span>
                  <div style={{ fontWeight: 700, color: 'var(--sky-blue)' }}>
                    {bowlingFirstTeam.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isLocked} className="btn-primary">
              <CheckCircle size={18} />
              <span>Confirm Toss Result</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
