# Vocab Trainer

一款基于 SM-2 间隔重复算法的专注、无干扰的词汇记忆工具。

[English](#english) | 中文

---

## 功能特性

- **SM-2 间隔重复算法** — 科学记忆曲线，优化复习节奏
- **多词库支持** — 内置 CET4、PEP 教材、外研社教材等词库，支持 CSV/TXT 导入
- **发音辅助** — 有道 TTS 英音/美音切换
- **学习流程完整** — 选词 → 学习 → 复习三阶段闭环
- **数据可视化** — 仪表盘展示学习进度、掌握分布、词库完成度
- **多用户隔离** — 独立账户，数据完全隔离
- **响应式界面** — 适配桌面和移动端，支持深色/浅色主题

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: SQLite + Prisma ORM
- **认证**: NextAuth 5 (JWT Session)
- **状态管理**: Zustand + SWR
- **样式**: CSS Modules
- **算法**: SM-2 Spaced Repetition
- **TTS**: 有道词典免费接口

## 快速开始

### 前置依赖

- Node.js 18+
- pnpm 8+（推荐）

### 安装

```bash
git clone <your-repo-url>
cd vocab-trainer
pnpm install
```

### 环境变量

```bash
cp .env.example .env
# DATABASE_URL 和 AUTH_SECRET 已预设开发默认值，可直接使用
```

### 初始化数据库

```bash
pnpm db:generate   # 生成 Prisma Client
pnpm db:push       # 创建数据库表
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:4010](http://localhost:4010)，注册账户后即可开始学习。

## 词库

内置词库位于 `public/books/`，数据来源 [kajweb/dict](https://github.com/kajweb/dict)。

| 词库 | 描述 |
|------|------|
| CET4 | 大学英语四级词汇 |
| PEPGaozhong_* | 高中英语教材（必修 + 选修） |
| PEPChuzhong_* | 初中英语教材 |
| PEPXiaoxue* | 小学英语教材 |
| WaiYanSheChuZhong_* | 外研社初中英语 |

## 项目结构

```
app/
  (app)/           # 受保护路由（需登录）
    dashboard/      # 仪表盘
    learn/         # 学习流程
    review/        # 复习流程
    banks/         # 词库管理
    words/         # 单词列表
    settings/      # 设置
  (auth)/          # 认证路由
    login/         # 登录
    register/     # 注册
  api/             # API 路由
components/        # 共享 UI 组件
lib/
  sm2.ts           # SM-2 算法实现
  sm2.test.ts      # SM-2 单元测试
  stats.ts         # 仪表盘统计数据
  session.ts       # 认证会话辅助
  validators.ts    # Zod 输入校验
  tts.ts           # TTS URL 构建
prisma/
  schema.prisma    # 数据模型
public/books/      # 内置词库 JSON
```

## 主要命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（端口 4010）|
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 运行单元测试（Vitest）|
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:push` | 推送 schema 到数据库 |
| `pnpm db:studio` | 打开 Prisma Studio |

## 数据模型

- **User** — 用户账户（用户名、密码哈希、口音偏好）
- **UserBank** — 用户启用的词库（每用户每词库独立排序规则）
- **UserWordProgress** — 用户单词学习进度（SM-2 字段：interval、easeFactor、nextReviewDate 等）
- **SessionEvent** — 学习事件日志（session_start、word_known、review_remembered 等）

## 开发说明

### SM-2 算法质量映射

| 操作 | 质量分 q |
|------|----------|
| 未查详情 + 记住 | 4 |
| 查详情 + 记住 | 3 |
| 没记住 | 0 |

### TTS 发音

使用有道词典免费 TTS，type=1 为英音，type=2 为美音，可在设置中切换。

## License

MIT

---

## English

A distraction-free vocabulary trainer powered by the SM-2 spaced repetition algorithm.

### Tech Stack

- Next.js 16 (App Router) + React 19
- SQLite + Prisma
- NextAuth 5 (JWT)
- Zustand + SWR
- CSS Modules

### Quick Start

```bash
git clone <your-repo-url>
cd vocab-trainer
pnpm install
cp .env.example .env
pnpm db:generate && pnpm db:push
pnpm dev
```

Visit [http://localhost:4010](http://localhost:4010) to get started.
