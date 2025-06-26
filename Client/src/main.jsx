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

import Ineventory from './pages/Ineventory.jsx';
import SkillPage from './pages/Skills.jsx';
import AddCustomMission from './pages/addCustomMission.jsx';
import DemoDash from './pages/DemoDash.jsx';
import AscensionTrial from './pages/Ascension.jsx';
import AuthLayout from './components/AuthLayout.jsx';

// Define routes using `createBrowserRouter`
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App can be your layout or main wrapper
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/dashboard', element: <Dashboard />},
      { path: '/demo', element: <DemoDash /> },
      { path: '/report', element: <AscensionTrial /> },
      { path: '/skills', element: <SkillPage /> },
      { path: '/inventory', element: <Ineventory /> },
      { path: '/missions', element: <ActiveMissions /> },
      { path: '/add-mission', element: <AddMission /> },
      { path: '/add-custom', element: <AddCustomMission /> },
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
