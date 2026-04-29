import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface PlayerCreateData {
  playerId: string;
  name: string;
  position: number;
  startingChips: number;
}

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        players: true,
        actions: {
          include: {
            player: true
          },
          orderBy: {
            sequenceNumber: 'desc'
          }
        }
      },
    });

    // Derive winner from last action's game state
    const gamesWithWinner = games.map((game) => {
      const lastAction = game.actions[0]; // already sorted desc
      let winner = null;

      if (lastAction?.gameState) {
        const state = lastAction.gameState as Record<string, unknown>;
        const statePlayers = state.players as Array<{ id: string; name: string; chips: number; folded?: boolean }> | undefined;
        if (statePlayers) {
          // Winner is last player standing (not folded) or player with most chips
          const activePlayers = statePlayers.filter((p) => !p.folded);
          const winnerPlayer = activePlayers.length === 1
            ? activePlayers[0]
            : statePlayers.reduce((a, b) => (a.chips > b.chips ? a : b));

          // Map back to game player record
          const gamePlayer = game.players.find((p) => p.playerId === winnerPlayer.id);
          if (gamePlayer) {
            winner = { id: gamePlayer.id, name: gamePlayer.name };
          }
        }
      }

      return {
        ...game,
        actions: game.actions.reverse(), // restore chronological order
        winner,
      };
    });

    return NextResponse.json(gamesWithWinner);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { players } = body;

    // Create a new game with its players
    const game = await prisma.game.create({
      data: {
        status: 'active',
        players: {
          create: players.map((player: PlayerCreateData) => ({
            playerId: player.playerId,
            name: player.name,
            position: player.position,
            startingChips: player.startingChips,
          })),
        },
      },
      include: {
        players: true,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
} 