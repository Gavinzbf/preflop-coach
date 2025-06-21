import { boardToInts, formatCards, PreflopRange } from 'poker-utils';
import type { Card, PlayerAction, Position } from '../types/poker';

// 将我们的Card类型转换为poker-utils的格式
export function cardToPokerUtils(card: Card): string {
  return `${card.rank}${card.suit}`;
}

// 将手牌转换为poker-utils格式
export function handToPokerUtils(cards: [Card, Card]): string {
  return `${cardToPokerUtils(cards[0])}${cardToPokerUtils(cards[1])}`;
}

// 根据位置和行动推断对手手牌范围
export function inferOpponentRange(
  position: Position,
  action: 'call' | 'raise',
  amount?: number
): PreflopRange {
  const range = new PreflopRange();

  switch (position) {
    case 'UTG':
    case 'UTG+1':
      if (action === 'raise') {
        // UTG加注范围比较紧：强牌为主
        range.set('AA');
        range.set('KK');
        range.set('QQ');
        range.set('JJ');
        range.set('AKs');
        range.set('AKo');
        range.set('AQs');
        range.set('AJs', 0.5);
        range.set('KQs', 0.5);
      } else {
        // UTG平跟：一些中等牌型
        range.set('TT');
        range.set('99');
        range.set('88');
        range.set('77');
        range.set('AJo', 0.3);
        range.set('ATs', 0.5);
        range.set('KJs', 0.5);
        range.set('QJs', 0.5);
      }
      break;

    case 'UTG+2':
    case 'MP':
      if (action === 'raise') {
        // MP加注范围稍宽
        range.set('AA');
        range.set('KK');
        range.set('QQ');
        range.set('JJ');
        range.set('TT');
        range.set('AKs');
        range.set('AKo');
        range.set('AQs');
        range.set('AQo', 0.5);
        range.set('AJs');
        range.set('AJo', 0.3);
        range.set('KQs');
        range.set('KJs', 0.5);
      } else {
        // MP平跟
        range.set('99');
        range.set('88');
        range.set('77');
        range.set('66');
        range.set('ATs');
        range.set('A9s', 0.5);
        range.set('KTs', 0.5);
        range.set('QTs', 0.5);
        range.set('JTs');
      }
      break;

    case 'CO':
      if (action === 'raise') {
        // CO加注范围更宽
        range.set('AA');
        range.set('KK');
        range.set('QQ');
        range.set('JJ');
        range.set('TT');
        range.set('99');
        range.set('AKs');
        range.set('AKo');
        range.set('AQs');
        range.set('AQo');
        range.set('AJs');
        range.set('AJo');
        range.set('ATs', 0.7);
        range.set('KQs');
        range.set('KQo', 0.5);
        range.set('KJs');
        range.set('KJo', 0.3);
      } else {
        range.set('88');
        range.set('77');
        range.set('66');
        range.set('55');
        range.set('A9s');
        range.set('A8s', 0.5);
        range.set('KTs');
        range.set('K9s', 0.5);
        range.set('QJs');
        range.set('QTs');
        range.set('JTs');
        range.set('T9s');
      }
      break;

    case 'BTN':
      if (action === 'raise') {
        // 按钮位加注范围最宽
        range.set('AA');
        range.set('KK');
        range.set('QQ');
        range.set('JJ');
        range.set('TT');
        range.set('99');
        range.set('88');
        range.set('77', 0.7);
        range.set('AKs');
        range.set('AKo');
        range.set('AQs');
        range.set('AQo');
        range.set('AJs');
        range.set('AJo');
        range.set('ATs');
        range.set('ATo', 0.5);
        range.set('A9s', 0.7);
        range.set('KQs');
        range.set('KQo');
        range.set('KJs');
        range.set('KJo');
        range.set('KTs', 0.7);
        range.set('QJs');
        range.set('QJo', 0.5);
        range.set('QTs', 0.7);
      } else {
        range.set('66');
        range.set('55');
        range.set('44');
        range.set('A8s');
        range.set('A7s', 0.5);
        range.set('K9s');
        range.set('K8s', 0.5);
        range.set('Q9s');
        range.set('J9s');
        range.set('T9s');
        range.set('98s');
        range.set('87s');
      }
      break;

    case 'SB':
      if (action === 'raise') {
        // SB完成范围
        range.set('AA');
        range.set('KK');
        range.set('QQ');
        range.set('JJ');
        range.set('TT');
        range.set('99');
        range.set('88');
        range.set('77');
        range.set('66', 0.5);
        range.set('AKs');
        range.set('AKo');
        range.set('AQs');
        range.set('AQo');
        range.set('AJs');
        range.set('AJo');
        range.set('ATs');
        range.set('ATo');
        range.set('A9s');
        range.set('A9o', 0.5);
        range.set('KQs');
        range.set('KQo');
        range.set('KJs');
        range.set('KJo');
        range.set('KTs');
        range.set('QJs');
        range.set('QTs');
        range.set('JTs');
      } else {
        // SB平跟很宽
        range.set('55');
        range.set('44');
        range.set('33');
        range.set('22');
        range.set('A8s');
        range.set('A7s');
        range.set('A6s');
        range.set('A5s');
        range.set('K9s');
        range.set('K8s');
        range.set('K7s', 0.5);
        range.set('Q9s');
        range.set('Q8s', 0.5);
        range.set('J9s');
        range.set('J8s', 0.5);
        range.set('T9s');
        range.set('T8s');
        range.set('98s');
        range.set('97s', 0.5);
        range.set('87s');
        range.set('76s');
      }
      break;

    case 'BB':
      if (action === 'raise') {
        // BB 3-bet范围
        range.set('AA');
        range.set('KK');
        range.set('QQ');
        range.set('JJ');
        range.set('AKs');
        range.set('AKo');
        range.set('AQs');
        range.set('AJs', 0.5);
        range.set('KQs', 0.3);
        // 偶尔3-bet一些bluff牌
        range.set('A5s', 0.2);
        range.set('A4s', 0.2);
        range.set('KJs', 0.2);
      } else {
        // BB防守范围很宽
        range.set('TT');
        range.set('99');
        range.set('88');
        range.set('77');
        range.set('66');
        range.set('55');
        range.set('44');
        range.set('33');
        range.set('22');
        range.set('AQo');
        range.set('AJo');
        range.set('ATo');
        range.set('A9o');
        range.set('A8o', 0.5);
        range.set('A9s');
        range.set('A8s');
        range.set('A7s');
        range.set('A6s');
        range.set('A5s');
        range.set('A4s');
        range.set('A3s');
        range.set('A2s');
        range.set('KQo');
        range.set('KJo');
        range.set('KTo');
        range.set('K9o', 0.5);
        range.set('KTs');
        range.set('K9s');
        range.set('K8s');
        range.set('K7s');
        range.set('K6s', 0.5);
        range.set('QJo');
        range.set('QTo');
        range.set('Q9o', 0.5);
        range.set('QTs');
        range.set('Q9s');
        range.set('Q8s');
        range.set('Q7s', 0.5);
        range.set('JTo');
        range.set('J9o', 0.5);
        range.set('JTs');
        range.set('J9s');
        range.set('J8s');
        range.set('J7s', 0.5);
        range.set('T9o', 0.5);
        range.set('T9s');
        range.set('T8s');
        range.set('T7s', 0.5);
        range.set('98s');
        range.set('97s');
        range.set('87s');
        range.set('86s', 0.5);
        range.set('76s');
        range.set('75s', 0.5);
        range.set('65s');
        range.set('54s');
      }
      break;
  }

  return range;
}

