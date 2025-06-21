import type { Card, Position, PlayerAction, GameScenario, DecisionOption, Suit, Rank } from '../types/poker';

// 牌桌位置定义（按行动顺序）
export const POSITIONS_6MAX: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
export const POSITIONS_7MAX: Position[] = ['UTG', 'UTG+1', 'MP', 'CO', 'BTN', 'SB', 'BB'];
export const POSITIONS_8MAX: Position[] = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'CO', 'BTN', 'SB', 'BB'];

const ALL_SUITS: Suit[] = ['c', 'd', 'h', 's'];
const ALL_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

// 生成完整牌组
export function generateDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

// 洗牌
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 随机生成手牌
export function generateRandomHand(): [Card, Card] {
  const deck = shuffleDeck(generateDeck());
  return [deck[0], deck[1]];
}

// 根据牌桌大小获取位置列表
export function getPositionsForTableSize(tableSize: number): Position[] {
  switch (tableSize) {
    case 6:
      return POSITIONS_6MAX;
    case 7:
      return POSITIONS_7MAX;
    case 8:
      return POSITIONS_8MAX;
    default:
      return POSITIONS_6MAX;
  }
}

// 获取位置在行动顺序中的索引
export function getPositionIndex(position: Position, tableSize: number): number {
  const positions = getPositionsForTableSize(tableSize);
  return positions.indexOf(position);
}

// 根据位置获取合理的行动范围
export function getPositionTendency(position: Position): {
  foldRate: number;
  callRate: number;
  raiseRate: number;
} {
  switch (position) {
    case 'UTG':
    case 'UTG+1':
      return { foldRate: 0.75, callRate: 0.15, raiseRate: 0.10 };
    case 'UTG+2':
    case 'MP':
      return { foldRate: 0.65, callRate: 0.20, raiseRate: 0.15 };
    case 'CO':
      return { foldRate: 0.55, callRate: 0.25, raiseRate: 0.20 };
    case 'BTN':
      return { foldRate: 0.45, callRate: 0.25, raiseRate: 0.30 };
    case 'SB':
      return { foldRate: 0.60, callRate: 0.20, raiseRate: 0.20 };
    case 'BB':
      return { foldRate: 0.50, callRate: 0.35, raiseRate: 0.15 };
    default:
      return { foldRate: 0.60, callRate: 0.25, raiseRate: 0.15 };
  }
}

// 生成玩家行动
export function generatePlayerAction(
  position: Position,
  hasRaiseAction = false
): PlayerAction {
  const tendency = getPositionTendency(position);
  const random = Math.random();

  // 如果前面有加注，调整概率
  const adjustedTendency = hasRaiseAction
    ? {
        foldRate: tendency.foldRate * 1.5,
        callRate: tendency.callRate * 0.8,
        raiseRate: tendency.raiseRate * 0.5,
      }
    : tendency;

  // 标准化概率
  const total = adjustedTendency.foldRate + adjustedTendency.callRate + adjustedTendency.raiseRate;
  const normalizedTendency = {
    foldRate: adjustedTendency.foldRate / total,
    callRate: adjustedTendency.callRate / total,
    raiseRate: adjustedTendency.raiseRate / total,
  };

  if (random < normalizedTendency.foldRate) {
    return { position: position, action: 'fold' };
  }
  if (random < normalizedTendency.foldRate + normalizedTendency.callRate) {
    return { position: position, action: 'call' };
  }
  // 加注大小：2-4倍大盲注比较常见
  const raiseSize = Math.floor(Math.random() * 3) + 2; // 2-4倍
  return { position: position, action: 'raise', amount: raiseSize };
}

