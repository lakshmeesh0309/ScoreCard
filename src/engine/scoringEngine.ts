import {
  Match,
  InningsState,
  Delivery,
  BatterStats,
  BowlerStats,
  Partnership,
  FallOfWicket,
  ExtrasSummary,
  Team,
  Player,
  WicketEvent,
  MatchResult,
} from '../types/cricket';

export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function formatEconomy(runs: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((runs / overs).toFixed(2));
}

export function formatStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return Number(((runs / balls) * 100).toFixed(2));
}

export function getPlayer(team: Team, playerId: string): Player | undefined {
  return (
    team.playingXI.find((p) => p.id === playerId) ||
    team.substitutes.find((p) => p.id === playerId)
  );
}

export function getDismissalText(wicket: WicketEvent, bowlingTeam: Team): string {
  const bowler = wicket.bowlerPlayerId ? getPlayer(bowlingTeam, wicket.bowlerPlayerId) : null;
  const fielder = wicket.fielderPlayerId ? getPlayer(bowlingTeam, wicket.fielderPlayerId) : null;
  const bowlerName = bowler ? bowler.name : '';
  const fielderName = fielder ? fielder.name : '';

  switch (wicket.type) {
    case 'bowled':
      return `b ${bowlerName}`;
    case 'caught':
      return fielderName === bowlerName
        ? `c & b ${bowlerName}`
        : `c ${fielderName || 'Sub'} b ${bowlerName}`;
    case 'lbw':
      return `lbw b ${bowlerName}`;
    case 'runOut':
      return fielderName ? `run out (${fielderName})` : 'run out';
    case 'stumped':
      return `st ${fielderName || 'wk'} b ${bowlerName}`;
    case 'hitWicket':
      return `hit wicket b ${bowlerName}`;
    case 'retiredHurt':
      return 'retired hurt';
    case 'retiredOut':
      return 'retired out';
    case 'obstructingField':
      return 'obstructing the field';
    case 'timedOut':
      return 'timed out';
    default:
      return 'out';
  }
}

/**
 * Pure Event Engine: Reconstructs complete InningsState from an array of deliveries.
 */
