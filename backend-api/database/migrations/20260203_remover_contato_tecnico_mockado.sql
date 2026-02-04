-- Migration: Remover dados mockados de contato técnico da obra
-- Data: 2026-02-03
-- Descrição: Remove dados de teste de contato técnico (João Silva) que foram preenchidos automaticamente
--            na função preencherDadosTeste() do frontend

BEGIN;

-- Log inicial
DO $$
DECLARE
    total_obras INTEGER;
    obra_record RECORD;
BEGIN
    -- Contar obras com dados mockados de contato técnico
    SELECT COUNT(*) INTO total_obras
    FROM obras
    WHERE (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321' AND email_obra = 'joao.silva@construtora.com.br')
       OR (contato_obra = 'João Silva' AND email_obra = 'joao.silva@construtora.com.br')
       OR (email_obra = 'joao.silva@construtora.com.br');
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '🗑️  REMOÇÃO DE DADOS MOCKADOS - CONTATO TÉCNICO';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 Obras com dados mockados encontradas: %', total_obras;
    RAISE NOTICE '';
    
    -- Listar obras que serão afetadas
    IF total_obras > 0 THEN
        RAISE NOTICE '📋 Obras que serão atualizadas:';
        FOR obra_record IN 
            SELECT id, nome, contato_obra, telefone_obra, email_obra
            FROM obras
            WHERE (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321' AND email_obra = 'joao.silva@construtora.com.br')
               OR (contato_obra = 'João Silva' AND email_obra = 'joao.silva@construtora.com.br')
               OR (email_obra = 'joao.silva@construtora.com.br')
            ORDER BY id
        LOOP
            RAISE NOTICE '   - Obra ID: %, Nome: %, Contato: %, Telefone: %, Email: %', 
                obra_record.id, obra_record.nome, obra_record.contato_obra, 
                obra_record.telefone_obra, obra_record.email_obra;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Remover dados mockados de contato técnico
-- Limpa os campos contato_obra, telefone_obra e email_obra quando correspondem aos dados mockados
UPDATE obras
SET 
    contato_obra = NULL,
    telefone_obra = NULL,
    email_obra = NULL,
    updated_at = NOW()
WHERE (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321' AND email_obra = 'joao.silva@construtora.com.br')
   OR (contato_obra = 'João Silva' AND email_obra = 'joao.silva@construtora.com.br')
   OR (email_obra = 'joao.silva@construtora.com.br');

-- Log final
DO $$
DECLARE
    obras_atualizadas INTEGER;
    obras_restantes INTEGER;
BEGIN
    -- Contar obras atualizadas
    SELECT COUNT(*) INTO obras_atualizadas
    FROM obras
    WHERE contato_obra IS NULL 
      AND telefone_obra IS NULL 
      AND email_obra IS NULL
      AND updated_at >= NOW() - INTERVAL '1 minute';
    
    -- Verificar se ainda há dados mockados restantes
    SELECT COUNT(*) INTO obras_restantes
    FROM obras
    WHERE (contato_obra = 'João Silva' AND telefone_obra = '(11) 98765-4321' AND email_obra = 'joao.silva@construtora.com.br')
       OR (contato_obra = 'João Silva' AND email_obra = 'joao.silva@construtora.com.br')
       OR (email_obra = 'joao.silva@construtora.com.br');
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ MIGRATION CONCLUÍDA';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 Obras atualizadas: %', obras_atualizadas;
    
    IF obras_restantes > 0 THEN
        RAISE NOTICE '⚠️  ATENÇÃO: Ainda existem % obra(s) com dados mockados!', obras_restantes;
        RAISE NOTICE '   Verifique manualmente se há variações nos dados mockados.';
    ELSE
        RAISE NOTICE '✅ Todos os dados mockados de contato técnico foram removidos!';
    END IF;
    
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
-- WHERE contato_obra IS NULL 
--   AND telefone_obra IS NULL 
--   AND email_obra IS NULL
--   AND updated_at >= NOW() - INTERVAL '1 minute'
-- ORDER BY id;
