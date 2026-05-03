import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import WatchHistoryPage from './pages/WatchHistoryPage';
import WatchlistPage from './pages/WatchlistPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:movieId" element={<MovieDetailPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <WatchlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlog"
          element={
            <ProtectedRoute>
              <WatchHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
