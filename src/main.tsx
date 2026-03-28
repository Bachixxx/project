import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;

// Always use createRoot — hydrateRoot causes silent blank pages on routes
// that Netlify's prerenderer hasn't seen (e.g. /payment-success).
// Netlify prerender is for SEO bots only; real users get the SPA.
createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
