import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// On desktop the phone frame (#root) is the scroll container, not the window.
// Redirect window.scrollTo so that navigateTo()'s smooth-scroll-to-top works
// inside the frame rather than trying to scroll the static browser viewport.
const _origScrollTo = window.scrollTo.bind(window);
(window as any).scrollTo = (...args: Parameters<typeof window.scrollTo>) => {
  const frame = document.getElementById('root');
  if (frame && window.innerWidth >= 540) {
    frame.scrollTo(...args);
  } else {
    _origScrollTo(...args);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
