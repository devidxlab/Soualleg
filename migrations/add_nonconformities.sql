-- Exemplo 1: Não conformidade de risco médio no setor de Compras
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
    1, 
    'Falha no processo de calibração',
    'Durante o processo de calibração do equipamento XYZ-123, foi constatado que os resultados estão fora dos parâmetros aceitáveis, ultrapassando a tolerância em 2,5%.',
    'Técnico de manutenção',
    'Durante inspeção rotineira',
    'Equipamento com mais de 5 anos sem revisão',
    'Compras',
    '2023-07-15T14:25:00.000Z'
);

-- Inserir evento correspondente para a não conformidade 1
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
    'Empresa Padrão',
    'aberto',
    'Nova não conformidade recebida: Falha no processo de calibração',
    'Compras'
);

-- Exemplo 2: Não conformidade de risco baixo no setor de RH
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
    1, 
    'Documentação incompleta em processo de RH',
    'Durante auditoria interna, foi constatado que 3 dos 15 processos de admissão verificados apresentavam documentação incompleta, faltando comprovantes de residência.',
    'Analista de RH',
    'Durante auditoria interna de rotina',
    'Checklist de admissão não foi seguido corretamente',
    'RH',
    '2023-08-10T09:15:00.000Z'
);

-- Inserir evento correspondente para a não conformidade 2
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
    'Empresa Padrão',
    'fechado',
    'Nova não conformidade recebida: Documentação incompleta em processo de RH',
    'RH'
);

-- Exemplo 3: Não conformidade de risco alto no setor de Gestão da Informação
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
    1, 
    'Falha crítica no servidor de dados principal',
    'Falha no sistema de refrigeração do datacenter causou superaquecimento e desligamento não programado do servidor principal. Perda de 30 minutos de dados de transações.',
    'Equipe de TI',
    'Falha no sistema de refrigeração',
    'Manutenção preventiva atrasada em 3 meses',
    'Gestão da Informação',
    '2023-09-05T16:45:00.000Z'
);

-- Inserir evento correspondente para a não conformidade 3
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
    'Empresa Padrão',
    'aberto',
    'Nova não conformidade recebida: Falha crítica no servidor de dados principal',
    'Gestão da Informação'
); 