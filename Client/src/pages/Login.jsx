import { useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../utils/GoogleLogin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/login', { email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded shadow-md w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-bold text-center">Login</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded font-semibold">
          Login
        </button>

       <GoogleLoginButton/>
      </form>
    </div>
  );
}
