import { evaluateHand } from './poker';

export interface PlayerState {
  id: string;
  chips: number;
  cards: string[];
  folded: boolean;
  totalBet: number;
}

export interface GameState {
  currentBet: number;
  pot: number;
  communityCards: string[];
  phase: string;
  players: PlayerState[];
}

// AI difficulty levels
export enum AILevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// AI personality traits
export interface AIPersonality {
  level: AILevel;
  bluffFrequency: number; // 0-1, how often the AI will bluff
  riskTolerance: number; // 0-1, how risky the AI plays
  aggressiveness: number; // 0-1, how aggressively the AI bets/raises
}

// Create AI personalities
export const createAIPersonality = (level: AILevel): AIPersonality => {
  switch (level) {
    case AILevel.EASY:
      return {
        level,
        bluffFrequency: 0.1,
        riskTolerance: 0.3,
        aggressiveness: 0.2,
      };
    case AILevel.MEDIUM:
      return {
        level,
        bluffFrequency: 0.3,
        riskTolerance: 0.5,
        aggressiveness: 0.5,
      };
    case AILevel.HARD:
      return {
        level,
        bluffFrequency: 0.5,
        riskTolerance: 0.7,
        aggressiveness: 0.8,
      };
  }
};

// Main AI decision function
export const makeAIDecision = (
  aiPlayer: PlayerState,
  gameState: GameState,
  personality: AIPersonality
): { action: string; amount?: number } => {
  const { currentBet, pot, communityCards, phase } = gameState;
  
  console.log(`AI ${aiPlayer.id} making decision:`, {
    currentBet,
    pot,
    communityCards: communityCards.length,
    phase,
    aiChips: aiPlayer.chips,
    aiBet: aiPlayer.totalBet
  });
  
  // If AI player has folded, no action needed
  if (aiPlayer.folded) {
    console.log(`AI ${aiPlayer.id} has already folded, no action needed`);
    return { action: 'NONE' };
  }
  
  // Calculate how much AI needs to call
  const amountToCall = currentBet - aiPlayer.totalBet;
  console.log(`AI ${aiPlayer.id} needs to call: ${amountToCall}`);
  
  // If AI can't afford the call, only options are fold or all-in
  if (amountToCall > aiPlayer.chips) {
    // Decision between fold and all-in based on hand strength and personality
    const handStrength = evaluateHandStrength(aiPlayer.cards, communityCards);
    const allInThreshold = 0.3 + personality.riskTolerance * 0.5;
    
    console.log(`AI ${aiPlayer.id} can't afford call. Hand strength: ${handStrength}, All-in threshold: ${allInThreshold}`);
    
    if (handStrength > allInThreshold || Math.random() < personality.bluffFrequency) {
      console.log(`AI ${aiPlayer.id} decides to go ALL-IN`);
      return { action: 'ALL_IN' };
    } else {
      console.log(`AI ${aiPlayer.id} decides to FOLD`);
      return { action: 'FOLD' };
    }
  }
  
  // If no bet has been made, AI can check or bet
  if (currentBet === 0 || aiPlayer.totalBet === currentBet) {
    const handStrength = evaluateHandStrength(aiPlayer.cards, communityCards);
    
    // AI might bluff
    const isBluffing = Math.random() < personality.bluffFrequency;
    
    // Decide whether to bet/raise or check based on hand strength and personality
    const betThreshold = 0.3 + (1 - personality.aggressiveness) * 0.4;
    
    console.log(`AI ${aiPlayer.id} can check or bet. Hand strength: ${handStrength}, Bluffing: ${isBluffing}, Bet threshold: ${betThreshold}`);
    
    if (handStrength > betThreshold || isBluffing) {
      // Determine bet size based on hand strength and aggressiveness
      const betSize = determineBetSize(
        aiPlayer.chips,
        pot,
        handStrength,
        personality,
        phase
      );
      
      console.log(`AI ${aiPlayer.id} decides to BET ${betSize}`);
      return { action: 'BET', amount: betSize };
    } else {
      console.log(`AI ${aiPlayer.id} decides to CHECK`);
      return { action: 'CHECK' };
    }
  }
  
  // If there's a bet, AI must call, raise, or fold
  const handStrength = evaluateHandStrength(aiPlayer.cards, communityCards);
  
  // AI might bluff
  const isBluffing = Math.random() < personality.bluffFrequency;
  
  // Different thresholds for different actions
  const foldThreshold = 0.2 + (1 - personality.riskTolerance) * 0.3;
  const raiseThreshold = 0.5 + (1 - personality.aggressiveness) * 0.2;
  
  console.log(`AI ${aiPlayer.id} must decide to call, raise or fold. Hand strength: ${handStrength}, Bluffing: ${isBluffing}`);
  console.log(`Fold threshold: ${foldThreshold}, Raise threshold: ${raiseThreshold}`);
  
  if (handStrength < foldThreshold && !isBluffing) {
    console.log(`AI ${aiPlayer.id} decides to FOLD`);
    return { action: 'FOLD' };
  } else if (handStrength > raiseThreshold || isBluffing) {
    // Determine raise size
    const raiseSize = determineBetSize(
      aiPlayer.chips,
      pot,
      handStrength,
      personality,
      phase
    );
    
    // Ensure raise is at least double the current bet
    const minimumRaise = Math.max(currentBet * 2, currentBet + 20);
    const finalRaise = Math.max(raiseSize, minimumRaise);
    
    if (finalRaise > aiPlayer.chips) {
      console.log(`AI ${aiPlayer.id} decides to go ALL-IN (not enough for proper raise)`);
      return { action: 'ALL_IN' };
    }
    
    console.log(`AI ${aiPlayer.id} decides to RAISE to ${finalRaise}`);
    return { action: 'RAISE', amount: finalRaise };
  } else {
    // Call is the default middle-ground action
    console.log(`AI ${aiPlayer.id} decides to CALL ${amountToCall}`);
    return { action: 'CALL', amount: amountToCall };
  }
};

