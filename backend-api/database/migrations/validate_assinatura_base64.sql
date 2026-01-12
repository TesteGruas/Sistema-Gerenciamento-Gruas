-- =============================================
-- Query para validar se a migration add_assinatura_base64_field.sql funcionou
-- =============================================

-- 1. Verificar se a coluna existe na tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'obras_documento_assinaturas'
  AND column_name = 'assinatura_base64';

-- 2. Contar quantas assinaturas têm o campo preenchido
SELECT 
    COUNT(*) as total_assinaturas,
    COUNT(assinatura_base64) as assinaturas_com_base64,
    COUNT(*) - COUNT(assinatura_base64) as assinaturas_sem_base64,
    COUNT(CASE WHEN status = 'assinado' THEN 1 END) as total_assinadas,
    COUNT(CASE WHEN status = 'assinado' AND assinatura_base64 IS NOT NULL THEN 1 END) as assinadas_com_base64
FROM obras_documento_assinaturas;

-- 3. Ver exemplos de assinaturas com e sem base64
SELECT 
    id,
    documento_id,
    user_id,
    ordem,
    status,
    CASE 
        WHEN assinatura_base64 IS NULL THEN '❌ SEM BASE64'
        WHEN LENGTH(assinatura_base64) < 100 THEN '⚠️ BASE64 MUITO CURTO'
        ELSE '✅ COM BASE64'
    END as status_base64,
    LENGTH(assinatura_base64) as tamanho_base64,
    CASE 
        WHEN arquivo_assinado IS NULL THEN 'SEM ARQUIVO'
        WHEN arquivo_assinado LIKE 'data:%' THEN 'BASE64 NO ARQUIVO'
        WHEN arquivo_assinado LIKE 'http%' THEN 'URL'
        ELSE 'OUTRO'
    END as tipo_arquivo_assinado,
    created_at,
    updated_at
FROM obras_documento_assinaturas
WHERE status = 'assinado'
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Verificar se há assinaturas recentes sem base64 (que deveriam ter)
SELECT 
    id,
    documento_id,
    user_id,
    ordem,
    status,
    data_assinatura,
    CASE 
        WHEN arquivo_assinado LIKE 'data:%' THEN 'TEM BASE64 NO ARQUIVO_ASSINADO'
        ELSE 'NÃO TEM BASE64'
    END as observacao,
    updated_at
FROM obras_documento_assinaturas
WHERE status = 'assinado'
  AND assinatura_base64 IS NULL
  AND updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- 5. Query resumida (tudo em uma)
SELECT 
    'Validação da Migration assinatura_base64' as validacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'obras_documento_assinaturas' 
            AND column_name = 'assinatura_base64'
        ) THEN '✅ COLUNA EXISTE'
        ELSE '❌ COLUNA NÃO EXISTE'
    END as coluna_existe,
    (SELECT COUNT(*) FROM obras_documento_assinaturas WHERE assinatura_base64 IS NOT NULL) as total_com_base64,
    (SELECT COUNT(*) FROM obras_documento_assinaturas WHERE status = 'assinado' AND assinatura_base64 IS NULL) as assinadas_sem_base64;















