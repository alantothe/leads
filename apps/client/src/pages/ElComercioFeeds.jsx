import { useState } from 'react';
import {
  useCategories,
  useCreateElComercioFeed,
  useDeleteElComercioFeed,
  useFetchAllElComercioFeeds,
  useFetchElComercioFeed,
  useElComercioFeeds,
  useToggleElComercioFeedActive,
  useUpdateElComercioFeed,
} from '../hooks';
import { useDialog } from '../providers/DialogProvider';

export default function ElComercioFeeds() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    url: 'https://elcomercio.pe/archivo/gastronomia/',
    display_name: '',
    section: 'gastronomia',
    fetch_interval: 60,
    is_active: 1,
  });
  const dialog = useDialog();

  const {
    data: feeds = [],
    isLoading: feedsLoading,
    isFetching: feedsFetching,
    error: feedsError,
  } = useElComercioFeeds();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const createFeed = useCreateElComercioFeed();
  const updateFeed = useUpdateElComercioFeed();
  const deleteFeed = useDeleteElComercioFeed();
  const toggleFeedActive = useToggleElComercioFeedActive();
  const fetchFeed = useFetchElComercioFeed();
  const fetchAllFeeds = useFetchAllElComercioFeeds();

  const error = feedsError || categoriesError;
  const isLoading = feedsLoading || categoriesLoading;
  const isMutating =
    createFeed.isPending ||
    updateFeed.isPending ||
    deleteFeed.isPending ||
    toggleFeedActive.isPending ||
    fetchFeed.isPending ||
    fetchAllFeeds.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFeed.mutateAsync({ id: editingId, data: formData });
      } else {
        await createFeed.mutateAsync(formData);
      }
      handleCancel();
    } catch (err) {
      await dialog.alert(`Error: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    const confirmed = await dialog.confirm('Are you sure you want to delete this El Comercio feed?');
    if (!confirmed) return;
    try {
      await deleteFeed.mutateAsync(id);
    } catch (err) {
      await dialog.alert(`Error: ${err.message}`);
    }
  }

  async function toggleActive(feed) {
    try {
      await toggleFeedActive.mutateAsync(feed);
    } catch (err) {
      await dialog.alert(`Error: ${err.message}`);
    }
  }

  async function handleFetch(feedId) {
    try {
      const result = await fetchFeed.mutateAsync(feedId);
      await dialog.alert(
        `Scraping completed!\n\nStatus: ${result.status}\nArticles collected: ${result.post_count}${result.error_message ? '\n\nErrors:\n' + result.error_message : ''}\n\n⚠️ This replaces ALL existing articles with fresh 15 from the archive.`,
      );
    } catch (err) {
      await dialog.alert(`Error: ${err.message}`);
    }
  }

  async function handleFetchAll() {
    const confirmed = await dialog.confirm('Scrape all active El Comercio feeds? This may take 20-30 seconds per feed.');
    if (!confirmed) return;
    try {
      const results = await fetchAllFeeds.mutateAsync();
      const summary = results.map(r => `${r.display_name}: ${r.post_count} articles`).join('\n');
      await dialog.alert(`Scraped ${results.length} El Comercio feeds:\n\n${summary}`);
    } catch (err) {
      await dialog.alert(`Error: ${err.message}`);
    }
  }

  function handleEdit(feed) {
    setEditingId(feed.id);
    setFormData({
      category_id: feed.category_id,
      url: feed.url,
      display_name: feed.display_name,
      section: feed.section,
      fetch_interval: feed.fetch_interval,
      is_active: feed.is_active,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      category_id: '',
      url: 'https://elcomercio.pe/archivo/gastronomia/',
      display_name: '',
      section: 'gastronomia',
      fetch_interval: 60,
      is_active: 1,
    });
  }

  function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  if (isLoading) return <div className="loading">Loading El Comercio feeds...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>El Comercio Feeds</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button success" onClick={handleFetchAll} disabled={isMutating}>
            Scrape All
          </button>
          <button className="button" onClick={() => setShowForm(!showForm)} disabled={isMutating}>
            {showForm ? 'Cancel' : 'Add Feed'}
          </button>
        </div>
        {feedsFetching && <span className="badge">Refreshing...</span>}
      </div>

      {error && <div className="error">{error.message}</div>}

      {showForm && (
        <form className="form card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit El Comercio Feed' : 'New El Comercio Feed'}</h3>
          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Archive URL *</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://elcomercio.pe/archivo/gastronomia/"
              required
            />
            <small>El Comercio archive URL to scrape</small>
          </div>
          <div className="form-group">
            <label>Display Name *</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., El Comercio Gastronomía"
              required
            />
          </div>
          <div className="form-group">
            <label>Section *</label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="gastronomia"
              required
            />
          </div>
          <div className="form-group">
            <label>Fetch Interval (minutes)</label>
            <input
              type="number"
              value={formData.fetch_interval}
              onChange={(e) => setFormData({ ...formData, fetch_interval: parseInt(e.target.value) })}
              min="1"
            />
            <small>How often to scrape (manual trigger only for now)</small>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
              />
              {' '}Active
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="button" disabled={isMutating}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="button secondary" onClick={handleCancel} disabled={isMutating}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Display Name</th>
              <th>Section</th>
              <th>Category</th>
              <th>URL</th>
              <th>Last Scraped</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeds.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>
                  No El Comercio feeds found. Click "Add Feed" to create one.
                </td>
              </tr>
            ) : (
              feeds.map(feed => (
                <tr key={feed.id}>
                  <td>{feed.id}</td>
                  <td>{feed.display_name}</td>
                  <td>
                    <span className="badge">{feed.section}</span>
                  </td>
                  <td>{getCategoryName(feed.category_id)}</td>
                  <td>
                    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="link">
                      Archive Link ↗
                    </a>
                  </td>
                  <td>{feed.last_fetched ? new Date(feed.last_fetched).toLocaleString() : 'Never'}</td>
                  <td>
                    <button
                      className={`badge ${feed.is_active ? 'success' : 'secondary'}`}
                      onClick={() => toggleActive(feed)}
                      disabled={isMutating}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {feed.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="button small success"
                        onClick={() => handleFetch(feed.id)}
                        disabled={isMutating}
                        title="Scrape latest 15 articles (20-30 sec)"
                      >
                        Scrape
                      </button>
                      <button
                        className="button small"
                        onClick={() => handleEdit(feed)}
                        disabled={isMutating}
                      >
                        Edit
                      </button>
                      <button
                        className="button small danger"
                        onClick={() => handleDelete(feed.id)}
                        disabled={isMutating}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {feeds.length > 0 && (
        <div className="info-box" style={{ marginTop: '20px' }}>
          <h4>About El Comercio Scraping</h4>
          <ul>
            <li>Each scrape fetches the <strong>latest 15 articles</strong> from the archive</li>
            <li>Scraping takes approximately <strong>20-30 seconds</strong> per feed</li>
            <li>All articles are <strong>auto-translated</strong> from Spanish to English</li>
            <li>Articles default to <strong>"pending" approval status</strong></li>
            <li>Each scrape <strong>replaces all existing articles</strong> with fresh data</li>
          </ul>
        </div>
      )}
    </div>
  );
}
