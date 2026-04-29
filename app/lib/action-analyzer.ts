import { getHandStrength } from './poker-probability';

interface ActionAnalysis {
    isGoodAction: boolean;
    reason: string;
    suggestedAction?: {
        action: string;
        amount?: number;
    };
}

interface GameStatePlayer {
    id?: string;
    name?: string;
    chips: number;
    folded?: boolean;
}

interface GameState {
    phase: string;
    pot: number;
    currentBet: number;
    communityCards: string[];
    players: GameStatePlayer[];
}

interface PlayerAction {
    actionType: string;
    amount?: number;
    communityCards: string[];
    player: {
        name: string;
        cards: string[];
        chips: number;
        totalBet: number;
    };
    players: GameStatePlayer[];
}

async function analyzePlayerAction(
    action: PlayerAction,
    gameState: GameState,
    gameId: string,
    gameHistory: string[]
): Promise<ActionAnalysis> {
    try {
        // Format player's cards for evaluation
        const handStrength = getHandStrength(action.player.cards || [], action.communityCards);
        
        // Prepare the prompt for OpenAI
        const prompt = `
作为一个专业的德州扑克分析师，请分析这个玩家行动的合理性。基于以下信息进行分析并返回JSON格式结果。

当前行动信息：
- 玩家名称：${action.player.name}
- 行动类型：${action.actionType}${action.amount ? ` 金额：$${action.amount}` : ''}
- 玩家手牌：${action.player.cards.join(', ')}
- 手牌强度：${Math.round(handStrength * 100)}%

游戏状态：
- 当前阶段：${gameState.phase}
- 底池：$${gameState.pot}
- 当前下注：$${gameState.currentBet}
- 公共牌：${action.communityCards.length > 0 ? action.communityCards.join(', ') : '无'}

历史行动：
${gameHistory.join('\n')}

请分析这个行动是否最优，并给出详细理由。返回格式如下：
{
    "isGoodAction": true/false,
    "reason": "详细的分析理由，包括为什么这个行动好或不好",
    "suggestedAction": {
        "action": "如果有更好的选择，给出建议行动（FOLD/CHECK/CALL/RAISE/ALL_IN）",
        "amount": "如果建议RAISE，给出建议金额"
    }
}

在分析时请考虑：
1. 手牌强度与底池赔率
2. 位置与场上局势
3. 投注规模的合理性
4. 其他玩家的行动历史
5. 当前阶段的策略考虑`;

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                gameId,
                gameState: {
                    ...gameState,
                    communityCards: action.communityCards,
                    players: action.players
                }
            })
        });

        const analysis = await response.json();
        // Validate and format the response
        if (!analysis.reason) {
            throw new Error('Invalid analysis format from AI');
        }

        return {
            isGoodAction: analysis.isGoodAction,
            reason: analysis.reason,
            suggestedAction: analysis.suggestedAction
        };

    } catch (error) {
        console.error('Error analyzing player action:', error);
        return {
            isGoodAction: true, // Default to true in case of error
            reason: '无法完成行动分析，系统暂时无法给出建议。'
        };
    }
}

export { analyzePlayerAction, type ActionAnalysis, type PlayerAction }; 
