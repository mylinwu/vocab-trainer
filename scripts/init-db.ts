import { createClient } from "@libsql/client";
import { resolve } from "path";

const url = process.env.DATABASE_URL!;
const client = createClient({ url });

const schema = `
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT 'us',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS UserBank (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  bookId TEXT NOT NULL,
  sortRule TEXT NOT NULL DEFAULT 'rank',
  addedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(userId, bookId)
);

CREATE TABLE IF NOT EXISTS UserWordProgress (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  bookId TEXT NOT NULL,
  wordRank INTEGER NOT NULL,
  headWord TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  interval INTEGER NOT NULL DEFAULT 0,
  easeFactor REAL NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  nextReviewDate TEXT,
  detailViewed INTEGER NOT NULL DEFAULT 0,
  lastReviewedAt TEXT,
  reviewCount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(userId, bookId, wordRank)
);

CREATE TABLE IF NOT EXISTS SessionEvent (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_UserWordProgress_userId_nextReviewDate ON UserWordProgress(userId, nextReviewDate);
CREATE INDEX IF NOT EXISTS idx_UserWordProgress_userId_status ON UserWordProgress(userId, status);
CREATE INDEX IF NOT EXISTS idx_SessionEvent_userId_createdAt ON SessionEvent(userId, createdAt);
`;

async function main() {
  const isLocal = url.startsWith("file:");
  console.log(`Connecting to: ${isLocal ? url : "[remote Turso DB]"}`);

  // Execute each statement separately
  const statements = schema.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log(`✓ ${stmt.substring(0, 60)}...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`⏭  ${stmt.substring(0, 60)}... (already exists)`);
      } else {
        console.error(`✗ ${stmt.substring(0, 60)}...`);
        console.error(`  Error: ${msg}`);
      }
    }
  }

  console.log("\nDone!");
  client.close();
}

main().catch(console.error);
