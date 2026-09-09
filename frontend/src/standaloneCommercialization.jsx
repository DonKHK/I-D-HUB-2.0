// Standalone, no-login entry point for the Commercialization Plan
// questionnaire. This is a SEPARATE page (built from
// /commercialization.html) so the main webapp (App.jsx / main.jsx /
// routing / auth flow) stays completely untouched.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import CommercializationQuestionnaire from './pages/CommercializationQuestionnaire';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <ErrorBoundary>
          <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <CommercializationQuestionnaire />
          </div>
        </ErrorBoundary>
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
);
