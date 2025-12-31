import React, { useEffect, useState } from 'react';

interface PlayerStatusProps {
  playerId: string;
  playerName: string;
  isCurrentTurn: boolean;
  lastAction?: string;
  chips: number;
  totalBet: number;
  isDealer: boolean;
  isActive: boolean;
  index: number;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({
  playerName,
  isCurrentTurn,
  lastAction,
  chips,
  totalBet,
  isDealer,
  isActive,
  index
}) => {
  // Calculate vertical position based on index
  const topPosition = 20 + (index * 90); // 90px spacing between cards
  
  // State to track if there's a new action to highlight
  const [isNewAction, setIsNewAction] = useState(false);
  
  // Effect to highlight new actions
  useEffect(() => {
    if (lastAction) {
      setIsNewAction(true);
      const timer = setTimeout(() => {
        setIsNewAction(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lastAction]);
  
  return (
    <div 
      className={`
        absolute left-4 w-64 bg-gray-900 border rounded-lg shadow-lg 
        overflow-hidden z-30 transition-all duration-300 pointer-events-auto
        ${isCurrentTurn ? 'border-yellow-400 shadow-yellow-400/30' : 'border-gray-700'}
        ${isNewAction ? 'scale-105' : 'scale-100'}
      `}
      style={{ top: `${topPosition}px` }}
    >
      <div className={`
        px-3 py-2 flex justify-between items-center
        ${isCurrentTurn ? 'bg-yellow-900' : isNewAction ? 'bg-blue-900' : 'bg-gray-800'}
      `}>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isCurrentTurn ? 'text-yellow-100' : 'text-white'}`}>
            {playerName}
          </span>
          {isDealer && (
            <span className="bg-blue-500 text-white text-xs px-1 rounded-full">D</span>
          )}
          {isCurrentTurn && (
            <span className="animate-pulse bg-yellow-500 text-black text-xs px-2 rounded-full font-bold">
              TURN
            </span>
          )}
        </div>
        <div className="text-yellow-300 font-bold">${chips}</div>
      </div>
      
      <div className="p-3">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-sm">Current bet:</span>
          <span className="text-white font-bold">${totalBet}</span>
        </div>
        
        {lastAction && (
          <div className="mt-2 text-center">
            <span className={`
              px-2 py-1 rounded-full text-sm transition-all duration-300
              ${isNewAction 
                ? 'bg-blue-700 text-white font-bold' 
                : 'bg-gray-800 text-white'}
            `}>
              {lastAction}
            </span>
          </div>
        )}
        
        {!isActive && (
          <div className="mt-2 text-center">
            <span className="bg-red-900 text-white px-2 py-1 rounded-full text-sm">
              Folded
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerStatus; 