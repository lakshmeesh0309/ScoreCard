import React, { useState } from 'react';
import {
  Match,
  MatchFormat,
  Team,
  Player,
  PlayerRole,
  BattingStyle,
  BowlingStyle,
} from '../types/cricket';
import { PRESET_TEAMS, cloneTeam } from '../data/presetTeams';
import { calculateInningsState } from '../engine/scoringEngine';
import {
  CheckCircle,
  Plus,
  Trash2,
  Users,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface MatchSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMatch: (match: Match) => void;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  isOpen,
  onClose,
  onCreateMatch,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Match Info & Format, 2: Team A, 3: Team B

  const [matchName, setMatchName] = useState('Final - World Championship 2026');
  const [seriesName, setSeriesName] = useState('Global T20 Championship');
  const [matchDate, setMatchDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [venue, setVenue] = useState('Wankhede Stadium, Mumbai');
  const [format, setFormat] = useState<MatchFormat>('T20');
  const [customOvers, setCustomOvers] = useState<number>(20);
  const [customMaxPerBowler, setCustomMaxPerBowler] = useState<number>(4);

  // Teams state initialized from presets
  const [teamA, setTeamA] = useState<Team>(cloneTeam('team-ind', 'ind-match'));
  const [teamB, setTeamB] = useState<Team>(cloneTeam('team-aus', 'aus-match'));
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle format change
  const handleFormatChange = (fmt: MatchFormat) => {
    setFormat(fmt);
    if (fmt === 'T10') {
      setCustomOvers(10);
      setCustomMaxPerBowler(2);
    } else if (fmt === 'T20') {
      setCustomOvers(20);
      setCustomMaxPerBowler(4);
    } else if (fmt === 'ODI') {
      setCustomOvers(50);
      setCustomMaxPerBowler(10);
    }
  };

  // Quick preset loader
  const handleLoadPresetMatch = (presetA: string, presetB: string) => {
    sounds.playTap();
    const clonedA = cloneTeam(presetA, `team-a-${Date.now()}`);
    const clonedB = cloneTeam(presetB, `team-b-${Date.now()}`);
    setTeamA(clonedA);
    setTeamB(clonedB);
    setMatchName(`${clonedA.name} vs ${clonedB.name}`);
  };

  // Update a player in a team
  const updatePlayer = (
    teamType: 'A' | 'B',
    playerId: string,
    field: keyof Player,
    value: unknown
  ) => {
    const targetTeam = teamType === 'A' ? teamA : teamB;
    const setTargetTeam = teamType === 'A' ? setTeamA : setTeamB;

    const updatedXI = targetTeam.playingXI.map((p) => {
      if (p.id === playerId) {
        return { ...p, [field]: value };
      }
      // If setting Captain, remove captain from others
      if (field === 'isCaptain' && value === true) {
        return { ...p, isCaptain: false };
      }
      // If setting Wicketkeeper, remove from others
      if (field === 'isWicketkeeper' && value === true) {
        return { ...p, isWicketkeeper: false };
      }
      return p;
    });

    setTargetTeam({ ...targetTeam, playingXI: updatedXI });
  };

  // Move player between XI and substitutes
  const swapPlayerWithSub = (
    teamType: 'A' | 'B',
    xiPlayerId: string,
    subPlayerId: string
  ) => {
    sounds.playTap();
    const targetTeam = teamType === 'A' ? teamA : teamB;
    const setTargetTeam = teamType === 'A' ? setTeamA : setTeamB;

    const xiPlayer = targetTeam.playingXI.find((p) => p.id === xiPlayerId);
    const subPlayer = targetTeam.substitutes.find((p) => p.id === subPlayerId);

    if (!xiPlayer || !subPlayer) return;

    setTargetTeam({
      ...targetTeam,
      playingXI: targetTeam.playingXI.map((p) => (p.id === xiPlayerId ? subPlayer : p)),
      substitutes: targetTeam.substitutes.map((p) => (p.id === subPlayerId ? xiPlayer : p)),
    });
  };

  // Validation
  const validateMatch = (): boolean => {
    if (!matchName.trim()) {
      setValidationError('Please enter a match name.');
      return false;
    }
    if (!venue.trim()) {
      setValidationError('Please enter a match venue.');
      return false;
    }
    if (teamA.playingXI.length !== 11) {
      setValidationError(`${teamA.name} must have exactly 11 players in the Playing XI! Currently has ${teamA.playingXI.length}.`);
      return false;
    }
    if (teamB.playingXI.length !== 11) {
      setValidationError(`${teamB.name} must have exactly 11 players in the Playing XI! Currently has ${teamB.playingXI.length}.`);
      return false;
    }

    // Ensure wicketkeepers exist
    const hasWkA = teamA.playingXI.some((p) => p.isWicketkeeper);
    const hasWkB = teamB.playingXI.some((p) => p.isWicketkeeper);
    if (!hasWkA) teamA.playingXI[teamA.playingXI.length - 1].isWicketkeeper = true;
    if (!hasWkB) teamB.playingXI[teamB.playingXI.length - 1].isWicketkeeper = true;

    setValidationError(null);
    return true;
  };

  const handleFinishCreate = () => {
    if (!validateMatch()) return;

    sounds.playTap();
    const matchId = `match-${Date.now()}`;
    const totalOvers =
      format === 'T10'
        ? 10
        : format === 'T20'
        ? 20
        : format === 'ODI'
        ? 50
        : Number(customOvers);

    const maxOversPerBowler =
      format === 'T10'
        ? 2
        : format === 'T20'
        ? 4
        : format === 'ODI'
        ? 10
        : Number(customMaxPerBowler);

    const emptyMatch: Match = {
      id: matchId,
      name: matchName,
      series: seriesName,
      date: matchDate,
      venue,
      format,
      totalOvers,
      maxOversPerBowler,
      teamA,
      teamB,
      toss: null,
      status: 'toss',
      innings1: {
        inningsNumber: 1,
        battingTeamId: teamA.id,
        bowlingTeamId: teamB.id,
        status: 'not_started',
        totalRuns: 0,
        wickets: 0,
        legalBalls: 0,
        completedOvers: 0,
        oversFormatted: '0.0',
        currentRunRate: 0,
        deliveries: [],
        strikerId: null,
        nonStrikerId: null,
        currentBowlerId: null,
        previousBowlerId: null,
        battingScorecard: [],
        bowlingScorecard: [],
        partnerships: [],
        currentPartnership: null,
        fallOfWickets: [],
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
        last6Balls: [],
        currentOverDeliveries: [],
        didNotBatPlayerIds: [],
      },
      innings2: {
        inningsNumber: 2,
        battingTeamId: teamB.id,
        bowlingTeamId: teamA.id,
        status: 'not_started',
        totalRuns: 0,
        wickets: 0,
        legalBalls: 0,
        completedOvers: 0,
        oversFormatted: '0.0',
        currentRunRate: 0,
        deliveries: [],
        strikerId: null,
        nonStrikerId: null,
        currentBowlerId: null,
        previousBowlerId: null,
        battingScorecard: [],
        bowlingScorecard: [],
        partnerships: [],
        currentPartnership: null,
        fallOfWickets: [],
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
        last6Balls: [],
        currentOverDeliveries: [],
        didNotBatPlayerIds: [],
      },
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onCreateMatch(emptyMatch);
  };

  const renderTeamEditor = (teamType: 'A' | 'B') => {
    const targetTeam = teamType === 'A' ? teamA : teamB;
    const setTargetTeam = teamType === 'A' ? setTeamA : setTeamB;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="form-label">Team Name</label>
            <input
              type="text"
              value={targetTeam.name}
              onChange={(e) => setTargetTeam({ ...targetTeam, name: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label className="form-label">Short Code</label>
            <input
              type="text"
              value={targetTeam.shortName}
              onChange={(e) => setTargetTeam({ ...targetTeam, shortName: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--pitch-green)' }}>
            PLAYING XI ({targetTeam.playingXI.length}/11)
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Designate C, VC, and WK
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
          {targetTeam.playingXI.map((player, idx) => (
            <div
              key={player.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '30px 1.5fr 70px 1.2fr 1.2fr 100px',
                gap: '8px',
                alignItems: 'center',
                background: 'var(--bg-elevated)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</span>
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayer(teamType, player.id, 'name', e.target.value)}
                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
              />
              <input
                type="number"
                placeholder="#"
                value={player.jerseyNumber || ''}
                onChange={(e) => updatePlayer(teamType, player.id, 'jerseyNumber', Number(e.target.value))}
                style={{ padding: '4px 6px', fontSize: '0.85rem' }}
              />
              <select
                value={player.role}
                onChange={(e) => updatePlayer(teamType, player.id, 'role', e.target.value as PlayerRole)}
                style={{ padding: '4px 6px', fontSize: '0.8rem' }}
              >
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-rounder">All-rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
              <select
                value={player.battingStyle}
                onChange={(e) => updatePlayer(teamType, player.id, 'battingStyle', e.target.value as BattingStyle)}
                style={{ padding: '4px 6px', fontSize: '0.8rem' }}
              >
                <option value="Right-hand bat">RHB</option>
                <option value="Left-hand bat">LHB</option>
              </select>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  title="Captain"
                  onClick={() => updatePlayer(teamType, player.id, 'isCaptain', !player.isCaptain)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: player.isCaptain ? 'var(--gold-accent)' : 'var(--bg-card)',
                    color: player.isCaptain ? '#000' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                  }}
                >
                  C
                </button>
                <button
                  type="button"
                  title="Wicketkeeper"
                  onClick={() => updatePlayer(teamType, player.id, 'isWicketkeeper', !player.isWicketkeeper)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: player.isWicketkeeper ? 'var(--sky-blue)' : 'var(--bg-card)',
                    color: player.isWicketkeeper ? '#000' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                  }}
                >
                  WK
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Substitutes section */}
        {targetTeam.substitutes.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Substitutes / Bench ({targetTeam.substitutes.length})
            </h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {targetTeam.substitutes.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  #{sub.jerseyNumber || '-'} {sub.name} ({sub.role})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Create New Cricket Match</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Step {step} of 3: {step === 1 ? 'Match Details & Overs' : step === 2 ? `Configure ${teamA.name}` : `Configure ${teamB.name}`}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '6px 12px' }}>
            Cancel
          </button>
        </div>

        <div className="modal-body">
          {validationError && (
            <div
              style={{
                background: 'rgba(255, 23, 68, 0.12)',
                border: '1px solid rgba(255, 23, 68, 0.3)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--wicket-red)',
                marginBottom: '16px',
                fontSize: '0.85rem',
              }}
            >
              {validationError}
            </div>
          )}

          {step === 1 && (
            <div>
              {/* Presets Bar */}
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-accent)', marginBottom: '8px' }}>
                  <Sparkles size={16} />
                  <span>ONE-CLICK POPULAR MATCH PRESETS</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => handleLoadPresetMatch('team-ind', 'team-aus')}
                  >
                    🇮🇳 India vs 🇦🇺 Australia
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => handleLoadPresetMatch('team-csk', 'team-mi')}
                  >
                    🟡 CSK vs 🔵 MI (El Clásico)
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => handleLoadPresetMatch('team-ind', 'team-eng')}
                  >
                    🇮🇳 India vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England
                  </button>
                </div>
              </div>

              {/* Match Basic Details */}
              <div className="form-group">
                <label className="form-label">Match Title</label>
                <input
                  type="text"
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tournament / Series</label>
                  <input
                    type="text"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Match Date</label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Venue / Stadium</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Format Selection */}
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Match Format & Overs</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'T20', title: 'T20', desc: '20 Overs (Max 4/bwl)' },
                    { id: 'T10', title: 'T10', desc: '10 Overs (Max 2/bwl)' },
                    { id: 'ODI', title: 'ODI', desc: '50 Overs (Max 10/bwl)' },
                    { id: 'CUSTOM', title: 'Custom', desc: 'Custom Overs & Limits' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleFormatChange(fmt.id as MatchFormat)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 'var(--radius-md)',
                        border:
                          format === fmt.id
                            ? '2px solid var(--pitch-green)'
                            : '1px solid var(--border-subtle)',
                        background:
                          format === fmt.id
                            ? 'rgba(0, 230, 118, 0.12)'
                            : 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{fmt.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {fmt.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {format === 'CUSTOM' && (
                  <div className="form-row" style={{ marginTop: '12px' }}>
                    <div>
                      <label className="form-label">Total Overs</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={customOvers}
                        onChange={(e) => setCustomOvers(Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="form-label">Max Overs Per Bowler</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={customMaxPerBowler}
                        onChange={(e) => setCustomMaxPerBowler(Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && renderTeamEditor('A')}
          {step === 3 && renderTeamEditor('B')}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                sounds.playTap();
                setStep((s) => (s - 1) as 1 | 2);
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (step === 1 && !validateMatch()) return;
                sounds.playTap();
                setStep((s) => (s + 1) as 2 | 3);
              }}
            >
              <span>Next: {step === 1 ? `Configure ${teamA.name}` : `Configure ${teamB.name}`}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleFinishCreate}>
              <CheckCircle size={18} />
              <span>Save & Proceed to Toss</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
