import type { GameScenario, DecisionOption, AnalysisResult, GTOStrategy, BoardTexture, HandStrength } from '../types/poker';
import { generateScenarioDescription, formatHand, analyzeBoardTexture, analyzeHandStrength } from './poker';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
}

// 生成GTO混合策略
function generateGTOStrategy(scenario: GameScenario, equity: number): GTOStrategy {
  const { heroPosition, currentStreetActions, toCall, currentStreet } = scenario;
  const hasRaise = currentStreetActions.some(action => action.action === 'raise');
  const hasBet = currentStreetActions.some(action => action.action === 'bet');

  // 基础策略根据胜率调整
  let baseFold = 0;
  let baseCall = 0;
  let baseRaise = 0;

  if (equity >= 80) {
    // 极强手牌：几乎总是价值下注/加注
    baseFold = 5;
    baseCall = hasRaise ? 25 : 10;
    baseRaise = hasRaise ? 70 : 85;
  } else if (equity >= 65) {
    // 强手牌：主要价值导向
    baseFold = 10;
    baseCall = hasRaise ? 40 : 20;
    baseRaise = hasRaise ? 50 : 70;
  } else if (equity >= 50) {
    // 中等强度：平衡策略
    baseFold = hasRaise ? 30 : 15;
    baseCall = hasRaise ? 50 : 45;
    baseRaise = hasRaise ? 20 : 40;
  } else if (equity >= 35) {
    // 边缘手牌：谨慎游戏
    baseFold = hasRaise ? 60 : 35;
    baseCall = hasRaise ? 30 : 50;
    baseRaise = hasRaise ? 10 : 15;
  } else if (equity >= 20) {
    // 弱手牌：少量诈唬
    baseFold = hasRaise ? 85 : 65;
    baseCall = hasRaise ? 10 : 25;
    baseRaise = hasRaise ? 5 : 10;
  } else {
    // 很弱的手牌：主要弃牌，极少诈唬
    baseFold = hasRaise ? 95 : 80;
    baseCall = hasRaise ? 3 : 15;
    baseRaise = hasRaise ? 2 : 5;
  }

  // 根据位置微调
  const positionAdjustment = getPositionAdjustment(heroPosition, hasRaise);
  baseFold += positionAdjustment.fold;
  baseCall += positionAdjustment.call;
  baseRaise += positionAdjustment.raise;

  // 翻牌圈及之后需要调整策略
  if (currentStreet !== 'preflop') {
    if (toCall === 0) {
      // 没有下注，可以check或bet
      // 翻牌圈策略调整：减少弃牌，增加主动性
      const adjustedFold = Math.max(5, baseFold * 0.3); // 减少弃牌频率
      const adjustedCheck = baseCall + (baseFold * 0.4); // 一部分弃牌转为过牌
      const adjustedBet = baseRaise + (baseFold * 0.3); // 一部分弃牌转为下注

      const total = Math.max(100, adjustedFold + adjustedCheck + adjustedBet);
      const fold = Math.max(0, Math.round((adjustedFold / total) * 100));
      const check = Math.max(0, Math.round((adjustedCheck / total) * 100));
      const bet = Math.max(0, 100 - fold - check);

      return { fold, check, call: 0, bet, raise: 0 };
    }
    // 面对下注，可以fold/call/raise
    const total = Math.max(100, baseFold + baseCall + baseRaise);
    const fold = Math.max(0, Math.round((baseFold / total) * 100));
    const call = Math.max(0, Math.round((baseCall / total) * 100));
    const raise = Math.max(0, 100 - fold - call);

    return { fold, call, raise };
  }

  // 翻前策略保持原有逻辑
  const total = Math.max(100, baseFold + baseCall + baseRaise);
  const fold = Math.max(0, Math.round((baseFold / total) * 100));
  const call = Math.max(0, Math.round((baseCall / total) * 100));
  const raise = Math.max(0, 100 - fold - call);

  return { fold, call, raise };
}

