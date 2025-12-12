function SiteCard({ site, query, setQuery }) {
  function addIncludeTag(tag) {
    const token = tag;
    const newQuery = query ? query + " " + token : token;
    setQuery(newQuery);
  }
  return (
    <div className="card">
      <img
        className="img"
        src={site.screenshot}
        alt="" /*style={styles.img}*/
      ></img>
      <h3>{site.name}</h3>
      <a href={site.url} target="_blank" rel="noreferrer">
        {site.url}
      </a>
      <p>{site.description}</p>
      <div className="tagRow" /* style={styles.tagRow} */>
        {site.tags.map((t) => (
          <button
            className="tag"
            key={t}
            onClick={() => addIncludeTag(t)} /* style={styles.tag} */
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SiteCard;
