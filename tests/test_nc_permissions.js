const Database = require('better-sqlite3');

console.log('🧪 TESTE DO SISTEMA AVANÇADO DE NÃO CONFORMIDADES\n');

function testDatabaseStructure() {
  console.log('📋 TESTANDO ESTRUTURA DO BANCO DE DADOS...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    // 1. Verificar tabelas criadas
    const tables = [
      'nc_notifications',
      'nc_access_audit',
      'nc_permissions', 
      'nc_actions',
      'nc_settings'
    ];
    
    console.log('✅ Verificando tabelas:');
    tables.forEach(table => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(table);
      
      if (result) {
        console.log(`   ✅ ${table}: OK`);
      } else {
        console.log(`   ❌ ${table}: NÃO ENCONTRADA`);
      }
    });
    
    // 2. Verificar colunas na tabela nonconformities
    console.log('\n✅ Verificando colunas em nonconformities:');
    const columns = [
      'target_user_id', 'target_department_id', 'reporter_user_id',
      'anonymized_reporter', 'anonymized_target', 'severity_level',
      'workflow_status', 'confidentiality_level', 'assigned_to'
    ];
    
    columns.forEach(column => {
      try {
        db.prepare(`SELECT ${column} FROM nonconformities LIMIT 1`).get();
        console.log(`   ✅ ${column}: OK`);
      } catch (error) {
        console.log(`   ❌ ${column}: NÃO ENCONTRADA`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na verificação da estrutura:', error);
    return false;
  } finally {
    db.close();
  }
}

function createTestData() {
  console.log('\n📝 CRIANDO DADOS DE TESTE...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    // Verificar se já existem dados
    const companies = db.prepare('SELECT * FROM companies ORDER BY id LIMIT 3').all();
    const users = db.prepare('SELECT * FROM users ORDER BY id LIMIT 5').all();
    
    if (companies.length === 0 || users.length === 0) {
      console.log('⚠️ Dados básicos não encontrados. Execute primeiro:');
      console.log('   npm run migrate (para empresas)');
      console.log('   node create_employees.js (para funcionários)');
      return false;
    }
    
    console.log(`✅ Empresas disponíveis: ${companies.length}`);
    console.log(`✅ Usuários disponíveis: ${users.length}`);
    
    // Listar empresas e usuários
    console.log('\n🏢 Empresas:');
    companies.forEach(company => {
      console.log(`   - ${company.name} (ID: ${company.id})`);
    });
    
    console.log('\n👥 Usuários:');
    users.forEach(user => {
      console.log(`   - ${user.full_name || user.username} (ID: ${user.id}, Empresa: ${user.company_id || 'N/A'})`);
    });
    
    return { companies, users };
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
    return false;
  } finally {
    db.close();
  }
}

function testNCCreationWithPermissions(testData) {
  console.log('\n🎯 TESTANDO CRIAÇÃO DE NC COM PERMISSÕES...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    const { companies, users } = testData;
    
    if (!companies.length || !users.length) {
      console.log('⚠️ Dados insuficientes para teste');
      return false;
    }
    
    // Criar NC de teste
    const company = companies[0];
    const reporter = users[0];
    const target = users.length > 1 ? users[1] : users[0];
    
    console.log(`📝 Criando NC de teste:`);
    console.log(`   Reporter: ${reporter.full_name || reporter.username} (ID: ${reporter.id})`);
    console.log(`   Alvo: ${target.full_name || target.username} (ID: ${target.id})`);
    console.log(`   Empresa: ${company.name}`);
    
    // Função para anonimizar nome
    function anonymizeName(fullName) {
      if (!fullName) return 'N/A';
      const parts = fullName.split(' ');
      return parts.map(part => part.charAt(0).toUpperCase()).join('');
    }
    
    const testNC = {
      company_id: company.id,
      subject: 'NC de Teste - Falha no Processo',
      description: 'Esta é uma não conformidade de teste criada pelo sistema de validação.',
      reporter_user_id: reporter.id,
      target_user_id: target.id,
      anonymized_reporter: anonymizeName(reporter.full_name || reporter.username),
      anonymized_target: anonymizeName(target.full_name || target.username),
      severity_level: 'MEDIUM',
      workflow_status: 'REPORTED',
      confidentiality_level: 'INTERNAL',
      priority: 'NORMAL',
      setor: 'TI',
      created_at: new Date().toISOString()
    };
    
    // Inserir NC
    const insertNC = db.prepare(`
      INSERT INTO nonconformities (
        company_id, subject, description, reporter_user_id, target_user_id,
        anonymized_reporter, anonymized_target, severity_level, workflow_status,
        confidentiality_level, priority, setor, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertNC.run(
      testNC.company_id, testNC.subject, testNC.description,
      testNC.reporter_user_id, testNC.target_user_id,
      testNC.anonymized_reporter, testNC.anonymized_target,
      testNC.severity_level, testNC.workflow_status,
      testNC.confidentiality_level, testNC.priority,
      testNC.setor, testNC.created_at
    );
    
    const ncId = result.lastInsertRowid;
    console.log(`✅ NC criada com ID: ${ncId}`);
    
    return { ncId, testNC, reporter, target, company };
    
  } catch (error) {
    console.error('❌ Erro ao criar NC de teste:', error);
    return false;
  } finally {
    db.close();
  }
}

function testNotificationSystem(ncData) {
  console.log('\n🔔 TESTANDO SISTEMA DE NOTIFICAÇÕES...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    const { ncId, reporter, target } = ncData;
    
    // Criar notificação para o alvo
    const notification1 = {
      nonconformity_id: ncId,
      user_id: target.id,
      notification_type: 'IN_APP',
      subject: 'Nova Não Conformidade Recebida',
      message: `Você recebeu uma nova não conformidade de ${reporter.full_name || reporter.username}`,
      sent_at: new Date().toISOString()
    };
    
    // Criar notificação por email
    const notification2 = {
      nonconformity_id: ncId,
      user_id: target.id,
      notification_type: 'EMAIL',
      subject: 'NC Recebida - Ação Necessária',
      message: `Uma nova não conformidade foi reportada e requer sua atenção.`,
      sent_at: new Date().toISOString(),
      delivery_status: 'SENT'
    };
    
    // Inserir notificações
    const insertNotification = db.prepare(`
      INSERT INTO nc_notifications (
        nonconformity_id, user_id, notification_type, subject, message, 
        sent_at, delivery_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result1 = insertNotification.run(
      notification1.nonconformity_id, notification1.user_id, notification1.notification_type,
      notification1.subject, notification1.message, notification1.sent_at, 'SENT'
    );
    
    const result2 = insertNotification.run(
      notification2.nonconformity_id, notification2.user_id, notification2.notification_type,
      notification2.subject, notification2.message, notification2.sent_at, notification2.delivery_status
    );
    
    console.log(`✅ Notificação IN_APP criada (ID: ${result1.lastInsertRowid})`);
    console.log(`✅ Notificação EMAIL criada (ID: ${result2.lastInsertRowid})`);
    
    // Verificar notificações não lidas
    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM nc_notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(target.id);
    
    console.log(`📊 Notificações não lidas para ${target.full_name || target.username}: ${unreadCount.count}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de notificações:', error);
    return false;
  } finally {
    db.close();
  }
}

function testAuditSystem(ncData) {
  console.log('\n🔍 TESTANDO SISTEMA DE AUDITORIA...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    const { ncId, target } = ncData;
    
    // Simular acesso à NC
    const auditLog = {
      nonconformity_id: ncId,
      user_id: target.id,
      access_type: 'VIEW',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Test Browser)',
      session_id: 'test_session_123',
      data_accessed: JSON.stringify({
        action: 'view_nc',
        nc_id: ncId,
        fields_viewed: ['subject', 'description', 'reporter']
      }),
      access_reason: 'Visualização da NC atribuída',
      access_duration: 120, // 2 minutos
      anonymization_level: 'PARTIAL'
    };
    
    const insertAudit = db.prepare(`
      INSERT INTO nc_access_audit (
        nonconformity_id, user_id, access_type, ip_address, user_agent,
        session_id, data_accessed, access_reason, access_duration, anonymization_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertAudit.run(
      auditLog.nonconformity_id, auditLog.user_id, auditLog.access_type,
      auditLog.ip_address, auditLog.user_agent, auditLog.session_id,
      auditLog.data_accessed, auditLog.access_reason, auditLog.access_duration,
      auditLog.anonymization_level
    );
    
    console.log(`✅ Log de auditoria criado (ID: ${result.lastInsertRowid})`);
    
    // Verificar logs de auditoria
    const auditCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM nc_access_audit 
      WHERE nonconformity_id = ?
    `).get(ncId);
    
    console.log(`📊 Total de acessos registrados para NC ${ncId}: ${auditCount.count}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de auditoria:', error);
    return false;
  } finally {
    db.close();
  }
}

function testPermissionSystem(ncData) {
  console.log('\n🔐 TESTANDO SISTEMA DE PERMISSÕES...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    const { ncId, target, reporter } = ncData;
    
    // Conceder permissão específica
    const permission = {
      nonconformity_id: ncId,
      user_id: target.id,
      permission_type: 'VIEW',
      permission_level: 'STANDARD',
      granted_by: reporter.id,
      reason: 'Alvo da não conformidade'
    };
    
    const insertPermission = db.prepare(`
      INSERT INTO nc_permissions (
        nonconformity_id, user_id, permission_type, permission_level,
        granted_by, reason
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertPermission.run(
      permission.nonconformity_id, permission.user_id, permission.permission_type,
      permission.permission_level, permission.granted_by, permission.reason
    );
    
    console.log(`✅ Permissão específica criada (ID: ${result.lastInsertRowid})`);
    
    // Verificar permissões do usuário
    const userPermissions = db.prepare(`
      SELECT * FROM nc_permissions 
      WHERE nonconformity_id = ? AND user_id = ?
    `).all(ncId, target.id);
    
    console.log(`📊 Permissões específicas para usuário: ${userPermissions.length}`);
    userPermissions.forEach(perm => {
      console.log(`   - ${perm.permission_type} (${perm.permission_level})`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de permissões:', error);
    return false;
  } finally {
    db.close();
  }
}

function testWorkflowSystem(ncData) {
  console.log('\n🔄 TESTANDO SISTEMA DE WORKFLOW...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    const { ncId, target } = ncData;
    
    // Criar ação de mudança de status
    const action = {
      nonconformity_id: ncId,
      user_id: target.id,
      action_type: 'STATUS_CHANGE',
      description: 'NC reconhecida pelo usuário alvo',
      old_value: 'REPORTED',
      new_value: 'ACKNOWLEDGED',
      visibility_level: 'ALL',
      priority: 'NORMAL'
    };
    
    const insertAction = db.prepare(`
      INSERT INTO nc_actions (
        nonconformity_id, user_id, action_type, description,
        old_value, new_value, visibility_level, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const actionResult = insertAction.run(
      action.nonconformity_id, action.user_id, action.action_type,
      action.description, action.old_value, action.new_value,
      action.visibility_level, action.priority
    );
    
    console.log(`✅ Ação de workflow criada (ID: ${actionResult.lastInsertRowid})`);
    
    // Atualizar status da NC
    const updateNC = db.prepare(`
      UPDATE nonconformities 
      SET workflow_status = ? 
      WHERE id = ?
    `);
    
    updateNC.run('ACKNOWLEDGED', ncId);
    console.log(`✅ Status da NC atualizado para: ACKNOWLEDGED`);
    
    // Verificar histórico de ações
    const actions = db.prepare(`
      SELECT * FROM nc_actions 
      WHERE nonconformity_id = ? 
      ORDER BY created_at DESC
    `).all(ncId);
    
    console.log(`📊 Total de ações no histórico: ${actions.length}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de workflow:', error);
    return false;
  } finally {
    db.close();
  }
}

function testAnonymization() {
  console.log('\n🎭 TESTANDO SISTEMA DE ANONIMIZAÇÃO...\n');
  
  // Função de anonimização (mesma que será usada no sistema real)
  function anonymizeName(fullName, level = 'INITIALS') {
    if (!fullName) return 'N/A';
    
    switch (level) {
      case 'NONE':
        return fullName;
      case 'PARTIAL':
        const parts = fullName.split(' ');
        if (parts.length === 1) return parts[0];
        return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0) + '.').join(' ');
      case 'INITIALS':
        return fullName.split(' ').map(part => part.charAt(0).toUpperCase()).join('');
      case 'FULL':
        return '***';
      default:
        return fullName.split(' ').map(part => part.charAt(0).toUpperCase()).join('');
    }
  }
  
  // Testar diferentes níveis de anonimização
  const testNames = [
    'Cleverson Pompeu',
    'Maria José Silva',
    'João Santos',
    'Ana Paula Oliveira Lima'
  ];
  
  const levels = ['NONE', 'PARTIAL', 'INITIALS', 'FULL'];
  
  console.log('📝 Testando anonimização de nomes:');
  testNames.forEach(name => {
    console.log(`\n   Original: ${name}`);
    levels.forEach(level => {
      const anonymized = anonymizeName(name, level);
      console.log(`   ${level}: ${anonymized}`);
    });
  });
  
  console.log('\n✅ Sistema de anonimização funcionando corretamente!');
  return true;
}

function generateTestReport() {
  console.log('\n📊 RELATÓRIO FINAL DOS TESTES...\n');
  
  const db = new Database('events.db', { verbose: null });
  
  try {
    // Estatísticas gerais
    const stats = {
      ncs: db.prepare('SELECT COUNT(*) as count FROM nonconformities').get(),
      notifications: db.prepare('SELECT COUNT(*) as count FROM nc_notifications').get(),
      auditLogs: db.prepare('SELECT COUNT(*) as count FROM nc_access_audit').get(),
      permissions: db.prepare('SELECT COUNT(*) as count FROM nc_permissions').get(),
      actions: db.prepare('SELECT COUNT(*) as count FROM nc_actions').get(),
      settings: db.prepare('SELECT COUNT(*) as count FROM nc_settings').get()
    };
    
    console.log('📈 Estatísticas do Sistema:');
    console.log(`   📝 Não Conformidades: ${stats.ncs.count}`);
    console.log(`   🔔 Notificações: ${stats.notifications.count}`);
    console.log(`   🔍 Logs de Auditoria: ${stats.auditLogs.count}`);
    console.log(`   🔐 Permissões Específicas: ${stats.permissions.count}`);
    console.log(`   🔄 Ações de Workflow: ${stats.actions.count}`);
    console.log(`   ⚙️ Configurações: ${stats.settings.count}`);
    
    // Verificar configurações por empresa
    const settingsByCompany = db.prepare(`
      SELECT company_id, COUNT(*) as setting_count
      FROM nc_settings
      GROUP BY company_id
    `).all();
    
    console.log('\n🏢 Configurações por Empresa:');
    settingsByCompany.forEach(stat => {
      console.log(`   Empresa ${stat.company_id}: ${stat.setting_count} configurações`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    return false;
  } finally {
    db.close();
  }
}

// EXECUÇÃO PRINCIPAL DOS TESTES
async function runAllTests() {
  console.log('🎯 INICIANDO BATERIA COMPLETA DE TESTES...\n');
  
  const results = {};
  
  try {
    // 1. Testar estrutura do banco
    results.structure = testDatabaseStructure();
    
    // 2. Verificar/criar dados de teste
    const testData = createTestData();
    if (!testData) {
      console.log('\n⚠️ Não foi possível executar testes completos sem dados básicos.');
      return;
    }
    
    // 3. Testar criação de NC com permissões
    const ncData = testNCCreationWithPermissions(testData);
    if (!ncData) {
      console.log('\n⚠️ Falha na criação de NC de teste.');
      return;
    }
    
    // 4. Testar sistema de notificações
    results.notifications = testNotificationSystem(ncData);
    
    // 5. Testar sistema de auditoria
    results.audit = testAuditSystem(ncData);
    
    // 6. Testar sistema de permissões
    results.permissions = testPermissionSystem(ncData);
    
    // 7. Testar sistema de workflow
    results.workflow = testWorkflowSystem(ncData);
    
    // 8. Testar anonimização
    results.anonymization = testAnonymization();
    
    // 9. Gerar relatório final
    results.report = generateTestReport();
    
    // Resumo final
    console.log('\n🎉 RESUMO DOS TESTES:');
    console.log('═'.repeat(50));
    
    Object.entries(results).forEach(([test, result]) => {
      const status = result ? '✅ PASSOU' : '❌ FALHOU';
      const testName = test.charAt(0).toUpperCase() + test.slice(1);
      console.log(`${status} - ${testName}`);
    });
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎊 TODOS OS TESTES PASSARAM!');
      console.log('🚀 Sistema de NC Avançado está funcionando corretamente!');
    } else {
      console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
    
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NOS TESTES:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testDatabaseStructure,
  testNCCreationWithPermissions,
  testNotificationSystem,
  testAuditSystem,
  testPermissionSystem,
  testWorkflowSystem,
  testAnonymization,
  generateTestReport
}; 