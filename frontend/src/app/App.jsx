//import Router from "./routing/Router";
import { useState, useMemo } from "react";
import SiteCardList from "@/components/SiteCardList";
/*import IndexPage from "@/pages/IndexPage";




//gpt

//import React, { useState, useMemo, useEffect } from "react";

/*
  This demo implements Danbooru-style tag search for your website-search project:
  - include tags: city landscape
  - exclude tags: -nsfw
  - optional tags: ~ai ~blog  (at least one must match)
*/

/* Example tag catalog (replace with backend data) */
const TAGS = [
  "social",
  "news",
  "entertainment",
  "education",
  "research",
  "ai",
  "blog",
  "portfolio",
  "search",
  "video",
  "community",
  "forum",
  "tools",
  "developer",
  "programming",
  "tech",
  "shopping",
  "finance",
  "nsfw",
];

/* Example dataset of analyzed websites (replace with backend API) */
const SITES = [
  {
    id: 1,
    name: "Reddit",
    url: "https://reddit.com",
    tags: ["community", "forum", "social", "news"],
    screenshot: "https://picsum.photos/id/1015/300/200",
  },
  {
    id: 2,
    name: "YouTube",
    url: "https://youtube.com",
    tags: ["video", "entertainment", "community"],
    screenshot: "https://picsum.photos/id/1018/300/200",
  },
  {
    id: 3,
    name: "Medium",
    url: "https://medium.com",
    tags: ["blog", "education", "research"],
    screenshot: "https://picsum.photos/id/1005/300/200",
  },
  {
    id: 4,
    name: "GitHub",
    url: "https://github.com",
    tags: ["developer", "tools", "programming", "tech", "community"],
    screenshot: "https://picsum.photos/id/1011/300/200",
  },
  {
    id: 5,
    name: "StackOverflow",
    url: "https://stackoverflow.com",
    tags: ["programming", "developer", "community", "education"],
    screenshot: "https://picsum.photos/id/1003/300/200",
  },
  {
    id: 6,
    name: "AI Blog",
    url: "https://ai-blog.example",
    tags: ["ai", "blog", "research", "education"],
    screenshot: "https://picsum.photos/id/1040/300/200",
  },
];

/* Helpers */
function normalize(s) {
  return (s || "").trim().toLowerCase();
}

/* Parse one token: +tag, tag, -tag, ~tag */
function parseToken(t) {
  const raw = t.trim();
  if (!raw) return null;

  let op = "+";
  let name = raw;

  if (raw[0] === "+" || raw[0] === "-" || raw[0] === "~") {
    op = raw[0];
    name = raw.slice(1);
  }

  name = normalize(name);
  if (!name) return null;

  return { op, name };
}

function parseQuery(query) {
  return query.split(/\s+/g).map(parseToken).filter(Boolean);
}

/* Matching logic: Danbooru-style */
function matchesSite(site, tokens) {
  if (tokens.length === 0) return true;

  const tags = site.tags.map(normalize);

  const include = tokens.filter((t) => t.op === "+").map((t) => t.name);
  const exclude = tokens.filter((t) => t.op === "-").map((t) => t.name);
  const optional = tokens.filter((t) => t.op === "~").map((t) => t.name);

  for (const tag of include) {
    if (!tags.includes(tag)) return false;
  }
  for (const tag of exclude) {
    if (tags.includes(tag)) return false;
  }

  if (optional.length > 0) {
    const ok = optional.some((t) => tags.includes(t));
    if (!ok) return false;
  }

  return true;
}

