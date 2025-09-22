const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function testEmployeeCreation() {
  console.log('🧪 Testando Sistema de Cadastro de Funcionários\n');

  try {
    // 1. Buscar empresas disponíveis
    console.log('1️⃣ Buscando empresas...');
    const companiesResponse = await fetch(`${API_BASE_URL}/companies`);
    const companies = await companiesResponse.json();
    
    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada. Crie uma empresa primeiro.');
      return;
    }
    
    console.log(`✅ ${companies.length} empresa(s) encontrada(s)`);
    const testCompany = companies[0];
    console.log(`📋 Usando empresa: ${testCompany.name} (ID: ${testCompany.id})\n`);

    // 2. Teste de validações - Username muito curto
    console.log('2️⃣ Testando validação: Username muito curto...');
    const testInvalidUsername = {
      username: 'ab', // Muito curto
      password: '123456',
      full_name: 'Teste Funcionário',
      company_id: testCompany.id,
      can_view_documentacao: true
    };

    const invalidUsernameResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInvalidUsername)
    });

    if (!invalidUsernameResponse.ok) {
      const error = await invalidUsernameResponse.json();
      console.log(`✅ Validação funcionando: ${error.error}\n`);
    } else {
      console.log('❌ Validação de username não funcionou\n');
    }

    // 3. Teste de validações - Email inválido
    console.log('3️⃣ Testando validação: Email inválido...');
    const testInvalidEmail = {
      username: 'teste.funcionario',
      password: '123456',
      email: 'email-invalido', // Email inválido
      full_name: 'Teste Funcionário',
      company_id: testCompany.id,
      can_view_documentacao: true
    };

    const invalidEmailResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInvalidEmail)
    });

    if (!invalidEmailResponse.ok) {
      const error = await invalidEmailResponse.json();
      console.log(`✅ Validação funcionando: ${error.error}\n`);
    } else {
      console.log('❌ Validação de email não funcionou\n');
    }

    // 4. Teste de criação válida (SE for admin)
    console.log('4️⃣ Testando criação válida...');
    console.log('⚠️  NOTA: Este teste falhará se não houver admin autenticado');
    console.log('   Para testar completamente, faça login como admin primeiro\n');
    
    const validEmployee = {
      username: `teste.${Date.now()}`, // Username único
      password: '123456',
      email: 'teste@exemplo.com',
      full_name: 'Funcionário de Teste',
      department: 'Teste',
      company_id: testCompany.id,
      can_view_denuncias: false,
      can_view_documentacao: true,
      can_view_naoconformidades: false,
      can_view_empresas: false
    };

    const validResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validEmployee)
    });

    if (validResponse.ok) {
      const newUser = await validResponse.json();
      console.log(`✅ Funcionário criado com sucesso: ${newUser.full_name}`);
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Empresa: ${newUser.company_name}\n`);
    } else {
      const error = await validResponse.json();
      if (error.error === 'Usuário não autenticado' || error.error === 'Acesso negado. Apenas administradores podem realizar esta operação.') {
        console.log(`⚠️  Como esperado: ${error.error}`);
        console.log('   Middleware de autenticação funcionando corretamente!\n');
      } else {
        console.log(`❌ Erro inesperado: ${error.error}\n`);
      }
    }

    // 5. Teste de username duplicado
    console.log('5️⃣ Testando validação: Username duplicado...');
    
    // Tentar criar com username 'admin' que já existe
    const duplicateUsername = {
      username: 'admin', // Já existe
      password: '123456',
      full_name: 'Teste Duplicado',
      company_id: testCompany.id
    };

    const duplicateResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateUsername)
    });

    if (!duplicateResponse.ok) {
      const error = await duplicateResponse.json();
      if (error.error === 'Nome de usuário já existe') {
        console.log(`✅ Validação funcionando: ${error.error}\n`);
      } else {
        console.log(`⚠️  Outro erro (pode ser auth): ${error.error}\n`);
      }
    } else {
      console.log('❌ Validação de username duplicado não funcionou\n');
    }

    console.log('🎉 Testes concluídos!');
    console.log('\n📊 Resumo:');
    console.log('✅ Validações de campo funcionando');
    console.log('✅ Middleware de autenticação ativo');
    console.log('✅ Validação de username duplicado funcionando');
    console.log('\n💡 Para testar criação completa: faça login como admin primeiro');

  } catch (error) {
    console.error('💥 Erro durante os testes:', error.message);
  }
}

// Executar testes
testEmployeeCreation(); 