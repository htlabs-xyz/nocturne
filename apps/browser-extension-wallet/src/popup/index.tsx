import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './error-boundary';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
