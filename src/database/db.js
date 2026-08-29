import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export function createDatabase(dbPath = "./data/csms.db") {
  // Ensure the directory exists if a file path is provided
  if (dbPath !== ":memory:") {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

  return db;
}