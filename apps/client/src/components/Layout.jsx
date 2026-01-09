import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>RSS Leads Manager</h1>
        </div>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/feeds">RSS Feeds</Link>
          <Link to="/instagram-feeds">Instagram</Link>
          <Link to="/tags">Tags</Link>
          <Link to="/leads">RSS Leads</Link>
          <Link to="/instagram-posts">IG Posts</Link>
          <Link to="/logs">Fetch Logs</Link>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
