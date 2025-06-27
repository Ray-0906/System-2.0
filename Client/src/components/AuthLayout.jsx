import { useActionState, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const AuthLayout = ({ children }) => {
 const user=useUserStore((s)=>s.user);
  const [checked, setChecked] = useState(false); // prevent premature redirect
  const navigate = useNavigate();
   
  useEffect(() => {
    setTimeout(()=>{
      const storedUser = localStorage.getItem('user');   
      if (!storedUser){
        navigate('/login', { replace: true });
      
    }
    },1000)
      
  
  }, [useNavigate,user]);

  // fallback in case redirect fails
   
  return <>{children}</>;
};

export default AuthLayout;
