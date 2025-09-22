-- ===============================================
-- MIGRAÇÃO V2: SISTEMA COMPLETO DE FUNCIONÁRIOS
-- Data: $(date)
-- Objetivo: Implementar setores, cargos e permissões granulares
-- ===============================================

-- 1. CRIAR TABELA DE SETORES/DEPARTAMENTOS
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- Ex: "FIN", "RH", "TI"
    description TEXT,
    parent_id INTEGER, -- Para hierarquia
    manager_user_id INTEGER, -- Responsável pelo setor
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES departments (id) ON DELETE SET NULL,
    FOREIGN KEY (manager_user_id) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE(company_id, code)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_user_id);

-- 2. CRIAR TABELA DE CARGOS/FUNÇÕES
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- Ex: "Gerente", "Analista", "Coordenador"
    code TEXT NOT NULL, -- Ex: "GER", "ANA", "COORD"
    level INTEGER DEFAULT 1, -- Nível hierárquico (1=mais alto)
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    UNIQUE(company_id, code)
);

-- Índices para roles
CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);

-- 3. CRIAR TABELA DE PERMISSÕES DETALHADAS
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE, -- Ex: "users.create", "reports.view"
    module TEXT NOT NULL, -- Ex: "users", "reports", "companies"
    action TEXT NOT NULL, -- Ex: "create", "read", "update", "delete"
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
);

-- Índices para permissions
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- 4. POPULAR PERMISSÕES BÁSICAS
INSERT OR IGNORE INTO permissions (code, module, action, name, description, created_at) VALUES
-- Permissões de usuários
('users.create', 'users', 'create', 'Criar Usuários', 'Criar novos funcionários', datetime('now')),
('users.read', 'users', 'read', 'Visualizar Usuários', 'Ver lista de funcionários', datetime('now')),
('users.update', 'users', 'update', 'Editar Usuários', 'Editar dados de funcionários', datetime('now')),
('users.delete', 'users', 'delete', 'Excluir Usuários', 'Remover funcionários', datetime('now')),
('users.permissions', 'users', 'permissions', 'Gerenciar Permissões', 'Atribuir/revogar permissões', datetime('now')),

-- Permissões de setores
('departments.create', 'departments', 'create', 'Criar Setores', 'Criar novos setores', datetime('now')),
('departments.read', 'departments', 'read', 'Visualizar Setores', 'Ver lista de setores', datetime('now')),
('departments.update', 'departments', 'update', 'Editar Setores', 'Editar dados de setores', datetime('now')),
('departments.delete', 'departments', 'delete', 'Excluir Setores', 'Remover setores', datetime('now')),

-- Permissões de cargos
('roles.create', 'roles', 'create', 'Criar Cargos', 'Criar novos cargos', datetime('now')),
('roles.read', 'roles', 'read', 'Visualizar Cargos', 'Ver lista de cargos', datetime('now')),
('roles.update', 'roles', 'update', 'Editar Cargos', 'Editar dados de cargos', datetime('now')),
('roles.delete', 'roles', 'delete', 'Excluir Cargos', 'Remover cargos', datetime('now')),

-- Permissões de empresas
('companies.create', 'companies', 'create', 'Criar Empresas', 'Criar novas empresas', datetime('now')),
('companies.read', 'companies', 'read', 'Visualizar Empresas', 'Ver lista de empresas', datetime('now')),
('companies.update', 'companies', 'update', 'Editar Empresas', 'Editar dados de empresas', datetime('now')),
('companies.delete', 'companies', 'delete', 'Excluir Empresas', 'Remover empresas', datetime('now')),

-- Permissões de denúncias
('complaints.create', 'complaints', 'create', 'Criar Denúncias', 'Registrar denúncias', datetime('now')),
('complaints.read', 'complaints', 'read', 'Visualizar Denúncias', 'Ver denúncias', datetime('now')),
('complaints.update', 'complaints', 'update', 'Editar Denúncias', 'Alterar status/dados', datetime('now')),
('complaints.delete', 'complaints', 'delete', 'Excluir Denúncias', 'Remover denúncias', datetime('now')),

-- Permissões de não conformidades
('nonconformities.create', 'nonconformities', 'create', 'Criar NCs', 'Registrar não conformidades', datetime('now')),
('nonconformities.read', 'nonconformities', 'read', 'Visualizar NCs', 'Ver não conformidades', datetime('now')),
('nonconformities.update', 'nonconformities', 'update', 'Editar NCs', 'Alterar NCs', datetime('now')),
('nonconformities.delete', 'nonconformities', 'delete', 'Excluir NCs', 'Remover NCs', datetime('now')),

