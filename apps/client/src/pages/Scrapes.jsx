import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteScrapes } from '../hooks';

const PAGE_SIZE = 30;

const CONTENT_TYPE_LABELS = {
  el_comercio_post: 'El Comercio',
  diario_correo_post: 'Diario Correo',
};

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

export default function Scrapes() {
  const loadMoreRef = useRef(null);

  const filters = {
    approval_status: 'approved',
  };

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteScrapes(filters, PAGE_SIZE);

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages?.[0]?.total_count ?? 0;
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const node = loadMoreRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Scrapes</h1>
          <p className="page-subtitle">
            Approved scrapes across Peru sources.
          </p>
        </div>
        <div className="page-actions">
          <Link className="button primary" to="/scrapes/manage">
            Manage Scrapes
          </Link>
        </div>
        <div className="lead-count">
          {items.length} of {totalCount} approved
        </div>
      </div>

      {isRefreshing && <div className="badge">Refreshing...</div>}
      {error && <div className="error">{error.message}</div>}

      {isLoading ? (
        <div className="loading">Loading approved scrapes...</div>
      ) : (
        <div className="leads-list">
          {items.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p>No approved scrapes yet. Approve items to show them here.</p>
            </div>
          ) : (
            items.map((item) => {
              const label = CONTENT_TYPE_LABELS[item.content_type] || item.content_type;
              const sourceName = item.source_name || 'Unknown';
              const isTranslated = item.translation_status === 'translated';

              return (
                <div key={`${item.content_type}-${item.content_id}`} className="lead-card">
                  <div className="lead-header">
                    <div>
                      <h3>
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            {item.title || 'Untitled'}
                          </a>
                        ) : (
                          item.title || 'Untitled'
                        )}
                        {isTranslated && <span className="badge translation-badge">Translated</span>}
                        {item.detected_language && (
                          <span className="badge language-badge">
                            {item.detected_language}
                          </span>
                        )}
                        <span className="badge success">approved</span>
                      </h3>
                      <div className="lead-meta">
                        <span className="badge">{label}</span>
                        <span className="badge secondary">{sourceName}</span>
                        <span>Collected: {formatDate(item.collected_at)}</span>
                      </div>
                    </div>
                  </div>

                  {item.image_url && (
                    <div className="lead-image">
                      <img src={item.image_url} alt={item.title || 'Scraped item'} />
                    </div>
                  )}

                  {item.summary && <p className="lead-summary">{item.summary}</p>}

                  <div className="lead-footer">
                    <small>Source: {sourceName}</small>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {hasNextPage && (
        <div className="load-more" ref={loadMoreRef}>
          <button
            className="button secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
