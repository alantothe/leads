import { useEffect, useState } from 'react';
import { leadsApi, feedsApi, categoriesApi, tagsApi } from '../api';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    feed_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadLeads();
  }, [filters]);

  async function loadData() {
    try {
      const [feedsData, categoriesData, tagsData] = await Promise.all([
        feedsApi.getAll(),
        categoriesApi.getAll(),
        tagsApi.getAll(),
      ]);
      setFeeds(feedsData);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadLeads() {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.tag) params.tag = filters.tag;
      if (filters.feed_id) params.feed_id = filters.feed_id;

      const data = await leadsApi.getAll(params);
      setLeads(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await leadsApi.delete(id);
      loadLeads();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function getFeedName(feedId) {
    const feed = feeds.find(f => f.id === feedId);
    return feed ? feed.source_name : 'Unknown';
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      search: '',
      category: '',
      tag: '',
      feed_id: '',
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Leads</h1>
        <div className="lead-count">{leads.length} leads found</div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="filters card">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search in title, summary, content..."
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tag</label>
            <select
              value={filters.tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.name}>{tag.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Feed</label>
            <select
              value={filters.feed_id}
              onChange={(e) => handleFilterChange('feed_id', e.target.value)}
            >
              <option value="">All Feeds</option>
              {feeds.map(feed => (
                <option key={feed.id} value={feed.id}>{feed.source_name}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="button secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : (
        <div className="leads-list">
          {leads.map((lead) => (
            <div key={lead.id} className="lead-card">
              <div className="lead-header">
                <h3>
                  <a href={lead.link} target="_blank" rel="noopener noreferrer">
                    {lead.title}
                  </a>
                </h3>
                <button className="button-sm danger" onClick={() => handleDelete(lead.id)}>
                  Delete
                </button>
              </div>
              <div className="lead-meta">
                <span className="badge">{getFeedName(lead.feed_id)}</span>
                {lead.author && <span>By {lead.author}</span>}
                {lead.published && <span>{new Date(lead.published).toLocaleDateString()}</span>}
              </div>
              {lead.summary && (
                <p className="lead-summary">{lead.summary}</p>
              )}
              <div className="lead-footer">
                <small>Collected: {new Date(lead.collected_at).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {leads.length === 0 && !loading && (
        <div className="empty-state">
          <p>No leads found. Try adjusting your filters or fetch some feeds!</p>
        </div>
      )}
    </div>
  );
}
