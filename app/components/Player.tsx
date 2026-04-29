import React from 'react';
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
    <div className={`relative flex flex-col items-center p-3 rounded-lg bg-gray-800 m-2 border-2 ${borderColorClass} ${isCurrentTurn ? 'animate-pulse' : ''}`}>
      <div className="flex justify-between w-full mb-2">
        <div className="flex items-center">
          <span className={`font-bold ${isUser ? 'text-green-400' : 'text-white'} mr-1`}>
            {name} {isAI ? '(AI)' : ''}
          </span>
          {isDealer && (
            <span className="bg-blue-500 text-white text-xs px-1 rounded-full">D</span>
          )}
        </div>
        <span className="text-yellow-300 font-bold">${chips}</span>
      </div>
      
      <div className="flex items-center justify-center gap-2">
        <div className="flex justify-center">
          {cards.map((card, index) => (
            <Card
              key={index}
              card={card}
              faceDown={!showCards && !isUser}
            />
          ))}
          {cards.length === 0 && (
            <div className="text-gray-500 text-sm">No cards</div>
          )}
        </div>
        {debugMode && winProbability !== undefined && (
          <div className="rounded bg-yellow-400 px-2 py-1 text-xs font-bold text-gray-950 shadow">
            Win {winProbability.toFixed(1)}%
          </div>
        )}
      </div>
      
      {lastAction && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-2 py-0.5 rounded-full text-xs">
          {lastAction}
        </div>
      )}
      
      {folded && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
          <span className="text-red-500 font-bold text-lg uppercase">Folded</span>
        </div>
      )}
    </div>
  );
};

export default Player; 
