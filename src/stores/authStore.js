import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password,
          });
          const { user, token } = response.data;
          set({ user, token, isLoading: false });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error?.message || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (username, email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            username,
            email,
            password,
            displayName,
          });
          const { user, token } = response.data;
          set({ user, token, isLoading: false });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        set({ user: null, token: null });
        delete axios.defaults.headers.common['Authorization'];
      },

      verifyToken: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_URL}/auth/verify`);
          set({ user: response.data.user });
        } catch (error) {
          set({ user: null, token: null });
          delete axios.defaults.headers.common['Authorization'];
        }
      },
    }),
    {
      name: 'iflow-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// Initialize axios with token on app load
const token = useAuthStore.getState().token;
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  useAuthStore.getState().verifyToken();
}
