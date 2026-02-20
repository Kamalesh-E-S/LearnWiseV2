import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios';

const authStore = (set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    set({ token, isAuthenticated: !!token });
  },

  signOut: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
  },
});

export const useAuthStore = create(
  persist(authStore, {
    name: 'auth-storage',
    partialize: (state) => ({
      token: state.token,
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }),
    onRehydrateStorage: () => (state) => {
      // Restore auth header from persisted token on page reload
      if (state?.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      }
    },
  })
);