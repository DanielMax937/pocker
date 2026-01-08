'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StatsData {
    overview: {
        totalGames: number;
        completedGames: number;
        activeGames: number;
        totalActions: number;
    };
    actionCounts: {
        fold: number;
        call: number;
        raise: number;
        check: number;
        allIn: number;
        bet: number;
    };
    playerStats: Array<{
        playerId: string;
        gamesPlayed: number;
        gamesWon: number;
        winRate: number;
        totalActions: number;
        foldCount: number;
        callCount: number;
        raiseCount: number;
        checkCount: number;
        allInCount: number;
    }>;
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
    );
}

export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/stats');
                if (!response.ok) throw new Error('Failed to fetch stats');
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading statistics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-red-500 text-xl">Error: {error}</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-gray-400 text-xl">No statistics available</div>
            </div>
        );
    }

    const totalActionCount = Object.values(stats.actionCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Poker Statistics</h1>
                    <Link href="/play" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold">
                        Play Now
                    </Link>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Games" value={stats.overview.totalGames} />
                    <StatCard title="Completed Games" value={stats.overview.completedGames} />
                    <StatCard title="Active Games" value={stats.overview.activeGames} />
                    <StatCard title="Total Actions" value={stats.overview.totalActions} />
                </div>

                {/* Action Distribution */}
                <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
                    <h2 className="text-xl font-bold mb-4">Action Distribution</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Object.entries(stats.actionCounts).map(([action, count]) => (
                            <div key={action} className="bg-gray-700 rounded-lg p-4 text-center">
                                <p className="text-gray-400 text-sm capitalize">{action.replace('_', ' ')}</p>
                                <p className="text-2xl font-bold text-white">{count}</p>
                                <p className="text-gray-500 text-xs">
                                    {totalActionCount > 0 ? Math.round((count / totalActionCount) * 100) : 0}%
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Player Stats Table */}
                {stats.playerStats.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Player Statistics</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="pb-3">Player</th>
                                        <th className="pb-3">Games</th>
                                        <th className="pb-3">Actions</th>
                                        <th className="pb-3">Folds</th>
                                        <th className="pb-3">Calls</th>
                                        <th className="pb-3">Raises</th>
                                        <th className="pb-3">Checks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.playerStats.map((player) => (
                                        <tr key={player.playerId} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="py-3 font-medium">{player.playerId}</td>
                                            <td className="py-3">{player.gamesPlayed}</td>
                                            <td className="py-3">{player.totalActions}</td>
                                            <td className="py-3">{player.foldCount}</td>
                                            <td className="py-3">{player.callCount}</td>
                                            <td className="py-3">{player.raiseCount}</td>
                                            <td className="py-3">{player.checkCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <div className="mt-8 flex gap-4">
                    <Link href="/games" className="text-blue-400 hover:text-blue-300">
                        ← View Game History
                    </Link>
                    <Link href="/" className="text-blue-400 hover:text-blue-300">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
