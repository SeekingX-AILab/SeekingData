import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import {
  SingleProcessor,
  BatchProcessor,
  FormatConverter,
  CotGenerator,
  ImageDatasetGenerator,
  VideoDatasetGenerator,
  DatasetShare,
} from './components/sft';
import {
  GitHubTaskGenerator,
  VisualTaskBuilder,
  TaskManager,
} from './components/harbor';

/**
 * Root application component.
 *
 * Uses nested routes so that Layout's <Outlet />
 * renders the matched child route.
 */
export function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/settings"
            element={<Settings />}
          />

          {/* SFT data generation */}
          <Route
            path="/sft/single"
            element={<SingleProcessor />}
          />
          <Route
            path="/sft/batch"
            element={<BatchProcessor />}
          />
          <Route
            path="/sft/convert"
            element={<FormatConverter />}
          />
          <Route
            path="/sft/cot"
            element={<CotGenerator />}
          />
          <Route
            path="/sft/image"
            element={<ImageDatasetGenerator />}
          />
          <Route
            path="/sft/video"
            element={<VideoDatasetGenerator />}
          />
          <Route
            path="/sft/share"
            element={<DatasetShare />}
          />

          {/* Harbor tasks */}
          <Route
            path="/harbor/github"
            element={<GitHubTaskGenerator />}
          />
          <Route
            path="/harbor/builder"
            element={<VisualTaskBuilder />}
          />
          <Route
            path="/harbor/tasks"
            element={<TaskManager />}
          />
        </Route>
      </Routes>
    </Router>
  );
}
