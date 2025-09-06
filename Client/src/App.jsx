// App.jsx
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./components/sidebar";
import NotificationPopup from "./utils/Notification";
import "./App.css";
import { useLoadUser } from "./utils/userLoader";
import SoloLoading from "./components/Loading";

// Shared ambient background (used on every page except Home)
const SharedBackground = () => (
  <div className="fixed inset-0 -z-10 pointer-events-none">
    <div className="absolute top-20 right-32 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full" />
    <div className="absolute bottom-24 left-20 w-72 h-72 bg-pink-600/20 blur-3xl rounded-full" />
  </div>
);

export default function App() {
  const { loading, error } = useLoadUser();
  const location = useLocation();
  const isHome = location.pathname === "/"; // Home keeps its custom hero/marketing background
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
    <div className={`relative min-h-screen ${isHome ? "bg-black" : "bg-gradient-to-br from-gray-950 via-black to-gray-900"} text-white font-sans overflow-x-hidden`}>
      {!isHome && <SharedBackground />}
      <Sidebar loc={location} />
      <main className="relative z-10">
        <NotificationPopup />
        <Outlet />
      </main>
    </div>
  );
}
