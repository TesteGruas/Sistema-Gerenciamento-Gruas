-- Migration: Limpar dados mockados de contato técnico da obra 114 e orçamentos
-- Data: 2026-02-04
-- Descrição: Remove dados de teste de contato técnico (João Silva) da obra ID 114,
--            de todas as obras com dados mockados e também dos orçamentos
--            para evitar que sejam copiados em novas obras

BEGIN;

-- Log inicial
DO $$
DECLARE
    obra_record RECORD;
    total_obras INTEGER;
BEGIN
    -- Verificar obra 114 especificamente
    SELECT COUNT(*) INTO total_obras
    FROM obras
    WHERE id = 114 
      AND (contato_obra IS NOT NULL OR telefone_obra IS NOT NULL OR email_obra IS NOT NULL);
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '🔍 VERIFICAÇÃO DE DADOS MOCKADOS - OBRA 114';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    
    IF total_obras > 0 THEN
        SELECT id, nome, contato_obra, telefone_obra, email_obra INTO obra_record
        FROM obras
        WHERE id = 114;
        
        RAISE NOTICE '📋 Dados atuais da obra 114:';
        RAISE NOTICE '   - ID: %', obra_record.id;
        RAISE NOTICE '   - Nome: %', obra_record.nome;
        RAISE NOTICE '   - Contato: %', COALESCE(obra_record.contato_obra, 'NULL');
        RAISE NOTICE '   - Telefone: %', COALESCE(obra_record.telefone_obra, 'NULL');
        RAISE NOTICE '   - Email: %', COALESCE(obra_record.email_obra, 'NULL');
    ELSE
        RAISE NOTICE '✅ Obra 114 não possui dados de contato técnico';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Limpar dados mockados de TODAS as obras (incluindo a 114)
UPDATE obras
SET 
    contato_obra = NULL,
    telefone_obra = NULL,
    email_obra = NULL,
    updated_at = NOW()
WHERE (
    -- Padrão exato do mockado
    (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321' AND email_obra = 'joao.silva@construtora.com.br')
    -- Variações possíveis
    OR (contato_obra = 'João Silva' AND email_obra = 'joao.silva@construtora.com.br')
    OR (email_obra = 'joao.silva@construtora.com.br')
    OR (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321')
    -- Ou qualquer contato com nome "João Silva" (pode ser mockado)
    OR (contato_obra = 'João Silva')
  );

-- Limpar dados mockados de orçamentos para evitar que sejam copiados em novas obras
UPDATE orcamentos
SET 
    obra_contato = NULL,
    updated_at = NOW()
WHERE obra_contato = 'João Silva';

-- Verificar outras obras com dados mockados similares
DO $$
DECLARE
    obras_mockadas INTEGER;
    orcamentos_mockados INTEGER;
    obra_record RECORD;
BEGIN
    SELECT COUNT(*) INTO obras_mockadas
    FROM obras
    WHERE (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321' AND email_obra = 'joao.silva@construtora.com.br')
       OR (contato_obra = 'João Silva' AND email_obra = 'joao.silva@construtora.com.br')
       OR (email_obra = 'joao.silva@construtora.com.br')
       OR (contato_obra = 'João Silva');
    
    SELECT COUNT(*) INTO orcamentos_mockados
    FROM orcamentos
    WHERE obra_contato = 'João Silva';
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICAÇÃO GERAL DE DADOS MOCKADOS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 Obras com dados mockados encontradas: %', obras_mockadas;
    RAISE NOTICE '📊 Orçamentos com dados mockados encontrados: %', orcamentos_mockados;
    
    IF obras_mockadas > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 Obras que ainda possuem dados mockados:';
        FOR obra_record IN 
            SELECT id, nome, contato_obra, telefone_obra, email_obra
            FROM obras
            WHERE (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321' AND email_obra = 'joao.silva@construtora.com.br')
               OR (contato_obra = 'João Silva' AND email_obra = 'joao.silva@construtora.com.br')
               OR (email_obra = 'joao.silva@construtora.com.br')
               OR (contato_obra = 'João Silva')
            ORDER BY id
        LOOP
            RAISE NOTICE '   - Obra ID: %, Nome: %, Contato: %, Telefone: %, Email: %', 
                obra_record.id, obra_record.nome, 
                COALESCE(obra_record.contato_obra, 'NULL'),
                COALESCE(obra_record.telefone_obra, 'NULL'),
                COALESCE(obra_record.email_obra, 'NULL');
        END LOOP;
    ELSE
        RAISE NOTICE '✅ Nenhuma obra com dados mockados encontrada!';
    END IF;
    
    IF orcamentos_mockados > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ATENÇÃO: Ainda existem % orçamento(s) com dados mockados!', orcamentos_mockados;
        RAISE NOTICE '   Esses dados podem ser copiados para novas obras criadas a partir desses orçamentos.';
    ELSE
        RAISE NOTICE '✅ Nenhum orçamento com dados mockados encontrado!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Log final
DO $$
DECLARE
    obra_atualizada RECORD;
BEGIN
    SELECT id, nome, contato_obra, telefone_obra, email_obra INTO obra_atualizada
    FROM obras
    WHERE id = 114;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ MIGRATION CONCLUÍDA';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📋 Dados finais da obra 114:';
    RAISE NOTICE '   - ID: %', obra_atualizada.id;
    RAISE NOTICE '   - Nome: %', obra_atualizada.nome;
    RAISE NOTICE '   - Contato: %', COALESCE(obra_atualizada.contato_obra, 'NULL (limpo)');
    RAISE NOTICE '   - Telefone: %', COALESCE(obra_atualizada.telefone_obra, 'NULL (limpo)');
    RAISE NOTICE '   - Email: %', COALESCE(obra_atualizada.email_obra, 'NULL (limpo)');
    RAISE NOTICE '';
    RAISE NOTICE '✅ Dados mockados removidos da obra 114!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- Verificação final (opcional - descomente para executar)
-- SELECT 
--     id,
--     nome,
--     contato_obra,
--     telefone_obra,
--     email_obra,
--     updated_at
-- FROM obras
-- WHERE id = 114;
