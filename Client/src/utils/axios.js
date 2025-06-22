// utils/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000', // Update to your backend URL
  withCredentials: true // Needed for cookies
});

export default axiosInstance;
