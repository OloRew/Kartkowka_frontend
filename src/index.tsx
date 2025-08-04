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
    //local   
    //clientId:'2eae489a-6d95-4325-a489-c7e762c88a6a',
    //authority:'https://fa06aa37-1f0c-44ea-b4b0-2c97ea9bac8a.ciamlogin.com/fa06aa37-1f0c-44ea-b4b0-2c97ea9bac8a',
    //redirectUri: 'http://localhost:3000'
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID || '',
    authority: process.env.REACT_APP_MSAL_AUTHORITY || '',
    redirectUri: process.env.NODE_ENV === 'development'? 'http://localhost:3000': (process.env.REACT_APP_MSAL_REDIRECT_URI || '')
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
//koniec