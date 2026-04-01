-- Garante CHECK de tipo_documento alinhado ao código (boletos por NF).
-- Ambientes que não rodaram 20260326_medicao_documentos_boletos_por_nf.sql falham em INSERT com boleto_nf_*.

ALTER TABLE medicao_documentos
  DROP CONSTRAINT IF EXISTS medicao_documentos_tipo_documento_check;

UPDATE medicao_documentos
SET tipo_documento = 'boleto_nf_servico_1'
WHERE tipo_documento = 'boleto';

ALTER TABLE medicao_documentos
  ADD CONSTRAINT medicao_documentos_tipo_documento_check
  CHECK (tipo_documento IN (
    'nf_servico',
    'nf_produto',
    'nf_locacao',
    'boleto_nf_servico_1',
    'boleto_nf_servico_2',
    'boleto_nf_locacao_1',
    'boleto_nf_locacao_2',
    'medicao_pdf'
  ));

COMMENT ON COLUMN medicao_documentos.tipo_documento IS
  'nf_servico, nf_produto, nf_locacao, medicao_pdf; boletos: boleto_nf_servico_1/2, boleto_nf_locacao_1/2';
