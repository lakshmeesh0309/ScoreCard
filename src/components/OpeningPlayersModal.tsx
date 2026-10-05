import React, { useState } from 'react';
import { Match, Team, Player } from '../types/cricket';
import { PlayCircle, UserCheck } from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface OpeningPlayersModalProps {
  match: Match;
  inningsNumber: 1 | 2;
  isOpen: boolean;
  onConfirm: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
}

export const OpeningPlayersModal: React.FC<OpeningPlayersModalProps> = ({
  match,
  inningsNumber,
  isOpen,
  onConfirm,
}) => {
  const isFirst = inningsNumber === 1;
  const battingTeamId = isFirst ? match.innings1.battingTeamId : match.innings2.battingTeamId;
  const bowlingTeamId = isFirst ? match.innings1.bowlingTeamId : match.innings2.bowlingTeamId;

  const battingTeam: Team =
    match.teamA.id === battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam: Team =
    match.teamA.id === bowlingTeamId ? match.teamA : match.teamB;

  const [strikerId, setStrikerId] = useState<string>(
    battingTeam.playingXI[0]?.id || ''
  );
  const [nonStrikerId, setNonStrikerId] = useState<string>(
    battingTeam.playingXI[1]?.id || ''
  );
  const [bowlerId, setBowlerId] = useState<string>(
    bowlingTeam.playingXI[bowlingTeam.playingXI.length - 2]?.id || bowlingTeam.playingXI[0]?.id || ''
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
              {inningsNumber === 1 ? '1st Innings: Opening Lineup' : '2nd Innings: Opening Lineup'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Select the two opening batsmen for {battingTeam.name} and the opening bowler for {bowlingTeam.name}.
            </p>
          </div>
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
              <label className="form-label" style={{ color: 'var(--pitch-green)' }}>
                🏏 Striker (Facing First Ball) - {battingTeam.shortName}
              </label>
              <select
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                style={{ width: '100%' }}
              >
                {battingTeam.playingXI.map((player: Player) => (
                  <option key={player.id} value={player.id}>
                    #{player.jerseyNumber || '-'} {player.name} ({player.role}) - {player.battingStyle}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker Select */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label" style={{ color: 'var(--sky-blue)' }}>
                🏃 Non-Striker (Runner End) - {battingTeam.shortName}
              </label>
              <select
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                style={{ width: '100%' }}
              >
                {battingTeam.playingXI.map((player: Player) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={player.id === strikerId}
                  >
                    #{player.jerseyNumber || '-'} {player.name} ({player.role}) - {player.battingStyle}
                    {player.id === strikerId ? ' (Selected as Striker)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Opening Bowler Select */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label" style={{ color: 'var(--gold-accent)' }}>
                ⚾ Opening Bowler (Over 1) - {bowlingTeam.shortName}
              </label>
              <select
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                style={{ width: '100%' }}
              >
                {bowlingTeam.playingXI.map((player: Player) => (
                  <option key={player.id} value={player.id}>
                    #{player.jerseyNumber || '-'} {player.name} ({player.role}) - {player.bowlingStyle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              <PlayCircle size={18} />
              <span>Start Innings & Begin Scoring</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
