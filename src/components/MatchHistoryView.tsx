import React from 'react';
import { Match } from '../types/cricket';
import { Play, Trash2, Calendar, MapPin, Trophy, FileText } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface MatchHistoryViewProps {
  matches: Match[];
  activeMatchId: string | null;
  onSelectMatch: (match: Match) => void;
  onDeleteMatch: (id: string) => void;
  onNewMatch: () => void;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  matches,
  activeMatchId,
  onSelectMatch,
  onDeleteMatch,
  onNewMatch,
}) => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Matches Archive</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            All locally stored cricket matches and completed scorecards.
          </p>
        </div>
        <button className="btn-primary" onClick={onNewMatch}>
          Create New Match
        </button>
      </div>

      {matches.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Trophy size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            No Matches Saved Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Create your first match and start ball-by-ball live scoring!
          </p>
          <button className="btn-primary" onClick={onNewMatch}>
            Start Match Setup
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {matches.map((m) => {
            const isActive = m.id === activeMatchId;
            const tA = m.teamA;
            const tB = m.teamB;

            return (
              <div
                key={m.id}
                style={{
                  background: 'var(--bg-card)',
                  border: isActive
                    ? '2px solid var(--pitch-green)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(0, 230, 118, 0.15)',
                        color: 'var(--pitch-green)',
                      }}
                    >
                      {m.format} ({m.totalOvers} Overs)
                    </span>
                    {isActive && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'rgba(41, 121, 255, 0.2)',
                          color: 'var(--sky-blue)',
                        }}
                      >
                        CURRENT ACTIVE
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px' }}>
                    {m.name}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                    }}
                  >
                    <span>
                      <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {m.date}
                    </span>
                    <span>
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {m.venue}
                    </span>
                  </div>

                  {/* Scores Summary */}
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontFamily: 'var(--font-numbers)',
                      fontSize: '1.15rem',
                    }}
                  >
                    <div>
                      <strong>{tA.shortName}:</strong> {m.innings1.totalRuns}/
                      {m.innings1.wickets} ({m.innings1.oversFormatted} ov)
                    </div>
                    <span>vs</span>
                    <div>
                      <strong>{tB.shortName}:</strong> {m.innings2.totalRuns}/
                      {m.innings2.wickets} ({m.innings2.oversFormatted} ov)
                    </div>
                  </div>

                  {m.result && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--gold-accent)',
                      }}
                    >
                      🏆 {m.result.marginText}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      sounds.playTap();
                      onSelectMatch(m);
                    }}
                  >
                    <Play size={16} />
                    <span>Open Match</span>
                  </button>

                  <button
                    className="icon-btn"
                    style={{ color: 'var(--wicket-red)' }}
                    title="Delete Match"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${m.name}"?`)) {
                        sounds.playTap();
                        onDeleteMatch(m.id);
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
