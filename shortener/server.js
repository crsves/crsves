'use strict';

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { customAlphabet } = require('nanoid');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

// ── Config ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || 'https://crsv.es';
const SHORT_DOMAIN = process.env.SHORT_DOMAIN || 'https://r.crsv.es';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'shortener.db');
const SALT_ROUNDS = 10;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || '';
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || '';

// Reserved codes that cannot be used as custom short codes
const RESERVED_CODES = new Set([
  'api', 's', 'health', 'unlock', 'favicon.ico', 'robots.txt',
  'sitemap.xml', '_astro', 'cdn-images', 'fonts', 'images', 'js', 'scripts',
]);

// base62 alphabet — no lookalike chars (0, O, l, 1, I)
const nanoid = customAlphabet(
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  6
);

// ── Database setup ───────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT    NOT NULL UNIQUE,
    original_url   TEXT    NOT NULL,
    password_hash  TEXT,
    deletion_token TEXT    NOT NULL UNIQUE,
    created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at     INTEGER
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id     INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    ip          TEXT,
    referrer    TEXT,
    user_agent  TEXT,
    device_type TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_links_code   ON links(code);
  CREATE INDEX IF NOT EXISTS idx_clicks_link  ON clicks(link_id);
  CREATE INDEX IF NOT EXISTS idx_links_expiry ON links(expires_at) WHERE expires_at IS NOT NULL;
`);

// Migration: add device_type column to existing clicks tables
try { db.exec('ALTER TABLE clicks ADD COLUMN device_type TEXT'); } catch {}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ALLOWED_SCHEMES = /^https?:\/\//i;

function validateUrl(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!ALLOWED_SCHEMES.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    const h = u.hostname.toLowerCase();
    if (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '::1' ||
      h.endsWith('.local') ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      /^169\.254\./.test(h)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function parseDevice(ua) {
  if (!ua) return 'unknown';
  if (/bot|crawl|spider|slurp|msnbot|bingbot|googlebot|duckduck|semrush|ahrefs|facebookexternalhit|twitterbot|whatsapp|telegrambot/i.test(ua))
    return 'bot';
  if (/iPad|tablet(?! pc)|kindle|playbook|silk/i.test(ua) && !/Mobile/i.test(ua))
    return 'tablet';
  if (/Mobi|Android|iPhone|iPod|Windows Phone|BlackBerry|IEMobile/i.test(ua))
    return 'mobile';
  return 'desktop';
}

function extractHostname(url) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
}

function getClientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (cf) return cf;
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || null;
}

async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET) return true; // disabled — pass through
  try {
    const params = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
    if (ip) params.append('remoteip', ip);
    const r = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(), signal: AbortSignal.timeout(5000) }
    );
    return (await r.json()).success === true;
  } catch { return true; } // fail open on network error
}

function cleanExpired() {
  const now = Math.floor(Date.now() / 1000);
  const result = db.prepare(
    'DELETE FROM links WHERE expires_at IS NOT NULL AND expires_at < ?'
  ).run(now);
  if (result.changes > 0) {
    console.log(`[cleanup] removed ${result.changes} expired link(s)`);
  }
}

// Run cleanup on startup and every hour
cleanExpired();
setInterval(cleanExpired, 60 * 60 * 1000);

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortLinkStatusHtml({ title, eyebrow, headline, message, code = '', tone = '404' }) {
  const safeTitle = escapeHtml(title);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeHeadline = escapeHtml(headline);
  const safeMessage = escapeHtml(message);
  const safeCode = code ? `<p class="code">/${escapeHtml(code)}</p>` : '';
  const actionHref = `${BASE_URL}/works/?category=link-shortener`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle} · crsv.es</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:radial-gradient(circle at top,#23110f 0,#120d0d 38%,#050505 100%);color:#f6f0ea;font-family:Helvetica Neue,Helvetica,Arial,sans-serif}
  .shell{position:relative;overflow:hidden;width:min(44rem,100%);border:1px solid rgba(255,255,255,.14);background:rgba(8,8,8,.88);box-shadow:0 30px 90px rgba(0,0,0,.45)}
  .shell:before,.shell:after{content:'';position:absolute;border-radius:999px;filter:blur(18px);opacity:.5}
  .shell:before{width:11rem;height:11rem;top:-3rem;right:-3rem;background:#ff7a5c}
  .shell:after{width:8rem;height:8rem;left:-2rem;bottom:-2rem;background:#ffd37a}
  .content{position:relative;padding:2rem;display:grid;gap:1rem}
  .eyebrow{font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;opacity:.6}
  h1{margin:0;font-size:clamp(2rem,6vw,3.4rem);line-height:.92;text-transform:uppercase;letter-spacing:.04em}
  .message{max-width:34rem;font-size:1rem;line-height:1.6;opacity:.82}
  .code{margin:0;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;opacity:.5}
  .meta{display:flex;flex-wrap:wrap;gap:.75rem}
  a{color:inherit}
  .button{display:inline-flex;align-items:center;justify-content:center;padding:.8rem 1.1rem;border:1px solid rgba(255,255,255,.22);text-decoration:none;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;background:rgba(255,255,255,.04)}
  .button:hover{background:#f6f0ea;color:#050505}
  .ghost{opacity:.78}
  .tone{font-size:4.5rem;line-height:1;font-weight:700;opacity:.08;position:absolute;right:1.5rem;top:1rem}
  @media (max-width: 768px){.content{padding:1.2rem}.tone{font-size:3rem;right:1rem}}
 </style>
</head>
<body>
  <main class="shell">
    <div class="content">
      <div class="tone">${escapeHtml(tone)}</div>
      <p class="eyebrow">${safeEyebrow}</p>
      <h1>${safeHeadline}</h1>
      ${safeCode}
      <p class="message">${safeMessage}</p>
      <div class="meta">
        <a class="button" href="${actionHref}">open shortener</a>
        <a class="button ghost" href="${BASE_URL}">back to crsv.es</a>
      </div>
    </div>
  </main>
</body>
</html>`;
}

