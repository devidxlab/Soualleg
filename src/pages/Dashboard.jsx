import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ServerIcon,
  ShieldCheckIcon,
  SignalIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import StatusCard from '../components/StatusCard';
import DistributionChart from '../components/DistributionChart';
import EventModal from '../components/EventModal';
import NewEventModal from '../components/NewEventModal';
import CompanyModal from '../components/CompanyModal';
import ComplaintViewModal from '../components/ComplaintViewModal';
import TimelineChart from '../components/TimelineChart';
import { API_BASE_URL } from '../config';

const categories = ['Todas as Categorias', 'Cadastros', 'Elogios', 'Denúncias', 'Reclamações', 'Não conformidades'];

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    byCategory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas as Categorias');
  const [selectedStatus, setSelectedStatus] = useState('Todos os Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isComplaintViewModalOpen, setIsComplaintViewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [user, setUser] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar dados do usuário
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Verificar se o usuário tem permissão para acessar denúncias
      if (!parsedUser.can_view_denuncias) {
        // Redirecionar para a primeira página que o usuário tem acesso
        if (parsedUser.can_view_naoconformidades) {
          navigate('/naoconformidades');
        } else if (parsedUser.can_view_documentacao) {
          navigate('/documentacao');
        } else if (parsedUser.user_type === 'admin' && parsedUser.can_view_empresas) {
          navigate('/empresas');
        } else {
          navigate('/configuracoes');
        }
        return;
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Iniciando busca de dados...');
      
      // Buscar eventos
      let eventsResponse;
      if (user?.user_type === 'company') {
        // Se for usuário empresa, buscar apenas eventos da empresa
        eventsResponse = await fetch(`${API_BASE_URL}/events?company=${user.company_name}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Se for admin, buscar todos os eventos
        eventsResponse = await fetch(`${API_BASE_URL}/events`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!eventsResponse.ok) {
        throw new Error(`Falha ao buscar eventos: ${eventsResponse.status} ${eventsResponse.statusText}`);
      }
      
      const eventsData = await eventsResponse.json();
      console.log('Eventos recebidos:', eventsData);
      setEvents(eventsData);

      // Buscar estatísticas
      let statsResponse;
      if (user?.user_type === 'company') {
        // Se for usuário empresa, buscar apenas estatísticas da empresa
        statsResponse = await fetch(`${API_BASE_URL}/stats?company=${user.company_name}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Se for admin, buscar todas as estatísticas
        statsResponse = await fetch(`${API_BASE_URL}/stats`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!statsResponse.ok) {
        throw new Error(`Falha ao buscar estatísticas: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      
      const statsData = await statsResponse.json();
      console.log('Estatísticas recebidas:', statsData);
      setStats(statsData);

      // Prepare timeline data - only use standard categories, not sectors
      const timelineStats = eventsData.reduce((acc, event) => {
        // Skip events without a date
        if (!event.date || typeof event.date !== 'string') return acc;
        
        const date = event.date.split(' ')[0]; // Get just the date part
        const found = acc.find(item => item.date === date);
        
        if (found) {
          // Inicializar todas as categorias se não existirem
          categories.forEach(category => {
            if (category !== 'Todas as Categorias' && !found[category]) {
              found[category] = 0;
            }
          });
          found[event.category] = (found[event.category] || 0) + 1;
        } else {
          const newItem = { date };
          // Inicializar todas as categorias com 0
          categories.forEach(category => {
            if (category !== 'Todas as Categorias') {
              newItem[category] = 0;
            }
          });
          newItem[event.category] = 1;
          acc.push(newItem);
        }
        return acc;
      }, []);

      // Sort by date
      timelineStats.sort((a, b) => new Date(a.date) - new Date(b.date));
      setTimelineData(timelineStats);
    } catch (err) {
      console.error('Erro detalhado ao buscar dados:', err);
      setError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId) => {
    // Criar o modal de confirmação
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="glass-card rounded-2xl p-8 max-w-md mx-4 animate-fade-in">
        <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white text-center mb-2">Excluir Evento</h3>
        <p class="text-white/70 text-center mb-6">
          Tem certeza que deseja excluir este evento?<br>
          Esta ação não poderá ser desfeita.
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
            Excluir Evento
          </button>
        </div>
      </div>
    `;

    // Adicionar o modal ao DOM
    document.body.appendChild(modal);

    // Adicionar listener para o evento de confirmação
    modal.addEventListener('confirm', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: user.username })
        });

        if (!response.ok) {
          throw new Error('Falha ao excluir evento');
        }

        // Atualizar a lista de eventos e estatísticas
        await fetchData();
        
        // Mostrar notificação de sucesso
        showNotification('Evento excluído com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao excluir evento:', err);
        showNotification('Erro ao excluir evento', 'error');
      } finally {
        modal.remove();
      }
    });
  };

  const handleSave = async (formData) => {
    try {
      console.log('Tentando atualizar evento:', formData);
      
      if (!formData.id) {
        throw new Error('ID do evento não fornecido');
      }

      // Validar dados antes de enviar
      if (!formData.company || !formData.category || !formData.status) {
        throw new Error('Campos obrigatórios faltando');
      }

      const response = await fetch(`${API_BASE_URL}/events/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: formData.category,
          company: formData.company,
          status: formData.status,
          description: formData.description || ''
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Falha ao atualizar evento');
      }

      console.log('Evento atualizado com sucesso:', responseData);

      // Atualizar a lista de eventos e estatísticas
      await fetchData();
      
      // Mostrar notificação de sucesso
      showNotification('Evento atualizado com sucesso!', 'success');
      
      // Fechar o modal
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Erro detalhado ao atualizar evento:', err);
      showNotification(err.message || 'Erro ao atualizar evento', 'error');
    }
  };

  const handleCreateEvent = async (formData) => {
    try {
      // Validar campos obrigatórios
      if (!formData.date || !formData.category || !formData.company || !formData.status) {
        throw new Error('Campos obrigatórios faltando');
      }

      console.log('Tentando criar evento:', formData);

      // Se for uma denúncia ou não conformidade, não precisa incluir no formData
      // pois a API irá criar automaticamente
      if (formData.category === 'Denúncias' || formData.category === 'Não conformidades') {
        console.log('Criando evento para empresa:', formData.company);
        
        // Usar as novas APIs gerais
        const endpoint = formData.category === 'Denúncias' 
          ? `${API_BASE_URL}/complaints` 
          : `${API_BASE_URL}/nonconformities`;
        
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            company_id: 4, // ASSOMASUL
            subject: 'Registrado via administrador',
            description: formData.description || 'Sem descrição fornecida',
            created_at: formData.date
          })
        });

        // Atualizar dados após criação
        await fetchData();
        setIsNewEventModalOpen(false);
        showNotification('Evento criado com sucesso!');
        return;
      }

      // Para outras categorias, criar evento diretamente
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Falha ao criar evento');
      }

      // Atualizar dados após criação
      await fetchData();
      setIsNewEventModalOpen(false);
      showNotification('Evento criado com sucesso!');
    } catch (err) {
      console.error('Erro ao criar evento:', err);
      showNotification('Erro ao criar evento: ' + err.message, 'error');
    }
  };

  const handleCreateCompany = async (formData) => {
    try {
      console.log('Criando nova empresa:', formData);
      
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        body: formData
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Falha ao criar empresa');
      }

      console.log('Empresa criada com sucesso:', responseData);
      
      // Atualizar a lista de eventos
      await fetchData();
      
      // Mostrar notificação de sucesso com o link
      showNotification(
        `Empresa criada com sucesso! Acesse em: ${window.location.origin}${responseData.url}`,
        'success'
      );
      
      // Fechar o modal
      setIsCompanyModalOpen(false);

      // Copiar o link para a área de transferência
      navigator.clipboard.writeText(`${window.location.origin}${responseData.url}`);
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      showNotification(err.message || 'Erro ao criar empresa', 'error');
    }
  };

  const handleViewComplaint = async (event) => {
    try {
      // Verificar se é uma denúncia ou não conformidade
      if (!['Denúncias', 'Não conformidades'].includes(event.category)) {
        throw new Error('Este evento não é uma denúncia ou não conformidade');
      }

      setLoading(true);
      
      console.log('Buscando detalhes para evento:', event.company, event.category);
      
      // Usar as novas APIs gerais com filtro por empresa
      const endpoint = event.category === 'Denúncias' 
        ? `${API_BASE_URL}/complaints?company=${encodeURIComponent(event.company)}`
        : `${API_BASE_URL}/nonconformities?company=${encodeURIComponent(event.company)}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Falha ao buscar dados: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Procurar por uma denúncia ou não conformidade com data semelhante à do evento
      const eventDate = new Date(event.date).getTime();
      const item = data.find(d => {
        const itemDate = new Date(d.created_at).getTime();
        // Permitir uma diferença de até 2 minutos
        return Math.abs(eventDate - itemDate) < 2 * 60 * 1000;
      });

      if (item) {
        setSelectedComplaint(item);
        setIsComplaintViewModalOpen(true);
      } else {
        showNotification(`Não foi possível encontrar detalhes para este ${event.category === 'Denúncias' ? 'denúncia' : 'não conformidade'}`, 'error');
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para mostrar notificações
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
      type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
    }`;
    
    // Ícone
    const icon = document.createElement('span');
    if (type === 'success') {
      icon.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    } else {
      icon.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    }
    
    // Mensagem
    const text = document.createElement('span');
    text.textContent = message;
    
    // Botão fechar
    const closeButton = document.createElement('button');
    closeButton.className = 'ml-4 hover:opacity-75';
    closeButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    closeButton.onclick = () => notification.remove();
    
    notification.appendChild(icon);
    notification.appendChild(text);
    notification.appendChild(closeButton);
    document.body.appendChild(notification);
    
    // Remover automaticamente após 3 segundos
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'Todas as Categorias' || event.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Todos os Status' || event.status === selectedStatus.toLowerCase();
    const matchesSearch = event.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl">
        <h2 className="text-red-600 text-lg font-semibold mb-2">Erro ao carregar dados</h2>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Cards Row */}
      <div className="grid grid-cols-8 gap-2">
        <StatusCard
          icon={ServerIcon}
          title="Banco de Dados"
          value="Conectado"
          color="emerald"
        />
        <StatusCard
          icon={SignalIcon}
          title="Autenticação"
          value="Online"
          color="blue"
        />
        <StatusCard
          icon={ShieldCheckIcon}
          title="Segurança"
          value="Protegido"
          color="indigo"
        />
        <StatusCard
          icon={SignalIcon}
          title="Disponibilidade"
          value="99.9%"
          color="emerald"
        />
        <StatusCard
          icon={DocumentTextIcon}
          title="Total de Eventos"
          value={stats.total.toString()}
          percentage={4.75}
          color="blue"
        />
        <StatusCard
          icon={ClockIcon}
          title="Eventos Abertos"
          value={stats.open.toString()}
          percentage={54.02}
          color="amber"
        />
        <StatusCard
          icon={CheckCircleIcon}
          title="Eventos Fechados"
          value={stats.closed.toString()}
          percentage={12.05}
          color="emerald"
        />
        {user?.user_type === 'admin' && (
          <StatusCard
            icon={BuildingOfficeIcon}
            title="Empresas Ativas"
            value="18"
            percentage={2.59}
            color="purple"
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <DistributionChart data={stats.byCategory} />
        </div>
        <div className="col-span-8">
          <TimelineChart data={timelineData} />
        </div>
      </div>

      {/* Events List */}
      <div className="glass-card">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Listagem de eventos</h1>
            <div className="flex items-center gap-4">
              {user?.user_type === 'admin' && (
                <>
                  <button
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="btn-glass flex items-center gap-2"
                  >
                    <BuildingOfficeIcon className="h-5 w-5" />
                    Cadastrar Empresa
                  </button>
                  <button
                    onClick={() => setIsNewEventModalOpen(true)}
                    className="btn-premium flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Novo Evento
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2.5 text-white focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2.5 text-white focus:outline-none"
              >
                <option className="bg-gray-800">Todos os Status</option>
                <option className="bg-gray-800">Aberto</option>
                <option className="bg-gray-800">Fechado</option>
              </select>
            </div>
            <div className="flex-[2]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-white/50 focus:outline-none"
                />
                <svg 
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/70 w-[140px]">Data e Hora</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/70 w-[120px]">Categoria</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/70 w-[140px]">Empresa</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/70">Descrição</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-white/70 w-[100px]">Status</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-white/70 w-[80px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-white/50">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-medium text-white/70 mb-1">Nenhum evento encontrado</span>
                        <span className="text-sm text-white/50">Tente ajustar os filtros de busca</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr 
                      key={event.id} 
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4 w-[140px]">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{new Date(event.date).toLocaleDateString()}</span>
                          <span className="text-xs text-white/50 mt-0.5">{new Date(event.date).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 w-[120px]">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            event.category === 'Elogios' ? 'bg-emerald-400' :
                            event.category === 'Denúncias' ? 'bg-red-400' :
                            event.category === 'Reclamações' ? 'bg-orange-400' :
                            event.category === 'Não conformidades' ? 'bg-violet-400' :
                            'bg-blue-400'
                          }`}></span>
                          <span className="text-sm text-white">{event.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 w-[140px]">
                        <span className="text-sm text-white font-medium">{event.company}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-white/70 line-clamp-2">{event.description}</p>
                      </td>
                      <td className="py-4 px-4 w-[100px]">
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                          event.status === 'aberto' 
                            ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30' 
                            : event.status === 'fechado'
                            ? 'bg-gray-400/10 text-gray-300 ring-1 ring-gray-400/30'
                            : 'bg-red-400/10 text-red-300 ring-1 ring-red-400/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            event.status === 'aberto' 
                              ? 'bg-emerald-400' 
                              : event.status === 'fechado'
                              ? 'bg-gray-400'
                              : 'bg-red-400'
                          }`}></span>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 w-[80px]">
                        <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          {event.category !== 'Cadastros' && (
                            <button
                              onClick={() => handleViewComplaint(event)}
                              className="p-1.5 text-white/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-150"
                              title="Ver Denúncia"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          {user?.user_type === 'admin' && (
                            <>
                              <button
                                onClick={() => handleEdit(event)}
                                className="p-1.5 text-white/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-150"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="p-1.5 text-white/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-150"
                                title="Excluir"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSave={handleSave}
      />

      <NewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSave={handleCreateEvent}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleCreateCompany}
      />

      <ComplaintViewModal
        isOpen={isComplaintViewModalOpen}
        onClose={() => {
          setIsComplaintViewModalOpen(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
      />
    </div>
  );
} 