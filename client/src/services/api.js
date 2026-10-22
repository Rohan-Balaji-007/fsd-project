import axios from 'axios';
import { supabase } from './supabase.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: dynamically attaches user JWT from active Supabase session
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.warn('[API Client] Could not retrieve Supabase session:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwraps error messages cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data;
    const message = errorResponse?.error || error.message || 'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