// 计算组合范围（多个对手）
export function combineOpponentRanges(actions: PlayerAction[]): PreflopRange {
  if (actions.length === 0) {
    // 如果没有行动，返回一个很宽的范围（表示随机手牌）
    const range = new PreflopRange();
    // 添加一个相对较宽的范围作为基准
    range.set('22+'); // 所有对子
    range.set('A2s+'); // 所有A同花
    range.set('A7o+'); // A7o及以上
    range.set('K2s+'); // 所有K同花
    range.set('K9o+'); // K9o及以上
    range.set('Q2s+'); // 所有Q同花
    range.set('QTo+'); // QTo及以上
    range.set('J7s+'); // J7s及以上
    range.set('JTo+'); // JTo及以上
    range.set('T8s+'); // T8s及以上
    range.set('T9o'); // T9o
    range.set('97s+'); // 97s及以上
    range.set('87s'); // 87s
    range.set('76s'); // 76s
    range.set('65s'); // 65s
    range.set('54s'); // 54s
    return range;
  }

  // 为了简化，我们使用最后一个行动的范围
  // 在实际GTO中，这会更复杂，需要考虑多个对手的交互
  const lastAction = actions[actions.length - 1];
  return inferOpponentRange(
    lastAction.position,
    lastAction.action as 'call' | 'raise',
    lastAction.amount
  );
}

// 简化的胜率计算函数
export function calculateEquity(
  heroHand: [Card, Card],
  opponentActions: PlayerAction[]
): Promise<number> {
  return new Promise((resolve) => {
    try {
      // 获取对手范围
      const opponentRange = combineOpponentRanges(opponentActions);

      // 将hero手牌转换为poker-utils格式
      const heroHandStr = handToPokerUtils(heroHand);

      // 使用简化的计算方法
      // 在实际实现中，我们需要更复杂的计算
      // 这里我们使用一个简化的逻辑来估算胜率

      const equity = estimateEquitySimple(heroHand, opponentActions);

      resolve(equity);
    } catch (error) {
      console.error('胜率计算出错:', error);
      // 如果计算出错，返回一个估计值
      resolve(50); // 默认50%胜率
    }
  });
}

// 简化的胜率估算函数
function estimateEquitySimple(
  heroHand: [Card, Card],
  opponentActions: PlayerAction[]
): number {
  // 基础手牌强度评分
  let handStrength = evaluateHandStrength(heroHand);

  // 根据对手行动调整
  for (const action of opponentActions) {
    if (action.action === 'raise') {
      // 面对加注，胜率通常下降
      handStrength *= 0.8;
    } else if (action.action === 'call') {
      // 面对跟注，胜率略微下降
      handStrength *= 0.9;
    }
  }

  // 将强度转换为胜率百分比
  return Math.min(Math.max(handStrength, 0), 100);
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
