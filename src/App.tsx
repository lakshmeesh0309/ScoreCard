import React, { useState, useEffect } from 'react';
import {
  Match,
  Delivery,
  TossDecision,
  PlayerCareerStats,
} from './types/cricket';
import { PRESET_TEAMS, cloneTeam } from './data/presetTeams';
import {
  calculateInningsState,
  determineMatchResult,
  generateCommentary,
} from './engine/scoringEngine';
import {
  saveMatch,
  getAllMatches,
  getActiveMatchId,
  setActiveMatchId,
  deleteMatch,
  exportMatchJSON,
  calculatePlayerCareerStats,
} from './utils/storage';
import { sounds } from './engine/audioEffects';

import { Header } from './components/Header';
import { ScorerDashboard } from './components/ScorerDashboard';
import { ScorecardView } from './components/ScorecardView';
import { CommentaryView } from './components/CommentaryView';
import { SpectatorView } from './components/SpectatorView';
import { MatchHistoryView } from './components/MatchHistoryView';
import { PlayerStatsView } from './components/PlayerStatsView';

import { MatchSetupModal } from './components/MatchSetupModal';
import { TossModal } from './components/TossModal';
import { OpeningPlayersModal } from './components/OpeningPlayersModal';
import { SelectBowlerModal } from './components/SelectBowlerModal';
import { WicketModal } from './components/WicketModal';
import { DeliveryEditModal } from './components/DeliveryEditModal';
import { InningsBreakModal } from './components/InningsBreakModal';
import { MatchSummaryModal } from './components/MatchSummaryModal';

