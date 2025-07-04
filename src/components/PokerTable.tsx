import type React from 'react';
import type { GameScenario } from '../types/poker';
import { getPositionsForTableSize, getPositionDisplayName } from '../utils/poker';
import { formatCard } from '../utils/poker';
import type { Position } from '../types/poker';

interface PokerTableProps {
  scenario: GameScenario;
}

// 位置的坐标映射 (相对于中心的百分比位置)
const getPositionCoordinates = (position: Position, tableSize: number) => {
  const positions = getPositionsForTableSize(tableSize);
  const index = positions.indexOf(position);
  const total = positions.length;

  // 计算角度 (从12点钟方向开始，顺时针)
  const angle = (index * 360 / total) - 90; // -90度让第一个位置在顶部
  const radian = (angle * Math.PI) / 180;

  // 椭圆半径
  const radiusX = 35; // 水平半径
  const radiusY = 25; // 垂直半径

  // 计算位置
  const x = 50 + radiusX * Math.cos(radian);
  const y = 50 + radiusY * Math.sin(radian);

  return { x, y };
};

export const PokerTable: React.FC<PokerTableProps> = ({ scenario }) => {
  const { tableSize, heroPosition, previousActions } = scenario;
  const positions = getPositionsForTableSize(tableSize);

  // 创建玩家状态映射
  const playerStatus = new Map();

  // 设置Hero
  playerStatus.set(heroPosition, { type: 'hero', action: null });

  // 设置前面有行动的玩家
  for (const action of previousActions) {
    playerStatus.set(action.position, {
      type: 'opponent',
      action: action.action,
      amount: action.amount
    });
  }

  // 设置其他玩家为弃牌
  for (const pos of positions) {
    if (!playerStatus.has(pos)) {
      playerStatus.set(pos, { type: 'folded', action: 'fold' });
    }
  }

  return (
    <div className="relative w-full h-96 mx-auto">
      {/* 牌桌背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-900 rounded-full border-8 border-yellow-600 shadow-2xl">
        {/* 牌桌内圈 */}
        <div className="absolute inset-8 bg-gradient-to-br from-green-600 to-green-800 rounded-full border-4 border-yellow-500">
          {/* 中央区域 */}
          <div className="absolute inset-1/3 bg-green-700 rounded-full flex items-center justify-center">
            <div className="text-yellow-200 text-sm font-bold text-center">
              <div>锅底: {scenario.potSize}BB</div>
              <div className="text-xs mt-1">翻前</div>
            </div>
          </div>
        </div>
      </div>

      {/* 玩家位置 */}
      {positions.map((position) => {
        const coords = getPositionCoordinates(position, tableSize);
        const status = playerStatus.get(position);
        const isHero = status?.type === 'hero';
        const isFolded = status?.type === 'folded';

        return (
          <div
            key={position}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
            }}
          >
            {/* 玩家座位 */}
            <div
              className={`
                w-16 h-16 rounded-full border-3 flex items-center justify-center relative
                transition-all duration-300
                ${isHero
                  ? 'bg-blue-500 border-blue-300 shadow-lg shadow-blue-300/50'
                  : isFolded
                    ? 'bg-gray-600 border-gray-400 opacity-50'
                    : 'bg-red-500 border-red-300 shadow-lg shadow-red-300/50'
                }
              `}
            >
              {/* 位置标签 */}
              <div className="text-white text-xs font-bold text-center">
                <div>{position}</div>
                {isHero && <div className="text-[10px]">YOU</div>}
              </div>

              {/* 行动指示器 */}
              {status?.action && status.action !== 'fold' && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-400 text-black text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                    {status.action === 'call' ? '跟注' : `加注${status.amount}BB`}
                  </div>
                </div>
              )}
            </div>

            {/* 位置名称 */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
              <div className="text-white text-xs font-medium whitespace-nowrap">
                {getPositionDisplayName(position)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Hero手牌显示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {scenario.heroCards.map((card) => (
            <div
              key={`${card.rank}${card.suit}`}
              className="w-12 h-16 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center shadow-lg"
            >
              <div className={`text-lg font-bold ${
                card.suit === 'h' || card.suit === 'd' ? 'text-red-600' : 'text-black'
              }`}>
                <div className="text-center">
                  <div>{card.rank}</div>
                  <div className="text-xs">
                    {formatCard(card).slice(-2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