export function calculateInningsState(
  match: Match,
  inningsNumber: 1 | 2,
  deliveries: Delivery[],
  initialStrikerId: string | null,
  initialNonStrikerId: string | null,
  initialBowlerId: string | null
): InningsState {
  const isFirstInnings = inningsNumber === 1;
  const battingTeamId = isFirstInnings
    ? match.innings1.battingTeamId
    : match.innings2.battingTeamId;
  const bowlingTeamId = isFirstInnings
    ? match.innings1.bowlingTeamId
    : match.innings2.bowlingTeamId;

  const battingTeam = match.teamA.id === battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam = match.teamA.id === bowlingTeamId ? match.teamA : match.teamB;

  // Initialize Batting Scorecard map
  const battingMap: Map<string, BatterStats> = new Map();
  let battingOrderCounter = 1;

  const getOrCreateBatterStats = (playerId: string): BatterStats => {
    if (!battingMap.has(playerId)) {
      const player = getPlayer(battingTeam, playerId);
      battingMap.set(playerId, {
        playerId,
        playerName: player ? player.name : 'Unknown',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        dismissalText: 'not out',
        battingOrder: battingOrderCounter++,
      });
    }
    return battingMap.get(playerId)!;
  };

  // Pre-seed initial openers if provided
  if (initialStrikerId) getOrCreateBatterStats(initialStrikerId);
  if (initialNonStrikerId) getOrCreateBatterStats(initialNonStrikerId);

  // Initialize Bowling Scorecard map
  const bowlingMap: Map<string, BowlerStats> = new Map();
  const getOrCreateBowlerStats = (playerId: string): BowlerStats => {
    if (!bowlingMap.has(playerId)) {
      const player = getPlayer(bowlingTeam, playerId);
      bowlingMap.set(playerId, {
        playerId,
        playerName: player ? player.name : 'Unknown',
        legalBalls: 0,
        oversFormatted: '0.0',
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
        wides: 0,
        noBalls: 0,
        dots: 0,
      });
    }
    return bowlingMap.get(playerId)!;
  };

  if (initialBowlerId) getOrCreateBowlerStats(initialBowlerId);

  // Totals
  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;

  const extras: ExtrasSummary = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalty: 0,
    total: 0,
  };

  const fallOfWickets: FallOfWicket[] = [];
  const partnerships: Partnership[] = [];

  // Track active striker and non-striker
  let strikerId: string | null = initialStrikerId;
  let nonStrikerId: string | null = initialNonStrikerId;
  let currentBowlerId: string | null = initialBowlerId;
  let previousBowlerId: string | null = null;

  // Active partnership tracker
  let currentPartnership: Partnership | null =
    strikerId && nonStrikerId
      ? {
          batter1Id: strikerId,
          batter2Id: nonStrikerId,
          runs: 0,
          balls: 0,
          wicketNumber: 1,
          isCurrent: true,
          startScore: 0,
          endScore: 0,
        }
      : null;

  // Over tracking for maiden over calculation
  // Map of overNumber -> { bowlerId, legalBalls, runsChargedToBowler }
  const overDataMap = new Map<
    number,
    { bowlerId: string; legalBalls: number; bowlerRuns: number }
  >();

  const target = !isFirstInnings ? match.innings1.totalRuns + 1 : undefined;

  // Process all deliveries chronologically
  for (let i = 0; i < deliveries.length; i++) {
    const d = deliveries[i];

    // Ensure players exist in maps
    const batter = getOrCreateBatterStats(d.strikerId);
    const bowler = getOrCreateBowlerStats(d.bowlerId);

    // Track active players
    strikerId = d.strikerId;
    nonStrikerId = d.nonStrikerId;
    currentBowlerId = d.bowlerId;

    // 1. Extra calculations
    let runsChargedToBowler = 0;
    if (d.extraType === 'wide') {
      extras.wides += d.extraRuns;
      bowler.wides += d.extraRuns;
      runsChargedToBowler += d.extraRuns;
      // Wides don't count towards balls faced for batter
    } else if (d.extraType === 'noBall') {
      extras.noBalls += d.extraRuns;
      bowler.noBalls += 1;
      runsChargedToBowler += d.extraRuns + d.batterRuns;
      // Batter faced the ball on a no-ball
      batter.balls += 1;
      batter.runs += d.batterRuns;
      if (d.batterRuns === 4) batter.fours += 1;
      if (d.batterRuns === 6) batter.sixes += 1;
    } else if (d.extraType === 'bye') {
      extras.byes += d.extraRuns;
      batter.balls += 1;
      // Bowler is NOT charged for byes
    } else if (d.extraType === 'legBye') {
      extras.legByes += d.extraRuns;
      batter.balls += 1;
      // Bowler is NOT charged for leg byes
    } else if (d.extraType === 'penalty') {
      extras.penalty += d.extraRuns;
      // Penalty runs not charged to bowler or balls faced
    } else {
      // Normal delivery
      batter.balls += 1;
      batter.runs += d.batterRuns;
      if (d.batterRuns === 4) batter.fours += 1;
      if (d.batterRuns === 6) batter.sixes += 1;
      runsChargedToBowler += d.batterRuns;
      if (d.batterRuns === 0 && !d.wicket) {
        bowler.dots += 1;
      }
    }

    // Update bowler runs
    bowler.runsConceded += runsChargedToBowler;

    // Team runs
    const deliveryTotalRuns = d.batterRuns + d.extraRuns;
    totalRuns += deliveryTotalRuns;
    extras.total =
      extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalty;

    // Legal ball
    if (d.isLegalDelivery) {
      legalBalls += 1;
      bowler.legalBalls += 1;
    }

    // Over data tracking for maidens
    const overIdx = d.overNumber;
    const existingOverData = overDataMap.get(overIdx) || {
      bowlerId: d.bowlerId,
      legalBalls: 0,
      bowlerRuns: 0,
    };
    if (d.isLegalDelivery) {
      existingOverData.legalBalls += 1;
    }
    existingOverData.bowlerRuns += runsChargedToBowler;
    overDataMap.set(overIdx, existingOverData);

    // Partnership update
    if (currentPartnership) {
      currentPartnership.runs += deliveryTotalRuns;
      if (d.isLegalDelivery || d.extraType === 'noBall') {
        currentPartnership.balls += 1;
      }
    }

    // Wicket handling
    if (d.wicket && d.wicket.dismissedPlayerId) {
      wickets += 1;
      const dismissedBatter = getOrCreateBatterStats(d.wicket.dismissedPlayerId);
      dismissedBatter.isOut = true;
      dismissedBatter.dismissalType = d.wicket.type;
      dismissedBatter.dismissalText = getDismissalText(d.wicket, bowlingTeam);
      dismissedBatter.bowlerId = d.wicket.bowlerPlayerId;
      dismissedBatter.fielderId = d.wicket.fielderPlayerId;

      if (d.wicket.isBowlerCredited) {
        bowler.wickets += 1;
      }

      // Record Fall of Wicket
      fallOfWickets.push({
        wicketNumber: wickets,
        runs: totalRuns,
        overs: formatOvers(legalBalls),
        playerDismissedId: dismissedBatter.playerId,
        playerDismissedName: dismissedBatter.playerName,
      });

      // Close current partnership
      if (currentPartnership) {
        currentPartnership.isCurrent = false;
        currentPartnership.endScore = totalRuns;
        partnerships.push({ ...currentPartnership });
      }

      // Setup next partnership and strike
      if (d.nextBatterId) {
        const nextBatter = getOrCreateBatterStats(d.nextBatterId);

        // Determine who remains
        const survivorId =
          d.wicket.dismissedPlayerId === strikerId ? nonStrikerId : strikerId;

        // If striker was dismissed:
        if (d.wicket.dismissedPlayerId === strikerId) {
          strikerId = nextBatter.playerId;
        } else {
          nonStrikerId = nextBatter.playerId;
        }

        // Handle strike rotation if odd runs scored before wicket (e.g., run out on second run)
        const runsToRotate = d.batterRuns + (d.extraType === 'bye' || d.extraType === 'legBye' ? d.extraRuns : 0);
        if (runsToRotate % 2 !== 0) {
          const temp = strikerId;
          strikerId = nonStrikerId;
          nonStrikerId = temp;
        }

        currentPartnership = {
          batter1Id: survivorId || nextBatter.playerId,
          batter2Id: nextBatter.playerId,
          runs: 0,
          balls: 0,
          wicketNumber: wickets + 1,
          isCurrent: true,
          startScore: totalRuns,
          endScore: 0,
        };
      } else {
        currentPartnership = null;
      }
    } else {
      // Normal run strike rotation
      const runsToRotate =
        d.batterRuns +
        (d.extraType === 'bye' || d.extraType === 'legBye' ? d.extraRuns : 0);

      if (runsToRotate % 2 !== 0) {
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
      }
    }

    // End of over check: after 6 legal deliveries in the over
    const currentOverLegal = existingOverData.legalBalls;
    if (d.isLegalDelivery && currentOverLegal === 6) {
      previousBowlerId = currentBowlerId;
      currentBowlerId = null; // Scorer needs to select bowler for next over

      // Swap strike at the end of the over
      const temp = strikerId;
      strikerId = nonStrikerId;
      nonStrikerId = temp;
    }
  }

  // Calculate maidens from completed overs
  overDataMap.forEach((overInfo) => {
    if (overInfo.legalBalls === 6 && overInfo.bowlerRuns === 0) {
      const b = bowlingMap.get(overInfo.bowlerId);
      if (b) {
        b.maidens += 1;
      }
    }
  });

  // Calculate strike rates for batters
  battingMap.forEach((b) => {
    b.strikeRate = formatStrikeRate(b.runs, b.balls);
  });

  // Calculate bowler overs and economy
  bowlingMap.forEach((b) => {
    b.oversFormatted = formatOvers(b.legalBalls);
    b.economy = formatEconomy(b.runsConceded, b.legalBalls);
  });

  // Batters yet to bat
  const battedPlayerIds = new Set(Array.from(battingMap.keys()));
  const didNotBatPlayerIds = battingTeam.playingXI
    .filter((p) => !battedPlayerIds.has(p.id))
    .map((p) => p.id);

  const completedOvers = Math.floor(legalBalls / 6);
  const oversFormatted = formatOvers(legalBalls);
  const currentRunRate = formatEconomy(totalRuns, legalBalls);

  // Check innings status
  const maxOvers = match.totalOvers;
  const isAllOut = wickets >= 10 || wickets >= battingTeam.playingXI.length - 1;
  const isOversCompleted = legalBalls >= maxOvers * 6;
  const isTargetReached = !isFirstInnings && target !== undefined && totalRuns >= target;

  let status: InningsState['status'] = 'in_progress';
  if (deliveries.length === 0 && !initialStrikerId) {
    status = 'not_started';
  } else if (isAllOut || isOversCompleted || isTargetReached) {
    status = isFirstInnings ? 'innings_break' : 'completed';
  }

  // Chase calculations
  let runsNeeded: number | undefined;
  let ballsRemaining: number | undefined;
  let oversRemaining: string | undefined;
  let requiredRunRate: number | undefined;

  if (!isFirstInnings && target !== undefined) {
    runsNeeded = Math.max(0, target - totalRuns);
    const totalMatchBalls = maxOvers * 6;
    ballsRemaining = Math.max(0, totalMatchBalls - legalBalls);
    oversRemaining = formatOvers(ballsRemaining);
    requiredRunRate = ballsRemaining > 0 ? Number(((runsNeeded / ballsRemaining) * 6).toFixed(2)) : 0;
  }

  const last6Balls = deliveries.slice(-6);

  // Extract current over deliveries
  const currentOverNumber = deliveries.length > 0 ? deliveries[deliveries.length - 1].overNumber : 0;
  // If the last ball finished an over, next deliveries belong to next over
  const lastDelivery = deliveries[deliveries.length - 1];
  const lastOverFinished =
    lastDelivery &&
    lastDelivery.isLegalDelivery &&
    overDataMap.get(lastDelivery.overNumber)?.legalBalls === 6;

  const activeOverIndex = lastOverFinished ? currentOverNumber + 1 : currentOverNumber;
  const currentOverDeliveries = deliveries.filter((d) => d.overNumber === activeOverIndex);

  return {
    inningsNumber,
    battingTeamId,
    bowlingTeamId,
    status,
    totalRuns,
    wickets,
    legalBalls,
    completedOvers,
    oversFormatted,
    currentRunRate,
    deliveries,
    strikerId,
    nonStrikerId,
    currentBowlerId,
    previousBowlerId,
    battingScorecard: Array.from(battingMap.values()).sort(
      (a, b) => a.battingOrder - b.battingOrder
    ),
    bowlingScorecard: Array.from(bowlingMap.values()),
    partnerships,
    currentPartnership,
    fallOfWickets,
    extras,
    last6Balls,
    currentOverDeliveries,
    didNotBatPlayerIds,
    target,
    runsNeeded,
    ballsRemaining,
    oversRemaining,
    requiredRunRate,
  };
}

