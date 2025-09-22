# 📋 TASKLIST COMPLETA - SISTEMA AVANÇADO DE NÃO CONFORMIDADES

## 🎯 **OBJETIVO**
Implementar sistema completo de não conformidades com:
- ✅ Controle de permissões granulares
- ✅ Sistema de notificações hierárquicas (funcionário + gerência)
- ✅ Proteção de identidades (anonimização parcial)
- ✅ Auditoria de acesso
- ✅ Workflow de aprovação

---

## 📊 **SITUAÇÃO ATUAL vs NECESSÁRIA**

### **ATUAL:**
- ✅ Tabela `nonconformities` básica
- ✅ Interface de criação/visualização
- ✅ Permissões simples (`can_view_naoconformidades`)
- ✅ Setores básicos
- ❌ Sem notificações automáticas
- ❌ Sem proteção de identidades
- ❌ Sem controle granular de acesso
- ❌ Sem auditoria de visualização

### **NECESSÁRIO:**
- ✅ Sistema de notificações multi-canal
- ✅ Anonimização inteligente de dados
- ✅ Permissões por setor e hierarquia
- ✅ Auditoria completa de acesso
- ✅ Workflow com estados avançados

---

## 🗄️ **FASE 1: ESTRUTURA DE BANCO DE DADOS**

### **1.1 Expandir Tabela de Não Conformidades**
- [ ] **1.1.1** Adicionar campos de controle de acesso
  ```sql
  ALTER TABLE nonconformities ADD COLUMN target_user_id INTEGER; -- Funcionário alvo
  ALTER TABLE nonconformities ADD COLUMN target_department_id INTEGER; -- Setor alvo
  ALTER TABLE nonconformities ADD COLUMN reporter_user_id INTEGER; -- Quem reportou
  ALTER TABLE nonconformities ADD COLUMN anonymized_reporter TEXT; -- Nome anonimizado do reporter
  ALTER TABLE nonconformities ADD COLUMN anonymized_target TEXT; -- Nome anonimizado do alvo
  ALTER TABLE nonconformities ADD COLUMN severity_level TEXT DEFAULT 'MEDIUM'; -- LOW, MEDIUM, HIGH, CRITICAL
  ALTER TABLE nonconformities ADD COLUMN workflow_status TEXT DEFAULT 'REPORTED'; -- REPORTED, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CLOSED
  ALTER TABLE nonconformities ADD COLUMN requires_manager_approval INTEGER DEFAULT 0;
  ALTER TABLE nonconformities ADD COLUMN manager_approved_by INTEGER;
  ALTER TABLE nonconformities ADD COLUMN manager_approved_at TEXT;
  ALTER TABLE nonconformities ADD COLUMN is_anonymous INTEGER DEFAULT 0;
  ALTER TABLE nonconformities ADD COLUMN confidentiality_level TEXT DEFAULT 'INTERNAL'; -- PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL
  ALTER TABLE nonconformities ADD COLUMN due_date TEXT; -- Prazo para resolução
  ALTER TABLE nonconformities ADD COLUMN escalation_level INTEGER DEFAULT 0; -- Nível de escalação
  
  -- Índices
  CREATE INDEX IF NOT EXISTS idx_nonconformities_target_user ON nonconformities(target_user_id);
  CREATE INDEX IF NOT EXISTS idx_nonconformities_target_dept ON nonconformities(target_department_id);
  CREATE INDEX IF NOT EXISTS idx_nonconformities_reporter ON nonconformities(reporter_user_id);
  CREATE INDEX IF NOT EXISTS idx_nonconformities_workflow ON nonconformities(workflow_status);
  CREATE INDEX IF NOT EXISTS idx_nonconformities_severity ON nonconformities(severity_level);
  ```

### **1.2 Criar Tabela de Notificações**
- [ ] **1.2.1** Tabela para gerenciar notificações
  ```sql
  CREATE TABLE IF NOT EXISTS nc_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL, -- EMAIL, IN_APP, PUSH, SMS
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    sent_at TEXT NOT NULL,
    read_at TEXT,
    delivery_status TEXT DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, FAILED
    retry_count INTEGER DEFAULT 0,
    metadata TEXT, -- JSON com dados extras
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
  
  CREATE INDEX IF NOT EXISTS idx_nc_notifications_user ON nc_notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_nc_notifications_nc ON nc_notifications(nonconformity_id);
  CREATE INDEX IF NOT EXISTS idx_nc_notifications_unread ON nc_notifications(user_id, is_read);
  ```

