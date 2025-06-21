# 🃏 Pre-Flop Coach | 德州扑克翻前教练

> 通过无限场景模拟 + 即时AI反馈，快速掌握德州扑克翻前决策能力

[![Deploy Status](https://img.shields.io/badge/deploy-netlify-success)](https://preflop-coach.netlify.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🎯 产品概述

Pre-Flop Coach 是一个专为德州扑克新手设计的互动式在线学习工具。通过智能场景生成和专业AI分析，帮助玩家在无压力环境中快速提升翻前决策水平。

### 🌟 核心特色

- **🎲 无限场景模拟** - 随机生成6-8人牌桌，真实的位置和行动模拟
- **🤖 AI智能分析** - 基于Gemini 2.5 Pro的专业教练级别反馈
- **📊 精确胜率计算** - 集成poker-utils库，提供准确的数学支持
- **🎮 沉浸式体验** - 精美的牌桌俯视图，直观的用户界面
- **📱 响应式设计** - 完美支持移动端和桌面端设备

## 🚀 快速开始

### 在线体验
访问 [Live Demo](https://preflop-coach.netlify.app) 立即开始学习！

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Gavinzbf/preflop-coach.git
cd preflop-coach

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 Gemini API Key

# 启动开发服务器
bun run dev
```

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🎮 功能介绍

### 场景生成系统
- 🎯 智能位置分配（UTG, MP, CO, BTN, SB, BB）
- 🃏 随机手牌生成
- 🎲 基于位置概率的玩家行动模拟
- 📝 动态场景描述生成

### 用户界面
- 🏆 精美的牌桌俯视图设计
- 👤 清晰的玩家位置和状态显示
- 🎴 直观的手牌展示
- 🎛️ 动态决策选项按钮

### 分析引擎
- 📊 专业胜率计算（基于poker-utils）
- 🧠 智能对手范围推断
- 📈 GTO策略建议
- 🎯 个性化学习反馈

### AI教练系统
- 🤖 Gemini 2.5 Pro驱动的分析
- 📚 专业的策略解释
- 🎯 针对性改进建议
- 🏆 鼓励式教学方法

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| TypeScript | 5.6.3 | 类型安全 |
| Vite | 6.3.5 | 构建工具 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| poker-utils | 12.0.6 | 扑克计算库 |
| Gemini API | 2.5 Pro | AI分析引擎 |

## 📁 项目结构

```
preflop-coach/
├── src/
│   ├── components/          # React组件
│   │   ├── PokerTable.tsx   # 牌桌俯视图
│   │   └── PreflopCoach.tsx # 主游戏组件
│   ├── types/               # TypeScript类型定义
│   │   └── poker.ts         # 扑克相关类型
│   ├── utils/               # 工具函数
│   │   ├── poker.ts         # 扑克逻辑
│   │   ├── equity.ts        # 胜率计算
│   │   └── ai.ts           # AI分析
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # 主文件
├── public/                 # 静态资源
├── .env                    # 环境变量
└── package.json           # 项目配置
```

## 🎲 游戏流程

1. **场景生成** - 系统随机生成牌桌、位置和手牌
2. **用户决策** - 玩家从3-4个选项中选择行动
3. **胜率计算** - 后台计算手牌对抗对手范围的胜率
4. **AI分析** - Gemini AI生成专业分析和建议
5. **反馈展示** - 显示结果、胜率和学习要点
6. **继续练习** - 点击"下一题"开始新场景

## 🎯 学习目标

通过使用Pre-Flop Coach，你将学会：

- ✅ 根据位置调整翻前策略
- ✅ 理解手牌强度和胜率概念
- ✅ 掌握基础的GTO（游戏理论最优）策略
- ✅ 提升对对手行动的解读能力
- ✅ 建立正确的翻前决策框架

## 🤝 贡献指南

欢迎提交 Pull Request 或 Issue！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📜 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [poker-utils](https://www.npmjs.com/package/poker-utils) - 专业的扑克计算库
- [Google Gemini](https://ai.google.dev/) - 强大的AI分析能力
- [Tailwind CSS](https://tailwindcss.com/) - 优秀的CSS框架

---

<div align="center">

**🚀 开始你的德州扑克学习之旅！**

[立即体验](https://preflop-coach.netlify.app) | [查看源码](https://github.com/Gavinzbf/preflop-coach) | [反馈建议](https://github.com/Gavinzbf/preflop-coach/issues)

Made with ❤️ by [Same](https://same.new)

</div>
