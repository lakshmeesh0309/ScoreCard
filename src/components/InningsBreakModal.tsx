import React from 'react';
import { Match, Team } from '../types/cricket';
import { ArrowRight, Trophy } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface InningsBreakModalProps {
  match: Match;
  isOpen: boolean;
  onStartSecondInnings: () => void;
}

export const InningsBreakModal: React.FC<InningsBreakModalProps> = ({
  match,
  isOpen,
  onStartSecondInnings,
}) => {
  if (!isOpen) return null;

  const innings1 = match.innings1;
  const battingTeam1: Team =
    match.teamA.id === innings1.battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam1: Team =
    match.teamA.id === innings1.bowlingTeamId ? match.teamA : match.teamB;

  const target = innings1.totalRuns + 1;
  const requiredRate = Number((target / match.totalOvers).toFixed(2));

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div className="modal-header" style={{ justifyContent: 'center' }}>
          <div>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(0, 230, 118, 0.15)',
                color: 'var(--pitch-green)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <Trophy size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Innings Break</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              1st Innings has concluded.
            </p>
          </div>
        </div>

        <div className="modal-body">
          {/* Summary Box */}
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {battingTeam1.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-numbers)',
                fontSize: '3.5rem',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.1,
              }}
            >
              {innings1.totalRuns} / {innings1.wickets}
            </div>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
              {innings1.oversFormatted} Overs (RR: {innings1.currentRunRate})
            </div>
          </div>

          {/* Chase Target Box */}
          <div
            style={{
              background: 'rgba(41, 121, 255, 0.1)',
              border: '1px solid rgba(41, 121, 255, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sky-blue)' }}>
              TARGET FOR {bowlingTeam1.name.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-numbers)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--sky-blue)',
              }}
            >
              {target} RUNS
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Requires {target} runs in {match.totalOvers} overs (RRR: {requiredRate})
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
            onClick={() => {
              sounds.playTap();
              onStartSecondInnings();
            }}
          >
            <span>Start 2nd Innings</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
