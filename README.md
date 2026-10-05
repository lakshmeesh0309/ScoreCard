# 🏏 PitchMaster — Professional Cricket Scorecard & Live Match Scoring System

A production-quality, event-driven **Cricket Scorecard and Live Match Scoring System** built for fast, simple, accurate, and reliable scoring during real-world matches.

---

## 🌟 Key Features

### 1. Match Creation & Setup Wizard
- **Formats Supported**: T10 (10 ov, max 2 ov/bowler), T20 (20 ov, max 4 ov/bowler), ODI (50 ov, max 10 ov/bowler), and Custom Overs.
- **Team Management**: Configure Team Name, Short Name, Playing XI (strictly validated to 11 players), and Substitutes/Bench.
- **Player Details**: Name, Jersey Number, Role (Batter, Bowler, All-rounder, Wicketkeeper), Batting Style (RHB/LHB), Bowling Style, Captain (C), Vice-Captain (VC), and Wicketkeeper (WK).
- **One-Click Popular Match Presets**: Includes pre-configured squads (India vs Australia, CSK vs MI, England vs India) with full 15-player squads for instant scoring.

### 2. Physical Ground Toss Recording
- **Strict Ground Rule**: **Zero virtual coin flips, zero randomizers**. The real-world physical toss is recorded by the scorer.
- **Inputs**: Toss Winner (Team A or Team B) and Decision (Bat first or Bowl first).
- **Automatic Derivation**: Automatically sets 1st innings batting & bowling teams and displays official notice.
- **Safety Lock**: Editable prior to delivery 1; locked once bowling starts, with an administrative override button.

### 3. Pure Event-Driven Scoring Engine
Rather than mutating a scalar score, every ball is stored as an immutable delivery event:
- **Legal Delivery Accounting**: Wides and no-balls do **not** increment the legal ball count for the over.
- **Accurate Crediting Rules**:
  - Normal runs & boundaries: credited to batter, team, and charged to bowler.
  - Wide: extra credited to team and charged to bowler; **not** counted as ball faced for batter.
  - No Ball: extra charged to bowler; runs scored off the bat credited to batter; ball **is** counted as ball faced.
  - Byes & Leg Byes: credited to team extras, **not** charged to bowler figures; counted as balls faced.
- **Strike Rotation**:
  - Automatically rotates on odd runs (1, 3, 5).
  - Automatically swaps strike at the completion of 6 legal deliveries.
  - Supports manual strike swap override with a single tap.

### 4. High-Speed Scorer Dashboard
- **Tactile Fast Scoring Controls**:
  - Large Runs Pad: `[0 (DOT)]`, `[1]`, `[2]`, `[3]`, `[4 (FOUR)]`, `[5]`, `[6 (SIX)]`
  - Extras: `[WIDE]`, `[NO BALL]`, `[BYE]`, `[LEG BYE]`
  - Dismissals: `[OUT / WICKET]`
- **Live Match HUD**:
  - Batting team total: e.g. `178/5`, `18.4 OVERS`, Current Run Rate (CRR).
  - Chasing HUD: Target, Runs Required, Balls Remaining, and Required Run Rate (RRR).
  - Active Batsmen table with live strike indicator (`🏏`), runs, balls, 4s, 6s, and strike rate.
  - Active Bowler figures: `O - M - R - W`, economy, and dot balls.
  - Current partnership counter.
  - **Last 6 Balls Ticker**: Color-coded delivery badges (Dots, Runs, Boundaries, Wickets, Extras).

### 5. Wicket & Next Batter System
- Supports all 10 dismissal types: **Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Retired Hurt, Retired Out, Obstructing the Field, Timed Out**.
- Automatic Bowler crediting (disabled for Run Out, Retired Hurt, Timed Out).
- Fielder selector from opposing XI (auto-assigns wicketkeeper for Stumpings).
- Immediate **Select Next Batter** prompt showing only eligible batters from the playing XI who have not yet batted.
- Fall of Wickets entry logged automatically.

### 6. Over Management & Bowler Restrictions
- Automatically ends over after 6 legal deliveries.
- Enforces bowling restrictions: prevents a bowler from bowling consecutive overs and enforces maximum quota limits per format (e.g. max 4 overs in T20).

### 7. Undo & Historical Delivery Correction
- **One-Click "Undo Last Ball"**: Reverts the last delivery and instantly recalculates the entire scorecard.
- **Delivery Inspector**: Edit runs, extras, or delete any past delivery in the innings with automatic recalculation of all derived statistics.

### 8. Full Batting & Bowling Scorecards
- Standard cricket notation (e.g. `3.4` overs means 3 completed overs + 4 legal balls, not 3.4 decimal).
- Complete Batting table: Batter, Dismissal, R, B, 4s, 6s, Strike Rate.
- Extras breakdown line: `(w, nb, b, lb, pen)`.
- Did Not Bat list.
- Fall of Wickets table.
- Partnerships list with run and ball contributions.
- Complete Bowling table: Bowler, O, M, R, W, Econ, Wd, NB, Dots.

### 9. Ball-by-Ball Live Commentary
- Context-aware auto-commentary generation for every ball.
- Filters: All Deliveries, Wickets, Boundaries (4s & 6s), Extras.
- Inline editable commentary text.

### 10. Spectator TV Scoreboard Mode
- Clean, full-screen stadium display tailored for TV, projectors, tablets, and fans.
- Striker highlighted with `🏏`, large typography, chasing targets, and zero scoring controls exposed.

### 11. Audio Effects Engine
- Built-in Web Audio API synthesis for bat hits, boundary chords, six celebrations, wicket rattles, and over chimes (with sound toggle).

### 12. Match History & Player Career Stats
- LocalStorage match persistence, JSON match export/download, and career batting & bowling aggregates across matches.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Vanilla CSS (Tailored dark sports stadium theme, responsive grid, glassmorphism)
- **Audio Engine**: Web Audio API (zero external sound files)
- **Build Tool**: Vite
- **Testing**: Node.js + tsx automated verification test suite

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/lakshmeesh0309/ScoreCard.git
cd ScoreCard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Run Production Build
```bash
npm run build
```

### Run Automated Scoring Engine Tests
```bash
npx tsx scripts/testScoringEngine.ts
```

---

## 📄 License
MIT License. Open source and free to use.
