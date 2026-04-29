<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## 项目概述

**Vocab Trainer** — 一款专注、无干扰的词汇记忆工具，基于 SM-2 间隔重复算法。

- 多用户，每用户独立学习数据
- 多词库，支持 CSV/TXT 导入
- SM-2 算法驱动复习计划
- TTS 使用有道免费接口（`https://dict.youdao.com/dictvoice?audio={word}&type={1|2}`，type=1=英音，type=2=美音）
- 词库数据来源 [kajweb/dict](https://github.com/kajweb/dict) JSON 格式
- 技术栈：Next.js 16（App Router）、Prisma、CSS Modules、SWR
- 开发端口：**4010**

---

## 核心规范

### 认证与数据隔离

- 认证使用 NextAuth 5（`auth.ts`、`app/api/auth/[...nextauth]/route.ts`）
- 所有数据库查询必须按 `session.user.id` 过滤 —— **严禁**跨用户访问数据
- 使用 `lib/session.ts` 辅助函数获取当前用户

### SM-2 算法（`lib/sm2.ts`）

- 每用户每单词字段：`interval`、`easeFactor`、`nextReviewDate`、`reviewCount`、`detailViewed`
- 复习质量映射：
  - 未查详情 + 记住 → q=4
  - 查详情 + 记住 → q=3
  - 没记住 → q=0
- `next_review_date <= today` 即为待复习单词，按记忆阶段优先级排序
- 对 `next_review_date` 建立数据库索引以提升查询性能

### 单词数据（`lib/word-content.ts`）

- 原始词库数据来自 `public/books/` 下的 JSON 文件
- API 路由：`GET /api/words/[id]/detail`（异步加载，需要骨架屏）
- 返回字段：单词、音标（美音/英音）、释义、短语、例句、近义词、同根词

### 词库管理（`app/(app)/banks/`）

- 词库字段：id、userId、name、tags、group、sortOrder、createdAt
- 导入：解析 CSV/TXT，映射到 `words` 表和 `user_word_progress` 表
- 排序方式：字母序、长度序、词频序、乱序

### 学习流程

1. **选词阶段**：列表展示最多 30 个单词，点击播放 TTS → 显示翻译 → 再次点击隐藏并重播。操作按钮："认识"（→ 复习队列，interval=3天）/ "不认识"（→ 学习队列）
2. **学习阶段**：每组 5 词，右侧"详情"按钮异步弹框。`detailViewed` 标记影响 SM-2 质量分
3. **复习阶段**：展示本批次学习的单词，"记住"/"没记住"按钮。算法根据 SM-2 公式更新 `interval`/`easeFactor`/`nextReviewDate`
4. 所有流程结束后返回仪表盘

### 仪表盘（`app/(app)/dashboard/`）

- 展示：今日新词数、待复习数、今日已完成
- 单词掌握状态分布：新词 / 学习中 / 熟悉 / 已掌握 / 永久记忆
- 各词库学习进度百分比

### UI/UX 规范

- 使用 CSS Modules（`.module.css`），不主动使用 Tailwind
- 单词大字展示（无障碍、移动端友好）
- 深色/浅色主题切换
- 异步加载时使用骨架屏
- 界面干净，无运营/社交/打卡元素

### API 规范

- 变更操作使用 Server Actions（`actions.ts` 文件）
- 数据获取使用 SWR，支持乐观更新
- 单词详情 API 响应时间 < 500ms
- 事件追踪：`session_start`、`word_known`、`word_unknown`、`detail_viewed`、`review_remembered`、`review_forgotten`、`session_complete`

### 文件结构

```
app/
  (app)/              → 受保护路由（dashboard、learn、review、banks）
  (auth)/             → 登录、注册页面
  api/words/[id]/detail/  → 单词详情 API
  api/auth/           → NextAuth 路由
components/          → 共享 UI 组件
lib/
  sm2.ts              → SM-2 算法
  word-content.ts      → 单词内容辅助函数
  prisma.ts           → Prisma 客户端
  session.ts          → 认证会话辅助函数
  stats.ts            → 仪表盘统计
  scheduler.ts        → 复习调度逻辑
  validators.ts       → Zod 校验模式
  tts.ts              → TTS URL 构建
prisma/schema.prisma  → 数据模型（users、word_banks、words、user_word_progress）
public/books/        → 导入的词库 JSON 文件
scripts/             → 数据初始化和导入脚本
```
