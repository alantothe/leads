import { useEffect, useState } from 'react';
import { instagramFeedsApi, categoriesApi, tagsApi } from '../api';

export default function InstagramFeeds() {
  const [feeds, setFeeds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    username: '',
    display_name: '',
    profile_url: '',
    fetch_interval: 60,
    is_active: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [feedsData, categoriesData, tagsData] = await Promise.all([
        instagramFeedsApi.getAll(),
        categoriesApi.getAll(),
        tagsApi.getAll(),
      ]);
      setFeeds(feedsData);
      setCategories(categoriesData);
      setAllTags(tagsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await instagramFeedsApi.update(editingId, formData);
      } else {
        await instagramFeedsApi.create(formData);
      }
      handleCancel();
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this Instagram feed?')) return;
    try {
      await instagramFeedsApi.delete(id);
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function toggleActive(feed) {
    try {
      if (feed.is_active === 1) {
        await instagramFeedsApi.deactivate(feed.id);
      } else {
        await instagramFeedsApi.activate(feed.id);
      }
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleFetch(feedId) {
    try {
      const result = await instagramFeedsApi.fetch(feedId);
      alert(`Fetch completed!\nStatus: ${result.status}\nPosts collected: ${result.post_count}${result.error_message ? '\nErrors: ' + result.error_message : ''}`);
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleFetchAll() {
    if (!confirm('Fetch all active Instagram feeds? This may take a while.')) return;
    try {
      const results = await instagramFeedsApi.fetchAll();
      const summary = results.map(r => `@${r.username || r.instagram_feed_id}: ${r.post_count} posts`).join('\n');
      alert(`Fetched ${results.length} Instagram feeds:\n${summary}`);
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function handleEdit(feed) {
    setEditingId(feed.id);
    setFormData({
      category_id: feed.category_id,
      username: feed.username,
      display_name: feed.display_name,
      profile_url: feed.profile_url || '',
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
      username: '',
      display_name: '',
      profile_url: '',
      fetch_interval: 60,
      is_active: 1,
    });
  }

  function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  if (loading) return <div className="loading">Loading Instagram feeds...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Instagram Feeds</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button success" onClick={handleFetchAll}>
            Fetch All
          </button>
          <button className="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Instagram Feed'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form className="form card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Instagram Feed' : 'New Instagram Feed'}</h3>
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
            <label>Instagram Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g., openai"
              required
            />
          </div>
          <div className="form-group">
            <label>Display Name *</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., OpenAI Official"
              required
            />
          </div>
          <div className="form-group">
            <label>Profile URL</label>
            <input
              type="text"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              placeholder="https://instagram.com/username"
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
            <button type="submit" className="button">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="button secondary" onClick={handleCancel}>
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
              <th>Username</th>
              <th>Display Name</th>
              <th>Category</th>
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
                <td>
                  <a href={feed.profile_url || `https://instagram.com/${feed.username}`} target="_blank" rel="noopener noreferrer">
                    @{feed.username}
                  </a>
                </td>
                <td><strong>{feed.display_name}</strong></td>
                <td>
                  <span className="badge">{getCategoryName(feed.category_id)}</span>
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
                  <button className="button-sm success" onClick={() => handleFetch(feed.id)}>
                    Fetch
                  </button>
                  <button className="button-sm" onClick={() => handleEdit(feed)}>
                    Edit
                  </button>
                  <button
                    className={`button-sm ${feed.is_active === 1 ? 'warning' : 'success'}`}
                    onClick={() => toggleActive(feed)}
                  >
                    {feed.is_active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="button-sm danger" onClick={() => handleDelete(feed.id)}>
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