export default function App() {
  /* Controlled search input */
  const [input, setInput] = useState("");

  /* Committed query (tokens) */
  const [query, setQuery] = useState("");

  /* Autocomplete suggestions */
  const suggestions = useMemo(() => {
    const q = normalize(input);

    let core = q;
    if (core.startsWith("+") || core.startsWith("-") || core.startsWith("~")) {
      core = core.slice(1);
    }
    if (!core) return [];

    return TAGS.filter((t) => t.startsWith(core)).slice(0, 8);
  }, [input]);

  /* Parse query -> tokens */
  const tokens = useMemo(() => parseQuery(query), [query]);

  /* Filter sites */
  const results = useMemo(() => {
    return SITES.filter((s) => matchesSite(s, tokens));
  }, [tokens]);

  /* Add user-entered token */
  function onAddToken() {
    if (!input.trim()) return;

    const newQuery = query ? query + " " + input.trim() : input.trim();
    setQuery(newQuery);
    setInput("");
  }

  /* Add token by suggestion click */
  function onSuggestionClick(tag) {
    let prefix = "";

    if (input.startsWith("-")) prefix = "-";
    else if (input.startsWith("~")) prefix = "~";
    else if (input.startsWith("+")) prefix = "+";

    const token = prefix + tag;
    const newQuery = query ? query + " " + token : token;

    setQuery(newQuery);
    setInput("");
  }

  /* Clicking a tag on a site result → add as include */
  function addIncludeTag(tag) {
    const token = tag;
    const newQuery = query ? query + " " + token : token;
    setQuery(newQuery);
  }

  return (
    <div className="app" /* style={styles.app} */>
      <h1>Website Tag Search (Danbooru-style)</h1>
      <p>
        Enter tags like: <code>ai -nsfw ~blog</code>
      </p>

      {/* Search Input */}
      <div style={styles.searchBox}>
        <input
          className="input"
          /* style={styles.input} */
          placeholder="Enter tags. Examples: ai -nsfw ~blog"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddToken();
            }
          }}
        />

        <button className="btn" /* style={styles.btn} */ onClick={onAddToken}>
          Add
        </button>

        {/* Autocomplete */}
        {input && suggestions.length > 0 && (
          <div className="suggestBox" /* style={styles.suggestBox} */>
            {suggestions.map((tag) => (
              <div
                className="suggestItem"
                key={tag}
                /* style={styles.suggestItem} */
                onMouseDown={() => onSuggestionClick(tag)}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <strong>Query:</strong> {query || "(none)"}
      </div>

      <hr />

      {/* Results */}
      <h2>Results ({results.length})</h2>
      <SiteCardList sites={results} query={query} setQuery={setQuery} />
      {/* <div style={styles.grid}>
        {results.map((site) => (
          <div key={site.id} style={styles.card}>
            <img src={site.screenshot} alt="" style={styles.img} />
            <h3>{site.name}</h3>
            <a href={site.url} target="_blank" rel="noreferrer">
              {site.url}
            </a>

            <div style={styles.tagRow}>
              {site.tags.map((t) => (
                <button
                  key={t}
                  onClick={() => addIncludeTag(t)}
                  style={styles.tag}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}

/* Basic styles */
const styles = {
  app: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  searchBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  btn: {
    padding: "8px 12px",
    background: "#0077ff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  suggestBox: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: 6,
    marginTop: 4,
    zIndex: 20,
  },
  suggestItem: {
    padding: "8px 10px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 20,
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 12,
    background: "white",
  },
  img: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 6,
  },
  tagRow: {
    marginTop: 10,
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    background: "#eee",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: "4px 8px",
    cursor: "pointer",
  },
};

/*
const TAGS = [
  { id: 1, name: "landscape", category: "general" },
  { id: 2, name: "mountain", category: "general" },
  { id: 3, name: "city", category: "general" },
  { id: 4, name: "night", category: "general" },
  { id: 5, name: "sunset", category: "general" },
  { id: 6, name: "animal", category: "general" },
  { id: 7, name: "cat", category: "general" },
  { id: 8, name: "dog", category: "general" },
  { id: 9, name: "nsfw", category: "rating" },
  { id: 10, name: "safe", category: "rating" },
  { id: 11, name: "portrait", category: "general" },
  { id: 12, name: "architecture", category: "general" },
  { id: 13, name: "food", category: "general" },
];

const POSTS = [
  {
    id: 101,
    title: "Night mountain view",
    tags: ["mountain", "night", "landscape", "safe"],
    img: "https://picsum.photos/id/1015/600/400",
  },
  {
    id: 102,
    title: "Cat in a city street",
    tags: ["cat", "city", "portrait", "safe"],
    img: "https://picsum.photos/id/1025/600/400",
  },
  {
    id: 103,
    title: "Dog at sunset",
    tags: ["dog", "sunset", "landscape", "safe"],
    img: "https://picsum.photos/id/237/600/400",
  },
  {
    id: 104,
    title: "Animal in wild at night",
    tags: ["animal", "night", "nsfw"],
    img: "https://picsum.photos/id/1069/600/400",
  },
  {
    id: 105,
    title: "Modern city architecture",
    tags: ["architecture", "city", "landscape", "safe"],
    img: "https://picsum.photos/id/1003/600/400",
  },
  {
    id: 106,
    title: "Delicious street food",
    tags: ["food", "city", "portrait", "safe"],
    img: "https://picsum.photos/id/1080/600/400",
  },
];

function normalize(s) {
  return (s || "").toLowerCase().trim();
}

// Parse a token into {op, name} where op is '+', '-', or '~'
function parseToken(token) {
  const t = token.trim();
  if (!t) return null;
  let op = "+";
  let name = t;
  if (t[0] === "-") {
    op = "-";
    name = t.slice(1);
  } else if (t[0] === "~") {
    op = "~";
    name = t.slice(1);
  } else if (t[0] === "+") {
    op = "+";
    name = t.slice(1);
  }
  name = normalize(name);
  if (!name) return null;
  return { op, name };
}

function tokenizeQuery(q) {
  if (!q) return [];
  const raw = q.split(/\s+/g);
  const parsed = raw.map(parseToken).filter(Boolean);
  return parsed;
}

function matchesPost(post, tokens) {
  if (!tokens || tokens.length === 0) return true;
  const postTags = post.tags.map(normalize);

  for (const t of tokens) {
    if (t.op === "+") {
      if (!postTags.includes(t.name)) return false;
    }
    if (t.op === "-") {
      if (postTags.includes(t.name)) return false;
    }
  }

  const optional = tokens.filter((t) => t.op === "~");
  if (optional.length > 0) {
    const any = optional.some((t) => postTags.includes(t.name));
    if (!any) return false;
  }

  return true;
}

function TagChip({ tag, onRemove, onClick }) {
  return (
    <div style={styles.chip}>
      <button onClick={() => onClick && onClick(tag)} style={styles.chipName}>
        {tag}
      </button>
      <button
        onClick={() => onRemove && onRemove(tag)}
        style={styles.chipRemove}
      >
        ×
      </button>
    </div>
  );
}

function ResultCard({ post, onTagClick }) {
  return (
    <div style={styles.card}>
      <img src={post.img} alt={post.title} style={styles.cardImage} />
      <div style={styles.cardBody}>
        <h3 style={{ margin: 0 }}>{post.title}</h3>
        <div
          style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}
        >
          {post.tags.map((t) => (
            <button
              key={t}
              onClick={() => onTagClick(t)}
              style={styles.tagButton}
              title={`Add tag: ${t}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [activeTokens, setActiveTokens] = useState([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    const q = normalize(input);
    if (!q) return [];
    let search = q;
    if (search[0] === "-" || search[0] === "+" || search[0] === "~") {
      search = search.slice(1);
    }
    search = search.trim();
    if (!search) return [];
    return TAGS.filter((t) => t.name.startsWith(search)).slice(0, 8);
  }, [input]);

  useEffect(() => {
    const q = activeTokens
      .map((t) => (t.op === "+" ? t.name : t.op + t.name))
      .join(" ");
    setQuery(q);
  }, [activeTokens]);

  const tokenized = useMemo(() => tokenizeQuery(query), [query]);

  const results = useMemo(
    () => POSTS.filter((p) => matchesPost(p, tokenized)),
    [tokenized]
  );

  function addTokenFromInput(rawInput) {
    const parsed = parseToken(rawInput);
    if (!parsed) return;
    const exists = activeTokens.some(
      (t) => t.op === parsed.op && t.name === parsed.name
    );
    if (!exists) setActiveTokens((prev) => [...prev, parsed]);
    setInput("");
    setShowSuggestions(false);
  }

  function removeToken(token) {
    setActiveTokens((prev) =>
      prev.filter((t) => !(t.op === token.op && t.name === token.name))
    );
  }

  function onSuggestionClick(tag) {
    const raw = input.trim();
    let op = "+";
    if (raw[0] === "-" || raw[0] === "+" || raw[0] === "~") op = raw[0];
    const token = { op, name: tag.name };
    const exists = activeTokens.some(
      (t) => t.op === token.op && t.name === token.name
    );
    if (!exists) setActiveTokens((prev) => [...prev, token]);
    setInput("");
    setShowSuggestions(false);
  }

  function onResultTagClick(tagName) {
    const token = { op: "+", name: normalize(tagName) };
    const exists = activeTokens.some(
      (t) => t.op === token.op && t.name === token.name
    );
    if (!exists) setActiveTokens((prev) => [...prev, token]);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        addTokenFromInput(input);
      }
    }
    if (e.key === "Backspace" && !input) {
      setActiveTokens((prev) => prev.slice(0, -1));
    }
  }

  function clearAll() {
    setActiveTokens([]);
    setInput("");
    setShowSuggestions(false);
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>Tag Search Demo (Danbooru-like)</h1>
        <p style={{ marginTop: 8, color: "#666" }}>
          Use plain tags (e.g. <code>city</code>), exclude with{" "}
          <code>-nsfw</code>, or mark optional with <code>~portrait</code>.
          Click tags on results to add them.
        </p>
      </header>

      <section style={styles.searchPanel}>
        <div style={styles.tokenRow}>
          {activeTokens.map((t, i) => (
            <div
              key={`${t.op}${t.name}${i}`}
              style={{ display: "inline-flex", marginRight: 6 }}
            >
              <TagChip
                tag={`${t.op === "+" ? "" : t.op}${t.name}`}
                onRemove={() => removeToken(t)}
                onClick={() => {
                  // clicking on the chip will add as include if it's not include
                  if (t.op !== "+") {
                    setActiveTokens((prev) => [
                      ...prev,
                      { op: "+", name: t.name },
                    ]);
                  }
                }}
              />
            </div>
          ))}

          <div style={{ position: "relative", flex: 1 }}>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a tag (prefix - to exclude, ~ for optional). Press Enter to add."
              style={styles.input}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div style={styles.suggestBox}>
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    style={styles.suggestRow}
                    onMouseDown={() => onSuggestionClick(s)}
                  >
                    <strong>{s.name}</strong>
                    <span style={{ marginLeft: 8, color: "#888" }}>
                      {s.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft: 10 }}>
            <button
              onClick={() => {
                if (input) addTokenFromInput(input);
              }}
              style={styles.addButton}
            >
              Add
            </button>
            <button onClick={clearAll} style={styles.clearButton}>
              Clear
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <strong>Query:</strong> <code>{query || "(none)"}</code>
        </div>
      </section>

      <main style={styles.main}>
        <aside style={styles.sidebar}>
          <h4 style={{ marginTop: 0 }}>Popular tags</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TAGS.slice(0, 20).map((t) => (
              <button
                key={t.id}
                onClick={() => onResultTagClick(t.name)}
                style={styles.smallTag}
              >
                {t.name}
              </button>
            ))}
          </div>
        </aside>

        <section style={styles.resultsSection}>
          <h2 style={{ marginTop: 0 }}>Results ({results.length})</h2>

          <div style={styles.grid}>
            {results.map((r) => (
              <ResultCard key={r.id} post={r} onTagClick={onResultTagClick} />
            ))}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <small>
          Demo — replace POSTS and TAGS with your API endpoints in a production
          app.
        </small>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",
    maxWidth: 1100,
    margin: "20px auto",
    padding: 16,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 14,
  },
  searchPanel: {
    background: "#fff",
    border: "1px solid #e6e6e6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tokenRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    outline: "none",
    boxSizing: "border-box",
  },
  addButton: {
    marginRight: 6,
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #007bff",
    background: "#007bff",
    color: "white",
    cursor: "pointer",
  },
  clearButton: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    marginLeft: 6,
  },
  suggestBox: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 40,
    background: "white",
    border: "1px solid #eee",
    borderRadius: 6,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    zIndex: 40,
    padding: 6,
  },
  suggestRow: {
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 8px",
    borderRadius: 20,
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    gap: 8,
  },
  chipName: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontWeight: 600,
  },
  chipRemove: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
  },
  main: {
    display: "flex",
    gap: 20,
  },
  sidebar: {
    width: 220,
    borderRight: "1px solid #f0f0f0",
    paddingRight: 12,
  },
  resultsSection: {
    flex: 1,
    paddingLeft: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  card: {
    border: "1px solid #eee",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  cardImage: {
    width: "100%",
    height: 140,
    objectFit: "cover",
  },
  cardBody: {
    padding: 10,
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  tagButton: {
    border: "1px solid #eee",
    background: "#fafafa",
    padding: "4px 8px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  smallTag: {
    border: "1px solid #eee",
    background: "#fff",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  footer: {
    marginTop: 18,
    paddingTop: 12,
    borderTop: "1px solid #f0f0f0",
    color: "#666",
  },
};
*/

/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
*/
