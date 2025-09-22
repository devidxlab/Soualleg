import { useState, useEffect } from 'react';
import { MdClose, MdEdit } from 'react-icons/md';

export default function IndicatorEditModal({ isOpen, onClose, indicator, onSave }) {
  const [currentValue, setCurrentValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (indicator) {
      setCurrentValue(indicator.current_value.toString());
      setTargetValue(indicator.target_value.toString());
    }
  }, [indicator]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        id: indicator.id,
        current_value: parseFloat(currentValue),
        target_value: parseFloat(targetValue)
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar indicador:', error);
      alert('Erro ao salvar indicador');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentValue(indicator?.current_value.toString() || '');
    setTargetValue(indicator?.target_value.toString() || '');
    onClose();
  };

  if (!isOpen || !indicator) return null;

  const getIndicatorTitle = (name) => {
    const titles = {
      'satisfacao_municipios': 'Satisfação dos Municípios',
      'eficacia_nc': 'Eficácia de NC',
      'capacitacoes': 'Capacitações',
      'cumprimento_prazos': 'Cumprimento Prazos',
      'tempo_resposta': 'Tempo Resposta',
      'alcance_publicacoes': 'Alcance Publicações'
    };
    return titles[name] || name;
  };

  const getUnitLabel = (unit) => {
    const labels = {
      '%': '%',
      'count': 'unidades',
      'days': 'dias'
    };
    return labels[unit] || unit;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <MdEdit className="text-blue-400 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Editar Indicador</h2>
              <p className="text-sm text-white/60">{getIndicatorTitle(indicator.name)}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Valor Atual */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Valor Atual ({getUnitLabel(indicator.unit)})
              </label>
              <input
                type="number"
                step="0.1"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Digite o valor atual"
                required
              />
            </div>

            {/* Meta */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Meta ({getUnitLabel(indicator.unit)})
              </label>
              <input
                type="number"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Digite a meta"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all duration-200 font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}