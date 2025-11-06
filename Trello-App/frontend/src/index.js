import React from 'react';
import ReactDOM from 'react-dom/client'; // Use createRoot for React 18
import App from './App'; // Import your App component

const root = ReactDOM.createRoot(document.getElementById('root'));
if (typeof process === "undefined") {
  window.process = { env: { NODE_ENV: "production" } };
}
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