export const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<
    'scoring' | 'scorecard' | 'commentary' | 'spectator' | 'history' | 'stats'
  >('scoring');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals visibility
  const [showMatchSetupModal, setShowMatchSetupModal] = useState<boolean>(false);
  const [showTossModal, setShowTossModal] = useState<boolean>(false);
  const [showOpeningModal, setShowOpeningModal] = useState<boolean>(false);
  const [showSelectBowlerModal, setShowSelectBowlerModal] = useState<boolean>(false);
  const [showWicketModal, setShowWicketModal] = useState<boolean>(false);
  const [showDeliveryEditModal, setShowDeliveryEditModal] = useState<boolean>(false);
  const [showInningsBreakModal, setShowInningsBreakModal] = useState<boolean>(false);
  const [showMatchSummaryModal, setShowMatchSummaryModal] = useState<boolean>(false);

  // Initial openers state holders per innings
  const [openingStriker1, setOpeningStriker1] = useState<string | null>(null);
  const [openingNonStriker1, setOpeningNonStriker1] = useState<string | null>(null);
  const [openingBowler1, setOpeningBowler1] = useState<string | null>(null);

  const [openingStriker2, setOpeningStriker2] = useState<string | null>(null);
  const [openingNonStriker2, setOpeningNonStriker2] = useState<string | null>(null);
  const [openingBowler2, setOpeningBowler2] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Load matches on mount
  useEffect(() => {
    const loadedMatches = getAllMatches();
    setMatches(loadedMatches);

    const activeId = getActiveMatchId();
    if (activeId) {
      const found = loadedMatches.find((m) => m.id === activeId);
      if (found) {
        setActiveMatch(found);
        return;
      }
    }

    if (loadedMatches.length > 0) {
      setActiveMatch(loadedMatches[0]);
    } else {
      // Create initial demo ready-to-score match: India vs Australia
      createDefaultInitialMatch();
    }
  }, []);

  const createDefaultInitialMatch = () => {
    const teamA = cloneTeam('team-ind', 'ind-initial');
    const teamB = cloneTeam('team-aus', 'aus-initial');

    const defaultMatch: Match = {
      id: `match-${Date.now()}`,
      name: 'India vs Australia - Super 8 Clash',
      series: 'ICC World Championship 2026',
      date: new Date().toISOString().split('T')[0],
      venue: 'Wankhede Stadium, Mumbai',
      format: 'T20',
      totalOvers: 20,
      maxOversPerBowler: 4,
      teamA,
      teamB,
      toss: {
        winnerTeamId: teamA.id,
        decision: 'bat',
        recordedAt: Date.now(),
        isLocked: false,
      },
      status: 'innings1',
      innings1: {
        inningsNumber: 1,
        battingTeamId: teamA.id,
        bowlingTeamId: teamB.id,
        status: 'in_progress',
        totalRuns: 0,
        wickets: 0,
        legalBalls: 0,
        completedOvers: 0,
        oversFormatted: '0.0',
        currentRunRate: 0,
        deliveries: [],
        strikerId: teamA.playingXI[0].id,
        nonStrikerId: teamA.playingXI[1].id,
        currentBowlerId: teamB.playingXI[teamB.playingXI.length - 2].id,
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
        battingTeamId: teamB.id,
        bowlingTeamId: teamA.id,
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

    // Calculate initial state
    defaultMatch.innings1 = calculateInningsState(
      defaultMatch,
      1,
      [],
      teamA.playingXI[0].id,
      teamA.playingXI[1].id,
      teamB.playingXI[teamB.playingXI.length - 2].id
    );

    saveMatch(defaultMatch);
    setMatches([defaultMatch]);
    setActiveMatch(defaultMatch);
    setOpeningStriker1(teamA.playingXI[0].id);
    setOpeningNonStriker1(teamA.playingXI[1].id);
    setOpeningBowler1(teamB.playingXI[teamB.playingXI.length - 2].id);
  };

  // Re-calculate state from deliveries
  const updateMatchWithDeliveries = (
    match: Match,
    inningsNumber: 1 | 2,
    deliveries: Delivery[]
  ) => {
    const isFirst = inningsNumber === 1;
    const initialStriker = isFirst ? openingStriker1 : openingStriker2;
    const initialNonStriker = isFirst ? openingNonStriker1 : openingNonStriker2;
    const initialBowler = isFirst ? openingBowler1 : openingBowler2;

    const newInningsState = calculateInningsState(
      match,
      inningsNumber,
      deliveries,
      initialStriker,
      initialNonStriker,
      initialBowler
    );

    const updatedMatch: Match = {
      ...match,
      [isFirst ? 'innings1' : 'innings2']: newInningsState,
      updatedAt: Date.now(),
    };

    // Check if over completed with the last delivery
    const lastDelivery = deliveries[deliveries.length - 1];
    if (
      lastDelivery &&
      lastDelivery.isLegalDelivery &&
      newInningsState.legalBalls > 0 &&
      newInningsState.legalBalls % 6 === 0
    ) {
      sounds.playOverComplete();
      showToast(`Over ${Math.floor(newInningsState.legalBalls / 6)} Completed!`);
      // If innings is still in progress, prompt for next bowler
      if (newInningsState.status === 'in_progress') {
        setShowSelectBowlerModal(true);
      }
    }

    // Check if 1st innings concluded
    if (isFirst && newInningsState.status === 'innings_break') {
      updatedMatch.status = 'break';
      setShowInningsBreakModal(true);
    }

    // Check if 2nd innings concluded
    if (!isFirst && newInningsState.status === 'completed') {
      updatedMatch.status = 'completed';
      const result = determineMatchResult(updatedMatch);
      updatedMatch.result = result;
      setShowMatchSummaryModal(true);
    }

    saveMatch(updatedMatch);
    setActiveMatch(updatedMatch);
    setMatches((prev) =>
      prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
    );
  };

  // Record a new ball
  const handleRecordDelivery = (deliveryData: Omit<Delivery, 'id' | 'timestamp'>) => {
    if (!activeMatch) return;
    const is2nd = activeMatch.innings2.status !== 'not_started';
    const inningsNum = is2nd ? 2 : 1;
    const currentDeliveries = is2nd
      ? activeMatch.innings2.deliveries
      : activeMatch.innings1.deliveries;

    const newDelivery: Delivery = {
      ...deliveryData,
      id: `ball-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
    };

    const newDeliveries = [...currentDeliveries, newDelivery];
    updateMatchWithDeliveries(activeMatch, inningsNum, newDeliveries);
  };

  // Undo Last Ball
  const handleUndoLastBall = () => {
    if (!activeMatch) return;
    const is2nd = activeMatch.innings2.status !== 'not_started';
    const inningsNum = is2nd ? 2 : 1;
    const currentDeliveries = is2nd
      ? activeMatch.innings2.deliveries
      : activeMatch.innings1.deliveries;

    if (currentDeliveries.length === 0) return;

    sounds.playTap();
    const updatedDeliveries = currentDeliveries.slice(0, -1);
    updateMatchWithDeliveries(activeMatch, inningsNum, updatedDeliveries);
    showToast('Last delivery undone.');
  };

  // Update a previous delivery
  const handleUpdateDelivery = (updatedDelivery: Delivery) => {
    if (!activeMatch) return;
    const inningsNum = updatedDelivery.inningsNumber;
    const currentDeliveries =
      inningsNum === 1
        ? activeMatch.innings1.deliveries
        : activeMatch.innings2.deliveries;

    const updated = currentDeliveries.map((d) =>
      d.id === updatedDelivery.id ? updatedDelivery : d
    );
    updateMatchWithDeliveries(activeMatch, inningsNum, updated);
    showToast(`Ball ${updatedDelivery.displayBall} updated.`);
  };

  // Delete an incorrect delivery
  const handleDeleteDelivery = (deliveryId: string) => {
    if (!activeMatch) return;
    const is2nd = activeMatch.innings2.status !== 'not_started';
    const inningsNum = is2nd ? 2 : 1;
    const currentDeliveries = is2nd
      ? activeMatch.innings2.deliveries
      : activeMatch.innings1.deliveries;

    const updated = currentDeliveries.filter((d) => d.id !== deliveryId);
    updateMatchWithDeliveries(activeMatch, inningsNum, updated);
    showToast('Delivery deleted. Statistics recalculated.');
  };

  // Manual strike swap
  const handleSwapStrikeManually = () => {
    if (!activeMatch) return;
    sounds.playTap();
    const is2nd = activeMatch.innings2.status !== 'not_started';
    const inningsKey = is2nd ? 'innings2' : 'innings1';
    const inn = activeMatch[inningsKey];

    const temp = inn.strikerId;
    inn.strikerId = inn.nonStrikerId;
    inn.nonStrikerId = temp;

    const updated = { ...activeMatch, updatedAt: Date.now() };
    saveMatch(updated);
    setActiveMatch(updated);
    showToast('Strike ends swapped.');
  };

  // Save real-world toss
  const handleSaveToss = (winnerTeamId: string, decision: TossDecision) => {
    if (!activeMatch) return;

    const winnerTeam =
      winnerTeamId === activeMatch.teamA.id ? activeMatch.teamA : activeMatch.teamB;
    const otherTeam =
      winnerTeamId === activeMatch.teamA.id ? activeMatch.teamB : activeMatch.teamA;

    const battingFirst = decision === 'bat' ? winnerTeam : otherTeam;
    const bowlingFirst = decision === 'bat' ? otherTeam : winnerTeam;

    const updatedMatch: Match = {
      ...activeMatch,
      toss: {
        winnerTeamId,
        decision,
        recordedAt: Date.now(),
        isLocked: false,
      },
      status: 'innings1',
      innings1: {
        ...activeMatch.innings1,
        battingTeamId: battingFirst.id,
        bowlingTeamId: bowlingFirst.id,
        strikerId: battingFirst.playingXI[0]?.id || null,
        nonStrikerId: battingFirst.playingXI[1]?.id || null,
        currentBowlerId: bowlingFirst.playingXI[bowlingFirst.playingXI.length - 2]?.id || null,
      },
      innings2: {
        ...activeMatch.innings2,
        battingTeamId: bowlingFirst.id,
        bowlingTeamId: battingFirst.id,
      },
    };

    saveMatch(updatedMatch);
    setActiveMatch(updatedMatch);
    showToast(`Toss recorded: ${winnerTeam.name} elected to ${decision}.`);
  };

  // Select Bowler for over
  const handleSelectBowler = (bowlerId: string) => {
    if (!activeMatch) return;
    const is2nd = activeMatch.innings2.status !== 'not_started';
    const inningsKey = is2nd ? 'innings2' : 'innings1';
    const inn = activeMatch[inningsKey];

    inn.currentBowlerId = bowlerId;
    const updated = { ...activeMatch, updatedAt: Date.now() };
    saveMatch(updated);
    setActiveMatch(updated);
    setShowSelectBowlerModal(false);
    showToast('New bowler selected.');
  };

  // Record wicket from modal
  const handleRecordWicket = (wicketData: {
    wicketType: import('./types/cricket').WicketType;
    dismissedBatterId: string;
    fielderId?: string;
    batterRuns: number;
    extraType: import('./types/cricket').ExtraType;
    extraRuns: number;
    nextBatterId: string | null;
  }) => {
    if (!activeMatch) return;
    const is2nd = activeMatch.innings2.status !== 'not_started';
    const inningsNum = is2nd ? 2 : 1;
    const inn = is2nd ? activeMatch.innings2 : activeMatch.innings1;

    const isLegal =
      wicketData.extraType !== 'wide' && wicketData.extraType !== 'noBall';
    const legalBallsInCurrentOver = inn.currentOverDeliveries.filter(
      (d) => d.isLegalDelivery
    ).length;
    const overNumber = Math.floor(inn.legalBalls / 6);
    const displayBall = `${overNumber}.${legalBallsInCurrentOver + (isLegal ? 1 : 0)}`;

    const striker = inn.battingScorecard.find((b) => b.playerId === inn.strikerId);
    const bowler = inn.bowlingScorecard.find((b) => b.playerId === inn.currentBowlerId);
    const bowlingTeam =
      activeMatch.teamA.id === inn.bowlingTeamId ? activeMatch.teamA : activeMatch.teamB;
    const fielder = wicketData.fielderId
      ? bowlingTeam.playingXI.find((p) => p.id === wicketData.fielderId)
      : undefined;

    const isBowlerCredited = [
      'bowled',
      'caught',
      'lbw',
      'stumped',
      'hitWicket',
    ].includes(wicketData.wicketType);

    const wicketEvent = {
      type: wicketData.wicketType,
      dismissedPlayerId: wicketData.dismissedBatterId,
      bowlerPlayerId: isBowlerCredited ? inn.currentBowlerId || undefined : undefined,
      fielderPlayerId: wicketData.fielderId,
      description: wicketData.wicketType,
      isBowlerCredited,
    };

    const comm = generateCommentary(
      {
        displayBall,
        batterRuns: wicketData.batterRuns,
        extraType: wicketData.extraType,
        extraRuns: wicketData.extraRuns,
        wicket: wicketEvent,
      },
      striker?.playerName || 'Striker',
      bowler?.playerName || 'Bowler',
      fielder?.name
    );

    const newDelivery: Delivery = {
      id: `ball-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inningsNumber: inningsNum,
      overNumber,
      ballInOver: inn.currentOverDeliveries.length + 1,
      legalBallNumber: isLegal ? legalBallsInCurrentOver + 1 : legalBallsInCurrentOver,
      displayBall,
      strikerId: inn.strikerId || '',
      nonStrikerId: inn.nonStrikerId || '',
      bowlerId: inn.currentBowlerId || '',
      batterRuns: wicketData.batterRuns,
      extraType: wicketData.extraType,
      extraRuns: wicketData.extraRuns,
      totalRuns: wicketData.batterRuns + wicketData.extraRuns,
      isLegalDelivery: isLegal,
      wicket: wicketEvent,
      nextBatterId: wicketData.nextBatterId || undefined,
      commentary: comm,
      timestamp: Date.now(),
    };

    const newDeliveries = [...inn.deliveries, newDelivery];
    updateMatchWithDeliveries(activeMatch, inningsNum, newDeliveries);
    setShowWicketModal(false);
  };

  // Start 2nd innings
  const handleStartSecondInnings = () => {
    if (!activeMatch) return;
    sounds.playTap();
    setShowInningsBreakModal(false);

    // Prompt for 2nd innings opening players
    setShowOpeningModal(true);
  };

  // Confirm openers from OpeningPlayersModal
  const handleConfirmOpeners = (
    strikerId: string,
    nonStrikerId: string,
    bowlerId: string
  ) => {
    if (!activeMatch) return;
    const is2nd = activeMatch.innings1.status === 'innings_break' || activeMatch.innings2.status !== 'not_started';
    const inningsNum = is2nd ? 2 : 1;

    if (is2nd) {
      setOpeningStriker2(strikerId);
      setOpeningNonStriker2(nonStrikerId);
      setOpeningBowler2(bowlerId);

      const calculatedInnings2 = calculateInningsState(
        activeMatch,
        2,
        [],
        strikerId,
        nonStrikerId,
        bowlerId
      );
      calculatedInnings2.status = 'in_progress';

      const updated: Match = {
        ...activeMatch,
        status: 'innings2',
        innings2: calculatedInnings2,
      };

      saveMatch(updated);
      setActiveMatch(updated);
    } else {
      setOpeningStriker1(strikerId);
      setOpeningNonStriker1(nonStrikerId);
      setOpeningBowler1(bowlerId);

      const calculatedInnings1 = calculateInningsState(
        activeMatch,
        1,
        [],
        strikerId,
        nonStrikerId,
        bowlerId
      );
      calculatedInnings1.status = 'in_progress';

      const updated: Match = {
        ...activeMatch,
        status: 'innings1',
        innings1: calculatedInnings1,
      };

      saveMatch(updated);
      setActiveMatch(updated);
    }

    setShowOpeningModal(false);
    showToast('Innings opened! Ready for ball 1.');
  };

  // Set Player of the match
  const handleSetPlayerOfTheMatch = (playerId: string, playerName: string) => {
    if (!activeMatch || !activeMatch.result) return;
    sounds.playTap();
    const updated = {
      ...activeMatch,
      result: {
        ...activeMatch.result,
        playerOfTheMatchId: playerId,
        playerOfTheMatchName: playerName,
      },
    };
    saveMatch(updated);
    setActiveMatch(updated);
    showToast(`Player of the Match: ${playerName}`);
  };

  // Career stats
  const careerStats: PlayerCareerStats[] = calculatePlayerCareerStats(matches);

  const isFirstBallDelivered =
    activeMatch ? activeMatch.innings1.deliveries.length > 0 : false;

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Header
        match={activeMatch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onNewMatch={() => {
          sounds.playTap();
          setShowMatchSetupModal(true);
        }}
        onExportMatch={() => {
          if (activeMatch) {
            sounds.playTap();
            exportMatchJSON(activeMatch);
            showToast('Match JSON exported.');
          }
        }}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activeTab === 'scoring' && activeMatch && (
          <ScorerDashboard
            match={activeMatch}
            onRecordDelivery={handleRecordDelivery}
            onUndoLastBall={handleUndoLastBall}
            onOpenTossModal={() => setShowTossModal(true)}
            onOpenBowlerModal={() => setShowSelectBowlerModal(true)}
            onOpenWicketModal={() => setShowWicketModal(true)}
            onOpenDeliveryEditModal={() => setShowDeliveryEditModal(true)}
            onSwapStrikeManually={handleSwapStrikeManually}
            onCommentaryClick={() => setActiveTab('commentary')}
          />
        )}

        {activeTab === 'scorecard' && activeMatch && (
          <ScorecardView match={activeMatch} />
        )}

        {activeTab === 'commentary' && activeMatch && (
          <CommentaryView
            match={activeMatch}
            onUpdateCommentary={(id, text) => {
              const inn = activeMatch.innings2.deliveries.some((d) => d.id === id)
                ? 2
                : 1;
              const targetInn = inn === 1 ? activeMatch.innings1 : activeMatch.innings2;
              const delivery = targetInn.deliveries.find((d) => d.id === id);
              if (delivery) {
                handleUpdateDelivery({ ...delivery, commentary: text });
              }
            }}
          />
        )}

        {activeTab === 'spectator' && activeMatch && (
          <SpectatorView
            match={activeMatch}
            onExitSpectator={() => setActiveTab('scoring')}
          />
        )}

        {activeTab === 'history' && (
          <MatchHistoryView
            matches={matches}
            activeMatchId={activeMatch?.id || null}
            onSelectMatch={(m) => {
              setActiveMatch(m);
              setActiveMatchId(m.id);
              setActiveTab('scoring');
            }}
            onDeleteMatch={(id) => {
              deleteMatch(id);
              const updated = matches.filter((m) => m.id !== id);
              setMatches(updated);
              if (activeMatch?.id === id) {
                setActiveMatch(updated[0] || null);
              }
              showToast('Match deleted.');
            }}
            onNewMatch={() => setShowMatchSetupModal(true)}
          />
        )}

        {activeTab === 'stats' && <PlayerStatsView stats={careerStats} />}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner">
          <span>🏏</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {showMatchSetupModal && (
        <MatchSetupModal
          isOpen={showMatchSetupModal}
          onClose={() => setShowMatchSetupModal(false)}
          onCreateMatch={(newMatch) => {
            saveMatch(newMatch);
            setMatches((prev) => [newMatch, ...prev]);
            setActiveMatch(newMatch);
            setActiveMatchId(newMatch.id);
            setShowMatchSetupModal(false);
            setShowTossModal(true);
            showToast('Match created! Please record real-world toss.');
          }}
        />
      )}

      {showTossModal && activeMatch && (
        <TossModal
          match={activeMatch}
          isOpen={showTossModal}
          onClose={() => setShowTossModal(false)}
          onSaveToss={handleSaveToss}
          isFirstBallDelivered={isFirstBallDelivered}
        />
      )}

      {showOpeningModal && activeMatch && (
        <OpeningPlayersModal
          match={activeMatch}
          inningsNumber={activeMatch.innings1.status === 'innings_break' || activeMatch.innings2.status !== 'not_started' ? 2 : 1}
          isOpen={showOpeningModal}
          onConfirm={handleConfirmOpeners}
        />
      )}

      {showSelectBowlerModal && activeMatch && (
        <SelectBowlerModal
          match={activeMatch}
          inningsNumber={activeMatch.innings2.status !== 'not_started' ? 2 : 1}
          isOpen={showSelectBowlerModal}
          onClose={() => setShowSelectBowlerModal(false)}
          onSelectBowler={handleSelectBowler}
        />
      )}

      {showWicketModal && activeMatch && (
        <WicketModal
          match={activeMatch}
          inningsNumber={activeMatch.innings2.status !== 'not_started' ? 2 : 1}
          isOpen={showWicketModal}
          onClose={() => setShowWicketModal(false)}
          onRecordWicket={handleRecordWicket}
        />
      )}

      {showDeliveryEditModal && activeMatch && (
        <DeliveryEditModal
          match={activeMatch}
          inningsNumber={activeMatch.innings2.status !== 'not_started' ? 2 : 1}
          isOpen={showDeliveryEditModal}
          onClose={() => setShowDeliveryEditModal(false)}
          onUpdateDelivery={handleUpdateDelivery}
          onDeleteDelivery={handleDeleteDelivery}
          onUndoLastBall={handleUndoLastBall}
        />
      )}

      {showInningsBreakModal && activeMatch && (
        <InningsBreakModal
          match={activeMatch}
          isOpen={showInningsBreakModal}
          onStartSecondInnings={handleStartSecondInnings}
        />
      )}

      {showMatchSummaryModal && activeMatch && (
        <MatchSummaryModal
          match={activeMatch}
          isOpen={showMatchSummaryModal}
          onClose={() => setShowMatchSummaryModal(false)}
          onSetPlayerOfTheMatch={handleSetPlayerOfTheMatch}
          onViewScorecard={() => setActiveTab('scorecard')}
          onExportJSON={() => exportMatchJSON(activeMatch)}
          onNewMatch={() => setShowMatchSetupModal(true)}
        />
      )}
    </div>
  );
};

export default App;
