-- Seed tipos de benefício documentais (Termo + Recibo VR + Recibo VT)
-- Aparecem no select "Adicionar Benefício" do RH (aba Benefícios).

INSERT INTO beneficios_tipo (tipo, descricao, valor, percentual, ativo, created_at, updated_at)
SELECT
  'Termo de Reconhecimento e Ciência',
  'Termo de reconhecimento e ciência',
  0,
  0,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM beneficios_tipo
  WHERE tipo = 'Termo de Reconhecimento e Ciência'
);

INSERT INTO beneficios_tipo (tipo, descricao, valor, percentual, ativo, created_at, updated_at)
SELECT
  'Recibo / Ajuda de Custo – Vale Refeição',
  'Recibo / ajuda de custo – vale refeição',
  0,
  0,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM beneficios_tipo
  WHERE tipo = 'Recibo / Ajuda de Custo – Vale Refeição'
);

INSERT INTO beneficios_tipo (tipo, descricao, valor, percentual, ativo, created_at, updated_at)
SELECT
  'Recibo / Ajuda de Custo – Vale Transporte',
  'Recibo / ajuda de custo – vale transporte',
  0,
  0,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM beneficios_tipo
  WHERE tipo = 'Recibo / Ajuda de Custo – Vale Transporte'
);
