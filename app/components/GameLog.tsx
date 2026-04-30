import React, { useState } from 'react';
import { useDraggable } from './useDraggable';

interface LogEntry {
  playerId: string;
  playerName: string;
  action: string;
  amount?: number;
  timestamp: number;
  aiAnalysis?: string;
  personalityName?: string;  // AI个性名称
}

interface GameLogProps {
  logs: LogEntry[];
  isVisible: boolean;
  onClose: () => void;
  debugMode?: boolean;
}

const GameLog: React.FC<GameLogProps> = ({ logs, isVisible, onClose, debugMode = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { position, onMouseDown } = useDraggable({
    initialPosition: () => ({ x: window.innerWidth - 336, y: window.innerHeight - 150 }),
  });

  if (!isVisible) return null;

  return (
    <div
      className="w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-white z-40 overflow-hidden flex flex-col"
      style={{ position: 'fixed', left: position.x, top: position.y }}
    >
      <div
        className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
      >
        <h3 className="font-bold">Game Log</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            ×
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2 max-h-80 overflow-y-auto flex-1">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No actions yet</p>
          ) : (
            <ul className="space-y-1">
              {[...logs].reverse().map((log, index) => (
                <li key={index} className="text-sm border-b border-gray-800 pb-1 last:border-0">
                  <span className="text-blue-400">{log.playerName}</span>
                  {log.personalityName && (
                    <span className="text-orange-400 text-xs ml-1">[{log.personalityName}]</span>
                  )}
                  <span className="text-gray-300"> {log.action}</span>
                  {log.amount !== undefined && (
                    <span className="text-yellow-400"> ${log.amount}</span>
                  )}
                  {debugMode && log.aiAnalysis && (
                    <div className="mt-1 rounded bg-gray-800 p-2 text-xs leading-relaxed text-gray-300">
                      <span className="font-semibold text-purple-300">LLM Analysis: </span>
                      {log.aiAnalysis}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default GameLog;
