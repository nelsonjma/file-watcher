import { Database } from "jsr:@db/sqlite@0.12.0";

interface RecordCount {
  qtd: number;
}

interface RecordValue {
  value: string;
}

export class Storage {
  _db: Database;

  constructor() {
    this._db = initDb();
  }

  setEvent(key: string, value: string) {
    upsertEvent(this._db, key, value);
  }

  getEvent(key: string): string | null {
    return getEvent(this._db, key);
  }
}

function initDb(): Database {
  const db = new Database("storage.db");

  db.prepare(`PRAGMA journal_mode=WAL;`).run();

  db.prepare(
    `
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key UNIQUE NOT NULL,
    value TEXT
  )
  `
  ).run();

  return db;
}

function upsertEvent(db: Database, key: string, value: string) {
  const record: RecordCount | undefined = db
    .prepare("SELECT count(1) AS qtd FROM events WHERE key = ?")
    .get(key);

  if (record !== undefined && record.qtd !== 0) {
    db.prepare("UPDATE events SET value = ? WHERE key = ?").run(value, key);
    return;
  }
  // insert new record
  db.prepare(`INSERT INTO events (key, value) VALUES (?, ?)`).run(key, value);
}

function getEvent(db: Database, key: string): string | null {
  const record: RecordValue | undefined = db.prepare("SELECT value FROM events WHERE key = ?").get(key);

  if (record === undefined) {
    return null;
  }

  return record.value;
}
