# 📋 TASKLIST COMPLETO - MÓDULO FUNCIONÁRIOS & SETORES

## 🎯 **OBJETIVO**
Implementar sistema completo de gestão de setores, funcionários e permissões granulares por empresa.

## 📊 **ESTRUTURA ATUAL vs NECESSÁRIA**

### **ATUAL:**
- ✅ Tabela `users` básica
- ✅ Permissões simples (4 módulos)
- ✅ Vinculação empresa-funcionário
- ❌ Sem tabela de setores
- ❌ Sem permissões por setor
- ❌ Sem hierarquia de cargos

### **NECESSÁRIO:**
- ✅ Tabela `departments` (setores)
- ✅ Tabela `roles` (cargos/funções)
- ✅ Permissões granulares por setor
- ✅ Hierarquia de acesso
- ✅ Auditoria completa

---

## 🗄️ **FASE 1: ESTRUTURA DE BANCO DE DADOS**

### **1.1 Criar Tabela de Setores/Departamentos**
- [ ] **1.1.1** Criar migração para tabela `departments`
  ```sql
  CREATE TABLE departments (
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
    FOREIGN KEY (company_id) REFERENCES companies (id),
    FOREIGN KEY (parent_id) REFERENCES departments (id),
    FOREIGN KEY (manager_user_id) REFERENCES users (id),
    UNIQUE(company_id, code)
  );
  ```

- [ ] **1.1.2** Criar índices para performance
  ```sql
  CREATE INDEX idx_departments_company ON departments(company_id);
  CREATE INDEX idx_departments_parent ON departments(parent_id);
  CREATE INDEX idx_departments_active ON departments(is_active);
  ```

### **1.2 Criar Tabela de Cargos/Funções**
- [ ] **1.2.1** Criar tabela `roles`
  ```sql
  CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- Ex: "Gerente", "Analista", "Coordenador"
    code TEXT NOT NULL, -- Ex: "GER", "ANA", "COORD"
    level INTEGER DEFAULT 1, -- Nível hierárquico (1=mais alto)
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies (id),
    UNIQUE(company_id, code)
  );
  ```

### **1.3 Criar Tabela de Permissões Detalhadas**
- [ ] **1.3.1** Criar tabela `permissions`
  ```sql
  CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE, -- Ex: "users.create", "reports.view"
    module TEXT NOT NULL, -- Ex: "users", "reports", "companies"
    action TEXT NOT NULL, -- Ex: "create", "read", "update", "delete"
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
  );
  ```

- [ ] **1.3.2** Popular permissões básicas
  ```sql
  -- Permissões de usuários
  INSERT INTO permissions (code, module, action, name, description, created_at) VALUES
  ('users.create', 'users', 'create', 'Criar Usuários', 'Criar novos funcionários', datetime('now')),
  ('users.read', 'users', 'read', 'Visualizar Usuários', 'Ver lista de funcionários', datetime('now')),
  ('users.update', 'users', 'update', 'Editar Usuários', 'Editar dados de funcionários', datetime('now')),
  ('users.delete', 'users', 'delete', 'Excluir Usuários', 'Remover funcionários', datetime('now')),
  -- Permissões de setores
  ('departments.create', 'departments', 'create', 'Criar Setores', 'Criar novos setores', datetime('now')),
  ('departments.read', 'departments', 'read', 'Visualizar Setores', 'Ver lista de setores', datetime('now')),
  ('departments.update', 'departments', 'update', 'Editar Setores', 'Editar dados de setores', datetime('now')),
  ('departments.delete', 'departments', 'delete', 'Excluir Setores', 'Remover setores', datetime('now')),
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
  -- Permissões de relatórios
  ('reports.view', 'reports', 'read', 'Visualizar Relatórios', 'Acessar relatórios', datetime('now')),
  ('reports.export', 'reports', 'export', 'Exportar Relatórios', 'Baixar relatórios', datetime('now'));
  ```

