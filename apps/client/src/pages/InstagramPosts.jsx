import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { instagramPostsApi, instagramFeedsApi, categoriesApi, tagsApi, translationApi } from '../api';

export default function InstagramPosts() {
  const [posts, setPosts] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    instagram_feed_id: '',
  });
  const [showTranslated, setShowTranslated] = useState(true); // Default to showing English
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [filters]);

  async function loadData() {
    try {
      const [feedsData, categoriesData, tagsData] = await Promise.all([
        instagramFeedsApi.getAll(),
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

  async function loadPosts() {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.tag) params.tag = filters.tag;
      if (filters.instagram_feed_id) params.instagram_feed_id = filters.instagram_feed_id;

      const data = await instagramPostsApi.getAll(params);
      setPosts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this Instagram post?')) return;
    try {
      await instagramPostsApi.delete(id);
      loadPosts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function getFeedName(feedId) {
    const feed = feeds.find(f => f.id === feedId);
    return feed ? feed.display_name : 'Unknown';
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      search: '',
      category: '',
      tag: '',
      instagram_feed_id: '',
    });
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  }

  async function handleTranslate() {
    if (!confirm('Translate all pending Instagram posts to English?')) return;
    try {
      setTranslating(true);
      const result = await translationApi.translateInstagramPosts(filters);
      alert(`Translation complete!\n${result.stats.translated} translated\n${result.stats.already_english} already in English`);
      loadPosts(); // Reload to show translated content
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Instagram Posts</h1>
        <div className="page-actions">
          <Link to="/instagram-feeds" className="button secondary">Manage Instagram Feeds</Link>
        </div>
        <div className="lead-count">{posts.length} posts found</div>
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
              placeholder="Search in captions, usernames..."
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
            <label>Instagram Feed</label>
            <select
              value={filters.instagram_feed_id}
              onChange={(e) => handleFilterChange('instagram_feed_id', e.target.value)}
            >
              <option value="">All Feeds</option>
              {feeds.map(feed => (
                <option key={feed.id} value={feed.id}>{feed.display_name}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="button secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="translation-controls card">
        <div className="translation-header">
          <h3>Translation</h3>
          <button
            className="button primary"
            onClick={handleTranslate}
            disabled={translating}
          >
            {translating ? 'Translating...' : 'Translate Pending Posts'}
          </button>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showTranslated}
              onChange={(e) => setShowTranslated(e.target.checked)}
            />
            Show English (translated when available)
          </label>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading Instagram posts...</div>
      ) : (
        <div className="leads-list">
          {posts.map((post) => {
            // Determine which caption to show based on toggle and availability
            const displayCaption = showTranslated && post.caption_translated
              ? post.caption_translated
              : post.caption;

            const isTranslated = post.translation_status === 'translated';
            const mediaUrl = post.media_url || post.thumbnail_url;
            const showVideo = post.media_type === 'video' && post.media_url;

            return (
              <div key={post.id} className="lead-card instagram-post-card">
                <div className="lead-header">
                  <div>
                    <h3>
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                        @{post.username}
                      </a>
                      {isTranslated && <span className="badge translation-badge">Translated</span>}
                      {post.detected_language && post.detected_language !== 'en' && (
                        <span className="badge language-badge">{post.detected_language}</span>
                      )}
                    </h3>
                    <span className="badge">{getFeedName(post.instagram_feed_id)}</span>
                  </div>
                  <button className="button-sm danger" onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                </div>

                {mediaUrl && (
                  <div className="instagram-media">
                    {showVideo ? (
                      <video controls poster={post.thumbnail_url}>
                        <source src={post.media_url} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={mediaUrl} alt="Instagram post" />
                    )}
                  </div>
                )}

                {displayCaption && (
                  <p className="lead-summary">{displayCaption}</p>
                )}

              <div className="instagram-stats">
                <span>{formatNumber(post.like_count)} likes</span>
                <span>{formatNumber(post.comment_count)} comments</span>
                {post.view_count && <span>{formatNumber(post.view_count)} views</span>}
                {post.media_type && <span className="media-type-badge">{post.media_type}</span>}
              </div>

              <div className="lead-footer">
                <small>Posted: {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : 'Unknown'}</small>
                <small>Collected: {new Date(post.collected_at).toLocaleString()}</small>
                {!showTranslated && post.caption_translated && (
                  <small className="translation-hint">English translation available</small>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="empty-state">
          <p>No Instagram posts found. Try adjusting your filters or fetch some Instagram feeds!</p>
        </div>
      )}
    </div>
  );
}
