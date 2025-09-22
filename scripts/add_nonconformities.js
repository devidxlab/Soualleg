const fetch = require('node-fetch');
const API_BASE_URL = 'http://localhost:3001/api';

// Empresa padrão para adicionar as não conformidades
const COMPANY_SLUG = 'empresa-padrao';

// Exemplos de não conformidades
const examples = [
  {
    // Não conformidade de nível de risco MÉDIO
    subject: "Falha no processo de calibração",
    description: "Durante o processo de calibração do equipamento XYZ-123, foi constatado que os resultados estão fora dos parâmetros aceitáveis, ultrapassando a tolerância em 2,5%.",
    setor: "Compras",
    setor_verificador: "ADF",
    created_at: "2023-07-15T14:25:00.000Z",
    solucao_imediata: "Equipamento isolado e identificado como 'Não Calibrado'. Fornecedor notificado para avaliação técnica urgente.",
    responsavel_solucao: "Carlos Silva",
    prazo_solucao: "2023-07-25",
    necessita_acao_corretiva: true,
    acao_corretiva: {
      consequencias: "Resultados dos testes de qualidade não confiáveis. Possível impacto em produtos já entregues.",
      causas: "Falta de manutenção preventiva conforme cronograma. Equipamento com 5 anos de uso sem revisão."
    },
    plano_acao: [
      { prioridade: 1, responsavel: "João Mendes", prazo: "2023-08-05" },
      { prioridade: 2, responsavel: "Maria Souza", prazo: "2023-08-15" },
      { prioridade: 3, responsavel: "Pedro Santos", prazo: "2023-08-25" }
    ],
    recorrente: true,
    numNCsRecorrentes: "NC-2023-05, NC-2022-18",
    mudanca_sistema: true,
    analise_riscos: {
      probabilidade: 4,
      consequencia: 3,
      impacto: 12,
      planoAcao: "Revisar processo de qualificação de fornecedores",
      data: "2023-07-20"
    },
    eficacia: {
      responsavel: "Antônio Ferreira",
      data: "2023-09-15"
    },
    status: "aberto"
  },
  {
    // Não conformidade de nível de risco BAIXO
    subject: "Documentação incompleta em processo de RH",
    description: "Durante auditoria interna, foi constatado que 3 dos 15 processos de admissão verificados apresentavam documentação incompleta, faltando comprovantes de residência e certificado de escolaridade.",
    setor: "RH",
    setor_verificador: "Gestão da Informação",
    created_at: "2023-08-10T09:15:00.000Z",
    solucao_imediata: "Contato com funcionários para regularização dos documentos pendentes. Prazo de 5 dias para entrega.",
    responsavel_solucao: "Ana Carolina",
    prazo_solucao: "2023-08-15",
    necessita_acao_corretiva: true,
    acao_corretiva: {
      consequencias: "Possíveis problemas em fiscalizações trabalhistas. Dados incompletos nos sistemas de RH.",
      causas: "Checklist de admissão não foi seguido corretamente. Falta de conferência durante o processo de integração."
    },
    plano_acao: [
      { prioridade: 1, responsavel: "Roberta Lima", prazo: "2023-08-20" },
      { prioridade: 2, responsavel: "Luis Fernando", prazo: "2023-08-25" },
      { prioridade: 3, responsavel: "", prazo: "" }
    ],
    recorrente: false,
    numNCsRecorrentes: "",
    mudanca_sistema: false,
    analise_riscos: {
      probabilidade: 2,
      consequencia: 2,
      impacto: 4,
      planoAcao: "Implementar verificação digital de documentos",
      data: "2023-08-12"
    },
    eficacia: {
      responsavel: "Marcela Santos",
      data: "2023-09-10"
    },
    status: "fechado"
  },
  {
    // Não conformidade de nível de risco ALTO
    subject: "Falha crítica no servidor de dados principal",
    description: "Falha no sistema de refrigeração do datacenter causou superaquecimento e desligamento não programado do servidor principal. Perda de 30 minutos de dados de transações financeiras.",
    setor: "Gestão da Informação",
    setor_verificador: "ADF",
    created_at: "2023-09-05T16:45:00.000Z",
    solucao_imediata: "Ativação do servidor redundante. Restauração dos dados do último backup. Manutenção emergencial do sistema de refrigeração.",
    responsavel_solucao: "Roberto Carlos",
    prazo_solucao: "2023-09-06",
    necessita_acao_corretiva: true,
    acao_corretiva: {
      consequencias: "Perda financeira estimada em R$ 50.000. Indisponibilidade de sistemas críticos por 2 horas.",
      causas: "Sensores de temperatura com falha. Ausência de alarme preventivo. Manutenção preventiva atrasada em 3 meses."
    },
    plano_acao: [
      { prioridade: 1, responsavel: "Paulo Vitor", prazo: "2023-09-10" },
      { prioridade: 2, responsavel: "Carla Mendes", prazo: "2023-09-17" },
      { prioridade: 3, responsavel: "Thiago Almeida", prazo: "2023-09-25" }
    ],
    recorrente: false,
    numNCsRecorrentes: "",
    mudanca_sistema: true,
    analise_riscos: {
      probabilidade: 3,
      consequencia: 5,
      impacto: 15,
      planoAcao: "Implementar sistema redundante de refrigeração e monitoramento em tempo real",
      data: "2023-09-08"
    },
    eficacia: {
      responsavel: "Lucas Oliveira",
      data: ""
    },
    status: "aberto"
  }
];

async function addNonconformities() {
  console.log("Iniciando adição de exemplos de não conformidades...");
  
  for (const example of examples) {
    try {
      console.log(`Adicionando: ${example.subject}`);
      
      const response = await fetch(`${API_BASE_URL}/companies/${COMPANY_SLUG}/nonconformities`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(example)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao criar não conformidade: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Não conformidade criada com sucesso! ID: ${data.id}`);
      
      // Atualizar status para "fechado" se necessário
      if (example.status === "fechado") {
        await updateEventStatus(example.subject, "fechado");
      }
      
    } catch (error) {
      console.error(`Erro ao criar não conformidade "${example.subject}":`, error.message);
    }
  }
  
  console.log("Processo finalizado!");
}

async function updateEventStatus(subject, status) {
  try {
    // Buscar todos os eventos para encontrar o ID do evento relacionado a esta não conformidade
    const eventsResponse = await fetch(`${API_BASE_URL}/events`);
    if (!eventsResponse.ok) {
      throw new Error(`Falha ao buscar eventos: ${eventsResponse.status}`);
    }
    
    const events = await eventsResponse.json();
    
    // Encontrar o evento que corresponde a esta não conformidade
    const event = events.find(e => 
      e.category === "Não conformidades" && 
      e.description.includes(subject)
    );
    
    if (!event) {
      throw new Error("Evento não encontrado");
    }
    
    // Atualizar o status do evento
    const updateResponse = await fetch(`${API_BASE_URL}/events/${event.id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category: event.category,
        company: event.company,
        status: status,
        description: event.description
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Falha ao atualizar status do evento: ${updateResponse.status}`);
    }
    
    console.log(`Status do evento atualizado para ${status}`);
    
  } catch (error) {
    console.error("Erro ao atualizar status do evento:", error.message);
  }
}

// Executar o script
addNonconformities(); 