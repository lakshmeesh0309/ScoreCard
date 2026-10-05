import React, { useState } from 'react';
import {
  Match,
  InningsState,
  Team,
  Delivery,
  ExtraType,
  WicketType,
} from '../types/cricket';
import {
  generateCommentary,
  getPlayer,
} from '../engine/scoringEngine';
import {
  RotateCcw,
  Undo2,
  Edit,
  Shield,
  ArrowRightLeft,
  UserCheck,
  AlertCircle,
  Award,
} from 'lucide-react';
import { sounds } from '../engine/audioEffects';

interface ScorerDashboardProps {
  match: Match;
  onRecordDelivery: (delivery: Omit<Delivery, 'id' | 'timestamp'>) => void;
  onUndoLastBall: () => void;
  onOpenTossModal: () => void;
  onOpenBowlerModal: () => void;
  onOpenWicketModal: () => void;
  onOpenDeliveryEditModal: () => void;
  onSwapStrikeManually: () => void;
  onCommentaryClick: () => void;
  onOpenOpeningModal: () => void;
}

export const ScorerDashboard: React.FC<ScorerDashboardProps> = ({
  match,
  onRecordDelivery,
  onUndoLastBall,
  onOpenTossModal,
  onOpenBowlerModal,
  onOpenWicketModal,
  onOpenDeliveryEditModal,
  onSwapStrikeManually,
  onCommentaryClick,
  onOpenOpeningModal,
}) => {
  const is2nd = match.innings2.status !== 'not_started';
  const innings: InningsState = is2nd ? match.innings2 : match.innings1;
  const battingTeam: Team =
    match.teamA.id === innings.battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam: Team =
    match.teamA.id === innings.bowlingTeamId ? match.teamA : match.teamB;

  const striker = innings.battingScorecard.find(
    (b) => b.playerId === innings.strikerId
  );
  const nonStriker = innings.battingScorecard.find(
    (b) => b.playerId === innings.nonStrikerId
  );
  const bowler = innings.bowlingScorecard.find(
    (b) => b.playerId === innings.currentBowlerId
  );

  // Extras modal state for extra runs (e.g. Wide + 4 runs or No ball + 6)
  const [activeExtraType, setActiveExtraType] = useState<ExtraType | null>(null);
  const [extraAdditionalRuns, setExtraAdditionalRuns] = useState<number>(0);
  const [showExtrasDialog, setShowExtrasDialog] = useState<boolean>(false);

  // Quick delivery handlers
  const handleScoreRuns = (runs: number) => {
    if (!innings.strikerId || !innings.nonStrikerId || !innings.currentBowlerId) {
      alert('Please ensure Striker, Non-Striker, and Bowler are selected before scoring.');
      return;
    }

    if (runs === 4) sounds.playBoundaryFour();
    else if (runs === 6) sounds.playSixCelebration();
    else if (runs > 0) sounds.playBatHit(runs === 1 ? 'single' : 'single');
    else sounds.playBatHit('dot');

    const legalBallsInCurrentOver = innings.currentOverDeliveries.filter((d) => d.isLegalDelivery).length;
    const overNumber = Math.floor(innings.legalBalls / 6);
    const displayBall = `${overNumber}.${legalBallsInCurrentOver + 1}`;

    const comm = generateCommentary(
      { displayBall, batterRuns: runs, extraType: 'none', extraRuns: 0 },
      striker?.playerName || 'Striker',
      bowler?.playerName || 'Bowler'
    );

    onRecordDelivery({
      inningsNumber: innings.inningsNumber,
      overNumber,
      ballInOver: innings.currentOverDeliveries.length + 1,
      legalBallNumber: legalBallsInCurrentOver + 1,
      displayBall,
      strikerId: innings.strikerId,
      nonStrikerId: innings.nonStrikerId,
      bowlerId: innings.currentBowlerId,
      batterRuns: runs,
      extraType: 'none',
      extraRuns: 0,
      totalRuns: runs,
      isLegalDelivery: true,
      commentary: comm,
    });
  };

  const handleOpenExtraModal = (type: ExtraType) => {
    sounds.playTap();
    setActiveExtraType(type);
    setExtraAdditionalRuns(0);
    setShowExtrasDialog(true);
  };

  const handleConfirmExtra = () => {
    if (!activeExtraType || !innings.strikerId || !innings.nonStrikerId || !innings.currentBowlerId) return;

    sounds.playTap();
    const isLegal = activeExtraType !== 'wide' && activeExtraType !== 'noBall';
    const legalBallsInCurrentOver = innings.currentOverDeliveries.filter((d) => d.isLegalDelivery).length;
    const overNumber = Math.floor(innings.legalBalls / 6);
    const displayBall = `${overNumber}.${legalBallsInCurrentOver + (isLegal ? 1 : 0)}`;

    let batterRuns = 0;
    let extraRuns = 0;

    if (activeExtraType === 'wide') {
      // 1 base wide run + additional runs (e.g. overthrows or boundary)
      extraRuns = 1 + extraAdditionalRuns;
    } else if (activeExtraType === 'noBall') {
      extraRuns = 1;
      batterRuns = extraAdditionalRuns; // runs off the bat on no ball
    } else if (activeExtraType === 'bye' || activeExtraType === 'legBye') {
      extraRuns = extraAdditionalRuns > 0 ? extraAdditionalRuns : 1;
    } else if (activeExtraType === 'penalty') {
      extraRuns = 5;
    }

    const comm = generateCommentary(
      {
        displayBall,
        batterRuns,
        extraType: activeExtraType,
        extraRuns,
      },
      striker?.playerName || 'Striker',
      bowler?.playerName || 'Bowler'
    );

    onRecordDelivery({
      inningsNumber: innings.inningsNumber,
      overNumber,
      ballInOver: innings.currentOverDeliveries.length + 1,
      legalBallNumber: isLegal ? legalBallsInCurrentOver + 1 : legalBallsInCurrentOver,
      displayBall,
      strikerId: innings.strikerId,
      nonStrikerId: innings.nonStrikerId,
      bowlerId: innings.currentBowlerId,
      batterRuns,
      extraType: activeExtraType,
      extraRuns,
      totalRuns: batterRuns + extraRuns,
      isLegalDelivery: isLegal,
      commentary: comm,
    });

    setShowExtrasDialog(false);
    setActiveExtraType(null);
  };

  const toss = match.toss;
  const tossWinner =
    toss?.winnerTeamId === match.teamA.id ? match.teamA : match.teamB;

  return (
    <div>
      {/* Real-World Toss Status Banner */}
      {toss && (
        <div className="toss-banner">
          <div className="toss-info">
            <Award size={16} />
            <span>
              <strong>TOSS:</strong> {tossWinner.name} won the toss and elected to{' '}
              {toss.decision === 'bat' ? 'bat first' : 'bowl first'}.
            </span>
          </div>
          {innings.deliveries.length === 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary"
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                onClick={onOpenOpeningModal}
              >
                <UserCheck size={14} />
                <span>Choose / Change Openers</span>
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={onOpenTossModal}
              >
                Edit Toss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Scorer Layout */}
      <div className="dashboard-grid">
        {/* Left Column: Live Score, Active Players & Scoring Buttons */}
        <div>
          {/* 1. Main Scoreboard Hero */}
          <div className="scoreboard-hero">
            <div className="team-header-row">
              <div className="batting-team-title">
                <span>{battingTeam.name}</span>
                <span className="match-format-tag">{match.format}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Bowling: {bowlingTeam.name}
              </div>
            </div>

            <div className="score-display-row">
              <div className="score-big">
                {innings.totalRuns}
                <span style={{ color: 'var(--wicket-red)' }}>/{innings.wickets}</span>
              </div>
              <div className="score-overs">
                {innings.oversFormatted} <span style={{ fontSize: '1.1rem' }}>OVERS</span>
              </div>
            </div>

            {/* Run Rates & Chase Targets */}
            <div className="run-rates-bar">
              <div className="rate-item">
                <span>CRR:</span>
                <strong>{innings.currentRunRate}</strong>
              </div>

              {is2nd && innings.target && (
                <>
                  <div className="target-badge">TARGET: {innings.target}</div>
                  <div className="rate-item">
                    <span>Need:</span>
                    <strong>{innings.runsNeeded} runs</strong>
                    <span>({innings.ballsRemaining} balls)</span>
                  </div>
                  <div className="rate-item">
                    <span>RRR:</span>
                    <strong style={{ color: 'var(--gold-accent)' }}>
                      {innings.requiredRunRate}
                    </strong>
                  </div>
                </>
              )}

              {innings.currentPartnership && (
                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--pitch-green)' }}>
                  Partnership:{' '}
                  <strong>
                    {innings.currentPartnership.runs} ({innings.currentPartnership.balls}b)
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* 2. Active Batters & Bowler Card */}
          <div className="active-players-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                CURRENT BATTERS ({battingTeam.shortName})
              </span>
              {innings.deliveries.length === 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: 'var(--pitch-green)', color: 'var(--pitch-green)' }}
                  onClick={onOpenOpeningModal}
                >
                  <UserCheck size={13} />
                  <span>Choose Openers</span>
                </button>
              )}
            </div>

            <table className="batters-table">
              <thead>
                <tr>
                  <th>Batter</th>
                  <th style={{ textAlign: 'right' }}>R</th>
                  <th style={{ textAlign: 'right' }}>B</th>
                  <th style={{ textAlign: 'right' }}>4s</th>
                  <th style={{ textAlign: 'right' }}>6s</th>
                  <th style={{ textAlign: 'right' }}>SR</th>
                </tr>
              </thead>
              <tbody>
                {/* Striker */}
                <tr
                  style={{
                    background: 'rgba(0, 230, 118, 0.05)',
                    cursor: innings.deliveries.length === 0 ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (innings.deliveries.length === 0) onOpenOpeningModal();
                  }}
                  title={innings.deliveries.length === 0 ? 'Click to select / change striker' : undefined}
                >
                  <td>
                    <div className="batter-name-cell">
                      <span className="striker-indicator">🏏</span>
                      <span style={{ color: 'var(--pitch-green)', fontWeight: 700 }}>
                        {striker?.playerName || 'Select Striker'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Striker)</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-numbers)', fontSize: '1.1rem' }}>
                    {striker?.runs || 0}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {striker?.balls || 0}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {striker?.fours || 0}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {striker?.sixes || 0}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-numbers)', fontWeight: 600 }}>
                    {striker?.strikeRate?.toFixed(2) || '0.00'}
                  </td>
                </tr>

                {/* Non-Striker */}
                <tr
                  style={{
                    cursor: innings.deliveries.length === 0 ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (innings.deliveries.length === 0) onOpenOpeningModal();
                  }}
                  title={innings.deliveries.length === 0 ? 'Click to select / change non-striker' : undefined}
                >
                  <td>
                    <div className="batter-name-cell">
                      <span style={{ opacity: 0 }}>🏏</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {nonStriker?.playerName || 'Select Non-Striker'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Non-Striker)</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-numbers)' }}>
                    {nonStriker?.runs || 0}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {nonStriker?.balls || 0}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {nonStriker?.fours || 0}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {nonStriker?.sixes || 0}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-numbers)', fontWeight: 600 }}>
                    {nonStriker?.strikeRate?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Current Bowler Strip */}
            <div className="bowler-cell">
              <div className="bowler-name">
                <span style={{ color: 'var(--sky-blue)' }}>⚾ Bowler:</span>
                <span>{bowler?.playerName || 'No bowler selected'}</span>
                {!bowler && (
                  <button
                    className="btn-primary"
                    style={{ padding: '3px 10px', fontSize: '0.75rem', marginLeft: '8px' }}
                    onClick={onOpenBowlerModal}
                  >
                    Select Bowler
                  </button>
                )}
              </div>

              {bowler && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="bowler-stats-pill">
                    {bowler.oversFormatted} - {bowler.maidens} - {bowler.runsConceded} -{' '}
                    <strong style={{ color: bowler.wickets > 0 ? 'var(--wicket-red)' : 'inherit' }}>
                      {bowler.wickets}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Econ: {bowler.economy}
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    onClick={onOpenBowlerModal}
                    title="Change Bowler"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. SCORING CONTROLS (SPEED & ACCURACY FIRST) */}
          <div className="scoring-controls-card">
            {/* Quick Runs Grid */}
            <div className="runs-pad-grid">
              <button
                type="button"
                className="run-btn run-btn-dot"
                onClick={() => handleScoreRuns(0)}
                title="Dot Ball"
              >
                0
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DOT</span>
              </button>

              <button
                type="button"
                className="run-btn"
                onClick={() => handleScoreRuns(1)}
                title="Single"
              >
                1
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SINGLE</span>
              </button>

              <button
                type="button"
                className="run-btn"
                onClick={() => handleScoreRuns(2)}
                title="Two Runs"
              >
                2
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DOUBLE</span>
              </button>

              <button
                type="button"
                className="run-btn"
                onClick={() => handleScoreRuns(3)}
                title="Three Runs"
              >
                3
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRIPLE</span>
              </button>

              <button
                type="button"
                className="run-btn run-btn-boundary"
                onClick={() => handleScoreRuns(4)}
                title="Four Runs (Boundary)"
              >
                4
                <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>FOUR</span>
              </button>

              <button
                type="button"
                className="run-btn"
                onClick={() => handleScoreRuns(5)}
                title="Five Runs"
              >
                5
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FIVE</span>
              </button>

              <button
                type="button"
                className="run-btn run-btn-six"
                onClick={() => handleScoreRuns(6)}
                title="Six Runs (Maximum)"
              >
                6
                <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>SIX</span>
              </button>
            </div>

            {/* Extras & Wicket Bar */}
            <div className="secondary-controls-grid">
              <button
                type="button"
                className="extra-btn"
                onClick={() => handleOpenExtraModal('wide')}
              >
                WIDE
              </button>

              <button
                type="button"
                className="extra-btn"
                onClick={() => handleOpenExtraModal('noBall')}
              >
                NO BALL
              </button>

              <button
                type="button"
                className="extra-btn"
                onClick={() => handleOpenExtraModal('bye')}
              >
                BYE
              </button>

              <button
                type="button"
                className="extra-btn"
                onClick={() => handleOpenExtraModal('legBye')}
              >
                LEG BYE
              </button>

              <button
                type="button"
                className="wicket-btn"
                onClick={onOpenWicketModal}
              >
                OUT / WICKET
              </button>
            </div>

            {/* Quick Helper Tools */}
            <div className="quick-tools-bar">
              <div style={{ display: 'flex', gap: '8px' }}>
                {innings.deliveries.length === 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--pitch-green)', color: 'var(--pitch-green)' }}
                    onClick={onOpenOpeningModal}
                    title="Select Opening Batters and Bowler"
                  >
                    <UserCheck size={14} />
                    <span>Select Openers</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={onSwapStrikeManually}
                  title="Manually swap striker and non-striker ends"
                >
                  <ArrowRightLeft size={14} />
                  <span>Swap Strike</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={onOpenBowlerModal}
                  title="Change active bowler"
                >
                  <UserCheck size={14} />
                  <span>Next Bowler</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={onOpenDeliveryEditModal}
                  title="Inspect and edit deliveries"
                >
                  <Edit size={14} />
                  <span>Edit Deliveries</span>
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={onUndoLastBall}
                  disabled={innings.deliveries.length === 0}
                  title="Revert the last delivery"
                >
                  <Undo2 size={14} />
                  <span>Undo Last Ball</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Last Balls Ticker */}
          <div className="last-balls-ticker">
            <span className="ticker-label">Last Balls:</span>
            <div className="balls-strip">
              {innings.last6Balls.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Awaiting first delivery...
                </span>
              ) : (
                innings.last6Balls.map((d) => {
                  let circleClass = 'ball-runs';
                  let label: string | number = d.totalRuns;

                  if (d.wicket) {
                    circleClass = 'ball-wicket';
                    label = 'W';
                  } else if (d.extraType === 'wide') {
                    circleClass = 'ball-extra';
                    label = d.extraRuns > 1 ? `${d.extraRuns}Wd` : 'Wd';
                  } else if (d.extraType === 'noBall') {
                    circleClass = 'ball-extra';
                    label = 'Nb';
                  } else if (d.batterRuns === 4) {
                    circleClass = 'ball-four';
                    label = '4';
                  } else if (d.batterRuns === 6) {
                    circleClass = 'ball-six';
                    label = '6';
                  } else if (d.batterRuns === 0) {
                    circleClass = 'ball-dot';
                    label = '•';
                  }

                  return (
                    <div key={d.id} className={`ball-circle ${circleClass}`}>
                      {label}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Commentary & Match Overviews */}
        <div className="sidebar-column">
          {/* Over Summary Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-title">
              <span>This Over ({innings.currentOverDeliveries.length} balls)</span>
              <span style={{ color: 'var(--pitch-green)' }}>
                {innings.currentOverDeliveries.reduce((acc, d) => acc + d.totalRuns, 0)} Runs
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {innings.currentOverDeliveries.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: d.wicket
                      ? 'var(--wicket-red)'
                      : d.batterRuns === 4
                      ? 'var(--pitch-green)'
                      : d.batterRuns === 6
                      ? 'var(--boundary-six)'
                      : 'var(--bg-elevated)',
                    color: d.wicket || d.batterRuns === 6 ? '#fff' : d.batterRuns === 4 ? '#04240f' : 'inherit',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {d.wicket ? 'W' : d.extraType === 'wide' ? 'Wd' : d.extraType === 'noBall' ? 'Nb' : d.totalRuns}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Commentary Feed */}
          <div className="sidebar-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="sidebar-card-title">
              <span>Live Commentary</span>
              <button
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                onClick={onCommentaryClick}
              >
                View All
              </button>
            </div>
            <div className="commentary-feed" style={{ maxHeight: '350px' }}>
              {innings.deliveries.slice(-5).reverse().map((d) => (
                <div
                  key={d.id}
                  className={`commentary-item ${
                    d.wicket ? 'wicket' : d.batterRuns === 4 ? 'boundary-4' : d.batterRuns === 6 ? 'boundary-6' : ''
                  }`}
                >
                  <div style={{ fontWeight: 700, color: 'var(--pitch-green)', fontSize: '0.8rem' }}>
                    Ball {d.displayBall}
                  </div>
                  <div>{d.commentary}</div>
                </div>
              ))}
              {innings.deliveries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  Deliveries will appear here in real-time.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extras Modal (for Wides, No-balls, Byes with runs) */}
      {showExtrasDialog && activeExtraType && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Record {activeExtraType.toUpperCase()}
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {activeExtraType === 'wide'
                  ? 'Base 1 wide run is charged to bowler. Did the batsmen run or score additional boundary runs?'
                  : activeExtraType === 'noBall'
                  ? 'Base 1 no-ball run is charged. Enter any additional runs scored off the bat by the striker:'
                  : activeExtraType === 'bye' || activeExtraType === 'legBye'
                  ? 'Enter number of byes/leg byes run by the batsmen:'
                  : 'Penalty runs awarded to batting team:'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[0, 1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setExtraAdditionalRuns(r)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      border:
                        extraAdditionalRuns === r
                          ? '2px solid var(--pitch-green)'
                          : '1px solid var(--border-subtle)',
                      background:
                        extraAdditionalRuns === r
                          ? 'rgba(0, 230, 118, 0.15)'
                          : 'var(--bg-elevated)',
                    }}
                  >
                    +{r}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowExtrasDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmExtra}
              >
                Record {activeExtraType.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
