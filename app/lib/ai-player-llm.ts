import { AILevel, AIPersonality, GameState, makeAIDecision as makeAIDecisionFallback, PlayerState } from './ai-player';


interface AIDecisionWithReason {
  action: string;
  amount?: number;
  reason: string;
}

interface AIResponse {
  action?: string;
  amount?: number | string;
  reason?: string;
}

// Evaluate pocket cards strength
function evaluatePocketCards(cards: string[]): string {
  if (cards.length !== 2) return '无效的起手牌';

  const card1 = cards[0];
  const card2 = cards[1];
  const value1 = card1[0];
  const value2 = card2[0];
  const suit1 = card1[1];
  const suit2 = card2[1];

  // Pair
  if (value1 === value2) {
    return `对子 ${value1}`;
  }

  // Suited cards
  const isSuited = suit1 === suit2;
  const suitedText = isSuited ? '同花' : '不同花';

  return `${value1}${value2} ${suitedText}`;
}

// Get card value rank description in Chinese
function getCardValueRankDescription(value: string): string {
  const rankMap: Record<string, string> = {
    'A': '王牌（A）',
    'K': '国王（K）',
    'Q': '皇后（Q）',
    'J': '杰克（J）',
    'T': '10',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2'
  };
  return rankMap[value] || value;
}

export async function makeAIDecision(
  aiPlayer: PlayerState,
  gameState: GameState,
  personality: AIPersonality,
  gameId?: string
): Promise<AIDecisionWithReason> {
  try {
    // 1. Evaluate pocket cards description
    const pocketCardsEvaluation = evaluatePocketCards(aiPlayer.cards || []);

    // 2. Get card values
    const cardValues = (aiPlayer.cards || []).map(card => getCardValueRankDescription(card[0]));

    // 3. Count active players
    const activePlayers = gameState.players.filter(p => !p.folded).length;

    // 4. Calculate pot odds
    const amountToCall = gameState.currentBet - aiPlayer.totalBet;
    const potOdds = amountToCall > 0 ? Math.round((amountToCall / (gameState.pot + amountToCall)) * 100) : 0;

    // 5. Build unified prompt
    const prompt = `
作为一个德州扑克AI玩家，请基于以下信息做出决策。必须以JSON格式返回。

玩家个性：
- 类型：${personality.name}
- 描述：${personality.description}
- 唬人倾向：${personality.canBluff ? `是（频率${Math.round(personality.bluffFrequency * 100)}%）` : '否（从不诈唬）'}
- 风险承受度：${Math.round(personality.riskTolerance * 100)}%
- 激进程度：${Math.round(personality.aggressiveness * 100)}%

当前手牌信息：
- 手牌：${cardValues.join(', ')}
- 手牌类型：${pocketCardsEvaluation}
（请根据手牌类型自行评估牌力强弱：对子、高牌A/K、同花连张等属于强牌；不同花低牌属于弱牌）

游戏状态：
- 当前阶段：${gameState.phase}
- 底池：$${gameState.pot}
- 当前下注：$${gameState.currentBet}
- 需要跟注：$${amountToCall}
- 底池赔率：${potOdds}%
- 玩家筹码：$${aiPlayer.chips}
- 公共牌：${gameState.communityCards.length > 0 ? gameState.communityCards.join(', ') : '无'}
- 活跃玩家数：${activePlayers}

决策指引：
${personality.canBluff ? `
你是一个${personality.name}玩家，具备诈唬能力。请综合考虑：
1. 弱牌时，如果对手少、底池大、位置好，可以考虑诈唬
2. 诈唬时选择合理的加注尺度，不要过度暴露
3. 如果手牌有不错的价值，优先按正常策略打
4. 根据你的个性特点（${personality.description}）调整策略
` : `
你是一个${personality.name}玩家，不会进行诈唬。请根据手牌做出正统决策：
1. 强牌积极加注获取价值
2. 中等牌根据赔率决定跟注或弃牌
3. 弱牌果断弃牌，不要勉强
`}

请返回JSON格式：
{
  "action": "FOLD|CHECK|CALL|RAISE|ALL_IN",
  "reason": "详细的中文分析理由${personality.canBluff ? '（如果选择诈唬请说明策略）' : ''}",
  "amount": "如果选择RAISE，填写加注金额"
}
`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          gameId,
          gameState
        })
      });

      const aiResponse = await res.json() as AIResponse;

      if (!aiResponse.action || !aiResponse.reason ||
        !['FOLD', 'CHECK', 'CALL', 'RAISE', 'ALL_IN'].includes(aiResponse.action)) {
        throw new Error('Invalid AI response format');
      }
      // Determine action and amount based on AI's decision
      let amount: number | undefined;

      if (aiResponse.action === 'RAISE') {
        amount = typeof aiResponse.amount === 'string' ? Number(aiResponse.amount) : aiResponse.amount;
      } else if (aiResponse.action === 'CALL') {
        amount = gameState.currentBet - aiPlayer.totalBet;
      }

      return {
        action: aiResponse.action,
        amount,
        reason: aiResponse.reason
      };
    } catch {
      console.log('Failed to parse OpenAI response, using fallback AI');
      const fallbackDecision = makeAIDecisionFallback(aiPlayer, gameState, {
        level: AILevel.MEDIUM,
        type: 'BALANCED' as any,
        name: '平衡型',
        description: '各方面均衡',
        bluffFrequency: 0.3,
        riskTolerance: 0.5,
        aggressiveness: 0.5,
        canBluff: true,
      });
      return { ...fallbackDecision, reason: '使用备用AI系统做出决策' };
    }
  } catch (error) {
    console.error('OpenAI decision error:', error);
    // Fallback to traditional AI
    const fallbackDecision = makeAIDecisionFallback(aiPlayer, gameState, {
      level: AILevel.MEDIUM,
      type: 'BALANCED' as any,
      name: '平衡型',
      description: '各方面均衡',
      bluffFrequency: 0.3,
      riskTolerance: 0.5,
      aggressiveness: 0.5,
      canBluff: true,
    });
    return {
      ...fallbackDecision,
      reason: '由于OpenAI服务异常，使用备用AI系统做出决策'
    };
  }
}
