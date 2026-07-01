import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Loans from '@/pages/Loans';
import Returns from '@/pages/Returns';
import Occurrences from '@/pages/Occurrences';
import Reports from '@/pages/Reports';
import Logs from '@/pages/Logs';
import TVDashboard from '@/pages/TVDashboard';
import Settings from '@/pages/Settings';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/occurrences" element={<Occurrences />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/tv" element={<TVDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
