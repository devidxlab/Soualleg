-- ===============================================
-- MIGRAÇÃO AVANÇADA: SISTEMA DE NÃO CONFORMIDADES
-- Data: $(date)
-- Objetivo: Implementar permissões granulares, notificações e proteção de identidades
-- ===============================================

-- =========================================
-- 1. EXPANDIR TABELA DE NÃO CONFORMIDADES
-- =========================================

-- Adicionar campos de controle de acesso
ALTER TABLE nonconformities ADD COLUMN target_user_id INTEGER;
ALTER TABLE nonconformities ADD COLUMN target_department_id INTEGER;
ALTER TABLE nonconformities ADD COLUMN reporter_user_id INTEGER;
ALTER TABLE nonconformities ADD COLUMN anonymized_reporter TEXT;
ALTER TABLE nonconformities ADD COLUMN anonymized_target TEXT;
ALTER TABLE nonconformities ADD COLUMN severity_level TEXT DEFAULT 'MEDIUM';
ALTER TABLE nonconformities ADD COLUMN workflow_status TEXT DEFAULT 'REPORTED';
ALTER TABLE nonconformities ADD COLUMN requires_manager_approval INTEGER DEFAULT 0;
ALTER TABLE nonconformities ADD COLUMN manager_approved_by INTEGER;
ALTER TABLE nonconformities ADD COLUMN manager_approved_at TEXT;
ALTER TABLE nonconformities ADD COLUMN is_anonymous INTEGER DEFAULT 0;
ALTER TABLE nonconformities ADD COLUMN confidentiality_level TEXT DEFAULT 'INTERNAL';
ALTER TABLE nonconformities ADD COLUMN due_date TEXT;
ALTER TABLE nonconformities ADD COLUMN escalation_level INTEGER DEFAULT 0;
ALTER TABLE nonconformities ADD COLUMN assigned_to INTEGER;
ALTER TABLE nonconformities ADD COLUMN priority TEXT DEFAULT 'NORMAL';
ALTER TABLE nonconformities ADD COLUMN impact_assessment TEXT;
ALTER TABLE nonconformities ADD COLUMN corrective_action_plan TEXT;
ALTER TABLE nonconformities ADD COLUMN estimated_resolution_date TEXT;
ALTER TABLE nonconformities ADD COLUMN actual_resolution_date TEXT;

