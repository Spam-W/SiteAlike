import SiteCard from "./SiteCard";
function SiteCardList({ sites, query, setQuery }) {
  return (
    <div className="grid">
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} query={query} setQuery={setQuery} />
      ))}
    </div>
  );
}
export default SiteCardList;