// 位置调整系数
function getPositionAdjustment(position: string, hasRaise: boolean): { fold: number; call: number; raise: number } {
  switch (position) {
    case 'UTG':
    case 'UTG+1':
      // 早期位置：更紧，更少诈唬
      return { fold: 10, call: -5, raise: -5 };
    case 'UTG+2':
    case 'MP':
      // 中间位置：略微保守
      return { fold: 5, call: 0, raise: -5 };
    case 'CO':
      // 关煞位：略微激进
      return { fold: -5, call: 0, raise: 5 };
    case 'BTN':
      // 按钮位：最激进
      return { fold: -10, call: -5, raise: 15 };
    case 'SB':
      // 小盲位：位置不利，更保守
      return { fold: 5, call: 5, raise: -10 };
    case 'BB':
      // 大盲位：已经投入，防守更宽
      return hasRaise ? { fold: -10, call: 10, raise: 0 } : { fold: -5, call: 5, raise: 0 };
    default:
      return { fold: 0, call: 0, raise: 0 };
  }
}

// 格式化GTO策略显示
export function formatGTOStrategy(strategy: GTOStrategy): string {
  const parts = [];
  if (strategy.fold > 0) parts.push(`弃牌${strategy.fold}%`);
  if (strategy.check && strategy.check > 0) parts.push(`过牌${strategy.check}%`);
  if (strategy.call > 0) parts.push(`跟注${strategy.call}%`);
  if (strategy.bet && strategy.bet > 0) parts.push(`下注${strategy.bet}%`);
  if (strategy.raise > 0) parts.push(`加注${strategy.raise}%`);
  return parts.join(' / ');
}

// 生成AI分析prompt
function generateAnalysisPrompt(
  scenario: GameScenario,
  userChoice: DecisionOption,
  equity: number
): string {
  const scenarioDescription = generateScenarioDescription(scenario);

  return `你是一位世界顶级的德州扑克教练，精通GTO策略，并且善于用简单易懂的语言向新手解释复杂的概念。你的回答应该充满鼓励性，但同时要直言不讳地指出错误。

场景信息：
- 牌桌大小：${scenario.tableSize}人
- 你的位置：${scenario.heroPosition}
- 你的手牌：${formatHand(scenario.heroCards)}
- 前面的行动：${scenario.currentStreetActions.length === 0 ? '所有玩家弃牌' : scenario.currentStreetActions.map(action => `${action.position}${action.action === 'fold' ? '弃牌' : action.action === 'call' ? '跟注' : `加注到${action.amount}BB`}`).join(', ')}
- 锅底大小：${scenario.potSize}BB
- 需要跟注：${scenario.toCall}BB

玩家选择：${userChoice.label} (${userChoice.description})

胜率数据：你的手牌对抗对手范围的胜率为 ${equity.toFixed(1)}%

请根据以上信息，生成一段分析反馈。要求：

1. 首先直接评判用户选择（正确/错误/有待商榷）
2. 引用胜率数据来支撑观点
3. 解释选择的逻辑和后果
4. 指出GTO最优打法并解释原因
5. 给出简洁的改进建议

请用中文回答，语气友好鼓励但专业准确。请使用段落分隔，让内容更易读。控制在250-350字以内。`;
}

// 调用Gemini API
export async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('No response from Gemini API');
  } catch (error) {
    console.error('Gemini API调用失败:', error);
    throw error;
  }
}

// 生成分析结果
export async function generateAnalysis(
  scenario: GameScenario,
  userChoice: DecisionOption,
  equity: number
): Promise<AnalysisResult> {
  try {
    const prompt = generateAnalysisPrompt(scenario, userChoice, equity);
    const feedback = await callGeminiAPI(prompt);

    // 生成GTO混合策略
    const gtoStrategy = generateGTOStrategy(scenario, equity);

    // 简单的GTO建议逻辑（保留用于AI分析）
    const gtoRecommendation = generateGTORecommendation(scenario, equity);

    // 判断用户选择是否正确（基于混合策略）
    const isCorrect = evaluateUserChoiceWithStrategy(userChoice, gtoStrategy);

    // 翻牌圈分析（如果需要）
    let boardTexture: BoardTexture | undefined;
    let handStrength: HandStrength | undefined;

    if (scenario.currentStreet !== 'preflop' && scenario.boardCards.length >= 3) {
      boardTexture = analyzeBoardTexture(scenario.boardCards);
      handStrength = analyzeHandStrength(scenario.heroCards, scenario.boardCards);
    }

    return {
      equity,
      gtoRecommendation,
      gtoStrategy,
      userChoice,
      feedback,
      isCorrect,
      boardTexture,
      handStrength,
      street: scenario.currentStreet,
    };
  } catch (error) {
    console.error('AI分析生成失败:', error);

    // 如果API调用失败，生成一个fallback分析
    const gtoStrategy = generateGTOStrategy(scenario, equity);

    // 翻牌圈分析（如果需要）
    let boardTexture: BoardTexture | undefined;
    let handStrength: HandStrength | undefined;

    if (scenario.currentStreet !== 'preflop' && scenario.boardCards.length >= 3) {
      boardTexture = analyzeBoardTexture(scenario.boardCards);
      handStrength = analyzeHandStrength(scenario.heroCards, scenario.boardCards);
    }

    return {
      equity,
      gtoRecommendation: generateGTORecommendation(scenario, equity),
      gtoStrategy,
      userChoice,
      feedback: generateFallbackFeedback(scenario, userChoice, equity),
      isCorrect: evaluateUserChoiceWithStrategy(userChoice, gtoStrategy),
      boardTexture,
      handStrength,
      street: scenario.currentStreet,
    };
  }
}

