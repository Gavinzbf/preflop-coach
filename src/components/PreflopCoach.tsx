import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { GameScenario, DecisionOption, AnalysisResult } from '../types/poker';
import { generateScenario, generateDecisionOptions, generateScenarioDescription } from '../utils/poker';
import { calculateEquity } from '../utils/equity';
import { generateAnalysis } from '../utils/ai';
import { PokerTable } from './PokerTable';

export const PreflopCoach: React.FC = () => {
  const [scenario, setScenario] = useState<GameScenario | null>(null);
  const [decisionOptions, setDecisionOptions] = useState<DecisionOption[]>([]);
  const [scenarioDescription, setScenarioDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [gamePhase, setGamePhase] = useState<'scenario' | 'feedback'>('scenario');

  // 生成新场景
  const generateNewScenario = useCallback(() => {
    const newScenario = generateScenario();
    const options = generateDecisionOptions(newScenario);
    const description = generateScenarioDescription(newScenario);

    setScenario(newScenario);
    setDecisionOptions(options);
    setScenarioDescription(description);
    setAnalysisResult(null);
    setGamePhase('scenario');
  }, []);

  // 处理用户选择
  const handleUserChoice = async (choice: DecisionOption) => {
    if (!scenario) return;

    setIsAnalyzing(true);
    setGamePhase('feedback');

    try {
      // 计算胜率
      const equity = await calculateEquity(scenario.heroCards, scenario.previousActions);

      // 生成AI分析
      const analysis = await generateAnalysis(scenario, choice, equity);

      setAnalysisResult(analysis);
    } catch (error) {
      console.error('分析过程出错:', error);
      // 显示错误状态的分析结果
      setAnalysisResult({
        equity: 50,
        gtoRecommendation: '计算出错',
        userChoice: choice,
        feedback: '抱歉，分析过程中出现了错误。请点击"下一题"继续练习。',
        isCorrect: false,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 组件加载时生成第一个场景
  useEffect(() => {
    generateNewScenario();
  }, [generateNewScenario]);

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">正在加载...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 头部 */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center">
            Pre-Flop Coach <span className="text-blue-400">翻前教练</span>
          </h1>
          <p className="text-gray-300 text-center mt-2">
            提升你的德州扑克翻前决策能力
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* 牌桌区域 */}
        <div className="mb-8">
          <PokerTable scenario={scenario} />
        </div>

        {/* 场景描述区域 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-center">场景描述</h2>
          <p className="text-lg text-gray-200 leading-relaxed text-center">
            {scenarioDescription}
          </p>
        </div>

        {/* 决策/反馈区域 */}
        {gamePhase === 'scenario' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-center">选择你的行动</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {decisionOptions.map((option) => (
                <button
                  key={`${option.action}-${option.amount || 0}-${option.label}`}
                  onClick={() => handleUserChoice(option)}
                  className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200
                           rounded-lg p-4 text-left border-2 border-transparent
                           hover:border-blue-400 group"
                >
                  <div className="font-bold text-lg mb-2">{option.label}</div>
                  <div className="text-sm text-gray-300 group-hover:text-gray-200">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {gamePhase === 'feedback' && (
          <div className="bg-gray-800 rounded-lg p-6">
            {isAnalyzing ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4" />
                <div className="text-lg">AI正在分析你的决策...</div>
                <div className="text-sm text-gray-400 mt-2">计算胜率和GTO建议</div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                {/* 结果概览 */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${
                    analysisResult.isCorrect
                      ? 'bg-green-600 text-green-100'
                      : 'bg-red-600 text-red-100'
                  }`}>
                    {analysisResult.isCorrect ? '✓ 正确决策!' : '✗ 需要改进'}
                  </div>
                </div>

                {/* 数据展示 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">你的选择</div>
                    <div className="text-lg font-bold text-blue-400">
                      {analysisResult.userChoice.label}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">胜率</div>
                    <div className="text-lg font-bold text-green-400">
                      {analysisResult.equity.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">GTO建议</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {analysisResult.gtoRecommendation}
                    </div>
                  </div>
                </div>

                {/* AI反馈 */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-bold mb-4 flex items-center">
                    🤖 <span className="ml-2">AI教练分析</span>
                  </h4>
                  <div className="text-gray-200 leading-relaxed space-y-3">
                    {(() => {
                      // 首先尝试按双换行符分段
                      if (analysisResult.feedback.includes('\n\n')) {
                        return analysisResult.feedback.split('\n\n').map((paragraph, index) => {
                          if (paragraph.trim()) {
                            return (
                              <p key={`paragraph-${index}-${paragraph.slice(0, 10)}`} className="text-sm sm:text-base leading-relaxed">
                                {paragraph.trim()}
                              </p>
                            );
                          }
                          return null;
                        });
                      }

                      // 如果没有双换行符，按句号分段（每2-3句为一段）
                      const sentences = analysisResult.feedback.split('。').filter(s => s.trim());
                      const paragraphs = [];
                      for (let i = 0; i < sentences.length; i += 2) {
                        const paragraph = sentences.slice(i, i + 2).join('。') + (i + 2 < sentences.length ? '。' : '');
                        if (paragraph.trim()) {
                          paragraphs.push(paragraph);
                        }
                      }

                      return paragraphs.map((paragraph, index) => (
                        <p key={`sentence-${index}-${paragraph.slice(0, 10)}`} className="text-sm sm:text-base leading-relaxed">
                          {paragraph}
                        </p>
                      ));
                    })()}
                  </div>
                </div>

                {/* 下一题按钮 */}
                <div className="text-center">
                  <button
                    onClick={generateNewScenario}
                    className="bg-green-600 hover:bg-green-700 transition-colors duration-200
                             px-8 py-3 rounded-lg text-lg font-bold"
                  >
                    下一题 🚀
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <footer className="bg-gray-800 border-t border-gray-700 p-4 mt-12">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          <p>通过无限场景模拟 + 即时AI反馈，快速掌握翻前决策能力</p>
          <p className="mt-1">🃏 盲注结构: 1/2BB | 🎯 专注翻前策略 | 🤖 AI驱动分析</p>
        </div>
      </footer>
    </div>
  );
};
