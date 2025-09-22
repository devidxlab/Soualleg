import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiGoogledocs, SiGooglesheets, SiGoogleslides, SiAdobeacrobatreader } from "react-icons/si";
import { FaFolder, FaArrowLeft, FaList, FaThLarge, FaSortAlphaDown, FaSortAlphaUp, FaSortAmountDown } from "react-icons/fa";
import { API_BASE_URL } from '../config';

// Ícones do Google
const icons = {
  'document': <SiGoogledocs size={32} className="text-[#2196F3]" />,
  'spreadsheet': <SiGooglesheets size={32} className="text-[#0F9D58]" />,
  'presentation': <SiGoogleslides size={32} className="text-[#FF9800]" />,
  'pdf': <SiAdobeacrobatreader size={32} className="text-[#D32F2F]" />,
  'folder': <FaFolder size={32} className="text-[#FFD54F]" />,
  'default': <SiGoogledocs size={32} className="text-[#757575]" />
};

function getIcon(mimeType) {
  if (mimeType === 'application/vnd.google-apps.folder') return icons.folder;
  if (mimeType.includes('spreadsheet')) return icons.spreadsheet;
  if (mimeType.includes('presentation')) return icons.presentation;
  if (mimeType.includes('pdf')) return icons.pdf;
  if (mimeType.includes('document')) return icons.document;
  return icons.default;
}

