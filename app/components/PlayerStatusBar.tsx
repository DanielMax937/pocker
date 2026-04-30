import React, { useState } from 'react';
import PlayerStatus from './PlayerStatus';
import { PlayerInfo } from './Player';
import { useDraggable } from './useDraggable';

interface PlayerStatusBarProps {
  players: PlayerInfo[];
  currentPlayerIndex: number;
  dealerIndex: number;
  playerContributions: Record<string, number>;
}

const PlayerStatusBar: React.FC<PlayerStatusBarProps> = ({
  players,
  currentPlayerIndex,
  dealerIndex,
  playerContributions
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { position, onMouseDown } = useDraggable({
    initialPosition: { x: 0, y: 120 },
  });

  return (
    <div
      className="w-72 pointer-events-none"
      style={{ position: 'fixed', left: position.x, top: position.y }}
    >
      <div
        className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700 cursor-grab active:cursor-grabbing pointer-events-auto select-none"
        onMouseDown={onMouseDown}
      >
        <h3 className="font-bold text-white text-sm">Players</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="text-gray-400 hover:text-white focus:outline-none pointer-events-auto"
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="relative w-full pointer-events-auto">
          {players.map((player, index) => (
            <PlayerStatus
              key={player.id}
              playerId={player.id}
              playerName={player.name}
              isCurrentTurn={index === currentPlayerIndex}
              lastAction={player.lastAction}
              chips={player.chips}
              totalBet={playerContributions[player.id] || 0}
              isDealer={index === dealerIndex}
              isActive={!player.folded}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerStatusBar;