### **1.3 Criar Tabela de Auditoria de Acesso**
- [ ] **1.3.1** Log de quem visualizou quais NCs
  ```sql
  CREATE TABLE IF NOT EXISTS nc_access_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    access_type TEXT NOT NULL, -- VIEW, EDIT, COMMENT, DOWNLOAD, PRINT
    accessed_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    data_accessed TEXT, -- JSON com detalhes do que foi acessado
    access_reason TEXT, -- Motivo do acesso
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
  
  CREATE INDEX IF NOT EXISTS idx_nc_audit_nc ON nc_access_audit(nonconformity_id);
  CREATE INDEX IF NOT EXISTS idx_nc_audit_user ON nc_access_audit(user_id);
  CREATE INDEX IF NOT EXISTS idx_nc_audit_date ON nc_access_audit(accessed_at);
  ```

### **1.4 Criar Tabela de Permissões Específicas de NC**
- [ ] **1.4.1** Permissões granulares por NC
  ```sql
  CREATE TABLE IF NOT EXISTS nc_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER,
    department_id INTEGER,
    role_id INTEGER,
    permission_type TEXT NOT NULL, -- VIEW, EDIT, COMMENT, RESOLVE, ESCALATE, AUDIT
    granted_by INTEGER NOT NULL, -- User who granted permission
    granted_at TEXT NOT NULL,
    expires_at TEXT, -- Permissão temporária
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users (id)
  );
  
  CREATE INDEX IF NOT EXISTS idx_nc_permissions_nc ON nc_permissions(nonconformity_id);
  CREATE INDEX IF NOT EXISTS idx_nc_permissions_user ON nc_permissions(user_id);
  ```

### **1.5 Criar Tabela de Comentários/Ações**
- [ ] **1.5.1** Histórico de ações e comentários
  ```sql
  CREATE TABLE IF NOT EXISTS nc_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nonconformity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- COMMENT, STATUS_CHANGE, ASSIGNMENT, ESCALATION, APPROVAL
    description TEXT NOT NULL,
    old_value TEXT, -- Valor anterior (para mudanças)
    new_value TEXT, -- Novo valor
    is_internal INTEGER DEFAULT 0, -- Comentário interno (não visível para todos)
    attachments TEXT, -- Lista de anexos
    created_at TEXT NOT NULL,
    FOREIGN KEY (nonconformity_id) REFERENCES nonconformities (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
  
  CREATE INDEX IF NOT EXISTS idx_nc_actions_nc ON nc_actions(nonconformity_id);
  CREATE INDEX IF NOT EXISTS idx_nc_actions_user ON nc_actions(user_id);
  CREATE INDEX IF NOT EXISTS idx_nc_actions_date ON nc_actions(created_at);
  ```

---

## 🔔 **FASE 2: SISTEMA DE NOTIFICAÇÕES**

### **2.1 Configurar Sistema de Email**
- [ ] **2.1.1** Instalar dependências de email
  ```bash
  npm install nodemailer @sendgrid/mail mailgun-js
  ```

- [ ] **2.1.2** Criar configuração de email
  ```javascript
  // src/server/config/email.js
  const nodemailer = require('nodemailer');
  
  const emailConfig = {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'naoconformidades@sistema.com'
  };
  ```

- [ ] **2.1.3** Criar templates de email
  ```javascript
  // src/server/templates/nc-notification.html
  // Template para notificação de nova NC
  // Template para escalação
  // Template para resolução
  ```

### **2.2 Implementar Sistema de Notificações In-App**
- [ ] **2.2.1** Criar serviço de notificações
  ```javascript
  // src/server/services/notificationService.js
  class NotificationService {
    async sendNCNotification(ncId, userId, type, message) {}
    async markAsRead(notificationId, userId) {}
    async getUnreadNotifications(userId) {}
    async sendEmailNotification(to, subject, template, data) {}
  }
  ```

- [ ] **2.2.2** Implementar WebSocket para notificações real-time
  ```bash
  npm install socket.io
  ```

### **2.3 Sistema de Escalação Automática**
- [ ] **2.3.1** Criar job scheduler para escalações
  ```bash
  npm install node-cron
  ```

- [ ] **2.3.2** Implementar lógica de escalação
  ```javascript
  // Escalação automática após X horas sem resposta
  // Notificação para gerência
  // Escalação para diretoria em casos críticos
  ```

