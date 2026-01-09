import { useEffect, useState } from 'react';
import { fetchLogsApi, feedsApi } from '../api';

export default function FetchLogs() {
  const [logs, setLogs] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    feed_id: '',
    status: '',
  });

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  async function loadFeeds() {
    try {
      const data = await feedsApi.getAll();
      setFeeds(data);
    } catch (err) {
      console.error('Failed to load feeds:', err);
    }
  }

  async function loadLogs() {
    try {
      setLoading(true);
      const params = {};
      if (filters.feed_id) params.feed_id = filters.feed_id;
      if (filters.status) params.status = filters.status;

      const data = await fetchLogsApi.getAll(params);
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await fetchLogsApi.delete(id);
      loadLogs();
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
      feed_id: '',
      status: '',
    });
  }

  if (loading) return <div className="loading">Loading fetch logs...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Fetch Logs</h1>
        <div className="log-count">{logs.length} logs found</div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="filters card">
        <h3>Filters</h3>
        <div className="filters-grid">
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
          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
        <button className="button secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Feed</th>
              <th>Fetched At</th>
              <th>Status</th>
              <th>Lead Count</th>
              <th>Error</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{getFeedName(log.feed_id)}</td>
                <td>{new Date(log.fetched_at).toLocaleString()}</td>
                <td>
                  <span className={`status ${log.status?.toLowerCase()}`}>
                    {log.status || 'N/A'}
                  </span>
                </td>
                <td>{log.lead_count ?? '-'}</td>
                <td className={log.error_message ? 'error-text' : ''}>
                  {log.error_message || '-'}
                </td>
                <td className="actions">
                  <button className="button-sm danger" onClick={() => handleDelete(log.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && !loading && (
        <div className="empty-state">
          <p>No fetch logs found. Logs are automatically created when feeds are fetched.</p>
        </div>
      )}
    </div>
  );
}