/**
 * Determine match outcome from both innings
 */
export function determineMatchResult(match: Match): MatchResult | null {
  if (match.innings2.status !== 'completed') {
    return null;
  }

  const team1 =
    match.teamA.id === match.innings1.battingTeamId ? match.teamA : match.teamB;
  const team2 =
    match.teamA.id === match.innings2.battingTeamId ? match.teamA : match.teamB;

  const score1 = match.innings1.totalRuns;
  const score2 = match.innings2.totalRuns;
  const wickets2 = match.innings2.wickets;
  const maxWickets = team2.playingXI.length - 1;
  const wicketsRemaining = Math.max(0, 10 - wickets2);
  const ballsRemaining = match.innings2.ballsRemaining || 0;

  if (score2 > score1) {
    return {
      winnerTeamId: team2.id,
      winnerTeamName: team2.name,
      marginText: `${team2.name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}${
        ballsRemaining > 0 ? ` (with ${ballsRemaining} ball${ballsRemaining !== 1 ? 's' : ''} remaining)` : ''
      }`,
      isTie: false,
      completedAt: Date.now(),
    };
  } else if (score1 > score2) {
    const runDiff = score1 - score2;
    return {
      winnerTeamId: team1.id,
      winnerTeamName: team1.name,
      marginText: `${team1.name} won by ${runDiff} run${runDiff !== 1 ? 's' : ''}`,
      isTie: false,
      completedAt: Date.now(),
    };
  } else {
    return {
      winnerTeamId: null,
      winnerTeamName: null,
      marginText: 'Match Tied! (Super Over can be played)',
      isTie: true,
      completedAt: Date.now(),
    };
  }
}

