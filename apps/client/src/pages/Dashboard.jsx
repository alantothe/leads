import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { devApi } from '../api';
import { useDashboardStats } from '../hooks';
import { useDialog } from '../providers/DialogProvider';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const {
    data: stats,
    isLoading,
    isFetching,
    error,
  } = useDashboardStats();

  const clearFetchedMutation = useMutation({
    mutationFn: () => devApi.clearFetched(),
    onSuccess: (result) => {
      dialog.alert(result.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => devApi.clearAll(),
    onSuccess: (result) => {
      dialog.alert(result.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });

  const isMutating = clearFetchedMutation.isPending || clearAllMutation.isPending;

  async function handleClearFetched() {
    const confirmed = await dialog.confirm(
      'Clear all fetched content and logs (RSS, Instagram, Telegram)? This will keep categories, feeds, tags, and feed mappings.',
    );
    if (!confirmed) {
      return;
    }
    try {
      await clearFetchedMutation.mutateAsync();
    } catch (error) {
      await dialog.alert(`Error: ${error.message}`);
    }
  }

  async function handleClearAll() {
    const confirmed = await dialog.confirm(
      '⚠️ WARNING: Clear ALL data including categories, feeds, tags, subreddits, posts, and logs across RSS, Instagram, and Telegram? This cannot be undone!',
    );
    if (!confirmed) {
      return;
    }
    try {
      await clearAllMutation.mutateAsync();
    } catch (error) {
      await dialog.alert(`Error: ${error.message}`);
    }
  }

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error.message}</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      {isFetching && <div className="badge">Refreshing...</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats?.categories ?? 0}</h3>
          <p>Categories</p>
          <Link to="/categories">View All</Link>
        </div>
        <div className="stat-card">
          <h3>{stats?.feeds ?? 0}</h3>
          <p>Total Feeds</p>
          <Link to="/feeds">View All</Link>
        </div>
        <div className="stat-card">
          <h3>{stats?.activeFeeds ?? 0}</h3>
          <p>Active Feeds</p>
          <Link to="/feeds?active=1">View Active</Link>
        </div>
        <div className="stat-card">
          <h3>{stats?.tags ?? 0}</h3>
          <p>Tags</p>
          <Link to="/tags">View All</Link>
        </div>
        <div className="stat-card">
          <h3>{stats?.leads ?? 0}</h3>
          <p>Leads Collected</p>
          <Link to="/leads">View All</Link>
        </div>
      </div>

      <div className="dev-tools card">
        <h2>Development Tools</h2>
        <p className="dev-warning">⚠️ Use these tools carefully - they will delete data!</p>
        <div className="dev-actions">
          <button className="button-sm warning" onClick={handleClearFetched} disabled={isMutating}>
            Clear Fetched Data (Posts & Logs)
          </button>
          <button className="button-sm danger" onClick={handleClearAll} disabled={isMutating}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
