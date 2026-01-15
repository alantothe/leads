export const queryKeys = {
  // Categories
  categories: ['categories'],
  category: (id) => ['categories', id],

  // Feeds
  feeds: ['feeds'],
  feed: (id) => ['feeds', id],
  feedsByCategory: (categoryId) => ['feeds', 'category', categoryId],

  // Tags
  tags: ['tags'],
  tag: (id) => ['tags', id],
  feedTags: (feedId) => ['tags', 'feeds', feedId],

  // Leads
  leads: ['leads'],
  lead: (id) => ['leads', id],
  leadsByFeed: (feedId) => ['leads', 'feed', feedId],
  leadsByTag: (tagName) => ['leads', 'tag', tagName],
  leadsByCategory: (categoryName) => ['leads', 'category', categoryName],
  leadsList: ({
    search = '',
    category = '',
    tag = '',
    feed_id = '',
    limit = '',
    sort = '',
    offset = '',
  } = {}) => [
    'leads',
    'list',
    search || '',
    category || '',
    tag || '',
    feed_id || '',
    limit ?? '',
    sort || '',
    offset ?? '',
  ],

  // Fetch Logs
  fetchLogs: ['fetchLogs'],
  fetchLog: (id) => ['fetchLogs', id],
  fetchLogsByFeed: (feedId) => ['fetchLogs', 'feed', feedId],
  fetchLogsList: ({ feed_id = '', status = '' } = {}) => [
    'fetchLogs',
    'list',
    feed_id || '',
    status || '',
  ],

  // Instagram
  instagramFeeds: ['instagramFeeds'],
  instagramFeed: (id) => ['instagramFeeds', id],
  instagramPosts: ['instagramPosts'],
  instagramPost: (id) => ['instagramPosts', id],
  instagramPostsList: ({
    search = '',
    category = '',
    tag = '',
    instagram_feed_id = '',
    limit = '',
    offset = '',
  } = {}) => [
    'instagramPosts',
    'list',
    search || '',
    category || '',
    tag || '',
    instagram_feed_id || '',
    limit ?? '',
    offset ?? '',
  ],

  // Subreddits
  subreddits: ['subreddits'],
  subreddit: (id) => ['subreddits', id],

  // El Comercio
  elComercioFeeds: ['elComercioFeeds'],
  elComercioFeed: (id) => ['elComercioFeeds', id],
  elComercioPosts: ['elComercioPosts'],
  elComercioPost: (id) => ['elComercioPosts', id],
  elComercioPostsList: ({
    search = '',
    el_comercio_feed_id = '',
    approval_status = '',
    limit = '',
    offset = '',
  } = {}) => [
    'elComercioPosts',
    'list',
    search || '',
    el_comercio_feed_id || '',
    approval_status || '',
    limit ?? '',
    offset ?? '',
  ],
  elComercioPostsInfinite: ({
    search = '',
    el_comercio_feed_id = '',
    approval_status = '',
    limit = '',
  } = {}) => [
    'elComercioPosts',
    'infinite',
    search || '',
    el_comercio_feed_id || '',
    approval_status || '',
    limit ?? '',
  ],

  // Diario Correo
  diarioCorreoFeeds: ['diarioCorreoFeeds'],
  diarioCorreoFeed: (id) => ['diarioCorreoFeeds', id],
  diarioCorreoPosts: ['diarioCorreoPosts'],
  diarioCorreoPost: (id) => ['diarioCorreoPosts', id],
  diarioCorreoPostsList: ({
    search = '',
    diario_correo_feed_id = '',
    approval_status = '',
    limit = '',
    offset = '',
  } = {}) => [
    'diarioCorreoPosts',
    'list',
    search || '',
    diario_correo_feed_id || '',
    approval_status || '',
    limit ?? '',
    offset ?? '',
  ],
  diarioCorreoPostsInfinite: ({
    search = '',
    diario_correo_feed_id = '',
    approval_status = '',
    limit = '',
  } = {}) => [
    'diarioCorreoPosts',
    'infinite',
    search || '',
    diario_correo_feed_id || '',
    approval_status || '',
    limit ?? '',
  ],

  // YouTube
  youtubeFeeds: ['youtubeFeeds'],
  youtubeFeed: (id) => ['youtubeFeeds', id],
  youtubePosts: ['youtubePosts'],
  youtubePost: (id) => ['youtubePosts', id],
  youtubePostsList: ({
    search = '',
    category = '',
    youtube_feed_id = '',
    limit = '',
    offset = '',
  } = {}) => [
    'youtubePosts',
    'list',
    search || '',
    category || '',
    youtube_feed_id || '',
    limit ?? '',
    offset ?? '',
  ],

  // Scrapes
  scrapes: ['scrapes'],
  scrapesList: ({
    search = '',
    content_type = '',
    approval_status = '',
    limit = '',
    offset = '',
  } = {}) => [
    'scrapes',
    'list',
    search || '',
    content_type || '',
    approval_status || '',
    limit ?? '',
    offset ?? '',
  ],
  scrapesInfinite: ({
    search = '',
    content_type = '',
    approval_status = '',
    limit = '',
  } = {}) => [
    'scrapes',
    'infinite',
    search || '',
    content_type || '',
    approval_status || '',
    limit ?? '',
  ],

  // Approval Queue
  approvalPending: (contentType = 'all') => ['approval', 'pending', contentType || 'all'],
  approvalStats: ['approval', 'stats'],

  // Translation
  translationStats: ['translation', 'stats'],

  // Dashboard
  dashboardStats: ['dashboard', 'stats'],
};
