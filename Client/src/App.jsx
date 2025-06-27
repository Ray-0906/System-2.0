// App.jsx
import { Outlet } from "react-router-dom";

import Sidebar from "./components/sidebar";
import NotificationPopup from "./utils/Notification";
import "./App.css";
import { useLoadUser } from "./utils/userLoader";
import SoloLoading from "./components/Loading";

export default function App() {
  const { loading, error } = useLoadUser();

  if (loading) {
    return (
      <SoloLoading/>
    );
  }

  // if (error) {
  //   return (
  //     <div className="h-screen flex justify-center items-center text-red-400 text-xl">
  //       Error loading user data.
  //     </div>
  //   );
  // }

  return (
    <div className="relative min-h-screen bg-gradient-to-r from-black via-gray-900 to-black text-white font-sans">
      <Sidebar />
      <main>
        <NotificationPopup />
        <Outlet />
      </main>
    </div>
  );
}
