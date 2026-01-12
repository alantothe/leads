import { useState } from 'react';
import {
  useCategories,
  useCreateFeed,
  useDeleteFeed,
  useFeeds,
  useFetchAllFeeds,
  useFetchFeed,
  useToggleFeedActive,
  useUpdateFeed,
} from '../hooks';

export default function Feeds() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    url: '',
    source_name: '',
    website: '',
    fetch_interval: 30,
    is_active: 1,
  });

  const {
    data: feeds = [],
    isLoading: feedsLoading,
    isFetching: feedsFetching,
    error: feedsError,
  } = useFeeds();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const createFeed = useCreateFeed();
  const updateFeed = useUpdateFeed();
  const deleteFeed = useDeleteFeed();
  const toggleFeedActive = useToggleFeedActive();
  const fetchFeed = useFetchFeed();
  const fetchAllFeeds = useFetchAllFeeds();

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
      alert(`Error: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this feed?')) return;
    try {
      await deleteFeed.mutateAsync(id);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function toggleActive(feed) {
    try {
      await toggleFeedActive.mutateAsync(feed);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleFetch(feedId) {
    try {
      const result = await fetchFeed.mutateAsync(feedId);
      alert(`Fetch completed!\nStatus: ${result.status}\nLeads collected: ${result.lead_count}${result.error_message ? '\nErrors: ' + result.error_message : ''}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleFetchAll() {
    if (!confirm('Fetch all active feeds? This may take a while.')) return;
    try {
      const results = await fetchAllFeeds.mutateAsync();
      const summary = results.map(r => `${r.feed_id}: ${r.lead_count} leads`).join('\n');
      alert(`Fetched ${results.length} feeds:\n${summary}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function handleEdit(feed) {
    setEditingId(feed.id);
    setFormData({
      category_id: feed.category_id,
      url: feed.url,
      source_name: feed.source_name,
      website: feed.website || '',
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
      url: '',
      source_name: '',
      website: '',
      fetch_interval: 30,
      is_active: 1,
    });
  }

  function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  if (isLoading) return <div className="loading">Loading feeds...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Feeds</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button success" onClick={handleFetchAll} disabled={isMutating}>
            Fetch All
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
          <h3>{editingId ? 'Edit Feed' : 'New Feed'}</h3>
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
            <label>RSS URL *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Source Name *</label>
            <input
              type="text"
              value={formData.source_name}
              onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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
              <th>Source</th>
              <th>Category</th>
              <th>URL</th>
              <th>Tags</th>
              <th>Interval</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeds.map((feed) => (
              <tr key={feed.id}>
                <td>{feed.id}</td>
                <td><strong>{feed.source_name}</strong></td>
                <td>
                  <span className="badge">{getCategoryName(feed.category_id)}</span>
                </td>
                <td>
                  <a href={feed.url} target="_blank" rel="noopener noreferrer" className="link-small">
                    {feed.url.substring(0, 40)}...
                  </a>
                </td>
                <td>
                  {feed.tags && feed.tags.length > 0 ? (
                    <div className="tags">
                      {feed.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td>{feed.fetch_interval}m</td>
                <td>
                  <span className={`status ${feed.is_active === 1 ? 'active' : 'inactive'}`}>
                    {feed.is_active === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button className="button-sm success" onClick={() => handleFetch(feed.id)} disabled={isMutating}>
                    Fetch
                  </button>
                  <button className="button-sm" onClick={() => handleEdit(feed)}>
                    Edit
                  </button>
                  <button
                    className={`button-sm ${feed.is_active === 1 ? 'warning' : 'success'}`}
                    onClick={() => toggleActive(feed)}
                    disabled={isMutating}
                  >
                    {feed.is_active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="button-sm danger" onClick={() => handleDelete(feed.id)} disabled={isMutating}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
