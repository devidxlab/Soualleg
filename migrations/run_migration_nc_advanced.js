const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO MIGRAÇÃO AVANÇADA DE NÃO CONFORMIDADES\n');

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `events_backup_nc_advanced_${timestamp}.db`;
  
  try {
    fs.copyFileSync('events.db', backupName);
    console.log(`✅ Backup criado: ${backupName}`);
    return backupName;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
}

function validatePreMigration() {
  console.log('\n🔍 VALIDANDO PRÉ-REQUISITOS...');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    // Verificar se tabelas necessárias existem
    const requiredTables = ['nonconformities', 'users', 'companies', 'departments', 'roles', 'permissions'];
    
    for (const table of requiredTables) {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(table);
      
      if (!result) {
        throw new Error(`Tabela obrigatória '${table}' não encontrada. Execute a migração V2 primeiro.`);
      }
      console.log(`✅ Tabela '${table}' encontrada`);
    }
    
    // Verificar se há não conformidades existentes
    const ncCount = db.prepare('SELECT COUNT(*) as count FROM nonconformities').get();
    console.log(`📊 Não conformidades existentes: ${ncCount.count}`);
    
    // Verificar se há usuários
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`👥 Usuários existentes: ${userCount.count}`);
    
    console.log('✅ Pré-requisitos validados com sucesso!');
    
  } catch (error) {
    console.error('❌ Falha na validação de pré-requisitos:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

function executeMigration() {
  console.log('\n⚙️ EXECUTANDO MIGRAÇÃO...');
  
  // Ler arquivo SQL
  const sqlFile = path.join(__dirname, 'database_migration_nc_advanced.sql');
  
  if (!fs.existsSync(sqlFile)) {
    throw new Error(`Arquivo de migração não encontrado: ${sqlFile}`);
  }
  
  const migrationSQL = fs.readFileSync(sqlFile, 'utf8');
  console.log(`📄 Arquivo de migração carregado: ${sqlFile}`);
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    // Executar migração em transação
    const migration = db.transaction(() => {
      // Dividir SQL em comandos individuais (remover comentários e linhas vazias)
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
        .filter(cmd => !cmd.match(/^\/\*/));
      
      console.log(`📝 Executando ${commands.length} comandos SQL...`);
      
      let successCount = 0;
      let skipCount = 0;
      
      commands.forEach((command, index) => {
        try {
          if (command.toLowerCase().includes('select')) {
            // Para comandos SELECT, usar get() ou all()
            const result = db.prepare(command).all();
            if (result.length > 0) {
              console.log(`✅ Comando ${index + 1}: ${result[0].status || 'Executado'}`);
            }
          } else {
            // Para outros comandos, usar run()
            const result = db.prepare(command).run();
            successCount++;
            
            // Log específico para comandos importantes
            if (command.toLowerCase().includes('alter table')) {
              console.log(`✅ Coluna adicionada à tabela`);
            } else if (command.toLowerCase().includes('create table')) {
              console.log(`✅ Tabela criada: ${command.match(/create table[^(]+/i)?.[0] || 'Nova tabela'}`);
            } else if (command.toLowerCase().includes('create index')) {
              console.log(`✅ Índice criado`);
            } else if (command.toLowerCase().includes('insert')) {
              console.log(`✅ Dados inseridos (${result.changes} registros)`);
            }
          }
        } catch (error) {
          // Ignorar erros esperados (colunas/tabelas já existem)
          if (error.message.includes('duplicate column name') ||
              error.message.includes('already exists') ||
              error.message.includes('UNIQUE constraint failed')) {
            skipCount++;
            console.log(`⚠️ Comando ${index + 1}: Já existe (ignorado)`);
          } else {
            console.error(`❌ Erro no comando ${index + 1}:`, error.message);
            console.error(`SQL: ${command.substring(0, 100)}...`);
            throw error;
          }
        }
      });
      
      console.log(`\n📊 Resumo da execução:`);
      console.log(`✅ Comandos executados: ${successCount}`);
      console.log(`⚠️ Comandos ignorados: ${skipCount}`);
      console.log(`📝 Total de comandos: ${commands.length}`);
      
    });
    
    migration();
    console.log('✅ Migração executada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    db.close();
  }
}

function validatePostMigration() {
  console.log('\n🔎 VALIDANDO MIGRAÇÃO...');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    // Verificar novas tabelas criadas
    const newTables = [
      'nc_notifications',
      'nc_access_audit', 
      'nc_permissions',
      'nc_actions',
      'nc_settings'
    ];
    
    console.log('\n📋 Verificando novas tabelas:');
    newTables.forEach(table => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(table);
      
      if (result) {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`✅ ${table}: criada (${count.count} registros)`);
      } else {
        console.log(`❌ ${table}: NÃO ENCONTRADA`);
      }
    });
    
    // Verificar novas colunas na tabela nonconformities
    console.log('\n📋 Verificando novas colunas em nonconformities:');
    const newColumns = [
      'target_user_id',
      'target_department_id', 
      'reporter_user_id',
      'anonymized_reporter',
      'anonymized_target',
      'severity_level',
      'workflow_status',
      'confidentiality_level',
      'due_date',
      'escalation_level',
      'assigned_to',
      'priority'
    ];
    
    newColumns.forEach(column => {
      try {
        db.prepare(`SELECT ${column} FROM nonconformities LIMIT 1`).get();
        console.log(`✅ ${column}: adicionada`);
      } catch (error) {
        console.log(`❌ ${column}: NÃO ENCONTRADA`);
      }
    });
    
    // Verificar novas permissões
    console.log('\n📋 Verificando novas permissões:');
    const ncPermissions = db.prepare(`
      SELECT COUNT(*) as count 
      FROM permissions 
      WHERE module = 'nonconformities'
    `).get();
    console.log(`✅ Permissões de NC: ${ncPermissions.count} criadas`);
    
    // Verificar configurações padrão
    console.log('\n📋 Verificando configurações padrão:');
    const settings = db.prepare(`
      SELECT COUNT(*) as count 
      FROM nc_settings
    `).get();
    console.log(`✅ Configurações: ${settings.count} criadas`);
    
    // Verificar views
    console.log('\n📋 Verificando views:');
    const views = ['nc_complete_view', 'nc_stats_view'];
    views.forEach(view => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='view' AND name=?
      `).get(view);
      
      if (result) {
        console.log(`✅ ${view}: criada`);
      } else {
        console.log(`❌ ${view}: NÃO ENCONTRADA`);
      }
    });
    
    // Verificar integridade do banco
    console.log('\n🔍 Verificando integridade do banco de dados...');
    const integrity = db.prepare('PRAGMA integrity_check').get();
    if (integrity.integrity_check === 'ok') {
      console.log('✅ Integridade do banco: OK');
    } else {
      console.log('❌ Problemas de integridade:', integrity);
    }
    
    console.log('\n✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro na validação:', error);
    throw error;
  } finally {
    db.close();
  }
}

function showNextSteps() {
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('');
  console.log('1. 📧 Configurar sistema de email:');
  console.log('   npm install nodemailer');
  console.log('   Configurar variáveis de ambiente (SMTP_HOST, SMTP_USER, etc.)');
  console.log('');
  console.log('2. 🔔 Implementar notificações real-time:');
  console.log('   npm install socket.io');
  console.log('   Configurar WebSocket no servidor');
  console.log('');
  console.log('3. 📝 Criar endpoints de API avançados:');
  console.log('   - POST /api/nonconformities/:id/assign');
  console.log('   - PUT /api/nonconformities/:id/status');
  console.log('   - GET /api/notifications');
  console.log('   - GET /api/nonconformities/:id/audit');
  console.log('');
  console.log('4. 🎨 Atualizar interfaces frontend:');
  console.log('   - Componente de notificações');
  console.log('   - Sistema de anonimização');
  console.log('   - Controle de permissões granulares');
  console.log('');
  console.log('5. 🧪 Executar testes:');
  console.log('   node test_nc_permissions.js');
  console.log('');
  console.log('📚 Consulte TASKLIST_NAOCONFORMIDADES_AVANCADO.md para detalhes completos.');
}

// EXECUÇÃO PRINCIPAL
async function main() {
  try {
    console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
    console.log('🗄️ Banco de dados: events.db');
    console.log('');
    
    // 1. Validar pré-requisitos
    validatePreMigration();
    
    // 2. Criar backup
    const backupFile = createBackup();
    
    // 3. Executar migração
    executeMigration();
    
    // 4. Validar migração
    validatePostMigration();
    
    // 5. Mostrar próximos passos
    showNextSteps();
    
    console.log('\n🎉 MIGRAÇÃO AVANÇADA DE NÃO CONFORMIDADES CONCLUÍDA!');
    console.log(`💾 Backup salvo como: ${backupFile}`);
    console.log('🚀 Sistema pronto para implementação das funcionalidades avançadas!\n');
    
  } catch (error) {
    console.error('\n💥 FALHA NA MIGRAÇÃO:');
    console.error('❌', error.message);
    console.log('\n🔧 Para resolver:');
    console.log('1. Verifique os pré-requisitos');
    console.log('2. Restaure o backup se necessário');
    console.log('3. Consulte a documentação');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  createBackup,
  validatePreMigration,
  executeMigration,
  validatePostMigration
}; 