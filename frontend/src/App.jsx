import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import MyProjects from './pages/MyProjects';
import MyProject from './pages/MyProject';
import ProjectForm from './pages/ProjectForm';
import IdeaSubmission from './pages/IdeaSubmission';
import PendingApproval from './pages/PendingApproval';
import IdeaDetail from './pages/IdeaDetail';
import ApprovedProjects from './pages/ApprovedProjects';
import FundingSchemes from './pages/FundingSchemes';
import Alerts from './pages/Alerts';
import AllProjects from './pages/AllProjects';
import Settings from './pages/Settings';
import ReportExport from './pages/ReportExport';
import MoreFeatures from './pages/MoreFeatures';
import BusinessPlan from './pages/BusinessPlan';
import CommercializationQuestionnaire from './pages/CommercializationQuestionnaire';

const ROUTE_MAP = {
  'dashboard': '/dashboard',
  'all-projects': '/all-projects',
  'my-projects': '/my-projects',
  'my-project': '/my-project',
  'idea-submission': '/idea-submission',
  'pending-approval': '/pending-approval',
  'approved-projects': '/approved-projects',
  'funding-schemes': '/funding-schemes',
  'alerts': '/alerts',
  'settings': '/settings',
  'report-export': '/report-export',
  'more-features': '/more-features',
  'business-plan': '/more-features/business-plan',
  'commercialization': '/more-features/commercialization',
};

// ProjectFormWrapper to handle edit state
function ProjectFormWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const editProject = location.state?.project || null;

  return (
    <ProjectForm
      editProject={editProject}
      onBack={() => navigate('/my-projects')}
    />
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isGuest, isProjectUser, isSuperAdmin } = useAuth();
  const [sidebarKey, setSidebarKey] = useState('dashboard');

  // Sync sidebar active state with URL
  useEffect(() => {
    const path = location.pathname;
    const entry = Object.entries(ROUTE_MAP).find(([, route]) => route === path);
    if (entry) {
      setSidebarKey(entry[0]);
    } else if (path === '/' || path.startsWith('/dashboard')) {
      setSidebarKey('dashboard');
    } else if (path.startsWith('/project-form')) {
      setSidebarKey('my-projects');
    }
  }, [location.pathname]);

  const handleSidebarNavigate = useCallback((key, data) => {
    if (key === 'project-form') {
      navigate('/project-form/edit', { state: { project: data } });
      return;
    }
    const route = ROUTE_MAP[key];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Guest users: redirect to /all-projects if they try to access restricted pages
  if (isGuest) {
    const guestRoutes = ['/all-projects', '/funding-schemes', '/idea-submission'];
    const allowedGuestRoute =
      guestRoutes.includes(location.pathname) || location.pathname.startsWith('/more-features');
    if (!allowedGuestRoute) {
      return <Navigate to="/all-projects" replace />;
    }
  }

  // Project users: only allow access to their own project page + More Features tools
  if (isProjectUser) {
    const allowedProjectUserRoutes =
      location.pathname === '/my-project' || location.pathname.startsWith('/more-features');
    if (!allowedProjectUserRoutes) {
      return <Navigate to="/my-project" replace />;
    }
  }

  // Admin (non-superadmin): block access to superadmin-only pages
  if (isAuthenticated && !isSuperAdmin) {
    const superAdminOnlyPrefixes = ['/settings', '/report-export'];
    const isSuperAdminOnlyRoute =
      superAdminOnlyPrefixes.includes(location.pathname) ||
      location.pathname.startsWith('/project-form');
    if (isSuperAdminOnlyRoute) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={sidebarKey}
        onNavigate={handleSidebarNavigate}
      />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-projects" element={<MyProjects onNavigate={handleSidebarNavigate} />} />
          <Route path="/my-projects/:id" element={<MyProjects onNavigate={handleSidebarNavigate} />} />
          <Route path="/my-project" element={<MyProject />} />
          <Route path="/project-form/:mode" element={<ProjectFormWrapper />} />
          <Route path="/idea-submission" element={<IdeaSubmission onBack={() => navigate('/dashboard')} />} />
          <Route path="/pending-approval" element={<PendingApproval onNavigate={handleSidebarNavigate} />} />
          <Route path="/idea-detail/:id" element={<IdeaDetail />} />
          <Route path="/approved-projects" element={<ApprovedProjects />} />
          <Route path="/funding-schemes" element={<FundingSchemes />} />
          <Route path="/all-projects" element={<AllProjects onNavigate={handleSidebarNavigate} />} />
          <Route path="/alerts" element={<Alerts onNavigate={handleSidebarNavigate} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/report-export" element={<ReportExport />} />
          <Route path="/more-features" element={<MoreFeatures />} />
          <Route path="/more-features/business-plan" element={<BusinessPlan />} />
          <Route path="/more-features/commercialization" element={<CommercializationQuestionnaire />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}