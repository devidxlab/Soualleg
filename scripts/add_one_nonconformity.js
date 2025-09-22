const fetch = require('node-fetch');

async function addOneNonconformity() {
  try {
    console.log('Adicionando uma não conformidade de exemplo...');
    
    const response = await fetch('http://localhost:3001/api/companies/icp-cleverson-pompeu/nonconformities', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: "Falha no processo de calibração",
        description: "Durante o processo de calibração do equipamento XYZ-123, foi constatado que os resultados estão fora dos parâmetros aceitáveis.",
        setor: "Compras",
        analise_riscos: {
          probabilidade: 4,
          consequencia: 3,
          impacto: 12
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro de resposta: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Não conformidade adicionada com sucesso:', data);
  } catch (error) {
    console.error('Erro ao adicionar não conformidade:', error);
  }
}

addOneNonconformity(); 