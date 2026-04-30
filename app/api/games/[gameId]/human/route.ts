import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const actionData = await request.json();

    // Store the user's action reason (pre-action analysis from client)
    if (actionData.actionId && actionData.reason) {
      await prisma.gameAction.update({
        where: {
          id: actionData.actionId,
        },
        data: {
          actionReason: actionData.reason,
        },
      });
    }

    return NextResponse.json({
      ...actionData,
      timestamp: new Date().toISOString(),
      gameId,
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
} 