// Evaluate hand strength on a scale of 0-1
const evaluateHandStrength = (cards: string[], communityCards: string[]): number => {
  if (communityCards.length === 0) {
    // Preflop evaluation based on pocket cards
    return evaluatePocketCards(cards);
  }
  
  // Post-flop: use the evaluateHand function
  const evaluation = evaluateHand([...cards, ...communityCards]);
  
  // Convert rank to a 0-1 scale
  // Higher ranks (Royal Flush = 10) should be closer to 1
  let strength = evaluation!.rank / 10;
  
  // Adjust strength based on hole cards and community cards
  // Add some randomness to make AI less predictable
  strength = Math.min(strength + Math.random() * 0.1, 1);
  
  return strength;
};

// Evaluate pocket cards (pre-flop)
const evaluatePocketCards = (cards: string[]): number => {
  if (cards.length !== 2) return 0.5;
  
  const card1 = cards[0];
  const card2 = cards[1];
  
  const value1 = card1[0];
  const value2 = card2[0];
  const suit1 = card1[1];
  const suit2 = card2[1];
  
  // Pair
  if (value1 === value2) {
    // Value of pair based on card value
    const pairRank = getCardValueRank(value1);
    return 0.5 + pairRank * 0.05; // Pairs are strong
  }
  
  // Suited cards
  const isSuited = suit1 === suit2;
  
  // High cards
  const isHighCard1 = ['A', 'K', 'Q', 'J', 'T'].includes(value1);
  const isHighCard2 = ['A', 'K', 'Q', 'J', 'T'].includes(value2);
  
  // Connected cards (within 3 ranks of each other)
  const isConnected = Math.abs(getCardValueRank(value1) - getCardValueRank(value2)) <= 3;
  
  // Calculate base strength
  let strength = 0.2; // Base value
  
  if (isHighCard1) strength += 0.05;
  if (isHighCard2) strength += 0.05;
  if (isSuited) strength += 0.1;
  if (isConnected) strength += 0.1;
  
  // Premium starting hands
  if ((value1 === 'A' && value2 === 'K') || (value1 === 'K' && value2 === 'A')) {
    strength = 0.8; // AK is very strong
    if (isSuited) strength = 0.85; // AK suited is even stronger
  }
  
  return Math.min(strength, 0.9); // Cap at 0.9 for non-paired hands
};

// Get numerical rank for a card value
const getCardValueRank = (value: string): number => {
  switch (value) {
    case 'A': return 1.0;
    case 'K': return 0.9;
    case 'Q': return 0.8;
    case 'J': return 0.7;
    case 'T': return 0.6;
    case '9': return 0.5;
    case '8': return 0.4;
    case '7': return 0.3;
    case '6': return 0.2;
    case '5': return 0.15;
    case '4': return 0.1;
    case '3': return 0.05;
    case '2': return 0.0;
    default: return 0.0;
  }
};

// Determine bet size based on hand strength and personality
const determineBetSize = (
  chips: number,
  pot: number,
  handStrength: number,
  personality: AIPersonality,
  phase: string
): number => {
  let betRatio = 0.5; // Base bet is half the pot
  
  // Adjust based on hand strength
  betRatio += handStrength * 0.5;
  
  // Adjust based on aggressiveness
  betRatio += personality.aggressiveness * 0.2;
  
  // Adjust based on game phase
  if (phase === 'RIVER' || phase === 'TURN') {
    betRatio += 0.2; // Bet more on later streets
  }
  
  // Calculate bet amount
  let betAmount = Math.floor(pot * betRatio);
  
  // Ensure minimum bet
  betAmount = Math.max(betAmount, 20);
  
  // Ensure we don't bet more than we have
  betAmount = Math.min(betAmount, chips);
  
  // Round to nearest multiple of 5 for cleaner bets
  betAmount = Math.floor(betAmount / 5) * 5;
  
  return betAmount;
}; 
