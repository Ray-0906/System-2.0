import { Outlet } from 'react-router-dom';
import { useLoadUser } from './utils/userLoader';
import { useEffect } from 'react';
import { Menu} from 'lucide-react';
import Sidebar from './components/sidebar';
import NotificationPopup from './utils/Notification';
// import Sidebar from '../components/sidebar';
import './App.css'

export default function App() {
   const { loading, error } = useLoadUser();
  
    useEffect(() => {
      if (loading) {
        console.log('Loading user data...');
      } else if (error) {
        console.error('Error loading user data:', error);
      } else {
        console.log('User data loaded successfully');
      }
    }, [loading, error]);
  return (
    <>
       <div className="relative min-h-screen bg-gradient-to-r from-black via-gray-900 to-black text-white font-sans">
          <Sidebar  />
         
       <main>
        
     <NotificationPopup />

        <main>
        <Outlet />
        </main>
       
      
        </main>
      </div>
    </>
  );
}
