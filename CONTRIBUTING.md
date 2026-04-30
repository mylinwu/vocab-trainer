# Contributing to Vocab Trainer

感谢您对本项目的兴趣！欢迎提交 Issue 和 Pull Request。

## 开发环境

### 环境要求

- Node.js 18+
- pnpm 8+

### 本地开发

```bash
# 克隆代码库
git clone <your-fork-url>
cd vocab-trainer

# 安装依赖
pnpm install

# 复制环境变量文件
cp .env.example .env

# 初始化数据库
pnpm db:generate
pnpm db:push

# 启动开发服务器
pnpm dev
```

## 代码规范

- 使用 TypeScript，启用 strict 模式
- 使用 ESLint 检查代码
- 样式使用 CSS Modules，不使用 Tailwind
- 所有数据库查询必须按 `session.user.id` 过滤，确保数据隔离

## 分支策略

- `master` — 稳定版本
- 功能开发请创建新分支

## 测试

运行单元测试：

```bash
pnpm test
```

## 提交规范

建议使用以下提交前缀：

- `feat:` — 新功能
- `fix:` — Bug 修复
- `docs:` — 文档更新
- `refactor:` — 代码重构
- `test:` — 测试相关

## Pull Request 流程

1. Fork 本仓库并创建功能分支
2. 确保 `pnpm lint` 和 `pnpm test` 均通过
3. 提交 Pull Request 并描述改动内容

## 相关资源

- [项目文档](./README.md)
- [设计规范](./DESIGN.md)
- [SM-2 算法实现](./lib/sm2.ts)
- [词库数据来源](https://github.com/kajweb/dict)
