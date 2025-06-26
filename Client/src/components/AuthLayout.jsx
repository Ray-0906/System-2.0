import { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { useNavigate } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  const user = useUserStore((s) => s.user);
 
  const [checked, setChecked] = useState(false); // prevent premature redirect
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      console.log('status check',storedUser);
      if (![![!storedUser]]){
        navigate('/login', { replace: true });
      }
    }
    setChecked(true);
  }, [user, navigate]);

  // fallback in case redirect fails

  return <>{children}</>;
};

export default AuthLayout;
