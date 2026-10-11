const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// In Vercel, writable path is os.tmpdir(). Locally, it's the project root.
const STORAGE_DIR = process.env.VERCEL ? os.tmpdir() : process.cwd();
const SQLITE_FILE = path.join(STORAGE_DIR, 'data.sqlite');
const JSON_FILE = path.join(STORAGE_DIR, 'data.json');

let dbDriver = null; // 'sqlite' or 'json'
let sqliteDb = null;

// Try to initialize SQLite safely
try {
  const { DatabaseSync } = require('node:sqlite');
  if (typeof DatabaseSync === 'function') {
    sqliteDb = new DatabaseSync(SQLITE_FILE);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        input1 TEXT NOT NULL,
        input2 TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    dbDriver = 'sqlite';
    console.log('[DB] Using SQLite database at:', SQLITE_FILE);
  }
} catch (err) {
  console.warn('[DB] SQLite unavailable or unsupported in this environment. Falling back to JSON storage:', err.message);
  dbDriver = 'json';
}

if (!dbDriver) {
  dbDriver = 'json';
}

// JSON fallback helper functions
function readJsonRecords() {
  try {
    if (fs.existsSync(JSON_FILE)) {
      const data = fs.readFileSync(JSON_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('[DB] Error reading JSON records:', err);
  }
  return [];
}

function writeJsonRecords(records) {
  try {
    fs.writeFileSync(JSON_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving JSON records:', err);
  }
}

// Unified Database API
function addRecord(input1, input2) {
  if (dbDriver === 'sqlite' && sqliteDb) {
    const stmt = sqliteDb.prepare('INSERT INTO records (input1, input2) VALUES (?, ?)');
    stmt.run(String(input1), String(input2));
    return true;
  }

  // JSON fallback
  const records = readJsonRecords();
  const nextId = records.length > 0 ? Math.max(...records.map(r => r.id || 0)) + 1 : 1;
  const newRecord = {
    id: nextId,
    input1: String(input1),
    input2: String(input2),
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  records.unshift(newRecord);
  writeJsonRecords(records);
  return true;
}

function getRecords() {
  if (dbDriver === 'sqlite' && sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM records ORDER BY id DESC');
    return stmt.all();
  }

  return readJsonRecords();
}

function deleteRecord(id) {
  if (dbDriver === 'sqlite' && sqliteDb) {
    const stmt = sqliteDb.prepare('DELETE FROM records WHERE id = ?');
    stmt.run(Number(id));
    return true;
  }

  let records = readJsonRecords();
  records = records.filter(r => String(r.id) !== String(id));
  writeJsonRecords(records);
  return true;
}

function clearRecords() {
  if (dbDriver === 'sqlite' && sqliteDb) {
    const stmt = sqliteDb.prepare('DELETE FROM records');
    stmt.run();
    return true;
  }

  writeJsonRecords([]);
  return true;
}

function getDriver() {
  return dbDriver;
}

module.exports = {
  addRecord,
  getRecords,
  deleteRecord,
  clearRecords,
  getDriver
};