export default function Documentacao() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [pastaAtual, setPastaAtual] = useState(null);
  const [historicoPastas, setHistoricoPastas] = useState([]);
  const [caminhoPasta, setCaminhoPasta] = useState('ALLEG');
  
  // Estados para controle de visualização e ordenação
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'type'

  useEffect(() => {
    // Carregar dados do usuário e verificar permissões
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Verificar se o usuário tem permissão para acessar documentação
      if (!parsedUser.can_view_documentacao) {
        // Redirecionar para a primeira página que o usuário tem acesso
        if (parsedUser.can_view_denuncias) {
          navigate('/dashboard');
        } else if (parsedUser.can_view_naoconformidades) {
          navigate('/naoconformidades');
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

  const navegarParaPasta = async (pasta) => {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`${API_BASE_URL}/documentacao/drive?folderId=${pasta.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setArquivos(Array.isArray(data) ? data : []);
      setPastaAtual(pasta);
      setHistoricoPastas([...historicoPastas, pasta]);
      setCaminhoPasta(caminhoPasta + ' / ' + pasta.name);
    } catch (err) {
      console.error('Erro ao navegar para pasta:', err);
      setErro(`Não foi possível carregar os arquivos da pasta ${pasta.name}. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const voltarPasta = async () => {
    if (historicoPastas.length <= 1) {
      // Voltar para a pasta raiz (ALLEG)
      fetchArquivosRaiz();
      return;
    }
    
    // Remover a pasta atual do histórico
    const novoHistorico = [...historicoPastas];
    novoHistorico.pop(); // Remove a pasta atual
    const pastaAnterior = novoHistorico[novoHistorico.length - 1]; // Pega a pasta anterior
    
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`${API_BASE_URL}/documentacao/drive?folderId=${pastaAnterior.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setArquivos(Array.isArray(data) ? data : []);
      setPastaAtual(pastaAnterior);
      setHistoricoPastas(novoHistorico);
      
      // Atualizar o caminho
      const novoCaminho = caminhoPasta.split(' / ');
      novoCaminho.pop();
      setCaminhoPasta(novoCaminho.join(' / '));
    } catch (err) {
      console.error('Erro ao voltar para pasta anterior:', err);
      setErro(`Não foi possível voltar para a pasta anterior. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchArquivosRaiz = async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`${API_BASE_URL}/documentacao/drive`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setArquivos(Array.isArray(data) ? data : []);
      setPastaAtual(null);
      setHistoricoPastas([]);
      setCaminhoPasta('ALLEG');
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setErro(`Não foi possível carregar os arquivos da pasta ALLEG. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArquivosRaiz();
  }, []);

  // Ordenar arquivos baseado na opção selecionada
  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      // Função auxiliar para extrair número do início do nome
      const extractLeadingNumber = (name) => {
        const match = name.match(/^(\d+)\./);
        return match ? parseInt(match[1], 10) : null;
      };

      if (sortBy === 'name-asc') {
        const numA = extractLeadingNumber(a.name);
        const numB = extractLeadingNumber(b.name);
        
        // Se ambos começam com números, ordenar numericamente
        if (numA !== null && numB !== null) {
          return numA - numB;
        }
        // Se apenas um começa com número, colocar números primeiro
        else if (numA !== null) return -1;
        else if (numB !== null) return 1;
        // Caso contrário, ordenação alfabética padrão
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        const numA = extractLeadingNumber(a.name);
        const numB = extractLeadingNumber(b.name);
        
        // Se ambos começam com números, ordenar numericamente (decrescente)
        if (numA !== null && numB !== null) {
          return numB - numA;
        }
        // Se apenas um começa com número, colocar números primeiro (na ordem inversa)
        else if (numA !== null) return 1;
        else if (numB !== null) return -1;
        // Caso contrário, ordenação alfabética inversa
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'type') {
        // Primeiro ordenar por tipo (pasta ou arquivo)
        if (a.mimeType === 'application/vnd.google-apps.folder' && b.mimeType !== 'application/vnd.google-apps.folder') {
          return -1;
        } else if (a.mimeType !== 'application/vnd.google-apps.folder' && b.mimeType === 'application/vnd.google-apps.folder') {
          return 1;
        } else {
          // Dentro do mesmo tipo, ordenar por números se existirem
          const numA = extractLeadingNumber(a.name);
          const numB = extractLeadingNumber(b.name);
          
          if (numA !== null && numB !== null) {
            return numA - numB;
          }
          else if (numA !== null) return -1;
          else if (numB !== null) return 1;
          return a.name.localeCompare(b.name);
        }
      }
      return 0;
    });
  };

  // Separar pastas e arquivos para exibição
  const pastas = sortItems(arquivos.filter(item => item.mimeType === 'application/vnd.google-apps.folder'));
  const arquivosComuns = sortItems(arquivos.filter(item => item.mimeType !== 'application/vnd.google-apps.folder'));

  return (
    <div className="docs-special space-y-6">
      <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-sm p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Documentação</h1>
          
          {/* Botões de Visualização e Ordenação */}
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/20' : 'hover:bg-white/5'} transition-colors`}
                title="Visualização em Grade"
              >
                <FaThLarge className="text-white/80" size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/20' : 'hover:bg-white/5'} transition-colors`}
                title="Visualização em Lista"
              >
                <FaList className="text-white/80" size={16} />
              </button>
            </div>
            
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button 
                onClick={() => setSortBy('name-asc')}
                className={`p-2 rounded ${sortBy === 'name-asc' ? 'bg-white/20' : 'hover:bg-white/5'} transition-colors`}
                title="Ordenar por Nome (A-Z)"
              >
                <FaSortAlphaDown className="text-white/80" size={16} />
              </button>
              <button 
                onClick={() => setSortBy('name-desc')}
                className={`p-2 rounded ${sortBy === 'name-desc' ? 'bg-white/20' : 'hover:bg-white/5'} transition-colors`}
                title="Ordenar por Nome (Z-A)"
              >
                <FaSortAlphaUp className="text-white/80" size={16} />
              </button>
              <button 
                onClick={() => setSortBy('type')}
                className={`p-2 rounded ${sortBy === 'type' ? 'bg-white/20' : 'hover:bg-white/5'} transition-colors`}
                title="Ordenar por Tipo"
              >
                <FaSortAmountDown className="text-white/80" size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center text-white/80 mb-4">
          <span className="font-medium">Pasta atual:</span> 
          <span className="ml-2">{caminhoPasta}</span>
          {historicoPastas.length > 0 && (
            <button 
              onClick={voltarPasta}
              className="ml-4 flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
            >
              <FaArrowLeft size={12} />
              <span>Voltar</span>
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : erro ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">Erro ao carregar documentos</h3>
            <p>{erro}</p>
            <button 
              onClick={fetchArquivosRaiz} 
              className="mt-4 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          arquivos.length === 0 ? (
            <div className="text-white/60">Nenhum arquivo encontrado nesta pasta.</div>
          ) : (
            <>
              {/* Pastas */}
              {pastas.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white/90 mb-3">Pastas</h2>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {pastas.map(pasta => (
                        <div
                          key={pasta.id}
                          onClick={() => navegarParaPasta(pasta)}
                          className="block bg-white/10 hover:bg-white/20 transition-all duration-200 rounded-xl shadow-lg p-6 cursor-pointer group border border-white/10"
                        >
                          <div className="flex items-center gap-4 mb-2">
                            {getIcon(pasta.mimeType)}
                            <span className="font-semibold text-white text-lg truncate group-hover:underline">
                              {pasta.name}
                            </span>
                          </div>
                          <div className="text-xs text-white/50">Pasta</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      {pastas.map(pasta => (
                        <div
                          key={pasta.id}
                          onClick={() => navegarParaPasta(pasta)}
                          className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0 group"
                        >
                          {getIcon(pasta.mimeType)}
                          <div className="flex-1">
                            <div className="font-medium text-white group-hover:underline">
                              {pasta.name}
                            </div>
                            <div className="text-xs text-white/50">Pasta</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Arquivos */}
              {arquivosComuns.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-white/90 mb-3">Arquivos</h2>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {arquivosComuns.map(arquivo => {
                        const link = arquivo.webViewLink || `https://drive.google.com/file/d/${arquivo.id}/view`;
                        return (
                          <a
                            key={arquivo.id}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/10 hover:bg-white/20 transition-all duration-200 rounded-xl shadow-lg p-6 cursor-pointer group border border-white/10"
                            style={{ textDecoration: 'none' }}
                            title={arquivo.name}
                          >
                            <div className="flex items-center gap-4 mb-2">
                              {getIcon(arquivo.mimeType)}
                              <span className="font-semibold text-white text-lg truncate group-hover:underline">
                                {arquivo.name}
                              </span>
                            </div>
                            <div className="text-xs text-white/50 truncate">{arquivo.mimeType}</div>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      {arquivosComuns.map(arquivo => {
                        const link = arquivo.webViewLink || `https://drive.google.com/file/d/${arquivo.id}/view`;
                        return (
                          <a
                            key={arquivo.id}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0 group"
                            style={{ textDecoration: 'none' }}
                            title={arquivo.name}
                          >
                            {getIcon(arquivo.mimeType)}
                            <div className="flex-1">
                              <div className="font-medium text-white group-hover:underline">
                                {arquivo.name}
                              </div>
                              <div className="text-xs text-white/50 truncate">{arquivo.mimeType}</div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
} 