import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  BeakerIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Remover dados do usuário do localStorage
    localStorage.removeItem('user');
    // Redirecionar para a página de login
    navigate('/login');
  };

  return (
    <div className="sidebar-special w-64 h-screen p-4 border-r border-white/10 flex flex-col">
      <div className="flex justify-center mb-8">
        <img src="/images/canal6.png" alt="Allegiance Logo" className="h-12 w-auto" />
      </div>
      
      <nav className="space-y-1 flex-1 overflow-y-auto">
        {Boolean(user?.can_view_denuncias) && (
          <Link
            to="/dashboard"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <ExclamationTriangleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Denúncias</span>
          </Link>
        )}
        {Boolean(user?.can_view_naoconformidades) && (
          <Link
            to="/naoconformidades"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <ClipboardDocumentCheckIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Não conformidades</span>
          </Link>
        )}
        <Link
          to="/indicadores"
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
        >
          <ChartBarIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span>Indicadores</span>
        </Link>
        {Boolean(user?.can_view_documentacao) && (
          <Link
            to="/documentacao"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <DocumentTextIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Documentação</span>
          </Link>
        )}
        
        {user?.user_type === 'admin' && Boolean(user?.can_view_empresas) && (
          <Link
            to="/empresas"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <BuildingOfficeIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Empresas</span>
          </Link>
        )}
        
        {user?.user_type === 'admin' && (
          <Link
            to="/construtor"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <BeakerIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Construtor</span>
          </Link>
        )}
        
        <Link
          to="/configuracoes"
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
        >
          <Cog6ToothIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span>Configurações</span>
        </Link>
      </nav>

      {/* Seção de usuário e logout */}
      <div className="border-t border-white/10 pt-4 mt-4 flex-shrink-0">
        <div className="px-4 py-2 mb-2">
          <div className="text-xs text-white/50 mb-1">Usuário logado</div>
          <div className="text-sm text-white/80 font-medium">
            {user?.company_name || user?.username || 'Administrador'}
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-red-500/20 transition-colors group w-full"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}