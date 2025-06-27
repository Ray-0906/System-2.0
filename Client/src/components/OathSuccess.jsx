import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoadUser } from '../utils/userLoader';


const OAuthSuccess = () => {
  const { loading, error } = useLoadUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!error) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [loading, error, navigate]);

  return <div className="text-white text-center p-8">Logging in via Google...</div>;
};

export default OAuthSuccess;