// 生成完整场景
export function generateScenario(): GameScenario {
  // 随机牌桌大小 (6-8人)
  const tableSize = Math.floor(Math.random() * 3) + 6; // 6, 7, 或 8
  const positions = getPositionsForTableSize(tableSize);

  // 随机选择Hero位置
  const heroPosition = positions[Math.floor(Math.random() * positions.length)];
  const heroIndex = getPositionIndex(heroPosition, tableSize);

  // 生成Hero手牌
  const heroCards = generateRandomHand();

  // 生成前面玩家的行动
  const previousActions: PlayerAction[] = [];
  let hasRaiseAction = false;

  for (let i = 0; i < heroIndex; i++) {
    const position = positions[i];
    const action = generatePlayerAction(position, hasRaiseAction);

    if (action.action !== 'fold') {
      previousActions.push(action);
    }

    if (action.action === 'raise') {
      hasRaiseAction = true;
    }
  }

  // 计算锅底和需要跟注的金额
  let potSize = 1.5; // 小盲和大盲
  let toCall = 1; // 默认跟注大盲

  for (const action of previousActions) {
    if (action.action === 'call') {
      potSize += toCall;
    } else if (action.action === 'raise' && action.amount) {
      potSize += action.amount;
      toCall = action.amount;
    }
  }

  return {
    tableSize,
    heroPosition,
    heroCards,
    previousActions,
    potSize,
    toCall,
  };
}

// 格式化卡牌显示
export function formatCard(card: Card): string {
  const suitSymbols = {
    'h': '♥️',
    'd': '♦️',
    'c': '♣️',
    's': '♠️'
  };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

// 格式化手牌显示
export function formatHand(cards: [Card, Card]): string {
  return `${formatCard(cards[0])}${formatCard(cards[1])}`;
}

// 生成场景描述文本
export function generateScenarioDescription(scenario: GameScenario): string {
  const { heroPosition, heroCards, previousActions, tableSize } = scenario;

  let description = `你现在在${getPositionDisplayName(heroPosition)}，手牌是 ${formatHand(heroCards)}。`;

  if (previousActions.length === 0) {
    description += "前面所有玩家都弃牌了。";
  } else {
    const actionDescriptions: string[] = [];
    let foldCount = 0;

    for (const action of previousActions) {
      if (action.action === 'call') {
        actionDescriptions.push('平跟入池');
      } else if (action.action === 'raise') {
        actionDescriptions.push(`加注到 ${action.amount}BB`);
      }
    }

    // 计算弃牌玩家数量
    const totalPlayersBeforeHero = getPositionIndex(heroPosition, tableSize);
    foldCount = totalPlayersBeforeHero - previousActions.length;

    let actionText = '';
    if (foldCount > 0) {
      actionText += `前面有${foldCount}个玩家弃牌`;
      if (actionDescriptions.length > 0) {
        actionText += `，${actionDescriptions.length}个玩家${actionDescriptions.join('，')}`;
      }
    } else {
      actionText += `前面有${actionDescriptions.length}个玩家${actionDescriptions.join('，')}`;
    }

    description += `${actionText}。`;
  }

  description += '轮到你了，你该怎么做？';

  return description;
}

// 获取位置的中文显示名称
export function getPositionDisplayName(position: Position): string {
  const displayNames = {
    'UTG': '枪口位(UTG)',
    'UTG+1': '枪口位+1(UTG+1)',
    'UTG+2': '枪口位+2(UTG+2)',
    'MP': '中间位(MP)',
    'CO': '关煞位(CO)',
    'BTN': '按钮位(Button)',
    'SB': '小盲位(SB)',
    'BB': '大盲位(BB)'
  };
  return displayNames[position];
}

// 根据场景生成决策选项
export function generateDecisionOptions(scenario: GameScenario): DecisionOption[] {
  const { previousActions, toCall } = scenario;
  const options: DecisionOption[] = [];

  // 总是有弃牌选项
  options.push({
    action: 'fold',
    label: '弃牌',
    description: '放弃这手牌'
  });

  // 如果需要跟注
  if (toCall > 1) {
    options.push({
      action: 'call',
      amount: toCall,
      label: `跟注 ${toCall}BB`,
      description: '被动地跟注入池'
    });

    // 3-bet选项
    const threeBetSize = toCall * 2.5 + 1;
    options.push({
      action: 'raise',
      amount: Math.floor(threeBetSize),
      label: `3-Bet到 ${Math.floor(threeBetSize)}BB`,
      description: '强势再加注'
    });
  } else {
    // 平跟选项
    options.push({
      action: 'call',
      amount: 1,
      label: '跟注 1BB',
      description: '被动地加入牌局'
    });

    // 标准加注选项
    options.push({
      action: 'raise',
      amount: 3,
      label: '加注到 3BB',
      description: '标准的开池加注'
    });
  }

  return options;
}
