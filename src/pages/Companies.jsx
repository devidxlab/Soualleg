import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  NoSymbolIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import CompanyModal from '../components/CompanyModal';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaints, setComplaints] = useState({});
  const [userCredentials, setUserCredentials] = useState({});
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const navigate = useNavigate();

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  // Função para buscar credenciais
  const fetchCredentials = async (companies) => {
    const credentialsData = {};
    for (const company of companies) {
      try {
        // Forçar bypass do cache com um timestamp
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE_URL}/users/company/${company.id}?t=${timestamp}`);
        
        if (response.ok) {
          const userData = await response.json();
          credentialsData[company.slug] = userData.password;
        }
      } catch (error) {
        console.error('Erro ao buscar credenciais:', error);
      }
    }
    setUserCredentials(credentialsData);
  };

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      // Verificar se o usuário é admin
      if (parsedUser.user_type !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setUser(parsedUser);
    }

    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/companies`);
        if (!response.ok) throw new Error('Falha ao carregar empresas');
        const data = await response.json();
        setCompanies(data);

        // Buscar denúncias e credenciais para cada empresa
        const complaintsData = {};
        
        for (const company of data) {
          // Buscar denúncias
          const complaintResponse = await fetch(`${API_BASE_URL}/companies/${company.slug}/complaints`);
          if (complaintResponse.ok) {
            const complaintData = await complaintResponse.json();
            complaintsData[company.slug] = complaintData.length;
          }
        }
        
        setComplaints(complaintsData);
        // Buscar credenciais iniciais
        await fetchCredentials(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();

    // Configurar intervalo para atualizar credenciais a cada 2 segundos
    const credentialsInterval = setInterval(() => {
      if (companies.length > 0) {
        fetchCredentials(companies);
      }
    }, 2000);

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(credentialsInterval);
  }, [navigate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(`${window.location.origin}/empresa/${url}`);
    // Mostrar notificação de sucesso
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = 'Link copiado para a área de transferência!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const toggleStatus = async (company) => {
    try {
      const newStatus = company.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`${API_BASE_URL}/companies/${company.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Falha ao atualizar status');

      // Atualizar a lista de empresas
      const updatedCompanies = companies.map(c => 
        c.id === company.id ? { ...c, status: newStatus } : c
      );
      setCompanies(updatedCompanies);

      // Mostrar notificação
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = `Status da empresa alterado para ${newStatus === 'active' ? 'Ativo' : 'Inativo'}`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCreateCompany = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Falha ao criar empresa');
      }

      const newCompany = await response.json();
      
      // Atualizar a lista de empresas
      setCompanies(prevCompanies => [newCompany, ...prevCompanies]);
      
      // Criar modal com as credenciais
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="glass-card rounded-2xl p-8 max-w-md mx-4 animate-fade-in">
          <div class="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white text-center mb-2">Empresa Criada com Sucesso!</h3>
          <p class="text-white/70 text-center mb-6">
            A empresa foi cadastrada e as credenciais de acesso foram geradas:
          </p>
          <div class="glass-effect rounded-lg p-4 mb-6 space-y-3">
            <div>
              <label class="block text-sm font-medium text-white/70 mb-1">Usuário</label>
              <div class="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                <code class="text-white">${newCompany.slug}</code>
                <button 
                  onclick="navigator.clipboard.writeText('${newCompany.slug}')"
                  class="text-white/70 hover:text-white"
                  title="Copiar usuário"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-white/70 mb-1">Senha</label>
              <div class="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                <code class="text-white">demo123</code>
                <button 
                  onclick="navigator.clipboard.writeText('demo123')"
                  class="text-white/70 hover:text-white"
                  title="Copiar senha"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div class="flex justify-end">
            <button 
              class="btn-premium px-4 py-2"
              onclick="this.parentElement.parentElement.parentElement.remove()"
            >
              Entendi
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);

      // Fechar o modal de criação
      setIsCompanyModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      // Mostrar notificação de erro
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Erro ao criar empresa. Tente novamente.';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  const showDeleteConfirmation = (company) => {
    setCompanyToDelete(company);
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="glass-card rounded-2xl p-8 max-w-md mx-4 animate-fade-in">
        <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white text-center mb-2">Excluir Empresa</h3>
        <p class="text-white/70 text-center mb-6">
          Tem certeza que deseja excluir a empresa <strong class="text-white">${company.name}</strong>?<br>
          Todos os dados, eventos e denúncias relacionados serão permanentemente excluídos.
        </p>
        <div class="flex gap-3">
          <button 
            class="flex-1 btn-glass px-4 py-2.5"
            onclick="this.parentElement.parentElement.parentElement.remove()"
          >
            Cancelar
          </button>
          <button 
            class="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2.5 transition-colors"
            onclick="this.parentElement.parentElement.parentElement.dispatchEvent(new CustomEvent('confirm'))"
          >
            Excluir Empresa
          </button>
        </div>
      </div>
    `;

    modal.addEventListener('confirm', async () => {
      try {
        console.log('Iniciando exclusão da empresa:', {
          id: company.id,
          slug: company.slug,
          name: company.name
        });

        // Usar o mesmo padrão das outras operações que funcionam
        const response = await fetch(`${API_BASE_URL}/companies/${company.slug}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: company.id })
        });

        console.log('Resposta do servidor:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });

        let responseData;
        try {
          responseData = await response.json();
          console.log('Dados da resposta:', responseData);
        } catch (e) {
          console.log('Resposta não contém JSON:', e);
        }

        if (!response.ok) {
          throw new Error(responseData?.message || `Erro ao excluir empresa: ${response.status} ${response.statusText}`);
        }

        console.log('Empresa excluída com sucesso');

        // Atualizar a lista de empresas
        setCompanies(prevCompanies => prevCompanies.filter(c => c.slug !== company.slug));
        
        // Mostrar notificação de sucesso
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Empresa excluída com sucesso!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);

        // Recarregar a lista de empresas após um breve delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Erro completo ao excluir empresa:', {
          message: error.message,
          stack: error.stack,
          company: company
        });

        // Mostrar notificação de erro
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = error.message || 'Erro ao excluir empresa. Tente novamente.';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      } finally {
        modal.remove();
        setCompanyToDelete(null);
      }
    });

    document.body.appendChild(modal);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card rounded-2xl p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">Erro ao carregar empresas</h3>
          <p className="mt-2 text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Empresas Cadastradas</h1>
              <p className="mt-1 text-white/70">Gerencie e monitore todas as empresas registradas no sistema</p>
            </div>
            {user?.user_type === 'admin' && (
              <>
                <button 
                  onClick={() => setIsCompanyModalOpen(true)}
                  className="btn-premium flex items-center gap-2"
                  title="Cadastrar Nova Empresa"
                >
                  <BuildingOfficeIcon className="h-5 w-5" />
                  Cadastrar Empresa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="p-6">
              {/* Logo Section */}
              <div className="flex flex-col items-center mb-4">
                {company.logo ? (
                  <div className="w-full h-32 mb-4 flex items-center justify-center rounded-xl overflow-hidden glass-effect">
                    <img
                      src={`/uploads/${company.logo}`}
                      alt={`${company.name} logo`}
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 mb-4 flex items-center justify-center rounded-xl glass-effect">
                    <BuildingOfficeIcon className="h-16 w-16 text-white/40" />
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white">{company.name}</h3>
                  <p className="text-sm text-white/70">Desde {formatDate(company.created_at)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="glass-effect rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white/80 text-sm font-medium">Denúncias</div>
                    <span className="glass-effect px-2.5 py-0.5 rounded-full text-xs font-medium text-white">
                      {complaints[company.slug] || 0}
                    </span>
                  </div>
                </div>

                <div 
                  className={`glass-effect rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 ${
                    company.status === 'active' ? 'text-emerald-300' : 'text-red-300'
                  }`}
                  onClick={() => toggleStatus(company)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Status</div>
                    <span className="flex items-center gap-1 text-xs font-medium">
                      {company.status === 'active' ? (
                        'Ativo'
                      ) : (
                        <>
                          <NoSymbolIcon className="w-3 h-3" />
                          Inativo
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(company.slug)}
                    className="btn-glass p-2"
                    title="Copiar Link"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                  <a
                    href={`/empresa/${company.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn-glass p-2 ${
                      company.status !== 'active' && 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (company.status !== 'active') {
                        e.preventDefault();
                      }
                    }}
                    title="Acessar"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                  {user?.user_type === 'admin' && (
                    <button
                      onClick={() => showDeleteConfirmation(company)}
                      className="btn-glass p-2 hover:bg-red-500/10 hover:text-red-400"
                      title="Excluir Empresa"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => window.location.href = `/empresa/${company.slug}`}
                  className={`btn-premium ${
                    company.status !== 'active' && 'opacity-50 cursor-not-allowed'
                  }`}
                  disabled={company.status !== 'active'}
                >
                  <EyeIcon className="h-4 w-4 mr-1.5" />
                  Visualizar
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-white/70">
                    {company.cnpj && `CNPJ: ${company.cnpj}`}
                  </div>
                  <div className="flex items-center text-white/70">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      company.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                    } mr-2`}></span>
                    {company.status === 'active' ? 'Online' : 'Offline'}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-white/10">
                  <div className="text-sm text-white/70 font-medium mb-2">Credenciais de Acesso:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-effect rounded-lg p-3">
                      <div className="text-xs text-white/50 mb-1.5">Usuário</div>
                      <div className="flex items-center justify-between">
                        <code className="text-sm text-white font-medium">{company.slug}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(company.slug);
                            showNotification('Usuário copiado!');
                          }}
                          className="text-white/50 hover:text-white transition-colors"
                          title="Copiar usuário"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="glass-effect rounded-lg p-3">
                      <div className="text-xs text-white/50 mb-1.5">Senha</div>
                      <div className="flex items-center justify-between">
                        <code className="text-sm text-white font-medium">
                          {userCredentials[company.slug] || 'demo123'}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(userCredentials[company.slug] || 'demo123');
                            showNotification('Senha copiada!');
                          }}
                          className="text-white/50 hover:text-white transition-colors"
                          title="Copiar senha"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleCreateCompany}
      />
    </div>
  );
} 