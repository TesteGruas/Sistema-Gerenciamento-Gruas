-- Remover registro de teste automático de ponto eletrônico
-- ID: TEST03565204VC
-- Observações: "Registro de teste criado automaticamente para validação do sistema WhatsApp"

-- Deletar aprovações relacionadas primeiro (se houver)
DELETE FROM aprovacoes_horas_extras 
WHERE observacoes LIKE '%Registro de teste criado automaticamente%'
   OR observacoes LIKE '%TEST03565204VC%';

-- Deletar o registro de ponto de teste
DELETE FROM registros_ponto 
WHERE id = 'TEST03565204VC'
   OR (observacoes LIKE '%Registro de teste criado automaticamente para validação do sistema WhatsApp%'
       AND id LIKE 'TEST%');

-- Deletar outros registros de teste que possam ter sido criados
DELETE FROM registros_ponto 
WHERE observacoes LIKE '%Registro de teste criado automaticamente%'
   AND id LIKE 'TEST%';
