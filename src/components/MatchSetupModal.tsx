import React, { useState } from 'react';
import {
  Match,
  MatchFormat,
  Team,
  Player,
  PlayerRole,
  BattingStyle,
} from '../types/cricket';
import { cloneTeam } from '../data/presetTeams';
import {
  CheckCircle,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Shield,
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
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Match & Teams Overview, 2: Team A Squad, 3: Team B Squad

  const [teamAName, setTeamAName] = useState('India');
  const [teamAShort, setTeamAShort] = useState('IND');
  const [teamBName, setTeamBName] = useState('Australia');
  const [teamBShort, setTeamBShort] = useState('AUS');

  const [matchName, setMatchName] = useState('India vs Australia - Super 8 Clash');
  const [seriesName, setSeriesName] = useState('ICC World Championship 2026');
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
    sounds.playTap();
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
    setTeamAName(clonedA.name);
    setTeamAShort(clonedA.shortName);
    setTeamBName(clonedB.name);
    setTeamBShort(clonedB.shortName);
    setMatchName(`${clonedA.name} vs ${clonedB.name}`);
  };

  // Update Team A Name
  const handleTeamANameChange = (newName: string) => {
    setTeamAName(newName);
    setTeamA((prev) => ({ ...prev, name: newName }));
    setMatchName(`${newName} vs ${teamBName}`);
  };

  // Update Team B Name
  const handleTeamBNameChange = (newName: string) => {
    setTeamBName(newName);
    setTeamB((prev) => ({ ...prev, name: newName }));
    setMatchName(`${teamAName} vs ${newName}`);
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
      if (field === 'isCaptain' && value === true) {
        return { ...p, isCaptain: false };
      }
      if (field === 'isWicketkeeper' && value === true) {
        return { ...p, isWicketkeeper: false };
      }
      return p;
    });

    setTargetTeam({ ...targetTeam, playingXI: updatedXI });
  };

  // Validation
  const validateMatch = (): boolean => {
    if (!teamAName.trim()) {
      setValidationError('Please enter Team A name.');
      return false;
    }
    if (!teamBName.trim()) {
      setValidationError('Please enter Team B name.');
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

    const finalTeamA: Team = {
      ...teamA,
      name: teamAName,
      shortName: teamAShort.toUpperCase(),
    };

    const finalTeamB: Team = {
      ...teamB,
      name: teamBName,
      shortName: teamBShort.toUpperCase(),
    };

    const emptyMatch: Match = {
      id: matchId,
      name: matchName,
      series: seriesName,
      date: matchDate,
      venue,
      format,
      totalOvers,
      maxOversPerBowler,
      teamA: finalTeamA,
      teamB: finalTeamB,
      toss: null,
      status: 'toss',
      innings1: {
        inningsNumber: 1,
        battingTeamId: finalTeamA.id,
        bowlingTeamId: finalTeamB.id,
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
        battingTeamId: finalTeamB.id,
        bowlingTeamId: finalTeamA.id,
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
    const teamName = teamType === 'A' ? teamAName : teamBName;
    const teamShort = teamType === 'A' ? teamAShort : teamBShort;
    const setTeamName = teamType === 'A' ? handleTeamANameChange : handleTeamBNameChange;
    const setTeamShort = teamType === 'A' ? setTeamAShort : setTeamBShort;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              {teamType === 'A' ? 'Team A Name' : 'Team B Name'}
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Mumbai Indians"
              style={{ width: '100%', fontSize: '1rem', fontWeight: 600 }}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Short Code
            </label>
            <input
              type="text"
              value={teamShort}
              onChange={(e) => setTeamShort(e.target.value.toUpperCase())}
              placeholder="e.g. MI"
              maxLength={5}
              style={{ width: '100%', fontSize: '1rem', fontWeight: 700 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--pitch-green)' }}>
            PLAYING XI ({targetTeam.playingXI.length}/11)
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Edit player names, jersey numbers, and toggle Captain (C) / Wicketkeeper (WK)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
          {targetTeam.playingXI.map((player, idx) => (
            <div
              key={player.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1.6fr 65px 1.1fr 1.1fr 85px',
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
                placeholder="Player Name"
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

        {/* Substitutes */}
        {targetTeam.substitutes.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Substitutes / Reserves ({targetTeam.substitutes.length})
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
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className={`btn-secondary ${step === 1 ? 'active' : ''}`}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderColor: step === 1 ? 'var(--pitch-green)' : 'var(--border-subtle)',
                  color: step === 1 ? 'var(--pitch-green)' : 'inherit',
                }}
                onClick={() => setStep(1)}
              >
                1. Match & Teams Setup
              </button>
              <button
                type="button"
                className={`btn-secondary ${step === 2 ? 'active' : ''}`}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderColor: step === 2 ? 'var(--pitch-green)' : 'var(--border-subtle)',
                  color: step === 2 ? 'var(--pitch-green)' : 'inherit',
                }}
                onClick={() => setStep(2)}
              >
                2. {teamAName} Squad ({teamA.playingXI.length})
              </button>
              <button
                type="button"
                className={`btn-secondary ${step === 3 ? 'active' : ''}`}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderColor: step === 3 ? 'var(--pitch-green)' : 'var(--border-subtle)',
                  color: step === 3 ? 'var(--pitch-green)' : 'inherit',
                }}
                onClick={() => setStep(3)}
              >
                3. {teamBName} Squad ({teamB.playingXI.length})
              </button>
            </div>
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
                    🟡 CSK vs 🔵 MI (IPL)
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

              {/* DIRECT TEAM NAMES SETUP - FRONT AND CENTER */}
              <div
                style={{
                  background: 'rgba(0, 230, 118, 0.05)',
                  border: '1px solid rgba(0, 230, 118, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Shield size={18} color="var(--pitch-green)" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--pitch-green)' }}>
                    TEAMS CONFIGURATION
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Team A */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--pitch-green)', marginBottom: '8px' }}>
                      TEAM A
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Team Name</label>
                      <input
                        type="text"
                        value={teamAName}
                        onChange={(e) => handleTeamANameChange(e.target.value)}
                        placeholder="e.g. India"
                        style={{ width: '100%', fontWeight: 700, fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Short Code</label>
                      <input
                        type="text"
                        value={teamAShort}
                        onChange={(e) => setTeamAShort(e.target.value.toUpperCase())}
                        placeholder="e.g. IND"
                        maxLength={5}
                        style={{ width: '100%', fontWeight: 700 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginTop: '10px', width: '100%', fontSize: '0.75rem', padding: '6px' }}
                      onClick={() => setStep(2)}
                    >
                      <Edit2 size={12} />
                      <span>Edit {teamAName} Players ({teamA.playingXI.length})</span>
                    </button>
                  </div>

                  {/* Team B */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sky-blue)', marginBottom: '8px' }}>
                      TEAM B
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Team Name</label>
                      <input
                        type="text"
                        value={teamBName}
                        onChange={(e) => handleTeamBNameChange(e.target.value)}
                        placeholder="e.g. Australia"
                        style={{ width: '100%', fontWeight: 700, fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Short Code</label>
                      <input
                        type="text"
                        value={teamBShort}
                        onChange={(e) => setTeamBShort(e.target.value.toUpperCase())}
                        placeholder="e.g. AUS"
                        maxLength={5}
                        style={{ width: '100%', fontWeight: 700 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginTop: '10px', width: '100%', fontSize: '0.75rem', padding: '6px' }}
                      onClick={() => setStep(3)}
                    >
                      <Edit2 size={12} />
                      <span>Edit {teamBName} Players ({teamB.playingXI.length})</span>
                    </button>
                  </div>
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

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {step > 1 ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  sounds.playTap();
                  setStep(1);
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Overview</span>
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {step === 1 ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  sounds.playTap();
                  setStep(2);
                }}
              >
                <span>Edit Squads & Players</span>
                <ArrowRight size={16} />
              </button>
            ) : null}

            <button type="button" className="btn-primary" onClick={handleFinishCreate}>
              <CheckCircle size={18} />
              <span>Create Match & Proceed to Toss</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
