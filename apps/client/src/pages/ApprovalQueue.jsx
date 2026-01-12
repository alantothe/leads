import { useEffect, useState } from 'react';
import { approvalApi } from '../api';

const CONTENT_TYPE_LABELS = {
  lead: 'RSS Lead',
  instagram_post: 'Instagram Post',
  reddit_post: 'Reddit Post',
  telegram_post: 'Telegram Message'
};

export default function ApprovalQueue() {
  const [pendingItems, setPendingItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or content_type
  const [approvedBy, setApprovedBy] = useState('admin'); // Default user

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      const filterValue = filter === 'all' ? null : filter;
      const [items, statsData] = await Promise.all([
        approvalApi.getPending(filterValue),
        approvalApi.getStats()
      ]);
      setPendingItems(items.items);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(item) {
    try {
      await approvalApi.approve(
        item.content_type,
        item.content_id,
        approvedBy
      );
      loadData(); // Reload to update list
    } catch (err) {
      alert(`Error approving: ${err.message}`);
    }
  }

  async function handleReject(item, notes = null) {
    try {
      await approvalApi.reject(
        item.content_type,
        item.content_id,
        approvedBy,
        notes
      );
      loadData(); // Reload to update list
    } catch (err) {
      alert(`Error rejecting: ${err.message}`);
    }
  }

  async function handleApproveAll() {
    if (!confirm(`Approve all ${pendingItems.length} pending items?`)) return;

    const items = pendingItems.map(item => ({
      content_type: item.content_type,
      content_id: item.content_id,
      status: 'approved',
      approved_by: approvedBy
    }));

    try {
      await approvalApi.batchApprove(items);
      loadData();
    } catch (err) {
      alert(`Error batch approving: ${err.message}`);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Approval Queue</h1>
        <div className="approval-stats">
          {stats && (
            <>
              <span className="badge">
                {Object.values(stats).reduce((sum, s) => sum + s.pending, 0)} pending
              </span>
              <button
                className="button primary"
                onClick={handleApproveAll}
                disabled={pendingItems.length === 0}
              >
                Approve All
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Filter Tabs */}
      <div className="filters card">
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({stats ? Object.values(stats).reduce((sum, s) => sum + s.pending, 0) : 0})
          </button>
          <button
            className={filter === 'lead' ? 'active' : ''}
            onClick={() => setFilter('lead')}
          >
            RSS Leads ({stats?.lead?.pending || 0})
          </button>
          <button
            className={filter === 'instagram_post' ? 'active' : ''}
            onClick={() => setFilter('instagram_post')}
          >
            Instagram ({stats?.instagram_post?.pending || 0})
          </button>
          <button
            className={filter === 'reddit_post' ? 'active' : ''}
            onClick={() => setFilter('reddit_post')}
          >
            Reddit ({stats?.reddit_post?.pending || 0})
          </button>
          <button
            className={filter === 'telegram_post' ? 'active' : ''}
            onClick={() => setFilter('telegram_post')}
          >
            Telegram ({stats?.telegram_post?.pending || 0})
          </button>
        </div>
      </div>

      {/* Pending Items List */}
      {loading ? (
        <div className="loading">Loading pending items...</div>
      ) : (
        <div className="approval-list">
          {pendingItems.map(item => (
            <div key={`${item.content_type}-${item.content_id}`} className="approval-card">
              {item.image_url && (
                <div className="approval-image">
                  <img src={item.image_url} alt={item.title} />
                </div>
              )}

              <div className="approval-header">
                <span className="badge type-badge">
                  {CONTENT_TYPE_LABELS[item.content_type]}
                </span>
                <span className="source-badge">{item.source_name}</span>
              </div>

              <h3>{item.title}</h3>
              {item.summary && <p className="summary">{item.summary}</p>}

              <div className="approval-meta">
                <small>Collected: {new Date(item.collected_at).toLocaleString()}</small>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    View Original →
                  </a>
                )}
              </div>

              <div className="approval-actions">
                <button
                  className="button primary"
                  onClick={() => handleApprove(item)}
                >
                  ✓ Approve
                </button>
                <button
                  className="button danger"
                  onClick={() => handleReject(item)}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingItems.length === 0 && !loading && (
        <div className="empty-state">
          <p>No pending items to review!</p>
        </div>
      )}
    </div>
  );
}
