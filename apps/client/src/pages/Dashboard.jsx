import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi, feedsApi, leadsApi, tagsApi, devApi } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    feeds: 0,
    activeFeeds: 0,
    tags: 0,
    leads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const [categories, feeds, tags, leads] = await Promise.all([
        categoriesApi.getAll(),
        feedsApi.getAll(),
        tagsApi.getAll(),
        leadsApi.getAll({ limit: 1 }),
      ]);

      setStats({
        categories: categories.length,
        feeds: feeds.length,
        activeFeeds: feeds.filter(f => f.is_active === 1).length,
        tags: tags.length,
        leads: leads.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearFetched() {
    if (!confirm('Clear all fetched content and logs (RSS, Instagram, Telegram)? This will keep categories, feeds, tags, and feed mappings.')) {
      return;
    }
    try {
      const result = await devApi.clearFetched();
      alert(result.message);
      loadStats();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  async function handleClearAll() {
    if (!confirm('⚠️ WARNING: Clear ALL data including categories, feeds, tags, subreddits, posts, and logs across RSS, Instagram, and Telegram? This cannot be undone!')) {
      return;
    }
    try {
      const result = await devApi.clearAll();
      alert(result.message);
      loadStats();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.categories}</h3>
          <p>Categories</p>
          <Link to="/categories">View All</Link>
        </div>
        <div className="stat-card">
          <h3>{stats.feeds}</h3>
          <p>Total Feeds</p>
          <Link to="/feeds">View All</Link>
        </div>
        <div className="stat-card">
          <h3>{stats.activeFeeds}</h3>
          <p>Active Feeds</p>
          <Link to="/feeds?active=1">View Active</Link>
        </div>
        <div className="stat-card">
          <h3>{stats.tags}</h3>
          <p>Tags</p>
          <Link to="/tags">View All</Link>
        </div>
        <div className="stat-card">
          <h3>{stats.leads}</h3>
          <p>Leads Collected</p>
          <Link to="/leads">View All</Link>
        </div>
      </div>

      <div className="dev-tools card">
        <h2>Development Tools</h2>
        <p className="dev-warning">⚠️ Use these tools carefully - they will delete data!</p>
        <div className="dev-actions">
          <button className="button-sm warning" onClick={handleClearFetched}>
            Clear Fetched Data (Posts & Logs)
          </button>
          <button className="button-sm danger" onClick={handleClearAll}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
