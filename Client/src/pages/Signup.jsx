import { useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../utils/GoogleLogin';

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/register', form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <form onSubmit={handleSignup} className="bg-gray-900 p-8 rounded shadow-md w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded font-semibold">
          Sign Up
        </button>

       < GoogleLoginButton/>
      </form>
    </div>
  );
}
