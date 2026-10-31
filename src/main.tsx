import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TelePulseProvider } from './state/TelePulseContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TelePulseProvider>
        <App />
      </TelePulseProvider>
    </BrowserRouter>
  </React.StrictMode>
);