---

## 🔒 **FASE 3: PROTEÇÃO DE IDENTIDADES**

### **3.1 Sistema de Anonimização**
- [ ] **3.1.1** Criar função de anonimização inteligente
  ```javascript
  // src/server/utils/anonymizer.js
  class Anonymizer {
    static anonymizeName(fullName) {
      // "Cleverson Pompeu" -> "CP"
      // "Maria José Silva" -> "MJS"
      // "João" -> "J"
    }
    
    static anonymizeEmail(email) {
      // "user@domain.com" -> "u***@domain.com"
    }
    
    static anonymizePhone(phone) {
      // "(67) 99999-9999" -> "(67) 9****-***9"
    }
  }
  ```

- [ ] **3.1.2** Implementar níveis de anonimização
  ```javascript
  const anonymizationLevels = {
    NONE: 0,        // Dados completos
    PARTIAL: 1,     // Iniciais + sobrenome
    INITIALS: 2,    // Apenas iniciais
    FULL: 3         // Completamente anônimo
  };
  ```

### **3.2 Controle de Visualização de Dados**
- [ ] **3.2.1** Criar middleware de anonimização
  ```javascript
  // Aplicar anonimização baseada no usuário que está visualizando
  // Gerentes veem mais dados que funcionários comuns
  // Usuário alvo vê dados completos da própria NC
  ```

- [ ] **3.2.2** Implementar mascaramento de dados sensíveis
  ```javascript
  // Mascarar CPF, RG, endereços, etc.
  // Baseado no nível de permissão do usuário
  ```

---

## 👥 **FASE 4: SISTEMA DE PERMISSÕES GRANULARES**

### **4.1 Expandir Sistema de Permissões**
- [ ] **4.1.1** Adicionar permissões específicas de NC
  ```sql
  INSERT INTO permissions (code, module, action, name, description, created_at) VALUES
  ('nc.view_own', 'nonconformities', 'view', 'Ver Próprias NCs', 'Ver NCs onde é o alvo', datetime('now')),
  ('nc.view_department', 'nonconformities', 'view', 'Ver NCs do Setor', 'Ver todas NCs do seu setor', datetime('now')),
  ('nc.view_all', 'nonconformities', 'view', 'Ver Todas NCs', 'Ver todas as NCs da empresa', datetime('now')),
  ('nc.create_anonymous', 'nonconformities', 'create', 'Criar NC Anônima', 'Criar NC de forma anônima', datetime('now')),
  ('nc.escalate', 'nonconformities', 'escalate', 'Escalar NC', 'Escalar NC para nível superior', datetime('now')),
  ('nc.approve', 'nonconformities', 'approve', 'Aprovar NC', 'Aprovar resolução de NC', datetime('now')),
  ('nc.view_audit', 'nonconformities', 'audit', 'Ver Auditoria', 'Ver logs de acesso das NCs', datetime('now')),
  ('nc.export', 'nonconformities', 'export', 'Exportar NCs', 'Exportar relatórios de NCs', datetime('now'));
  ```

### **4.2 Implementar Verificação de Permissões**
- [ ] **4.2.1** Criar middleware de autorização
  ```javascript
  // src/server/middleware/ncAuthorization.js
  const checkNCPermission = (permission) => {
    return async (req, res, next) => {
      const userId = req.user.id;
      const ncId = req.params.ncId;
      
      const hasPermission = await NCPermissionService.checkPermission(
        userId, ncId, permission
      );
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Acesso negado para esta não conformidade' 
        });
      }
      
      next();
    };
  };
  ```

### **4.3 Sistema de Herança de Permissões**
- [ ] **4.3.1** Implementar lógica de herança hierárquica
  ```javascript
  // Gerente herda permissões dos subordinados
  // Diretor herda permissões de todos os setores
  // RH tem acesso especial
  ```

---

## 🔄 **FASE 5: SISTEMA DE WORKFLOW**

### **5.1 Estados Avançados de NC**
- [ ] **5.1.1** Implementar máquina de estados
  ```javascript
  const ncWorkflowStates = {
    REPORTED: 'Reportada',
    ACKNOWLEDGED: 'Reconhecida',
    INVESTIGATING: 'Em Investigação',
    ACTION_PLANNED: 'Ação Planejada',
    IN_PROGRESS: 'Em Andamento',
    PENDING_APPROVAL: 'Aguardando Aprovação',
    RESOLVED: 'Resolvida',
    VERIFIED: 'Verificada',
    CLOSED: 'Fechada',
    REOPENED: 'Reaberta'
  };
  ```

