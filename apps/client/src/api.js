const API_BASE = 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Categories API
export const categoriesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/categories${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/categories/${id}`),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// Feeds API
export const feedsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/feeds${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/feeds/${id}`),
  getByCategory: (categoryId) => request(`/feeds/category/${categoryId}`),
  create: (data) => request('/feeds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/feeds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  activate: (id) => request(`/feeds/${id}/activate`, { method: 'PATCH' }),
  deactivate: (id) => request(`/feeds/${id}/deactivate`, { method: 'PATCH' }),
  delete: (id) => request(`/feeds/${id}`, { method: 'DELETE' }),
  fetch: (id) => request(`/feeds/${id}/fetch`, { method: 'POST' }),
  fetchAll: () => request('/feeds/fetch-all', { method: 'POST' }),
};

// Tags API
export const tagsApi = {
  getAll: () => request('/tags'),
  getById: (id) => request(`/tags/${id}`),
  create: (data) => request('/tags', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/tags/${id}`, { method: 'DELETE' }),
  getFeedTags: (feedId) => request(`/tags/feeds/${feedId}/tags`),
  addToFeed: (feedId, tagId) => request(`/tags/feeds/${feedId}/tags/${tagId}`, { method: 'POST' }),
  removeFromFeed: (feedId, tagId) => request(`/tags/feeds/${feedId}/tags/${tagId}`, { method: 'DELETE' }),
  updateFeedTags: (feedId, tags) => request(`/tags/feeds/${feedId}/tags`, { method: 'PUT', body: JSON.stringify({ tags }) }),
};

// Leads API
export const leadsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leads${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/leads/${id}`),
  getByFeed: (feedId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leads/feed/${feedId}${query ? `?${query}` : ''}`);
  },
  getByTag: (tagName, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leads/tag/${tagName}${query ? `?${query}` : ''}`);
  },
  getByCategory: (categoryName, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leads/category/${categoryName}${query ? `?${query}` : ''}`);
  },
  create: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
};

// Fetch Logs API
export const fetchLogsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/logs${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/logs/${id}`),
  getByFeed: (feedId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/logs/feed/${feedId}${query ? `?${query}` : ''}`);
  },
  delete: (id) => request(`/logs/${id}`, { method: 'DELETE' }),
};

// Development API
export const devApi = {
  clearAll: () => request('/dev/clear-all', { method: 'DELETE' }),
  clearFetched: () => request('/dev/clear-fetched', { method: 'DELETE' }),
};

// Instagram Feeds API
export const instagramFeedsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/instagram-feeds${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/instagram-feeds/${id}`),
  create: (data) => request('/instagram-feeds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/instagram-feeds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  activate: (id) => request(`/instagram-feeds/${id}/activate`, { method: 'PATCH' }),
  deactivate: (id) => request(`/instagram-feeds/${id}/deactivate`, { method: 'PATCH' }),
  delete: (id) => request(`/instagram-feeds/${id}`, { method: 'DELETE' }),
  fetch: (id) => request(`/instagram-feeds/${id}/fetch`, { method: 'POST' }),
  fetchAll: () => request('/instagram-feeds/fetch-all', { method: 'POST' }),
};

// Instagram Posts API
export const instagramPostsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/instagram-feeds/posts${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/instagram-feeds/posts/${id}`),
  delete: (id) => request(`/instagram-feeds/posts/${id}`, { method: 'DELETE' }),
};
