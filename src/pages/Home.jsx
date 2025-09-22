import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Chat from '../components/Chat';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar dados do usuário
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Simular carregamento por 1 segundo (reduzido de 3s)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Pré-loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-blue-900 to-primary flex items-center justify-center">
        <div className="text-center">
          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 animate-fade-in">
            Sistema de gestão da qualidade,<br />
            compliance e risco Assomasul
          </h1>
          
          {/* Loading spinner */}
          <div className="flex items-center justify-center space-x-2 text-white/70">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            <span className="text-lg">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Página principal após carregamento
  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden flex">
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header Compacto */}
        <div className="bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 backdrop-blur-sm border-b border-yellow-300/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="/images/assomasul-logo.png" 
                  alt="ASSOMASUL Logo" 
                  className="h-12 drop-shadow-sm"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-800">ASSOMASUL</h1>
                  <p className="text-gray-600 text-xs font-medium">Sistema de Gestão da Qualidade</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 font-medium text-sm">Bem-vindo, {user?.username}</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    navigate('/login');
                  }}
                  className="bg-yellow-300/60 hover:bg-yellow-300/80 text-gray-800 font-medium px-3 py-1.5 rounded-lg transition-all duration-300 border border-yellow-400/50 hover:border-yellow-400 text-sm"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logo como marca d'água no fundo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/images/assomasul-logo.png" 
            alt="ASSOMASUL Logo Background" 
            className="w-[600px] h-[600px] object-contain opacity-5"
          />
        </div>

        {/* Área de Conteúdo Sem Scroll */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 relative z-10 flex flex-col justify-center">
                  {/* Seção de Boas Vindas Compacta */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
              Bem-vindo ao Sistema ASSOMASUL
            </h1>
            
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100/80 backdrop-blur-sm border border-yellow-200 rounded-xl p-4 mb-4 shadow-lg max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Sistema de Gestão da Qualidade, Compliance e Risco
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                Plataforma integrada para excelência operacional, conformidade regulatória e gestão eficaz de riscos.
              </p>
            </div>
          </div>

                  {/* Cards de Funcionalidades Compactos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Dashboard */}
                      <div 
              className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
              onClick={() => {
                // Redirecionar para o primeiro dashboard disponível baseado nas permissões
                if (user?.can_view_denuncias) {
                  navigate('/dashboard');
                } else if (user?.can_view_naoconformidades) {
                  navigate('/naoconformidades');
                } else if (user?.can_view_documentacao) {
                  navigate('/documentacao');
                } else if (user?.user_type === 'admin' && user?.can_view_empresas) {
                  navigate('/empresas');
                } else {
                  navigate('/configuracoes');
                }
              }}
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                <ChartBarIcon className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Dashboard</h3>
              <p className="text-gray-600 mb-2 text-xs">
                Visão geral de métricas e indicadores de performance.
              </p>
              <div className="flex items-center text-blue-500 group-hover:text-blue-600">
                <span className="mr-2 text-xs">Acessar</span>
                <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          {/* Não Conformidades */}
          <div 
            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
            onClick={() => navigate('/naoconformidades')}
          >
            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
              <ShieldCheckIcon className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Não Conformidades</h3>
            <p className="text-gray-600 mb-2 text-xs">
              Gestão de não conformidades por setores com controle de riscos.
            </p>
            <div className="flex items-center text-orange-500 group-hover:text-orange-600">
              <span className="mr-2 text-xs">Gerenciar</span>
              <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Documentação */}
          <div 
            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
            onClick={() => navigate('/documentacao')}
          >
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
              <DocumentTextIcon className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Documentação</h3>
            <p className="text-gray-600 mb-2 text-xs">
              Acesso centralizado a documentos e políticas organizacionais.
            </p>
            <div className="flex items-center text-green-500 group-hover:text-green-600">
              <span className="mr-2 text-xs">Consultar</span>
              <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

                    {/* Empresas (apenas admin) */}
          {user?.user_type === 'admin' && Boolean(user?.can_view_empresas) && (
            <div 
              className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
              onClick={() => navigate('/empresas')}
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                <BuildingOfficeIcon className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Empresas</h3>
              <p className="text-gray-600 mb-2 text-xs">
                Gestão de empresas parceiras e suas configurações.
              </p>
              <div className="flex items-center text-purple-500 group-hover:text-purple-600">
                <span className="mr-2 text-xs">Administrar</span>
                <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Configurações */}
          <div 
            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
            onClick={() => navigate('/configuracoes')}
          >
            <div className="w-10 h-10 bg-gray-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-500/20 transition-colors">
              <UserGroupIcon className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Configurações</h3>
            <p className="text-gray-600 mb-2 text-xs">
              Gerenciamento de usuários e permissões do sistema.
            </p>
            <div className="flex items-center text-gray-600 group-hover:text-gray-700">
              <span className="mr-2 text-xs">Configurar</span>
              <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Chat Component - Sempre Visível */}
      <Chat user={user} />
    </div>
  );
} 