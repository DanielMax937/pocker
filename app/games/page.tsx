'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithTimeout } from '@/lib/client-api';

interface Game {
  id: string;
  createdAt: string;
  players: {
    id: string;
    name: string;
    startingChips: number;
  }[];
  winner?: {
    id: string;
    name: string;
  };
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetchWithTimeout('/api/games', {
        method: 'GET',
        timeoutMs: 120000,
        retries: 1,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data);
      setLoading(false);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Request timed out. Try again in a few seconds.'
            : err.message
          : 'Failed to load games';
      setError(msg);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-xl text-gray-600">Loading games...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Game History</h1>
        <Link 
          href="/play" 
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        >
          Play New Game
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <p className="text-xl mb-4">No games played yet</p>
          <Link 
            href="/play" 
            className="text-green-600 hover:text-green-700 underline"
          >
            Start your first game
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Game #{game.id.slice(0, 8)}
                  </h2>
                  <p className="text-gray-600">
                    Played on {new Date(game.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/play?gameId=${game.id}&mode=review`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Review Game
                </Link>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Players:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {game.players.map((player) => (
                    <div 
                      key={player.id}
                      className={`p-2 rounded ${
                        game.winner?.id === player.id 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100'
                      }`}
                    >
                      <div className={`font-medium ${game.winner?.id === player.id ? '' : 'text-[#999]'}`}>{player.name}</div>
                      <div className="text-sm">
                        {game.winner?.id === player.id && '👑 Winner'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}