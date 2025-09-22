import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

export default function NonconformityViewModal({ isOpen, onClose, nonconformity }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!nonconformity) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para mascarar dados sensíveis
  const maskSensitiveData = (data, length = 8) => {
    if (!data) return '';
    return '*'.repeat(length);
  };

  // Verifica se deve mascarar os dados (true se for usuário tipo company)
  const shouldMaskData = user?.user_type === 'company';

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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      Detalhes da Não Conformidade
                    </Dialog.Title>

                    <div className="mt-4 space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Data de Criação</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(nonconformity.created_at)}
                        </div>
                      </div>

                      {(nonconformity.name || shouldMaskData) && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Nome</div>
                          <div className="text-sm font-medium text-gray-900">
                            {shouldMaskData ? maskSensitiveData(nonconformity.name) : nonconformity.name}
                          </div>
                        </div>
                      )}

                      {(nonconformity.email || shouldMaskData) && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">E-mail</div>
                          <div className="text-sm font-medium text-gray-900">
                            {shouldMaskData ? maskSensitiveData(nonconformity.email, 12) : nonconformity.email}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-sm text-gray-500 mb-1">Assunto</div>
                        <div className="text-sm font-medium text-gray-900">{nonconformity.subject}</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500 mb-1">O que aconteceu?</div>
                        <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                          {nonconformity.description}
                        </div>
                      </div>

                      {nonconformity.who_did_it && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Quem fez isto?</div>
                          <div className="text-sm font-medium text-gray-900">{nonconformity.who_did_it}</div>
                        </div>
                      )}

                      {nonconformity.how_it_happened && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Como aconteceu?</div>
                          <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                            {nonconformity.how_it_happened}
                          </div>
                        </div>
                      )}

                      {nonconformity.additional_info && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Informações Adicionais</div>
                          <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                            {nonconformity.additional_info}
                          </div>
                        </div>
                      )}

                      {nonconformity.attachments && (
                        <div>
                          <div className="text-sm text-gray-500 mb-2">Anexos</div>
                          <div className="grid grid-cols-2 gap-4">
                            {shouldMaskData ? (
                              <div className="text-sm text-gray-500">
                                {nonconformity.attachments.split(',').length} anexo(s) oculto(s) por privacidade
                              </div>
                            ) : (
                              nonconformity.attachments.split(',').map((attachment, index) => (
                                <a
                                  key={index}
                                  href={`/uploads/${attachment.trim()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Anexo {index + 1}
                                </a>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
                        onClick={onClose}
                      >
                        Fechar
                      </button>
                    </div>
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