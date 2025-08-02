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

// ⚙️ Konfiguracja MSAL dla CIAM z user flow
const msalConfig = {
  auth: {
    // Użyj zmiennej środowiskowej dla clientId, z domyślną wartością dla lokalnego dewelopmentu
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID || '2eae489a-6d95-4325-a489-c7e762c88a6a',
    
    // Użyj zmiennej środowiskowej dla authority
    authority: process.env.REACT_APP_MSAL_AUTHORITY || 'https://fa06aa37-1f0c-44ea-b4b0-2c97ea9bac8a.ciamlogin.com/fa06aa37-1f0c-44ea-b4b0-2c97ea9bac8a',
    
    // Użyj zmiennej środowiskowej dla knownAuthorities
    knownAuthorities: process.env.REACT_APP_MSAL_KNOWN_AUTHORITIES ? [process.env.REACT_APP_MSAL_KNOWN_AUTHORITIES] : ['kartkowka.ciamlogin.com'],
    
    // Użyj zmiennej środowiskowej dla redirectUri
    redirectUri: process.env.REACT_APP_MSAL_REDIRECT_URI || 'http://localhost:3000'
  },
  system: {
    loggerOptions: {
      loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
      ) => {
        if (!containsPii) {
          console.log(`[MSAL] ${message}`);
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose
    }
  }
};

const pca = new PublicClientApplication(msalConfig);

// 🛠️ Obsługa przekierowania po logowaniu
pca
  .handleRedirectPromise()
  .then(response => {
    if (response) {
      console.log('[MSAL] Login response:', response);
    }
  })
  .catch(error => {
    console.error('[MSAL] Redirect error:', error);
  });

// 👂 Listener zdarzeń MSAL (login success/failure)
pca.addEventCallback(event => {
  if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error('[MSAL] LOGIN FAILURE:', event.error);
  }
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log('[MSAL] LOGIN SUCCESS:', event.payload);
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MsalProvider instance={pca}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);


reportWebVitals();