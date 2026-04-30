import React, { useState } from 'react';
import Card from './Card';
import { Card as CardType } from '../lib/poker';

export interface PlayerInfo {
  id: string;
  name: string;
  chips: number;
  cards?: CardType[];
  folded?: boolean;
  isActive?: boolean;
  isCurrentTurn?: boolean;
  lastAction?: string;
  isDealer?: boolean;
  isAI?: boolean;
  personalityName?: string;  // 个性名称
  personalityType?: string;  // 个性类型
}

interface PlayerProps {
  player: PlayerInfo;
  showCards?: boolean;
  isUser?: boolean;
  debugMode?: boolean;
  winProbability?: number;
}

const Player: React.FC<PlayerProps> = ({
  player,
  showCards = false,
  isUser = false,
  debugMode = false,
  winProbability
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    name,
    chips,
    cards = [],
    folded = false,
    isActive = true,
    isCurrentTurn = false,
    lastAction,
    isDealer,
    isAI
  } = player;

  // Determine border color based on player state
  let borderColorClass = 'border-gray-300';
  if (isCurrentTurn) borderColorClass = 'border-yellow-400';
  if (!isActive) borderColorClass = 'border-red-500';
  if (folded) borderColorClass = 'border-gray-500';

  return (
    <div
      className="relative"
      style={{ zIndex: isHovered ? 9999 : 'auto' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact player card */}
      <div className={`flex flex-col items-center p-1.5 rounded-lg bg-gray-800 m-1 border-2 ${borderColorClass} ${isCurrentTurn ? 'animate-pulse' : ''} min-w-[80px]`}>
        <div className="flex items-center gap-1 mb-1">
          <span className={`font-bold text-xs ${isUser ? 'text-green-400' : 'text-white'} truncate max-w-[60px]`}>
            {name}
          </span>
          {isDealer && (
            <span className="bg-blue-500 text-white text-[10px] px-1 rounded-full leading-tight">D</span>
          )}
        </div>

        <div className="flex justify-center">
          {cards.map((card, index) => (
            <Card
              key={index}
              card={card}
              faceDown={!showCards && !isUser}
              size="compact"
            />
          ))}
          {cards.length === 0 && (
            <div className="text-gray-500 text-[10px]">--</div>
          )}
        </div>

        <div className="text-yellow-300 text-[10px] font-bold mt-0.5">${chips}</div>

        {debugMode && winProbability !== undefined && (
          <div className="rounded bg-yellow-400 px-1 text-[10px] font-bold text-gray-950 mt-0.5">
            {winProbability.toFixed(0)}%
          </div>
        )}

        {lastAction && (
          <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[80px]">
            {lastAction}
          </div>
        )}

        {folded && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
            <span className="text-red-500 font-bold text-xs uppercase">Fold</span>
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 border border-gray-600 rounded-xl p-4 shadow-2xl min-w-[200px] pointer-events-none">
          <div className="flex items-center justify-between mb-2">
            <span className={`font-bold text-base ${isUser ? 'text-green-400' : 'text-white'}`}>
              {name} {isAI ? '(AI)' : ''}
            </span>
            {isDealer && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">Dealer</span>
            )}
          </div>
          {isAI && player.personalityName && (
            <div className="text-orange-400 text-xs mb-2">个性: {player.personalityName}</div>
          )}

          <div className="text-yellow-300 font-bold text-sm mb-2">Chips: ${chips}</div>

          <div className="flex justify-center gap-1 mb-2">
            {cards.map((card, index) => (
              <Card
                key={index}
                card={card}
                faceDown={!showCards && !isUser}
                size="full"
              />
            ))}
            {cards.length === 0 && (
              <div className="text-gray-500 text-sm">No cards</div>
            )}
          </div>

          {debugMode && winProbability !== undefined && (
            <div className="text-center rounded bg-yellow-400 px-2 py-1 text-xs font-bold text-gray-950">
              Win Probability: {winProbability.toFixed(1)}%
            </div>
          )}

          {lastAction && (
            <div className="text-gray-400 text-xs mt-1 text-center">Last: {lastAction}</div>
          )}

          {isCurrentTurn && (
            <div className="text-yellow-400 text-xs mt-1 text-center font-bold">Current Turn</div>
          )}

          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default Player;
