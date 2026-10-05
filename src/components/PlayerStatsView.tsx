import React, { useState } from 'react';
import { PlayerCareerStats } from '../types/cricket';
import { Search } from 'lucide-react';

interface PlayerStatsViewProps {
  stats: PlayerCareerStats[];
}

export const PlayerStatsView: React.FC<PlayerStatsViewProps> = ({ stats }) => {
  const [tab, setTab] = useState<'batting' | 'bowling'>('batting');
  const [search, setSearch] = useState('');

  const filteredStats = stats.filter((p) =>
    p.playerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Player Career Statistics</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Aggregated batting and bowling records across all recorded matches.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', width: '220px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-secondary ${tab === 'batting' ? 'active' : ''}`}
              style={{
                borderColor: tab === 'batting' ? 'var(--pitch-green)' : 'var(--border-subtle)',
                color: tab === 'batting' ? 'var(--pitch-green)' : 'inherit',
              }}
              onClick={() => setTab('batting')}
            >
              Batting
            </button>
            <button
              className={`btn-secondary ${tab === 'bowling' ? 'active' : ''}`}
              style={{
                borderColor: tab === 'bowling' ? 'var(--pitch-green)' : 'var(--border-subtle)',
                color: tab === 'bowling' ? 'var(--pitch-green)' : 'inherit',
              }}
              onClick={() => setTab('bowling')}
            >
              Bowling
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {filteredStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            No player stats found.
          </div>
        ) : tab === 'batting' ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="scorecard-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Player</th>
                  <th style={{ textAlign: 'right' }}>Mat</th>
                  <th style={{ textAlign: 'right' }}>Inn</th>
                  <th style={{ textAlign: 'right' }}>NO</th>
                  <th style={{ textAlign: 'right' }}>Runs</th>
                  <th style={{ textAlign: 'right' }}>HS</th>
                  <th style={{ textAlign: 'right' }}>Avg</th>
                  <th style={{ textAlign: 'right' }}>BF</th>
                  <th style={{ textAlign: 'right' }}>SR</th>
                  <th style={{ textAlign: 'right' }}>100s</th>
                  <th style={{ textAlign: 'right' }}>50s</th>
                  <th style={{ textAlign: 'right' }}>4s</th>
                  <th style={{ textAlign: 'right' }}>6s</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats
                  .sort((a, b) => b.runs - a.runs)
                  .map((p) => (
                    <tr key={p.playerId}>
                      <td style={{ fontWeight: 700 }}>{p.playerName}</td>
                      <td style={{ textAlign: 'right' }}>{p.matches}</td>
                      <td style={{ textAlign: 'right' }}>{p.innings}</td>
                      <td style={{ textAlign: 'right' }}>{p.notOuts}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-numbers)',
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: 'var(--pitch-green)',
                        }}
                      >
                        {p.runs}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.highestScore}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.average.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {p.ballsFaced}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {p.strikeRate.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.hundreds}</td>
                      <td style={{ textAlign: 'right' }}>{p.fifties}</td>
                      <td style={{ textAlign: 'right' }}>{p.fours}</td>
                      <td style={{ textAlign: 'right' }}>{p.sixes}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="scorecard-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Player</th>
                  <th style={{ textAlign: 'right' }}>Mat</th>
                  <th style={{ textAlign: 'right' }}>Inn</th>
                  <th style={{ textAlign: 'right' }}>Overs</th>
                  <th style={{ textAlign: 'right' }}>Runs</th>
                  <th style={{ textAlign: 'right' }}>Wkts</th>
                  <th style={{ textAlign: 'right' }}>BBI</th>
                  <th style={{ textAlign: 'right' }}>Avg</th>
                  <th style={{ textAlign: 'right' }}>Econ</th>
                  <th style={{ textAlign: 'right' }}>3w</th>
                  <th style={{ textAlign: 'right' }}>5w</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats
                  .filter((p) => p.oversBowled > 0)
                  .sort((a, b) => b.wickets - a.wickets)
                  .map((p) => (
                    <tr key={p.playerId}>
                      <td style={{ fontWeight: 700 }}>{p.playerName}</td>
                      <td style={{ textAlign: 'right' }}>{p.matches}</td>
                      <td style={{ textAlign: 'right' }}>{p.bowlingInnings}</td>
                      <td style={{ textAlign: 'right' }}>{p.oversBowled}</td>
                      <td style={{ textAlign: 'right' }}>{p.runsConceded}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-numbers)',
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: 'var(--sky-blue)',
                        }}
                      >
                        {p.wickets}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {p.bestBowlingWickets > 0
                          ? `${p.bestBowlingWickets}/${p.bestBowlingRuns}`
                          : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.bowlingAverage.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.economy.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{p.threeWicketHauls}</td>
                      <td style={{ textAlign: 'right' }}>{p.fiveWicketHauls}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
