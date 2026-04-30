import { defineConfig, env } from "prisma/config";
import { getDatabaseUrl, loadProjectEnv } from "./lib/database-url";

loadProjectEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ? env("DATABASE_URL") : getDatabaseUrl({ allowDefault: true }),
  },
});