-- Permissões de documentação
('documentation.read', 'documentation', 'read', 'Visualizar Documentação', 'Acessar documentos', datetime('now')),
('documentation.upload', 'documentation', 'upload', 'Upload Documentos', 'Enviar documentos', datetime('now')),

-- Permissões de relatórios
('reports.view', 'reports', 'read', 'Visualizar Relatórios', 'Acessar relatórios', datetime('now')),
('reports.export', 'reports', 'export', 'Exportar Relatórios', 'Baixar relatórios', datetime('now')),

-- Permissões administrativas
('admin.system', 'admin', 'system', 'Administração Sistema', 'Acesso total ao sistema', datetime('now')),
('admin.audit', 'admin', 'audit', 'Visualizar Auditoria', 'Ver logs de auditoria', datetime('now'));

-- 5. CRIAR TABELA DE PERMISSÕES DE USUÁRIOS
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    department_id INTEGER, -- Permissão específica para um setor
    granted_by INTEGER NOT NULL, -- Quem concedeu
    granted_at TEXT NOT NULL,
    expires_at TEXT, -- Permissão temporária
    is_active INTEGER DEFAULT 1,
    notes TEXT, -- Observações sobre a permissão
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE(user_id, permission_id, department_id)
);

-- Índices para user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_department ON user_permissions(department_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at);

-- 6. ATUALIZAR TABELA DE USUÁRIOS
-- Adicionar campos novos (usar IF NOT EXISTS seria ideal, mas SQLite é limitado)
-- Usar ALTER TABLE com tratamento de erro

-- Adicionar campos um por um
ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id);
ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
ALTER TABLE users ADD COLUMN employee_code TEXT; -- Matrícula
ALTER TABLE users ADD COLUMN hire_date TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN is_manager INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'; -- active, inactive, suspended
ALTER TABLE users ADD COLUMN last_password_change TEXT;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;

-- Índices para novos campos
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);

-- 7. CRIAR TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL, -- create, update, delete, login, logout
    table_name TEXT, -- Tabela afetada
    record_id INTEGER, -- ID do registro afetado
    old_values TEXT, -- JSON com valores antigos
    new_values TEXT, -- JSON com valores novos
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 8. CRIAR TABELA DE PERMISSÕES DE CARGOS (para herança)
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    department_id INTEGER, -- Permissão específica para um setor
    created_at TEXT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id, department_id)
);

-- Índices para role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- 9. CRIAR DADOS PADRÃO PARA DESENVOLVIMENTO

-- Inserir setores padrão para empresas existentes
INSERT OR IGNORE INTO departments (company_id, name, code, description, is_active, created_at)
SELECT 
    c.id,
    'Administração',
    'ADM',
    'Setor administrativo geral',
    1,
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO departments (company_id, name, code, description, is_active, created_at)
SELECT 
    c.id,
    'Recursos Humanos',
    'RH',
    'Gestão de pessoas e recursos humanos',
    1,
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO departments (company_id, name, code, description, is_active, created_at)
SELECT 
    c.id,
    'Financeiro',
    'FIN',
    'Controladoria e finanças',
    1,
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO departments (company_id, name, code, description, is_active, created_at)
SELECT 
    c.id,
    'Tecnologia da Informação',
    'TI',
    'Desenvolvimento e infraestrutura de TI',
    1,
    datetime('now')
FROM companies c;

-- Inserir cargos padrão
INSERT OR IGNORE INTO roles (company_id, name, code, level, description, is_active, created_at)
SELECT 
    c.id,
    'Administrador',
    'ADMIN',
    1,
    'Administrador do sistema',
    1,
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO roles (company_id, name, code, level, description, is_active, created_at)
SELECT 
    c.id,
    'Gerente',
    'GER',
    2,
    'Gerente de setor',
    1,
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO roles (company_id, name, code, level, description, is_active, created_at)
SELECT 
    c.id,
    'Coordenador',
    'COORD',
    3,
    'Coordenador de equipe',
    1,
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO roles (company_id, name, code, level, description, is_active, created_at)
SELECT 
    c.id,
    'Analista',
    'ANA',
    4,
    'Analista júnior/pleno/sênior',
    1,
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO roles (company_id, name, code, level, description, is_active, created_at)
SELECT 
    c.id,
    'Assistente',
    'ASS',
    5,
    'Assistente operacional',
    1,
    datetime('now')
FROM companies c;

-- 10. MIGRAR DADOS EXISTENTES
-- Atualizar usuários admin para ter todas as permissões
UPDATE users SET 
    status = 'active',
    is_manager = 1,
    last_password_change = datetime('now')
WHERE user_type = 'admin';

