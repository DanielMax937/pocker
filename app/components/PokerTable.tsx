import React from 'react';
import Card from './Card';
import Player, { PlayerInfo } from './Player';
import { Card as CardType } from '../lib/poker';

interface PokerTableProps {
  players: PlayerInfo[];
  communityCards: CardType[];
  pot: number;
  currentPlayerIndex: number;
  dealerIndex: number;
  gamePhase: string;
  userId: string;
  showdown: boolean;
}

const PokerTable: React.FC<PokerTableProps> = ({
  players,
  communityCards,
  pot,
  currentPlayerIndex,
  dealerIndex,
  gamePhase,
  userId,
  showdown,
}) => {
  const renderPositions = () => {
    // Calculate positions for players around the table
    const positions = [
      // Bottom center (user position)
      { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
      // Bottom right
      { bottom: '5%', right: '5%' },
      // Right center
      { top: '40%', right: '0' },
      // Top right
      { top: '5%', right: '5%' },
      // Top center
      { top: '0', left: '50%', transform: 'translateX(-50%)' },
      // Top left
      { top: '5%', left: '5%' },
      // Left center
      { top: '40%', left: '0' },
      // Bottom left
      { bottom: '5%', left: '5%' },
    ];

    // Sort players so the user is at position 0
    const userIndex = players.findIndex(p => p.id === userId);
    const sortedPlayers = [...players];
    if (userIndex !== -1 && userIndex !== 0) {
      const beforeUser = sortedPlayers.splice(0, userIndex);
      sortedPlayers.push(...beforeUser);
    }

    return sortedPlayers.map((player, index) => {
      if (index >= positions.length) return null; // Safety check
      
      const isUser = player.id === userId;
      const isDealer = players.indexOf(player) === dealerIndex;
      
      return (
        <div 
          key={player.id} 
          className="absolute" 
          style={positions[index]}
        >
          <Player 
            player={{
              ...player,
              isCurrentTurn: currentPlayerIndex === players.indexOf(player),
              isDealer
            }} 
            showCards={showdown || isUser}
            isUser={isUser}
          />
        </div>
      );
    });
  };

  // Get appropriate message for current game state
  const getTableMessage = () => {
    if (!gamePhase) return "Click 'Start Game' to begin";
    if (communityCards.length === 0 && gamePhase === 'PREFLOP') return "Pre-flop betting round";
    if (communityCards.length === 0) return "Waiting for cards";
    return "";
  };

  return (
    <div className="relative w-full h-[500px] bg-green-800 rounded-full border-8 border-brown-900 overflow-hidden">
      {/* Center area with community cards and pot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-green-900 p-3 rounded-lg mb-2">
          <div className="flex mb-2">
            {communityCards.map((card, index) => (
              <Card key={index} card={card} />
            ))}
            {communityCards.length === 0 && (
              <div className="text-white text-sm px-4 py-2">{getTableMessage()}</div>
            )}
          </div>
        </div>
        
        <div className="bg-black bg-opacity-40 px-4 py-2 rounded-lg">
          <div className="text-yellow-300 font-bold text-xl">${pot}</div>
        </div>
        
        <div className="mt-2 bg-blue-900 text-white px-3 py-1 rounded-lg text-sm">
          {gamePhase || "Waiting to start"}
        </div>
      </div>
      
      {/* Players positioned around the table */}
      {renderPositions()}
    </div>
  );
};

export default PokerTable; 