### **5.2 Fluxo de Aprovação**
- [ ] **5.2.1** Criar sistema de aprovação em cascata
  ```javascript
  // 1. Funcionário reconhece NC
  // 2. Supervisor aprova plano de ação
  // 3. Gerente aprova implementação
  // 4. Qualidade verifica eficácia
  ```

### **5.3 Sistema de SLA**
- [ ] **5.3.1** Implementar controle de prazos
  ```javascript
  // Prazos automáticos baseados na severidade
  // Alertas de vencimento
  // Escalação automática por atraso
  ```

---

## 🌐 **FASE 6: APIS AVANÇADAS**

### **6.1 Endpoints de Gestão de NC**
- [ ] **6.1.1** APIs com controle de acesso granular
  ```javascript
  // GET /api/nonconformities - Lista com filtros de permissão
  // POST /api/nonconformities - Criar com validação de permissões
  // GET /api/nonconformities/:id - Visualizar com anonimização
  // PUT /api/nonconformities/:id/status - Alterar status
  // POST /api/nonconformities/:id/escalate - Escalar NC
  // GET /api/nonconformities/:id/audit - Ver auditoria
  ```

### **6.2 APIs de Notificações**
- [ ] **6.2.1** Endpoints de gerenciamento de notificações
  ```javascript
  // GET /api/notifications - Listar notificações do usuário
  // PUT /api/notifications/:id/read - Marcar como lida
  // POST /api/notifications/mark-all-read - Marcar todas como lidas
  // GET /api/notifications/unread-count - Contar não lidas
  ```

### **6.3 APIs de Relatórios**
- [ ] **6.3.1** Relatórios com controle de acesso
  ```javascript
  // GET /api/reports/nc-summary - Resumo de NCs
  // GET /api/reports/nc-by-department - Por departamento
  // GET /api/reports/nc-trends - Tendências
  // POST /api/reports/export - Exportar (com permissão)
  ```

---

## 🎨 **FASE 7: INTERFACES FRONTEND**

### **7.1 Dashboard de NC com Permissões**
- [ ] **7.1.1** Adaptar página de NCs existente
  ```jsx
  // src/pages/Naoconformidades.jsx
  // Filtrar NCs baseado nas permissões do usuário
  // Mostrar dados anonimizados conforme necessário
  // Indicadores visuais de permissões
  ```

- [ ] **7.1.2** Implementar componentes de notificação
  ```jsx
  // src/components/NotificationBell.jsx
  // src/components/NotificationList.jsx
  // src/components/NotificationItem.jsx
  ```

### **7.2 Interface de Visualização Restrita**
- [ ] **7.2.1** Criar componente de NC com controle de acesso
  ```jsx
  // src/components/RestrictedNCView.jsx
  // Mostrar apenas campos permitidos
  // Aplicar anonimização onde necessário
  // Log de auditoria automático
  ```

### **7.3 Sistema de Comentários e Ações**
- [ ] **7.3.1** Interface para timeline de ações
  ```jsx
  // src/components/NCTimeline.jsx
  // src/components/NCActionForm.jsx
  // src/components/NCEscalationDialog.jsx
  ```

---

## 🧪 **FASE 8: TESTES E VALIDAÇÃO**

### **8.1 Testes de Permissões**
- [ ] **8.1.1** Criar cenários de teste
  ```javascript
  // test/nc-permissions.test.js
  // Testar acesso por hierarquia
  // Testar anonimização
  // Testar escalação automática
  ```

### **8.2 Testes de Notificações**
- [ ] **8.2.1** Validar sistema de notificações
  ```javascript
  // Testar envio de emails
  // Testar notificações real-time
  // Testar escalação por timeout
  ```

### **8.3 Testes de Auditoria**
- [ ] **8.3.1** Verificar logs de auditoria
  ```javascript
  // Validar log de acessos
  // Testar relatórios de auditoria
  // Verificar retenção de dados
  ```

---

## 🚀 **FASE 9: DEPLOY E CONFIGURAÇÃO**

