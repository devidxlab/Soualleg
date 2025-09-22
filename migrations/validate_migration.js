const Database = require('better-sqlite3');

function validateMigration() {
  console.log('🔍 Validando Migração V2...\n');

  try {
    const db = new Database('events.db', { readonly: true });
    
    let errors = [];
    let warnings = [];
    let success = [];

    // 1. Verificar se todas as tabelas foram criadas
    console.log('1️⃣ Verificando tabelas...');
    const requiredTables = [
      'departments', 'roles', 'permissions', 'user_permissions', 
      'role_permissions', 'audit_logs'
    ];

    const existingTables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all().map(t => t.name);

    requiredTables.forEach(table => {
      if (existingTables.includes(table)) {
        success.push(`✅ Tabela ${table} existe`);
      } else {
        errors.push(`❌ Tabela ${table} não encontrada`);
      }
    });

    // 2. Verificar colunas da tabela users
    console.log('\n2️⃣ Verificando colunas da tabela users...');
    const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
    const userColumnNames = userColumns.map(col => col.name);
    
    const requiredUserColumns = [
      'department_id', 'role_id', 'employee_code', 'hire_date', 
      'phone', 'manager_id', 'is_manager', 'status'
    ];

    requiredUserColumns.forEach(column => {
      if (userColumnNames.includes(column)) {
        success.push(`✅ Coluna users.${column} existe`);
      } else {
        errors.push(`❌ Coluna users.${column} não encontrada`);
      }
    });

    // 3. Verificar se permissões foram inseridas
    console.log('\n3️⃣ Verificando permissões...');
    const permissionCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get().count;
    
    if (permissionCount > 0) {
      success.push(`✅ ${permissionCount} permissões inseridas`);
      
      // Verificar permissões específicas
      const criticalPermissions = [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'departments.create', 'departments.read',
        'roles.create', 'roles.read',
        'admin.system'
      ];

      criticalPermissions.forEach(perm => {
        const exists = db.prepare('SELECT id FROM permissions WHERE code = ?').get(perm);
        if (exists) {
          success.push(`✅ Permissão ${perm} existe`);
        } else {
          errors.push(`❌ Permissão crítica ${perm} não encontrada`);
        }
      });
    } else {
      errors.push('❌ Nenhuma permissão encontrada');
    }

    // 4. Verificar departamentos padrão
    console.log('\n4️⃣ Verificando departamentos...');
    const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
    
    if (deptCount > 0) {
      success.push(`✅ ${deptCount} departamentos criados`);
      
      // Verificar departamentos críticos
      const criticalDepts = ['ADM', 'RH', 'FIN', 'TI'];
      criticalDepts.forEach(code => {
        const exists = db.prepare('SELECT id FROM departments WHERE code = ?').get(code);
        if (exists) {
          success.push(`✅ Departamento ${code} existe`);
        } else {
          warnings.push(`⚠️  Departamento ${code} não encontrado`);
        }
      });
    } else {
      warnings.push('⚠️  Nenhum departamento encontrado');
    }

    // 5. Verificar cargos padrão
    console.log('\n5️⃣ Verificando cargos...');
    const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
    
    if (roleCount > 0) {
      success.push(`✅ ${roleCount} cargos criados`);
      
      // Verificar cargos críticos
      const criticalRoles = ['ADMIN', 'GER', 'ANA'];
      criticalRoles.forEach(code => {
        const exists = db.prepare('SELECT id FROM roles WHERE code = ?').get(code);
        if (exists) {
          success.push(`✅ Cargo ${code} existe`);
        } else {
          warnings.push(`⚠️  Cargo ${code} não encontrado`);
        }
      });
    } else {
      warnings.push('⚠️  Nenhum cargo encontrado');
    }

    // 6. Verificar índices
    console.log('\n6️⃣ Verificando índices...');
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_%'
    `).all();

    if (indexes.length > 0) {
      success.push(`✅ ${indexes.length} índices criados`);
    } else {
      warnings.push('⚠️  Nenhum índice personalizado encontrado');
    }

    // 7. Verificar integridade dos dados
    console.log('\n7️⃣ Verificando integridade dos dados...');
    
    // Verificar usuários admin
    const adminUsers = db.prepare(`
      SELECT u.*, d.name as dept_name, r.name as role_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.user_type = 'admin'
    `).all();

    if (adminUsers.length > 0) {
      success.push(`✅ ${adminUsers.length} usuário(s) admin encontrado(s)`);
      
      adminUsers.forEach(user => {
        if (user.status === 'active') {
          success.push(`✅ Admin ${user.username} está ativo`);
        } else {
          warnings.push(`⚠️  Admin ${user.username} não está ativo`);
        }
        
        if (user.dept_name) {
          success.push(`✅ Admin ${user.username} tem departamento: ${user.dept_name}`);
        } else {
          warnings.push(`⚠️  Admin ${user.username} sem departamento`);
        }
        
        if (user.role_name) {
          success.push(`✅ Admin ${user.username} tem cargo: ${user.role_name}`);
        } else {
          warnings.push(`⚠️  Admin ${user.username} sem cargo`);
        }
      });
    } else {
      errors.push('❌ Nenhum usuário admin encontrado');
    }

    // 8. Testar consultas complexas
    console.log('\n8️⃣ Testando consultas complexas...');
    
    try {
      // Testar join complexo
      const complexQuery = db.prepare(`
        SELECT 
          u.username,
          c.name as company,
          d.name as department,
          r.name as role
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.user_type = 'admin'
        LIMIT 1
      `).get();

      if (complexQuery) {
        success.push('✅ Consultas complexas funcionando');
      } else {
        warnings.push('⚠️  Consulta complexa retornou vazio');
      }
    } catch (error) {
      errors.push(`❌ Erro em consulta complexa: ${error.message}`);
    }

    // 9. Verificar foreign keys
    console.log('\n9️⃣ Verificando foreign keys...');
    
    try {
      // Verificar se foreign keys estão ativas
      const fkStatus = db.prepare('PRAGMA foreign_keys').get();
      if (fkStatus && fkStatus.foreign_keys) {
        success.push('✅ Foreign keys habilitadas');
      } else {
        warnings.push('⚠️  Foreign keys não habilitadas');
      }

      // Testar integridade
      const integrityCheck = db.prepare('PRAGMA integrity_check').get();
      if (integrityCheck && integrityCheck.integrity_check === 'ok') {
        success.push('✅ Integridade do banco OK');
      } else {
        errors.push('❌ Problemas de integridade detectados');
      }
    } catch (error) {
      warnings.push(`⚠️  Erro ao verificar foreign keys: ${error.message}`);
    }

    db.close();

    // 10. Relatório final
    console.log('\n📊 RELATÓRIO FINAL DA VALIDAÇÃO\n');
    
    console.log('🎉 SUCESSOS:');
    success.forEach(msg => console.log(`  ${msg}`));
    
    if (warnings.length > 0) {
      console.log('\n⚠️  AVISOS:');
      warnings.forEach(msg => console.log(`  ${msg}`));
    }
    
    if (errors.length > 0) {
      console.log('\n❌ ERROS:');
      errors.forEach(msg => console.log(`  ${msg}`));
    }

    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`  ✅ Sucessos: ${success.length}`);
    console.log(`  ⚠️  Avisos: ${warnings.length}`);
    console.log(`  ❌ Erros: ${errors.length}`);

    const successRate = (success.length / (success.length + warnings.length + errors.length)) * 100;
    console.log(`  📊 Taxa de sucesso: ${successRate.toFixed(1)}%`);

    if (errors.length === 0) {
      console.log('\n🎉 MIGRAÇÃO VALIDADA COM SUCESSO!');
      console.log('✅ O sistema está pronto para uso.');
      
      if (warnings.length > 0) {
        console.log('\n💡 Recomendações:');
        console.log('- Revisar os avisos acima');
        console.log('- Executar testes de funcionalidade');
        console.log('- Verificar dados específicos da empresa');
      }
    } else {
      console.log('\n❌ MIGRAÇÃO COM PROBLEMAS!');
      console.log('🔧 Ações necessárias:');
      console.log('- Corrigir os erros listados acima');
      console.log('- Re-executar a migração se necessário');
      console.log('- Restaurar backup se necessário');
    }

    console.log('\n📋 Próximos passos:');
    console.log('1. Se tudo OK: node test_employee_creation.js');
    console.log('2. Iniciar desenvolvimento dos endpoints');
    console.log('3. Implementar interface de setores');
    console.log('4. Testar permissões granulares');

    return errors.length === 0;

  } catch (error) {
    console.error('\n💥 Erro durante validação:', error);
    console.log('\n🔧 Possíveis causas:');
    console.log('- Banco de dados não existe');
    console.log('- Migração não foi executada');
    console.log('- Arquivo corrompido');
    console.log('\n💡 Soluções:');
    console.log('- Execute: node run_migration.js');
    console.log('- Verifique se events.db existe');
    console.log('- Restaure backup se necessário');
    
    return false;
  }
}

// Executar validação
const isValid = validateMigration();
process.exit(isValid ? 0 : 1); 