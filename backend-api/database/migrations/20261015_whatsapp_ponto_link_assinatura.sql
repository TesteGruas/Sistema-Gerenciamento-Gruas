-- Devolve o link de assinatura do responsável na mensagem de ponto concluído.
-- Não reescreve o texto inteiro: só acrescenta a linha se o modelo atual não usa {{link_assinar}}.

UPDATE whatsapp_templates
SET texto_template = texto_template || '||Assine o ponto: {{link_assinar}}',
    variaveis = CASE
      WHEN variaveis IS NULL THEN '["link_assinar"]'::jsonb
      WHEN variaveis::text LIKE '%link_assinar%' THEN variaveis
      ELSE variaveis || '["link_assinar"]'::jsonb
      END
WHERE tipo = 'ponto_responsavel'
  AND COALESCE(texto_template, '') NOT LIKE '%{{link_assinar}}%';
