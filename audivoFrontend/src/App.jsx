import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import { ColorModeProvider } from './context/ColorModeContext';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import Dashboard from './pages/Dashboard';
import { LIBRARY } from './constants/route_constant';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageRolesPage from './pages/ManageRolesPage';

const Placeholder = ({ title }) => <Typography variant="h4" sx={{ fontWeight: 800 }}>{title}</Typography>;

export default function App() {
  return (
    <ColorModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public (logged-out) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Requires login */}
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/browse" element={<Placeholder title="Browse" />} />
              <Route path={LIBRARY} element={<Placeholder title="Library" />} />
              <Route path="/upload" element={<Placeholder title="Upload Songs" />} />
              <Route path="/songs" element={<Placeholder title="Delete Songs" />} />
              <Route path="/feature" element={<Placeholder title="Feature Songs" />} />
              <Route path="/users" element={<ManageUsersPage />} />
              <Route path="/analytics" element={<Placeholder title="Analytics" />} />
              <Route path="/moderate" element={<Placeholder title="Moderate Comments" />} />
              <Route path="/roles" element={<ManageRolesPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ColorModeProvider>
  );
}