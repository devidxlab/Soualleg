const Database = require('better-sqlite3');
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function checkAndCreateAssomasul() {
  try {
    console.log('🔍 Verificando empresas existentes...');
    
    // Buscar empresas via API
    const response = await fetch(`${API_BASE_URL}/companies`);
    const companies = await response.json();
    
    console.log('\n📊 Empresas atuais no sistema:');
    companies.forEach(company => {
      console.log(`- ${company.name} (ID: ${company.id})`);
    });
    
    // Verificar se ASSOMASUL já existe
    const assomasul = companies.find(c => 
      c.name.toLowerCase().includes('assomasul') || 
      c.name.toLowerCase().includes('assomassul')
    );
    
    if (assomasul) {
      console.log(`\n✅ ASSOMASUL já existe: ${assomasul.name} (ID: ${assomasul.id})`);
      return assomasul.id;
    }
    
    console.log('\n🏢 Criando empresa ASSOMASUL...');
    
    // Criar ASSOMASUL
    const createResponse = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'ASSOMASUL - Associação dos Produtores de Soja',
        cnpj: '00.123.456/0001-89',
        email: 'contato@assomasul.org.br',
        telefone: '(67) 3321-4500',
        endereco: 'Rua das Palmeiras, 123',
        cidade: 'Campo Grande',
        estado: 'MS',
        cep: '79000-000',
        responsavel: 'Direção Executiva'
      })
    });
    
    if (createResponse.ok) {
      const newCompany = await createResponse.json();
      console.log(`✅ ASSOMASUL criada com sucesso! ID: ${newCompany.id}`);
      return newCompany.id;
    } else {
      throw new Error('Erro ao criar empresa ASSOMASUL');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function createEmployees(companyId) {
  try {
    console.log('\n👥 Criando funcionários da ASSOMASUL...');
    
    const employees = [
      {
        username: 'adriana.bortone',
        password: '123456',
        email: 'recepcao@assomasul.org.br',
        full_name: 'ADRIANA BORTONE',
        department: 'Recepção',
        company_id: companyId,
        user_type: 'employee',
        can_view_denuncias: false,
        can_view_documentacao: true,
        can_view_naoconformidades: false,
        can_view_empresas: false,
        first_login_required: true
      },
      {
        username: 'keila.pamplona',
        password: '123456', 
        email: 'recepcao@assomasul.org.br',
        full_name: 'KEILA PAMPLONA',
        department: 'Recepção',
        company_id: companyId,
        user_type: 'employee',
        can_view_denuncias: false,
        can_view_documentacao: true,
        can_view_naoconformidades: false,
        can_view_empresas: false,
        first_login_required: true
      }
    ];
    
    for (const employee of employees) {
      console.log(`\n📝 Criando funcionário: ${employee.full_name}...`);
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employee)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${employee.full_name} criado com sucesso!`);
        console.log(`   - Usuário: ${employee.username}`);
        console.log(`   - Senha: ${employee.password} (alteração obrigatória no primeiro login)`);
        console.log(`   - Departamento: ${employee.department}`);
      } else {
        const error = await response.json();
        console.log(`❌ Erro ao criar ${employee.full_name}: ${error.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar funcionários:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando configuração da ASSOMASUL...\n');
  
  const companyId = await checkAndCreateAssomasul();
  
  if (companyId) {
    await createEmployees(companyId);
  }
  
  console.log('\n🎉 Processo concluído!');
}

main(); 