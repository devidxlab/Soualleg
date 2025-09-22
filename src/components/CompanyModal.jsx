import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function CompanyModal({ isOpen, onClose, onSave }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    logo: null,
    primaryColor: '#FF6B00', // Cor padrão laranja
    secondaryColor: '#1F2937' // Cor padrão cinza escuro
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      await onSave(formDataToSend);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    }
  };

  // Se não for admin, não renderiza o modal
  if (user?.user_type !== 'admin') {
    return null;
  }

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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl glass-card transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-lg glass-effect p-2 text-white/70 hover:text-white transition-colors"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-xl font-semibold text-white mb-6">
                      Cadastrar Nova Empresa
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">
                            Nome da Empresa *
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="glass-input w-full rounded-lg px-3 py-2 text-white placeholder-white/50"
                          />
                        </div>

                        <div>
                          <label htmlFor="cnpj" className="block text-sm font-medium text-white/70 mb-1">
                            CNPJ
                          </label>
                          <input
                            type="text"
                            name="cnpj"
                            id="cnpj"
                            value={formData.cnpj}
                            onChange={handleInputChange}
                            className="glass-input w-full rounded-lg px-3 py-2 text-white placeholder-white/50"
                          />
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-white/70 mb-1">
                            Telefone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="glass-input w-full rounded-lg px-3 py-2 text-white placeholder-white/50"
                          />
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">
                            E-mail
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="glass-input w-full rounded-lg px-3 py-2 text-white placeholder-white/50"
                          />
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="address" className="block text-sm font-medium text-white/70 mb-1">
                            Endereço
                          </label>
                          <input
                            type="text"
                            name="address"
                            id="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="glass-input w-full rounded-lg px-3 py-2 text-white placeholder-white/50"
                          />
                        </div>

                        <div>
                          <label htmlFor="primaryColor" className="block text-sm font-medium text-white/70 mb-1">
                            Cor Primária
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              name="primaryColor"
                              id="primaryColor"
                              value={formData.primaryColor}
                              onChange={handleInputChange}
                              className="h-9 w-9 rounded-lg glass-input p-1"
                            />
                            <input
                              type="text"
                              value={formData.primaryColor}
                              onChange={handleInputChange}
                              name="primaryColor"
                              className="glass-input w-full rounded-lg px-3 py-2 text-white placeholder-white/50"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="secondaryColor" className="block text-sm font-medium text-white/70 mb-1">
                            Cor Secundária
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              name="secondaryColor"
                              id="secondaryColor"
                              value={formData.secondaryColor}
                              onChange={handleInputChange}
                              className="h-9 w-9 rounded-lg glass-input p-1"
                            />
                            <input
                              type="text"
                              value={formData.secondaryColor}
                              onChange={handleInputChange}
                              name="secondaryColor"
                              className="glass-input w-full rounded-lg px-3 py-2 text-white placeholder-white/50"
                            />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="logo" className="block text-sm font-medium text-white/70 mb-1">
                            Logo da Empresa
                          </label>
                          <input
                            type="file"
                            name="logo"
                            id="logo"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="glass-input w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                          />
                          <p className="mt-2 text-xs text-white/50">
                            Para melhor visualização, use uma imagem de 400x400 pixels ou proporcional. Formatos suportados: PNG, JPG, JPEG. Tamanho máximo: 2MB
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          type="button"
                          className="btn-glass px-4 py-2"
                          onClick={onClose}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="btn-premium px-4 py-2"
                        >
                          Cadastrar Empresa
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 