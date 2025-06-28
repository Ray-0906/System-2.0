import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ApolloProvider } from '@apollo/client';
import client from './utils/apollo.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import OAuthSuccess from './components/OathSuccess.jsx';
import HomePage from './pages/Home.jsx';


// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ActiveMissions = lazy(() => import('./pages/Activemissions'));
const MissionDetails = lazy(() => import('./pages/MissionDetails.jsx'));
const AddMission = lazy(() => import('./pages/newMission.jsx'));
const Inventory = lazy(() => import('./pages/Ineventory.jsx'));
const SkillPage = lazy(() => import('./pages/Skills.jsx'));
const AddCustomMission = lazy(() => import('./pages/addCustomMission.jsx'));
const DemoDash = lazy(() => import('./pages/DemoDash.jsx'));
const AscensionTrial = lazy(() => import('./pages/Ascension.jsx'));

// Define routes using `createBrowserRouter`
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/', element: <HomePage /> },
      { path: '/signup', element: <Signup /> },
      { path: '/dashboard', element:<Dashboard /> },
      { path: '/demo', element: <DemoDash /> },
      { path: '/oauth-success', element: <OAuthSuccess /> },
      { path: '/report', element: <AscensionTrial /> },
      { path: '/skills', element: <SkillPage /> },
      { path: '/inventory', element: <Inventory /> },
      { path: '/missions', element: <ActiveMissions /> },
      { path: '/add-mission', element: <AddMission /> },
      { path: '/add-custom', element: <AddCustomMission /> },
      { path: '/missions/:id', element: <MissionDetails /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ApolloProvider client={client}>
        <Suspense fallback={<div className="text-white text-center mt-10">Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </ApolloProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
