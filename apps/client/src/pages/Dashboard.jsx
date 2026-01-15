import { useEffect, useMemo, useRef, useState } from 'react';
import { instagramPostImageUrl, youtubePostsApi } from '../api';
import {
  useCategories,
  useFeeds,
  useInstagramFeeds,
  useInstagramPostsList,
  useLeadsList,
  useDiarioCorreoFeeds,
  useDiarioCorreoPostsList,
  useElComercioFeeds,
  useInfiniteElComercioPostsList,
  useYouTubeFeeds,
  useYouTubePostsList,
  useExtractYouTubeTranscript,
} from '../hooks';

const DASHBOARD_FETCH_LIMIT = 1000;
const EL_COMERCIO_PAGE_SIZE = 30;
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
  const [transcriptStates, setTranscriptStates] = useState({});

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
    data: youtubePosts = [],
    isLoading: youtubePostsLoading,
    isFetching: youtubePostsFetching,
    error: youtubePostsError,
  } = useYouTubePostsList({
    limit: DASHBOARD_FETCH_LIMIT,
    category: categoryFilter,
    search: searchFilter,
  });
  const extractTranscript = useExtractYouTubeTranscript();

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

  const {
    data: elComercioPostsData,
    isLoading: elComercioPostsLoading,
    isFetching: elComercioPostsFetching,
    isFetchingNextPage: elComercioPostsFetchingNextPage,
    fetchNextPage: fetchNextElComercioPosts,
    hasNextPage: hasMoreElComercioPosts,
    error: elComercioPostsError,
  } = useInfiniteElComercioPostsList(
    {
      approval_status: 'approved',
      search: searchFilter,
    },
    EL_COMERCIO_PAGE_SIZE
  );

  const elComercioPosts = elComercioPostsData?.pages.flat() ?? [];

  const {
    data: diarioCorreoPosts = [],
    isLoading: diarioCorreoPostsLoading,
    isFetching: diarioCorreoPostsFetching,
    error: diarioCorreoPostsError,
  } = useDiarioCorreoPostsList({
    approval_status: 'approved',
    search: searchFilter,
    limit: DASHBOARD_FETCH_LIMIT,
  });

  const {
    data: elComercioFeeds = [],
    isLoading: elComercioFeedsLoading,
    error: elComercioFeedsError,
  } = useElComercioFeeds();

  const {
    data: diarioCorreoFeeds = [],
    isLoading: diarioCorreoFeedsLoading,
    error: diarioCorreoFeedsError,
  } = useDiarioCorreoFeeds();

  const {
    data: youtubeFeeds = [],
    isLoading: youtubeFeedsLoading,
    error: youtubeFeedsError,
  } = useYouTubeFeeds();

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
  const elComercioFeedNames = useMemo(
    () => new Map(elComercioFeeds.map((feed) => [feed.id, feed.display_name])),
    [elComercioFeeds],
  );
  const elComercioFeedCategoryIds = useMemo(
    () => new Map(elComercioFeeds.map((feed) => [feed.id, feed.category_id])),
    [elComercioFeeds],
  );
  const diarioCorreoFeedNames = useMemo(
    () => new Map(diarioCorreoFeeds.map((feed) => [feed.id, feed.display_name])),
    [diarioCorreoFeeds],
  );
  const diarioCorreoFeedCategoryIds = useMemo(
    () => new Map(diarioCorreoFeeds.map((feed) => [feed.id, feed.category_id])),
    [diarioCorreoFeeds],
  );
  const youtubeFeedNames = useMemo(
    () => new Map(youtubeFeeds.map((feed) => [feed.id, feed.display_name])),
    [youtubeFeeds],
  );
  const youtubeFeedCategoryIds = useMemo(
    () => new Map(youtubeFeeds.map((feed) => [feed.id, feed.category_id])),
    [youtubeFeeds],
  );
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const combinedItems = useMemo(() => {
    const leadItems = leads.map((lead) => ({ type: 'lead', data: lead }));
    const instagramItems = posts.map((post) => ({ type: 'instagram', data: post }));
    const elComercioItems = elComercioPosts.map((post) => ({ type: 'el_comercio', data: post }));
    const diarioCorreoItems = diarioCorreoPosts.map((post) => ({ type: 'diario_correo', data: post }));
    const youtubeItems = youtubePosts.map((post) => ({ type: 'youtube', data: post }));
    return [
      ...leadItems,
      ...instagramItems,
      ...elComercioItems,
      ...diarioCorreoItems,
      ...youtubeItems,
    ];
  }, [leads, posts, elComercioPosts, diarioCorreoPosts, youtubePosts]);

  const sortedItems = useMemo(() => {
    return [...combinedItems].sort((a, b) => {
      const aDate = a.type === 'lead' || a.type === 'el_comercio' || a.type === 'diario_correo' || a.type === 'youtube'
        ? a.data.published || a.data.published_at || a.data.collected_at
        : a.data.posted_at || a.data.collected_at;
      const bDate = b.type === 'lead' || b.type === 'el_comercio' || b.type === 'diario_correo' || b.type === 'youtube'
        ? b.data.published || b.data.published_at || b.data.collected_at
        : b.data.posted_at || b.data.collected_at;
      return getTimestamp(bDate) - getTimestamp(aDate);
    });
  }, [combinedItems]);

  const totalCount = combinedItems.length;
  const isLoading =
    leadsLoading || postsLoading || feedsLoading || instagramFeedsLoading || categoriesLoading ||
    elComercioPostsLoading || elComercioFeedsLoading ||
    diarioCorreoPostsLoading || diarioCorreoFeedsLoading ||
    youtubePostsLoading || youtubeFeedsLoading;
  const isFetching = leadsFetching || postsFetching ||
    diarioCorreoPostsFetching || youtubePostsFetching ||
    (elComercioPostsFetching && !elComercioPostsFetchingNextPage);
  const error = leadsError || postsError || feedsError || instagramFeedsError || categoriesError ||
    elComercioPostsError || elComercioFeedsError ||
    diarioCorreoPostsError || diarioCorreoFeedsError ||
    youtubePostsError || youtubeFeedsError;
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!hasMoreElComercioPosts || elComercioPostsFetchingNextPage) return;
    const node = loadMoreRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          fetchNextElComercioPosts();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextElComercioPosts, hasMoreElComercioPosts, elComercioPostsFetchingNextPage]);

  async function handleExtractTranscript(postId) {
    setTranscriptStates((prev) => ({ ...prev, [postId]: { loading: true } }));
    try {
      const result = await extractTranscript.mutateAsync(postId);
      setTranscriptStates((prev) => ({
        ...prev,
        [postId]: {
          loading: false,
          status: result.transcript_status,
          error: result.transcript_error,
          hasTranscript: !!result.transcript,
        },
      }));
    } catch (err) {
      setTranscriptStates((prev) => ({
        ...prev,
        [postId]: { loading: false, error: err.message },
      }));
    }
  }

  function handleDownloadTranscript(postId) {
    window.open(youtubePostsApi.downloadTranscriptUrl(postId), '_blank');
  }

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

  function renderElComercioCard(post) {
    const displayTitle = showTranslated && post.title_translated
      ? post.title_translated
      : post.title;

    const displayExcerpt = showTranslated && post.excerpt_translated
      ? post.excerpt_translated
      : post.excerpt;

    const isTranslated = post.translation_status === 'translated';
    const languageLabel = post.detected_language && post.detected_language !== 'en'
      ? getLanguageName(post.detected_language)
      : null;

    const categoryName =
      categoryNames.get(elComercioFeedCategoryIds.get(post.el_comercio_feed_id))
      || categoryFilter
      || 'Unknown';

    return (
      <div key={`el_comercio-${post.id}`} className="lead-card">
        {post.image_url && (
          <div className="lead-image">
            <img src={post.image_url} alt={displayTitle} loading="lazy" />
          </div>
        )}
        <div className="lead-header">
          <h3>
            {post.url ? (
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                {displayTitle}
              </a>
            ) : (
              displayTitle
            )}
          </h3>
        </div>

        <div className="lead-badges">
          <span className="badge">El Comercio</span>
          <span className="badge">{categoryName}</span>
          <span className="badge">{elComercioFeedNames.get(post.el_comercio_feed_id) || 'Unknown Feed'}</span>
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
            {post.published_at
              ? `Published: ${formatDate(post.published_at)}`
              : `Collected: ${formatDate(post.collected_at)}`}
          </span>
        </div>
        {displayExcerpt && <p className="lead-summary">{displayExcerpt}</p>}
        <div className="lead-footer">
          <small>Collected: {formatDate(post.collected_at, true)}</small>
          {!showTranslated && post.title_translated && (
            <small className="translation-hint">English translation available</small>
          )}
        </div>
      </div>
    );
  }

  function renderDiarioCorreoCard(post) {
    const displayTitle = showTranslated && post.title_translated
      ? post.title_translated
      : post.title;

    const displayExcerpt = showTranslated && post.excerpt_translated
      ? post.excerpt_translated
      : post.excerpt;

    const isTranslated = post.translation_status === 'translated';
    const languageLabel = post.detected_language && post.detected_language !== 'en'
      ? getLanguageName(post.detected_language)
      : null;

    const categoryName =
      categoryNames.get(diarioCorreoFeedCategoryIds.get(post.diario_correo_feed_id))
      || categoryFilter
      || 'Unknown';

    return (
      <div key={`diario_correo-${post.id}`} className="lead-card">
        {post.image_url && (
          <div className="lead-image">
            <img src={post.image_url} alt={displayTitle} loading="lazy" />
          </div>
        )}
        <div className="lead-header">
          <h3>
            {post.url ? (
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                {displayTitle}
              </a>
            ) : (
              displayTitle
            )}
          </h3>
        </div>

        <div className="lead-badges">
          <span className="badge">Diario Correo</span>
          <span className="badge">{categoryName}</span>
          <span className="badge">
            {diarioCorreoFeedNames.get(post.diario_correo_feed_id) || 'Unknown Feed'}
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
            {post.published_at
              ? `Published: ${formatDate(post.published_at)}`
              : `Collected: ${formatDate(post.collected_at)}`}
          </span>
        </div>
        {displayExcerpt && <p className="lead-summary">{displayExcerpt}</p>}
        <div className="lead-footer">
          <small>Collected: {formatDate(post.collected_at, true)}</small>
          {!showTranslated && post.title_translated && (
            <small className="translation-hint">English translation available</small>
          )}
        </div>
      </div>
    );
  }

  function renderYouTubeCard(post) {
    const categoryName =
      categoryNames.get(youtubeFeedCategoryIds.get(post.youtube_feed_id))
      || categoryFilter
      || 'Unknown';
    const channelLabel =
      youtubeFeedNames.get(post.youtube_feed_id) || post.channel_title || 'Unknown Channel';

    return (
      <div key={`youtube-${post.id}`} className="lead-card">
        {post.thumbnail_url && (
          <div className="lead-image">
            <img src={post.thumbnail_url} alt={post.title} loading="lazy" />
          </div>
        )}
        <div className="lead-header">
          <h3>
            {post.video_url ? (
              <a href={post.video_url} target="_blank" rel="noopener noreferrer">
                {post.title}
              </a>
            ) : (
              post.title
            )}
          </h3>
        </div>

        <div className="lead-badges">
          <span className="badge">YouTube</span>
          <span className="badge">{categoryName}</span>
          <span className="badge">{channelLabel}</span>
        </div>

        <div className="lead-meta">
          <span>
            {post.published_at
              ? `Published: ${formatDate(post.published_at)}`
              : `Collected: ${formatDate(post.collected_at)}`}
          </span>
        </div>

        {post.description && <p className="lead-summary">{post.description}</p>}

        <div className="lead-footer">
          <small>Collected: {formatDate(post.collected_at, true)}</small>
        </div>

        <div className="transcript-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(() => {
            const state = transcriptStates[post.id];
            const hasExistingTranscript = post.transcript_status === 'completed';
            const isUnavailable = post.transcript_status === 'unavailable' || state?.status === 'unavailable';

            if (state?.loading) {
              return <span className="badge">Extracting transcript...</span>;
            }

            if (hasExistingTranscript || state?.hasTranscript) {
                      return (
                        <button
                          className="button"
                          onClick={() => handleDownloadTranscript(post.id)}
                        >
                          Download CSV
                        </button>
                      );
                    }

            if (isUnavailable) {
              return <span className="badge" style={{ background: '#888' }}>No transcript available</span>;
            }

            if (state?.error && state?.status === 'failed') {
              return (
                <>
                  <span className="badge" style={{ background: '#c00' }}>Failed</span>
                  <button
                    className="button secondary"
                    onClick={() => handleExtractTranscript(post.id)}
                  >
                    Retry
                  </button>
                </>
              );
            }

            return (
              <button
                className="button secondary"
                onClick={() => handleExtractTranscript(post.id)}
              >
                Get Transcript
              </button>
            );
          })()}
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
          {sortedItems.map((item) => {
            if (item.type === 'lead') return renderLeadCard(item.data);
            if (item.type === 'instagram') return renderInstagramCard(item.data);
            if (item.type === 'el_comercio') return renderElComercioCard(item.data);
            if (item.type === 'diario_correo') return renderDiarioCorreoCard(item.data);
            if (item.type === 'youtube') return renderYouTubeCard(item.data);
            return null;
          })}
        </div>
      )}

      {hasMoreElComercioPosts && (
        <div className="load-more" ref={loadMoreRef}>
          <button
            className="button secondary"
            onClick={() => fetchNextElComercioPosts()}
            disabled={elComercioPostsFetchingNextPage}
          >
            {elComercioPostsFetchingNextPage ? 'Loading more...' : 'Load more El Comercio articles'}
          </button>
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
