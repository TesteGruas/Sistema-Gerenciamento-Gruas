-- O bucket arquivos-obras costuma ser criado só com application/pdf (ex.: setup-assinaturas.sql),
-- o que bloqueia XML, imagens e outros anexos usados pelo sistema.
-- NULL = Supabase aceita qualquer MIME type neste bucket.
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'arquivos-obras';

-- Se preferir lista explícita em vez de NULL, use por exemplo:
-- UPDATE storage.buckets SET allowed_mime_types = ARRAY[
--   'application/pdf',
--   'application/xml',
--   'text/xml',
--   'application/octet-stream',
--   'image/jpeg',
--   'image/jpg',
--   'image/png'
-- ] WHERE id = 'arquivos-obras';
