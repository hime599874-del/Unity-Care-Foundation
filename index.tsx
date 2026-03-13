import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  // Global guard against circular structure errors that can crash the app
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('circular structure to JSON')) {
      console.warn('Prevented crash from circular structure error:', event.error);
      event.preventDefault();
    }
  });

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}