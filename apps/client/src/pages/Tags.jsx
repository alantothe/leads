import { useEffect, useState } from 'react';
import { tagsApi } from '../api';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const data = await tagsApi.getAll();
      setTags(data);
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
        await tagsApi.update(editingId, formData);
      } else {
        await tagsApi.create(formData);
      }
      setFormData({ name: '' });
      setShowForm(false);
      setEditingId(null);
      loadTags();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await tagsApi.delete(id);
      loadTags();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function handleEdit(tag) {
    setEditingId(tag.id);
    setFormData({ name: tag.name });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '' });
  }

  if (loading) return <div className="loading">Loading tags...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tags</h1>
        <button className="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Tag'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form className="form card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Tag' : 'New Tag'}</h3>
          <div className="form-group">
            <label>Tag Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Remote, Python, Senior"
            />
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

      <div className="tags-grid">
        {tags.map((tag) => (
          <div key={tag.id} className="tag-card">
            <span className="tag-name">{tag.name}</span>
            <div className="tag-actions">
              <button className="button-sm" onClick={() => handleEdit(tag)}>
                Edit
              </button>
              <button className="button-sm danger" onClick={() => handleDelete(tag.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {tags.length === 0 && !loading && (
        <div className="empty-state">
          <p>No tags yet. Create your first tag to organize feeds!</p>
        </div>
      )}
    </div>
  );
}
