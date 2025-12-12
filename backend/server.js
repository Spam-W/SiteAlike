// server.js
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { taggerAssign } = require("./tagger");
const puppeteer = require("puppeteer");

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_in_prod";
const PORT = process.env.PORT || 4000;
const DB_FILE = process.env.DB_FILE || "data.db";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
const ENABLE_SCREENSHOTS = process.env.ENABLE_SCREENSHOTS !== "false"; // default true

if (!fs.existsSync(SCREENSHOT_DIR))
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const app = express();
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/screenshots", express.static(SCREENSHOT_DIR));

// --- DB setup ---
const db = new sqlite3.Database(DB_FILE);

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}
function allSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
function getSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initDb() {
  await runSql(`PRAGMA foreign_keys = ON;`);
  await runSql(`CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    url TEXT UNIQUE,
    description TEXT,
    screenshot_path TEXT,
    raw_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_crawled DATETIME
  );`);

  await runSql(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    category TEXT,
    description TEXT
  );`);

  await runSql(`CREATE TABLE IF NOT EXISTS site_tags (
    site_id INTEGER,
    tag_id INTEGER,
    score REAL DEFAULT 1,
    PRIMARY KEY (site_id, tag_id),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );`);

  await runSql(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runSql(`CREATE TABLE IF NOT EXISTS saved_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    label TEXT,
    query TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  // seed tags from tagger catalog
  const catalog = require("./tagger").TAG_CATALOG;
  for (const t of catalog) {
    try {
      await runSql(
        `INSERT OR IGNORE INTO tags (name, category, description) VALUES (?, ?, ?)`,
        [t.name, t.category || null, t.description || null]
      );
    } catch (err) {
      console.warn("Tag seed error", err);
    }
  }
}
initDb().catch((err) => {
  console.error(err);
  process.exit(1);
});

// --- Auth helpers ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- Utilities ---
function parseTokensFromQuery(q) {
  if (!q) return [];
  return q
    .split(/\s+/g)
    .map((s) => {
      s = s.trim();
      if (!s) return null;
      let op = "+";
      let name = s;
      if ("-~+".includes(s[0])) {
        op = s[0];
        name = s.slice(1);
      }
      return { op, name: name.toLowerCase() };
    })
    .filter(Boolean);
}

// --- Routes ---

// GET tags
app.get("/api/tags", async (req, res) => {
  const tags = await allSql(
    `SELECT id, name, category, description FROM tags ORDER BY name`
  );
  res.json({ tags });
});

