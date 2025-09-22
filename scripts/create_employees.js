const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function createEmployees() {
  try {
    console.log('🏢 Buscando empresas cadastradas...');
    
    // Buscar empresas para encontrar qual usar como ASSOMASUL
    const companiesResponse = await fetch(`${API_BASE_URL}/companies`);
    const companies = await companiesResponse.json();
    
    console.log('Empresas encontradas:', companies.map(c => `${c.id}: ${c.name}`));
    
    // Vamos usar a primeira empresa como exemplo (ou você pode escolher qual usar)
    const assomasulCompany = companies[0]; // Modifique aqui se necessário
    
    if (!assomasulCompany) {
      throw new Error('Nenhuma empresa encontrada. Crie uma empresa primeiro.');
    }
    
    console.log(`📋 Criando funcionários para: ${assomasulCompany.name} (ID: ${assomasulCompany.id})`);
    
    // Funcionários da ASSOMASUL
    const employees = [
      {
        username: 'adriana.bortone',
        password: '123456',
        email: 'recepcao@assomasul.org.br',
        full_name: 'ADRIANA BORTONE',
        department: 'Recepção',
        company_id: assomasulCompany.id,
        can_view_denuncias: false,
        can_view_documentacao: true,
        can_view_naoconformidades: true,
        can_view_empresas: false,
        first_login_required: true
      },
      {
        username: 'keila.pamplona',
        password: '123456',
        email: 'recepcao@assomasul.org.br',
        full_name: 'KEILA PAMPLONA',
        department: 'Recepção',
        company_id: assomasulCompany.id,
        can_view_denuncias: false,
        can_view_documentacao: true,
        can_view_naoconformidades: true,
        can_view_empresas: false,
        first_login_required: true
      }
    ];
    
    console.log('\n👥 Criando funcionários...\n');
    
    for (const employee of employees) {
      try {
        console.log(`➡️  Criando: ${employee.full_name}`);
        
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(employee)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar funcionário');
        }
        
        console.log(`✅ ${employee.full_name} criado com sucesso!`);
        console.log(`   👤 Usuário: ${employee.username}`);
        console.log(`   🔑 Senha: ${employee.password} (alteração obrigatória no primeiro login)`);
        console.log(`   📧 Email: ${employee.email}`);
        console.log(`   🏢 Empresa: ${assomasulCompany.name}`);
        console.log(`   📂 Departamento: ${employee.department}`);
        
        console.log('   🔐 Permissões:');
        console.log(`     - Denúncias: ${employee.can_view_denuncias ? '✅' : '❌'}`);
        console.log(`     - Documentação: ${employee.can_view_documentacao ? '✅' : '❌'}`);
        console.log(`     - Não Conformidades: ${employee.can_view_naoconformidades ? '✅' : '❌'}`);
        console.log(`     - Empresas: ${employee.can_view_empresas ? '✅' : '❌'}`);
        console.log('');
        
      } catch (err) {
        console.error(`❌ Erro ao criar ${employee.full_name}:`, err.message);
      }
    }
    
    console.log('🎉 Processo finalizado!');
    console.log('\n📋 Resumo dos funcionários criados:');
    console.log('- ADRIANA BORTONE (adriana.bortone)');
    console.log('- KEILA PAMPLONA (keila.pamplona)');
    console.log('\n🔐 Credenciais padrão:');
    console.log('- Senha: 123456');
    console.log('- Email: recepcao@assomasul.org.br');
    console.log('- Departamento: Recepção');
    console.log('- Alteração de senha obrigatória no primeiro login');
    console.log('\n🌐 Acesse: http://localhost:5174');
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createEmployees();
}

module.exports = { createEmployees }; 