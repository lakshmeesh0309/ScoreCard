import React, { useState } from 'react';
import { Match, Team, BowlerStats } from '../types/cricket';
import { Check, ShieldAlert } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface SelectBowlerModalProps {
  match: Match;
  inningsNumber: 1 | 2;
  isOpen: boolean;
  onSelectBowler: (bowlerId: string) => void;
  onClose: () => void;
}

export const SelectBowlerModal: React.FC<SelectBowlerModalProps> = ({
  match,
  inningsNumber,
  isOpen,
  onSelectBowler,
  onClose,
}) => {
  const innings = inningsNumber === 1 ? match.innings1 : match.innings2;
  const bowlingTeam: Team =
    match.teamA.id === innings.bowlingTeamId ? match.teamA : match.teamB;

  const previousBowlerId = innings.previousBowlerId;
  const maxOvers = match.maxOversPerBowler;

  const [selectedBowlerId, setSelectedBowlerId] = useState<string>('');

  if (!isOpen) return null;

  const getBowlerStats = (playerId: string): BowlerStats | undefined => {
    return innings.bowlingScorecard.find((b) => b.playerId === playerId);
  };

  const handleSelect = (playerId: string) => {
    sounds.playTap();
    onSelectBowler(playerId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Select Bowler for Next Over</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Choose an eligible bowler for {bowlingTeam.name}. (Max {maxOvers} ov per bowler).
            </p>
          </div>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bowlingTeam.playingXI.map((player) => {
              const stats = getBowlerStats(player.id);
              const legalBalls = stats ? stats.legalBalls : 0;
              const completedOvers = Math.floor(legalBalls / 6);
              const isOverLimit = completedOvers >= maxOvers;
              const isPreviousBowler = player.id === previousBowlerId;
              const isEligible = !isOverLimit && !isPreviousBowler;

              let reasonText = '';
              if (isPreviousBowler) reasonText = 'Cannot bowl consecutive overs';
              else if (isOverLimit) reasonText = `Completed max quota (${maxOvers} ov)`;

              return (
                <div
                  key={player.id}
                  onClick={() => {
                    if (isEligible) setSelectedBowlerId(player.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      selectedBowlerId === player.id
                        ? '2px solid var(--pitch-green)'
                        : '1px solid var(--border-subtle)',
                    background:
                      selectedBowlerId === player.id
                        ? 'rgba(0, 230, 118, 0.12)'
                        : isEligible
                        ? 'var(--bg-elevated)'
                        : 'rgba(255, 255, 255, 0.02)',
                    opacity: isEligible ? 1 : 0.5,
                    cursor: isEligible ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>
                        #{player.jerseyNumber || '-'} {player.name}
                      </span>
                      {player.isCaptain && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--gold-accent)' }}>(C)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {player.role} • {player.bowlingStyle}
                    </div>
                    {reasonText && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--wicket-red)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '2px',
                        }}
                      >
                        <ShieldAlert size={12} />
                        <span>{reasonText}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {stats ? (
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-numbers)',
                            fontWeight: 700,
                            fontSize: '1rem',
                          }}
                        >
                          {stats.oversFormatted} - {stats.maidens} - {stats.runsConceded} - {stats.wickets}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Econ: {stats.economy}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Yet to bowl</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedBowlerId}
            onClick={() => handleSelect(selectedBowlerId)}
          >
            <Check size={18} />
            <span>Confirm Bowler</span>
          </button>
        </div>
      </div>
    </div>
  );
};
