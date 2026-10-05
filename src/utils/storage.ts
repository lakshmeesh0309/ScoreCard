import { Match, PlayerCareerStats } from '../types/cricket';

const STORAGE_KEY_MATCHES = 'cricket_scorecard_matches_v1';
const STORAGE_KEY_ACTIVE_MATCH_ID = 'cricket_scorecard_active_match_id';

export function getAllMatches(): Match[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MATCHES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load matches from localStorage', err);
    return [];
  }
}

export function saveMatch(match: Match): void {
  try {
    const matches = getAllMatches();
    const existingIndex = matches.findIndex((m) => m.id === match.id);
    const updated = { ...match, updatedAt: Date.now() };

    if (existingIndex >= 0) {
      matches[existingIndex] = updated;
    } else {
      matches.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
    localStorage.setItem(STORAGE_KEY_ACTIVE_MATCH_ID, match.id);
  } catch (err) {
    console.error('Failed to save match to localStorage', err);
  }
}

export function getActiveMatchId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_MATCH_ID);
}

export function setActiveMatchId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_MATCH_ID, id);
}

export function deleteMatch(id: string): void {
  try {
    const matches = getAllMatches().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
    if (getActiveMatchId() === id) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_MATCH_ID);
    }
  } catch (err) {
    console.error('Failed to delete match', err);
  }
}

export function exportMatchJSON(match: Match): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(match, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${match.name.replace(/\s+/g, '_')}_scorecard.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Aggregates career statistics across all saved matches
 */
export function calculatePlayerCareerStats(matches: Match[]): PlayerCareerStats[] {
  const statsMap = new Map<string, PlayerCareerStats>();

  const getOrCreate = (playerId: string, playerName: string): PlayerCareerStats => {
    if (!statsMap.has(playerId)) {
      statsMap.set(playerId, {
        playerId,
        playerName,
        matches: 0,
        innings: 0,
        runs: 0,
        highestScore: 0,
        ballsFaced: 0,
        average: 0,
        strikeRate: 0,
        fifties: 0,
        hundreds: 0,
        fours: 0,
        sixes: 0,
        notOuts: 0,
        bowlingInnings: 0,
        oversBowled: 0,
        runsConceded: 0,
        wickets: 0,
        bowlingAverage: 0,
        economy: 0,
        bestBowlingRuns: 0,
        bestBowlingWickets: 0,
        threeWicketHauls: 0,
        fiveWicketHauls: 0,
      });
    }
    return statsMap.get(playerId)!;
  };

  matches.forEach((match) => {
    const playerSeenInMatch = new Set<string>();

    [match.innings1, match.innings2].forEach((innings) => {
      // Batting
      innings.battingScorecard.forEach((b) => {
        const p = getOrCreate(b.playerId, b.playerName);
        if (!playerSeenInMatch.has(b.playerId)) {
          p.matches += 1;
          playerSeenInMatch.add(b.playerId);
        }

        p.innings += 1;
        p.runs += b.runs;
        p.ballsFaced += b.balls;
        p.fours += b.fours;
        p.sixes += b.sixes;
        if (!b.isOut) p.notOuts += 1;
        if (b.runs > p.highestScore) p.highestScore = b.runs;
        if (b.runs >= 100) p.hundreds += 1;
        else if (b.runs >= 50) p.fifties += 1;
      });

      // Bowling
      innings.bowlingScorecard.forEach((bowler) => {
        const p = getOrCreate(bowler.playerId, bowler.playerName);
        if (!playerSeenInMatch.has(bowler.playerId)) {
          p.matches += 1;
          playerSeenInMatch.add(bowler.playerId);
        }

        if (bowler.legalBalls > 0) {
          p.bowlingInnings += 1;
          const overs = bowler.legalBalls / 6;
          p.oversBowled = Number((p.oversBowled + overs).toFixed(1));
          p.runsConceded += bowler.runsConceded;
          p.wickets += bowler.wickets;

          if (bowler.wickets >= 5) p.fiveWicketHauls += 1;
          else if (bowler.wickets >= 3) p.threeWicketHauls += 1;

          // Best bowling
          if (
            bowler.wickets > p.bestBowlingWickets ||
            (bowler.wickets === p.bestBowlingWickets &&
              (p.bestBowlingRuns === 0 || bowler.runsConceded < p.bestBowlingRuns))
          ) {
            p.bestBowlingWickets = bowler.wickets;
            p.bestBowlingRuns = bowler.runsConceded;
          }
        }
      });
    });
  });

  // Calculate final averages & rates
  statsMap.forEach((p) => {
    const dismissals = p.innings - p.notOuts;
    p.average = dismissals > 0 ? Number((p.runs / dismissals).toFixed(2)) : p.runs;
    p.strikeRate =
      p.ballsFaced > 0 ? Number(((p.runs / p.ballsFaced) * 100).toFixed(2)) : 0;

    p.economy =
      p.oversBowled > 0 ? Number((p.runsConceded / p.oversBowled).toFixed(2)) : 0;
    p.bowlingAverage =
      p.wickets > 0 ? Number((p.runsConceded / p.wickets).toFixed(2)) : 0;
  });

  return Array.from(statsMap.values()).sort((a, b) => b.runs - a.runs);
}
