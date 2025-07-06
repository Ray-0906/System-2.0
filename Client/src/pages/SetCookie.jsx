import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../utils/axios";

const OAuthTransfer = () => {
  const [status, setStatus] = useState("Verifying Google login...");
  const navigate = useNavigate();

  useEffect(() => {
    const storeTokenAndRedirect = async () => {
      try {
        // Optional: support token via query params (if you redirected with it)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        // Make a backend call to store token in a secure HttpOnly cookie
        await axiosInstance.post("/set-cookie", { token });

        setStatus("Redirecting to dashboard...");
        navigate("/oauth-success");
      } catch (err) {
        console.error("OAuth cookie set failed:", err);
        setStatus("Login failed. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    storeTokenAndRedirect();
  }, [navigate]);

  return (
    <div className="text-white text-center p-8">
      {status}
    </div>
  );
};

export default OAuthTransfer;
