import { useMemo, useState } from 'react';
import { instagramPostImageUrl } from '../api';
import {
  useCategories,
  useFeeds,
  useInstagramFeeds,
  useInstagramPostsList,
  useLeadsList,
} from '../hooks';

const DASHBOARD_FETCH_LIMIT = 1000;
const SUMMARY_SUFFIX_RE = /\s*The post\b[\s\S]*?\bfirst appeared on\b[\s\S]*$/i;

// Language code to full name mapping (ISO 639-1)
const LANGUAGE_NAMES = {
  'af': 'Afrikaans',
  'ar': 'Arabic',
  'bg': 'Bulgarian',
  'bn': 'Bengali',
  'ca': 'Catalan',
  'cs': 'Czech',
  'cy': 'Welsh',
  'da': 'Danish',
  'de': 'German',
  'el': 'Greek',
  'en': 'English',
  'eo': 'Esperanto',
  'es': 'Spanish',
  'et': 'Estonian',
  'fa': 'Persian',
  'fi': 'Finnish',
  'fr': 'French',
  'ga': 'Irish',
  'gu': 'Gujarati',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hr': 'Croatian',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'is': 'Icelandic',
  'it': 'Italian',
  'ja': 'Japanese',
  'kn': 'Kannada',
  'ko': 'Korean',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'mk': 'Macedonian',
  'ml': 'Malayalam',
  'mr': 'Marathi',
  'ne': 'Nepali',
  'nl': 'Dutch',
  'no': 'Norwegian',
  'pa': 'Punjabi',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'so': 'Somali',
  'sq': 'Albanian',
  'sv': 'Swedish',
  'sw': 'Swahili',
  'ta': 'Tamil',
  'te': 'Telugu',
  'th': 'Thai',
  'tl': 'Tagalog',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'vi': 'Vietnamese',
  'zh': 'Chinese'
};

function getLanguageName(code) {
  return LANGUAGE_NAMES[code] || code?.toUpperCase() || '';
}

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
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showTranslated, setShowTranslated] = useState(true);

  const {
    data: leads = [],
    isLoading: leadsLoading,
    isFetching: leadsFetching,
    error: leadsError,
  } = useLeadsList({
    limit: DASHBOARD_FETCH_LIMIT,
    category: categoryFilter,
    search: searchFilter,
  });

  const {
    data: posts = [],
    isLoading: postsLoading,
    isFetching: postsFetching,
    error: postsError,
  } = useInstagramPostsList({
    limit: DASHBOARD_FETCH_LIMIT,
    category: categoryFilter,
    search: searchFilter,
  });

  const {
    data: feeds = [],
    isLoading: feedsLoading,
    error: feedsError,
  } = useFeeds();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

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
  const feedCategoryIds = useMemo(
    () => new Map(feeds.map((feed) => [feed.id, feed.category_id])),
    [feeds],
  );
  const instagramFeedCategoryIds = useMemo(
    () => new Map(instagramFeeds.map((feed) => [feed.id, feed.category_id])),
    [instagramFeeds],
  );
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const combinedItems = useMemo(() => {
    const leadItems = leads.map((lead) => ({ type: 'lead', data: lead }));
    const instagramItems = posts.map((post) => ({ type: 'instagram', data: post }));
    return [...leadItems, ...instagramItems];
  }, [leads, posts]);

  const sortedItems = useMemo(() => {
    return [...combinedItems].sort((a, b) => {
      const aDate = a.type === 'lead'
        ? a.data.published || a.data.collected_at
        : a.data.posted_at || a.data.collected_at;
      const bDate = b.type === 'lead'
        ? b.data.published || b.data.collected_at
        : b.data.posted_at || b.data.collected_at;
      return getTimestamp(bDate) - getTimestamp(aDate);
    });
  }, [combinedItems]);

  const totalCount = combinedItems.length;
  const isLoading =
    leadsLoading || postsLoading || feedsLoading || instagramFeedsLoading || categoriesLoading;
  const isFetching = leadsFetching || postsFetching;
  const error = leadsError || postsError || feedsError || instagramFeedsError || categoriesError;

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
      ? getLanguageName(lead.detected_language)
      : null;

    const categoryName =
      categoryNames.get(feedCategoryIds.get(lead.feed_id)) || categoryFilter || 'Unknown';

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
          </h3>
        </div>

        <div className="lead-badges">
          <span className="badge">Article</span>
          <span className="badge">{categoryName}</span>
          <span className="badge">{feedNames.get(lead.feed_id) || 'Unknown Feed'}</span>
          {isTranslated && <span className="badge translation-badge">Translated</span>}
          {languageLabel && (
            <span className="badge language-badge" data-lang-code={lead.detected_language.toUpperCase()}>
              <span className="language-full">{languageLabel}</span>
              <span className="language-abbrev">{lead.detected_language.toUpperCase()}</span>
            </span>
          )}
        </div>

        <div className="lead-meta">
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
      ? getLanguageName(post.detected_language)
      : null;
    const mediaUrl = post.media_url || post.thumbnail_url;
    const showVideo = post.media_type === 'video' && post.media_url;
    const imageUrl = mediaUrl ? instagramPostImageUrl(post.id) : null;
    const posterUrl = post.thumbnail_url ? instagramPostImageUrl(post.id) : null;
    const usernameLabel = post.username ? `@${post.username}` : 'Instagram post';
    const categoryName =
      categoryNames.get(instagramFeedCategoryIds.get(post.instagram_feed_id))
      || categoryFilter
      || 'Unknown';

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
          </h3>
        </div>

        <div className="lead-badges">
          <span className="badge instagram">Instagram Post</span>
          <span className="badge">{categoryName}</span>
          <span className="badge">
            {instagramFeedNames.get(post.instagram_feed_id) || 'Unknown Feed'}
          </span>
          {isTranslated && <span className="badge translation-badge">Translated</span>}
          {languageLabel && (
            <span className="badge language-badge" data-lang-code={post.detected_language.toUpperCase()}>
              <span className="language-full">{languageLabel}</span>
              <span className="language-abbrev">{post.detected_language.toUpperCase()}</span>
            </span>
          )}
        </div>

        <div className="lead-meta">
          <span>
            {post.posted_at
              ? `Posted: ${formatDate(post.posted_at)}`
              : `Collected: ${formatDate(post.collected_at)}`}
          </span>
        </div>

        {imageUrl && (
          <div className="instagram-media">
            {showVideo ? (
              <video controls poster={posterUrl || undefined}>
                <source src={post.media_url} type="video/mp4" />
              </video>
            ) : (
              <img src={imageUrl} alt="Instagram post" loading="lazy" />
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

  const emptyMessage = categoryFilter || searchFilter
    ? 'No approved content matches your filters.'
    : 'No approved content yet. Review pending items in the approval queue.';

  return (
    <div className="page">
      {isFetching && !isLoading && <div className="badge">Refreshing...</div>}

      {error && <div className="error">{error.message}</div>}

      <div className="filters card">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search titles, summaries, captions, usernames..."
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              disabled={categoriesLoading}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
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
