import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_DATABASE_URL = "file:./dev.db";
const SQLITE_SCHEMA_DIR = "prisma";
const LOCAL_FILE_PREFIX = "file:";

export function loadProjectEnv(cwd = process.cwd()) {
  const envPath = resolve(cwd, ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    process.env[key] ??= value;
  }
}

export function getDatabaseUrl(options: { allowDefault?: boolean } = {}) {
  const value = cleanEnvValue(process.env.DATABASE_URL);
  if (value) return value;
  if (options.allowDefault) return DEFAULT_DATABASE_URL;
  throw new Error("DATABASE_URL is not configured.");
}

export function getRuntimeDatabaseUrl(databaseUrl = getDatabaseUrl()) {
  assertSqliteCompatibleUrl(databaseUrl);

  if (!databaseUrl.startsWith(LOCAL_FILE_PREFIX)) {
    return stripAuthTokenFromUrl(databaseUrl);
  }

  const filePath = databaseUrl.slice(LOCAL_FILE_PREFIX.length);
  if (isSpecialOrAbsoluteFilePath(filePath)) return databaseUrl;

  const normalizedPath = filePath.replace(/^\.?[\\/]/, "");
  const absolutePath = resolve(process.cwd(), SQLITE_SCHEMA_DIR, normalizedPath).replace(/\\/g, "/");
  return `${LOCAL_FILE_PREFIX}${absolutePath}`;
}

export function getTursoAuthToken(databaseUrl = process.env.DATABASE_URL) {
  const envToken = cleanEnvValue(process.env.TURSO_AUTH_TOKEN);
  if (envToken) return envToken;

  if (!databaseUrl || databaseUrl.startsWith(LOCAL_FILE_PREFIX)) return undefined;
  return new URL(databaseUrl).searchParams.get("authToken") ?? undefined;
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!match) return null;

  return [match[1], cleanEnvValue(match[2]) ?? ""];
}

function cleanEnvValue(value: string | undefined) {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function assertSqliteCompatibleUrl(databaseUrl: string) {
  const protocol = getProtocol(databaseUrl);
  if (protocol === "file:" || protocol === "libsql:" || protocol === "http:" || protocol === "https:" || protocol === "ws:" || protocol === "wss:") {
    return;
  }

  throw new Error(
    `Unsupported DATABASE_URL protocol "${protocol}". This schema is configured for SQLite/libSQL; PostgreSQL or other providers require changing prisma/schema.prisma and the Prisma adapter.`,
  );
}

function getProtocol(databaseUrl: string) {
  if (databaseUrl.startsWith(LOCAL_FILE_PREFIX)) return LOCAL_FILE_PREFIX;
  return new URL(databaseUrl).protocol;
}

function stripAuthTokenFromUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("authToken");
  return url.toString();
}

function isSpecialOrAbsoluteFilePath(filePath: string) {
  return (
    filePath === ":memory:" ||
    filePath.startsWith("/") ||
    filePath.startsWith("\\") ||
    /^[A-Za-z]:[\\/]/.test(filePath)
  );
}
