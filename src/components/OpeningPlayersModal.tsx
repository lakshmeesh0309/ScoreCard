import React, { useState, useEffect } from 'react';
import { Match, Team, Player } from '../types/cricket';
import { PlayCircle, UserCheck, X } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface OpeningPlayersModalProps {
  match: Match;
  inningsNumber: 1 | 2;
  isOpen: boolean;
  onConfirm: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  onClose?: () => void;
}

export const OpeningPlayersModal: React.FC<OpeningPlayersModalProps> = ({
  match,
  inningsNumber,
  isOpen,
  onConfirm,
  onClose,
}) => {
  const isFirst = inningsNumber === 1;
  const battingTeamId = isFirst ? match.innings1.battingTeamId : match.innings2.battingTeamId;
  const bowlingTeamId = isFirst ? match.innings1.bowlingTeamId : match.innings2.bowlingTeamId;

  const battingTeam: Team =
    match.teamA.id === battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam: Team =
    match.teamA.id === bowlingTeamId ? match.teamA : match.teamB;

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or teams change
  useEffect(() => {
    if (isOpen && battingTeam.playingXI.length > 0 && bowlingTeam.playingXI.length > 0) {
      const inn = isFirst ? match.innings1 : match.innings2;

      // Find valid striker in batting XI
      let initialStriker = inn.strikerId || '';
      if (!battingTeam.playingXI.some((p) => p.id === initialStriker)) {
        initialStriker = battingTeam.playingXI[0]?.id || '';
      }

      // Find valid non-striker in batting XI (different from striker)
      let initialNonStriker = inn.nonStrikerId || '';
      if (
        !battingTeam.playingXI.some((p) => p.id === initialNonStriker) ||
        initialNonStriker === initialStriker
      ) {
        const other = battingTeam.playingXI.find((p) => p.id !== initialStriker);
        initialNonStriker = other ? other.id : battingTeam.playingXI[1]?.id || '';
      }

      // Find valid bowler in bowling XI
      let initialBowler = inn.currentBowlerId || '';
      if (!bowlingTeam.playingXI.some((p) => p.id === initialBowler)) {
        // Default to a bowler or all-rounder if available, else last player
        const designatedBowler =
          bowlingTeam.playingXI.find((p) => p.role === 'Bowler') ||
          bowlingTeam.playingXI[bowlingTeam.playingXI.length - 1];
        initialBowler = designatedBowler ? designatedBowler.id : bowlingTeam.playingXI[0]?.id || '';
      }

      setStrikerId(initialStriker);
      setNonStrikerId(initialNonStriker);
      setBowlerId(initialBowler);
      setError(null);
    }
  }, [isOpen, battingTeamId, bowlingTeamId, inningsNumber]);

  if (!isOpen) return null;

  const handleStrikerChange = (newStrikerId: string) => {
    setStrikerId(newStrikerId);
    if (newStrikerId === nonStrikerId) {
      // Auto-pick another player for non-striker
      const nextAvailable = battingTeam.playingXI.find((p) => p.id !== newStrikerId);
      if (nextAvailable) setNonStrikerId(nextAvailable.id);
    }
  };

  const handleNonStrikerChange = (newNonStrikerId: string) => {
    setNonStrikerId(newNonStrikerId);
    if (newNonStrikerId === strikerId) {
      // Auto-pick another player for striker
      const nextAvailable = battingTeam.playingXI.find((p) => p.id !== newNonStrikerId);
      if (nextAvailable) setStrikerId(nextAvailable.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strikerId || !nonStrikerId || !bowlerId) {
      setError('Please select striker, non-striker, and opening bowler.');
      return;
    }
    if (strikerId === nonStrikerId) {
      setError('Striker and non-striker cannot be the same player!');
      return;
    }
    setError(null);
    sounds.playTap();
    onConfirm(strikerId, nonStrikerId, bowlerId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {isFirst ? '1st Innings: Choose Opening Lineup' : '2nd Innings: Choose Opening Lineup'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Select the opening batters for <strong>{battingTeam.name}</strong> and the opening bowler for <strong>{bowlingTeam.name}</strong>.
            </p>
          </div>
          {onClose && (
            <button type="button" className="icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'rgba(255, 23, 68, 0.1)',
                  border: '1px solid rgba(255, 23, 68, 0.3)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--wicket-red)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            {/* Striker Select */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--pitch-green)', fontWeight: 700 }}>
                🏏 Striker (Facing Ball 1) — {battingTeam.name}
              </label>
              <select
                value={strikerId}
                onChange={(e) => handleStrikerChange(e.target.value)}
                style={{ width: '100%', borderColor: 'rgba(0, 230, 118, 0.4)' }}
              >
                {battingTeam.playingXI.map((player: Player) => (
                  <option key={player.id} value={player.id}>
                    #{player.jerseyNumber || '-'} {player.name} ({player.role}) — {player.battingStyle}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker Select */}
            <div className="form-group" style={{ marginTop: '18px' }}>
              <label className="form-label" style={{ color: 'var(--sky-blue)', fontWeight: 700 }}>
                🏃 Non-Striker (Runner End) — {battingTeam.name}
              </label>
              <select
                value={nonStrikerId}
                onChange={(e) => handleNonStrikerChange(e.target.value)}
                style={{ width: '100%', borderColor: 'rgba(41, 121, 255, 0.4)' }}
              >
                {battingTeam.playingXI.map((player: Player) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={player.id === strikerId}
                  >
                    #{player.jerseyNumber || '-'} {player.name} ({player.role}) — {player.battingStyle}
                    {player.id === strikerId ? ' (Selected as Striker)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Opening Bowler Select */}
            <div className="form-group" style={{ marginTop: '18px' }}>
              <label className="form-label" style={{ color: 'var(--gold-accent)', fontWeight: 700 }}>
                ⚾ Opening Bowler (Over 1) — {bowlingTeam.name}
              </label>
              <select
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                style={{ width: '100%', borderColor: 'rgba(255, 214, 0, 0.4)' }}
              >
                {bowlingTeam.playingXI.map((player: Player) => (
                  <option key={player.id} value={player.id}>
                    #{player.jerseyNumber || '-'} {player.name} ({player.role}) — {player.bowlingStyle}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Preview Card */}
            <div
              style={{
                marginTop: '20px',
                padding: '14px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Starting Matchup:</div>
              <div style={{ fontWeight: 700 }}>
                <span style={{ color: 'var(--pitch-green)' }}>
                  {battingTeam.playingXI.find((p) => p.id === strikerId)?.name || 'Striker'}
                </span>{' '}
                &{' '}
                <span style={{ color: 'var(--sky-blue)' }}>
                  {battingTeam.playingXI.find((p) => p.id === nonStrikerId)?.name || 'Non-Striker'}
                </span>{' '}
                opening for <strong>{battingTeam.shortName}</strong> against{' '}
                <span style={{ color: 'var(--gold-accent)' }}>
                  {bowlingTeam.playingXI.find((p) => p.id === bowlerId)?.name || 'Bowler'}
                </span>{' '}
                ({bowlingTeam.shortName}).
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {onClose && (
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              <PlayCircle size={18} />
              <span>Confirm Openers & Begin Scoring</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
