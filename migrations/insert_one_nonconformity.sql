-- Inserir uma não conformidade de exemplo para ICP - Cleverson Pompeu (company_id = 3)
INSERT INTO nonconformities (
    company_id, 
    subject, 
    description, 
    who_did_it, 
    how_it_happened, 
    additional_info, 
    setor, 
    created_at
) VALUES (
    3, 
    'Falha no processo de calibração',
    'Durante o processo de calibração do equipamento XYZ-123, foi constatado que os resultados estão fora dos parâmetros aceitáveis, ultrapassando a tolerância em 2,5%.',
    'Técnico de manutenção',
    'Durante inspeção rotineira',
    'Equipamento com mais de 5 anos sem revisão',
    'Compras',
    '2023-07-15T14:25:00.000Z'
);

-- Inserir evento correspondente para a não conformidade
INSERT INTO events (
    date, 
    category, 
    company, 
    status, 
    description,
    setor
) VALUES (
    '2023-07-15T14:25:00.000Z',
    'Não conformidades',
    'ICP - Cleverson Pompeu',
    'aberto',
    'Nova não conformidade recebida: Falha no processo de calibração',
    'Compras'
); 