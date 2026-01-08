/**
 * Poker utilities for Texas Hold'em
 */

// Card suits and values
export const SUITS = ['H', 'D', 'C', 'S'] as const; // Hearts, Diamonds, Clubs, Spades
export const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof SUITS[number];
export type Value = typeof VALUES[number];
export type Card = string; // e.g. "AH", "2C", etc.

// Hand rankings
export enum HandRank {
  HighCard = 1,
  Pair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
  RoyalFlush = 10,
}

// Hand rank descriptions
export const HandRankDescriptions: Record<HandRank, string> = {
  [HandRank.HighCard]: 'High Card',
  [HandRank.Pair]: 'Pair',
  [HandRank.TwoPair]: 'Two Pair',
  [HandRank.ThreeOfAKind]: 'Three of a Kind',
  [HandRank.Straight]: 'Straight',
  [HandRank.Flush]: 'Flush',
  [HandRank.FullHouse]: 'Full House',
  [HandRank.FourOfAKind]: 'Four of a Kind',
  [HandRank.StraightFlush]: 'Straight Flush',
  [HandRank.RoyalFlush]: 'Royal Flush',
};

// Generates a shuffled deck of cards
export function generateDeck(): Card[] {
  const deck: Card[] = [];

  // Create all possible cards
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push(`${value}${suit}` as Card);
    }
  }

  // Shuffle the deck using Fisher-Yates algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Deal cards to players
export function dealCards(numPlayers: number, cardsPerPlayer: number = 2): {
  playerCards: Card[][],
  remainingDeck: Card[]
} {
  const deck = generateDeck();
  const playerCards: Card[][] = [];

  // Deal cards to each player
  for (let i = 0; i < numPlayers; i++) {
    const hand: Card[] = [];
    for (let j = 0; j < cardsPerPlayer; j++) {
      hand.push(deck.pop() as Card);
    }
    playerCards.push(hand);
  }

  return {
    playerCards,
    remainingDeck: deck
  };
}

// Deal community cards
export function dealCommunityCards(deck: Card[], count: number): {
  communityCards: Card[],
  remainingDeck: Card[]
} {
  const communityCards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);

  return {
    communityCards,
    remainingDeck
  };
}

interface ParsedCard {
  value: number;
  suit: string;
  originalCard: Card;
}

interface HandResult {
  rank: number;
  description: string;
  bestHand: Card[];
}

function parseCard(card: Card): ParsedCard {
  const value = card.charAt(0);
  const suit = card.charAt(1);
  return {
    value: getCardValue(value),
    suit,
    originalCard: card
  };
}

function getCardValue(value: string): number {
  switch (value) {
    case 'A': return 14;
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    case 'T': return 10;
    default: return parseInt(value);
  }
}

function getCardRankName(value: number): string {
  switch (value) {
    case 14: return 'Ace';
    case 13: return 'King';
    case 12: return 'Queen';
    case 11: return 'Jack';
    default: return value.toString();
  }
}

function checkRoyalFlush(cards: ParsedCard[]): Card[] | null {
  const straightFlush = checkStraightFlush(cards);
  if (straightFlush && cards[0].value === 14) {
    return straightFlush;
  }
  return null;
}

function checkStraightFlush(cards: ParsedCard[]): Card[] | null {
  // Group cards by suit
  const suits = new Map<string, ParsedCard[]>();
  cards.forEach(card => {
    if (!suits.has(card.suit)) {
      suits.set(card.suit, []);
    }
    suits.get(card.suit)!.push(card);
  });

  // Check each suit group for a straight
  for (const [_, suitCards] of suits) {
    if (suitCards.length >= 5) {
      const straight = checkStraight(suitCards);
      if (straight) {
        return straight;
      }
    }
  }
  return null;
}

