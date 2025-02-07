import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { auth } from './lib/firebase';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Check Firebase initialization
console.log('Checking Firebase initialization...');
if (!auth) {
  console.error('Firebase auth not initialized');
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Error Loading App</h1>
      <p>Firebase authentication failed to initialize. Please check your configuration.</p>
    </div>
  `;
  throw new Error('Firebase auth not initialized');
}
console.log('Firebase initialized successfully');

const root = createRoot(rootElement);

// Add error boundary
try {
  console.log('Mounting React app...');
  root.render(
    <StrictMode>
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <App />
      </div>
    </StrictMode>
  );
  console.log('React app mounted successfully');
} catch (error) {
  console.error('Error mounting React app:', error);
  // Show error in the UI
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Error Loading App</h1>
      <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  `;
}