import React from 'react';
import PlayerStatus from './PlayerStatus';
import { PlayerInfo } from './Player';

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
  return (
    <div className="fixed left-0 top-0 w-72 h-full pointer-events-none">
      <div className="relative w-full h-full">
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
    </div>
  );
};

export default PlayerStatusBar; 