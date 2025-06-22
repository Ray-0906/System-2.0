import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ApolloProvider } from '@apollo/client';
import client from './utils/apollo.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ActiveMissions from './pages/Activemissions';
import MissionDetails from './pages/MissionDetails.jsx';
import AddMission from './pages/newMission.jsx';

// Define routes using `createBrowserRouter`
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App can be your layout or main wrapper
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/missions', element: <ActiveMissions /> },
      { path: '/add-mission', element: <AddMission /> },
      { path: '/missions/:id', element: <MissionDetails/> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ApolloProvider client={client}>
        <RouterProvider router={router} />
      </ApolloProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