-- Adicionar foreign keys
-- ALTER TABLE nonconformities ADD FOREIGN KEY (target_user_id) REFERENCES users (id);
-- ALTER TABLE nonconformities ADD FOREIGN KEY (target_department_id) REFERENCES departments (id);
-- ALTER TABLE nonconformities ADD FOREIGN KEY (reporter_user_id) REFERENCES users (id);
-- ALTER TABLE nonconformities ADD FOREIGN KEY (manager_approved_by) REFERENCES users (id);
-- ALTER TABLE nonconformities ADD FOREIGN KEY (assigned_to) REFERENCES users (id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_nonconformities_target_user ON nonconformities(target_user_id);
CREATE INDEX IF NOT EXISTS idx_nonconformities_target_dept ON nonconformities(target_department_id);
CREATE INDEX IF NOT EXISTS idx_nonconformities_reporter ON nonconformities(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_nonconformities_workflow ON nonconformities(workflow_status);
CREATE INDEX IF NOT EXISTS idx_nonconformities_severity ON nonconformities(severity_level);
CREATE INDEX IF NOT EXISTS idx_nonconformities_assigned ON nonconformities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_nonconformities_due_date ON nonconformities(due_date);

-- =========================================
-- 2. CRIAR TABELA DE NOTIFICAÇÕES
-- =========================================

CREATE TABLE IF NOT EXISTS nc_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL, -- EMAIL, IN_APP, PUSH, SMS
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    sent_at TEXT NOT NULL,
    read_at TEXT,
    delivery_status TEXT DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, FAILED
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    metadata TEXT, -- JSON com dados extras
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nc_notifications_user ON nc_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_notifications_nc ON nc_notifications(nonconformity_id);
CREATE INDEX IF NOT EXISTS idx_nc_notifications_unread ON nc_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_nc_notifications_type ON nc_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_nc_notifications_status ON nc_notifications(delivery_status);

-- =========================================
-- 3. CRIAR TABELA DE AUDITORIA DE ACESSO
-- =========================================

CREATE TABLE IF NOT EXISTS nc_access_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    access_type TEXT NOT NULL, -- VIEW, EDIT, COMMENT, DOWNLOAD, PRINT, EXPORT
    accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    data_accessed TEXT, -- JSON com detalhes do que foi acessado
    access_reason TEXT, -- Motivo do acesso (opcional)
    access_duration INTEGER, -- Tempo de acesso em segundos
    anonymization_level TEXT, -- Nível de anonimização aplicado
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nc_audit_nc ON nc_access_audit(nonconformity_id);
CREATE INDEX IF NOT EXISTS idx_nc_audit_user ON nc_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_audit_date ON nc_access_audit(accessed_at);
CREATE INDEX IF NOT EXISTS idx_nc_audit_type ON nc_access_audit(access_type);
CREATE INDEX IF NOT EXISTS idx_nc_audit_session ON nc_access_audit(session_id);

-- =========================================
-- 4. CRIAR TABELA DE PERMISSÕES ESPECÍFICAS
-- =========================================

CREATE TABLE IF NOT EXISTS nc_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER,
    department_id INTEGER,
    role_id INTEGER,
    permission_type TEXT NOT NULL, -- VIEW, EDIT, COMMENT, RESOLVE, ESCALATE, AUDIT, APPROVE
    permission_level TEXT DEFAULT 'STANDARD', -- STANDARD, ELEVATED, ADMIN
    granted_by INTEGER NOT NULL, -- User who granted permission
    granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT, -- Permissão temporária
    is_active INTEGER DEFAULT 1,
    reason TEXT, -- Motivo da concessão
    conditions TEXT, -- Condições especiais (JSON)
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_nc_permissions_nc ON nc_permissions(nonconformity_id);
CREATE INDEX IF NOT EXISTS idx_nc_permissions_user ON nc_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_permissions_dept ON nc_permissions(department_id);
CREATE INDEX IF NOT EXISTS idx_nc_permissions_role ON nc_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_nc_permissions_active ON nc_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_nc_permissions_expires ON nc_permissions(expires_at);

-- =========================================
-- 5. CRIAR TABELA DE AÇÕES E COMENTÁRIOS
-- =========================================

CREATE TABLE IF NOT EXISTS nc_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- COMMENT, STATUS_CHANGE, ASSIGNMENT, ESCALATION, APPROVAL, REJECTION
    description TEXT NOT NULL,
    old_value TEXT, -- Valor anterior (para mudanças)
    new_value TEXT, -- Novo valor
    is_internal INTEGER DEFAULT 0, -- Comentário interno (não visível para todos)
    visibility_level TEXT DEFAULT 'ALL', -- ALL, MANAGEMENT, DEPARTMENT, INVOLVED
    attachments TEXT, -- Lista de anexos (JSON)
    mentions TEXT, -- Usuários mencionados (JSON)
    priority TEXT DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT,
    deleted_at TEXT, -- Soft delete
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nc_actions_nc ON nc_actions(nonconformity_id);
CREATE INDEX IF NOT EXISTS idx_nc_actions_user ON nc_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_actions_date ON nc_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_nc_actions_type ON nc_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_nc_actions_priority ON nc_actions(priority);
CREATE INDEX IF NOT EXISTS idx_nc_actions_visibility ON nc_actions(visibility_level);

-- =========================================
-- 6. CRIAR TABELA DE CONFIGURAÇÕES DE NC
-- =========================================

CREATE TABLE IF NOT EXISTS nc_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type TEXT DEFAULT 'STRING', -- STRING, INTEGER, BOOLEAN, JSON
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    UNIQUE(company_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_nc_settings_company ON nc_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_nc_settings_key ON nc_settings(setting_key);

-- =========================================
-- 7. INSERIR CONFIGURAÇÕES PADRÃO
-- =========================================

-- Configurações padrão para cada empresa
INSERT OR IGNORE INTO nc_settings (company_id, setting_key, setting_value, setting_type, description, created_at)
SELECT 
    c.id,
    'nc.escalation_hours',
    '24',
    'INTEGER',
    'Horas para escalação automática de NC',
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO nc_settings (company_id, setting_key, setting_value, setting_type, description, created_at)
SELECT 
    c.id,
    'nc.critical_escalation_hours',
    '2',
    'INTEGER',
    'Horas para escalação de NC crítica',
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO nc_settings (company_id, setting_key, setting_value, setting_type, description, created_at)
SELECT 
    c.id,
    'nc.auto_close_days',
    '30',
    'INTEGER',
    'Dias para fechamento automático de NC resolvida',
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO nc_settings (company_id, setting_key, setting_value, setting_type, description, created_at)
SELECT 
    c.id,
    'nc.notification_enabled',
    'true',
    'BOOLEAN',
    'Habilitar notificações de NC',
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO nc_settings (company_id, setting_key, setting_value, setting_type, description, created_at)
SELECT 
    c.id,
    'nc.email_notifications',
    'true',
    'BOOLEAN',
    'Habilitar notificações por email',
    datetime('now')
FROM companies c;

INSERT OR IGNORE INTO nc_settings (company_id, setting_key, setting_value, setting_type, description, created_at)
SELECT 
    c.id,
    'nc.anonymization_level',
    'INITIALS',
    'STRING',
    'Nível de anonimização padrão (NONE, PARTIAL, INITIALS, FULL)',
    datetime('now')
FROM companies c;

-- =========================================
-- 8. ADICIONAR NOVAS PERMISSÕES DE NC
-- =========================================

INSERT OR IGNORE INTO permissions (code, module, action, name, description, created_at) VALUES
('nc.view_own', 'nonconformities', 'view', 'Ver Próprias NCs', 'Ver NCs onde é o alvo ou reporter', datetime('now')),
('nc.view_department', 'nonconformities', 'view', 'Ver NCs do Setor', 'Ver todas NCs do seu setor', datetime('now')),
('nc.view_all', 'nonconformities', 'view', 'Ver Todas NCs', 'Ver todas as NCs da empresa', datetime('now')),
('nc.create_anonymous', 'nonconformities', 'create', 'Criar NC Anônima', 'Criar NC de forma anônima', datetime('now')),
('nc.escalate', 'nonconformities', 'escalate', 'Escalar NC', 'Escalar NC para nível superior', datetime('now')),
('nc.approve', 'nonconformities', 'approve', 'Aprovar NC', 'Aprovar resolução de NC', datetime('now')),
('nc.view_audit', 'nonconformities', 'audit', 'Ver Auditoria', 'Ver logs de acesso das NCs', datetime('now')),
('nc.export', 'nonconformities', 'export', 'Exportar NCs', 'Exportar relatórios de NCs', datetime('now')),
('nc.assign', 'nonconformities', 'assign', 'Atribuir NC', 'Atribuir NC para outros usuários', datetime('now')),
('nc.change_status', 'nonconformities', 'status', 'Alterar Status', 'Alterar status da NC', datetime('now')),
('nc.view_confidential', 'nonconformities', 'view', 'Ver NCs Confidenciais', 'Ver NCs com nível confidencial', datetime('now')),
('nc.manage_settings', 'nonconformities', 'manage', 'Gerenciar Configurações', 'Gerenciar configurações de NC', datetime('now'));

-- =========================================
-- 9. ATRIBUIR PERMISSÕES PADRÃO POR CARGO
-- =========================================

-- Administradores (nível 1) - acesso total
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, datetime('now')
FROM roles r, permissions p
WHERE r.level = 1 AND p.module = 'nonconformities';

-- Gerentes (nível 2) - acesso amplo
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, datetime('now')
FROM roles r, permissions p
WHERE r.level = 2 AND p.code IN (
    'nc.view_department', 'nc.view_all', 'nc.create', 'nc.update', 
    'nc.escalate', 'nc.approve', 'nc.assign', 'nc.change_status', 'nc.export'
);

-- Coordenadores (nível 3) - acesso departamental
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, datetime('now')
FROM roles r, permissions p
WHERE r.level = 3 AND p.code IN (
    'nc.view_department', 'nc.create', 'nc.update', 'nc.escalate', 'nc.assign'
);

-- Analistas (nível 4) - acesso básico
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, datetime('now')
FROM roles r, permissions p
WHERE r.level = 4 AND p.code IN (
    'nc.view_own', 'nc.create', 'nc.create_anonymous'
);

-- Assistentes (nível 5) - acesso limitado
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, datetime('now')
FROM roles r, permissions p
WHERE r.level = 5 AND p.code IN (
    'nc.view_own', 'nc.create_anonymous'
);

-- =========================================
-- 10. CRIAR TRIGGERS PARA AUDITORIA
-- =========================================

-- Trigger para registrar acesso às NCs
CREATE TRIGGER IF NOT EXISTS nc_view_audit
AFTER SELECT ON nonconformities
WHEN NEW.id IS NOT NULL
BEGIN
    INSERT INTO nc_access_audit (
        nonconformity_id, user_id, access_type, accessed_at, data_accessed
    ) VALUES (
        NEW.id, 
        COALESCE((SELECT user_id FROM current_session LIMIT 1), 0),
        'VIEW',
        datetime('now'),
        json_object('action', 'view_nc', 'nc_id', NEW.id)
    );
END;

-- =========================================
-- 11. ATUALIZAR NCs EXISTENTES
-- =========================================

-- Atualizar NCs existentes com valores padrão
UPDATE nonconformities 
SET 
    severity_level = COALESCE(severity_level, 'MEDIUM'),
    workflow_status = COALESCE(workflow_status, 'REPORTED'),
    confidentiality_level = COALESCE(confidentiality_level, 'INTERNAL'),
    escalation_level = COALESCE(escalation_level, 0),
    priority = COALESCE(priority, 'NORMAL')
WHERE severity_level IS NULL 
   OR workflow_status IS NULL 
   OR confidentiality_level IS NULL 
   OR escalation_level IS NULL
   OR priority IS NULL;

-- =========================================
-- 12. CRIAR VIEWS PARA RELATÓRIOS
-- =========================================

-- View para NCs com informações completas
CREATE VIEW IF NOT EXISTS nc_complete_view AS
SELECT 
    nc.*,
    reporter.full_name as reporter_name,
    reporter.email as reporter_email,
    target.full_name as target_name,
    target.email as target_email,
    target_dept.name as target_department_name,
    assigned.full_name as assigned_to_name,
    approver.full_name as approver_name,
    c.name as company_name
FROM nonconformities nc
LEFT JOIN users reporter ON nc.reporter_user_id = reporter.id
LEFT JOIN users target ON nc.target_user_id = target.id
LEFT JOIN users assigned ON nc.assigned_to = assigned.id
LEFT JOIN users approver ON nc.manager_approved_by = approver.id
LEFT JOIN departments target_dept ON nc.target_department_id = target_dept.id
LEFT JOIN companies c ON nc.company_id = c.id;

-- View para estatísticas de NC
CREATE VIEW IF NOT EXISTS nc_stats_view AS
SELECT 
    company_id,
    COUNT(*) as total_ncs,
    COUNT(CASE WHEN workflow_status = 'REPORTED' THEN 1 END) as reported_count,
    COUNT(CASE WHEN workflow_status = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN workflow_status = 'RESOLVED' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN workflow_status = 'CLOSED' THEN 1 END) as closed_count,
    COUNT(CASE WHEN severity_level = 'CRITICAL' THEN 1 END) as critical_count,
    COUNT(CASE WHEN severity_level = 'HIGH' THEN 1 END) as high_count,
    COUNT(CASE WHEN severity_level = 'MEDIUM' THEN 1 END) as medium_count,
    COUNT(CASE WHEN severity_level = 'LOW' THEN 1 END) as low_count,
    AVG(CASE 
        WHEN actual_resolution_date IS NOT NULL 
        THEN julianday(actual_resolution_date) - julianday(created_at)
        ELSE NULL 
    END) as avg_resolution_days
FROM nonconformities
GROUP BY company_id;

-- ===============================================
-- MIGRAÇÃO CONCLUÍDA
-- ===============================================

-- Verificar se todas as tabelas foram criadas
SELECT 'Migração NC Avançada Concluída!' as status,
       datetime('now') as completed_at,
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name LIKE 'nc_%') as new_tables_created;

PRAGMA integrity_check; 