import type { GameScenario, DecisionOption, AnalysisResult } from '../types/poker';
import { generateScenarioDescription, formatHand } from './poker';

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
- 前面的行动：${scenario.previousActions.length === 0 ? '所有玩家弃牌' : scenario.previousActions.map(action => `${action.position}${action.action === 'fold' ? '弃牌' : action.action === 'call' ? '跟注' : `加注到${action.amount}BB`}`).join(', ')}
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

    // 简单的GTO建议逻辑
    const gtoRecommendation = generateGTORecommendation(scenario, equity);

    // 判断用户选择是否正确（简化逻辑）
    const isCorrect = evaluateUserChoice(scenario, userChoice, equity);

    return {
      equity,
      gtoRecommendation,
      userChoice,
      feedback,
      isCorrect,
    };
  } catch (error) {
    console.error('AI分析生成失败:', error);

    // 如果API调用失败，生成一个fallback分析
    return {
      equity,
      gtoRecommendation: generateGTORecommendation(scenario, equity),
      userChoice,
      feedback: generateFallbackFeedback(scenario, userChoice, equity),
      isCorrect: evaluateUserChoice(scenario, userChoice, equity),
    };
  }
}

// 生成GTO建议
function generateGTORecommendation(scenario: GameScenario, equity: number): string {
  const { heroPosition, previousActions, toCall } = scenario;
  const hasRaise = previousActions.some(action => action.action === 'raise');

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

// 评估用户选择是否正确
function evaluateUserChoice(
  scenario: GameScenario,
  userChoice: DecisionOption,
  equity: number
): boolean {
  const { previousActions } = scenario;
  const hasRaise = previousActions.some(action => action.action === 'raise');

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
