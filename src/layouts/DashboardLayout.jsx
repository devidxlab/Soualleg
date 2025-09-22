import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Carregar dados do usuário (não precisa mais verificar autenticação aqui)
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-[#fffbf1] to-[#fef9f3] relative">
      {/* Padrão de pontos sutil */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(156, 163, 175, 0.4) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }}></div>
      
      <div className="flex h-full relative z-10">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 