// Standalone, no-login entry point for the Business Plan generator.
// This is a SEPARATE page (built from /business-plan.html) so the main
// webapp (App.jsx / main.jsx / routing / auth flow) stays completely
// untouched.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import BusinessPlan from './pages/BusinessPlan';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <ErrorBoundary>
          <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <BusinessPlan />
          </div>
        </ErrorBoundary>
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
);
