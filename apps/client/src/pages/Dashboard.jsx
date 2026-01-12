import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useFeeds,
  useInstagramFeeds,
  useInstagramPostsList,
  useLeadsList,
} from '../hooks';

const DASHBOARD_FETCH_LIMIT = 1000;
const SUMMARY_SUFFIX_RE = /\s*The post\b[\s\S]*?\bfirst appeared on\b[\s\S]*$/i;

function cleanLeadSummary(summary) {
  if (!summary) return '';

  if (typeof DOMParser === 'undefined') {
    return summary
      .replace(/<[^>]*>/g, ' ')
      .replace(SUMMARY_SUFFIX_RE, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const doc = new DOMParser().parseFromString(summary, 'text/html');
  const paragraphs = Array.from(doc.body.querySelectorAll('p'))
    .map(p => (p.textContent || '').trim())
    .filter(Boolean);

  const text = paragraphs.length ? paragraphs[0] : (doc.body.textContent || '');

  return text
    .replace(SUMMARY_SUFFIX_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatNumber(value) {
  const num = Number(value ?? 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(value, withTime = false) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

function getTimestamp(value) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function Dashboard() {
  const [contentFilter, setContentFilter] = useState('all');
  const [showTranslated, setShowTranslated] = useState(true);

  const {
    data: leads = [],
    isLoading: leadsLoading,
    isFetching: leadsFetching,
    error: leadsError,
  } = useLeadsList({ limit: DASHBOARD_FETCH_LIMIT });

  const {
    data: posts = [],
    isLoading: postsLoading,
    isFetching: postsFetching,
    error: postsError,
  } = useInstagramPostsList({ limit: DASHBOARD_FETCH_LIMIT });

  const {
    data: feeds = [],
    isLoading: feedsLoading,
    error: feedsError,
  } = useFeeds();

  const {
    data: instagramFeeds = [],
    isLoading: instagramFeedsLoading,
    error: instagramFeedsError,
  } = useInstagramFeeds();

  const feedNames = useMemo(
    () => new Map(feeds.map((feed) => [feed.id, feed.source_name])),
    [feeds],
  );
  const instagramFeedNames = useMemo(
    () => new Map(instagramFeeds.map((feed) => [feed.id, feed.display_name])),
    [instagramFeeds],
  );

  const combinedItems = useMemo(() => {
    const leadItems = leads.map((lead) => ({ type: 'lead', data: lead }));
    const instagramItems = posts.map((post) => ({ type: 'instagram', data: post }));
    return [...leadItems, ...instagramItems];
  }, [leads, posts]);

  const filteredItems = useMemo(() => {
    if (contentFilter === 'lead') {
      return combinedItems.filter((item) => item.type === 'lead');
    }
    if (contentFilter === 'instagram') {
      return combinedItems.filter((item) => item.type === 'instagram');
    }
    return combinedItems;
  }, [combinedItems, contentFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aDate = a.type === 'lead'
        ? a.data.published || a.data.collected_at
        : a.data.posted_at || a.data.collected_at;
      const bDate = b.type === 'lead'
        ? b.data.published || b.data.collected_at
        : b.data.posted_at || b.data.collected_at;
      return getTimestamp(bDate) - getTimestamp(aDate);
    });
  }, [filteredItems]);

  const totalCount = leads.length + posts.length;
  const visibleCount = sortedItems.length;
  const isLoading =
    leadsLoading || postsLoading || feedsLoading || instagramFeedsLoading;
  const isFetching = leadsFetching || postsFetching;
  const error = leadsError || postsError || feedsError || instagramFeedsError;

  function renderLeadCard(lead) {
    const displayTitle = showTranslated && lead.title_translated
      ? lead.title_translated
      : lead.title;

    const rawSummary = showTranslated && lead.summary_translated
      ? lead.summary_translated
      : lead.summary;

    const summary = cleanLeadSummary(rawSummary);
    const isTranslated = lead.translation_status === 'translated';
    const languageLabel = lead.detected_language && lead.detected_language !== 'en'
      ? lead.detected_language.toUpperCase()
      : null;

    return (
      <div key={`lead-${lead.id}`} className="lead-card">
        {lead.image_url && (
          <div className="lead-image">
            <img src={lead.image_url} alt={displayTitle} loading="lazy" />
          </div>
        )}
        <div className="lead-header">
          <h3>
            {lead.link ? (
              <a href={lead.link} target="_blank" rel="noopener noreferrer">
                {displayTitle}
              </a>
            ) : (
              displayTitle
            )}
            {isTranslated && <span className="badge translation-badge">Translated</span>}
            {languageLabel && <span className="badge language-badge">{languageLabel}</span>}
          </h3>
          <span className="badge">RSS Lead</span>
        </div>
        <div className="lead-meta">
          <span className="badge">{feedNames.get(lead.feed_id) || 'Unknown Feed'}</span>
          {lead.author && <span>By {lead.author}</span>}
          <span>
            {lead.published
              ? `Published: ${formatDate(lead.published)}`
              : `Collected: ${formatDate(lead.collected_at)}`}
          </span>
        </div>
        {summary && <p className="lead-summary">{summary}</p>}
        <div className="lead-footer">
          <small>Collected: {formatDate(lead.collected_at, true)}</small>
          {!showTranslated && lead.title_translated && (
            <small className="translation-hint">English translation available</small>
          )}
        </div>
      </div>
    );
  }

  function renderInstagramCard(post) {
    const displayCaption = showTranslated && post.caption_translated
      ? post.caption_translated
      : post.caption;
    const isTranslated = post.translation_status === 'translated';
    const languageLabel = post.detected_language && post.detected_language !== 'en'
      ? post.detected_language.toUpperCase()
      : null;
    const mediaUrl = post.media_url || post.thumbnail_url;
    const showVideo = post.media_type === 'video' && post.media_url;
    const usernameLabel = post.username ? `@${post.username}` : 'Instagram post';

    return (
      <div key={`instagram-${post.id}`} className="lead-card">
        <div className="lead-header">
          <h3>
            {post.permalink ? (
              <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                {usernameLabel}
              </a>
            ) : (
              usernameLabel
            )}
            {isTranslated && <span className="badge translation-badge">Translated</span>}
            {languageLabel && <span className="badge language-badge">{languageLabel}</span>}
          </h3>
          <span className="badge">Instagram Post</span>
        </div>
        <div className="lead-meta">
          <span className="badge">
            {instagramFeedNames.get(post.instagram_feed_id) || 'Unknown Feed'}
          </span>
          <span>
            {post.posted_at
              ? `Posted: ${formatDate(post.posted_at)}`
              : `Collected: ${formatDate(post.collected_at)}`}
          </span>
        </div>

        {mediaUrl && (
          <div className="instagram-media">
            {showVideo ? (
              <video controls poster={post.thumbnail_url}>
                <source src={post.media_url} type="video/mp4" />
              </video>
            ) : (
              <img src={mediaUrl} alt="Instagram post" loading="lazy" />
            )}
          </div>
        )}

        {displayCaption && <p className="lead-summary">{displayCaption}</p>}

        <div className="instagram-stats">
          <span>{formatNumber(post.like_count)} likes</span>
          <span>{formatNumber(post.comment_count)} comments</span>
          {post.view_count && <span>{formatNumber(post.view_count)} views</span>}
          {post.media_type && <span className="media-type-badge">{post.media_type}</span>}
        </div>

        <div className="lead-footer">
          <small>Collected: {formatDate(post.collected_at, true)}</small>
          {!showTranslated && post.caption_translated && (
            <small className="translation-hint">English translation available</small>
          )}
        </div>
      </div>
    );
  }

  const emptyMessage = contentFilter === 'all'
    ? 'No approved content yet. Review pending items in the approval queue.'
    : 'No approved content matches this filter.';

  return (
    <div className="page">
      {isFetching && !isLoading && <div className="badge">Refreshing...</div>}

      {error && <div className="error">{error.message}</div>}

      <div className="filters card">
        <h3>Content Filters</h3>
        <div className="filter-tabs">
          <button
            className={contentFilter === 'all' ? 'active' : ''}
            onClick={() => setContentFilter('all')}
          >
            All ({totalCount})
          </button>
          <button
            className={contentFilter === 'lead' ? 'active' : ''}
            onClick={() => setContentFilter('lead')}
          >
            RSS Leads ({leads.length})
          </button>
          <button
            className={contentFilter === 'instagram' ? 'active' : ''}
            onClick={() => setContentFilter('instagram')}
          >
            Instagram ({posts.length})
          </button>
        </div>
      </div>

      {isLoading && totalCount === 0 ? (
        <div className="loading">Loading approved content...</div>
      ) : (
        <div className="leads-list">
          {sortedItems.map((item) => (
            item.type === 'lead' ? renderLeadCard(item.data) : renderInstagramCard(item.data)
          ))}
        </div>
      )}

      {sortedItems.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