function sendShortLinkStatus(res, statusCode, options) {
  res.status(statusCode);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(shortLinkStatusHtml(options));
}

// ── Shared redirect handler ───────────────────────────────────────────────────
async function handleRedirect(req, res, code, unlockPath) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(code)) {
    return sendShortLinkStatus(res, 404, {
      title: 'Missing link',
      eyebrow: 'r.crsv.es',
      headline: 'Link not found',
      message: 'That short link does not exist or has not been shortened yet.',
      code,
      tone: '404',
    });
  }
  const link = db.prepare('SELECT * FROM links WHERE code = ?').get(code);
  if (!link) {
    return sendShortLinkStatus(res, 404, {
      title: 'Missing link',
      eyebrow: 'r.crsv.es',
      headline: 'Link not found',
      message: 'That short link does not exist or has not been shortened yet.',
      code,
      tone: '404',
    });
  }

  const now = Math.floor(Date.now() / 1000);
  if (link.expires_at && link.expires_at < now) {
    return sendShortLinkStatus(res, 410, {
      title: 'Expired link',
      eyebrow: 'r.crsv.es',
      headline: 'This link expired',
      message: 'This short link existed before, but its expiry window has passed.',
      code,
      tone: '410',
    });
  }

  if (link.password_hash) {
    const { password } = req.query;
    const wantJson = req.headers.accept && req.headers.accept.includes('application/json');
    if (!password) {
      if (wantJson) return res.status(401).json({ requires_password: true, code });
      return res.redirect(302, `${unlockPath}/unlock`);
    }
    const match = await bcrypt.compare(String(password), link.password_hash);
    if (!match) {
      if (wantJson) return res.status(403).json({ error: 'Incorrect password.' });
      return res.redirect(302, `${unlockPath}/unlock?error=${encodeURIComponent('Incorrect password.')}`);
    }
  }

  try {
    const ua = req.headers['user-agent'] || null;
    db.prepare(
      'INSERT INTO clicks (link_id, ip, referrer, user_agent, device_type) VALUES (?, ?, ?, ?, ?)'
    ).run(
      link.id,
      getClientIp(req),
      req.headers.referer || req.headers.referrer || null,
      ua,
      parseDevice(ua)
    );
  } catch { /* non-fatal */ }

  return res.redirect(302, link.original_url);
}