// POST /api/analyze { url, captureScreenshot (optional) }
// - fetch page HTML, extract text, run tagger (keyword-based), optional screenshot
app.post("/api/analyze", async (req, res) => {
  const { url, captureScreenshot } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    // fetch HTML
    const rsp = await fetch(url, { redirect: "follow", timeout: 15000 });
    if (!rsp.ok) {
      return res.status(400).json({ error: `Fetch failed: ${rsp.statusText}` });
    }
    const html = await rsp.text();

    // extract text with cheerio + readability-like extraction (simple)
    const $ = cheerio.load(html);
    // remove scripts/styles
    $("script,noscript,style,iframe").remove();
    // get title, meta description
    const title = ($("title").first().text() || "").trim();
    const description = (
      $("meta[name='description']").attr("content") || ""
    ).trim();
    // main text: fall back to body innerText approximation
    let rawText = "";
    const bodyText = $("body").text();
    rawText = bodyText.replace(/\s+/g, " ").trim().slice(0, 20000); // limit stored raw text

    // run tagger
    const assigned = taggerAssign(rawText + " " + title + " " + description);

    // optional screenshot capture
    let screenshotPath = null;
    const doScreenshot =
      typeof captureScreenshot !== "undefined"
        ? captureScreenshot
        : ENABLE_SCREENSHOTS;
    if (doScreenshot) {
      try {
        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        const filename = `site_${Date.now()}.png`;
        screenshotPath = path.join(SCREENSHOT_DIR, filename);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        await browser.close();
      } catch (err) {
        console.warn("Screenshot failed", err.message);
        screenshotPath = null;
      }
    }

    // upsert site
    const existing = await getSql(`SELECT id FROM sites WHERE url = ?`, [url]);
    let siteId;
    if (existing) {
      await runSql(
        `UPDATE sites SET name = ?, description = ?, screenshot_path = ?, raw_text = ?, last_crawled = CURRENT_TIMESTAMP WHERE id = ?`,
        [
          title || null,
          description || null,
          screenshotPath,
          rawText || null,
          existing.id,
        ]
      );
      siteId = existing.id;
    } else {
      const run = await runSql(
        `INSERT INTO sites (name, url, description, screenshot_path, raw_text, last_crawled) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          title || null,
          url,
          description || null,
          screenshotPath,
          rawText || null,
        ]
      );
      siteId = run.lastID;
    }

    // attach tags (insert into site_tags)
    // assigned = [{ name, score }]
    for (const a of assigned) {
      // ensure tag exists
      const tagRow = await getSql(`SELECT id FROM tags WHERE name = ?`, [
        a.name,
      ]);
      let tagId;
      if (!tagRow) {
        const r = await runSql(
          `INSERT INTO tags (name, category, description) VALUES (?, ?, ?)`,
          [a.name, a.category || null, a.description || null]
        );
        tagId = r.lastID;
      } else tagId = tagRow.id;

      await runSql(
        `INSERT OR REPLACE INTO site_tags (site_id, tag_id, score) VALUES (?, ?, ?)`,
        [siteId, tagId, a.score || 1]
      );
    }

    const site = await getSql(
      `SELECT id, name, url, description, screenshot_path, last_crawled FROM sites WHERE id = ?`,
      [siteId]
    );

    res.json({
      site,
      assigned,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// GET /api/sites?tags=ai -nsfw ~blog&page=1&limit=20
app.get("/api/sites", async (req, res) => {
  try {
    const q = req.query.tags || "";
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, parseInt(req.query.limit || "50", 10));
    const offset = (page - 1) * limit;

    const tokens = parseTokensFromQuery(q);
    const include = tokens.filter((t) => t.op === "+").map((t) => t.name);
    const exclude = tokens.filter((t) => t.op === "-").map((t) => t.name);
    const optional = tokens.filter((t) => t.op === "~").map((t) => t.name);

    // Build base SQL; we'll add constraints dynamically
    let baseSQL = `SELECT s.id, s.name, s.url, s.description, s.screenshot_path, s.last_crawled
      FROM sites s`;
    const whereClauses = [];
    const params = [];

    // Exclude: sites that have any exclude tag
    if (exclude.length > 0) {
      baseSQL += ` WHERE s.id NOT IN (
        SELECT st.site_id FROM site_tags st
        JOIN tags t ON t.id = st.tag_id
        WHERE t.name IN (${exclude.map(() => "?").join(",")})
      )`;
      exclude.forEach((t) => params.push(t));
    }

    // For include tokens: we need sites that have all included tags.
    let havingClause = "";
    if (include.length > 0) {
      // Join site_tags -> tags and group by site_id with count = include.length
      baseSQL = `SELECT s.id, s.name, s.url, s.description, s.screenshot_path, s.last_crawled
        FROM sites s
        JOIN site_tags st_include ON st_include.site_id = s.id
        JOIN tags t_include ON t_include.id = st_include.tag_id`;
      // add where for included tags
      baseSQL += ` WHERE t_include.name IN (${include
        .map(() => "?")
        .join(",")})`;
      include.forEach((t) => params.push(t));
      havingClause = ` GROUP BY s.id HAVING COUNT(DISTINCT t_include.name) = ${include.length}`;
    } else {
      // if include not used, ensure we keep the previously applied exclude clause (if any)
      if (exclude.length === 0) {
        // no include, no exclude -> nothing to change
      } else {
        // exclude handled already via baseSQL above
      }
    }

    // Optional: require that site has at least one of optional tags
    if (optional.length > 0) {
      // Ensure we put optional condition either in WHERE or as an AND EXISTS
      const optionalSQL = ` s.id IN (
        SELECT st_o.site_id FROM site_tags st_o JOIN tags t_o ON t_o.id = st_o.tag_id
        WHERE t_o.name IN (${optional.map(() => "?").join(",")})
      )`;
      optional.forEach((t) => params.push(t));
      if (havingClause) {
        // we already have GROUP BY from include; append HAVING ... AND optional condition
        havingClause += ` AND (${optionalSQL})`;
      } else {
        // append to where
        if (baseSQL.toLowerCase().includes(" where "))
          baseSQL += ` AND (${optionalSQL})`;
        else baseSQL += ` WHERE ${optionalSQL}`;
      }
    }

    let finalSQL = baseSQL + (havingClause || "");
    finalSQL += ` ORDER BY s.last_crawled DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await allSql(finalSQL, params);

    // For each site, attach tags
    const siteIds = rows.map((r) => r.id);
    let tagsMap = {};
    if (siteIds.length > 0) {
      const qMarks = siteIds.map(() => "?").join(",");
      const tagRows = await allSql(
        `
        SELECT st.site_id, t.name FROM site_tags st
        JOIN tags t ON t.id = st.tag_id
        WHERE st.site_id IN (${qMarks})
      `,
        siteIds
      );
      tagsMap = tagRows.reduce((acc, r) => {
        acc[r.site_id] = acc[r.site_id] || [];
        acc[r.site_id].push(r.name);
        return acc;
      }, {});
    }

    const results = rows.map((r) => ({
      ...r,
      tags: tagsMap[r.id] || [],
      screenshot_url: r.screenshot_path
        ? `/screenshots/${path.basename(r.screenshot_path)}`
        : null,
    }));

    res.json({ page, limit, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Auth routes (register/login) ---
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });
  try {
    const exists = await getSql(`SELECT id FROM users WHERE email = ?`, [
      email.toLowerCase(),
    ]);
    if (exists)
      return res.status(400).json({ error: "email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const r = await runSql(
      `INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)`,
      [email.toLowerCase(), hash, name || null]
    );
    const userId = r.lastID;
    const token = jwt.sign({ sub: userId, email }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });
  try {
    const user = await getSql(
      `SELECT id, password_hash FROM users WHERE email = ?`,
      [email.toLowerCase()]
    );
    if (!user) return res.status(400).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "invalid credentials" });
    const token = jwt.sign({ sub: user.id, email }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Saved searches ---
app.post("/api/saved-search", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  const { label, query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });
  try {
    await runSql(
      `INSERT INTO saved_searches (user_id, label, query) VALUES (?, ?, ?)`,
      [userId, label || null, query]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/saved-search", authMiddleware, async (req, res) => {
  const userId = req.user.sub;
  try {
    const rows = await allSql(
      `SELECT id, label, query, created_at FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ searches: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(
    `Screenshots stored at ${SCREENSHOT_DIR} (enabled=${ENABLE_SCREENSHOTS})`
  );
});
