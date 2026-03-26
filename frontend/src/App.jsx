import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CampaignPage from './pages/CampaignPage.jsx';
import ImportPage from './pages/ImportPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import ResumesPage from './pages/ResumesPage.jsx';
import SubmissionsPage from './pages/SubmissionsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import DiscoveryPage from './pages/DiscoveryPage.jsx';
import DemoScreen from './pages/DemoScreen.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

function App() {
  return (
    <Router>
      <>
        <ThemeToggle />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/campaign" element={<CampaignPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/resumes" element={<ResumesPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/discovery" element={<DiscoveryPage />} />
            <Route path="/archive" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/demo" element={<DemoScreen />} />
          </Route>
        </Routes>
      </>
    </Router>
  );
}

export default App;
