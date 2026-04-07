-- NF-e: chave de 44 caracteres. NFS-e: código de verificação, Id da nota ou outros identificadores (podem passar de 44).
ALTER TABLE notas_fiscais
  ALTER COLUMN chave_acesso TYPE VARCHAR(512);

COMMENT ON COLUMN notas_fiscais.chave_acesso IS
  'Chave de acesso da NF-e (44 dígitos) ou identificadores da NFS-e (código de verificação, Id, etc.)';
