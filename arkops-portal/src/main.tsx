import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/tokens.css';
import './styles/global.css';

/**
 * Application entry point.
 *
 * ErrorBoundary is placed above AppProviders to catch errors that occur
 * during provider initialization (AuthProvider, ThemeProvider, I18nProvider, etc.).
 *
 * Author: AI Optimization
 * Created: 2026-07-16 (refactored: ErrorBoundary above providers)
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>
);
