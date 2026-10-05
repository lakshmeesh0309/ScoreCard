import React, { useState } from 'react';
import {
  Match,
  WicketType,
  Team,
  Player,
  ExtraType,
} from '../types/cricket';
import { UserX, CheckCircle, ShieldAlert } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface WicketModalProps {
  match: Match;
  inningsNumber: 1 | 2;
  isOpen: boolean;
  onClose: () => void;
  onRecordWicket: (wicketData: {
    wicketType: WicketType;
    dismissedBatterId: string;
    fielderId?: string;
    batterRuns: number;
    extraType: ExtraType;
    extraRuns: number;
    nextBatterId: string | null;
  }) => void;
}

export const WicketModal: React.FC<WicketModalProps> = ({
  match,
  inningsNumber,
  isOpen,
  onClose,
  onRecordWicket,
}) => {
  const innings = inningsNumber === 1 ? match.innings1 : match.innings2;
  const battingTeam: Team =
    match.teamA.id === innings.battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam: Team =
    match.teamA.id === innings.bowlingTeamId ? match.teamA : match.teamB;

  const strikerId = innings.strikerId || '';
  const nonStrikerId = innings.nonStrikerId || '';
  const bowlerId = innings.currentBowlerId || '';

  const striker = battingTeam.playingXI.find((p) => p.id === strikerId);
  const nonStriker = battingTeam.playingXI.find((p) => p.id === nonStrikerId);
  const wicketkeeper = bowlingTeam.playingXI.find((p) => p.isWicketkeeper);

  const [wicketType, setWicketType] = useState<WicketType>('caught');
  const [dismissedBatterId, setDismissedBatterId] = useState<string>(strikerId);
  const [fielderId, setFielderId] = useState<string>(
    wicketkeeper?.id || bowlingTeam.playingXI[0]?.id || ''
  );
  const [batterRuns, setBatterRuns] = useState<number>(0);
  const [extraType, setExtraType] = useState<ExtraType>('none');
  const [extraRuns, setExtraRuns] = useState<number>(0);

  // Eligible next batters: Must be in playing XI, NOT yet batted, NOT currently batting
  const alreadyBattedIds = new Set(
    innings.battingScorecard.map((b) => b.playerId)
  );
  const availableNextBatters = battingTeam.playingXI.filter(
    (p) =>
      !alreadyBattedIds.has(p.id) &&
      p.id !== strikerId &&
      p.id !== nonStrikerId
  );

  const [nextBatterId, setNextBatterId] = useState<string>(
    availableNextBatters[0]?.id || ''
  );

  if (!isOpen) return null;

  const isBowlerCredited = [
    'bowled',
    'caught',
    'lbw',
    'stumped',
    'hitWicket',
  ].includes(wicketType);

  const willBeAllOut =
    innings.wickets + 1 >= 10 ||
    innings.wickets + 1 >= battingTeam.playingXI.length - 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!willBeAllOut && availableNextBatters.length > 0 && !nextBatterId) {
      alert('Please select the incoming next batter.');
      return;
    }

    sounds.playWicket();
    onRecordWicket({
      wicketType,
      dismissedBatterId,
      fielderId:
        wicketType === 'caught' ||
        wicketType === 'runOut' ||
        wicketType === 'stumped'
          ? fielderId
          : undefined,
      batterRuns: Number(batterRuns),
      extraType,
      extraRuns: Number(extraRuns),
      nextBatterId: willBeAllOut ? null : nextBatterId || null,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header" style={{ borderBottomColor: 'rgba(255, 23, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 23, 68, 0.2)',
                color: 'var(--wicket-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserX size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--wicket-red)' }}>
                Fall of Wicket #{innings.wickets + 1}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Configure dismissal details and select the incoming batsman.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Wicket Type Grid */}
            <div className="form-group">
              <label className="form-label">Dismissal Type</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                {[
                  { id: 'caught', label: 'Caught' },
                  { id: 'bowled', label: 'Bowled' },
                  { id: 'lbw', label: 'LBW' },
                  { id: 'runOut', label: 'Run Out' },
                  { id: 'stumped', label: 'Stumped' },
                  { id: 'hitWicket', label: 'Hit Wicket' },
                  { id: 'retiredHurt', label: 'Retired Hurt' },
                  { id: 'retiredOut', label: 'Retired Out' },
                  { id: 'obstructingField', label: 'Obstructing' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setWicketType(item.id as WicketType);
                      if (item.id === 'stumped' && wicketkeeper) {
                        setFielderId(wicketkeeper.id);
                      }
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border:
                        wicketType === item.id
                          ? '2px solid var(--wicket-red)'
                          : '1px solid var(--border-subtle)',
                      background:
                        wicketType === item.id
                          ? 'rgba(255, 23, 68, 0.15)'
                          : 'var(--bg-elevated)',
                      color:
                        wicketType === item.id
                          ? 'var(--wicket-red)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dismissed Batter Selection (Striker vs Non-Striker) */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Dismissed Batsman</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDismissedBatterId(strikerId)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      dismissedBatterId === strikerId
                        ? '2px solid var(--wicket-red)'
                        : '1px solid var(--border-subtle)',
                    background:
                      dismissedBatterId === strikerId
                        ? 'rgba(255, 23, 68, 0.15)'
                        : 'var(--bg-elevated)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--pitch-green)' }}>
                    STRIKER
                  </div>
                  <div style={{ fontWeight: 700 }}>{striker?.name || 'Striker'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDismissedBatterId(nonStrikerId)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border:
                      dismissedBatterId === nonStrikerId
                        ? '2px solid var(--wicket-red)'
                        : '1px solid var(--border-subtle)',
                    background:
                      dismissedBatterId === nonStrikerId
                        ? 'rgba(255, 23, 68, 0.15)'
                        : 'var(--bg-elevated)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--sky-blue)' }}>
                    NON-STRIKER (Run Out)
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {nonStriker?.name || 'Non-Striker'}
                  </div>
                </button>
              </div>
            </div>

            {/* Fielder Selection for Caught, Run Out, Stumped */}
            {(wicketType === 'caught' ||
              wicketType === 'runOut' ||
              wicketType === 'stumped') && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">
                  {wicketType === 'stumped'
                    ? 'Wicketkeeper'
                    : wicketType === 'caught'
                    ? 'Fielder (Catch taken by)'
                    : 'Fielder (Run out throw/hit by)'}
                </label>
                <select
                  value={fielderId}
                  onChange={(e) => setFielderId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {wicketType === 'caught' && (
                    <option value={bowlerId}>Caught & Bowled (Bowler)</option>
                  )}
                  {bowlingTeam.playingXI.map((f: Player) => (
                    <option key={f.id} value={f.id}>
                      #{f.jerseyNumber || '-'} {f.name} {f.isWicketkeeper ? '(WK)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Runs on Delivery (for Run Out or No-Ball Wicket) */}
            {wicketType === 'runOut' && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">
                  Runs completed before run-out
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 1, 2, 3].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setBatterRuns(r)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        border:
                          batterRuns === r
                            ? '2px solid var(--pitch-green)'
                            : '1px solid var(--border-subtle)',
                        background:
                          batterRuns === r
                            ? 'rgba(0, 230, 118, 0.15)'
                            : 'var(--bg-elevated)',
                        fontWeight: 700,
                      }}
                    >
                      {r} {r === 1 ? 'Run' : 'Runs'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Next Batter Selection */}
            {!willBeAllOut ? (
              <div
                className="form-group"
                style={{
                  marginTop: '20px',
                  background: 'var(--bg-card)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <label
                  className="form-label"
                  style={{ color: 'var(--gold-accent)', fontSize: '0.9rem' }}
                >
                  SELECT NEXT BATTER
                </label>
                {availableNextBatters.length > 0 ? (
                  <select
                    value={nextBatterId}
                    onChange={(e) => setNextBatterId(e.target.value)}
                    style={{ width: '100%', borderColor: 'var(--gold-accent)' }}
                  >
                    {availableNextBatters.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.jerseyNumber || '-'} {p.name} ({p.role}) - {p.battingStyle}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No more batters left in playing XI.
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 23, 68, 0.1)',
                  border: '1px solid var(--wicket-red)',
                  color: 'var(--wicket-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldAlert size={18} />
                <span>
                  This is the 10th wicket. {battingTeam.name} will be ALL OUT!
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="wicket-btn" style={{ padding: '0 24px' }}>
              <CheckCircle size={18} />
              <span>Record Wicket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
