import React, { useState } from 'react';
import { Match, InningsState, Team, BatterStats, BowlerStats } from '../types/cricket';
import { getPlayer } from '../engine/scoringEngine';

interface ScorecardViewProps {
  match: Match;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({ match }) => {
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(
    match.innings2.status !== 'not_started' ? 2 : 1
  );

  const innings: InningsState = selectedInnings === 1 ? match.innings1 : match.innings2;
  const battingTeam: Team =
    match.teamA.id === innings.battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam: Team =
    match.teamA.id === innings.bowlingTeamId ? match.teamA : match.teamB;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Innings Selector Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn-secondary ${selectedInnings === 1 ? 'active' : ''}`}
          style={{
            borderColor: selectedInnings === 1 ? 'var(--pitch-green)' : 'var(--border-subtle)',
            background: selectedInnings === 1 ? 'rgba(0, 230, 118, 0.12)' : 'var(--bg-elevated)',
            color: selectedInnings === 1 ? 'var(--pitch-green)' : 'var(--text-primary)',
          }}
          onClick={() => setSelectedInnings(1)}
        >
          1st Innings: {match.teamA.id === match.innings1.battingTeamId ? match.teamA.name : match.teamB.name}{' '}
          ({match.innings1.totalRuns}/{match.innings1.wickets} in {match.innings1.oversFormatted} ov)
        </button>

        {match.innings2.status !== 'not_started' && (
          <button
            className={`btn-secondary ${selectedInnings === 2 ? 'active' : ''}`}
            style={{
              borderColor: selectedInnings === 2 ? 'var(--pitch-green)' : 'var(--border-subtle)',
              background: selectedInnings === 2 ? 'rgba(0, 230, 118, 0.12)' : 'var(--bg-elevated)',
              color: selectedInnings === 2 ? 'var(--pitch-green)' : 'var(--text-primary)',
            }}
            onClick={() => setSelectedInnings(2)}
          >
            2nd Innings: {match.teamA.id === match.innings2.battingTeamId ? match.teamA.name : match.teamB.name}{' '}
            ({match.innings2.totalRuns}/{match.innings2.wickets} in {match.innings2.oversFormatted} ov)
          </button>
        )}
      </div>

      {/* Main Scorecard Container */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Header Strip */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {battingTeam.name} Innings
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              vs {bowlingTeam.name} • {match.format} ({match.totalOvers} Overs)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: 'var(--font-numbers)',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {innings.totalRuns} / {innings.wickets}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ({innings.oversFormatted} Ov, CRR: {innings.currentRunRate})
            </div>
          </div>
        </div>

        {/* 1. Batting Scorecard Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="scorecard-table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Batter</th>
                <th style={{ minWidth: '180px' }}>Dismissal</th>
                <th style={{ textAlign: 'right' }}>R</th>
                <th style={{ textAlign: 'right' }}>B</th>
                <th style={{ textAlign: 'right' }}>4s</th>
                <th style={{ textAlign: 'right' }}>6s</th>
                <th style={{ textAlign: 'right' }}>SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.battingScorecard.map((b: BatterStats) => {
                const isCurrent =
                  innings.strikerId === b.playerId ||
                  innings.nonStrikerId === b.playerId;

                return (
                  <tr key={b.playerId}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ color: isCurrent ? 'var(--pitch-green)' : 'inherit' }}>
                        {b.playerName}
                      </span>
                      {b.playerId === innings.strikerId && (
                        <span style={{ color: 'var(--pitch-green)', marginLeft: '6px' }}>*</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {b.dismissalText}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'var(--font-numbers)',
                        fontSize: '1.05rem',
                      }}
                    >
                      {b.runs}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {b.balls}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {b.fours}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {b.sixes}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-numbers)',
                        fontWeight: 600,
                      }}
                    >
                      {b.strikeRate.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Extras Row */}
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ fontWeight: 700 }}>Extras</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  (w {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb{' '}
                  {innings.extras.legByes}, pen {innings.extras.penalty})
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 700,
                    fontFamily: 'var(--font-numbers)',
                  }}
                >
                  {innings.extras.total}
                </td>
                <td colSpan={4}></td>
              </tr>

              {/* Total Score Row */}
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', fontWeight: 800 }}>
                <td>TOTAL</td>
                <td style={{ color: 'var(--text-muted)' }}>
                  ({innings.wickets} wickets, {innings.oversFormatted} overs)
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontSize: '1.2rem',
                    fontFamily: 'var(--font-numbers)',
                    color: 'var(--pitch-green)',
                  }}
                >
                  {innings.totalRuns}
                </td>
                <td colSpan={4} style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                  RR: {innings.currentRunRate}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Did Not Bat */}
        {innings.didNotBatPlayerIds.length > 0 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <strong style={{ color: 'var(--text-secondary)' }}>Yet to Bat: </strong>
            {innings.didNotBatPlayerIds
              .map((id) => getPlayer(battingTeam, id)?.name || id)
              .join(', ')}
          </div>
        )}

        {/* 2. Bowling Scorecard Table */}
        <div style={{ marginTop: '20px', borderTop: '2px solid var(--border-subtle)' }}>
          <div
            style={{
              background: 'var(--bg-elevated)',
              padding: '12px 20px',
              fontWeight: 800,
              fontSize: '0.95rem',
            }}
          >
            BOWLING FIGURES
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="scorecard-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Bowler</th>
                  <th style={{ textAlign: 'right' }}>O</th>
                  <th style={{ textAlign: 'right' }}>M</th>
                  <th style={{ textAlign: 'right' }}>R</th>
                  <th style={{ textAlign: 'right' }}>W</th>
                  <th style={{ textAlign: 'right' }}>Econ</th>
                  <th style={{ textAlign: 'right' }}>Wd</th>
                  <th style={{ textAlign: 'right' }}>NB</th>
                  <th style={{ textAlign: 'right' }}>Dots</th>
                </tr>
              </thead>
              <tbody>
                {innings.bowlingScorecard.map((b: BowlerStats) => (
                  <tr key={b.playerId}>
                    <td style={{ fontWeight: 600 }}>{b.playerName}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-numbers)',
                        fontWeight: 700,
                      }}
                    >
                      {b.oversFormatted}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {b.maidens}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'var(--font-numbers)',
                      }}
                    >
                      {b.runsConceded}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        fontFamily: 'var(--font-numbers)',
                        color: b.wickets > 0 ? 'var(--wicket-red)' : 'inherit',
                      }}
                    >
                      {b.wickets}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-numbers)',
                      }}
                    >
                      {b.economy.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{b.wides}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{b.noBalls}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{b.dots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Fall of Wickets */}
        {innings.fallOfWickets.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}
            >
              Fall of Wickets
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {innings.fallOfWickets.map((fow) => (
                <div
                  key={fow.wicketNumber}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                  }}
                >
                  <strong style={{ color: 'var(--wicket-red)' }}>
                    {fow.runs}-{fow.wicketNumber}
                  </strong>{' '}
                  <span style={{ color: 'var(--text-primary)' }}>({fow.playerDismissedName}, </span>
                  <span style={{ color: 'var(--text-muted)' }}>{fow.overs} ov)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Partnerships */}
        {innings.partnerships.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}
            >
              Partnerships
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {innings.partnerships.map((p, idx) => {
                const b1 = getPlayer(battingTeam, p.batter1Id);
                const b2 = getPlayer(battingTeam, p.batter2Id);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-elevated)',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{b1?.name || 'Batter 1'}</span> &{' '}
                      <span style={{ fontWeight: 600 }}>{b2?.name || 'Batter 2'}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                        (Wkt {p.wicketNumber})
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-numbers)', fontWeight: 700 }}>
                      <span style={{ color: 'var(--pitch-green)', fontSize: '1rem' }}>
                        {p.runs} runs
                      </span>{' '}
                      <span style={{ color: 'var(--text-muted)' }}>({p.balls} balls)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
