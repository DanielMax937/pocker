import { NextResponse } from 'next/server';
import { analyzePlayerAction } from '@/app/lib/action-analyzer';
import prisma from '@/app/lib/prisma';

interface GameActionRecord {
  player: {
    name: string;
  };
  actionType: string;
  amount?: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }

) {
  try {
    const { gameId } = await params;
    const actionData = await request.json();

    // Fetch current game state
    const gameStateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/games/${gameId}?gameId=${gameId}`);
    const gameState = await gameStateResponse.json();

    // Fetch game history
    const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/games/${gameId}/actions?gameId=${gameId}`);
    const actions = await historyResponse.json();
    const gameHistory = actions.map((action: GameActionRecord, index: number) =>
      `${index + 1}. ${action.player.name} ${action.actionType}${action.amount ? ` $${action.amount}` : ''}`
    );

    // Analyze the action if it's a human player
    let actionAnalysis = null;
    actionAnalysis = await analyzePlayerAction(
      actionData,
      gameState,
      gameId,
      gameHistory
    );

    await prisma.gameAction.update({
      where: {
        id: actionData.actionId!,
      },
      data: {
        actionReason: `isGoodAction: ${actionAnalysis?.isGoodAction}, reason: ${actionAnalysis?.reason}, suggestedAction: ${actionAnalysis?.suggestedAction?.action} ${actionAnalysis?.suggestedAction?.amount ? ` $${actionAnalysis?.suggestedAction?.amount}` : ''}`,
      },
    });

    // Add analysis to action data if available
    const enrichedActionData = {
      ...actionData,
      analysis: actionAnalysis,
      timestamp: new Date().toISOString(),
      gameId,
    };

    // Store the action in your database
    // TODO: Implement your database storage logic here
    // For example:
    // await db.actions.create(enrichedActionData);

    return NextResponse.json(enrichedActionData, { status: 200 });
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
} 