import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface PlayerInfo {
  id: string;
  name: string;
  position?: number;
  chips: number;
}

interface GameStateWithPlayers {
  players: PlayerInfo[];
}

// Get all actions for a game
export async function GET(
  request: Request,
) {
  try {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('gameId');
    const actions = await prisma.gameAction.findMany({
      where: {
        gameId: gameId!,
      },
      include: {
        player: true,
      },
      orderBy: {
        sequenceNumber: 'asc',
      },
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error('Error fetching game actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game actions' },
      { status: 500 }
    );
  }
}

// Create a new action
export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();
    const { playerId, actionType, amount, gameState, reason, gameId } = body;
    // First, ensure the GamePlayer exists
    let player = await prisma.gamePlayer.findFirst({
      where: {
        AND: [
          { gameId: gameId! },
          { playerId: playerId }
        ]
      }
    });

    // If player doesn't exist, create them
    if (!player) {
      const playerInfo = (gameState as GameStateWithPlayers).players.find((p: PlayerInfo) => p.id === playerId);
      if (!playerInfo) {
        return NextResponse.json(
          { error: 'Player information not found in game state' },
          { status: 400 }
        );
      }

      const url = new URL(request.url);
      const gameId = url.searchParams.get('gameId');
      player = await prisma.gamePlayer.create({
        data: {
          gameId: gameId!,
          playerId: playerId,
          name: playerInfo.name,
          position: playerInfo.position || 0,
          startingChips: playerInfo.chips,
        },
      });
    }
    // Get the latest sequence number for this game
    const latestAction = await prisma.gameAction.findFirst({
      where: { gameId: gameId! },
      orderBy: { sequenceNumber: 'desc' },
    });

    const newSequenceNumber = (latestAction?.sequenceNumber ?? 0) + 1;

    // Create the action with the confirmed player
    const action = await prisma.gameAction.create({
      data: {
        gameId: gameId!,
        playerId: player.id, // Use the GamePlayer's ID
        actionType,
        amount: amount/1,
        gameState,
        sequenceNumber: newSequenceNumber,
        actionReason: reason
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error('Error creating game action:', error);
    return NextResponse.json(
      { error: 'Failed to create game action' },
      { status: 500 }
    );
  }
} 