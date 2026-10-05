import React from 'react';
import { Match, InningsState, Team } from '../types/cricket';
import { Maximize2, Minimize2, Radio, Trophy } from 'lucide-react';

interface SpectatorViewProps {
  match: Match;
  onExitSpectator: () => void;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({
  match,
  onExitSpectator,
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="spectator-container">
      {/* Top Bar */}
      <div className="spectator-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--pitch-green), #00b0ff)',
              color: '#05101e',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 900,
              letterSpacing: '0.05em',
            }}
          >
            LIVE
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{match.name}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {match.series} • {match.venue} • {match.format} ({match.totalOvers} Ov)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="icon-btn"
            style={{ width: '42px', height: '42px' }}
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            <Maximize2 size={20} />
          </button>
          <button
            className="btn-secondary"
            onClick={onExitSpectator}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Exit Spectator Mode
          </button>
        </div>
      </div>

      {/* Main Big Scoreboard Center */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 0',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: '10px',
          }}
        >
          {battingTeam.name}
        </div>

        <div className="spectator-score-huge">
          {innings.totalRuns}
          <span style={{ color: 'var(--wicket-red)' }}>/{innings.wickets}</span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-numbers)',
            fontSize: '2.4rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginTop: '8px',
          }}
        >
          {innings.oversFormatted} <span style={{ fontSize: '1.4rem' }}>OVERS</span>
        </div>

        {/* Chasing Stats (if 2nd innings) */}
        {is2nd && innings.target && (
          <div
            style={{
              background: 'rgba(41, 121, 255, 0.15)',
              border: '2px solid rgba(41, 121, 255, 0.4)',
              borderRadius: 'var(--radius-pill)',
              padding: '10px 28px',
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              fontSize: '1.2rem',
              fontWeight: 700,
            }}
          >
            <span style={{ color: 'var(--sky-blue)' }}>Target: {innings.target}</span>
            <span style={{ color: '#fff' }}>
              Need {innings.runsNeeded} runs from {innings.ballsRemaining} balls
            </span>
            <span style={{ color: 'var(--gold-accent)' }}>
              RRR: {innings.requiredRunRate}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '20px',
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            CRR: <strong style={{ color: '#fff' }}>{innings.currentRunRate}</strong>
          </span>
          {innings.currentPartnership && (
            <span>
              Partnership:{' '}
              <strong style={{ color: 'var(--pitch-green)' }}>
                {innings.currentPartnership.runs} ({innings.currentPartnership.balls}b)
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Bottom HUD: Batters, Bowler & Last 6 Balls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: '20px',
          background: 'rgba(16, 23, 38, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
        }}
      >
        {/* Batters Box */}
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            CURRENT BATSMEN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 230, 118, 0.1)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <span style={{ color: 'var(--pitch-green)' }}>🏏</span>
                <span>{striker?.playerName || 'Striker'}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-numbers)', fontWeight: 800, fontSize: '1.2rem' }}>
                {striker?.runs || 0}{' '}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({striker?.balls || 0}b • {striker?.fours || 0}x4 • {striker?.sixes || 0}x6)
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
              }}
            >
              <div style={{ fontWeight: 600 }}>{nonStriker?.playerName || 'Non-Striker'}</div>
              <div style={{ fontFamily: 'var(--font-numbers)', fontWeight: 700, fontSize: '1.1rem' }}>
                {nonStriker?.runs || 0}{' '}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({nonStriker?.balls || 0}b)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Bowler Box */}
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            BOWLER ({bowlingTeam.shortName})
          </div>
          <div
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              {bowler?.playerName || 'Bowler'}
            </div>
            {bowler ? (
              <div
                style={{
                  fontFamily: 'var(--font-numbers)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--sky-blue)',
                  marginTop: '4px',
                }}
              >
                {bowler.oversFormatted}-{bowler.maidens}-{bowler.runsConceded}-{bowler.wickets}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Economy: {bowler.economy}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selecting bowler...</div>
            )}
          </div>
        </div>

        {/* Last 6 Balls Box */}
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            RECENT DELIVERIES
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {innings.last6Balls.map((d) => {
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
                <div
                  key={d.id}
                  className={`ball-circle ${circleClass}`}
                  style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
