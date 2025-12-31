import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

interface GameAction {
  player: {
    name: string;
  };
  actionType: string;
  amount?: number;
}

interface GameStatePlayer {
  name: string;
  chips: number;
  folded?: boolean;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
});

export async function POST(request: Request) {
    try {
        const { prompt, gameId, gameState } = await request.json();

        // Fetch game history
        let gameHistory = '';
        if (gameId) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/games/${gameId}/actions?gameId=${gameId}`);
            if (response.ok) {
                const actions = await response.json();
                gameHistory = actions.map((action: GameAction, index: number) => {
                    return `${index + 1}. ${action.player.name} ${action.actionType}${action.amount ? ` $${action.amount}` : ''}`
                }).join('\n');
            }
        }

        // Format the game state information
        const gameStateInfo = gameState ? `
Current game state:
- Phase: ${gameState.phase}
- Pot: $${gameState.pot}
- Current bet: $${gameState.currentBet}
- Community cards: ${gameState.communityCards.join(', ')}
- Players:
${gameState.players.map((p: GameStatePlayer) => `  * ${p.name}: ${p.chips} chips${p.folded ? ' (folded)' : ''}`).join('\n')}
` : '';

        // Simple validation
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL as string,
            messages: [
                {
                    role: "system",
                    content: `你是一个专业的德州扑克AI助手。你必须返回一个包含action和reason字段的JSON对象。
Action必须是以下之一：FOLD, CHECK, CALL, RAISE, ALL_IN。
如果action是RAISE，你必须在amount字段中指定合理的加注金额。加注金额必须大于当前下注金额, 且符合通用的德州规则，比如2-bet,3-bet等等。
在决定加注金额时，考虑以下因素：
1. 当前底池大小
2. 当前下注金额
3. 玩家剩余筹码
4. 游戏阶段
5. 历史行动

请确保加注金额遵循以下规则：
1. 加注金额必须大于当前下注金额
2. 加注金额不能超过玩家剩余筹码
3. 加注金额应该与底池大小相称
4. 避免过小或过大的加注`
                },
                {
                    role: "user",
                    content: `
Game history:
${gameHistory}

${gameStateInfo}

Decision to make:
${prompt}
`
                }
            ],
            temperature: 0.7,
            max_tokens: 40000,
            response_format: { type: "json_object" }
        });
        
        const responseContent = completion.choices[0].message.content || '{}';
        const aiResponse = JSON.parse(responseContent);
        
        return NextResponse.json(aiResponse,
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in AI decision:', error);
        return NextResponse.json(
            { error: 'Failed to get AI decision' },
            { status: 500 }
        );
    }
} 