function checkFourOfAKind(cards: ParsedCard[]): Card[] | null {
  for (let i = 0; i <= cards.length - 4; i++) {
    if (cards[i].value === cards[i + 1].value &&
      cards[i].value === cards[i + 2].value &&
      cards[i].value === cards[i + 3].value) {
      // Found four of a kind, add highest remaining card as kicker
      const kicker = cards.find(c => c.value !== cards[i].value);
      if (kicker) {
        return [
          cards[i].originalCard,
          cards[i + 1].originalCard,
          cards[i + 2].originalCard,
          cards[i + 3].originalCard,
          kicker.originalCard
        ];
      }
    }
  }
  return null;
}

function checkFullHouse(cards: ParsedCard[]): Card[] | null {
  const three = checkThreeOfAKind(cards);
  if (!three) return null;

  const threeValue = getCardValue(three[0].charAt(0));
  const remainingCards = cards.filter(c => c.value !== threeValue);

  // Look for highest pair in remaining cards
  for (let i = 0; i < remainingCards.length - 1; i++) {
    if (remainingCards[i].value === remainingCards[i + 1].value) {
      return [
        ...three.slice(0, 3),
        remainingCards[i].originalCard,
        remainingCards[i + 1].originalCard
      ];
    }
  }
  return null;
}

function checkFlush(cards: ParsedCard[]): Card[] | null {
  const suits = new Map<string, ParsedCard[]>();
  cards.forEach(card => {
    if (!suits.has(card.suit)) {
      suits.set(card.suit, []);
    }
    suits.get(card.suit)!.push(card);
  });

  for (const [_, suitCards] of suits) {
    if (suitCards.length >= 5) {
      return suitCards.slice(0, 5).map(c => c.originalCard);
    }
  }
  return null;
}

function checkStraight(cards: ParsedCard[]): Card[] | null {
  // Handle Ace-low straight specially
  if (cards[0].value === 14) {
    const aceLowCards = [...cards.slice(1), { ...cards[0], value: 1 }];
    aceLowCards.sort((a, b) => b.value - a.value);
    const aceLowStraight = checkStraightNormal(aceLowCards);
    if (aceLowStraight) return aceLowStraight;
  }
  return checkStraightNormal(cards);
}

function checkStraightNormal(cards: ParsedCard[]): Card[] | null {
  for (let i = 0; i <= cards.length - 5; i++) {
    if (cards[i].value === cards[i + 1].value + 1 &&
      cards[i + 1].value === cards[i + 2].value + 1 &&
      cards[i + 2].value === cards[i + 3].value + 1 &&
      cards[i + 3].value === cards[i + 4].value + 1) {
      return [
        cards[i].originalCard,
        cards[i + 1].originalCard,
        cards[i + 2].originalCard,
        cards[i + 3].originalCard,
        cards[i + 4].originalCard
      ];
    }
  }
  return null;
}

function checkThreeOfAKind(cards: ParsedCard[]): Card[] | null {
  for (let i = 0; i <= cards.length - 3; i++) {
    if (cards[i].value === cards[i + 1].value &&
      cards[i].value === cards[i + 2].value) {
      // Found three of a kind, add two highest remaining cards as kickers
      const kickers = cards.filter(c => c.value !== cards[i].value).slice(0, 2);
      if (kickers.length === 2) {
        return [
          cards[i].originalCard,
          cards[i + 1].originalCard,
          cards[i + 2].originalCard,
          kickers[0].originalCard,
          kickers[1].originalCard
        ];
      }
    }
  }
  return null;
}

function checkTwoPair(cards: ParsedCard[]): Card[] | null {
  for (let i = 0; i <= cards.length - 2; i++) {
    if (cards[i].value === cards[i + 1].value) {
      // Found first pair, look for second pair
      const remainingCards = cards.filter(c => c.value !== cards[i].value);
      for (let j = 0; j <= remainingCards.length - 2; j++) {
        if (remainingCards[j].value === remainingCards[j + 1].value) {
          // Found second pair, add highest remaining card as kicker
          const kicker = cards.find(c =>
            c.value !== cards[i].value &&
            c.value !== remainingCards[j].value
          );
          if (kicker) {
            return [
              cards[i].originalCard,
              cards[i + 1].originalCard,
              remainingCards[j].originalCard,
              remainingCards[j + 1].originalCard,
              kicker.originalCard
            ];
          }
        }
      }
    }
  }
  return null;
}