### **1.4 Criar Tabela de Permissões de Usuários**
- [ ] **1.4.1** Criar tabela `user_permissions`
  ```sql
  CREATE TABLE user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    department_id INTEGER, -- Permissão específica para um setor
    granted_by INTEGER NOT NULL, -- Quem concedeu
    granted_at TEXT NOT NULL,
    expires_at TEXT, -- Permissão temporária
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id),
    FOREIGN KEY (department_id) REFERENCES departments (id),
    FOREIGN KEY (granted_by) REFERENCES users (id),
    UNIQUE(user_id, permission_id, department_id)
  );
  ```

### **1.5 Atualizar Tabela de Usuários**
- [ ] **1.5.1** Adicionar campos necessários
  ```sql
  ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id);
  ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
  ALTER TABLE users ADD COLUMN employee_code TEXT; -- Matrícula
  ALTER TABLE users ADD COLUMN hire_date TEXT;
  ALTER TABLE users ADD COLUMN phone TEXT;
  ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id);
  ALTER TABLE users ADD COLUMN is_manager INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'; -- active, inactive, suspended
  ```

---

## 🔧 **FASE 2: BACKEND API**

### **2.1 Endpoints de Setores/Departamentos**
- [ ] **2.1.1** `GET /api/departments` - Listar setores
- [ ] **2.1.2** `GET /api/departments/:id` - Buscar setor específico
- [ ] **2.1.3** `POST /api/departments` - Criar setor
- [ ] **2.1.4** `PUT /api/departments/:id` - Atualizar setor
- [ ] **2.1.5** `DELETE /api/departments/:id` - Excluir setor
- [ ] **2.1.6** `GET /api/companies/:id/departments` - Setores de uma empresa
- [ ] **2.1.7** `GET /api/departments/:id/users` - Funcionários de um setor

### **2.2 Endpoints de Cargos/Funções**
- [ ] **2.2.1** `GET /api/roles` - Listar cargos
- [ ] **2.2.2** `POST /api/roles` - Criar cargo
- [ ] **2.2.3** `PUT /api/roles/:id` - Atualizar cargo
- [ ] **2.2.4** `DELETE /api/roles/:id` - Excluir cargo

### **2.3 Endpoints de Permissões**
- [ ] **2.3.1** `GET /api/permissions` - Listar todas as permissões
- [ ] **2.3.2** `GET /api/permissions/modules` - Agrupar por módulo
- [ ] **2.3.3** `GET /api/users/:id/permissions` - Permissões de um usuário
- [ ] **2.3.4** `POST /api/users/:id/permissions` - Conceder permissões
- [ ] **2.3.5** `DELETE /api/users/:id/permissions/:permissionId` - Revogar permissão
- [ ] **2.3.6** `GET /api/users/:id/effective-permissions` - Permissões efetivas (com herança)

### **2.4 Melhorar Endpoints de Usuários**
- [ ] **2.4.1** Atualizar `POST /api/users` - Incluir setor e cargo
- [ ] **2.4.2** Atualizar `PUT /api/users/:id` - Permitir edição completa
- [ ] **2.4.3** Criar `GET /api/users/search` - Busca avançada
- [ ] **2.4.4** Criar `POST /api/users/bulk` - Criação em lote
- [ ] **2.4.5** Criar `PUT /api/users/:id/status` - Ativar/desativar
- [ ] **2.4.6** Criar `GET /api/users/:id/subordinates` - Funcionários subordinados

### **2.5 Middleware de Permissões**
- [ ] **2.5.1** Criar middleware `checkPermission(permission, department?)`
- [ ] **2.5.2** Implementar cache de permissões
- [ ] **2.5.3** Criar sistema de herança de permissões
- [ ] **2.5.4** Implementar permissões temporárias
- [ ] **2.5.5** Adicionar logs de auditoria de acesso

---

## 🎨 **FASE 3: FRONTEND**

### **3.1 Página de Gestão de Setores**
- [ ] **3.1.1** Criar `src/pages/Departments.jsx`
- [ ] **3.1.2** Implementar lista com hierarquia (tree view)
- [ ] **3.1.3** Modal para criar/editar setor
- [ ] **3.1.4** Validações de campos
- [ ] **3.1.5** Ações: ativar/desativar, definir gerente
- [ ] **3.1.6** Filtros: empresa, status, gerente

### **3.2 Página de Gestão de Cargos**
- [ ] **3.2.1** Criar `src/pages/Roles.jsx`
- [ ] **3.2.2** Lista com níveis hierárquicos
- [ ] **3.2.3** Modal para criar/editar cargo
- [ ] **3.2.4** Definir permissões padrão por cargo

