import React, { useState } from 'react';

interface ActionControlsProps {
  currentBet: number;
  playerChips: number;
  playerContribution: number;
  isPlayerTurn: boolean;
  canCheck: boolean;
  canRaise: boolean;
  onFold: () => void;
  onCheck: () => void;
  onCall: (amount: number) => void;
  onBet: (amount: number) => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
}

const ActionControls: React.FC<ActionControlsProps> = ({
  currentBet,
  playerChips,
  playerContribution,
  isPlayerTurn,
  canCheck,
  onFold,
  onCheck,
  onCall,
  onBet,
  onRaise,
  onAllIn,
}) => {
  const [betAmount, setBetAmount] = useState<number>(currentBet > 0 ? currentBet * 2 : 20);
  
  // Calculate how much the player needs to call
  const amountToCall = currentBet - playerContribution;
  
  // Determine if player can afford calling
  const canAffordCall = playerChips >= amountToCall;
  
  // Determine minimum bet/raise (double the current bet or 20 if no bet)
  const minimumBet = currentBet > 0 ? currentBet * 2 : 20;
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(parseInt(e.target.value));
  };

  if (!isPlayerTurn) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-center">
        <p className="text-white">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          onClick={onFold}
        >
          Fold
        </button>
        
        {canCheck ? (
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            onClick={onCheck}
          >
            Check
          </button>
        ) : (
          <button
            className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded ${!canAffordCall ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onCall(amountToCall)}
            disabled={!canAffordCall}
          >
            Call ${amountToCall}
          </button>
        )}
        
        {currentBet === 0 ? (
          <button
            className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded ${betAmount > playerChips ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onBet(betAmount)}
            disabled={betAmount > playerChips}
          >
            Bet ${betAmount}
          </button>
        ) : (
          <button
            className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded ${betAmount > playerChips || betAmount <= currentBet ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onRaise(betAmount)}
            disabled={betAmount > playerChips || betAmount <= currentBet}
          >
            Raise to ${betAmount}
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm mb-1">
          {currentBet === 0 ? 'Bet Amount' : 'Raise Amount'}
        </label>
        <input
          type="range"
          min={minimumBet}
          max={playerChips}
          value={betAmount}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs mt-1">
          <span>${minimumBet}</span>
          <span>${betAmount}</span>
          <span>${playerChips}</span>
        </div>
      </div>
      
      <button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
        onClick={onAllIn}
      >
        All-In ${playerChips}
      </button>
    </div>
  );
};

export default ActionControls; 