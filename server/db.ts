import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL belum diset. Isi di file .env dengan connection string Supabase Postgres kamu.');
}

// Supabase requires SSL; rejectUnauthorized:false is standard for their pooled connection strings.
export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
});

// --- Compatibility shim so route code keeps the same db.prepare(sql).get/.all/.run(...) shape
// we used with the old SQLite driver — but now backed by real Postgres, and async. ---

// Converts our SQLite-style placeholders into Postgres $1, $2... placeholders.
// Named object args: `@key` in the SQL -> value from params[key]
// Positional args:    `?` in the SQL    -> values in call order
function toPositional(sqlText: string, args: any[]): { text: string; values: any[] } {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const params = args[0];
    const values: any[] = [];
    const text = sqlText.replace(/@(\w+)/g, (_match, key) => {
      values.push(params[key] === undefined ? null : params[key]);
      return `$${values.length}`;
    });
    return { text, values };
  }
  let i = 0;
  const values = args.map((a) => (a === undefined ? null : a));
  const text = sqlText.replace(/\?/g, () => `$${++i}`);
  return { text, values };
}

// Postgres folds unquoted identifiers to lowercase, but our schema/columns use camelCase
// (className, passwordHash, etc). Auto-wrap any camelCase identifier in double quotes so
// Postgres preserves case, without having to hand-edit every query in index.ts.
function autoQuoteCamelCase(text: string): string {
  return text.replace(/\b([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*)\b/g, '"$1"');
}

function prepare(sqlText: string) {
  return {
    async get(...args: any[]) {
      const { text, values } = toPositional(sqlText, args);
      const result = await pool.query(autoQuoteCamelCase(text), values);
      return result.rows[0];
    },
    async all(...args: any[]) {
      const { text, values } = toPositional(sqlText, args);
      const result = await pool.query(autoQuoteCamelCase(text), values);
      return result.rows;
    },
    async run(...args: any[]) {
      const { text, values } = toPositional(sqlText, args);
      await pool.query(autoQuoteCamelCase(text), values);
      return {};
    },
  };
}

const db = {
  prepare,
  async exec(sqlText: string) {
    await pool.query(sqlText);
  },
};

export async function initSchema() {
  await db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('guru', 'siswa')),
  name TEXT NOT NULL,
  nis TEXT,
  "className" TEXT NOT NULL,
  "schoolName" TEXT,
  semester TEXT,
  "avatarEmoji" TEXT DEFAULT '🧑‍🎓',
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  "className" TEXT NOT NULL,
  day TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  "colorTag" TEXT,
  "onlineMeetingUrl" TEXT,
  "onlinePlatform" TEXT
);

CREATE TABLE IF NOT EXISTS duties (
  id TEXT PRIMARY KEY,
  "className" TEXT NOT NULL,
  day TEXT NOT NULL,
  students TEXT NOT NULL,
  tasks TEXT NOT NULL,
  "isCompletedToday" INTEGER DEFAULT 0,
  "completedDate" TEXT
);

CREATE TABLE IF NOT EXISTS homeworks (
  id TEXT PRIMARY KEY,
  "className" TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "dueTime" TEXT NOT NULL,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  "submissionMode" TEXT,
  "createdAt" TEXT NOT NULL,
  "createdBy" TEXT
);

CREATE TABLE IF NOT EXISTS homework_completions (
  "homeworkId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  "completedAt" TEXT,
  PRIMARY KEY ("homeworkId", "userId"),
  FOREIGN KEY ("homeworkId") REFERENCES homeworks(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "className" TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  method TEXT,
  "learningMode" TEXT,
  "networkStatus" TEXT,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_cycle (
  "className" TEXT PRIMARY KEY,
  "currentMode" TEXT NOT NULL DEFAULT 'online',
  "cycleMonthsOnline" INTEGER DEFAULT 2,
  "cycleMonthsOffline" INTEGER DEFAULT 1,
  "currentMonthInCycle" INTEGER DEFAULT 1,
  "cycleStartDate" TEXT,
  "onlinePlatformName" TEXT,
  "defaultMeetLink" TEXT,
  "cycleNotes" TEXT
);
`);
}

export { db };
export default db;
