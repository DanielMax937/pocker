'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PokerTable from '../components/PokerTable';
import ActionControls from '../components/ActionControls';
import GameResult from '../components/GameResult';
import GameLog from '../components/GameLog';
import PlayerStatusBar from '../components/PlayerStatusBar';
import { PlayerInfo } from '../components/Player';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateDeck, dealCards, dealCommunityCards, evaluateHand, determineWinner, Card } from '../lib/poker';
import { createAIPersonality, AILevel } from '../lib/ai-player';
import Link from 'next/link';
import { makeAIDecision } from '../lib/ai-player-llm';
import ActionReplay from '../components/ActionReplay';
// Define PlayerState interface to match ai-player.ts
interface PlayerState {
  id: string;
  chips: number;
  cards: Card[];
  folded: boolean;
  totalBet: number;
}

// Game phases
const PHASES = ['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];

// Blinds structure
const BLINDS = { small: 10, big: 20 };

// Number of AI players
const NUM_AI_PLAYERS = 3;

// Starting chips
const STARTING_CHIPS = 1000;

// AI names
const AI_NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley'];

// Delay for AI actions (ms)
const AI_ACTION_DELAY = 1000;

interface LogEntry {
  playerId: string;
  playerName: string;
  action: string;
  amount?: number;
  timestamp: number;
}

interface PlayPageProps {
  searchParams: Promise<{
    gameId?: string;
    mode?: string;
  }>
}

export default function PokerGamePage({ searchParams }: PlayPageProps) {
  const { gameId, mode } = React.use(searchParams);
  const isReviewMode = mode === 'review';

  // User info
  const [userId] = useState('user-1');
  const [userName] = useState('You');

  // Game state
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState('');
  const [isGameActive, setIsGameActive] = useState(false);
  const [showdown, setShowdown] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<any>(null);
  const [playerContributions, setPlayerContributions] = useState<Record<string, number>>({});
  const [gameLogs, setGameLogs] = useState<LogEntry[]>([]);
  const [isLogVisible, setIsLogVisible] = useState(true);
  const [showActionReplay, setShowActionReplay] = useState(false);

  // Ref to track if an AI action is in progress to prevent multiple simultaneous AI actions
  const isAIActing = useRef(false);

  // Add gameId state
  const [gameIdState, setGameId] = useState<string | null>(null);

  // Load game history when in review mode
  useEffect(() => {
    if (isReviewMode && gameId) {
      const loadGameHistory = async () => {
        try {
          const response = await fetch(`/api/games/${gameId}?gameId=${gameId}`);
          if (!response.ok) throw new Error('Failed to fetch game');
          const gameData = await response.json();

          // Set game state from history
          setPlayers(gameData.players);
          setCommunityCards(gameData.communityCards || []);
          setPot(gameData.pot || 0);
          setCurrentBet(gameData.currentBet || 0);
          setGamePhase(gameData.phase || 'PREFLOP');
          setDealerIndex(gameData.dealerIndex || 0);
          setGameId(gameId);
          setIsGameActive(true);

          // Show action replay automatically
          setShowActionReplay(true);
        } catch (error) {
          console.error('Error loading game history:', error);
        }
      };

      loadGameHistory();
    }
  }, [isReviewMode, gameId]);

  // Initialize or reset the game
  const initializeGame = useCallback(() => {
    // Generate random AI players
    const shuffledNames = [...AI_NAMES].sort(() => Math.random() - 0.5);
    const aiPlayers: PlayerInfo[] = Array.from({ length: NUM_AI_PLAYERS }).map((_, i) => ({
      id: `ai-${i + 1}`,
      name: shuffledNames[i],
      chips: STARTING_CHIPS,
      cards: [],
      folded: false,
      isAI: true,
    }));

    // Create user player
    const userPlayer: PlayerInfo = {
      id: userId,
      name: userName,
      chips: STARTING_CHIPS,
      cards: [],
      folded: false,
    };

    // Combine players with user first
    const allPlayers = [userPlayer, ...aiPlayers];

    // Randomly select dealer
    const randomDealerIndex = Math.floor(Math.random() * allPlayers.length);

    // Initialize player contributions
    const initialContributions: Record<string, number> = {};
    allPlayers.forEach(player => {
      initialContributions[player.id] = 0;
    });

    // Set initial state
    setPlayers(allPlayers);
    setCommunityCards([]);
    setPot(0);
    setCurrentBet(0);
    setDealerIndex(randomDealerIndex);
    setGamePhase('');
    setIsGameActive(false);
    setShowdown(false);
    setWinnerInfo(null);
    setPlayerContributions(initialContributions);
  }, [userId, userName]);

  // Modify startGame to create a new game in the database
  const startGame = async () => {
    console.log("=== STARTING NEW GAME ===");

    try {
      // Create a new game in the database
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          players: players.map((player, index) => ({
            playerId: player.id,
            name: player.name,
            position: index,
            startingChips: STARTING_CHIPS,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const game = await response.json();
      setGameId(game.id);

      // Generate and shuffle deck
      const newDeck = generateDeck();
      console.log(`Generated new deck with ${newDeck.length} cards`);

      // Deal 2 cards to each player
      const { playerCards, remainingDeck } = dealCards(players.length);
      console.log(`Dealt cards to ${players.length} players, remaining deck: ${remainingDeck.length} cards`);

      // Make sure we're not in the middle of another game
      if (isGameActive) {
        console.log("Game is already active, not starting a new one");
        return;
      }

      // Update players with their cards
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        cards: playerCards[index],
        folded: false,
        lastAction: undefined, // Reset last action
      }));

      // Calculate positions
      const smallBlindPos = (dealerIndex + 1) % players.length;
      const bigBlindPos = (dealerIndex + 2) % players.length;
      console.log(`Dealer: ${players[dealerIndex].name}, Small Blind: ${players[smallBlindPos].name}, Big Blind: ${players[bigBlindPos].name}`);

      // Collect blinds
      const newPot = BLINDS.small + BLINDS.big;

      // Update player chips and contributions
      const newPlayers = updatedPlayers.map((player, index) => {
        if (index === smallBlindPos) {
          return {
            ...player,
            chips: player.chips - BLINDS.small,
            lastAction: `Small Blind (${BLINDS.small})`,
          };
        }
        if (index === bigBlindPos) {
          return {
            ...player,
            chips: player.chips - BLINDS.big,
            lastAction: `Big Blind (${BLINDS.big})`,
          };
        }
        return player;
      });

      // Update player contributions
      const newContributions: Record<string, number> = {};
      newPlayers.forEach(player => {
        newContributions[player.id] = 0;
      });
      newContributions[newPlayers[smallBlindPos].id] = BLINDS.small;
      newContributions[newPlayers[bigBlindPos].id] = BLINDS.big;

      // First player to act is after the big blind
      const firstToAct = (bigBlindPos + 1) % players.length;
      console.log(`First to act: ${newPlayers[firstToAct].name} (index: ${firstToAct})`);

      // Create empty community cards array
      const emptyCommCards: Card[] = [];

      // Add logs for blinds
      const newLogs: LogEntry[] = [
        {
          playerId: newPlayers[smallBlindPos].id,
          playerName: newPlayers[smallBlindPos].name,
          action: 'posted small blind',
          amount: BLINDS.small,
          timestamp: Date.now()
        },
        {
          playerId: newPlayers[bigBlindPos].id,
          playerName: newPlayers[bigBlindPos].name,
          action: 'posted big blind',
          amount: BLINDS.big,
          timestamp: Date.now()
        }
      ];

      console.log(`Setting up the game state...`);

      // Update all state in one batch to avoid race conditions
      setDeck(remainingDeck);
      setPlayers(newPlayers);
      setPot(newPot);
      setCurrentBet(BLINDS.big);
      setCurrentPlayerIndex(firstToAct);
      setGamePhase(PHASES[0]); // PREFLOP
      setPlayerContributions(newContributions);
      setCommunityCards(emptyCommCards);
      setGameLogs(newLogs);
      // Set game active last - this will trigger the useEffect that handles AI actions
      setIsGameActive(true);

      console.log(`Game state updated. Starting the game with ${newPlayers.length} players.`);
    } catch (error) {
      console.error('Failed to start game:', error);
      return;
    }
  };

  // Handle AI actions when game state changes
  useEffect(() => {
    // Only proceed if game is active and we have a valid current player
    if (!isGameActive || currentPlayerIndex < 0) {
      return;
    }

    const currentPlayer = players[currentPlayerIndex];

    // Check if current player is AI and should act
    if (currentPlayer?.isAI) {
      // If AI action is already in progress, don't trigger another one
      if (isAIActing.current) {
        return;
      }

      // Mark that AI is now acting
      isAIActing.current = true;

      console.log(`AI ${currentPlayer.name} is set to act. Triggering AI action...`);

      const gameStateForAI = {
        currentBet: currentBet,
        pot: pot,
        communityCards: communityCards,
        phase: gamePhase,
        players: players.map(p => ({
          id: p.id,
          chips: p.chips,
          cards: p.cards || [],
          folded: p.folded || false,
          totalBet: playerContributions[p.id] || 0,
        })),
      };

      const aiPlayerState: PlayerState = {
        id: currentPlayer.id,
        chips: currentPlayer.chips,
        cards: currentPlayer.cards || [],
        folded: false,
        totalBet: playerContributions[currentPlayer.id] || 0,
      };

      // Determine AI personality based on position
      const aiLevel = currentPlayerIndex % 3 === 0 ? AILevel.EASY :
        currentPlayerIndex % 3 === 1 ? AILevel.MEDIUM : AILevel.HARD;
      const personality = createAIPersonality(aiLevel);

      console.log(`AI personality: ${aiLevel}`);
      let timeoutId: any;
      // Get AI decision
      makeAIDecision(aiPlayerState, gameStateForAI, personality).then((decision) => {
        console.log(`AI ${currentPlayer.name} decision:`, decision);

        // Capture current player index to verify it hasn't changed
        const playerIndexAtTimeOfDecision = currentPlayerIndex;

        // Execute the AI action with a short delay
        timeoutId = setTimeout(() => {
          // Release the AI action flag when done
          isAIActing.current = false;

          // Final check to make sure game state is still valid and it's still this AI's turn
          if (!isGameActive || currentPlayerIndex !== playerIndexAtTimeOfDecision) {
            console.log("Game state changed, aborting AI action");
            return;
          }

          console.log(`Executing AI action: ${decision.action}`, decision.amount);
          handlePlayerAction(decision.action, decision.reason || '', decision.amount);
        }, AI_ACTION_DELAY);

      })

      // Cleanup function to cancel the timeout and reset flag if component unmounts or dependencies change
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        isAIActing.current = false;
      };
    }
  }, [isGameActive, currentPlayerIndex, players, currentBet, pot, communityCards, gamePhase, playerContributions, userId]);

  // Modify handlePlayerAction to store actions
  const handlePlayerAction = async (action: string, reason: string, amount?: number) => {
    // Prevent actions if game is not active
    if (!isGameActive || !gameIdState) {
      console.log("Game not active, ignoring player action");
      return;
    }

    // Create a snapshot of the current game state
    const gameState = {
      players: players.map(player => ({
        id: player.id,
        name: player.name,
        chips: player.chips,
        cards: player.cards,
        folded: player.folded,
        isAI: player.isAI,
      })),
      communityCards,
      pot,
      currentBet,
      dealerIndex,
      gamePhase,
    };

    try {
      // Store the action in the database
      const response = await fetch(`/api/games/${gameIdState}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: players[currentPlayerIndex].id,
          actionType: action,
          amount,
          gameState,
          reason,
          gameId: gameIdState
        }),
      });


      if (!response.ok) {
        throw new Error('Failed to store action');
      }


      if (reason === 'human') {
        const actionData = await response.json();
        const actionId = actionData.id;
        await fetch(`/api/games/${gameIdState}/human`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actionId: actionId,
            actionType: action,
            amount,
            player: players[currentPlayerIndex],
            communityCards: communityCards,
            players: players,
          }),
        });

      }

      // Ensure we have the current player
      if (currentPlayerIndex === undefined || currentPlayerIndex < 0) {
        console.error("No current player defined");
        return;
      }

      // Normalize action to lowercase to handle case sensitivity issues
      const normalizedAction = action.toLowerCase();

      const player = players[currentPlayerIndex];
      console.log(`🎮 Player ${player.name} (${currentPlayerIndex}) action: ${normalizedAction} ${amount !== undefined ? amount : ''}`);

      // Create a copy of players array to modify
      const newPlayers = [...players];
      const newContributions = { ...playerContributions };

      // Handle action
      let newPot = pot;
      let newCurrentBet = currentBet;
      const newLogs = [...gameLogs];

      if (normalizedAction === 'fold') {
        // Player folds
        newPlayers[currentPlayerIndex] = {
          ...player,
          folded: true,
          lastAction: 'Folded'
        };

        newLogs.push({
          playerId: player.id,
          playerName: player.name,
          action: 'folded',
          timestamp: Date.now()
        });
      } else if (normalizedAction === 'check') {
        // Player checks
        newPlayers[currentPlayerIndex] = {
          ...player,
          lastAction: 'Checked'
        };

        newLogs.push({
          playerId: player.id,
          playerName: player.name,
          action: 'checked',
          timestamp: Date.now()
        });
      } else if (normalizedAction === 'call') {
        // Calculate call amount (difference between current bet and player's contribution)
        const callAmount = currentBet - (playerContributions[player.id] || 0);

        // Remove the validation that was causing the error
        // A call should always be valid if there's a bet to call
        if (currentBet === 0) {
          console.error("Invalid call: No bet to call");
          return;
        }

        // Ensure player has enough chips
        if (player.chips < callAmount) {
          console.error("Player doesn't have enough chips to call");
          return;
        }

        // Update player chips and pot
        newPlayers[currentPlayerIndex] = {
          ...player,
          chips: player.chips - callAmount,
          lastAction: `Called ${currentBet}`  // Show the total bet amount being called, not just the difference
        };

        newPot += callAmount;
        newContributions[player.id] = currentBet;  // Set contribution to match current bet exactly

        newLogs.push({
          playerId: player.id,
          playerName: player.name,
          action: 'called',
          amount: currentBet,  // Log the total bet being called
          timestamp: Date.now()
        });
      } else if (normalizedAction === 'bet' || normalizedAction === 'raise') {
        // Handle bet/raise (they're similar)
        if (!amount || amount <= 0) {
          console.error("Invalid bet/raise amount");
          return;
        }

        // Calculate total amount player needs to put in
        const currentContribution = playerContributions[player.id] || 0;
        let totalNeeded: number;

        if (normalizedAction === 'bet') {
          // For a bet, player needs to put in the bet amount
          totalNeeded = amount;

          // Can only bet if no current bet exists
          if (currentBet > 0 && gamePhase !== PHASES[0]) {
            console.error("Can't bet when there's already a bet; must raise instead");
            return;
          }
        } else {
          // For a raise, player needs to put in current bet + raise amount
          totalNeeded = amount; // amount is now the total bet, not just the raise increment
        }

        // Calculate how much more the player needs to add
        const additionalAmount = totalNeeded - currentContribution;

        // Ensure player has enough chips
        if (player.chips < additionalAmount) {
          console.error("Player doesn't have enough chips for this action");
          return;
        }

        // Validate minimum raise amount
        if (normalizedAction === 'raise' && totalNeeded <= currentBet) {
          console.error("Raise amount must be greater than current bet");
          return;
        }

        // Update player chips, bet, and pot
        newPlayers[currentPlayerIndex] = {
          ...player,
          chips: player.chips - additionalAmount,
          lastAction: `${normalizedAction === 'bet' ? 'Bet' : 'Raised to'} ${totalNeeded}`
        };

        newCurrentBet = totalNeeded;
        newPot += additionalAmount;
        newContributions[player.id] = totalNeeded; // Set total contribution to the new bet amount

        // Log the action
        newLogs.push({
          playerId: player.id,
          playerName: player.name,
          action: normalizedAction === 'bet' ? 'bet' : 'raised to',
          amount: totalNeeded,
          timestamp: Date.now()
        });
      } else if (normalizedAction === 'all-in' || normalizedAction === 'all_in') {
        // Player goes all-in
        const allInAmount = player.chips;

        if (allInAmount <= 0) {
          console.error("Player has no chips to go all-in");
          return;
        }

        // Update current bet if all-in amount is higher
        const totalContribution = (playerContributions[player.id] || 0) + allInAmount;
        if (totalContribution > newCurrentBet) {
          newCurrentBet = totalContribution;
        }

        // Update player chips, pot, and contributions
        newPlayers[currentPlayerIndex] = {
          ...player,
          chips: 0,
          lastAction: `All-in (${allInAmount})`
        };

        newPot += allInAmount;
        newContributions[player.id] = (newContributions[player.id] || 0) + allInAmount;

        newLogs.push({
          playerId: player.id,
          playerName: player.name,
          action: 'went all-in',
          amount: allInAmount,
          timestamp: Date.now()
        });
      }

      // Update state
      setPlayers(newPlayers);
      setPot(newPot);
      setCurrentBet(newCurrentBet);
      setPlayerContributions(newContributions);
      setGameLogs(newLogs);

      console.log(`After action: pot=${newPot}, currentBet=${newCurrentBet}`);
      console.log("Player contributions:", newContributions);

      // Check if hand is over (only one player left)
      const activePlayers = newPlayers.filter(p => !p.folded);
      if (activePlayers.length === 1) {
        console.log("Only one player left! Ending hand...");
        endHand(newPlayers, activePlayers[0]);
        return;
      }

      // Move to the next player or phase
      moveToNextPlayerOrPhase(newPlayers, newContributions, newCurrentBet);
    } catch (error) {
      console.error('Failed to store action:', error);
      // Continue with the game even if storing the action fails
    }
  };

  // Move to next player or phase
  const moveToNextPlayerOrPhase = (updatedPlayers: PlayerInfo[], newContributions: Record<string, number>, currentBetAmount: number) => {
    // Check if all active players have acted and matched the current bet
    const activePlayers = updatedPlayers.filter(p => !p.folded);

    // Get the last actions of all active players
    const lastActions = activePlayers.map(player => {
      return {
        playerId: player.id,
        lastAction: player.lastAction
      };
    });

    // Check if all active players have acted (either matched the bet or checked when no bet)
    const allPlayersActed = activePlayers.every(player => {
      const contribution = newContributions[player.id] || 0;
      // Player has acted if:
      // 1. They've matched the current bet, OR
      // 2. They've checked when there's no bet, OR
      // 3. They're all-in
      return (
        contribution === currentBetAmount ||
        (currentBetAmount === 0 && player.lastAction === 'Checked') ||
        player.chips === 0
      );
    });

    // Check if everyone has checked (when there's no bet)
    const allPlayersChecked = currentBetAmount === 0 &&
      lastActions.every(action => action.lastAction === 'Checked');

    console.log(`All players acted: ${allPlayersActed}, All checked: ${allPlayersChecked}, Current phase: ${gamePhase}`);

    if (allPlayersActed || allPlayersChecked) {
      // Move to next phase
      const currentPhaseIndex = PHASES.indexOf(gamePhase);

      if (currentPhaseIndex < PHASES.length - 1) {
        console.log(`Moving to next phase from ${gamePhase} to ${PHASES[currentPhaseIndex + 1]}`);
        const nextPhase = PHASES[currentPhaseIndex + 1];

        // Deal community cards based on the phase
        let newCommunityCards = [...communityCards];
        if (nextPhase === PHASES[1]) {
          // Flop - deal 3 cards
          newCommunityCards = [...deck.slice(0, 3)];
          setDeck(deck.slice(3));
        } else if (nextPhase === PHASES[2] || nextPhase === PHASES[3]) {
          // Turn or River - deal 1 card
          newCommunityCards = [...communityCards, deck[0]];
          setDeck(deck.slice(1));
        }

        // Reset current bet for the new phase
        setCurrentBet(0);
        setCommunityCards(newCommunityCards);
        setGamePhase(nextPhase);

        // Reset to first player (after dealer) for new phase
        let firstPlayerIndex = (dealerIndex + 1) % updatedPlayers.length;

        // Skip folded players and players who are all-in
        while (updatedPlayers[firstPlayerIndex].folded || updatedPlayers[firstPlayerIndex].chips === 0) {
          firstPlayerIndex = (firstPlayerIndex + 1) % updatedPlayers.length;

          // If we've looped through all players, no one can act
          if (firstPlayerIndex === dealerIndex) {
            console.log("No players can act in new phase, advancing to next phase");
            // Handle case when no players can act in this phase
            if (currentPhaseIndex + 1 < PHASES.length - 1) {
              moveToNextPlayerOrPhase(updatedPlayers, newContributions, 0);
            } else {
              // End the hand if we're at the final phase
              const lastActivePlayers = updatedPlayers.filter(p => !p.folded);
              if (lastActivePlayers.length === 1) {
                endHand(updatedPlayers, lastActivePlayers[0]);
              } else {
                endHand(updatedPlayers);
              }
            }
            return;
          }
        }

        setCurrentPlayerIndex(firstPlayerIndex);

        // Trigger AI action if first player is AI
        if (updatedPlayers[firstPlayerIndex].isAI && isGameActive) {
          console.log(`AI ${updatedPlayers[firstPlayerIndex].name} is first to act in new phase`);
          // The AI action will be handled by the useEffect hook
        }
      } else {
        // End the hand if we're at the final phase
        console.log('Final phase reached, ending hand');
        endHand(updatedPlayers);
      }
    } else {
      // Find next active player
      let nextPlayerIndex = (currentPlayerIndex + 1) % updatedPlayers.length;

      // Skip folded players and players who are all-in
      while (
        updatedPlayers[nextPlayerIndex].folded ||
        updatedPlayers[nextPlayerIndex].chips === 0
      ) {
        nextPlayerIndex = (nextPlayerIndex + 1) % updatedPlayers.length;

        // If we've looped through all players, break to avoid infinite loop
        if (nextPlayerIndex === currentPlayerIndex) {
          console.log("Warning: Potential player loop detected");
          break;
        }
      }

      console.log(`Moving to next player: ${updatedPlayers[nextPlayerIndex].name} (index: ${nextPlayerIndex})`);

      // Update current player index
      setCurrentPlayerIndex(nextPlayerIndex);

      // Log whether next player is AI or human
      if (updatedPlayers[nextPlayerIndex].isAI) {
        console.log(`Next player is AI: ${updatedPlayers[nextPlayerIndex].name}`);
        // The AI action will be handled by the useEffect hook
      } else {
        console.log(`Next player is human: ${updatedPlayers[nextPlayerIndex].name}`);
      }
    }
  };

  // End the hand and determine the winner
  const endHand = (finalPlayers: PlayerInfo[], forcedWinner?: PlayerInfo) => {
    console.log("Ending hand and determining winner");
    setShowdown(true); // Show all cards in showdown

    if (forcedWinner) {
      // If only one player remains, they win automatically
      const winnings = pot;

      // Update player chips
      const playersWithUpdatedChips = finalPlayers.map(player => {
        if (player.id === forcedWinner.id) {
          return {
            ...player,
            chips: player.chips + winnings,
          };
        }
        return player;
      });

      // Add log entry for winner
      const winnerLog: LogEntry = {
        playerId: forcedWinner.id,
        playerName: forcedWinner.name,
        action: 'wins',
        amount: winnings,
        timestamp: Date.now()
      };
      setGameLogs(prevLogs => [...prevLogs, winnerLog]);

      setWinnerInfo({
        winner: forcedWinner,
        handDescription: 'Last player standing',
        handRank: 0,
        pot: winnings,
        bestHand: [] as Card[],
        isUser: forcedWinner.id === userId,
      });

      setPlayers(playersWithUpdatedChips);
      setIsGameActive(false);
      console.log(`Game ended. Winner: ${forcedWinner.name} (${forcedWinner.id})`);
      return;
    }

    // Get active players and their cards
    const activePlayers = finalPlayers
      .filter(p => !p.folded)
      .map(p => ({
        userId: p.id,
        cards: p.cards as Card[],
        folded: p.folded || false,
      }));

    console.log(`Determining winner among ${activePlayers.length} active players`);

    // Determine the winner
    const winner = determineWinner(activePlayers, communityCards);

    if (winner) {
      const winningPlayer = finalPlayers.find(p => p.id === winner.winnerId);

      if (winningPlayer) {
        // Add log entry for winner
        const winnerLog: LogEntry = {
          playerId: winningPlayer.id,
          playerName: winningPlayer.name,
          action: `wins with ${winner.winningHand.description}`,
          amount: pot,
          timestamp: Date.now()
        };
        setGameLogs(prevLogs => [...prevLogs, winnerLog]);

        // Update player chips
        const playersWithUpdatedChips = finalPlayers.map(player => {
          if (player.id === winningPlayer.id) {
            return {
              ...player,
              chips: player.chips + pot,
            };
          }
          return player;
        });

        setWinnerInfo({
          winner: winningPlayer,
          handDescription: winner.winningHand.description,
          handRank: winner.winningHand.rank,
          pot,
          bestHand: winner.winningHand.bestHand,
          isUser: winningPlayer.id === userId,
        });

        setPlayers(playersWithUpdatedChips);
        console.log(`Game ended. Winner: ${winningPlayer.name} with ${winner.winningHand.description}`);
      }
    } else {
      console.log("No winner determined!");
    }

    // Set game as inactive only at the very end
    setIsGameActive(false);
  };

  // Start a new hand
  const startNewHand = () => {
    setShowdown(false);

    // Rotate dealer position
    const newDealerIndex = (dealerIndex + 1) % players.length;
    setDealerIndex(newDealerIndex);

    // Add log entry for new hand
    const newHandLog: LogEntry = {
      playerId: 'system',
      playerName: 'Dealer',
      action: 'starting new hand',
      timestamp: Date.now()
    };
    setGameLogs(prevLogs => [...prevLogs, newHandLog]);

    // Reset game state for new hand
    setCommunityCards([]);
    setPot(0);
    setCurrentBet(0);
    setGamePhase('');
    setIsGameActive(false);
    setWinnerInfo(null);

    // If any player is out of chips, they're removed from the game
    const playersWithChips = players.filter(p => p.chips > 0);

    // Check if game is over (user is out of chips or only user remains)
    const userPlayer = playersWithChips.find(p => p.id === userId);
    const aiPlayers = playersWithChips.filter(p => p.id !== userId);

    if (!userPlayer || aiPlayers.length === 0) {
      // Game over - reinitialize
      initializeGame();
    } else {
      // Continue with players who have chips
      setPlayers(playersWithChips);
    }
  };

  // Handle user actions
  const handleFold = () => handlePlayerAction('fold', 'human');
  const handleCheck = () => handlePlayerAction('check', 'human');
  const handleCall = (amount: number) => handlePlayerAction('call', 'human', amount);
  const handleBet = (amount: number) => handlePlayerAction('bet', 'human', amount);
  const handleRaise = (amount: number) => handlePlayerAction('raise', 'human', amount);
  const handleAllIn = () => handlePlayerAction('all-in', 'human');

  // Initialize game on first load
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Player information for the current user
  const userPlayer = players.find(p => p.id === userId);
  const isUserTurn = userPlayer && currentPlayerIndex === players.indexOf(userPlayer);

  // Determine if user can check (no current bet or already matched the bet)
  const userContribution = playerContributions[userId] || 0;
  const canUserCheck = currentBet === 0 || userContribution === currentBet;

  // Toggle log visibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleLogVisibility = () => {
    setIsLogVisible(!isLogVisible);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleMusic = () => {
    const nextMuted = !isMusicMuted;
    setIsMusicMuted(nextMuted);
    const audio = backgroundAudioRef.current;
    if (!audio) return;
    if (nextMuted) {
      audio.pause();
    } else {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch((err) => {
          console.warn('Background music play was prevented:', err);
        });
      }
    }
  };

  useEffect(() => {
    const audio = backgroundAudioRef.current;
    if (!audio) return;

    if (!isReviewMode && isGameActive && !isMusicMuted) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch((err) => {
          console.warn('Background music play was prevented:', err);
        });
      }
    } else {
      audio.pause();
    }
  }, [isGameActive, isReviewMode, isMusicMuted]);

  return (
    <div className="container mx-auto px-4 py-8">
      <audio
        ref={backgroundAudioRef}
        src="/background-music.mp3"
        loop
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isReviewMode ? 'Game Review' : 'Poker Game'}
        </h1>
        {isReviewMode && (
          <Link
            href="/games"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Back to Games
          </Link>
        )}
      </div>

      {!isGameActive && !winnerInfo && !isReviewMode && (
        <div className="text-center mb-8">
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-xl font-bold shadow-lg transition-colors"
          >
            Start New Game
          </button>
        </div>
      )}

      <PokerTable
        players={players}
        communityCards={communityCards}
        pot={pot}
        currentPlayerIndex={currentPlayerIndex}
        dealerIndex={dealerIndex}
        gamePhase={gamePhase}
        userId={userId}
        showdown={showdown || isReviewMode}
      />

      {isGameActive && userPlayer && isUserTurn && (
        <div className="mt-6">
          <ActionControls
            currentBet={currentBet}
            playerChips={userPlayer.chips}
            playerContribution={userContribution}
            isPlayerTurn={true}
            canCheck={canUserCheck}
            canRaise={currentBet > 0}
            onFold={handleFold}
            onCheck={handleCheck}
            onCall={handleCall}
            onBet={handleBet}
            onRaise={handleRaise}
            onAllIn={handleAllIn}
          />
        </div>
      )}

      <PlayerStatusBar
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        dealerIndex={dealerIndex}
        playerContributions={playerContributions}
      />

      <GameLog
        logs={gameLogs}
        isVisible={isLogVisible}
        onClose={() => setIsLogVisible(false)}
      />

      {winnerInfo && (
        <GameResult
          winner={winnerInfo.winner}
          handDescription={winnerInfo.handDescription}
          handRank={winnerInfo.handRank}
          pot={winnerInfo.pot}
          bestHand={winnerInfo.bestHand}
          isUser={winnerInfo.isUser}
          onPlayAgain={startNewHand}
          onReview={() => setShowActionReplay(true)}
          isReviewMode={isReviewMode}
          gameId={gameIdState || undefined}
        />
      )}

      {showActionReplay && gameIdState && (
        <ActionReplay
          gameId={gameIdState}
          onClose={() => setShowActionReplay(false)}
        />
      )}
    </div>
  );
} 