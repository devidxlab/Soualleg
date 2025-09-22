import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  UserCircleIcon, 
  EnvelopeIcon, 
  DocumentTextIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

export default function CompanyPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    whoDidIt: '',
    howItHappened: '',
    additionalInfo: '',
    attachments: []
  });

  // Carregar rascunho salvo
  useEffect(() => {
    const savedData = localStorage.getItem(`complaint_draft_${slug}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Não restaurar anexos do localStorage
        setFormData({ ...parsedData, attachments: [] });
      } catch (err) {
        console.error('Erro ao carregar rascunho:', err);
      }
    }
  }, [slug]);

  // Salvar rascunho automaticamente
  useEffect(() => {
    if (!isSubmitting) {
      const dataToSave = { ...formData };
      delete dataToSave.attachments; // Não salvar anexos no localStorage
      localStorage.setItem(`complaint_draft_${slug}`, JSON.stringify(dataToSave));
    }
  }, [formData, slug, isSubmitting]);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/companies/${slug}`);
        if (!response.ok) {
          throw new Error('Empresa não encontrada');
        }
        const data = await response.json();
        setCompany(data);
        
        // Aplicar cores personalizadas
        document.documentElement.style.setProperty('--primary-color', data.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', data.secondaryColor);
        
        // Aplicar gradiente personalizado
        document.documentElement.style.setProperty(
          '--company-gradient',
          `linear-gradient(135deg, ${data.primaryColor} 0%, ${data.secondaryColor} 100%)`
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [slug]);

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.subject.trim().length < 10) {
      newErrors.subject = 'O assunto deve ter pelo menos 10 caracteres';
    }
    
    if (formData.description.trim().length < 30) {
      newErrors.description = 'A descrição deve ter pelo menos 30 caracteres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Por favor, insira um e-mail válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const showSuccessMessage = (protocol) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-fade-in">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Denúncia Enviada com Sucesso</h3>
        <p class="text-gray-600 mb-2">
          Sua denúncia foi registrada com o protocolo:
        </p>
        <p class="text-lg font-mono font-semibold text-gray-900 mb-6">
          #${protocol}
        </p>
        <button class="btn-premium w-full" onclick="this.parentElement.parentElement.remove()">
          Fechar
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  };

  const clearDraft = () => {
    localStorage.removeItem(`complaint_draft_${slug}`);
  };

  const showConfirmationModal = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md mx-4 animate-fade-in shadow-xl">
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Confirmar Envio</h3>
          <p class="text-gray-600">
            Tem certeza que deseja enviar esta denúncia? Após o envio, não será possível editá-la.
          </p>
        </div>
        <div class="flex gap-3">
          <button 
            class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            onclick="this.parentElement.parentElement.parentElement.remove()"
          >
            Cancelar
          </button>
          <button 
            class="flex-1 px-4 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary/90 font-medium transition-colors"
            onclick="this.parentElement.parentElement.parentElement.dispatchEvent(new CustomEvent('confirm'))"
          >
            Confirmar
          </button>
        </div>
      </div>
    `;

    return new Promise((resolve) => {
      modal.addEventListener('confirm', () => {
        modal.remove();
        resolve(true);
      });
      
      // Fechar modal ao clicar fora
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      });

      document.body.appendChild(modal);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll para o primeiro erro
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Confirmar envio com nosso modal personalizado
    const confirmed = await showConfirmationModal();
    if (!confirmed) return;

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'attachments') {
          formData[key].forEach(file => {
            formDataToSend.append('attachments', file);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/companies/${slug}/complaints`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar denúncia');
      }

      // Gerar protocolo
      const protocol = Date.now().toString(36).toUpperCase();
      
      // Limpar formulário e rascunho
      setFormData({
        name: '',
        email: '',
        subject: '',
        description: '',
        whoDidIt: '',
        howItHappened: '',
        additionalInfo: '',
        attachments: []
      });
      clearDraft();

      // Mostrar mensagem de sucesso
      showSuccessMessage(protocol);

    } catch (err) {
      // Mostrar notificação de erro
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 glass-card p-4 rounded-xl text-white shadow-lg z-50 animate-fade-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>${err.message}</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{
        background: `linear-gradient(135deg, ${company?.primaryColor || '#1a2b4b'}dd 0%, ${company?.secondaryColor || '#1a2b4b'}dd 100%)`
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{
        background: `linear-gradient(135deg, ${company?.primaryColor || '#1a2b4b'}dd 0%, ${company?.secondaryColor || '#1a2b4b'}dd 100%)`
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="glass-card rounded-2xl p-8 text-center max-w-md">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Erro</h3>
            <p className="text-white/70">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col" style={{
        background: `linear-gradient(135deg, #1a2b4bdd 0%, #1a2b4bdd 100%)`
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="glass-card rounded-2xl p-8 text-center max-w-md">
            <ExclamationTriangleIcon className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Empresa não encontrada</h3>
            <p className="text-white/70">A empresa que você está procurando não existe.</p>
          </div>
        </div>
      </div>
    );
  }

  if (company.status === 'inactive') {
    return (
      <div className="min-h-screen flex flex-col" style={{
        background: `linear-gradient(135deg, ${company?.primaryColor || '#1a2b4b'}dd 0%, ${company?.secondaryColor || '#1a2b4b'}dd 100%)`
      }}>
        {/* Header */}
        <header className="glass-card border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              {company.logo ? (
                <img 
                  src={`/uploads/${company.logo}`} 
                  alt={`${company.name} logo`}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <span className="text-xl font-bold text-white">{company.name}</span>
              )}
            </div>
          </div>
        </header>

        {/* Mensagem de Empresa Inativa */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-xl w-full">
            <div className="glass-card rounded-2xl p-8 text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-amber-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">
                Canal de Denúncias Temporariamente Indisponível
              </h2>
              <p className="text-white/70 mb-4">
                O canal de denúncias para {company.name} está temporariamente desativado. 
                Pedimos desculpas pelo inconveniente.
              </p>
              <p className="text-sm text-white/50">
                Se você precisa fazer uma denúncia urgente, por favor, entre em contato com os canais oficiais da empresa.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: `linear-gradient(135deg, ${company?.primaryColor || '#1a2b4b'}dd 0%, ${company?.secondaryColor || '#1a2b4b'}dd 100%)`
    }}>
      {/* Anúncio de leitura de tela */}
      <div role="alert" aria-live="polite" className="sr-only">
        {isSubmitting ? 'Enviando denúncia...' : ''}
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Formulário de denúncia */}
          <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <div className="relative">
              {/* Header com gradiente sutil */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gray-50/80 to-transparent"></div>
              
              {/* Conteúdo */}
              <div className="relative">
                {/* Logo Section */}
                <div className="pt-12 pb-8 px-8">
                  <div className="text-center">
                    {company.logo ? (
                      <img 
                        src={`/uploads/${company.logo}`} 
                        alt={`${company.name} logo`}
                        className="h-24 w-auto object-contain mx-auto"
                      />
                    ) : (
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50/80 shadow-inner">
                        <ShieldCheckIcon className="h-14 w-14 text-gray-900/70" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Linha divisória sutil */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                {/* Título e Descrição */}
                <div className="px-8 py-10 bg-gray-50/30">
                  <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-xl font-medium text-gray-500 tracking-wide uppercase">Canal de Denúncias</h1>
                    <div className="mt-6 space-y-4">
                      <p className="text-base text-gray-500 leading-relaxed">
                        Fornecemos um ambiente <span className="text-gray-700 font-medium">seguro e confidencial</span> para relatar preocupações ou irregularidades dentro da <span className="text-gray-700 font-medium">{company.name}</span>.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-gray-500 bg-gray-50/50 py-2 px-4 rounded-full w-fit mx-auto">
                        <LockClosedIcon className="h-4 w-4" />
                        <p className="text-sm">
                          Sua identidade será mantida estritamente confidencial
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linha divisória sutil */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                {/* Formulário */}
                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Nome completo
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full rounded-lg px-4 py-2.5 pl-11 text-gray-900 bg-gray-50 border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
                            placeholder="Seu nome (opcional)"
                            aria-describedby="name-optional"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserCircleIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <p id="name-optional" className="mt-1 text-xs text-gray-500">
                          Você pode fazer uma denúncia anônima deixando este campo em branco
                        </p>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          E-mail
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full rounded-lg px-4 py-2.5 pl-11 text-gray-900 bg-gray-50 border transition-colors ${
                              errors.email 
                                ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                                : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                            }`}
                            placeholder="Seu e-mail (opcional)"
                            aria-describedby={errors.email ? 'email-error' : 'email-optional'}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        {errors.email ? (
                          <p id="email-error" className="mt-1 text-xs text-red-500">
                            {errors.email}
                          </p>
                        ) : (
                          <p id="email-optional" className="mt-1 text-xs text-gray-500">
                            Opcional, mas útil caso precisemos entrar em contato
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Assunto da denúncia <span className="text-red-500" aria-label="obrigatório">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="subject"
                          id="subject"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          className={`w-full rounded-lg px-4 py-2.5 pl-11 text-gray-900 bg-gray-50 border transition-colors ${
                            errors.subject 
                              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                              : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                          }`}
                          placeholder="Descreva brevemente o assunto"
                          aria-describedby={errors.subject ? 'subject-error' : undefined}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      {errors.subject && (
                        <p id="subject-error" className="mt-1 text-xs text-red-500">
                          {errors.subject}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        O que aconteceu? <span className="text-red-500" aria-label="obrigatório">*</span>
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        required
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg px-4 py-2.5 text-gray-900 bg-gray-50 border transition-colors ${
                          errors.description 
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                            : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                        }`}
                        placeholder="Descreva detalhadamente o ocorrido"
                        aria-describedby={errors.description ? 'description-error' : undefined}
                      />
                      {errors.description && (
                        <p id="description-error" className="mt-1 text-xs text-red-500">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="whoDidIt" className="block text-sm font-medium text-gray-700 mb-1">
                        Quem fez isto?
                      </label>
                      <input
                        type="text"
                        name="whoDidIt"
                        id="whoDidIt"
                        value={formData.whoDidIt}
                        onChange={handleInputChange}
                        className="w-full rounded-lg px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
                        placeholder="Nome, cargo e setor (opcional)"
                      />
                    </div>

                    <div>
                      <label htmlFor="howItHappened" className="block text-sm font-medium text-gray-700 mb-1">
                        Como aconteceu?
                      </label>
                      <textarea
                        name="howItHappened"
                        id="howItHappened"
                        rows={4}
                        value={formData.howItHappened}
                        onChange={handleInputChange}
                        className="w-full rounded-lg px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
                        placeholder="Informe detalhes adicionais sobre como ocorreu (opcional)"
                      />
                    </div>

                    <div>
                      <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                        Informações adicionais
                      </label>
                      <textarea
                        name="additionalInfo"
                        id="additionalInfo"
                        rows={4}
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        className="w-full rounded-lg px-4 py-2.5 text-gray-900 bg-gray-50 border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
                        placeholder="Outras informações relevantes (opcional)"
                      />
                    </div>

                    <div>
                      <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
                        Anexar arquivos
                      </label>
                      <div className="space-y-2">
                        <div className="relative bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PaperClipIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="file"
                            name="attachments"
                            id="attachments"
                            multiple
                            onChange={handleFileChange}
                            className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700
                              file:mr-4 file:py-2 file:px-4 
                              file:rounded-lg file:border-0 
                              file:text-sm file:font-medium 
                              file:bg-secondary/10 file:text-secondary 
                              hover:file:bg-secondary/20 
                              cursor-pointer"
                            aria-describedby="attachments-help"
                          />
                        </div>
                        {formData.attachments.length > 0 && (
                          <div className="bg-gray-50/50 rounded-lg p-3">
                            <div className="text-sm text-gray-500 mb-2">
                              {formData.attachments.length} arquivo(s) selecionado(s):
                            </div>
                            <div className="space-y-1">
                              {Array.from(formData.attachments).map((file, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                  <PaperClipIcon className="h-4 w-4" />
                                  <span>{file.name}</span>
                                  <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <p id="attachments-help" className="text-xs text-gray-500">
                          Você pode anexar múltiplos arquivos como evidências (opcional)
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">
                        Ao enviar esta denúncia, você concorda com nossos Termos de Uso e Política de Privacidade.
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`btn-premium px-8 py-3 flex items-center gap-2 ${
                          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-5 w-5" />
                            <span>Enviar Denúncia</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 