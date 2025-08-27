import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { UserProvider } from './context/userContext'; // camelCase

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* ClerkProvider must be outermost */}
    <ClerkProvider publishableKey={clerkPubKey}>
      <UserProvider> {/* UserProvider inside ClerkProvider */}
        <App />
      </UserProvider>
    </ClerkProvider>
  </React.StrictMode>
);
