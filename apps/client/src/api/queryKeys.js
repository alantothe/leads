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
  leadsList: ({ search = '', category = '', tag = '', feed_id = '' } = {}) => [
    'leads',
    'list',
    search || '',
    category || '',
    tag || '',
    feed_id || '',
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
  instagramPostsList: ({ search = '', category = '', tag = '', instagram_feed_id = '' } = {}) => [
    'instagramPosts',
    'list',
    search || '',
    category || '',
    tag || '',
    instagram_feed_id || '',
  ],

  // Subreddits
  subreddits: ['subreddits'],
  subreddit: (id) => ['subreddits', id],

  // Approval Queue
  approvalPending: (contentType = 'all') => ['approval', 'pending', contentType || 'all'],
  approvalStats: ['approval', 'stats'],

  // Translation
  translationStats: ['translation', 'stats'],

  // Dashboard
  dashboardStats: ['dashboard', 'stats'],
};
