import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Forum from './pages/Forum';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Support from './pages/Support';
import TicketDetail from './pages/TicketDetail';
import About from './pages/About';
import AllCategories from './pages/AllCategories';
import AllTags from './pages/AllTags';
import Badges from './pages/Badges';
import BadgeDetail from './pages/BadgeDetail';
import BadgeGrantedModal from './components/BadgeGrantedModal';
import AdminLayout from './pages/AdminLayout';
import useAuthStore from './store/authStore';
import api from './utils/api';
import './App.css';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  // Initialize dark mode from localStorage on app mount
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);

  // Rehydrate full user profile from API on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      api.get(`/users/${user.id}`)
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const newBadges = useAuthStore((state) => state.newBadges);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {newBadges && newBadges.length > 0 && <BadgeGrantedModal />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/profile/:id" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/about" element={<About />} />
        <Route path="/categories" element={<AllCategories />} />
        <Route path="/tags" element={<AllTags />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/badges/:slug" element={<BadgeDetail />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/:id" element={isAuthenticated ? <TicketDetail /> : <Navigate to="/login" />} />
        <Route
          path="/admin/*"
          element={isAuthenticated && user?.role === 'admin' ? <AdminLayout /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/forum" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