function checkOnePair(cards: ParsedCard[]): Card[] | null {
  for (let i = 0; i <= cards.length - 2; i++) {
    if (cards[i].value === cards[i + 1].value) {
      // Found pair, add three highest remaining cards as kickers
      const kickers = cards.filter(c => c.value !== cards[i].value).slice(0, 3);
      if (kickers.length === 3) {
        return [
          cards[i].originalCard,
          cards[i + 1].originalCard,
          kickers[0].originalCard,
          kickers[1].originalCard,
          kickers[2].originalCard
        ];
      }
    }
  }
  return null;
}

export function evaluateHand(cards: Card[], _numCards?: number): HandResult | null {
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  // Ensure we have a valid array of cards
  const validCards = cards.filter(card => card !== null && card !== undefined);
  if (validCards.length === 0) {
    return null;
  }

  // Convert cards to value-suit pairs and sort by value (descending)
  const parsedCards = validCards.map(parseCard);
  parsedCards.sort((a, b) => b.value - a.value);

  // Check for each hand type in descending order of value
  const royalFlush = checkRoyalFlush(parsedCards);
  if (royalFlush) return { rank: 10, description: 'Royal Flush', bestHand: royalFlush };

  const straightFlush = checkStraightFlush(parsedCards);
  if (straightFlush) return { rank: 9, description: 'Straight Flush', bestHand: straightFlush };

  const fourOfAKind = checkFourOfAKind(parsedCards);
  if (fourOfAKind) return { rank: 8, description: 'Four of a Kind', bestHand: fourOfAKind };

  const fullHouse = checkFullHouse(parsedCards);
  if (fullHouse) return { rank: 7, description: 'Full House', bestHand: fullHouse };

  const flush = checkFlush(parsedCards);
  if (flush) return { rank: 6, description: 'Flush', bestHand: flush };

  const straight = checkStraight(parsedCards);
  if (straight) return { rank: 5, description: 'Straight', bestHand: straight };

  const threeOfAKind = checkThreeOfAKind(parsedCards);
  if (threeOfAKind) return { rank: 4, description: 'Three of a Kind', bestHand: threeOfAKind };

  const twoPair = checkTwoPair(parsedCards);
  if (twoPair) return { rank: 3, description: 'Two Pair', bestHand: twoPair };

  const onePair = checkOnePair(parsedCards);
  if (onePair) return { rank: 2, description: 'One Pair', bestHand: onePair };

  // High card
  return {
    rank: 1,
    description: `High Card ${getCardRankName(parsedCards[0].value)}`,
    bestHand: parsedCards.slice(0, 5).map(pc => pc.originalCard)
  };
}

// Get all possible n-length combinations from array
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getCombinations<T>(array: T[], n: number): T[][] {
  if (n === 1) return array.map(item => [item]);

  const result: T[][] = [];
  for (let i = 0; i <= array.length - n; i++) {
    const head = array[i];
    const tailCombinations = getCombinations(
      array.slice(i + 1),
      n - 1
    );

    for (const tailCombo of tailCombinations) {
      result.push([head, ...tailCombo]);
    }
  }

  return result;
}

