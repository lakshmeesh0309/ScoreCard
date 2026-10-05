export type MatchFormat = 'T10' | 'T20' | 'ODI' | 'CUSTOM';

export type PlayerRole = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
export type BattingStyle = 'Right-hand bat' | 'Left-hand bat';
export type BowlingStyle =
  | 'Right-arm fast'
  | 'Right-arm medium'
  | 'Right-arm off spin'
  | 'Right-arm leg spin'
  | 'Left-arm fast'
  | 'Left-arm medium'
  | 'Left-arm orthodox spin'
  | 'Left-arm unorthodox spin'
  | 'None';

export interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  role: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isWicketkeeper?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color?: string;
  playingXI: Player[];
  substitutes: Player[];
}

export type TossDecision = 'bat' | 'bowl';

export interface TossDetails {
  winnerTeamId: string;
  decision: TossDecision;
  recordedAt: number;
  isLocked: boolean;
}

export type ExtraType = 'none' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'penalty';

export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'runOut'
  | 'stumped'
  | 'hitWicket'
  | 'retiredHurt'
  | 'retiredOut'
  | 'obstructingField'
  | 'timedOut';

export interface WicketEvent {
  type: WicketType;
  dismissedPlayerId: string;
  bowlerPlayerId?: string; // empty for run-out, retired, timed out
  fielderPlayerId?: string; // for catch, run-out, stumped
  secondFielderPlayerId?: string; // for assisted run-outs
  description: string;
  isBowlerCredited: boolean;
}

export interface Delivery {
  id: string;
  inningsNumber: 1 | 2;
  overNumber: number; // 0-based over index (0 for 1st over)
  ballInOver: number; // 1-based index among deliveries in this over
  legalBallNumber: number; // 1 to 6 for legal deliveries
  displayBall: string; // e.g. "18.4"

  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;

  batterRuns: number; // runs scored off the bat (0-6)
  extraType: ExtraType;
  extraRuns: number; // extra runs credited to extras column
  totalRuns: number; // batterRuns + extraRuns
  isLegalDelivery: boolean; // false for wide, noBall

  wicket?: WicketEvent;
  nextBatterId?: string; // if a wicket fell, the selected next batter

  commentary: string;
  timestamp: number;
}

export interface BatterStats {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalText: string;
  dismissalType?: WicketType;
  bowlerId?: string;
  fielderId?: string;
  battingOrder: number;
}

export interface BowlerStats {
  playerId: string;
  playerName: string;
  legalBalls: number;
  oversFormatted: string; // e.g. "3.4"
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
  dots: number;
}

export interface Partnership {
  batter1Id: string;
  batter2Id: string;
  runs: number;
  balls: number;
  wicketNumber: number;
  isCurrent: boolean;
  startScore: number;
  endScore: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  runs: number;
  overs: string;
  playerDismissedId: string;
  playerDismissedName: string;
}

export interface ExtrasSummary {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

export type InningsStatus = 'not_started' | 'in_progress' | 'innings_break' | 'completed';

export interface InningsState {
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  status: InningsStatus;

  totalRuns: number;
  wickets: number;
  legalBalls: number;
  completedOvers: number;
  oversFormatted: string; // e.g. "18.4"
  currentRunRate: number;

  deliveries: Delivery[];

  strikerId: string | null;
  nonStrikerId: string | null;
  currentBowlerId: string | null;
  previousBowlerId: string | null;

  battingScorecard: BatterStats[];
  bowlingScorecard: BowlerStats[];
  partnerships: Partnership[];
  currentPartnership: Partnership | null;
  fallOfWickets: FallOfWicket[];
  extras: ExtrasSummary;

  last6Balls: Delivery[];
  currentOverDeliveries: Delivery[];
  didNotBatPlayerIds: string[];

  // Chase info (if 2nd innings)
  target?: number;
  runsNeeded?: number;
  ballsRemaining?: number;
  oversRemaining?: string;
  requiredRunRate?: number;
}

export type MatchStatus = 'setup' | 'toss' | 'innings1' | 'break' | 'innings2' | 'completed' | 'abandoned';

export interface MatchResult {
  winnerTeamId: string | null; // null for tie / no result
  winnerTeamName: string | null;
  marginText: string; // "India won by 24 runs" or "Australia won by 6 wickets (with 14 balls remaining)"
  isTie: boolean;
  playerOfTheMatchId?: string;
  playerOfTheMatchName?: string;
  completedAt?: number;
}

export interface Match {
  id: string;
  name: string;
  series: string;
  date: string;
  venue: string;
  format: MatchFormat;
  totalOvers: number;
  maxOversPerBowler: number;

  teamA: Team;
  teamB: Team;

  toss: TossDetails | null;
  status: MatchStatus;

  innings1: InningsState;
  innings2: InningsState;

  result: MatchResult | null;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerCareerStats {
  playerId: string;
  playerName: string;
  matches: number;
  innings: number;
  runs: number;
  highestScore: number;
  ballsFaced: number;
  average: number;
  strikeRate: number;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
  notOuts: number;

  // Bowling
  bowlingInnings: number;
  oversBowled: number;
  runsConceded: number;
  wickets: number;
  bowlingAverage: number;
  economy: number;
  bestBowlingRuns: number;
  bestBowlingWickets: number;
  threeWicketHauls: number;
  fiveWicketHauls: number;
}
