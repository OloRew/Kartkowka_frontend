import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  PublicClientApplication,
  EventType,
  LogLevel
} from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import './index.css';
import reportWebVitals from './reportWebVitals';

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID || '',
    authority: process.env.REACT_APP_MSAL_AUTHORITY || '',
    redirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || '',
    knownAuthorities: ['KartkowkaApp.ciamlogin.com']
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string) => {
        console.log(`[MSAL] ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose
    }
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL before rendering the app
msalInstance.initialize()
  .then(() => {
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );

    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  })
  .catch(error => {
    console.error('MSAL Initialization failed:', error);
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    root.render(
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="mb-4">Failed to initialize authentication system.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  });

reportWebVitals();