import { TexasHoldem } from 'poker-odds-calc';

// Convert card format from "AH" to "Ah" for poker-odds-calc
function convertCardFormat(card: string): string {
  const rank = card[0].toUpperCase();
  const suit = card[1].toLowerCase();
  return `${rank}${suit}`;
}

// Convert array of cards to hand type
function convertToHand(cards: string[]): [string, string] {
  if (cards.length !== 2) {
    throw new Error('Hand must have exactly 2 cards');
  }
  const formattedCards = cards.map(convertCardFormat);
  return [formattedCards[0], formattedCards[1]];
}

interface Player {
  id: string;
  cards: string[];
  folded: boolean;
}

// Calculate win probability for multiple players
export function calculateWinProbability(
  players: Player[],
  communityCards: string[],
  remainingCards: number = 0
): { [key: string]: number } {
  try {
    void remainingCards;
    const game = new TexasHoldem();
    
    const activaPlayerIndex: number[] = []
    // Add active players to the game
    const activePlayers = players.filter((p, index) => {
      if (!p.folded && p.cards.length === 2) {
        activaPlayerIndex.push(index)
      }
      return !p.folded && p.cards.length === 2
    });
    
    // If only one active player, they have 100% win probability
    if (activePlayers.length === 1) {
      const result: { [key: string]: number } = {};
      players.forEach(p => {
        result[p.id] = p.folded ? 0 : 100;
      });
      return result;
    }

    // Add players to the game
    activePlayers.forEach(player => {
      game.addPlayer(convertToHand(player.cards));
    });

    // Add community cards if any
    if (communityCards.length > 0) {
      const formattedCommunityCards = communityCards.map(convertCardFormat);
      game.setBoard(formattedCommunityCards);
    }

    // Calculate odds
    const result = game.calculate();
    const calcPlayers = result.getPlayers()
    
    // Map results back to player IDs
    const winProbabilities: { [key: string]: number } = {};
    players.forEach((player, index) => {
      if (player.folded) {
        winProbabilities[player.id] = 0;
      } else {
        const activePlayerIndex = activaPlayerIndex.findIndex(i => i === index)
        winProbabilities[player.id] = calcPlayers[activePlayerIndex].getWinsPercentage();
      }
    });

    return winProbabilities;
  } catch (error) {
    console.error('Error calculating win probability:', error);
    // Return 0% for all players on error
    return players.reduce((acc, player) => {
      acc[player.id] = 0;
      return acc;
    }, {} as { [key: string]: number });
  }
}

// Calculate hand strength (0-1)
export function getHandStrength(playerCards: string[], communityCards: string[]): number {
  try {
    const game = new TexasHoldem();
    const convertedCards = convertToHand(playerCards)
    game.addPlayer(convertedCards);
    const baseCards: string[] = [];
    (["2d", "2s", "2h", "2c", "7d", "7s", "7h", "7c"] as string[]).forEach((card: string) => {
      if(!convertedCards.includes(card) && baseCards.length <2) {
        baseCards.push(card)
      }
    })
    // 这个作为基准
    game.addPlayer([baseCards[0], baseCards[1]])
    if (communityCards.length > 0) {
      const formattedCommunityCards = communityCards.map(convertCardFormat);
      game.setBoard(formattedCommunityCards);
    }
    
    const result = game.calculate();
    const players = result.getPlayers();
    return players[0].getWinsPercentage() / 100;
  } catch (error) {
    console.error('Error calculating hand strength:', error);
    return 0;
  }
}

// These functions are no longer needed as poker-odds-calc handles card management
export function getRemainingCards(usedCards: string[]): string[] {
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const suits = ['h', 'd', 'c', 's'];
  
  const allCards = ranks.flatMap(rank => 
    suits.map(suit => rank + suit)
  );
  
  return allCards.filter(card => !usedCards.includes(card));
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
