import { useState, useEffect } from 'react';
import { KeyIcon, UserIcon, CalendarIcon, EnvelopeIcon, PlusIcon, TrashIcon, BuildingOfficeIcon, Square3Stack3DIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';
import { Switch } from '@headlessui/react';

// Modal para gerenciar setores
function DepartmentModal({ isOpen, onClose, onSuccess, companies, departments }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    company_id: '',
    parent_id: '',
    manager_user_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Carregar usuários quando empresa for selecionada
  useEffect(() => {
    if (formData.company_id) {
      fetch(`${API_BASE_URL}/users?company_id=${formData.company_id}`)
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(() => setUsers([]));
    }
  }, [formData.company_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.code || !formData.company_id) {
      setError('Campos obrigatórios: Nome, Código e Empresa');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar setor');
      }

      onSuccess();
      onClose();
      setFormData({
        name: '',
        code: '',
        description: '',
        company_id: '',
        parent_id: '',
        manager_user_id: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-8 max-w-lg w-full">
        <h3 className="text-xl font-semibold text-white mb-6">Criar Setor</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Nome do Setor *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
              placeholder="Ex: Recursos Humanos"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Código *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
              placeholder="Ex: RH"
              maxLength="10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Empresa *</label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-white"
              required
            >
              <option value="">Selecione uma empresa</option>
              {companies.map(company => (
                <option key={company.id} value={company.id} className="bg-gray-800">
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Setor Pai</label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-white"
            >
              <option value="">Nenhum (setor principal)</option>
              {departments
                .filter(d => d.company_id == formData.company_id)
                .map(dept => (
                  <option key={dept.id} value={dept.id} className="bg-gray-800">
                    {dept.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Gerente</label>
            <select
              value={formData.manager_user_id}
              onChange={(e) => setFormData(prev => ({ ...prev, manager_user_id: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-white"
            >
              <option value="">Nenhum</option>
              {users.map(user => (
                <option key={user.id} value={user.id} className="bg-gray-800">
                  {user.full_name || user.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
              rows="3"
              placeholder="Descrição das responsabilidades do setor..."
            />
          </div>

          {error && (
            <div className="glass-effect bg-red-500/10 text-red-400 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-premium px-6 py-2 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Setor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para criar funcionário
function CreateEmployeeModal({ isOpen, onClose, onSuccess, companies, departments, roles }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '123456',
    email: '',
    full_name: '',
    department: '', // campo legado
    department_id: '',
    role_id: '',
    employee_code: '',
    hire_date: '',
    phone: '',
    manager_id: '',
    company_id: '',
    can_view_denuncias: false,
    can_view_documentacao: true,
    can_view_naoconformidades: false,
    can_view_empresas: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Carregar usuários quando empresa for selecionada
  useEffect(() => {
    if (formData.company_id) {
      fetch(`${API_BASE_URL}/users?company_id=${formData.company_id}`)
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(() => setUsers([]));
    }
  }, [formData.company_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações no frontend
    if (formData.username.length < 3) {
      setError('Nome de usuário deve ter pelo menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.full_name.length < 2) {
      setError('Nome completo deve ter pelo menos 2 caracteres');
      setLoading(false);
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Formato de email inválido');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) {
      setError('Nome de usuário deve conter apenas letras, números, pontos e underscores');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar funcionário');
      }

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        username: '',
        password: '123456',
        email: '',
        full_name: '',
        department: '', // campo legado
        department_id: '',
        role_id: '',
        employee_code: '',
        hire_date: '',
        phone: '',
        manager_id: '',
        company_id: '',
        can_view_denuncias: false,
        can_view_documentacao: true,
        can_view_naoconformidades: false,
        can_view_empresas: false
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-white mb-6">Criar Funcionário</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Nome de Usuário *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Setor</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white"
              >
                <option value="">Selecione um setor</option>
                {departments
                  .filter(d => d.company_id == formData.company_id)
                  .map(dept => (
                    <option key={dept.id} value={dept.id} className="bg-gray-800">
                      {dept.name} ({dept.code})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Cargo</label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white"
              >
                <option value="">Selecione um cargo</option>
                {roles
                  .filter(r => r.company_id == formData.company_id)
                  .map(role => (
                    <option key={role.id} value={role.id} className="bg-gray-800">
                      {role.name} (Nível {role.level})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Matrícula</label>
              <input
                type="text"
                value={formData.employee_code}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
                placeholder="Ex: EMP001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Data de Contratação</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Gerente</label>
            <select
              value={formData.manager_id}
              onChange={(e) => setFormData(prev => ({ ...prev, manager_id: e.target.value }))}
              className="glass-input w-full rounded-xl px-4 py-3 text-white"
            >
              <option value="">Nenhum</option>
              {users.map(user => (
                <option key={user.id} value={user.id} className="bg-gray-800">
                  {user.full_name || user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Empresa *</label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white"
                required
              >
                <option value="">Selecione uma empresa</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id} className="bg-gray-800">
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Senha Padrão</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
                required
              />
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <h4 className="text-white font-medium mb-4">Permissões</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.can_view_denuncias}
                  onChange={(e) => setFormData(prev => ({ ...prev, can_view_denuncias: e.target.checked }))}
                  className="w-4 h-4 rounded bg-white/20 border-white/30 text-blue-500"
                />
                <span className="text-white/80">Denúncias</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.can_view_documentacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, can_view_documentacao: e.target.checked }))}
                  className="w-4 h-4 rounded bg-white/20 border-white/30 text-blue-500"
                />
                <span className="text-white/80">Documentação</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.can_view_naoconformidades}
                  onChange={(e) => setFormData(prev => ({ ...prev, can_view_naoconformidades: e.target.checked }))}
                  className="w-4 h-4 rounded bg-white/20 border-white/30 text-blue-500"
                />
                <span className="text-white/80">Não Conformidades</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.can_view_empresas}
                  onChange={(e) => setFormData(prev => ({ ...prev, can_view_empresas: e.target.checked }))}
                  className="w-4 h-4 rounded bg-white/20 border-white/30 text-blue-500"
                />
                <span className="text-white/80">Empresas</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="glass-effect bg-red-500/10 text-red-400 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-premium px-6 py-2 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Funcionário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

  useEffect(() => {
    // Carregar dados do usuário do localStorage apenas uma vez
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Carregar lista de usuários, empresas, setores e cargos só quando user mudar e for admin
  useEffect(() => {
    if (user && user.user_type === 'admin') {
      setLoadingUsers(true);
      Promise.all([
        fetch(`${API_BASE_URL}/users`).then(res => res.json()),
        fetch(`${API_BASE_URL}/companies`).then(res => res.json()),
        fetch(`${API_BASE_URL}/departments`).then(res => res.json()),
        fetch(`${API_BASE_URL}/roles`).then(res => res.json())
      ])
        .then(([usersData, companiesData, departmentsData, rolesData]) => {
          setUsers(usersData);
          setCompanies(companiesData);
          setDepartments(departmentsData);
          setRoles(rolesData);
        })
        .catch(() => setUserError('Erro ao carregar dados'))
        .finally(() => setLoadingUsers(false));
    }
  }, [user]);

  const refreshData = () => {
    if (user && user.user_type === 'admin') {
      Promise.all([
        fetch(`${API_BASE_URL}/users`).then(res => res.json()),
        fetch(`${API_BASE_URL}/departments`).then(res => res.json()),
        fetch(`${API_BASE_URL}/roles`).then(res => res.json())
      ])
        .then(([usersData, departmentsData, rolesData]) => {
          setUsers(usersData);
          setDepartments(departmentsData);
          setRoles(rolesData);
        })
        .catch(() => setUserError('Erro ao carregar dados'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir funcionário');
      }

      setUserMessage('Funcionário excluído com sucesso!');
      setTimeout(() => setUserMessage(''), 3000);
      refreshData();
    } catch (err) {
      setUserMessage('Erro ao excluir funcionário: ' + err.message);
      setTimeout(() => setUserMessage(''), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar senhas
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar senha');
      }

      // Mostrar mensagem de sucesso
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Limpar formulário
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setError(error.message);
    }
  };

  const handlePermissionChange = async (userId, field, value) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
            can_view_denuncias: field === 'can_view_denuncias' ? value : userToUpdate.can_view_denuncias,
            can_view_documentacao: field === 'can_view_documentacao' ? value : userToUpdate.can_view_documentacao,
            can_view_naoconformidades: field === 'can_view_naoconformidades' ? value : userToUpdate.can_view_naoconformidades,
            can_view_empresas: field === 'can_view_empresas' ? value : userToUpdate.can_view_empresas
          })
      });
      const data = await response.json();
      if (!response.ok) {
        setUserMessage(data.error || 'Erro ao atualizar permissões');
        setTimeout(() => setUserMessage(''), 3000);
        return;
      }
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
      setUserMessage('Permissão atualizada com sucesso!');
      setTimeout(() => setUserMessage(''), 2000);
    } catch (err) {
      setUserMessage('Erro ao atualizar permissões');
      setTimeout(() => setUserMessage(''), 3000);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[1600px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="mt-1 text-white/70">Gerencie suas preferências e informações de conta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Usuário */}
        <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-8">Informações do Usuário</h2>
            
            <div className="grid gap-8">
              <div className="glass-effect rounded-xl p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5">
                  <UserIcon className="h-5 w-5 text-white/70" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Usuário</p>
                  <p className="text-base font-medium text-white">{user.username}</p>
                </div>
              </div>

              {user.email && (
                <div className="glass-effect rounded-xl p-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white/5">
                    <EnvelopeIcon className="h-5 w-5 text-white/70" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">E-mail</p>
                    <p className="text-base font-medium text-white">{user.email}</p>
                  </div>
                </div>
              )}

              <div className="glass-effect rounded-xl p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5">
                  <CalendarIcon className="h-5 w-5 text-white/70" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Último acesso</p>
                  <p className="text-base font-medium text-white">
                    {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Primeiro acesso'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-8">Alterar Senha</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-white/70 mb-2">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-3 pl-11 text-white placeholder-white/50"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-white/40" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-white/70 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder-white/50"
                  required
                />
              </div>

              {error && (
                <div className="glass-effect bg-red-500/10 text-red-400 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {showSuccess && (
                <div className="glass-effect bg-emerald-500/10 text-emerald-400 p-4 rounded-xl text-sm">
                  Senha alterada com sucesso!
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="btn-premium px-8 py-3"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {user.user_type === 'admin' && (
        <>
          <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-sm p-8 mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Gestão de Setores</h2>
              <button
                onClick={() => setIsDepartmentModalOpen(true)}
                className="btn-premium px-4 py-2 flex items-center space-x-2"
              >
                <Square3Stack3DIcon className="h-5 w-5" />
                <span>Novo Setor</span>
              </button>
            </div>

            {userMessage && (
              <div className={`mb-4 p-3 rounded-xl text-center ${
                userMessage.includes('sucesso') 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {userMessage}
              </div>
            )}
            
            {loadingUsers ? (
              <div className="text-white/70 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                Carregando setores...
              </div>
            ) : userError ? (
              <div className="text-red-400 text-center py-8">{userError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-white/80">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-left py-3 px-4 font-medium">Código</th>
                      <th className="text-left py-3 px-4 font-medium">Empresa</th>
                      <th className="text-left py-3 px-4 font-medium">Gerente</th>
                      <th className="text-center py-3 px-4 font-medium">Funcionários</th>
                      <th className="text-left py-3 px-4 font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map(dept => (
                      <tr key={dept.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{dept.name}</div>
                          {dept.parent_name && <div className="text-white/50 text-sm">↳ {dept.parent_name}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-mono">
                            {dept.code}
                          </span>
                        </td>
                        <td className="py-3 px-4">{dept.company_name}</td>
                        <td className="py-3 px-4">{dept.manager_name || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm">
                            {dept.employee_count || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-white/70 max-w-xs truncate">
                          {dept.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden backdrop-blur-sm p-8 mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Gestão de Funcionários</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-premium px-4 py-2 flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Novo Funcionário</span>
              </button>
            </div>

          {userMessage && (
            <div className={`mb-4 p-3 rounded-xl text-center ${
              userMessage.includes('sucesso') 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {userMessage}
            </div>
          )}
          
          {loadingUsers ? (
            <div className="text-white/70 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
              Carregando funcionários...
            </div>
          ) : userError ? (
            <div className="text-red-400 text-center py-8">{userError}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-white/80">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 font-medium">Nome</th>
                    <th className="text-left py-3 px-4 font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium">Empresa</th>
                    <th className="text-left py-3 px-4 font-medium">Departamento</th>
                    <th className="text-left py-3 px-4 font-medium">Tipo</th>
                    <th className="text-center py-3 px-4 font-medium">Denúncias</th>
                    <th className="text-center py-3 px-4 font-medium">Docs</th>
                    <th className="text-center py-3 px-4 font-medium">NCs</th>
                    <th className="text-center py-3 px-4 font-medium">Empresas</th>
                    <th className="text-center py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{u.full_name || u.username}</div>
                          {u.email && <div className="text-white/50 text-sm">{u.email}</div>}
                          {u.first_login_required && (
                            <div className="text-yellow-400 text-xs">Requer alteração de senha</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{u.username}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <BuildingOfficeIcon className="h-4 w-4 text-white/50" />
                          <span>{u.company_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{u.department_name || u.department || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.user_type === 'admin' 
                            ? 'bg-purple-500/20 text-purple-300' 
                            : u.user_type === 'employee'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {u.user_type === 'admin' ? 'Admin' : 
                           u.user_type === 'employee' ? 'Funcionário' : 'Empresa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Switch
                          checked={!!u.can_view_denuncias}
                          onChange={v => handlePermissionChange(u.id, 'can_view_denuncias', v)}
                          disabled={u.user_type === 'admin'}
                          className={`${u.can_view_denuncias ? 'bg-emerald-500' : 'bg-gray-400'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50`}
                        >
                          <span className="sr-only">Permitir Denúncias</span>
                          <span
                            className={`${u.can_view_denuncias ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Switch
                          checked={!!u.can_view_documentacao}
                          onChange={v => handlePermissionChange(u.id, 'can_view_documentacao', v)}
                          disabled={u.user_type === 'admin'}
                          className={`${u.can_view_documentacao ? 'bg-emerald-500' : 'bg-gray-400'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50`}
                        >
                          <span className="sr-only">Permitir Documentação</span>
                          <span
                            className={`${u.can_view_documentacao ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Switch
                          checked={!!u.can_view_naoconformidades}
                          onChange={v => handlePermissionChange(u.id, 'can_view_naoconformidades', v)}
                          disabled={u.user_type === 'admin'}
                          className={`${u.can_view_naoconformidades ? 'bg-emerald-500' : 'bg-gray-400'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50`}
                        >
                          <span className="sr-only">Permitir Não Conformidades</span>
                          <span
                            className={`${u.can_view_naoconformidades ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Switch
                          checked={!!u.can_view_empresas}
                          onChange={v => handlePermissionChange(u.id, 'can_view_empresas', v)}
                          disabled={u.user_type === 'admin'}
                          className={`${u.can_view_empresas ? 'bg-emerald-500' : 'bg-gray-400'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50`}
                        >
                          <span className="sr-only">Permitir Empresas</span>
                          <span
                            className={`${u.can_view_empresas ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.user_type !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Excluir funcionário"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  Nenhum funcionário cadastrado ainda.
                </div>
              )}
            </div>
          )}
        </div>
        </>
      )}

      <DepartmentModal 
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        onSuccess={() => {
          refreshData();
          setUserMessage('Setor criado com sucesso!');
          setTimeout(() => setUserMessage(''), 3000);
        }}
        companies={companies}
        departments={departments}
      />

      <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refreshData();
          setUserMessage('Funcionário criado com sucesso!');
          setTimeout(() => setUserMessage(''), 3000);
        }}
        companies={companies}
        departments={departments}
        roles={roles}
      />
    </div>
  );
} 