### **9.1 Configurações de Produção**
- [ ] **9.1.1** Variáveis de ambiente
  ```bash
  # .env.production
  SMTP_HOST=smtp.empresa.com
  SMTP_PORT=587
  SMTP_USER=sistema@empresa.com
  SMTP_PASS=senha_segura
  EMAIL_FROM=naoconformidades@empresa.com
  
  NC_ESCALATION_HOURS=24
  NC_CRITICAL_ESCALATION_HOURS=2
  NC_AUTO_CLOSE_DAYS=30
  ```

### **9.2 Configurar Servidor de Email**
- [ ] **9.2.1** Setup SMTP/SendGrid
- [ ] **9.2.2** Configurar templates de email
- [ ] **9.2.3** Testar envio de emails

---

## 📊 **PRIORIZAÇÃO E CRONOGRAMA**

### **🔥 SEMANA 1 (CRÍTICO)**
1. ✅ Estrutura de banco (Fase 1) - 5 dias
2. ✅ Sistema básico de notificações (2.1, 2.2) - 3 dias
3. ✅ Anonimização básica (3.1) - 2 dias

### **⚡ SEMANA 2 (ALTO)**
1. ✅ Permissões granulares (4.1, 4.2) - 4 dias
2. ✅ APIs básicas (6.1) - 3 dias
3. ✅ Interface adaptada (7.1) - 3 dias

### **📊 SEMANA 3 (MÉDIO)**
1. ✅ Workflow avançado (5.1, 5.2) - 4 dias
2. ✅ Sistema de auditoria (1.3) - 2 dias
3. ✅ Testes básicos (8.1, 8.2) - 2 dias

### **✨ SEMANA 4 (BAIXO)**
1. ✅ Interfaces avançadas (7.2, 7.3) - 3 dias
2. ✅ Deploy e configuração (9.1, 9.2) - 2 dias
3. ✅ Documentação e treinamento - 2 dias

---

## 🎯 **CRITÉRIOS DE ACEITAÇÃO**

### **Para Permissões:**
- [ ] Funcionário vê apenas NCs que o afetam
- [ ] Gerente vê todas NCs do seu setor
- [ ] Diretores veem todas NCs da empresa
- [ ] RH tem acesso especial para NCs relacionadas a pessoal
- [ ] Auditoria completa de quem acessou o quê

### **Para Notificações:**
- [ ] Funcionário alvo recebe notificação imediata
- [ ] Gerência é notificada automaticamente
- [ ] Escalação automática após 24h sem resposta
- [ ] Email + notificação in-app funcionando
- [ ] Templates de email profissionais

### **Para Proteção de Identidades:**
- [ ] "Cleverson Pompeu" aparece como "CP" para outros
- [ ] Dados sensíveis mascarados baseado na permissão
- [ ] Funcionário alvo vê nome completo do reporter
- [ ] Gerência vê nomes completos quando necessário

### **Para Workflow:**
- [ ] Estados bem definidos e controlados
- [ ] Aprovações funcionando em cascata
- [ ] SLA automático baseado na severidade
- [ ] Histórico completo de ações

---

## 📋 **EXEMPLO DE FLUXO COMPLETO**

### **Cenário:** Cleverson Pompeu reporta NC sobre Maria Joaquina

1. **Criação:**
   - Cleverson cria NC sobre Maria
   - Sistema anonimiza: "CP reportou NC sobre Maria Joaquina"
   - NC recebe ID: NC-2025-001

2. **Notificações Automáticas:**
   - 📧 Email para Maria: "Nova NC recebida de CP"
   - 📧 Email para gerente do setor de Maria
   - 🔔 Notificação in-app para ambos

3. **Visualização Restrita:**
   - Maria vê: "NC reportada por Cleverson Pompeu" (nome completo)
   - Outros funcionários veem: "NC reportada por CP"
   - Gerente vê nomes completos

4. **Workflow:**
   - Status: REPORTED → ACKNOWLEDGED → IN_PROGRESS → RESOLVED
   - Cada mudança gera notificação
   - Auditoria registra todos os acessos

5. **Escalação:**
   - Se não resolvida em 24h, escala para diretoria
   - Notificações automáticas em cada escalação

---

**📅 PRAZO TOTAL:** 4 semanas  
**👥 RECURSOS:** 1-2 desenvolvedores  
**🔧 TECNOLOGIAS:** Node.js, React, SQLite, Nodemailer, Socket.io  
**📊 COMPLEXIDADE:** Alta (sistema enterprise)

**✅ RESULTADO ESPERADO:** Sistema profissional de gestão de não conformidades com controle total de acesso, notificações automáticas e proteção de identidades. 