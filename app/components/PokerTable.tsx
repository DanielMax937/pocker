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
  debugMode?: boolean;
  winProbabilities?: Record<string, number>;
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
  debugMode = false,
  winProbabilities = {},
}) => {
  const renderPositions = () => {
    // Vertical oval positions - clockwise starting from bottom center
    // Positions are percentage-based for responsive layout
    const positionSets: Record<number, Array<React.CSSProperties>> = {
      // 4 players (1 human + 3 AI)
      4: [
        { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
        { top: '35%', right: '-12%', transform: 'translateY(-50%)' },
        { top: '0', left: '50%', transform: 'translateX(-50%)' },
        { top: '35%', left: '-12%', transform: 'translateY(-50%)' },
      ],
      // 5 players (1 human + 4 AI)
      5: [
        { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '15%', right: '-10%' },
        { top: '10%', right: '-10%' },
        { top: '0', left: '50%', transform: 'translateX(-50%)' },
        { top: '10%', left: '-10%' },
      ],
      // 6 players (1 human + 5 AI)
      6: [
        { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '30%', right: '-12%' },
        { top: '10%', right: '-12%' },
        { top: '0', left: '50%', transform: 'translateX(-50%)' },
        { top: '10%', left: '-12%' },
        { bottom: '30%', left: '-12%' },
      ],
      // 7 players (1 human + 6 AI)
      7: [
        { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '35%', right: '-14%' },
        { top: '12%', right: '-12%' },
        { top: '0', left: '38%', transform: 'translateX(-50%)' },
        { top: '0', left: '62%', transform: 'translateX(-50%)' },
        { top: '12%', left: '-12%' },
        { bottom: '35%', left: '-14%' },
      ],
      // 8 players (1 human + 7 AI)
      8: [
        { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '35%', right: '-14%' },
        { top: '20%', right: '-14%' },
        { top: '5%', right: '8%' },
        { top: '0', left: '50%', transform: 'translateX(-50%)' },
        { top: '5%', left: '8%' },
        { top: '20%', left: '-14%' },
        { bottom: '35%', left: '-14%' },
      ],
    };

    const positions = positionSets[players.length] || positionSets[8];

    // Sort players so the user is at position 0
    const userIndex = players.findIndex(p => p.id === userId);
    const sortedPlayers = [...players];
    if (userIndex !== -1 && userIndex !== 0) {
      const beforeUser = sortedPlayers.splice(0, userIndex);
      sortedPlayers.push(...beforeUser);
    }

    return sortedPlayers.map((player, index) => {
      if (index >= positions.length) return null;

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
            debugMode={debugMode}
            winProbability={winProbabilities[player.id]}
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
    <div className="relative w-full max-w-3xl mx-auto h-[350px] sm:h-[420px] md:h-[500px] bg-green-800 rounded-[50%] border-4 sm:border-8 border-brown-900 overflow-visible">
      {/* Center area with community cards and pot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-green-900 p-2 rounded-lg mb-1">
          <div className="flex mb-1">
            {communityCards.map((card, index) => (
              <Card key={index} card={card} size="compact" />
            ))}
            {communityCards.length === 0 && (
              <div className="text-white text-xs px-3 py-1">{getTableMessage()}</div>
            )}
          </div>
        </div>

        <div className="bg-black bg-opacity-40 px-2 sm:px-3 py-1 rounded-lg">
          <div className="text-yellow-300 font-bold text-sm sm:text-base">${pot}</div>
        </div>

        <div className="mt-1 bg-blue-900 text-white px-2 py-0.5 rounded-lg text-xs">
          {gamePhase || "Waiting to start"}
        </div>
      </div>

      {/* Players positioned around the table */}
      {renderPositions()}
    </div>
  );
};

export default PokerTable;
