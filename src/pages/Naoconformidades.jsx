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
  ExclamationTriangleIcon,
  FireIcon,
  ScaleIcon,
  LightBulbIcon,
  BeakerIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import StatusCard from '../components/StatusCard';
import DistributionChart from '../components/DistributionChart';
import EventModal from '../components/EventModal';
import NonconformityViewModal from '../components/NonconformityViewModal';
import NonconformityFormModal from '../components/NonconformityFormModal';

import { API_BASE_URL } from '../config';

// Mesmas categorias do Dashboard, mas serão filtradas por Não conformidades
const categories = ['Todas as Categorias', 'Cadastros', 'Elogios', 'Denúncias', 'Reclamações', 'Não conformidades'];

// Definição dos setores para o painel de Não conformidades
const setores = ['Compras', 'Comunicação', 'Diário', 'Financeiro', 'Projetos', 'Recepção', 'RH', 'SGQ'];

export default function Naoconformidades() {
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
  const [isNonconformityFormModalOpen, setIsNonconformityFormModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isNonconformityViewModalOpen, setIsNonconformityViewModalOpen] = useState(false);
  const [selectedNonconformity, setSelectedNonconformity] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [user, setUser] = useState(null);
  const [risksByLevel, setRisksByLevel] = useState({
    low: 0,
    medium: 0,
    high: 0
  });
  const [acaoCorretivaStats, setAcaoCorretivaStats] = useState({
    total: 0,
    completas: 0,
    pendentes: 0
  });
  const [efficacyRate, setEfficacyRate] = useState(0);
  const [recorrenciaCount, setRecorrenciaCount] = useState(0);
  const navigate = useNavigate();

  // Função para buscar permissões do usuário
  const fetchUserPermissions = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-permissions/${username}`);
      if (response.ok) {
        const permissions = await response.json();
        setUserPermissions(permissions);
        return permissions;
      }
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
    }
    return [];
  };

  // Função para verificar se o usuário tem uma permissão específica
  const hasPermission = (permission) => {
    return userPermissions.includes(permission) || user?.user_type === 'admin';
  };

  useEffect(() => {
    // Carregar dados do usuário
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Buscar permissões do usuário
      fetchUserPermissions(parsedUser.username);
      
      // Verificar se o usuário tem permissão para acessar não conformidades
      if (!parsedUser.can_view_naoconformidades) {
        // Redirecionar para a primeira página que o usuário tem acesso
        if (parsedUser.can_view_denuncias) {
          navigate('/dashboard');
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
      console.log('Iniciando busca de dados para não conformidades...');
      
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

      // Verificar se eventsData é um array
      if (!Array.isArray(eventsData)) {
        console.error('Dados recebidos não são um array:', eventsData);
        setEvents([]);
        return;
      }

      // Filtrar apenas eventos do tipo Não conformidades para visualização padrão
      console.log('🗃️ DADOS BRUTOS RECEBIDOS DA API:', eventsData);
      
      const nonconformityEvents = eventsData.filter(event => {
        console.log(`Verificando evento ${event.id}:`, {
          category: event.category,
          isNonConformity: event.category === 'Não conformidades'
        });
        return event && event.category === 'Não conformidades';
      });
      
      console.log('✅ Eventos de não conformidade filtrados:', nonconformityEvents);
      console.log('📊 Total de eventos recebidos:', eventsData.length);
      console.log('🎯 Total de não conformidades:', nonconformityEvents.length);
      setEvents(nonconformityEvents); // Apenas eventos de não conformidade em vez de todos

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



      // Após o carregamento dos eventos, calcular estatísticas adicionais
      if (Array.isArray(nonconformityEvents)) {
        // Analisar estatísticas de riscos
        const risksStats = {
          low: 0,
          medium: 0, 
          high: 0
        };
        
        // Estatísticas de ação corretiva
        const acaoStats = {
          total: 0,
          completas: 0,
          pendentes: 0
        };
        
        // Contador de não conformidades recorrentes
        let recorrencias = 0;
        
        // Taxa de eficácia (eventos com eficácia verificada / total de eventos fechados)
        let eficaciaVerificada = 0;
        const eventosFechados = nonconformityEvents.filter(e => e.status === 'fechado').length;
        
        nonconformityEvents.forEach(event => {
          // Analisar nível de risco se disponível
          if (event.analise_riscos && event.analise_riscos.impacto) {
            const impacto = parseInt(event.analise_riscos.impacto);
            if (impacto <= 6) {
              risksStats.low++;
            } else if (impacto <= 15) {
              risksStats.medium++;
            } else {
              risksStats.high++;
            }
          }
          
          // Analisar dados de ação corretiva
          if (event.necessita_acao_corretiva) {
            acaoStats.total++;
            
            // Verificar se todas as ações do plano têm data
            if (event.plano_acao && Array.isArray(event.plano_acao)) {
              const todasAcoesCompletas = event.plano_acao.every(
                acao => acao.prazo && new Date(acao.prazo) < new Date()
              );
              
              if (todasAcoesCompletas) {
                acaoStats.completas++;
              } else {
                acaoStats.pendentes++;
              }
            }
          }
          
          // Verificar recorrência
          if (event.recorrente) {
            recorrencias++;
          }
          
          // Verificar eficácia
          if (event.status === 'fechado' && event.eficacia && event.eficacia.data) {
            eficaciaVerificada++;
          }
        });
        
        // Atualizar estados com as novas estatísticas
        setRisksByLevel(risksStats);
        setAcaoCorretivaStats(acaoStats);
        setRecorrenciaCount(recorrencias);
        setEfficacyRate(eventosFechados > 0 ? Math.round((eficaciaVerificada / eventosFechados) * 100) : 0);
      }
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

  const handleCreateNonconformity = async (formData) => {
    try {
      // Validar campos obrigatórios
      if (!formData.setorOcorrencia || !formData.relatoOcorrido) {
        throw new Error('Campos obrigatórios faltando');
      }

      console.log('Tentando criar não conformidade:', formData);
      console.log('Usuário atual:', user);

      // Determinar qual empresa está sendo usada
      let companySlug = '';
      if (user?.user_type === 'company') {
        companySlug = user.company_slug;
      }

        console.log('Criando NC para ASSOMASUL (company_id: 4)');
        
        // Preparar dados para envio - incluindo company_id para ASSOMASUL
        const dataToSend = {
          company_id: 4, // ASSOMASUL
          subject: `NC-${formData.numeroNC || 'SEM-NUMERO'} - Não Conformidade`,
          description: formData.relatoOcorrido,
          whoDidIt: formData.responsavelSolucao || 'Não informado',
          howItHappened: formData.solucaoImediata || 'Não informado',
          additionalInfo: JSON.stringify({
            setorVerificador: formData.setorVerificador,
            dataOcorrencia: formData.dataOcorrencia,
            prazoSolucao: formData.prazoSolucao,
            necessitaAcaoCorretiva: formData.necessitaAcaoCorretiva,
            acaoCorretiva: formData.acaoCorretiva,
            planoAcao: formData.planoAcao,
            observacoes: formData.obs,
            recorrente: formData.naoConformidadeRecorrente,
            ncsRecorrentes: formData.numNCsRecorrentes,
            mudancaSistema: formData.necessarioMudancaSistema,
            analiseRiscos: formData.analiseRiscos,
            eficacia: formData.eficacia
          }),
          setor: formData.setorOcorrencia
        };

        console.log('Dados que serão enviados:', dataToSend);
        
        // Criar a não conformidade usando a nova API geral
        const response = await fetch(`${API_BASE_URL}/nonconformities`, {
                  method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });

      console.log('Resposta do servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro do servidor:', errorText);
        throw new Error(`Falha ao criar não conformidade: ${response.status} - ${errorText}`);
      }

      console.log('Não conformidade criada com sucesso! Atualizando dados...');
      
      // Pequeno delay para garantir que o banco foi atualizado
      setTimeout(async () => {
        await fetchData();
      }, 500);
      
      setIsNonconformityFormModalOpen(false);
      showNotification('Não conformidade criada com sucesso!');
    } catch (err) {
      console.error('Erro ao criar não conformidade:', err);
      showNotification('Erro ao criar não conformidade: ' + err.message, 'error');
    }
  };

  const handleViewNonconformity = async (event) => {
    try {
      // Verificar se é uma não conformidade
      if (event.category !== 'Não conformidades') {
        throw new Error('Este evento não é uma não conformidade');
      }

      setLoading(true);
      
      console.log('Buscando não conformidade para evento:', event.company);
      
      // Usar a nova API geral de não conformidades, filtrando por empresa
      const endpoint = `${API_BASE_URL}/nonconformities?company=${encodeURIComponent(event.company)}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Falha ao buscar dados: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Procurar por uma não conformidade com data semelhante à do evento
      const eventDate = new Date(event.date).getTime();
      const item = data.find(d => {
        const itemDate = new Date(d.created_at).getTime();
        // Permitir uma diferença de até 2 minutos
        return Math.abs(eventDate - itemDate) < 2 * 60 * 1000;
      });
      
      if (item) {
        setSelectedNonconformity(item);
        setIsNonconformityViewModalOpen(true);
      } else {
        showNotification('Não foi possível encontrar detalhes para esta não conformidade', 'error');
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

  // DEBUG: Adicionar logs para entender o problema
  console.log('🔍 ESTADO ATUAL DOS DADOS:');
  console.log('Events array:', events);
  console.log('Events length:', events.length);
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('User:', user);

  // Filtrar eventos - Mostrar todos os eventos de não conformidades (temporariamente simplificado)
  const filteredEvents = events.filter(event => {
    const matchesSetor = selectedCategory === 'Todas as Categorias' || 
                        (event.setor && event.setor === selectedCategory);
                        
    // Temporariamente ignorar o filtro de status para resolver problema
    const matchesStatus = true;
                        
    const matchesSearch = !searchTerm || (event.company && event.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    console.log(`🔎 Evento ${event.id}:`, {
      event: event,
      matchesSetor,
      matchesStatus,
      matchesSearch,
      final: matchesSetor && matchesStatus && matchesSearch
    });
    
    return matchesSetor && matchesStatus && matchesSearch;
  });

  console.log('📋 RESULTADO FINAL:', {
    totalEvents: events.length,
    filteredEvents: filteredEvents.length,
    filteredEventsList: filteredEvents
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
    <div className="space-y-3">
      {/* Dashboard Header Compacto */}
      <div className="glass-card p-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold text-white mb-1">Dashboard de Não Conformidades</h1>
            <p className="text-white/70 max-w-3xl text-sm">
              Acompanhe indicadores de não conformidades, análise de riscos e eficácia das ações corretivas para melhoria contínua do SGQ.
            </p>
          </div>
          {(user?.user_type === 'admin' || hasPermission('nonconformities.create')) && (
            <button
              onClick={() => setIsNonconformityFormModalOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-lg px-6 py-3 shadow-lg transition-all flex items-center gap-3 text-base"
            >
              <PlusIcon className="h-5 w-5" />
              Nova NC
            </button>
          )}
        </div>
      </div>

      {/* Status Cards Principais */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          icon={DocumentTextIcon}
          title="Total de NCs"
          value={events.length.toString()}
          percentage={events.length > 0 ? 100 : 0}
          color="blue"
        />
        <StatusCard
          icon={ClockIcon}
          title="NCs Abertas"
          value={events.filter(e => e.status === 'aberto').length.toString()}
          percentage={events.length > 0 ? Math.round((events.filter(e => e.status === 'aberto').length / events.length) * 100) : 0}
          color="amber"
        />
        <StatusCard
          icon={CheckCircleIcon}
          title="NCs Fechadas"
          value={events.filter(e => e.status === 'fechado').length.toString()}
          percentage={events.length > 0 ? Math.round((events.filter(e => e.status === 'fechado').length / events.length) * 100) : 0}
          color="emerald"
        />
        <StatusCard
          icon={BeakerIcon}
          title="Taxa de Eficácia"
          value={`${efficacyRate}%`}
          color={efficacyRate > 70 ? "emerald" : efficacyRate > 40 ? "amber" : "blue"}
        />
      </div>
      
      {/* Status Cards - Análise de Riscos */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          icon={ScaleIcon}
          title="Risco Baixo"
          value={risksByLevel.low.toString()}
          percentage={events.length > 0 ? Math.round((risksByLevel.low / events.length) * 100) : 0}
          color="emerald"
        />
        <StatusCard
          icon={FireIcon}
          title="Risco Médio"
          value={risksByLevel.medium.toString()}
          percentage={events.length > 0 ? Math.round((risksByLevel.medium / events.length) * 100) : 0}
          color="amber"
        />
        <StatusCard
          icon={FireIcon}
          title="Risco Alto"
          value={risksByLevel.high.toString()}
          percentage={events.length > 0 ? Math.round((risksByLevel.high / events.length) * 100) : 0}
          color="blue"
        />
        <StatusCard
          icon={LightBulbIcon}
          title="Ações Corretivas"
          value={acaoCorretivaStats.total.toString()}
          percentage={events.length > 0 ? Math.round((acaoCorretivaStats.total / events.length) * 100) : 0}
          color="indigo"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-12">
        {/* Gráfico de Pizza - Distribuição por Setor */}
        <div className="h-[400px]">
          <DistributionChart 
            data={setores.map(setor => {
              // Usar dados reais - contar eventos por setor
              const count = events.filter(e => e.setor === setor).length;
              return {
                category: setor,
                count: count
              };
            }).filter(item => item.count > 0)}
            title="Distribuição por Setor" 
          />
        </div>

        {/* Gráfico de Status das NCs */}
        <div className="h-[400px]">
          <div className="glass-card rounded-2xl h-full">
            <div className="p-4 lg:p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Status das NCs</h3>
              <div className="flex-1 space-y-4">
                {/* Aberto */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-400"></div>
                    <span className="text-white/80 text-sm">Aberto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{
                          width: `${events.length > 0 ? (events.filter(e => e.status === 'aberto').length / events.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold text-sm min-w-[2rem]">
                      {events.filter(e => e.status === 'aberto').length}
                    </span>
                  </div>
                </div>

                {/* Fechado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <span className="text-white/80 text-sm">Fechado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-400 rounded-full transition-all"
                        style={{
                          width: `${events.length > 0 ? (events.filter(e => e.status === 'fechado').length / events.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold text-sm min-w-[2rem]">
                      {events.filter(e => e.status === 'fechado').length}
                    </span>
                  </div>
                </div>

                {/* Em Progresso */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-amber-400"></div>
                    <span className="text-white/80 text-sm">Em Progresso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{
                          width: `${events.length > 0 ? (events.filter(e => e.status === 'em-progresso').length / events.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold text-sm min-w-[2rem]">
                      {events.filter(e => e.status === 'em-progresso').length}
                    </span>
                  </div>
                </div>

                {/* Estatísticas Resumidas */}
                <div className="mt-auto pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {events.length > 0 ? Math.round((events.filter(e => e.status === 'fechado').length / events.length) * 100) : 0}%
                      </div>
                      <div className="text-xs text-white/60">Taxa de Resolução</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{efficacyRate}%</div>
                      <div className="text-xs text-white/60">Eficácia</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Análise de Riscos */}
        <div className="h-[400px]">
          <div className="glass-card rounded-2xl h-full">
            <div className="p-4 lg:p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Análise de Riscos</h3>
              <div className="flex-1 space-y-4">
                {/* Risco Alto */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-white/80 text-sm">Alto Risco</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{
                          width: `${events.length > 0 ? (risksByLevel.high / events.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold text-sm min-w-[1.5rem]">{risksByLevel.high}</span>
                  </div>
                </div>

                {/* Risco Médio */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                    <span className="text-white/80 text-sm">Médio Risco</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${events.length > 0 ? (risksByLevel.medium / events.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold text-sm min-w-[1.5rem]">{risksByLevel.medium}</span>
                  </div>
                </div>

                {/* Risco Baixo */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <span className="text-white/80 text-sm">Baixo Risco</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${events.length > 0 ? (risksByLevel.low / events.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold text-sm min-w-[1.5rem]">{risksByLevel.low}</span>
                  </div>
                </div>

                {/* Ações Corretivas */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white/90 mb-3">Ações Corretivas</h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="glass-effect rounded-lg p-2">
                      <div className="text-lg font-bold text-indigo-400">{acaoCorretivaStats.completas}</div>
                      <div className="text-xs text-white/60">Completas</div>
                    </div>
                    <div className="glass-effect rounded-lg p-2">
                      <div className="text-lg font-bold text-amber-400">{acaoCorretivaStats.pendentes}</div>
                      <div className="text-xs text-white/60">Pendentes</div>
                    </div>
                  </div>
                </div>

                {/* Recorrências */}
                <div className="glass-effect rounded-lg p-3 text-center mt-auto">
                  <div className="text-lg font-bold text-purple-400">{recorrenciaCount}</div>
                  <div className="text-xs text-white/60">NCs Recorrentes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events List Compacto */}
      <div className="glass-card mt-8">
        <div className="p-3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-bold text-white">Tratamento de Não Conformidade</h1>
            <div className="flex items-center gap-2">
              {hasPermission('nonconformities.create') && (
                <>
                  <button
                    onClick={() => setIsNonconformityFormModalOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-lg px-6 py-3 shadow-lg transition-all flex items-center gap-3 text-base"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Nova NC
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-white/80 text-xs font-medium mb-1">Setor onde ocorreu NC:</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="glass-input w-full rounded pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                >
                                  <option value="Todas as Categorias" className="bg-gray-800">Todos os Setores</option>
                                {setores.map(setor => (
                  <option key={setor} value={setor} className="bg-gray-800">{setor}</option>
                ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                  className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-white/80 text-xs font-medium mb-1">Setor que verificou:</label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="glass-input w-full rounded pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                >
                                  <option value="Todos os Status" className="bg-gray-800">Todos os Setores</option>
                                {setores.map(setor => (
                  <option key={setor} value={setor} className="bg-gray-800">{setor}</option>
                ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                  className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-white/80 text-xs font-medium mb-1">Data do Evento:</label>
              <div className="relative">
                <input
                  type="date"
                  className="glass-input w-full rounded pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                  className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
            </div>
            <div className="flex-[2]">
              <label className="block text-white/80 text-xs font-medium mb-1">Buscar:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar empresa ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full rounded pl-8 pr-3 py-1.5 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <svg 
                  className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-blue-400"
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
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-4 text-xs font-semibold text-white/90 w-[120px]">Data</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-white/90 w-[150px]">Tipo</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-white/90 w-[180px]">Empresa</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-white/90">Descrição</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-white/90 w-[160px]">Plano de Ação</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-white/90 w-[100px]">Eficácia</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-white/90 w-[100px]">Status</th>
                  <th className="text-right py-2 px-4 text-xs font-semibold text-white/90 w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-white/60">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                          className="w-12 h-12 mb-3 text-indigo-400/50">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        <p className="text-sm font-medium text-white/80 mb-1">Nenhuma não conformidade encontrada</p>
                        <p className="text-xs text-white/50 max-w-md text-center">
                          Tente ajustar os filtros de busca ou crie uma nova não conformidade.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr 
                      key={event.id} 
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-white">{new Date(event.date).toLocaleDateString()}</span>
                          <span className="text-xs text-blue-300/70 mt-0.5">{new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            event.category === 'Elogios' ? 'bg-emerald-400' :
                            event.category === 'Denúncias' ? 'bg-red-400' :
                            event.category === 'Reclamações' ? 'bg-orange-400' :
                            event.category === 'Não conformidades' ? 'bg-violet-400' :
                            'bg-blue-400'
                          }`}></span>
                          <span className="text-xs font-medium text-white">{event.category}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className="text-xs text-white font-medium">{event.company}</span>
                      </td>
                      <td className="py-2 px-4">
                        <p className="text-xs text-white/80 line-clamp-2">{event.description}</p>
                      </td>
                      <td className="py-2 px-4">
                        <div className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-400/10 text-indigo-300 text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Em progresso
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="inline-flex items-center px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pendente
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'aberto' 
                            ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30' 
                            : event.status === 'fechado'
                            ? 'bg-gray-400/10 text-gray-300 ring-1 ring-gray-400/30'
                            : 'bg-red-400/10 text-red-300 ring-1 ring-red-400/30'
                        }`}>
                          <span className={`w-1 h-1 rounded-full mr-1 ${
                            event.status === 'aberto' 
                              ? 'bg-emerald-400' 
                              : event.status === 'fechado'
                              ? 'bg-gray-400'
                              : 'bg-red-400'
                          }`}></span>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex justify-end gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                          {event.category === 'Não conformidades' && (
                            <button
                              onClick={() => handleViewNonconformity(event)}
                              className="p-1.5 text-white/90 hover:text-violet-400 hover:bg-violet-400/10 rounded-lg transition-all duration-150"
                              title="Ver Não Conformidade"
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
                                className="p-1.5 text-white/90 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-150"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="p-1.5 text-white/90 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-150"
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

      <NonconformityFormModal
        isOpen={isNonconformityFormModalOpen}
        onClose={() => setIsNonconformityFormModalOpen(false)}
        onSave={handleCreateNonconformity}
      />

      <NonconformityViewModal
        isOpen={isNonconformityViewModalOpen}
        onClose={() => {
          setIsNonconformityViewModalOpen(false);
          setSelectedNonconformity(null);
        }}
        nonconformity={selectedNonconformity}
      />
    </div>
  );
}