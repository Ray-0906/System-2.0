import React from 'react';

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/google`;
  };

  return (
    <button onClick={handleGoogleLogin} className="bg-red-500 text-white px-4 py-2 rounded">
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;