// Evaluate a single 5-card hand
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateSingleHand(hand: Card[]): { rank: HandRank } {
  const parsedCards = hand.map(parseCard)
    .sort((a, b) => b.value - a.value);

  // Check for flush (all same suit)
  const isFlush = parsedCards.every(card => card.suit === parsedCards[0].suit);

  // Check for straight (sequential values)
  const values = parsedCards.map(card => card.value);
  let isStraight = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== values[i] + 1) {
      isStraight = false;
      break;
    }
  }

  // Special case for A-5 straight
  if (!isStraight && values[0] === 14) {
    const lowAceValues = [5, 4, 3, 2, 1];
    const aceValues = parsedCards.map(card => {
      return card.value === 14 ? 1 : card.value;
    }).sort((a, b) => b - a);

    isStraight = aceValues.every((val, i) => val === lowAceValues[i]);
  }

  // Check for royal flush
  if (isFlush && isStraight && values[0] === 14 && values[4] === 10) {
    return { rank: HandRank.RoyalFlush };
  }

  // Check for straight flush
  if (isFlush && isStraight) {
    return { rank: HandRank.StraightFlush };
  }

  // Count occurrences of each value
  const valueCounts = new Map<number, number>();
  for (const value of values) {
    valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
  }

  // Check for four of a kind
  if (Array.from(valueCounts.values()).includes(4)) {
    return { rank: HandRank.FourOfAKind };
  }

  // Check for full house (three of a kind + pair)
  if (Array.from(valueCounts.values()).includes(3) &&
    Array.from(valueCounts.values()).includes(2)) {
    return { rank: HandRank.FullHouse };
  }

  // Check for flush
  if (isFlush) {
    return { rank: HandRank.Flush };
  }

  // Check for straight
  if (isStraight) {
    return { rank: HandRank.Straight };
  }

  // Check for three of a kind
  if (Array.from(valueCounts.values()).includes(3)) {
    return { rank: HandRank.ThreeOfAKind };
  }

  // Check for two pair
  if (Array.from(valueCounts.values()).filter(count => count === 2).length === 2) {
    return { rank: HandRank.TwoPair };
  }

  // Check for pair
  if (Array.from(valueCounts.values()).includes(2)) {
    return { rank: HandRank.Pair };
  }

  // Default to high card
  return { rank: HandRank.HighCard };
}

// Determine winning hand among multiple players
export function determineWinner(playerHands: {
  userId: string,
  cards: Card[],
  folded: boolean
}[], communityCards: Card[]): {
  winnerId: string,
  winningHand: {
    rank: HandRank,
    description: string,
    bestHand: Card[]
  }
} | null {
  // Filter out folded players
  const activePlayers = playerHands.filter(player => !player.folded);

  if (activePlayers.length === 0) {
    return null;
  }

  if (activePlayers.length === 1) {
    // Only one player left, they automatically win
    const winner = activePlayers[0];
    // Combine player cards with community cards for evaluation
    const allCards = [...winner.cards, ...communityCards];
    const handResult = evaluateHand(allCards);
    if (!handResult) return null;
    return {
      winnerId: winner.userId,
      winningHand: {
        rank: handResult.rank as HandRank,
        description: handResult.description,
        bestHand: handResult.bestHand
      }
    };
  }

  // Evaluate hands for all active players
  const evaluatedHands = activePlayers.map(player => {
    const allCards = [...player.cards, ...communityCards];
    return {
      userId: player.userId,
      evaluation: evaluateHand(allCards)
    };
  }).filter(hand => hand.evaluation !== null);

  if (evaluatedHands.length === 0) return null;

  // Sort by hand rank (highest first)
  evaluatedHands.sort((a, b) => b.evaluation!.rank - a.evaluation!.rank);

  // Get the highest rank
  const highestRank = evaluatedHands[0].evaluation!.rank;

  // Filter players with the highest rank
  const playersWithHighestRank = evaluatedHands.filter(
    player => player.evaluation!.rank === highestRank
  );

  // If only one player has the highest rank, they win
  if (playersWithHighestRank.length === 1) {
    const result = playersWithHighestRank[0].evaluation!;
    return {
      winnerId: playersWithHighestRank[0].userId,
      winningHand: {
        rank: result.rank as HandRank,
        description: result.description,
        bestHand: result.bestHand
      }
    };
  }

  // Tiebreaker logic would go here for hands of the same rank
  // For now, just return the first player with the highest rank
  const result = playersWithHighestRank[0].evaluation!;
  return {
    winnerId: playersWithHighestRank[0].userId,
    winningHand: {
      rank: result.rank as HandRank,
      description: result.description,
      bestHand: result.bestHand
    }
  };
} 