// tagger.js
// Exports a tag catalog and a simple assign function that returns tags with scores.
// The tag catalog is the source of truth for available tags.

const TAG_CATALOG = [
  {
    name: "community",
    category: "social",
    keywords: ["community", "forum", "reddit", "discussion"],
  },
  {
    name: "video",
    category: "media",
    keywords: ["video", "youtube", "stream", "watch"],
  },
  {
    name: "blog",
    category: "content",
    keywords: ["blog", "article", "post", "medium"],
  },
  {
    name: "programming",
    category: "tech",
    keywords: ["programming", "code", "developer", "stackoverflow", "github"],
  },
  {
    name: "developer",
    category: "tech",
    keywords: ["developer", "api", "sdk", "tooling"],
  },
  {
    name: "education",
    category: "edu",
    keywords: ["university", "course", "tutorial", "education"],
  },
  {
    name: "research",
    category: "edu",
    keywords: ["research", "paper", "journal", "arxiv"],
  },
  {
    name: "ai",
    category: "tech",
    keywords: ["ai", "machine learning", "ml", "neural", "llm"],
  },
  {
    name: "search",
    category: "tools",
    keywords: ["search", "index", "engine"],
  },
  {
    name: "news",
    category: "media",
    keywords: ["news", "breaking", "headline"],
  },
  {
    name: "entertainment",
    category: "media",
    keywords: ["entertainment", "movie", "music", "tv"],
  },
  {
    name: "shopping",
    category: "commerce",
    keywords: ["shop", "store", "cart", "buy"],
  },
  {
    name: "finance",
    category: "finance",
    keywords: ["finance", "bank", "investment", "stocks"],
  },
  {
    name: "nsfw",
    category: "rating",
    keywords: ["nsfw", "adult", "porn", "xxx"],
  },
  {
    name: "portfolio",
    category: "personal",
    keywords: ["portfolio", "designer", "work", "showcase"],
  },
  {
    name: "tools",
    category: "utility",
    keywords: ["tool", "utility", "plugin", "extension"],
  },
  {
    name: "forum",
    category: "community",
    keywords: ["forum", "discourse", "phpbb", "vbulletin"],
  },
  {
    name: "social",
    category: "social",
    keywords: ["social", "follow", "follower", "profile"],
  },
  {
    name: "food",
    category: "lifestyle",
    keywords: ["food", "recipe", "restaurant", "cafe"],
  },
];

function normalize(s) {
  return (s || "").toLowerCase();
}

// Simple tagger: count keyword hits per tag, return tags with score > 0
function taggerAssign(text) {
  const t = normalize(text);
  const results = [];
  for (const tag of TAG_CATALOG) {
    let score = 0;
    for (const kw of tag.keywords) {
      const re = new RegExp(
        "\\b" + kw.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "\\b",
        "i"
      );
      if (re.test(t)) score += 1;
    }
    if (score > 0) {
      results.push({
        name: tag.name,
        score,
        category: tag.category,
        description: `Matched ${score} keyword(s)`,
      });
    }
  }
  // sort by score desc
  results.sort((a, b) => b.score - a.score);
  return results;
}

module.exports = {
  TAG_CATALOG,
  taggerAssign,
};
