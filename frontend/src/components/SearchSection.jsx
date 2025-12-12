import { useState, useEffect } from "react";
function SearchSection({ query, onQueryChange }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const allTags = [
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
  /*
    "ai",
    "blog",
    "news",
    "nsfw",
    "tech",
    "education",
    "health",
    "finance",
    "entertainment",
    "sports",
    "travel",
    "food",
    "lifestyle",
    "science",
    "history",
    "art",
    "music",
    "gaming",
    "culture",
    "politics",*/

    const handleSearch = (e) => {
      e.preventDefault();
      onAddToken();
    }
  function onAddToken() {
    const token = input.trim();
    if (token) {
      const newQuery = query ? query + " " + token : token;
      onQueryChange(newQuery);
      setInput("");
      setSuggestions([]);
    }
  }
  function onSuggestionClick(tag) {
    const newQuery = query ? query + " " + tag : tag;
    onQueryChange(newQuery);
    setInput("");
    setSuggestions([]);
  }
  useEffect(() => {
    if (input) {
      const filtered = allTags.filter((tag) =>
        tag.toLowerCase().startsWith(input.toLowerCase()),
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [input]);
  return (
    <div className="searchSection" >
      <div className="searchBox" /* style={styles.searchBox} */>
        <form onSubmit={handleSearch}>
          <input
            className="input search-input"
            type="text"
            id="tag-search"
            name="tags"
            placeholder="Enter tags. Example: ai education"
            autoFocus
            autoComplete="off"
          />
          <button className="btn search-btn" type="submit" >
            Search
          </button>
        </form>
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
    </div>
  );
}

export default SearchSection;

/*
<div className="searchBox" >// style={styles.searchBox} 
        <input
          className="input"
          //style={styles.input} 
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

        <button className="btn"  onClick={onAddToken}>// style={styles.btn} 
          Add
        </button>

        //{ Autocomplete }
        {input && suggestions.length > 0 && (
          <div className="suggestBox" >// style={styles.suggestBox} 
            {suggestions.map((tag) => (
              <div
                className="suggestItem"
                key={tag}
                // style={styles.suggestItem} 
                onMouseDown={() => onSuggestionClick(tag)}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
      */