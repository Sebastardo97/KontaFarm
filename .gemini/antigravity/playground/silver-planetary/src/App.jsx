import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { InventoryProvider } from './contexts/InventoryContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Movements from './pages/Movements';
import Login from './pages/Login';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#0a0f1c] text-white">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/movements" element={<Movements />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App;
