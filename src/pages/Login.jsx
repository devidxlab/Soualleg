import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, KeyIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar se o usuário já está logado
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      navigate('/home');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao fazer login');
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/home');
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Usuário ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-900 to-primary p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-700/50">
          {/* Logo Section */}
          <div className="p-8 text-center">
            <img src="/images/canal6.png" alt="Allegiance Logo" className="h-12 mx-auto" />
            <h2 className="text-2xl font-semibold text-white mt-6">Acesse sua conta</h2>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/70 mb-2">
                  Usuário
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    className="w-full rounded-xl px-4 py-3 pl-11 bg-gray-800/50 border border-gray-600 text-white placeholder-white/50 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-white/40" />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    className="w-full rounded-xl px-4 py-3 pl-11 bg-gray-800/50 border border-gray-600 text-white placeholder-white/50 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-white/40" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn-premium w-full py-3 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 