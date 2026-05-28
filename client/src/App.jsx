import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import RoomPage from './pages/RoomPage';
import LeaderboardPage from './pages/LeaderboardPage';
import FriendsPage from './pages/FriendsPage';
import FindPeoplePage from './pages/FindPeoplePage';
import FeedPage from './pages/FeedPage';
import NotesPoolPage from './pages/NotesPoolPage';
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
    <Route path="/rooms" element={<PrivateRoute><Layout><RoomsPage /></Layout></PrivateRoute>} />
    <Route path="/rooms/:id" element={<PrivateRoute><Layout><RoomPage /></Layout></PrivateRoute>} />
    <Route path="/leaderboard" element={<PrivateRoute><Layout><LeaderboardPage /></Layout></PrivateRoute>} />
    <Route path="/friends" element={<PrivateRoute><Layout><FriendsPage /></Layout></PrivateRoute>} />
    <Route path="/find" element={<PrivateRoute><Layout><FindPeoplePage /></Layout></PrivateRoute>} />
    <Route path="/feed" element={<PrivateRoute><Layout><FeedPage /></Layout></PrivateRoute>} />
    <Route path="/pool/notes" element={<PrivateRoute><Layout><NotesPoolPage /></Layout></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{
            className: 'bg-white text-slate-800 border border-slate-200 dark:bg-dark-800 dark:text-white dark:border-slate-700',
          }} />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
