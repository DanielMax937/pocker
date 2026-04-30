import React from 'react';
import { Card as CardType } from '../lib/poker';

interface CardProps {
  card: CardType | null;
  faceDown?: boolean;
  size?: 'compact' | 'full';
}

const getCardColor = (card: string): string => {
  if (!card) return '';
  const suit = card[1];
  return (suit === 'H' || suit === 'D') ? 'text-red-500' : 'text-black';
};

const getSuitSymbol = (suit: string): string => {
  switch (suit) {
    case 'H': return '♥';
    case 'D': return '♦';
    case 'C': return '♣';
    case 'S': return '♠';
    default: return '';
  }
};

const getValueDisplay = (value: string): string => {
  switch (value) {
    case 'T': return '10';
    case 'J': return 'J';
    case 'Q': return 'Q';
    case 'K': return 'K';
    case 'A': return 'A';
    default: return value;
  }
};

const Card: React.FC<CardProps> = ({ card, faceDown = false, size = 'full' }) => {
  if (!card) return null;

  const sizeClasses = size === 'compact'
    ? { container: 'w-10 h-14', text: 'text-[10px]', suit: 'text-sm', inner: 'h-10 w-6' }
    : { container: 'w-16 h-24', text: 'text-sm', suit: 'text-2xl', inner: 'h-16 w-10' };

  if (faceDown) {
    return (
      <div className={`${sizeClasses.container} rounded-md bg-blue-800 border-2 border-white shadow-md m-0.5 flex items-center justify-center`}>
        <div className={`bg-white ${sizeClasses.inner} rounded opacity-20`}></div>
      </div>
    );
  }

  const value = card[0];
  const suit = card[1];
  const colorClass = getCardColor(card);

  return (
    <div className={`${sizeClasses.container} rounded-md bg-white border-2 border-gray-300 shadow-md m-0.5 relative flex flex-col items-center justify-center`}>
      <div className={`absolute top-0.5 left-1 ${colorClass} ${sizeClasses.text} font-bold`}>
        {getValueDisplay(value)}
      </div>
      <div className={`absolute bottom-0.5 right-1 ${colorClass} ${sizeClasses.text} font-bold`}>
        {getValueDisplay(value)}
      </div>
      <div className={`${sizeClasses.suit} ${colorClass}`}>
        {getSuitSymbol(suit)}
      </div>
    </div>
  );
};

export default Card;
