import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { HeartIcon, ChatBubbleLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username,
          message: newMessage.trim()
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !replyingTo) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username,
          message: replyMessage.trim(),
          parent_id: replyingTo.id
        }),
      });

      if (response.ok) {
        setReplyMessage('');
        setReplyingTo(null);
        fetchMessages();
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    }
  };

  const toggleLike = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages/${messageId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Erro ao curtir mensagem:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <div className="w-80 h-full bg-gradient-to-b from-yellow-50 to-yellow-100 border-l-2 border-yellow-300 shadow-xl flex flex-col">
      {/* Header do Chat Compacto */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800 p-2 shadow-md">
        <h3 className="font-bold text-center text-sm">💬 Chat ASSOMASUL</h3>
        <p className="text-xs text-center text-gray-700">Conectado como <span className="font-semibold">{user.username}</span></p>
      </div>

      {/* Área de Mensagens Compacta */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">💭</p>
            <p className="font-medium">Nenhuma mensagem ainda.</p>
            <p className="text-sm">Seja o primeiro a enviar!</p>
          </div>
        ) : (
          messages.filter(msg => !msg.parent_id).map((msg) => (
            <div key={msg.id} className="space-y-2">
              {/* Mensagem Principal */}
              <div className={`p-2 rounded-lg shadow-sm border ${
                msg.user_id === user.id 
                  ? 'bg-blue-500 text-white ml-3 border-blue-600' 
                  : 'bg-white text-gray-800 mr-3 border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs font-bold text-yellow-200">
                    {msg.user_id === user.id ? 'Você' : msg.username} diz:
                  </div>
                  <div className="text-xs opacity-75">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-xs break-words mb-1">{msg.message}</div>
                
                {/* Ações da Mensagem */}
                <div className="flex items-center space-x-2 mt-1">
                  <button
                    onClick={() => toggleLike(msg.id)}
                    className="flex items-center space-x-1 text-xs hover:scale-110 transition-transform"
                  >
                    <HeartIcon className="h-4 w-4" />
                    <span>{msg.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="flex items-center space-x-1 text-xs hover:scale-110 transition-transform"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    <span>Responder</span>
                  </button>
                </div>
              </div>

              {/* Respostas Compactas */}
              {msg.replies && msg.replies.length > 0 && (
                <div className="ml-4 space-y-1">
                  {msg.replies.map((reply) => (
                    <div key={reply.id} className={`p-1.5 rounded text-xs shadow-sm border ${
                      reply.user_id === user.id 
                        ? 'bg-blue-400 text-white border-blue-500' 
                        : 'bg-gray-50 text-gray-800 border-gray-300'
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-xs font-semibold opacity-75">
                          {reply.user_id === user.id ? 'Você' : reply.username} responde:
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(reply.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="break-words mb-1">{reply.message}</div>
                      <button
                        onClick={() => toggleLike(reply.id)}
                        className="flex items-center space-x-1 text-xs hover:scale-110 transition-transform"
                      >
                        <HeartIcon className="h-3 w-3" />
                        <span>{reply.likes || 0}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário de Resposta Compacto */}
              {replyingTo && replyingTo.id === msg.id && (
                <div className="ml-4 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <div className="text-xs text-gray-600 mb-1">
                    Respondendo para <span className="font-semibold">{msg.username}</span>:
                  </div>
                  <form onSubmit={sendReply} className="flex space-x-1">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="flex-1 px-2 py-1 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs"
                      maxLength={300}
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage.trim()}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 transition-colors"
                    >
                      <PaperAirplaneIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyMessage('');
                      }}
                      className="px-1 py-1 text-gray-500 hover:text-gray-700 text-xs"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulário de Nova Mensagem Compacto */}
      <div className="p-2 border-t-2 border-yellow-300 bg-gradient-to-r from-yellow-100 to-yellow-200">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-2 py-1.5 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-sm"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition-colors flex items-center"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
