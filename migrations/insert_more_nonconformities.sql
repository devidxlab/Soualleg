-- Inserir uma não conformidade de risco baixo para ICP - Cleverson Pompeu (company_id = 3)
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
    'Documentação incompleta em processo de RH',
    'Durante auditoria interna, foi constatado que 3 dos 15 processos de admissão verificados apresentavam documentação incompleta, faltando comprovantes de residência.',
    'Analista de RH',
    'Durante auditoria interna de rotina',
    'Checklist de admissão não foi seguido corretamente',
    'RH',
    '2023-08-10T09:15:00.000Z'
);

-- Inserir evento correspondente para a não conformidade (fechada)
INSERT INTO events (
    date, 
    category, 
    company, 
    status, 
    description,
    setor
) VALUES (
    '2023-08-10T09:15:00.000Z',
    'Não conformidades',
    'ICP - Cleverson Pompeu',
    'fechado',
    'Nova não conformidade recebida: Documentação incompleta em processo de RH',
    'RH'
);

-- Inserir uma não conformidade de risco alto para ICP - Cleverson Pompeu (company_id = 3)
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
    'Falha crítica no servidor de dados principal',
    'Falha no sistema de refrigeração do datacenter causou superaquecimento e desligamento não programado do servidor principal. Perda de 30 minutos de dados de transações.',
    'Equipe de TI',
    'Falha no sistema de refrigeração',
    'Manutenção preventiva atrasada em 3 meses',
    'Gestão da Informação',
    '2023-09-05T16:45:00.000Z'
);

-- Inserir evento correspondente para a não conformidade (aberta)
INSERT INTO events (
    date, 
    category, 
    company, 
    status, 
    description,
    setor
) VALUES (
    '2023-09-05T16:45:00.000Z',
    'Não conformidades',
    'ICP - Cleverson Pompeu',
    'aberto',
    'Nova não conformidade recebida: Falha crítica no servidor de dados principal',
    'Gestão da Informação'
); 