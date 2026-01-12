import { Link, Outlet } from 'react-router-dom';

export default function Layout() {

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/" className="nav-brand-link">
            <h1>RSS Leads Manager</h1>
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/approval" className="nav-link-approval">Approval Queue</Link>
          <Link to="/subreddit-browser">Subreddit Browser</Link>
          <Link to="/leads">RSS Leads</Link>
          <Link to="/instagram-posts">IG Posts</Link>
          <Link to="/logs">Fetch Logs</Link>
        </div>
        <div className="nav-actions">
          <Link to="/settings" className="nav-link-icon" aria-label="Settings" title="Settings">
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M4.93 19.07l1.41-1.41" />
              <path d="M17.66 6.34l1.41-1.41" />
            </svg>
          </Link>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
