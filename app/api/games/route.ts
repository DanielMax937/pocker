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
          }
        }
      },
    });

    return NextResponse.json(games);
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