import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

// Setores disponíveis para NC
const setores = ['Compras', 'Comunicação', 'Diário', 'Financeiro', 'Projetos', 'Recepção', 'RH', 'SGQ'];

export default function NonconformityFormModal({ isOpen, onClose, onSave, editData = null }) {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [relatoFiles, setRelatoFiles] = useState([]);
  const [planoFiles, setPlanoFiles] = useState([]);
  const [formData, setFormData] = useState({
    numeroNC: '',
    setorOcorrencia: 'Compras',
    setorVerificador: 'Compras',
    dataOcorrencia: new Date().toISOString().split('T')[0],
    relatoOcorrido: '',
    solucaoImediata: '',
    responsavelSolucao: '',
    necessitaAcaoCorretiva: 'SIM',
    
    acaoCorretiva: {
      consequencias: '',
      causas: '',
    },
    
    planoAcao: [
      { planoAcao: '', responsavel: '', prazo: '' },
      { planoAcao: '', responsavel: '', prazo: '' },
      { planoAcao: '', responsavel: '', prazo: '' }
    ],
    
    obs: '',
    naoConformidadeRecorrente: false,
    numNCsRecorrentes: '',
    necessarioMudancaSistema: false,
    
    analiseRiscos: {
      probabilidade: 2,
      consequencia: 3,
      impacto: 6
    },
    
    eficacia: {
      responsavel: '',
      data: ''
    }
  });

  useEffect(() => {
    // Carregar dados do usuário
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Se for admin, buscar lista de empresas
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/companies`);
        if (!response.ok) throw new Error('Falha ao carregar empresas');
        const data = await response.json();
        setCompanies(data);
      } catch (err) {
        console.error('Erro ao buscar empresas:', err);
      }
    };

    if (JSON.parse(userData)?.user_type === 'admin') {
      fetchCompanies();
    }
    
    // Se estiver editando, preencher o formulário com os dados
    if (editData) {
      setFormData({
        ...formData,
        ...editData
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: type === 'checkbox' ? checked : value
        }
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handlePlanoAcaoChange = (index, field, value) => {
    const newPlanoAcao = [...formData.planoAcao];
    newPlanoAcao[index] = {
      ...newPlanoAcao[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      planoAcao: newPlanoAcao
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Preparar dados para envio
      const nonconformityData = {
        ...formData,
        created_at: new Date().toISOString()
      };
      
      await onSave(nonconformityData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar não conformidade:', error);
      alert('Erro ao registrar não conformidade. Por favor, tente novamente.');
    }
  };



  useEffect(() => {
    const probabilidade = parseInt(formData.analiseRiscos.probabilidade);
    const consequencia = parseInt(formData.analiseRiscos.consequencia);
    const novoImpacto = probabilidade * consequencia;
    
    if (formData.analiseRiscos.impacto !== novoImpacto) {
      setFormData(prev => ({
        ...prev,
        analiseRiscos: {
          ...prev.analiseRiscos,
          impacto: novoImpacto
        }
      }));
    }
  }, [formData.analiseRiscos.probabilidade, formData.analiseRiscos.consequencia]);

  // Limpar estados quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      setRelatoFiles([]);
      setPlanoFiles([]);
      // Reset do formulário apenas se não estiver editando
      if (!editData) {
        setFormData({
          numeroNC: '',
          setorOcorrencia: 'Compras',
          setorVerificador: 'Compras',
          dataOcorrencia: new Date().toISOString().split('T')[0],
          relatoOcorrido: '',
          solucaoImediata: '',
          responsavelSolucao: '',
          necessitaAcaoCorretiva: 'SIM',
          acaoCorretiva: {
            consequencias: '',
            causas: '',
          },
          planoAcao: [
            { planoAcao: '', responsavel: '', prazo: '' },
            { planoAcao: '', responsavel: '', prazo: '' },
            { planoAcao: '', responsavel: '', prazo: '' }
          ],
          obs: '',
          naoConformidadeRecorrente: false,
          numNCsRecorrentes: '',
          necessarioMudancaSistema: false,
          analiseRiscos: {
            probabilidade: 2,
            consequencia: 3,
            impacto: 6
          },
          eficacia: {
            responsavel: '',
            data: ''
          }
        });
      }
    }
  }, [isOpen, editData]);

  // Função para gerar número sequencial automático
  const generateNCNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const hours = String(new Date().getHours()).padStart(2, '0');
    const minutes = String(new Date().getMinutes()).padStart(2, '0');
    return `NC-${year}${month}${day}-${hours}${minutes}`;
  };

  // Inicializar número da NC automaticamente
  useEffect(() => {
    if (!editData && isOpen) {
      const numero = generateNCNumber();
      setFormData(prev => ({
        ...prev,
        numeroNC: numero
      }));
    }
  }, [isOpen, editData]);

  // Função para lidar com upload de arquivos do relato
  const handleRelatoFileChange = (e) => {
    const files = Array.from(e.target.files);
    setRelatoFiles(prev => [...prev, ...files]);
  };

  // Função para lidar com upload de arquivos do plano de ação
  const handlePlanoFileChange = (e) => {
    const files = Array.from(e.target.files);
    setPlanoFiles(prev => [...prev, ...files]);
  };

  // Função para remover arquivo do relato
  const removeRelatoFile = (index) => {
    setRelatoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Função para remover arquivo do plano
  const removePlanoFile = (index) => {
    setPlanoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Função para preencher com dados fake para testes


  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-800/80 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-5xl">
                {/* Botão Fechar */}
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none transition-colors z-10"
                  onClick={onClose}
                >
                  <span className="sr-only">Fechar</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>

                
                <form onSubmit={handleSubmit} className="bg-white">
                  {/* Cabeçalho do formulário */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-8 flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <DocumentTextIcon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Registro de Não Conformidade
                      </h3>
                      <p className="text-blue-100 mt-0.5">
                        SG-RG-05 Tratamento de Não Conformidade e Ação Corretiva
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-6">
                    {/* Instruções */}
                    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                      <div className="text-blue-500 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Preencha os campos abaixo para registrar uma nova não conformidade</h4>
                        <p className="text-sm text-blue-600 mt-0.5">Os campos marcados com * são obrigatórios</p>
                      </div>
                    </div>

                    {/* Seção 1: Identificação da NC */}
                    <div className="mb-8">
                      <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">1</span>
                        Identificação da Não Conformidade
                      </h4>
                      
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Setor onde ocorreu NC <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="setorOcorrencia"
                              value={formData.setorOcorrencia}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              required
                            >
                              {setores.map((setor) => (
                                <option key={setor} value={setor}>{setor}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Setor que verificou <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="setorVerificador"
                              value={formData.setorVerificador}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              required
                            >
                              {setores.map((setor) => (
                                <option key={setor} value={setor}>{setor}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Número NC <span className="text-xs text-green-600">(automático)</span>
                                </label>
                                <input
                                  type="text"
                                  name="numeroNC"
                                  value={formData.numeroNC}
                                  readOnly
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 bg-gray-100 shadow-sm cursor-not-allowed"
                                  placeholder="Gerando número..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Data <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  name="dataOcorrencia"
                                  value={formData.dataOcorrencia}
                                  onChange={handleChange}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Relato do Ocorrido */}
                    <div className="mb-8">
                      <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">2</span>
                        Relato do Ocorrido
                      </h4>
                      
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                        <textarea
                          name="relatoOcorrido"
                          value={formData.relatoOcorrido}
                          onChange={handleChange}
                          rows={4}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                          placeholder="Descreva em detalhes o que ocorreu..."
                          required
                        />
                        
                        {/* Upload de arquivos para relato */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors bg-white">
                          <div className="flex items-center justify-center">
                            <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                              <PaperClipIcon className="h-5 w-5" />
                              <span>Anexar evidências (fotos, documentos)</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                onChange={handleRelatoFileChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                          
                          {/* Lista de arquivos anexados */}
                          {relatoFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {relatoFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeRelatoFile(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Solução Imediata */}
                    <div className="mb-8">
                      <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">3</span>
                        Solução Imediata
                      </h4>
                      
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-2">
                            <textarea
                              name="solucaoImediata"
                              value={formData.solucaoImediata}
                              onChange={handleChange}
                              rows={4}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                              placeholder="Descreva qual a correção; como o problema foi resolvido."
                            />
                          </div>
                          <div className="col-span-1 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Responsável pela solução imediata <span className="text-red-500">*</span>
                              </label>
                              <select
                                name="responsavelSolucao"
                                value={formData.responsavelSolucao}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                required
                              >
                                <option value="">Selecione o setor responsável</option>
                                {setores.map((setor) => (
                                  <option key={setor} value={setor}>{setor}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Necessária Ação Corretiva?
                              </label>
                              <div className="flex items-center gap-4 mt-1">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="necessitaAcaoCorretiva"
                                    value="SIM"
                                    checked={formData.necessitaAcaoCorretiva === 'SIM'}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                  />
                                  Sim
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="necessitaAcaoCorretiva"
                                    value="NÃO"
                                    checked={formData.necessitaAcaoCorretiva === 'NÃO'}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                  />
                                  Não
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 4: Ação Corretiva */}
                    {formData.necessitaAcaoCorretiva === 'SIM' && (
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">4</span>
                          Ação Corretiva
                        </h4>
                        
                        <div className="space-y-4 bg-gray-50 p-5 rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Consequências
                            </label>
                            <textarea
                              name="acaoCorretiva.consequencias"
                              value={formData.acaoCorretiva.consequencias}
                              onChange={handleChange}
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                              placeholder="como resultado desse problema? (ex:. perda financeir; houve reclamação; retrabalho no processo...)"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Causas
                            </label>
                            <textarea
                              name="acaoCorretiva.causas"
                              value={formData.acaoCorretiva.causas}
                              onChange={handleChange}
                              rows={3}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                              placeholder="Porque isso aconteceu? Qual o motivo da origem do problema? Falta de colaborador? Falta de treinamento? procedimento mal elaborado?"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Seção 5: Plano de Ação */}
                    {formData.necessitaAcaoCorretiva === 'SIM' && (
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">5</span>
                          Plano de Ação
                        </h4>
                        
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-100">
                            <div className="col-span-5 font-medium text-gray-700">Plano de Ação</div>
                            <div className="col-span-4 font-medium text-gray-700">Responsável</div>
                            <div className="col-span-3 font-medium text-gray-700">Prazo</div>
                          </div>
                          
                          {/* Ação 1 */}
                          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200">
                            <div className="col-span-5">
                              <textarea
                                value={formData.planoAcao[0].planoAcao}
                                onChange={(e) => handlePlanoAcaoChange(0, 'planoAcao', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                                placeholder="Descreva a ação a ser executada..."
                              />
                            </div>
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={formData.planoAcao[0].responsavel}
                                onChange={(e) => handlePlanoAcaoChange(0, 'responsavel', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                placeholder="Nome do responsável"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="date"
                                value={formData.planoAcao[0].prazo}
                                onChange={(e) => handlePlanoAcaoChange(0, 'prazo', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </div>
                          
                          {/* Ação 2 */}
                          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200">
                            <div className="col-span-5">
                              <textarea
                                value={formData.planoAcao[1].planoAcao}
                                onChange={(e) => handlePlanoAcaoChange(1, 'planoAcao', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                                placeholder="Descreva a ação a ser executada..."
                              />
                            </div>
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={formData.planoAcao[1].responsavel}
                                onChange={(e) => handlePlanoAcaoChange(1, 'responsavel', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                placeholder="Nome do responsável"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="date"
                                value={formData.planoAcao[1].prazo}
                                onChange={(e) => handlePlanoAcaoChange(1, 'prazo', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </div>
                          
                          {/* Ação 3 */}
                          <div className="grid grid-cols-12 gap-4 p-4">
                            <div className="col-span-5">
                              <textarea
                                value={formData.planoAcao[2].planoAcao}
                                onChange={(e) => handlePlanoAcaoChange(2, 'planoAcao', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                                placeholder="Descreva a ação a ser executada..."
                              />
                            </div>
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={formData.planoAcao[2].responsavel}
                                onChange={(e) => handlePlanoAcaoChange(2, 'responsavel', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                placeholder="Nome do responsável"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="date"
                                value={formData.planoAcao[2].prazo}
                                onChange={(e) => handlePlanoAcaoChange(2, 'prazo', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Upload de arquivos para plano de ação */}
                        <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                          <div className="flex items-center justify-center">
                            <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                              <PaperClipIcon className="h-5 w-5" />
                              <span>Anexar documentos do plano de ação</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                                onChange={handlePlanoFileChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                          
                          {/* Lista de arquivos anexados */}
                          {planoFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {planoFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removePlanoFile(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Seção 6: Observações */}
                    <div className="mb-8">
                      <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">6</span>
                        Observações
                      </h4>
                      
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="naoConformidadeRecorrente"
                            name="naoConformidadeRecorrente"
                            checked={formData.naoConformidadeRecorrente}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor="naoConformidadeRecorrente" className="text-sm text-gray-700">
                            Não conformidade recorrente
                          </label>
                          
                          {formData.naoConformidadeRecorrente && (
                            <div className="flex items-center ml-2">
                              <label className="text-sm text-gray-700 mr-2 whitespace-nowrap">
                                N° das NCs recorrentes:
                              </label>
                              <input
                                type="text"
                                name="numNCsRecorrentes"
                                value={formData.numNCsRecorrentes}
                                onChange={handleChange}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-32"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="necessarioMudancaSistema"
                            name="necessarioMudancaSistema"
                            checked={formData.necessarioMudancaSistema}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor="necessarioMudancaSistema" className="text-sm text-gray-700">
                            Necessário mudanças no sistema de gestão da qualidade
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Seção 7: Análise de Riscos */}
                    {formData.necessitaAcaoCorretiva === 'SIM' && (
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">7</span>
                          <span>Análise de Riscos</span>
                          <span className="text-sm font-normal text-amber-600">(se aplicável)</span>
                        </h4>
                        
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <div className="grid grid-cols-6 gap-6 bg-gray-100 p-4 border-b border-gray-200">
                            <div className="col-span-2 font-medium text-gray-700 text-center">Probabilidade</div>
                            <div className="col-span-2 font-medium text-gray-700 text-center">Consequência</div>
                            <div className="col-span-2 font-medium text-gray-700 text-center">Impacto</div>
                          </div>
                          
                          <div className="grid grid-cols-6 gap-6 p-5">
                            <div className="col-span-2">
                              <select
                                name="analiseRiscos.probabilidade"
                                value={formData.analiseRiscos.probabilidade}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              >
                                <option value="1">1 - Raro</option>
                                <option value="2">2 - Improvável</option>
                                <option value="3">3 - Possível</option>
                                <option value="4">4 - Provável</option>
                                <option value="5">5 - Quase certo</option>
                              </select>
                            </div>
                            
                            <div className="col-span-2">
                              <select
                                name="analiseRiscos.consequencia"
                                value={formData.analiseRiscos.consequencia}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              >
                                <option value="1">1 - Insignificante</option>
                                <option value="2">2 - Menor</option>
                                <option value="3">3 - Moderado</option>
                                <option value="4">4 - Maior</option>
                                <option value="5">5 - Catastrófico</option>
                              </select>
                            </div>
                            
                            <div className="col-span-2">
                              <div className={`flex items-center justify-center h-full py-3 rounded-lg font-bold border-2 ${
                                parseInt(formData.analiseRiscos.impacto) <= 6 
                                  ? 'bg-green-500 text-white border-green-600' 
                                  : parseInt(formData.analiseRiscos.impacto) <= 15 
                                    ? 'bg-yellow-500 text-white border-yellow-600' 
                                    : 'bg-red-500 text-white border-red-600'
                              }`}>
                                <div className="flex flex-col items-center">
                                  <span className="text-2xl">{formData.analiseRiscos.impacto}</span>
                                  <span className="text-sm mt-1 font-semibold">
                                    {parseInt(formData.analiseRiscos.impacto) <= 6 
                                      ? 'BAIXO' 
                                      : parseInt(formData.analiseRiscos.impacto) <= 15 
                                        ? 'MÉDIO' 
                                        : 'ALTO'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Seção 8: Eficácia */}
                    {formData.necessitaAcaoCorretiva === 'SIM' && (
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold">8</span>
                          Eficácia
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                            <input
                              type="text"
                              name="eficacia.responsavel"
                              value={formData.eficacia.responsavel}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                              placeholder="Nome do responsável pela verificação"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                            <input
                              type="date"
                              name="eficacia.data"
                              value={formData.eficacia.data}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex justify-end items-center mt-8">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          {editData ? 'Atualizar' : 'Registrar'} Não Conformidade
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 