### **3.3 Melhorar Página de Funcionários**
- [ ] **3.3.1** Adicionar campos: setor, cargo, gerente
- [ ] **3.3.2** Implementar busca avançada
- [ ] **3.3.3** Filtros por: setor, cargo, status, empresa
- [ ] **3.3.4** Ações em lote: ativar/desativar múltiplos
- [ ] **3.3.5** Exportação para Excel/CSV
- [ ] **3.3.6** Organograma visual

### **3.4 Sistema de Permissões Granulares**
- [ ] **3.4.1** Criar `src/components/PermissionsManager.jsx`
- [ ] **3.4.2** Interface para atribuir permissões específicas
- [ ] **3.4.3** Visualização em árvore de permissões
- [ ] **3.4.4** Permissões por setor específico
- [ ] **3.4.5** Herança de permissões do cargo
- [ ] **3.4.6** Permissões temporárias com data de expiração

### **3.5 Dashboard de Gestão**
- [ ] **3.5.1** Criar `src/pages/Management.jsx`
- [ ] **3.5.2** Estatísticas: funcionários por setor, cargos
- [ ] **3.5.3** Gráficos de distribuição
- [ ] **3.5.4** Alertas: permissões expiradas, funcionários inativos
- [ ] **3.5.5** Relatórios de acesso e atividade

---

## 🛡️ **FASE 4: SEGURANÇA & VALIDAÇÕES**

### **4.1 Implementar Hash de Senhas**
- [ ] **4.1.1** Instalar `bcryptjs`
- [ ] **4.1.2** Atualizar criação de usuários
- [ ] **4.1.3** Atualizar login
- [ ] **4.1.4** Migrar senhas existentes

### **4.2 Sistema JWT**
- [ ] **4.2.1** Instalar `jsonwebtoken`
- [ ] **4.2.2** Implementar geração de tokens
- [ ] **4.2.3** Middleware de verificação
- [ ] **4.2.4** Refresh tokens
- [ ] **4.2.5** Logout com blacklist

### **4.3 Validações Robustas**
- [ ] **4.3.1** Schema validation com `joi` ou `yup`
- [ ] **4.3.2** Sanitização de inputs
- [ ] **4.3.3** Rate limiting por endpoint
- [ ] **4.3.4** Validação de hierarquia (gerente > subordinado)
- [ ] **4.3.5** Prevenção de auto-promoção

### **4.4 Auditoria e Logs**
- [ ] **4.4.1** Criar tabela `audit_logs`
- [ ] **4.4.2** Log de todas as ações sensíveis
- [ ] **4.4.3** Log de tentativas de acesso negado
- [ ] **4.4.4** Relatórios de auditoria
- [ ] **4.4.5** Alertas de atividade suspeita

---

## 🧪 **FASE 5: TESTES**

### **5.1 Testes de Unidade**
- [ ] **5.1.1** Testes de validação de dados
- [ ] **5.1.2** Testes de permissões
- [ ] **5.1.3** Testes de hierarquia
- [ ] **5.1.4** Testes de herança de permissões
- [ ] **5.1.5** Testes de expiração

### **5.2 Testes de Integração**
- [ ] **5.2.1** Fluxo completo de criação de funcionário
- [ ] **5.2.2** Atribuição e verificação de permissões
- [ ] **5.2.3** Alteração de setor/cargo
- [ ] **5.2.4** Desativação e reativação
- [ ] **5.2.5** Backup e restore

### **5.3 Testes de Performance**
- [ ] **5.3.1** Carga com 1000+ funcionários
- [ ] **5.3.2** Verificação de permissões em massa
- [ ] **5.3.3** Consultas hierárquicas complexas
- [ ] **5.3.4** Relatórios com grandes volumes

---

## 📱 **FASE 6: UX/UI AVANÇADO**

### **6.1 Interface Responsiva**
- [ ] **6.1.1** Mobile-first design
- [ ] **6.1.2** Touch-friendly para tablets
- [ ] **6.1.3** Atalhos de teclado
- [ ] **6.1.4** Navegação intuitiva

