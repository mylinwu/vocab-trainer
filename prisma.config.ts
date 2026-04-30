import { defineConfig, env } from "prisma/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function getDbUrl() {
  // 支持本地 .env 文件，Vercel 则通过环境变量注入
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
    if (match) return match[1].trim();
  }
  return env("DATABASE_URL") ?? "file:./dev.db";
}

export default defineConfig({
  datasource: {
    url: getDbUrl(),
  },
});
