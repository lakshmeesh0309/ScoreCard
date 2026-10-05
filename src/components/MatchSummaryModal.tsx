import React, { useEffect, useState } from 'react';
import { Match, Player, Team } from '../types/cricket';
import { Trophy, Award, CheckCircle, Share2, Download, RefreshCw, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../engine/audioEffects';

interface MatchSummaryModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSetPlayerOfTheMatch: (playerId: string, playerName: string) => void;
  onViewScorecard: () => void;
  onExportJSON: () => void;
  onNewMatch: () => void;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  match,
  isOpen,
  onClose,
  onSetPlayerOfTheMatch,
  onViewScorecard,
  onExportJSON,
  onNewMatch,
}) => {
  const result = match.result;

  // Determine top candidates for Player of the Match
  const allBatters = [
    ...match.innings1.battingScorecard,
    ...match.innings2.battingScorecard,
  ].sort((a, b) => b.runs - a.runs);

  const allBowlers = [
    ...match.innings1.bowlingScorecard,
    ...match.innings2.bowlingScorecard,
  ].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);

  const topScorer = allBatters[0];
  const bestBowler = allBowlers[0];

  // Auto pick candidate
  const defaultPotm =
    topScorer && topScorer.runs >= 50
      ? topScorer.playerId
      : bestBowler && bestBowler.wickets >= 3
      ? bestBowler.playerId
      : topScorer?.playerId || '';

  const [selectedPotmId, setSelectedPotmId] = useState<string>(
    match.result?.playerOfTheMatchId || defaultPotm
  );

  useEffect(() => {
    if (isOpen) {
      // Fire confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      sounds.playSixCelebration();
    }
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const team1: Team =
    match.teamA.id === match.innings1.battingTeamId ? match.teamA : match.teamB;
  const team2: Team =
    match.teamA.id === match.innings2.battingTeamId ? match.teamA : match.teamB;

  // Combine players list for POTM selection
  const allPlayers: Player[] = [
    ...match.teamA.playingXI,
    ...match.teamB.playingXI,
  ];

  const handleSavePotm = (id: string) => {
    setSelectedPotmId(id);
    const p = allPlayers.find((player) => player.id === id);
    if (p) {
      onSetPlayerOfTheMatch(p.id, p.name);
    }
  };

  // Find highest partnership across both innings
  const allPartnerships = [
    ...match.innings1.partnerships,
    ...match.innings2.partnerships,
  ].sort((a, b) => b.runs - a.runs);
  const highestPartnership = allPartnerships[0];

  // Total boundaries
  const total4s = allBatters.reduce((acc, b) => acc + b.fours, 0);
  const total6s = allBatters.reduce((acc, b) => acc + b.sixes, 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '720px' }}>
        <div
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, #10233b, #19385c)',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '30px 24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 214, 0, 0.2)',
              color: 'var(--gold-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              boxShadow: '0 0 24px rgba(255, 214, 0, 0.4)',
            }}
          >
            <Trophy size={36} />
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gold-accent)',
            }}
          >
            MATCH CONCLUDED
          </div>

          <h2
            style={{
              fontSize: '1.9rem',
              fontWeight: 900,
              color: '#ffffff',
              marginTop: '4px',
              lineHeight: 1.2,
            }}
          >
            {result.marginText}
          </h2>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {match.name} • {match.venue}
          </div>
        </div>

        <div className="modal-body">
          {/* Team Scores Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {team1.name} (1st Innings)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-numbers)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {match.innings1.totalRuns}/{match.innings1.wickets}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {match.innings1.oversFormatted} Overs (RR: {match.innings1.currentRunRate})
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {team2.name} (2nd Innings)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-numbers)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {match.innings2.totalRuns}/{match.innings2.wickets}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {match.innings2.oversFormatted} Overs (RR: {match.innings2.currentRunRate})
              </div>
            </div>
          </div>

          {/* Highlights Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            {topScorer && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  TOP RUN SCORER
                </div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{topScorer.playerName}</div>
                <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-numbers)', color: 'var(--pitch-green)', fontWeight: 700 }}>
                  {topScorer.runs} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({topScorer.balls})</span>
                </div>
              </div>
            )}

            {bestBowler && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  BEST BOWLER
                </div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{bestBowler.playerName}</div>
                <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-numbers)', color: 'var(--sky-blue)', fontWeight: 700 }}>
                  {bestBowler.wickets} / {bestBowler.runsConceded}
                </div>
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-card)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                MATCH BOUNDARIES
              </div>
              <div style={{ fontWeight: 700, marginTop: '4px' }}>
                {total4s + total6s} Boundaries
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {total4s} Fours • {total6s} Sixes
              </div>
            </div>
          </div>

          {/* Player of the Match Selection */}
          <div
            style={{
              background: 'rgba(255, 214, 0, 0.08)',
              border: '1px solid rgba(255, 214, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Award size={18} color="var(--gold-accent)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold-accent)' }}>
                PLAYER OF THE MATCH
              </span>
            </div>
            <select
              value={selectedPotmId}
              onChange={(e) => handleSavePotm(e.target.value)}
              style={{ width: '100%', borderColor: 'var(--gold-accent)' }}
            >
              {allPlayers.map((p) => {
                const b = allBatters.find((b) => b.playerId === p.id);
                const bowl = allBowlers.find((bowl) => bowl.playerId === p.id);
                let notes = '';
                if (b && b.runs > 0) notes += `${b.runs} runs (${b.balls}) `;
                if (bowl && bowl.wickets > 0) notes += `${bowl.wickets} wkts `;

                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {notes ? `[${notes.trim()}]` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div
          className="modal-footer"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onClose();
                onViewScorecard();
              }}
            >
              <Eye size={16} />
              <span>Full Scorecard</span>
            </button>
            <button type="button" className="btn-secondary" onClick={onExportJSON}>
              <Download size={16} />
              <span>Export JSON</span>
            </button>
          </div>

          <button type="button" className="btn-primary" onClick={onNewMatch}>
            <RefreshCw size={16} />
            <span>Start New Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