### **6.2 Funcionalidades Avançadas**
- [ ] **6.2.1** Drag & drop para reorganizar setores
- [ ] **6.2.2** Busca global inteligente
- [ ] **6.2.3** Favoritos/bookmarks
- [ ] **6.2.4** Histórico de navegação
- [ ] **6.2.5** Notificações push

### **6.3 Acessibilidade**
- [ ] **6.3.1** ARIA labels completos
- [ ] **6.3.2** Navegação por teclado
- [ ] **6.3.3** Alto contraste
- [ ] **6.3.4** Screen reader friendly

---

## 📊 **FASE 7: RELATÓRIOS & ANALYTICS**

### **7.1 Relatórios Gerenciais**
- [ ] **7.1.1** Relatório de funcionários por setor
- [ ] **7.1.2** Relatório de permissões atribuídas
- [ ] **7.1.3** Relatório de atividade de usuários
- [ ] **7.1.4** Relatório de mudanças organizacionais
- [ ] **7.1.5** Relatório de auditoria de segurança

### **7.2 Dashboards Executivos**
- [ ] **7.2.1** KPIs organizacionais
- [ ] **7.2.2** Métricas de produtividade
- [ ] **7.2.3** Análise de crescimento da equipe
- [ ] **7.2.4** Previsões e tendências

---

## 🚀 **FASE 8: DEPLOY & PRODUÇÃO**

### **8.1 Configuração de Produção**
- [ ] **8.1.1** Variáveis de ambiente
- [ ] **8.1.2** SSL/HTTPS obrigatório
- [ ] **8.1.3** Backup automático do banco
- [ ] **8.1.4** Monitoramento de performance
- [ ] **8.1.5** Alertas de erro

### **8.2 Documentação**
- [ ] **8.2.1** Manual do administrador
- [ ] **8.2.2** Manual do usuário
- [ ] **8.2.3** API Documentation
- [ ] **8.2.4** Guia de troubleshooting
- [ ] **8.2.5** Vídeos tutoriais

---

## 📋 **PRIORIZAÇÃO**

### **🔥 CRÍTICO (Semana 1-2)**
1. Estrutura de banco completa (Fase 1)
2. Hash de senhas (4.1)
3. Endpoints básicos de setores e usuários (2.1, 2.4)
4. Interface básica de setores (3.1)

### **⚡ ALTO (Semana 3-4)**
1. Sistema de permissões granulares (2.3, 3.4)
2. JWT implementation (4.2)
3. Validações robustas (4.3)
4. Interface melhorada de funcionários (3.3)

### **📊 MÉDIO (Semana 5-6)**
1. Sistema de cargos completo (2.2, 3.2)
2. Auditoria e logs (4.4)
3. Testes completos (Fase 5)
4. Dashboard de gestão (3.5)

### **✨ BAIXO (Semana 7+)**
1. UX/UI avançado (Fase 6)
2. Relatórios completos (Fase 7)
3. Deploy e documentação (Fase 8)

---

## 🎯 **CRITÉRIOS DE ACEITAÇÃO**

### **Para Setores:**
- [ ] CRUD completo com validações
- [ ] Hierarquia funcional (setores pais/filhos)
- [ ] Gerente por setor
- [ ] Funcionários podem ser transferidos entre setores
- [ ] Histórico de mudanças

### **Para Funcionários:**
- [ ] Campos completos (setor, cargo, gerente)
- [ ] Permissões granulares funcionando
- [ ] Busca e filtros avançados
- [ ] Status de ativação
- [ ] Auditoria de ações

### **Para Permissões:**
- [ ] Sistema granular por módulo/ação
- [ ] Permissões específicas por setor
- [ ] Herança de permissões do cargo
- [ ] Permissões temporárias
- [ ] Interface intuitiva de atribuição

---

**📅 PRAZO ESTIMADO:** 6-8 semanas para implementação completa
**👥 RECURSOS:** 1-2 desenvolvedores full-stack
**🔧 TECNOLOGIAS:** React, Node.js, SQLite, JWT, bcrypt

**STATUS ATUAL:** 15% concluído (estrutura básica existe)
**PRÓXIMO MILESTONE:** Estrutura de banco completa (30 itens = 30% do projeto) 