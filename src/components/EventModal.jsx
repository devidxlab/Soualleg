import { useState, useEffect } from 'react';

export default function EventModal({ isOpen, onClose, event, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    category: 'Cadastros',
    company: '',
    status: 'aberto',
    description: '',
    date: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        id: event.id,
        category: event.category,
        company: event.company,
        status: event.status,
        description: event.description || '',
        date: event.date
      });
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.company || !formData.description) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.id) {
      console.error('ID do evento não encontrado');
      return;
    }

    console.log('Enviando dados atualizados:', formData);
    await onSave(formData);
    
    // Limpar formulário
    setFormData({
      id: '',
      category: 'Cadastros',
      company: '',
      status: 'aberto',
      description: '',
      date: ''
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Editar Evento</h2>
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
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
            >
              <option value="Cadastros">Cadastros</option>
              <option value="Elogios">Elogios</option>
              <option value="Denúncias">Denúncias</option>
              <option value="Reclamações">Reclamações</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Nome da empresa"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              placeholder="Descreva o evento..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
            >
              <option value="aberto">Aberto</option>
              <option value="fechado">Fechado</option>
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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 