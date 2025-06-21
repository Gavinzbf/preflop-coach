export type Suit = 'c' | 'd' | 'h' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB' | 'UTG+1' | 'UTG+2';

export interface PlayerAction {
  position: Position;
  action: 'fold' | 'call' | 'raise';
  amount?: number; // 加注金额，相对于大盲注的倍数
}

export interface GameScenario {
  tableSize: number; // 6-8人牌桌
  heroPosition: Position;
  heroCards: [Card, Card];
  previousActions: PlayerAction[];
  potSize: number; // 以大盲注为单位
  toCall: number; // 需要跟注的金额（以大盲注为单位）
}

export interface DecisionOption {
  action: 'fold' | 'call' | 'raise';
  amount?: number; // 加注金额
  description: string; // 策略描述
  label: string; // 按钮显示文本
}

export interface AnalysisResult {
  equity: number; // 胜率百分比 (0-100)
  gtoRecommendation: string;
  userChoice: DecisionOption;
  feedback: string;
  isCorrect: boolean;
}