// 生成GTO建议（保留原有逻辑用于AI分析）
function generateGTORecommendation(scenario: GameScenario, equity: number): string {
  const { heroPosition, currentStreetActions, toCall } = scenario;
  const hasRaise = currentStreetActions.some(action => action.action === 'raise');

  // 简化的GTO逻辑
  if (equity >= 75) {
    return hasRaise ? '3-Bet或跟注' : '加注';
  }
  if (equity >= 60) {
    return hasRaise ? '跟注' : '加注';
  }
  if (equity >= 45) {
    return hasRaise ? '弃牌' : '跟注或小额加注';
  }
  if (equity >= 30) {
    return hasRaise ? '弃牌' : '谨慎跟注';
  }
  return '弃牌';
}

// 基于混合策略评估用户选择
function evaluateUserChoiceWithStrategy(
  userChoice: DecisionOption,
  gtoStrategy: GTOStrategy
): boolean {
  // 如果用户选择的行动在GTO策略中占比超过20%，则认为是合理的
  switch (userChoice.action) {
    case 'fold':
      return gtoStrategy.fold >= 20;
    case 'call':
      return gtoStrategy.call >= 20;
    case 'raise':
      return gtoStrategy.raise >= 20;
    default:
      return false;
  }
}

// 评估用户选择是否正确（保留原有逻辑用于fallback）
function evaluateUserChoice(
  scenario: GameScenario,
  userChoice: DecisionOption,
  equity: number
): boolean {
  const { currentStreetActions } = scenario;
  const hasRaise = currentStreetActions.some(action => action.action === 'raise');

  // 简化的评估逻辑
  if (equity >= 70) {
    // 很强的手牌
    return userChoice.action === 'raise' || (userChoice.action === 'call' && hasRaise);
  }
  if (equity >= 55) {
    // 中等偏强的手牌
    return userChoice.action !== 'fold';
  }
  if (equity >= 40) {
    // 边缘手牌
    return !hasRaise || userChoice.action === 'fold';
  }
  // 弱手牌
  return userChoice.action === 'fold';
}

// 生成fallback反馈
function generateFallbackFeedback(
  scenario: GameScenario,
  userChoice: DecisionOption,
  equity: number
): string {
  const isCorrect = evaluateUserChoice(scenario, userChoice, equity);
  const gtoRec = generateGTORecommendation(scenario, equity);

  if (isCorrect) {
    return `✅ 你的选择"${userChoice.label}"是正确的！

根据计算，你的胜率为${equity.toFixed(1)}%。${gtoRec === userChoice.action ? '这符合GTO最优策略。' : ''}

继续保持这种决策水平，你会看到长期的进步。记住，翻前决策的关键是position + hand strength + action，你掌握得很好！`;
  }
  return `❌ 你的选择"${userChoice.label}"不太理想。

考虑到你的胜率为${equity.toFixed(1)}%，更好的选择可能是${gtoRec}。

${userChoice.action === 'fold' && equity > 50 ? '不要过于保守，' : userChoice.action === 'raise' && equity < 40 ? '要避免过度激进，' : ''}记住要根据position、胜率和对手行动来做决策。

每个错误都是学习的机会！`;
}
