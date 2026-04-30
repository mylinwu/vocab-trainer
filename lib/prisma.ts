import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { Agent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";
import { getDatabaseUrl, getRuntimeDatabaseUrl, getTursoAuthToken, loadProjectEnv } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const DEFAULT_LIBSQL_CONNECT_TIMEOUT_MS = 30_000;

loadProjectEnv();

function getLibSqlConnectTimeoutMs() {
  const rawValue = process.env.LIBSQL_CONNECT_TIMEOUT_MS;

  if (!rawValue) {
    return DEFAULT_LIBSQL_CONNECT_TIMEOUT_MS;
  }

  const timeoutMs = Number(rawValue);

  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new Error("LIBSQL_CONNECT_TIMEOUT_MS must be a non-negative number.");
  }

  return timeoutMs;
}

const libSqlDispatcher = new Agent({
  connectTimeout: getLibSqlConnectTimeoutMs(),
});

function libSqlFetch(request: Request) {
  const init: UndiciRequestInit = {
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body: request.body as unknown as UndiciRequestInit["body"],
    signal: request.signal,
    dispatcher: libSqlDispatcher,
  };

  if (request.body) {
    init.duplex = "half";
  }

  return undiciFetch(request.url, init);
}

function getLibSqlConfig() {
  const databaseUrl = getDatabaseUrl();
  const url = getRuntimeDatabaseUrl(databaseUrl);
  const authToken = getTursoAuthToken(databaseUrl);
  return {
    url,
    authToken,
    fetch: libSqlFetch,
  };
}

function createPrismaClient() {
  const adapter = new PrismaLibSql(getLibSqlConfig());

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
