import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ImportPage from './pages/ImportPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import ResumesPage from './pages/ResumesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import DiscoveryPage from './pages/DiscoveryPage.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
