import type { Card, PlayerAction, Position } from '../types/poker';

// 根据位置和行动推断对手手牌范围强度系数
export function inferOpponentRangeStrength(
  position: Position,
  action: 'call' | 'raise',
  amount?: number
): number {
  // 返回对手范围的平均强度系数 (0-100)

  switch (position) {
    case 'UTG':
    case 'UTG+1':
      if (action === 'raise') {
        // UTG加注范围很紧：强牌为主 (AA, KK, QQ, JJ, AK等)
        return 78; // 高强度
      }
      // UTG平跟：中等牌型 (TT-77, AJ, 同花连牌等)
      return 52; // 中等强度

    case 'UTG+2':
    case 'MP':
      if (action === 'raise') {
        // MP加注范围稍宽：包含更多中等强牌
        return 72; // 中高强度
      }
      // MP平跟：中等偏弱牌型
      return 48; // 中等强度

    case 'CO':
      if (action === 'raise') {
        // CO加注范围更宽：位置优势允许更宽范围
        return 68; // 中等强度
      }
      // CO平跟：投机性牌型较多
      return 45; // 中等偏弱

    case 'BTN':
      if (action === 'raise') {
        // 按钮位加注范围最宽：位置最佳
        return 62; // 中等强度（范围很宽）
      }
      // 按钮位平跟：投机牌、小对子等
      return 40; // 偏弱

    case 'SB':
      if (action === 'raise') {
        // SB完成：平衡的范围
        return 65; // 中等强度
      }
      // SB平跟：防守很宽范围
      return 35; // 偏弱（范围很宽）

    case 'BB':
      if (action === 'raise') {
        // BB 3-bet：极化范围，强牌+诈唬
        return 75; // 高强度
      }
      // BB防守：非常宽的范围
      return 32; // 弱（防守范围很宽）

    default:
      // 默认中等强度
      return 50;
  }
}

// 计算组合对手范围强度
export function combineOpponentRangeStrength(actions: PlayerAction[], street = 'preflop'): number {
  if (actions.length === 0) {
    // 如果没有行动，假设对手是随机范围（平均强度较低）
    if (street === 'preflop') {
      return 30; // 随机手牌的平均强度
    }
    return 25; // 翻牌圈及之后，更谨慎的范围
  }

  // 为了简化，我们使用最后一个行动的范围强度
  // 在实际GTO中，这会更复杂，需要考虑多个对手的交互
  const lastAction = actions[actions.length - 1];

  // 翻牌圈及之后的行动调整
  if (street !== 'preflop' && (lastAction.action === 'bet' || lastAction.action === 'check')) {
    const baseStrength = inferOpponentRangeStrength(
      lastAction.position,
      lastAction.action === 'bet' ? 'raise' : 'call', // 映射到翻前等价行动
      lastAction.amount
    );

    // 翻牌圈下注通常表示更强的范围
    return lastAction.action === 'bet' ? baseStrength + 10 : baseStrength - 5;
  }

  return inferOpponentRangeStrength(
    lastAction.position,
    lastAction.action as 'call' | 'raise',
    lastAction.amount
  );
}

// 简化的胜率计算函数
export function calculateEquity(
  heroHand: [Card, Card],
  opponentActions: PlayerAction[],
  boardCards: Card[] = [],
  street = 'preflop'
): Promise<number> {
  return new Promise((resolve) => {
    // 直接使用简化计算，避免复杂的库调用
    const equity = estimateEquitySimple(heroHand, opponentActions, boardCards, street);
    resolve(equity);
  });
}

// 简化的胜率估算函数
function estimateEquitySimple(
  heroHand: [Card, Card],
  opponentActions: PlayerAction[],
  boardCards: Card[] = [],
  street = 'preflop'
): number {
  let heroStrength: number;

  if (street === 'preflop') {
    // 翻前使用原有逻辑
    heroStrength = evaluateHandStrength(heroHand);
  } else {
    // 翻牌圈及之后，考虑公共牌
    heroStrength = evaluatePostflopHandStrength(heroHand, boardCards);
  }

  // 获取对手范围平均强度
  const opponentStrength = combineOpponentRangeStrength(opponentActions, street);

  // 计算相对胜率
  // 基础公式：heroStrength / (heroStrength + opponentStrength) * 100
  // 调整系数来避免极端值
  const strengthDiff = heroStrength - opponentStrength;
  let equity = 50 + (strengthDiff * 0.8); // 0.8为调整系数

  // 翻牌圈及之后的特殊调整
  if (street !== 'preflop') {
    // 翻牌圈胜率变化更大
    equity = 50 + (strengthDiff * 1.2);
  }

  // 确保胜率在合理范围内 (15-85%)
  equity = Math.min(Math.max(equity, 15), 85);

  return Math.round(equity);
}

