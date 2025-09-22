import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Naoconformidades from './pages/Naoconformidades';
import DashboardLayout from './layouts/DashboardLayout';
import CompanyPage from './pages/CompanyPage';
import Companies from './pages/Companies';
import Settings from './pages/Settings';
import Documentacao from './pages/Documentacao';
import Indicadores from './pages/Indicadores';
import Construtor from './pages/Construtor';

// Componente de proteção para verificar se o usuário está logado
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    setIsAuthenticated(!!userData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-blue-900 to-primary flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-white/70">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            <span className="text-lg">Verificando autenticação...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente de proteção para rotas de admin
function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setIsAdmin(user.user_type === 'admin');
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-blue-900 to-primary flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-white/70">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            <span className="text-lg">Verificando permissões...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente de proteção para a rota de empresas
function CompaniesRoute({ children }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setHasAccess(user.user_type === 'admin' && Boolean(user.can_view_empresas));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return null; // ou um componente de loading
  }

  if (!hasAccess) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rota raiz agora verifica autenticação */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/home" replace />
          </ProtectedRoute>
        } />
        
        {/* Rota pública para a página da empresa */}
        <Route path="/empresa/:slug" element={<CompanyPage />} />

        {/* Home page - agora protegida por autenticação */}
        <Route path="/home" element={
          <ProtectedRoute>
            <AdminRoute>
              <Home />
            </AdminRoute>
          </ProtectedRoute>
        } />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/naoconformidades" element={
            <ProtectedRoute>
              <AdminRoute>
                <Naoconformidades />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/indicadores" element={
            <ProtectedRoute>
              <AdminRoute>
                <Indicadores />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/documentacao" element={
            <ProtectedRoute>
              <AdminRoute>
                <Documentacao />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route 
            path="/empresas" 
            element={
              <ProtectedRoute>
                <CompaniesRoute>
                  <Companies />
                </CompaniesRoute>
              </ProtectedRoute>
            } 
          />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <AdminRoute>
                <Settings />
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route 
            path="/construtor" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Construtor />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;