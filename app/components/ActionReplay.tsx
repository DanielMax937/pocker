import React, { useState, useEffect, useMemo } from 'react';
import { Card as CardType } from '../lib/poker';
import Card from './Card';
import { calculateWinProbability } from '../lib/poker-probability';

interface GameState {
  players: Array<{
    id: string;
    name: string;
    chips: number;
    cards: CardType[];
    folded: boolean;
    isAI?: boolean;
  }>;
  communityCards: CardType[];
  pot: number;
  currentBet: number;
  dealerIndex: number;
  gamePhase: string;
}

interface GameAction {
  id: string;
  playerId: string;
  player: {
    name: string;
    playerId: string;
  };
  actionType: string;
  amount?: number;
  sequenceNumber: number;
  gameState: GameState;
  timestamp: string;
  actionReason?: string
}

interface ActionReplayProps {
  gameId: string;
  onClose: () => void;
}

const ActionReplay: React.FC<ActionReplayProps> = ({ gameId, onClose }) => {
  const [actions, setActions] = useState<GameAction[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/actions?gameId=${gameId}`);
        if (!response.ok) throw new Error('Failed to fetch actions');
        const data = await response.json();
        setActions(data);
        setLoading(false);
      } catch {
        setError('Failed to load game actions');
        setLoading(false);
      }
    };

    fetchActions();
  }, [gameId]);

  const currentAction = actions[currentActionIndex];
  const totalActions = actions.length;

  const goToPreviousAction = () => {
    if (currentActionIndex > 0) {
      setCurrentActionIndex(currentActionIndex - 1);
    }
  };

  const goToNextAction = () => {
    if (currentActionIndex < totalActions - 1) {
      setCurrentActionIndex(currentActionIndex + 1);
    }
  };

  const renderCards = (cards: CardType[] | null | undefined) => {
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return <p className="text-gray-400">No cards</p>;
    }
    return (
      <div className="flex gap-1">
        {cards.map((card, index) => (
          <Card key={index} card={card} />
        ))}
      </div>
    );
  };

  // Calculate win probabilities for current game state
  const winProbabilities = useMemo(() => {
    if (!currentAction) return {};

    const { players, communityCards, gamePhase } = currentAction.gameState;

    // Calculate remaining community cards based on game phase
    let remainingCards = 0;
    switch (gamePhase) {
      case 'PREFLOP':
        remainingCards = 5;
        break;
      case 'FLOP':
        remainingCards = 2;
        break;
      case 'TURN':
        remainingCards = 1;
        break;
      case 'RIVER':
      case 'SHOWDOWN':
        remainingCards = 0;
        break;
    }

    // Convert players to simulation state
    const simPlayers = players.map(p => ({
      id: p.id,
      cards: p.cards || [],
      folded: p.folded
    }));

    return calculateWinProbability(simPlayers, communityCards || [], remainingCards);
  }, [currentAction]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <p className="text-white">Loading actions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <p className="text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  console.log("current", currentAction)

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 p-8 pt-[200px] rounded-lg shadow-xl max-w-4xl w-full text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Action Replay</h2>
          <div>
            <button
              onClick={goToPreviousAction}
              disabled={currentActionIndex === 0}
              className={`px-4 py-2 rounded mr-2 ${currentActionIndex === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              ← Previous
            </button>
            <button
              onClick={goToNextAction}
              disabled={currentActionIndex === totalActions - 1}
              className={`px-4 py-2 rounded mr-2 ${currentActionIndex === totalActions - 1
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              Next →
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {currentAction && (
          <div className="mb-6">
            {/* Community Cards */}
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">Community Cards</h3>
              {renderCards(currentAction.gameState.communityCards)}
              <p className="text-lg mb-2">
                Action {currentActionIndex + 1} of {totalActions}:
                <span className="font-bold ml-2">
                  {currentAction.player.name} {currentAction.actionType}
                  {currentAction.amount ? ` ($${currentAction.amount})` : ''}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Pot: ${currentAction.gameState.pot} |
                Phase: {currentAction.gameState.gamePhase} |
                Current Bet: ${currentAction.gameState.currentBet}
              </p>
            </div>


            {/* Players Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {currentAction.gameState.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg ${player.folded ? 'bg-gray-700 opacity-50' : 'bg-gray-700'
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-sm">
                      Status:{' '}
                      {player.folded
                        ? 'Folded'
                        : player.chips === 0
                          ? 'All-in'
                          : 'Active'}
                    </p>
                  </div>
                  {/* <div className="mb-2">
                    <p>Chips: ${player.chips}</p>
                  </div> */}
                  <div className="mb-2">
                    <p className="text-sm font-semibold mb-1">Hole Cards:</p>
                    {renderCards(player.cards)}
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-semibold mb-1">当前思考:</p>
                    <p className="text-sm text-gray-300">
                      {currentAction.player.playerId === player.id ? currentAction.actionReason : '非操作用户'}
                    </p>
                  </div>
                  {!player.folded && player.cards && player.cards.length > 0 && (
                    <>
                      {/* <div className="mb-2">
                        <p className="text-sm font-semibold">Current Hand:</p>
                        <p className="text-sm text-gray-300">
                          {getHandStrength(player.cards, currentAction.gameState.communityCards || [])}
                        </p>
                      </div> */}
                      <div>
                        <p className="text-sm font-semibold">Win Probability:</p>
                        <p className="text-sm">
                          <span className={`font-mono ${winProbabilities[player.id] > 50 ? 'text-green-400' :
                            winProbabilities[player.id] > 25 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                            {winProbabilities[player.id]?.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Controls */}

      </div>
    </div>
  );
};

export default ActionReplay; 