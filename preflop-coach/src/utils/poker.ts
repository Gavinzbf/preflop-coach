import type { Card, Position, PlayerAction, GameScenario, DecisionOption, Suit, Rank, GameStreet, BoardTexture, HandStrength } from '../types/poker';

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
  hasRaiseAction = false,
  street: GameStreet = 'preflop'
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
    return { position: position, action: 'fold', street };
  }
  if (random < normalizedTendency.foldRate + normalizedTendency.callRate) {
    return { position: position, action: 'call', street };
  }
  // 加注大小：2-4倍大盲注比较常见
  const raiseSize = Math.floor(Math.random() * 3) + 2; // 2-4倍
  return { position: position, action: 'raise', amount: raiseSize, street };
}

// 生成完整场景
export function generateScenario(startingStreet: GameStreet = 'preflop'): GameScenario {
  // 随机牌桌大小 (6-8人)
  const tableSize = Math.floor(Math.random() * 3) + 6; // 6, 7, 或 8
  const positions = getPositionsForTableSize(tableSize);

  // 随机选择Hero位置
  const heroPosition = positions[Math.floor(Math.random() * positions.length)];
  const heroIndex = getPositionIndex(heroPosition, tableSize);

  // 生成Hero手牌
  const heroCards = generateRandomHand();

  // 生成翻前行动
  const allActions: PlayerAction[] = [];
  const preflopActions: PlayerAction[] = [];
  let hasRaiseAction = false;

  for (let i = 0; i < heroIndex; i++) {
    const position = positions[i];
    const action = generatePlayerAction(position, hasRaiseAction, 'preflop');

    // 记录所有行动到历史中（包括弃牌）
    allActions.push(action);

    // 只有非弃牌行动才加入当前街道行动列表
    if (action.action !== 'fold') {
      preflopActions.push(action);
    }

    if (action.action === 'raise') {
      hasRaiseAction = true;
    }
  }

  // 计算锅底和需要跟注的金额
  let potSize = 1.5; // 小盲和大盲
  let toCall = 1; // 默认跟注大盲

  for (const action of preflopActions) {
    if (action.action === 'call') {
      potSize += toCall;
    } else if (action.action === 'raise' && action.amount) {
      potSize += action.amount;
      toCall = action.amount;
    }
  }

  // 生成公共牌（如果需要）
  let boardCards: Card[] = [];
  if (startingStreet !== 'preflop') {
    boardCards = generateBoardCards(startingStreet);
  }

  return {
    tableSize,
    heroPosition,
    heroCards,
    boardCards,
    currentStreet: startingStreet,
    allActions,
    currentStreetActions: startingStreet === 'preflop' ? preflopActions : [],
    potSize,
    toCall: startingStreet === 'preflop' ? toCall : 0, // 翻牌圈开始时重置
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
  const { heroPosition, heroCards, currentStreetActions, tableSize, currentStreet, boardCards } = scenario;

  let description = `你现在在${getPositionDisplayName(heroPosition)}，手牌是 ${formatHand(heroCards)}。`;

  // 添加公共牌信息
  if (currentStreet !== 'preflop' && boardCards.length > 0) {
    description += ` 公共牌是 ${boardCards.map(card => formatCard(card)).join('')}。`;
  }

  if (currentStreetActions.length === 0) {
    if (currentStreet === 'preflop') {
      description += "前面所有玩家都弃牌了。";
    } else {
      description += "前面所有玩家都过牌了。";
    }
  } else {
    const actionDescriptions: string[] = [];
    let foldCount = 0;

    for (const action of currentStreetActions) {
      if (action.action === 'call') {
        actionDescriptions.push('平跟入池');
      } else if (action.action === 'raise') {
        actionDescriptions.push(`加注到 ${action.amount}BB`);
      } else if (action.action === 'bet') {
        actionDescriptions.push(`下注 ${action.amount}BB`);
      } else if (action.action === 'check') {
        actionDescriptions.push('过牌');
      }
    }

    // 计算弃牌玩家数量
    const totalPlayersBeforeHero = getPositionIndex(heroPosition, tableSize);
    foldCount = totalPlayersBeforeHero - currentStreetActions.length;

    let actionText = '';
    if (foldCount > 0) {
      actionText += `前面有${foldCount}个玩家${currentStreet === 'preflop' ? '弃牌' : '弃牌/过牌'}`;
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
  const { currentStreetActions, toCall, currentStreet, potSize } = scenario;
  const options: DecisionOption[] = [];

  // 总是有弃牌选项
  options.push({
    action: 'fold',
    label: '弃牌',
    description: '放弃这手牌'
  });

  if (currentStreet === 'preflop') {
    // 翻前逻辑保持不变
    if (toCall > 1) {
      options.push({
        action: 'call',
        amount: toCall,
        label: `跟注 ${toCall}BB`,
        description: '被动地跟注入池'
      });

      const threeBetSize = toCall * 2.5 + 1;
      options.push({
        action: 'raise',
        amount: Math.floor(threeBetSize),
        label: `3-Bet到 ${Math.floor(threeBetSize)}BB`,
        description: '强势再加注'
      });
    } else {
      options.push({
        action: 'call',
        amount: 1,
        label: '跟注 1BB',
        description: '被动地加入牌局'
      });

      options.push({
        action: 'raise',
        amount: 3,
        label: '加注到 3BB',
        description: '标准的开池加注'
      });
    }
  } else {
    // 翻牌圈及之后的逻辑
    if (toCall > 0) {
      // 面对下注
      options.push({
        action: 'call',
        amount: toCall,
        label: `跟注 ${toCall}BB`,
        description: '被动地跟注'
      });

      // 多种加注大小选择
      const raiseSizes = [
        { multiplier: 2.5, label: '最小加注', description: '保守加注' },
        { multiplier: 3.0, label: '标准加注', description: '标准3倍加注' },
        { multiplier: 4.0, label: '大额加注', description: '强势4倍加注' },
        { multiplier: 5.5, label: '超大加注', description: '极度施压' }
      ];

      for (const size of raiseSizes) {
        const raiseAmount = Math.floor(toCall * size.multiplier);
        options.push({
          action: 'raise',
          amount: raiseAmount,
          label: `${size.label} ${raiseAmount}BB`,
          description: size.description
        });
      }
    } else {
      // 没有下注，可以过牌或下注
      options.push({
        action: 'check',
        label: '过牌',
        description: '不下注，等待对手行动'
      });

      // 多种下注大小选择
      const betSizes = [
        { ratio: 0.25, label: '小额下注', description: '试探性下注' },
        { ratio: 0.5, label: '半锅下注', description: '标准价值下注' },
        { ratio: 0.75, label: '大额下注', description: '强势下注施压' },
        { ratio: 1.0, label: '满锅下注', description: '最大化价值/施压' }
      ];

      for (const size of betSizes) {
        const betAmount = Math.max(1, Math.floor(potSize * size.ratio));
        options.push({
          action: 'bet',
          amount: betAmount,
          label: `${size.label} ${betAmount}BB`,
          description: size.description
        });
      }
    }
  }

  return options;
}

// 生成公共牌
export function generateBoardCards(street: GameStreet): Card[] {
  const deck = shuffleDeck(generateDeck());

  switch (street) {
    case 'flop':
      return [deck[0], deck[1], deck[2]];
    case 'turn':
      return [deck[0], deck[1], deck[2], deck[3]];
    case 'river':
      return [deck[0], deck[1], deck[2], deck[3], deck[4]];
    default:
      return [];
  }
}

// 分析牌面纹理
export function analyzeBoardTexture(boardCards: Card[]): BoardTexture {
  if (boardCards.length < 3) {
    return {
      type: 'dry',
      pairs: 0,
      flushDraw: false,
      straightDraw: false,
      highCard: '2'
    };
  }

  const suits = boardCards.map(card => card.suit);
  const ranks = boardCards.map(card => card.rank);

  // 检查对子
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pairs = Object.values(rankCounts).filter(count => count >= 2).length;

  // 检查同花听牌
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxSuitCount = Math.max(...Object.values(suitCounts));
  const flushDraw = maxSuitCount >= 2;

  // 检查顺子听牌（简化版）
  const rankValues = ranks.map(rank => {
    switch (rank) {
      case 'A': return 14;
      case 'K': return 13;
      case 'Q': return 12;
      case 'J': return 11;
      case 'T': return 10;
      default: return Number.parseInt(rank);
    }
  }).sort((a, b) => a - b);

  let straightDraw = false;
  for (let i = 0; i < rankValues.length - 1; i++) {
    if (rankValues[i + 1] - rankValues[i] <= 2) {
      straightDraw = true;
      break;
    }
  }

  // 确定牌面类型
  let type: 'dry' | 'wet' | 'coordinated' = 'dry';
  if (flushDraw && straightDraw) {
    type = 'coordinated';
  } else if (flushDraw || straightDraw || pairs > 0) {
    type = 'wet';
  }

  // 最高牌
  const highCard = ranks.reduce((highest, rank) => {
    const getValue = (r: string) => {
      switch (r) {
        case 'A': return 14;
        case 'K': return 13;
        case 'Q': return 12;
        case 'J': return 11;
        case 'T': return 10;
        default: return Number.parseInt(r);
      }
    };
    return getValue(rank) > getValue(highest) ? rank : highest;
  }) as Rank;

  return {
    type,
    pairs,
    flushDraw,
    straightDraw,
    highCard
  };
}

// 分析手牌强度（与公共牌结合）
export function analyzeHandStrength(heroCards: [Card, Card], boardCards: Card[]): HandStrength {
  const allCards = [...heroCards, ...boardCards];

  if (allCards.length < 2) {
    return {
      type: 'high_card',
      rank: 1,
      kickers: [heroCards[0].rank]
    };
  }

  // 简化的手牌评估（只处理翻前和基本翻牌圈牌型）
  const ranks = allCards.map(card => card.rank);
  const suits = allCards.map(card => card.suit);

  // 检查对子
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pairRanks = Object.entries(rankCounts)
    .filter(([_, count]) => count >= 2)
    .map(([rank, _]) => rank as Rank);

  if (pairRanks.length > 0) {
    const maxPairCount = Math.max(...Object.values(rankCounts));
    if (maxPairCount >= 3) {
      return {
        type: 'trips',
        rank: 4,
        kickers: [pairRanks[0]]
      };
    }
    if (pairRanks.length >= 2 || maxPairCount === 2) {
      return {
        type: pairRanks.length >= 2 ? 'two_pair' : 'pair',
        rank: pairRanks.length >= 2 ? 3 : 2,
        kickers: pairRanks
      };
    }
  }

  // 检查同花（简化）
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxSuitCount = Math.max(...Object.values(suitCounts));
  if (maxSuitCount >= 5) {
    return {
      type: 'flush',
      rank: 6,
      kickers: [heroCards[0].rank, heroCards[1].rank]
    };
  }

  // 默认高牌
  const highCard = Math.max(
    ...heroCards.map(card => {
      switch (card.rank) {
        case 'A': return 14;
        case 'K': return 13;
        case 'Q': return 12;
        case 'J': return 11;
        case 'T': return 10;
        default: return Number.parseInt(card.rank);
      }
    })
  );

  const highCardRank = heroCards.find(card => {
    const value = card.rank === 'A' ? 14 :
                  card.rank === 'K' ? 13 :
                  card.rank === 'Q' ? 12 :
                  card.rank === 'J' ? 11 :
                  card.rank === 'T' ? 10 : Number.parseInt(card.rank);
    return value === highCard;
  })?.rank || heroCards[0].rank;

  return {
    type: 'high_card',
    rank: 1,
    kickers: [highCardRank as Rank]
  };
}

// 进入下一个街道
export function advanceToNextStreet(scenario: GameScenario): GameScenario {
  const nextStreet: GameStreet =
    scenario.currentStreet === 'preflop' ? 'flop' :
    scenario.currentStreet === 'flop' ? 'turn' :
    scenario.currentStreet === 'turn' ? 'river' : 'river';

  let newBoardCards = [...scenario.boardCards];

  // 生成新的公共牌
  if (nextStreet === 'flop' && newBoardCards.length === 0) {
    newBoardCards = generateBoardCards('flop');
  } else if (nextStreet === 'turn' && newBoardCards.length === 3) {
    newBoardCards.push(generateBoardCards('turn')[3]);
  } else if (nextStreet === 'river' && newBoardCards.length === 4) {
    newBoardCards.push(generateBoardCards('river')[4]);
  }

  return {
    ...scenario,
    currentStreet: nextStreet,
    boardCards: newBoardCards,
    currentStreetActions: [],
    toCall: 0, // 新街道开始时重置
    lastBetSize: undefined
  };
}
