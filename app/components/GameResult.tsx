import React from 'react';
import { PlayerInfo } from './Player';
import { Card as CardType } from '../lib/poker';

interface GameResultProps {
  winner: PlayerInfo;
  handDescription: string;
  handRank: number;
  pot: number;
  bestHand: CardType[];
  isUser: boolean;
  onPlayAgain: () => void;
  onReview: () => void;
  isReviewMode: boolean;
}

const GameResult: React.FC<GameResultProps> = ({
  winner,
  handDescription,
  pot,
  isUser,
  onPlayAgain,
  onReview,
  isReviewMode,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isUser ? 'You Won!' : `${winner.name} Wins!`}
        </h2>
        <div className="mb-6">
          <p className="text-lg mb-2">Winning Hand: {handDescription}</p>
          <p className="text-lg mb-4">Pot: ${pot}</p>
        </div>
        <div className="flex flex-col gap-3">
          {!isReviewMode && (
            <button
              onClick={onReview}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold"
            >
              Review Hand
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold"
          >
            {isReviewMode ? 'Start New Hand' : 'Play Again'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResult; 