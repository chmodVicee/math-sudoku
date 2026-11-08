import { Navigate, Route, Routes } from 'react-router-dom';
import NativeBackButton from './components/NativeBackButton';
import { useAuth } from './context/AuthContext';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function FullScreenLoader() {
  return (
    <div className="fullscreen-loader">
      <div className="loader-mark">7</div>
      <p>Cargando Math Sudoku…</p>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <NativeBackButton />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/registro"
          element={
            <PublicOnly>
              <RegisterPage />
            </PublicOnly>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/jugar"
          element={
            <RequireAuth>
              <GamePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
