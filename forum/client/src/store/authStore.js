import { create } from 'zustand';

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

const storedToken = localStorage.getItem('token');
const decoded = storedToken ? decodeToken(storedToken) : null;

const useAuthStore = create((set) => ({
  user: decoded ? { id: decoded.id, email: decoded.email, role: decoded.role } : null,
  token: decoded ? storedToken : null,
  isAuthenticated: !!decoded,
  newBadges: [],

  login: (user, token, newBadges = []) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, newBadges: newBadges || [] });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, newBadges: [] });
  },

  setUser: (user) => set({ user }),

  clearNewBadges: () => set({ newBadges: [] }),
}));

// Clear invalid/expired token from storage on init
if (storedToken && !decoded) {
  localStorage.removeItem('token');
}

export default useAuthStore;