// 评估手牌强度 (0-100)
function evaluateHandStrength(hand: [Card, Card]): number {
  const [card1, card2] = hand;

  // 将牌面值转换为数字
  const getValue = (rank: string): number => {
    switch (rank) {
      case '2': return 2;
      case '3': return 3;
      case '4': return 4;
      case '5': return 5;
      case '6': return 6;
      case '7': return 7;
      case '8': return 8;
      case '9': return 9;
      case 'T': return 10;
      case 'J': return 11;
      case 'Q': return 12;
      case 'K': return 13;
      case 'A': return 14;
      default: return 2;
    }
  };

  const val1 = getValue(card1.rank);
  const val2 = getValue(card2.rank);
  const suited = card1.suit === card2.suit;
  const paired = val1 === val2;

  // 对子
  if (paired) {
    if (val1 >= 10) return 85; // TT+ 很强
    if (val1 >= 7) return 65; // 77-99 中等强度
    return 45; // 小对子
  }

  // 高牌
  const highCard = Math.max(val1, val2);
  const lowCard = Math.min(val1, val2);

  let strength = 0;

  // 基础强度
  if (highCard === 14) { // A
    strength = 60 + lowCard * 2; // A2-AK
  } else if (highCard === 13) { // K
    strength = 40 + lowCard * 1.5; // K2-KQ
  } else if (highCard === 12) { // Q
    strength = 30 + lowCard * 1.2; // Q2-QJ
  } else if (highCard === 11) { // J
    strength = 25 + lowCard; // J2-JT
  } else {
    strength = Math.max(highCard + lowCard - 2, 15); // 其他牌
  }

  // 同花奖励
  if (suited) {
    strength += 5;
  }

  // 连牌奖励
  if (Math.abs(val1 - val2) === 1) {
    strength += 3;
  }

  return Math.min(strength, 95); // 非对子最高95
}

// 评估翻牌圈后的手牌强度 (0-100)
function evaluatePostflopHandStrength(hand: [Card, Card], boardCards: Card[]): number {
  const [card1, card2] = hand;
  const [board1, board2, board3] = boardCards;

  // 将牌面值转换为数字
  const getValue = (rank: string): number => {
    switch (rank) {
      case '2': return 2;
      case '3': return 3;
      case '4': return 4;
      case '5': return 5;
      case '6': return 6;
      case '7': return 7;
      case '8': return 8;
      case '9': return 9;
      case 'T': return 10;
      case 'J': return 11;
      case 'Q': return 12;
      case 'K': return 13;
      case 'A': return 14;
      default: return 2;
    }
  };

  const val1 = getValue(card1.rank);
  const val2 = getValue(card2.rank);
  const val3 = getValue(board1.rank);
  const val4 = getValue(board2.rank);
  const val5 = getValue(board3.rank);
  const suited = card1.suit === card2.suit;
  const paired = val1 === val2;

  // 对子
  if (paired) {
    if (val1 >= 10) return 85; // TT+ 很强
    if (val1 >= 7) return 65; // 77-99 中等强度
    return 45; // 小对子
  }

  // 高牌
  const highCard = Math.max(val1, val2, val3, val4, val5);
  const lowCard = Math.min(val1, val2, val3, val4, val5);

  let strength = 0;

  // 基础强度
  if (highCard === 14) { // A
    strength = 60 + lowCard * 2; // A2-AK
  } else if (highCard === 13) { // K
    strength = 40 + lowCard * 1.5; // K2-KQ
  } else if (highCard === 12) { // Q
    strength = 30 + lowCard * 1.2; // Q2-QJ
  } else if (highCard === 11) { // J
    strength = 25 + lowCard; // J2-JT
  } else {
    strength = Math.max(highCard + lowCard - 2, 15); // 其他牌
  }

  // 同花奖励
  if (suited) {
    strength += 5;
  }

  // 连牌奖励
  if (Math.abs(val1 - val2) === 1) {
    strength += 3;
  }

  return Math.min(strength, 95); // 非对子最高95
}
