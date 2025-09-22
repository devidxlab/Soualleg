const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

async function runMigration() {
  console.log('🚀 Iniciando Migração V2 - Sistema Completo de Funcionários\n');

  // 1. Fazer backup do banco atual
  const backupName = `events_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  const originalDb = 'events.db';
  const backupPath = backupName;

  try {
    console.log('📋 1. Fazendo backup do banco atual...');
    if (fs.existsSync(originalDb)) {
      fs.copyFileSync(originalDb, backupPath);
      console.log(`✅ Backup criado: ${backupPath}`);
    } else {
      console.log('⚠️  Banco original não encontrado, criando novo...');
    }

    // 2. Conectar ao banco
    console.log('\n🔗 2. Conectando ao banco de dados...');
    const db = new Database(originalDb, { verbose: null });
    
    // 3. Verificar estado atual
    console.log('\n📊 3. Verificando estado atual do banco...');
    
    // Verificar tabelas existentes
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    console.log('Tabelas existentes:');
    tables.forEach(table => console.log(`  - ${table.name}`));

    // Verificar usuários existentes
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    console.log(`\nUsuários existentes: ${userCount}`);

    // 4. Executar migração por partes
    console.log('\n🔧 4. Executando migração...');

    // 4.1 Criar tabela de departamentos
    console.log('   📁 Criando tabela de departamentos...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        parent_id INTEGER,
        manager_user_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES departments (id) ON DELETE SET NULL,
        FOREIGN KEY (manager_user_id) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE(company_id, code)
      );
    `);

    // Índices para departments
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
      CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
      CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_user_id);
    `);

    // 4.2 Criar tabela de cargos
    console.log('   👔 Criando tabela de cargos...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
        UNIQUE(company_id, code)
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
      CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
      CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
    `);

    // 4.3 Criar tabela de permissões
    console.log('   🔐 Criando tabela de permissões...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        module TEXT NOT NULL,
        action TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
      CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
    `);

    // 4.4 Popular permissões básicas
    console.log('   ⚙️  Inserindo permissões básicas...');
    const permissionsData = [
      ['users.create', 'users', 'create', 'Criar Usuários', 'Criar novos funcionários'],
      ['users.read', 'users', 'read', 'Visualizar Usuários', 'Ver lista de funcionários'],
      ['users.update', 'users', 'update', 'Editar Usuários', 'Editar dados de funcionários'],
      ['users.delete', 'users', 'delete', 'Excluir Usuários', 'Remover funcionários'],
      ['users.permissions', 'users', 'permissions', 'Gerenciar Permissões', 'Atribuir/revogar permissões'],
      
      ['departments.create', 'departments', 'create', 'Criar Setores', 'Criar novos setores'],
      ['departments.read', 'departments', 'read', 'Visualizar Setores', 'Ver lista de setores'],
      ['departments.update', 'departments', 'update', 'Editar Setores', 'Editar dados de setores'],
      ['departments.delete', 'departments', 'delete', 'Excluir Setores', 'Remover setores'],
      
      ['roles.create', 'roles', 'create', 'Criar Cargos', 'Criar novos cargos'],
      ['roles.read', 'roles', 'read', 'Visualizar Cargos', 'Ver lista de cargos'],
      ['roles.update', 'roles', 'update', 'Editar Cargos', 'Editar dados de cargos'],
      ['roles.delete', 'roles', 'delete', 'Excluir Cargos', 'Remover cargos'],
      
      ['companies.create', 'companies', 'create', 'Criar Empresas', 'Criar novas empresas'],
      ['companies.read', 'companies', 'read', 'Visualizar Empresas', 'Ver lista de empresas'],
      ['companies.update', 'companies', 'update', 'Editar Empresas', 'Editar dados de empresas'],
      ['companies.delete', 'companies', 'delete', 'Excluir Empresas', 'Remover empresas'],
      
      ['complaints.create', 'complaints', 'create', 'Criar Denúncias', 'Registrar denúncias'],
      ['complaints.read', 'complaints', 'read', 'Visualizar Denúncias', 'Ver denúncias'],
      ['complaints.update', 'complaints', 'update', 'Editar Denúncias', 'Alterar status/dados'],
      ['complaints.delete', 'complaints', 'delete', 'Excluir Denúncias', 'Remover denúncias'],
      
      ['nonconformities.create', 'nonconformities', 'create', 'Criar NCs', 'Registrar não conformidades'],
      ['nonconformities.read', 'nonconformities', 'read', 'Visualizar NCs', 'Ver não conformidades'],
      ['nonconformities.update', 'nonconformities', 'update', 'Editar NCs', 'Alterar NCs'],
      ['nonconformities.delete', 'nonconformities', 'delete', 'Excluir NCs', 'Remover NCs'],
      
      ['documentation.read', 'documentation', 'read', 'Visualizar Documentação', 'Acessar documentos'],
      ['documentation.upload', 'documentation', 'upload', 'Upload Documentos', 'Enviar documentos'],
      
      ['reports.view', 'reports', 'read', 'Visualizar Relatórios', 'Acessar relatórios'],
      ['reports.export', 'reports', 'export', 'Exportar Relatórios', 'Baixar relatórios'],
      
      ['admin.system', 'admin', 'system', 'Administração Sistema', 'Acesso total ao sistema'],
      ['admin.audit', 'admin', 'audit', 'Visualizar Auditoria', 'Ver logs de auditoria']
    ];

    const insertPermissionStmt = db.prepare(`
      INSERT OR IGNORE INTO permissions (code, module, action, name, description, created_at) 
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    permissionsData.forEach(permission => {
      insertPermissionStmt.run(...permission);
    });

    // 4.5 Criar tabelas de relacionamento
    console.log('   🔗 Criando tabelas de relacionamento...');
    
    // Tabela user_permissions
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        department_id INTEGER,
        granted_by INTEGER NOT NULL,
        granted_at TEXT NOT NULL,
        expires_at TEXT,
        is_active INTEGER DEFAULT 1,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE(user_id, permission_id, department_id)
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
      CREATE INDEX IF NOT EXISTS idx_user_permissions_department ON user_permissions(department_id);
      CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);
    `);

    // Tabela role_permissions
    db.exec(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        department_id INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id, department_id)
      );
    `);

    // 4.6 Atualizar tabela users (com tratamento de erro)
    console.log('   👤 Atualizando tabela de usuários...');
    
    const newUserColumns = [
      'department_id INTEGER',
      'role_id INTEGER',
      'employee_code TEXT',
      'hire_date TEXT',
      'phone TEXT',
      'manager_id INTEGER',
      'is_manager INTEGER DEFAULT 0',
      'status TEXT DEFAULT "active"',
      'last_password_change TEXT',
      'login_attempts INTEGER DEFAULT 0',
      'locked_until TEXT'
    ];

    newUserColumns.forEach(column => {
      try {
        db.exec(`ALTER TABLE users ADD COLUMN ${column}`);
      } catch (error) {
        // Coluna já existe, ignorar
        if (!error.message.includes('duplicate column name')) {
          console.warn(`Aviso ao adicionar coluna: ${error.message}`);
        }
      }
    });

    // Índices para users
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
      CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);
    `);

    // 4.7 Criar tabela de auditoria
    console.log('   📋 Criando tabela de auditoria...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        table_name TEXT,
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
    `);

    // 5. Criar dados padrão
    console.log('\n📦 5. Criando dados padrão...');

    // Buscar empresas existentes
    const companies = db.prepare('SELECT id, name FROM companies').all();
    console.log(`Encontradas ${companies.length} empresa(s)`);

    if (companies.length > 0) {
      // Inserir departamentos padrão
      const departments = [
        ['Administração', 'ADM', 'Setor administrativo geral'],
        ['Recursos Humanos', 'RH', 'Gestão de pessoas e recursos humanos'],
        ['Financeiro', 'FIN', 'Controladoria e finanças'],
        ['Tecnologia da Informação', 'TI', 'Desenvolvimento e infraestrutura de TI'],
        ['Qualidade', 'QLT', 'Gestão da qualidade e conformidade']
      ];

      const insertDeptStmt = db.prepare(`
        INSERT OR IGNORE INTO departments (company_id, name, code, description, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'))
      `);

      companies.forEach(company => {
        departments.forEach(dept => {
          insertDeptStmt.run(company.id, dept[0], dept[1], dept[2]);
        });
      });

      // Inserir cargos padrão
      const roles = [
        ['Administrador', 'ADMIN', 1, 'Administrador do sistema'],
        ['Gerente', 'GER', 2, 'Gerente de setor'],
        ['Coordenador', 'COORD', 3, 'Coordenador de equipe'],
        ['Analista', 'ANA', 4, 'Analista júnior/pleno/sênior'],
        ['Assistente', 'ASS', 5, 'Assistente operacional']
      ];

      const insertRoleStmt = db.prepare(`
        INSERT OR IGNORE INTO roles (company_id, name, code, level, description, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
      `);

      companies.forEach(company => {
        roles.forEach(role => {
          insertRoleStmt.run(company.id, role[0], role[1], role[2], role[3]);
        });
      });

      console.log(`✅ Criados departamentos e cargos para ${companies.length} empresa(s)`);
    }

    // 6. Migrar dados existentes
    console.log('\n🔄 6. Migrando dados existentes...');
    
    // Atualizar usuários admin
    db.exec(`
      UPDATE users SET 
        status = 'active',
        is_manager = 1,
        last_password_change = datetime('now')
      WHERE user_type = 'admin' AND status IS NULL
    `);

    // Associar admin com departamento ADM
    db.exec(`
      UPDATE users SET department_id = (
        SELECT d.id FROM departments d 
        WHERE d.code = 'ADM' 
        LIMIT 1
      ) WHERE user_type = 'admin' AND department_id IS NULL
    `);

    // Associar admin com cargo ADMIN
    db.exec(`
      UPDATE users SET role_id = (
        SELECT r.id FROM roles r 
        WHERE r.code = 'ADMIN' 
        LIMIT 1
      ) WHERE user_type = 'admin' AND role_id IS NULL
    `);

    // 7. Verificações finais
    console.log('\n✅ 7. Verificações finais...');
    
    // Verificar tabelas criadas
    const finalTables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN (
        'departments', 'roles', 'permissions', 'user_permissions', 
        'role_permissions', 'audit_logs'
      )
    `).all();
    
    console.log('Novas tabelas criadas:', finalTables.map(t => t.name).join(', '));

    // Verificar permissões inseridas
    const permissionCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get().count;
    console.log(`Permissões inseridas: ${permissionCount}`);

    // Verificar departamentos criados
    const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
    console.log(`Departamentos criados: ${deptCount}`);

    // Verificar cargos criados
    const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
    console.log(`Cargos criados: ${roleCount}`);

    // Fechar conexão
    db.close();

    console.log('\n🎉 Migração V2 concluída com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie o servidor: npm run server');
    console.log('2. Teste o login como admin');
    console.log('3. Execute os testes: node test_employee_creation.js');
    console.log('4. Comece a implementar os novos endpoints');
    console.log('\n💾 Backup salvo em:', backupPath);

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    console.log('\n🔄 Restaurando backup...');
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, originalDb);
      console.log('✅ Backup restaurado com sucesso');
    }
    
    process.exit(1);
  }
}

// Executar migração
runMigration(); 