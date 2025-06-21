export type Suit = 'c' | 'd' | 'h' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB' | 'UTG+1' | 'UTG+2';

export type GameStreet = 'preflop' | 'flop' | 'turn' | 'river';

export interface PlayerAction {
  position: Position;
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise';
  amount?: number; // 下注/加注金额，相对于大盲注的倍数
  street: GameStreet; // 行动发生的街道
}

export interface GameScenario {
  tableSize: number; // 6-8人牌桌
  heroPosition: Position;
  heroCards: [Card, Card];
  boardCards: Card[]; // 公共牌 [flop1, flop2, flop3, turn?, river?]
  currentStreet: GameStreet; // 当前游戏阶段
  allActions: PlayerAction[]; // 所有街道的行动历史
  currentStreetActions: PlayerAction[]; // 当前街道的行动
  potSize: number; // 以大盲注为单位
  toCall: number; // 需要跟注的金额（以大盲注为单位）
  lastBetSize?: number; // 最后一次下注的大小
}

export interface DecisionOption {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise';
  amount?: number; // 下注/加注金额
  description: string; // 策略描述
  label: string; // 按钮显示文本
}

// GTO混合策略
export interface GTOStrategy {
  fold: number;   // 弃牌频率 (0-100)
  check?: number; // 过牌频率 (0-100)
  call: number;   // 跟注频率 (0-100)
  bet?: number;   // 下注频率 (0-100)
  raise: number;  // 加注频率 (0-100)
}

// 牌面纹理分析
export interface BoardTexture {
  type: 'dry' | 'wet' | 'coordinated'; // 干燥/湿润/协调
  pairs: number; // 对子数量
  flushDraw: boolean; // 是否有同花听牌
  straightDraw: boolean; // 是否有顺子听牌
  highCard: Rank; // 最高牌
}

// 手牌类型分析
export interface HandStrength {
  type: 'high_card' | 'pair' | 'two_pair' | 'trips' | 'straight' | 'flush' | 'full_house' | 'quads' | 'straight_flush';
  rank: number; // 1-9 (高牌到同花顺)
  kickers: Rank[]; // 踢脚牌
}

export interface AnalysisResult {
  equity: number; // 胜率百分比 (0-100)
  gtoRecommendation: string; // 保留旧的字符串格式用于AI分析
  gtoStrategy: GTOStrategy; // 新的混合策略
  userChoice: DecisionOption;
  feedback: string;
  isCorrect: boolean;
  boardTexture?: BoardTexture; // 翻牌圈牌面分析
  handStrength?: HandStrength; // 手牌强度分析
  street: GameStreet; // 分析所属的街道
}
