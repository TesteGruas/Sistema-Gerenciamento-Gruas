-- ============================================
-- QUERIES PARA TESTAR BUSCA DA GRUA G0063
-- ============================================

-- Query 1: Buscar todas as gruas (primeira estratégia - busca manual)
-- Esta é a query principal que o código executa primeiro
SELECT id, name 
FROM gruas
ORDER BY id;

-- Query 2: Busca exata case-insensitive (ILIKE)
-- Equivalente a: .ilike('name', 'G0063')
SELECT * 
FROM gruas 
WHERE name ILIKE 'G0063'
LIMIT 1;

-- Query 3: Busca parcial case-insensitive (ILIKE com %)
-- Equivalente a: .ilike('name', '%G0063%')
SELECT * 
FROM gruas 
WHERE name ILIKE '%G0063%'
LIMIT 1;

-- Query 4: Busca exata case-sensitive (igual)
-- Equivalente a: .eq('name', 'G0063')
SELECT * 
FROM gruas 
WHERE name = 'G0063'
LIMIT 1;

-- Query 5: Verificar se existe alguma grua com "G0063" no nome (case-insensitive)
SELECT id, name, 
       UPPER(TRIM(name)) as name_upper_trimmed,
       TRIM(name) as name_trimmed
FROM gruas 
WHERE UPPER(TRIM(name)) LIKE '%G0063%'
   OR TRIM(name) LIKE '%G0063%'
   OR name LIKE '%G0063%';

-- Query 6: Listar todas as gruas com seus nomes para verificar o formato
SELECT id, 
       name,
       LENGTH(name) as name_length,
       TRIM(name) as name_trimmed,
       UPPER(TRIM(name)) as name_upper
FROM gruas
ORDER BY id;

-- Query 7: Buscar especificamente por "G0063" com diferentes variações
SELECT id, name
FROM gruas
WHERE name = 'G0063'
   OR name = 'g0063'
   OR name = 'G0063 '
   OR name = ' G0063'
   OR name = ' G0063 '
   OR UPPER(TRIM(name)) = 'G0063'
   OR TRIM(name) = 'G0063'
   OR name ILIKE '%G0063%';

-- Query 8: Verificar se há espaços ou caracteres especiais no campo name
SELECT id, 
       name,
       ASCII(name) as first_char_ascii,
       LENGTH(name) as length,
       POSITION(' ' IN name) as space_position,
       name ~ '[^a-zA-Z0-9]' as has_special_chars
FROM gruas
WHERE name ILIKE '%G0063%' OR name ILIKE '%0063%';

-- Query 9: Buscar por padrão numérico (caso o código esteja em outro formato)
SELECT id, name
FROM gruas
WHERE name ~ '0063'
   OR name ~ 'G0063'
   OR name SIMILAR TO '%G0063%'
   OR name SIMILAR TO '%0063%';

-- Query 10: Verificar valores NULL ou vazios no campo name
SELECT id, name, 
       CASE 
         WHEN name IS NULL THEN 'NULL'
         WHEN TRIM(name) = '' THEN 'VAZIO'
         ELSE 'OK'
       END as status_name
FROM gruas
WHERE name IS NULL 
   OR TRIM(name) = ''
   OR name ILIKE '%G0063%'
ORDER BY id;