-- Atribuir setor administrativo para usuários admin
UPDATE users SET department_id = (
    SELECT d.id FROM departments d 
    JOIN companies c ON d.company_id = c.id 
    WHERE d.code = 'ADM' 
    LIMIT 1
) WHERE user_type = 'admin' AND department_id IS NULL;

-- Atribuir cargo de administrador para usuários admin
UPDATE users SET role_id = (
    SELECT r.id FROM roles r 
    JOIN companies c ON r.company_id = c.id 
    WHERE r.code = 'ADMIN' 
    LIMIT 1
) WHERE user_type = 'admin' AND role_id IS NULL;

-- 11. VIEWS ÚTEIS PARA CONSULTAS

-- View para ver usuários com informações completas
CREATE VIEW IF NOT EXISTS v_users_complete AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.employee_code,
    u.status,
    u.user_type,
    u.hire_date,
    u.phone,
    u.is_manager,
    c.name as company_name,
    c.slug as company_slug,
    d.name as department_name,
    d.code as department_code,
    r.name as role_name,
    r.code as role_code,
    r.level as role_level,
    manager.full_name as manager_name,
    u.created_at,
    u.last_login
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN users manager ON u.manager_id = manager.id;

-- View para ver permissões efetivas dos usuários
CREATE VIEW IF NOT EXISTS v_user_effective_permissions AS
SELECT DISTINCT
    u.id as user_id,
    u.username,
    p.id as permission_id,
    p.code as permission_code,
    p.module,
    p.action,
    p.name as permission_name,
    CASE 
        WHEN up.id IS NOT NULL THEN 'user'
        WHEN rp.id IS NOT NULL THEN 'role'
        ELSE 'inherited'
    END as source,
    COALESCE(up.department_id, rp.department_id) as department_id,
    d.name as department_name
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = 1
LEFT JOIN role_permissions rp ON u.role_id = rp.role_id
LEFT JOIN permissions p ON (up.permission_id = p.id OR rp.permission_id = p.id)
LEFT JOIN departments d ON (up.department_id = d.id OR rp.department_id = d.id)
WHERE u.status = 'active' AND p.id IS NOT NULL;

-- 12. TRIGGERS PARA AUDITORIA

-- Trigger para auditoria de usuários
CREATE TRIGGER IF NOT EXISTS audit_users_update
    AFTER UPDATE ON users
    WHEN OLD.full_name != NEW.full_name 
      OR OLD.email != NEW.email
      OR OLD.department_id != NEW.department_id
      OR OLD.role_id != NEW.role_id
      OR OLD.status != NEW.status
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id, 
        old_values, new_values, created_at
    ) VALUES (
        NEW.id, 
        'update', 
        'users', 
        NEW.id,
        json_object(
            'full_name', OLD.full_name,
            'email', OLD.email,
            'department_id', OLD.department_id,
            'role_id', OLD.role_id,
            'status', OLD.status
        ),
        json_object(
            'full_name', NEW.full_name,
            'email', NEW.email,
            'department_id', NEW.department_id,
            'role_id', NEW.role_id,
            'status', NEW.status
        ),
        datetime('now')
    );
END;

-- Trigger para auditoria de permissões
CREATE TRIGGER IF NOT EXISTS audit_permissions_insert
    AFTER INSERT ON user_permissions
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id,
        new_values, created_at
    ) VALUES (
        NEW.granted_by,
        'grant_permission',
        'user_permissions',
        NEW.id,
        json_object(
            'user_id', NEW.user_id,
            'permission_id', NEW.permission_id,
            'department_id', NEW.department_id
        ),
        datetime('now')
    );
END;

-- 13. VERIFICAÇÃO DE INTEGRIDADE
-- Verificar se todas as tabelas foram criadas
SELECT 'Tabelas criadas:' as status;
SELECT name FROM sqlite_master WHERE type='table' AND name IN (
    'departments', 'roles', 'permissions', 'user_permissions', 
    'role_permissions', 'audit_logs'
);

-- Verificar se as permissões foram inseridas
SELECT 'Permissões inseridas:' as status;
SELECT COUNT(*) as total_permissions FROM permissions;

-- Verificar se os índices foram criados
SELECT 'Índices criados:' as status;
SELECT COUNT(*) as total_indexes 
FROM sqlite_master 
WHERE type='index' AND name LIKE 'idx_%';

-- ===============================================
-- FIM DA MIGRAÇÃO V2
-- ===============================================

-- Para executar esta migração:
-- 1. Faça backup do banco atual: cp events.db events_backup_$(date +%Y%m%d_%H%M%S).db
-- 2. Execute: sqlite3 events.db < database_migration_v2.sql
-- 3. Verifique os resultados das consultas finais
-- 4. Teste as funcionalidades básicas 