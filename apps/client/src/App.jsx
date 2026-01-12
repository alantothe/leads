import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Feeds from './pages/Feeds';
import InstagramFeeds from './pages/InstagramFeeds';
import Tags from './pages/Tags';
import Leads from './pages/Leads';
import InstagramPosts from './pages/InstagramPosts';
import Subreddits from './pages/Subreddits';
import SubredditBrowser from './pages/SubredditBrowser';
import FetchLogs from './pages/FetchLogs';
import ApprovalQueue from './pages/ApprovalQueue';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="approval" element={<ApprovalQueue />} />
          <Route path="categories" element={<Categories />} />
          <Route path="feeds" element={<Feeds />} />
          <Route path="instagram-feeds" element={<InstagramFeeds />} />
          <Route path="subreddits" element={<Subreddits />} />
          <Route path="subreddit-browser" element={<SubredditBrowser />} />
          <Route path="tags" element={<Tags />} />
          <Route path="leads" element={<Leads />} />
          <Route path="instagram-posts" element={<InstagramPosts />} />
          <Route path="logs" element={<FetchLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
