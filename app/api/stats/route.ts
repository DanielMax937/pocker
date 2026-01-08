import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    totalActions: number;
    foldCount: number;
    callCount: number;
    raiseCount: number;
    checkCount: number;
    allInCount: number;
}

export async function GET() {
    try {
        // Get all games with their actions
        const games = await prisma.game.findMany({
            include: {
                players: true,
                actions: true,
            },
        });

        // Calculate statistics
        const totalGames = games.length;
        const completedGames = games.filter(g => g.status === 'completed').length;
        const activeGames = games.filter(g => g.status === 'active').length;

        // Count actions by type
        const allActions = games.flatMap(g => g.actions);
        const actionCounts = {
            fold: allActions.filter(a => a.actionType.toLowerCase() === 'fold').length,
            call: allActions.filter(a => a.actionType.toLowerCase() === 'call').length,
            raise: allActions.filter(a => a.actionType.toLowerCase() === 'raise').length,
            check: allActions.filter(a => a.actionType.toLowerCase() === 'check').length,
            allIn: allActions.filter(a => a.actionType.toLowerCase() === 'all_in' || a.actionType.toLowerCase() === 'all-in').length,
            bet: allActions.filter(a => a.actionType.toLowerCase() === 'bet').length,
        };

        // Calculate player-specific stats
        const playerStatsMap = new Map<string, PlayerStats>();

        for (const game of games) {
            for (const player of game.players) {
                const existing = playerStatsMap.get(player.playerId) || {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    winRate: 0,
                    totalActions: 0,
                    foldCount: 0,
                    callCount: 0,
                    raiseCount: 0,
                    checkCount: 0,
                    allInCount: 0,
                };

                existing.gamesPlayed++;

                // Count actions for this player
                const playerActions = game.actions.filter(a => a.playerId === player.id);
                existing.totalActions += playerActions.length;
                existing.foldCount += playerActions.filter(a => a.actionType.toLowerCase() === 'fold').length;
                existing.callCount += playerActions.filter(a => a.actionType.toLowerCase() === 'call').length;
                existing.raiseCount += playerActions.filter(a => a.actionType.toLowerCase() === 'raise').length;
                existing.checkCount += playerActions.filter(a => a.actionType.toLowerCase() === 'check').length;
                existing.allInCount += playerActions.filter(a =>
                    a.actionType.toLowerCase() === 'all_in' || a.actionType.toLowerCase() === 'all-in'
                ).length;

                playerStatsMap.set(player.playerId, existing);
            }
        }

        // Calculate win rates
        const playerStats = Array.from(playerStatsMap.entries()).map(([playerId, stats]) => ({
            playerId,
            ...stats,
            winRate: stats.gamesPlayed > 0
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                : 0,
        }));

        return NextResponse.json({
            overview: {
                totalGames,
                completedGames,
                activeGames,
                totalActions: allActions.length,
            },
            actionCounts,
            playerStats,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
