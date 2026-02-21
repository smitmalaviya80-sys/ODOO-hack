import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import CommandCenter from './pages/CommandCenter';
import VehicleRegistry from './pages/VehicleRegistry';
import TripDispatcher from './pages/TripDispatcher';
import MaintenanceLogs from './pages/MaintenanceLogs';
import ExpenseFuelLogging from './pages/ExpenseFuelLogging';
import DriverProfiles from './pages/DriverProfiles';
import Analytics from './pages/Analytics';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<CommandCenter />} />
        <Route path="vehicles" element={<VehicleRegistry />} />
        <Route path="trips" element={<TripDispatcher />} />
        <Route path="maintenance" element={<MaintenanceLogs />} />
        <Route path="expenses" element={<ExpenseFuelLogging />} />
        <Route path="drivers" element={<DriverProfiles />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}
