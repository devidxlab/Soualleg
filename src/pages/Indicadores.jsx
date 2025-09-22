import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TimelineChart from '../components/TimelineChart';
import IndicatorEditModal from '../components/IndicatorEditModal';
import { API_BASE_URL } from '../config';
// Ícones flat profissionais do React Icons
import { 
  MdThumbUp, 
  MdCheckCircle, 
  MdSchool, 
  MdSchedule, 
  MdSpeed,
  MdTrendingUp,
  MdEdit 
} from 'react-icons/md';

export default function Indicadores() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar dados do usuário
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Função para buscar indicadores
  const fetchIndicators = async () => {
    try {
      console.log('Buscando indicadores da API...');
      const response = await fetch(`${API_BASE_URL}/indicators`);
      if (response.ok) {
        const data = await response.json();
        console.log('Indicadores recebidos:', data);
        setIndicators(data);
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar indicadores:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Iniciando busca de dados para indicadores...');
      
      // Buscar eventos para timeline
      let eventsResponse;
      if (user?.user_type === 'company') {
        eventsResponse = await fetch(`${API_BASE_URL}/events?company=${user.company_name}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
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
      console.log('Eventos recebidos para indicadores:', eventsData);

      if (!Array.isArray(eventsData)) {
        console.error('Dados recebidos não são um array:', eventsData);
        setTimelineData([]);
        return;
      }

      // Prepare timeline data - usar todas as categorias para visão geral
      const categories = ['Cadastros', 'Elogios', 'Denúncias', 'Reclamações', 'Não conformidades'];
      const timelineStats = eventsData.reduce((acc, event) => {
        if (!event || !event.date || typeof event.date !== 'string') return acc;
        
        const date = event.date.split(' ')[0];
        const found = acc.find(item => item.date === date);
        
        if (found) {
          categories.forEach(category => {
            if (!found[category]) {
              found[category] = 0;
            }
          });
          found[event.category] = (found[event.category] || 0) + 1;
        } else {
          const newItem = { date };
          categories.forEach(category => {
            newItem[category] = 0;
          });
          newItem[event.category] = 1;
          acc.push(newItem);
        }
        return acc;
      }, []);

      timelineStats.sort((a, b) => new Date(a.date) - new Date(b.date));
      setTimelineData(timelineStats);
    } catch (err) {
      console.error('Erro ao buscar dados dos indicadores:', err);
      setError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('Usuário carregado:', user);
      fetchData();
      fetchIndicators();
    }
  }, [user]);

  // Log para debug dos indicadores
  useEffect(() => {
    console.log('Estado dos indicadores:', indicators);
  }, [indicators]);

  // Função para abrir modal de edição
  const handleEditIndicator = (indicatorName) => {
    const indicator = indicators.find(ind => ind.name === indicatorName);
    if (indicator) {
      setSelectedIndicator(indicator);
      setEditModalOpen(true);
    }
  };

  // Função para salvar indicador
  const handleSaveIndicator = async (updatedData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/indicators/${updatedData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_value: updatedData.current_value,
          target_value: updatedData.target_value
        })
      });

      if (response.ok) {
        await fetchIndicators(); // Recarrega os indicadores
      } else {
        throw new Error('Erro ao salvar indicador');
      }
    } catch (error) {
      console.error('Erro ao salvar indicador:', error);
      throw error;
    }
  };

  // Função para obter dados do indicador
  const getIndicatorData = (name) => {
    console.log(`Buscando indicador: ${name}`);
    console.log('Indicadores disponíveis:', indicators.map(ind => ind.name));
    const indicator = indicators.find(ind => ind.name === name);
    console.log(`Indicador encontrado para ${name}:`, indicator);
    return indicator || { current_value: 0, target_value: 100, unit: '%' };
  };

  const getIndicatorById = (indicatorId) => {
    const indicator = indicators.find(ind => ind.id === indicatorId);
    return indicator || { current_value: 0, target_value: 0, unit: '' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Carregando indicadores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-black mb-2">Indicadores</h1>
        <p className="text-black/70">Acompanhe indicadores de desempenho e métricas do sistema</p>
      </div>

      {/* Indicadores vs Metas - Reformulado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl overflow-hidden h-full">
            <div className="p-6 h-full flex flex-col">
              <h2 className="text-lg lg:text-xl font-semibold text-white mb-6">Indicadores vs Metas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Indicador 1 - Satisfação */}
                <div className="glass-effect rounded-xl p-6 text-center relative group">
                  <button
                    onClick={() => handleEditIndicator('Satisfação dos Municípios')}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 p-1 rounded"
                  >
                    <MdEdit className="text-blue-400 text-sm" />
                  </button>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-emerald-500/20 p-3 rounded-full">
                      <MdThumbUp className="text-emerald-400 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-2">Satisfação dos Municípios</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-emerald-400">{getIndicatorData('Satisfação dos Municípios').current_value}{getIndicatorData('Satisfação dos Municípios').unit}</span>
                    <span className="text-sm text-white/50">/ {getIndicatorData('Satisfação dos Municípios').target_value}{getIndicatorData('Satisfação dos Municípios').unit}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-emerald-400 h-2 rounded-full" style={{width: `${Math.min((getIndicatorData('Satisfação dos Municípios').current_value / getIndicatorData('Satisfação dos Municípios').target_value) * 100, 100)}%`}}></div>
                  </div>
                  <span className={`text-xs font-medium ${
                    getIndicatorData('Satisfação dos Municípios').current_value >= getIndicatorData('Satisfação dos Municípios').target_value 
                      ? 'text-emerald-400' 
                      : getIndicatorData('Satisfação dos Municípios').current_value >= getIndicatorData('Satisfação dos Municípios').target_value * 0.8 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                  }`}>
                    {getIndicatorData('Satisfação dos Municípios').current_value >= getIndicatorData('Satisfação dos Municípios').target_value 
                      ? '✓ Acima da Meta' 
                      : getIndicatorData('Satisfação dos Municípios').current_value >= getIndicatorData('Satisfação dos Municípios').target_value * 0.8 
                        ? '◐ Dentro da Meta' 
                        : '✗ Abaixo da Meta'
                    }
                  </span>
                </div>

                {/* Indicador 2 - Eficácia */}
                <div className="glass-effect rounded-xl p-6 text-center relative group">
                  <button
                    onClick={() => handleEditIndicator('Eficácia de NC')}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 p-1 rounded"
                  >
                    <MdEdit className="text-blue-400 text-sm" />
                  </button>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      <MdCheckCircle className="text-amber-400 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-2">Eficácia de NC</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-amber-400">{getIndicatorData('Eficácia de NC').current_value}{getIndicatorData('Eficácia de NC').unit}</span>
                    <span className="text-sm text-white/50">/ {getIndicatorData('Eficácia de NC').target_value}{getIndicatorData('Eficácia de NC').unit}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-amber-400 h-2 rounded-full" style={{width: `${Math.min((getIndicatorData('Eficácia de NC').current_value / getIndicatorData('Eficácia de NC').target_value) * 100, 100)}%`}}></div>
                  </div>
                  <span className={`text-xs font-medium ${
                    getIndicatorData('Eficácia de NC').current_value >= getIndicatorData('Eficácia de NC').target_value 
                      ? 'text-emerald-400' 
                      : getIndicatorData('Eficácia de NC').current_value >= getIndicatorData('Eficácia de NC').target_value * 0.8 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                  }`}>
                    {getIndicatorData('Eficácia de NC').current_value >= getIndicatorData('Eficácia de NC').target_value 
                      ? '✓ Acima da Meta' 
                      : getIndicatorData('Eficácia de NC').current_value >= getIndicatorData('Eficácia de NC').target_value * 0.8 
                        ? '⚠ Abaixo da Meta' 
                        : '✗ Muito Abaixo'
                    }
                  </span>
                </div>

                {/* Indicador 3 - Capacitações */}
                <div className="glass-effect rounded-xl p-6 text-center relative group">
                  <button
                    onClick={() => handleEditIndicator('Capacitações')}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 p-1 rounded"
                  >
                    <MdEdit className="text-blue-400 text-sm" />
                  </button>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-emerald-500/20 p-3 rounded-full">
                      <MdSchool className="text-emerald-400 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-2">Capacitações</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-emerald-400">{getIndicatorData('Capacitações').current_value}</span>
                    <span className="text-sm text-white/50">/ {getIndicatorData('Capacitações').target_value}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-emerald-400 h-2 rounded-full" style={{width: `${Math.min((getIndicatorData('Capacitações').current_value / getIndicatorData('Capacitações').target_value) * 100, 100)}%`}}></div>
                  </div>
                  <span className={`text-xs font-medium ${
                    getIndicatorData('Capacitações').current_value >= getIndicatorData('Capacitações').target_value 
                      ? 'text-emerald-400' 
                      : getIndicatorData('Capacitações').current_value >= getIndicatorData('Capacitações').target_value * 0.8 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                  }`}>
                    {getIndicatorData('Capacitações').current_value >= getIndicatorData('Capacitações').target_value 
                      ? '✓ Acima da Meta' 
                      : getIndicatorData('Capacitações').current_value >= getIndicatorData('Capacitações').target_value * 0.8 
                        ? '◐ Dentro da Meta' 
                        : '✗ Abaixo da Meta'
                    }
                  </span>
                </div>

                {/* Indicador 4 - Cumprimento de Prazos */}
                <div className="glass-effect rounded-xl p-6 text-center relative group">
                  <button
                    onClick={() => handleEditIndicator('Cumprimento Prazos')}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 p-1 rounded"
                  >
                    <MdEdit className="text-blue-400 text-sm" />
                  </button>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      <MdSchedule className="text-amber-400 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-2">Cumprimento Prazos</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-amber-400">{getIndicatorData('Cumprimento Prazos').current_value}{getIndicatorData('Cumprimento Prazos').unit}</span>
                    <span className="text-sm text-white/50">/ {getIndicatorData('Cumprimento Prazos').target_value}{getIndicatorData('Cumprimento Prazos').unit}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-amber-400 h-2 rounded-full" style={{width: `${Math.min((getIndicatorData('Cumprimento Prazos').current_value / getIndicatorData('Cumprimento Prazos').target_value) * 100, 100)}%`}}></div>
                  </div>
                  <span className={`text-xs font-medium ${
                    getIndicatorData('Cumprimento Prazos').current_value >= getIndicatorData('Cumprimento Prazos').target_value 
                      ? 'text-emerald-400' 
                      : getIndicatorData('Cumprimento Prazos').current_value >= getIndicatorData('Cumprimento Prazos').target_value * 0.8 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                  }`}>
                    {getIndicatorData('Cumprimento Prazos').current_value >= getIndicatorData('Cumprimento Prazos').target_value 
                      ? '✓ Acima da Meta' 
                      : getIndicatorData('Cumprimento Prazos').current_value >= getIndicatorData('Cumprimento Prazos').target_value * 0.8 
                        ? '⚠ Abaixo da Meta' 
                        : '✗ Muito Abaixo'
                    }
                  </span>
                </div>

                {/* Indicador 5 - Tempo Resposta */}
                <div className="glass-effect rounded-xl p-6 text-center relative group">
                  <button
                    onClick={() => handleEditIndicator('Tempo Resposta')}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 p-1 rounded"
                  >
                    <MdEdit className="text-blue-400 text-sm" />
                  </button>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-500/20 p-3 rounded-full">
                      <MdSpeed className="text-blue-400 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-2">Tempo Resposta</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-blue-400">{getIndicatorData('Tempo Resposta').current_value}{getIndicatorData('Tempo Resposta').unit}</span>
                    <span className="text-sm text-white/50">/ {getIndicatorData('Tempo Resposta').target_value}{getIndicatorData('Tempo Resposta').unit}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{width: `${Math.min((getIndicatorData('Tempo Resposta').current_value / getIndicatorData('Tempo Resposta').target_value) * 100, 100)}%`}}></div>
                  </div>
                  <span className={`text-xs font-medium ${
                    getIndicatorData('Tempo Resposta').current_value >= getIndicatorData('Tempo Resposta').target_value 
                      ? 'text-emerald-400' 
                      : getIndicatorData('Tempo Resposta').current_value >= getIndicatorData('Tempo Resposta').target_value * 0.8 
                        ? 'text-blue-400' 
                        : 'text-red-400'
                  }`}>
                    {getIndicatorData('Tempo Resposta').current_value >= getIndicatorData('Tempo Resposta').target_value 
                      ? '✓ Acima da Meta' 
                      : getIndicatorData('Tempo Resposta').current_value >= getIndicatorData('Tempo Resposta').target_value * 0.8 
                        ? '✓ Dentro da Meta' 
                        : '✗ Abaixo da Meta'
                    }
                  </span>
                </div>

                {/* Indicador 6 - Alcance */}
                <div className="glass-effect rounded-xl p-6 text-center relative group">
                  <button
                    onClick={() => handleEditIndicator('Alcance Publicações')}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 p-1 rounded"
                  >
                    <MdEdit className="text-blue-400 text-sm" />
                  </button>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      <MdTrendingUp className="text-amber-400 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-2">Alcance Publicações</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-amber-400">{getIndicatorData('Alcance Publicações').current_value}{getIndicatorData('Alcance Publicações').unit}</span>
                    <span className="text-sm text-white/50">/ {getIndicatorData('Alcance Publicações').target_value}{getIndicatorData('Alcance Publicações').unit}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-amber-400 h-2 rounded-full" style={{width: `${Math.min((getIndicatorData('Alcance Publicações').current_value / getIndicatorData('Alcance Publicações').target_value) * 100, 100)}%`}}></div>
                  </div>
                  <span className={`text-xs font-medium ${
                    getIndicatorData('Alcance Publicações').current_value >= getIndicatorData('Alcance Publicações').target_value 
                      ? 'text-emerald-400' 
                      : getIndicatorData('Alcance Publicações').current_value >= getIndicatorData('Alcance Publicações').target_value * 0.8 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                  }`}>
                    {getIndicatorData('Alcance Publicações').current_value >= getIndicatorData('Alcance Publicações').target_value 
                      ? '✓ Acima da Meta' 
                      : getIndicatorData('Alcance Publicações').current_value >= getIndicatorData('Alcance Publicações').target_value * 0.8 
                        ? '⚠ Abaixo da Meta' 
                        : '✗ Muito Abaixo'
                    }
                  </span>
                </div>
              </div>
              
              {/* Legenda */}
              <div className="mt-6 flex justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-white/70">Acima/Meta Atingida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="text-white/70">Abaixo da Meta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-white/70">Dentro da Meta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {editModalOpen && selectedIndicator && (
        <IndicatorEditModal
          indicator={selectedIndicator}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedIndicator(null);
          }}
          onSave={handleSaveIndicator}
        />
      )}

      {/* Plano de Ação 5W2H Timeline */}
      <div className="glass-card rounded-2xl">
        <div className="p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold text-white mb-8">Plano de Ação 5W2H - Timeline</h2>
          
          {/* Timeline responsiva organizada */}
          <div className="relative">
            
            {/* Timeline Items em Grid responsivo */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-6 py-8">
              
              {/* Item 1 - DOCUMENTAÇÃO (já concluída - primeiro na timeline) */}
              <div className="flex flex-col items-center space-y-6 md:space-y-4">
                {/* Card acima da linha (desktop) / normal (mobile) */}
                <div className="order-2 md:order-1 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-4 text-center w-full max-w-52 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="text-emerald-300 font-bold text-sm mb-2">DOCUMENTAÇÃO</div>
                  <div className="text-white text-xs leading-relaxed mb-2">Manter e documentar procedimentos</div>
                  <div className="text-emerald-400 text-xs">Facilitar consultas e aplicações</div>
                </div>
                
                {/* Conector */}
                <div className="order-1 md:order-2 flex flex-col items-center">
                  <div className="hidden md:block w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-emerald-500"></div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-sm">2024</span>
                  </div>
                  <div className="md:hidden w-1 h-10 bg-emerald-500 rounded-full"></div>
                </div>
                
                {/* Status badge */}
                <div className="order-3">
                  <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30">
                    ✅ Concluída
                  </span>
                </div>
              </div>

              {/* Item 2 - IMPLEMENTAÇÃO */}
              <div className="flex flex-col items-center space-y-6 md:space-y-4">
                {/* Status badge (aparece primeiro no mobile, depois no desktop) */}
                <div className="order-1 md:order-3">
                  <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30">
                    ✓ Em progresso
                  </span>
                </div>
                
                {/* Conector */}
                <div className="order-2 md:order-2 flex flex-col items-center">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-amber-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-sm">2025</span>
                  </div>
                  <div className="hidden md:block w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-amber-400"></div>
                  <div className="md:hidden w-1 h-10 bg-amber-400 rounded-full"></div>
                </div>
                
                {/* Card abaixo da linha (desktop) / normal (mobile) */}
                <div className="order-3 md:order-1 bg-amber-400/10 backdrop-blur-sm border border-amber-400/30 rounded-lg p-4 text-center w-full max-w-52 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="text-amber-300 font-bold text-sm mb-2">IMPLEMENTAÇÃO</div>
                  <div className="text-white text-xs leading-relaxed mb-2">Implantar SGQ baseado na ISO 9001</div>
                  <div className="text-amber-400 text-xs">Melhorar gestão e padronização</div>
                </div>
              </div>

              {/* Item 3 - CAPACITAÇÃO */}
              <div className="flex flex-col items-center space-y-6 md:space-y-4">
                {/* Card acima da linha (desktop) / normal (mobile) */}
                <div className="order-2 md:order-1 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 text-center w-full max-w-52 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="text-red-300 font-bold text-sm mb-2">CAPACITAÇÃO</div>
                  <div className="text-white text-xs leading-relaxed mb-2">Criar núcleo de capacitação para prefeitos</div>
                  <div className="text-red-400 text-xs">Suprir demanda por formação</div>
                </div>
                
                {/* Conector */}
                <div className="order-1 md:order-2 flex flex-col items-center">
                  <div className="hidden md:block w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-500"></div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-sm">2025</span>
                  </div>
                  <div className="md:hidden w-1 h-10 bg-red-500 rounded-full"></div>
                </div>
                
                {/* Status badge */}
                <div className="order-3">
                  <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-red-400/10 text-red-300 ring-1 ring-red-400/30">
                    ⏳ Planejado
                  </span>
                </div>
              </div>

              {/* Item 4 - MONITORAMENTO */}
              <div className="flex flex-col items-center space-y-6 md:space-y-4">
                {/* Status badge (aparece primeiro no mobile, depois no desktop) */}
                <div className="order-1 md:order-3">
                  <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-pink-400/10 text-pink-300 ring-1 ring-pink-400/30">
                    📋 Preparação
                  </span>
                </div>
                
                {/* Conector */}
                <div className="order-2 md:order-2 flex flex-col items-center">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-pink-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-sm">2025</span>
                  </div>
                  <div className="hidden md:block w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-pink-500"></div>
                  <div className="md:hidden w-1 h-10 bg-pink-500 rounded-full"></div>
                </div>
                
                {/* Card abaixo da linha (desktop) / normal (mobile) */}
                <div className="order-3 md:order-1 bg-pink-500/10 backdrop-blur-sm border border-pink-500/30 rounded-lg p-4 text-center w-full max-w-52 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="text-pink-300 font-bold text-sm mb-2">MONITORAMENTO</div>
                  <div className="text-white text-xs leading-relaxed mb-2">Estabelecer sistema de indicadores</div>
                  <div className="text-pink-400 text-xs">Monitorar desempenho institucional</div>
                </div>
              </div>

              {/* Item 5 - COMUNICAÇÃO */}
              <div className="flex flex-col items-center space-y-6 md:space-y-4">
                {/* Card acima da linha (desktop) / normal (mobile) */}
                <div className="order-2 md:order-1 bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 text-center w-full max-w-52 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="text-purple-300 font-bold text-sm mb-2">COMUNICAÇÃO</div>
                  <div className="text-white text-xs leading-relaxed mb-2">Melhorar comunicação com associados</div>
                  <div className="text-purple-400 text-xs">Engajamento e fidelização</div>
                </div>
                
                {/* Conector */}
                <div className="order-1 md:order-2 flex flex-col items-center">
                  <div className="hidden md:block w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-purple-500"></div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-sm">2025</span>
                  </div>
                  <div className="md:hidden w-1 h-10 bg-purple-500 rounded-full"></div>
                </div>
                
                {/* Status badge */}
                <div className="order-3">
                  <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-purple-400/10 text-purple-300 ring-1 ring-purple-400/30">
                    🎯 Definindo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}