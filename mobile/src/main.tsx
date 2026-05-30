import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './store.tsx';
import './index.css';

// On desktop the scrollable element is #scroll-content (the flex-1 content area),
// not the window. Redirect window.scrollTo so navigation's scroll-to-top works.
const _origScrollTo = window.scrollTo.bind(window);
(window as any).scrollTo = (...args: Parameters<typeof window.scrollTo>) => {
  if (window.innerWidth >= 540) {
    const content = document.getElementById('scroll-content');
    if (content) { content.scrollTo(...args); return; }
  }
  _origScrollTo(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