// ── Password-prompt HTML ──────────────────────────────────────────────────────
function passwordPromptHtml(code, actionPath, errorMsg = '') {
  const err = errorMsg
    ? `<p style="color:#e55;margin:0 0 1rem;font-size:.875em">${errorMsg}</p>`
    : '';
  const action = escapeHtml(actionPath);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Password required · crsv.es</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;
       display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem}
  .card{border:1px solid #333;padding:2rem;max-width:400px;width:100%;background:#111}
  h1{font-size:1rem;letter-spacing:.15em;text-transform:uppercase;margin-bottom:1.5rem;opacity:.65}
  label{display:block;font-size:.72em;letter-spacing:.09em;text-transform:uppercase;
        opacity:.5;margin-bottom:.4rem}
  input[type=password]{width:100%;background:transparent;border:1px solid #333;
        color:inherit;padding:.6rem .75rem;font-size:.95em;outline:none}
  input[type=password]:focus{border-color:#666}
  button{width:100%;margin-top:1rem;padding:.65rem 1rem;background:transparent;
         border:1px solid #e5e5e5;color:inherit;font-size:.85em;letter-spacing:.1em;
         text-transform:uppercase;cursor:pointer}
  button:hover{background:#e5e5e5;color:#0a0a0a}
</style>
</head>
<body>
<div class="card">
  <h1>Password required</h1>
  ${err}
  <form method="GET" action="${action}">
    <label for="p">Password</label>
    <input type="password" id="p" name="password" autofocus required>
    <button type="submit">Continue</button>
  </form>
</div>
</body>
</html>`;
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

// Tag requests coming from the short redirect domain
const shortDomainHost = (() => { try { return new URL(SHORT_DOMAIN).hostname; } catch { return 'r.crsv.es'; } })();
app.use((req, _res, next) => {
  req.isShortDomain = (req.headers.host || '').split(':')[0] === shortDomainHost;
  next();
});

app.use(cors({
  origin: [BASE_URL, SHORT_DOMAIN, /^https?:\/\/localhost/],
  methods: ['GET', 'POST', 'DELETE'],
}));

app.use(express.json({ limit: '16kb' }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  keyGenerator: getClientIp,
});

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
  keyGenerator: getClientIp,
});

// ── API Routes ────────────────────────────────────────────────────────────────

// GET /api/config — public frontend configuration
app.get('/api/config', (_req, res) => {
  res.json({ turnstile_site_key: TURNSTILE_SITE_KEY || null });
});

// POST /api/links — create a new short link
app.post('/api/links', createLimiter, async (req, res) => {
  const { url, password, custom_code, expires_in_days, cf_turnstile_token } = req.body || {};

  // CAPTCHA verification (when Turnstile is configured)
  if (TURNSTILE_SECRET) {
    if (!cf_turnstile_token) {
      return res.status(400).json({ error: 'CAPTCHA token required.' });
    }
    const valid = await verifyTurnstile(cf_turnstile_token, getClientIp(req));
    if (!valid) {
      return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }
  }

  if (!validateUrl(url)) {
    return res.status(400).json({ error: 'Invalid or disallowed URL.' });
  }

  // Determine code
  let code;
  if (custom_code) {
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(custom_code)) {
      return res.status(400).json({
        error: 'Custom code must be 3–32 alphanumeric/-/_ characters.',
      });
    }
    if (RESERVED_CODES.has(custom_code.toLowerCase())) {
      return res.status(400).json({ error: 'That custom code is reserved.' });
    }
    const existing = db.prepare('SELECT id FROM links WHERE code = ?').get(custom_code);
    if (existing) {
      return res.status(409).json({ error: 'Custom code already taken.' });
    }
    code = custom_code;
  } else {
    let attempts = 0;
    do {
      code = nanoid();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ error: 'Could not generate unique code. Try again.' });
      }
    } while (db.prepare('SELECT id FROM links WHERE code = ?').get(code));
  }

  let passwordHash = null;
  if (password && typeof password === 'string' && password.trim().length > 0) {
    passwordHash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
  }

  let expiresAt = null;
  if (expires_in_days && Number.isInteger(expires_in_days) && expires_in_days >= 1 && expires_in_days <= 365) {
    expiresAt = Math.floor(Date.now() / 1000) + expires_in_days * 86400;
  }

  const deletionToken = uuidv4();

  try {
    db.prepare(
      'INSERT INTO links (code, original_url, password_hash, deletion_token, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(code, url.trim(), passwordHash, deletionToken, expiresAt);
  } catch (err) {
    console.error('DB insert error:', err);
    return res.status(500).json({ error: 'Database error.' });
  }

  return res.status(201).json({
    code,
    short_url: `${SHORT_DOMAIN}/${code}`,
    deletion_token: deletionToken,
    has_password: !!passwordHash,
    expires_at: expiresAt,
  });
});

// GET /s/:code — legacy redirect (backwards compat)
app.get('/s/:code', redirectLimiter, (req, res) => {
  return handleRedirect(req, res, req.params.code, `/s/${encodeURIComponent(req.params.code)}`);
});

// GET /s/:code/unlock — legacy password prompt
app.get('/s/:code/unlock', (req, res) => {
  const { code } = req.params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(code)) {
    return sendShortLinkStatus(res, 404, {
      title: 'Missing link',
      eyebrow: 'r.crsv.es',
      headline: 'Link not found',
      message: 'That short link does not exist or has not been shortened yet.',
      code,
      tone: '404',
    });
  }
  const link = db.prepare('SELECT id FROM links WHERE code = ?').get(code);
  if (!link) {
    return sendShortLinkStatus(res, 404, {
      title: 'Missing link',
      eyebrow: 'r.crsv.es',
      headline: 'Link not found',
      message: 'That short link does not exist or has not been shortened yet.',
      code,
      tone: '404',
    });
  }
  const { error } = req.query;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(passwordPromptHtml(code, `/s/${encodeURIComponent(code)}`, error ? decodeURIComponent(error) : ''));
});

// GET /api/links/:code/stats
app.get('/api/links/:code/stats', (req, res) => {
  const { code } = req.params;
  const { token } = req.query;

  if (!token) return res.status(401).json({ error: 'deletion_token required.' });
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(code)) return res.status(404).json({ error: 'Not found.' });

  const link = db.prepare('SELECT * FROM links WHERE code = ?').get(code);
  if (!link) return res.status(404).json({ error: 'Not found.' });
  if (link.deletion_token !== token) return res.status(403).json({ error: 'Invalid token.' });

  const now = Math.floor(Date.now() / 1000);

  const totalClicks = db
    .prepare('SELECT COUNT(*) as cnt FROM clicks WHERE link_id = ?')
    .get(link.id).cnt;

  // Daily clicks (last 30 days)
  const daily = db.prepare(`
    SELECT strftime('%Y-%m-%d', datetime(clicked_at, 'unixepoch')) as day,
           COUNT(*) as count
    FROM clicks
    WHERE link_id = ? AND clicked_at >= unixepoch() - 30*86400
    GROUP BY day ORDER BY day ASC
  `).all(link.id);

  // Device breakdown
  const deviceRows = db.prepare(
    'SELECT COALESCE(device_type, \'unknown\') as device_type, COUNT(*) as count FROM clicks WHERE link_id = ? GROUP BY device_type'
  ).all(link.id);
  const deviceBreakdown = {};
  for (const r of deviceRows) deviceBreakdown[r.device_type] = r.count;

  // Top referrers (by hostname, top 8)
  const refRows = db.prepare(
    'SELECT referrer FROM clicks WHERE link_id = ? AND referrer IS NOT NULL'
  ).all(link.id);
  const refMap = {};
  for (const r of refRows) {
    const host = extractHostname(r.referrer);
    if (host) refMap[host] = (refMap[host] || 0) + 1;
  }
  const topReferrers = Object.entries(refMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([domain, count]) => ({ domain, count }));

  return res.json({
    code,
    short_url: `${SHORT_DOMAIN}/${code}`,
    original_url: link.original_url,
    has_password: !!link.password_hash,
    created_at: link.created_at,
    expires_at: link.expires_at,
    expired: !!(link.expires_at && link.expires_at < now),
    total_clicks: totalClicks,
    daily_clicks: daily,
    device_breakdown: deviceBreakdown,
    top_referrers: topReferrers,
  });
});

// DELETE /api/links/:code
app.delete('/api/links/:code', (req, res) => {
  const { code } = req.params;
  const { token } = req.query;

  if (!token) return res.status(401).json({ error: 'deletion_token required.' });
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(code)) return res.status(404).json({ error: 'Not found.' });

  const link = db.prepare('SELECT * FROM links WHERE code = ?').get(code);
  if (!link) return res.status(404).json({ error: 'Not found.' });
  if (link.deletion_token !== token) return res.status(403).json({ error: 'Invalid token.' });

  db.prepare('DELETE FROM links WHERE id = ?').run(link.id);
  return res.json({ success: true, message: `Link /${code} deleted.` });
});

// ── Short-domain root routes (r.crsv.es/:code) ────────────────────────────────

// GET /:code/unlock — short-domain password prompt
app.get('/:code/unlock', (req, res, next) => {
  if (!req.isShortDomain) return next();
  const { code } = req.params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(code)) {
    return sendShortLinkStatus(res, 404, {
      title: 'Missing link',
      eyebrow: 'r.crsv.es',
      headline: 'Link not found',
      message: 'That short link does not exist or has not been shortened yet.',
      code,
      tone: '404',
    });
  }
  const link = db.prepare('SELECT id FROM links WHERE code = ?').get(code);
  if (!link) {
    return sendShortLinkStatus(res, 404, {
      title: 'Missing link',
      eyebrow: 'r.crsv.es',
      headline: 'Link not found',
      message: 'That short link does not exist or has not been shortened yet.',
      code,
      tone: '404',
    });
  }
  const { error } = req.query;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(passwordPromptHtml(code, `/${encodeURIComponent(code)}`, error ? decodeURIComponent(error) : ''));
});

// GET /:code — short-domain redirect
app.get('/:code', redirectLimiter, (req, res, next) => {
  if (!req.isShortDomain) return next();
  return handleRedirect(req, res, req.params.code, `/${encodeURIComponent(req.params.code)}`);
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[shortener] listening on 127.0.0.1:${PORT}`);
  console.log(`  short domain : ${SHORT_DOMAIN}`);
  console.log(`  CAPTCHA      : ${TURNSTILE_SECRET ? 'enabled' : 'disabled'}`);
});