/**
 * Auto-generate realistic and engaging cricket commentary
 */
export function generateCommentary(
  delivery: {
    displayBall: string;
    batterRuns: number;
    extraType: string;
    extraRuns: number;
    wicket?: WicketEvent;
  },
  strikerName: string,
  bowlerName: string,
  fielderName?: string
): string {
  const { displayBall, batterRuns, extraType, extraRuns, wicket } = delivery;

  if (wicket) {
    switch (wicket.type) {
      case 'bowled':
        return `${displayBall} ${bowlerName} to ${strikerName}, OUT! Bowled him! Cleaned up the stumps! What a beauty!`;
      case 'caught':
        return `${displayBall} ${bowlerName} to ${strikerName}, OUT! Caught! In the air and safely taken by ${fielderName || 'the fielder'}! Huge breakthrough!`;
      case 'lbw':
        return `${displayBall} ${bowlerName} to ${strikerName}, OUT! LBW! Trapped right in front of the middle stump! Umpire raises the finger!`;
      case 'runOut':
        return `${displayBall} ${bowlerName} to ${strikerName}, OUT! RUN OUT! Direct hit by ${fielderName || 'the fielder'}! Striker is well short of the crease!`;
      case 'stumped':
        return `${displayBall} ${bowlerName} to ${strikerName}, OUT! STUMPED! Dragged out of the crease and lightning hands from the wicketkeeper!`;
      case 'hitWicket':
        return `${displayBall} ${bowlerName} to ${strikerName}, OUT! Hit wicket! Accidentally dislodges the bails! Unfortunate dismissal!`;
      default:
        return `${displayBall} ${bowlerName} to ${strikerName}, OUT! ${wicket.type}!`;
    }
  }

  if (extraType === 'wide') {
    return extraRuns > 1
      ? `${displayBall} ${bowlerName} to ${strikerName}, WIDE + ${extraRuns - 1} runs! Strays well down the leg side and beats the keeper!`
      : `${displayBall} ${bowlerName} to ${strikerName}, WIDE ball! Slips beyond the tramline, signaled wide.`;
  }

  if (extraType === 'noBall') {
    if (batterRuns === 4) {
      return `${displayBall} ${bowlerName} to ${strikerName}, NO BALL & FOUR! Overstepped and crunched to the fence! Free hit coming up!`;
    }
    if (batterRuns === 6) {
      return `${displayBall} ${bowlerName} to ${strikerName}, NO BALL & SIX! High full toss sent into orbit! Maximum and free hit!`;
    }
    return `${displayBall} ${bowlerName} to ${strikerName}, NO BALL! Front foot over the crease! Free hit next ball.`;
  }

  if (extraType === 'bye') {
    return `${displayBall} ${bowlerName} to ${strikerName}, ${extraRuns} Bye${extraRuns > 1 ? 's' : ''}! Misses the bat, keeper fails to collect cleanly.`;
  }

  if (extraType === 'legBye') {
    return `${displayBall} ${bowlerName} to ${strikerName}, ${extraRuns} Leg Bye${extraRuns > 1 ? 's' : ''}! Thuds into the pad and deflects into the gap.`;
  }

  // Normal runs
  switch (batterRuns) {
    case 0:
      return `${displayBall} ${bowlerName} to ${strikerName}, no run. Good length ball, solidly defended back to the bowler.`;
    case 1:
      return `${displayBall} ${bowlerName} to ${strikerName}, 1 run. Tucked away into the gap on the on-side for a sharp single.`;
    case 2:
      return `${displayBall} ${bowlerName} to ${strikerName}, 2 runs. Pushed gently through deep mid-wicket, aggressive running gets a comfortable brace.`;
    case 3:
      return `${displayBall} ${bowlerName} to ${strikerName}, 3 runs. Driven past extra cover, great chase and save near the boundary rope!`;
    case 4:
      return `${displayBall} ${bowlerName} to ${strikerName}, FOUR! Glorious stroke! Leans into the drive and strokes it through cover for four!`;
    case 6:
      return `${displayBall} ${bowlerName} to ${strikerName}, SIX! MASSIVE HIT! Picks up the length in a flash and launches it high over long-on!`;
    default:
      return `${displayBall} ${bowlerName} to ${strikerName}, ${batterRuns} runs.`;
  }
}
