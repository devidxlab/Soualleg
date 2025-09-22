import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

// Definição dos setores disponíveis para não conformidades
const setores = ['Compras', 'Comunicação', 'Diário', 'Financeiro', 'Projetos', 'Recepção', 'RH', 'SGQ'];

export default function NewEventModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category: 'Não conformidades',
    company: '',
    status: 'aberto',
    description: '',
    setor: 'ADF' // Valor padrão para setor
  });
  const [companies, setCompanies] = useState([]);
  const [user, setUser] = useState(null);

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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.company || !formData.description || !formData.setor) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    // Adiciona a data atual ao formData
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const eventData = {
      category: formData.category,
      company: formData.company,
      status: formData.status,
      description: formData.description,
      setor: formData.setor,
      date: now
    };

    console.log('Enviando dados do novo evento:', eventData);
    
    try {
      await onSave(eventData);
      
      // Limpar formulário
      setFormData({
        category: 'Não conformidades',
        company: '',
        status: 'aberto',
        description: '',
        setor: 'ADF'
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar novo evento:', error);
      alert('Erro ao criar evento. Por favor, tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Nova Não Conformidade</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value="Não conformidades"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              required
              disabled
            >
              <option value="Não conformidades">Não conformidades</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            {user?.user_type === 'admin' ? (
              <select
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                required
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                placeholder="Nome da empresa"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setor
            </label>
            <select
              value={formData.setor}
              onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              required
            >
              {setores.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição da Não Conformidade
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Descreva a não conformidade em detalhes..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Situação
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              required
            >
              <option value="aberto">Em Análise</option>
              <option value="fechado">Concluído</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-secondary hover:bg-orange-500 text-white rounded-lg transition-colors"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 