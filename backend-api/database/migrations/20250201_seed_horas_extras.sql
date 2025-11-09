-- =========================================================
-- Migration: Seed de Horas Extras para Testes
-- Data: 2025-02-01
-- Objetivo: Gerar registros de ponto com horas extras e aprovações pendentes
--           para facilitar testes do sistema de aprovação via WhatsApp
-- =========================================================

-- Função para gerar seed de horas extras
-- Parâmetros podem ser ajustados conforme necessário
DO $$
DECLARE
  -- Configurações
  quantidade_registros INTEGER := 10;
  dias_retroativos INTEGER := 7;
  
  -- Variáveis
  funcionario_record RECORD;
  supervisor_record RECORD;
  data_trabalho DATE;
  horario_base RECORD;
  registro_id INTEGER;
  aprovacao_id INTEGER;
  contador INTEGER := 0;
  datas_array DATE[];
  i INTEGER;
  
  -- Variáveis para horários
  entrada_time TIME;
  saida_time TIME;
  horas_trab NUMERIC;
  horas_ext NUMERIC;
  horario_idx INTEGER;
  
BEGIN
  RAISE NOTICE '🌱 Iniciando seed de horas extras...';
  RAISE NOTICE '📊 Configurações: % registros, % dias retroativos', quantidade_registros, dias_retroativos;
  
  -- Gerar array de datas retroativas
  FOR i IN 0..(dias_retroativos - 1) LOOP
    datas_array := array_append(datas_array, CURRENT_DATE - i);
  END LOOP;
  
  -- Verificar se existem funcionários e supervisores
  IF NOT EXISTS (SELECT 1 FROM funcionarios WHERE status = 'Ativo' LIMIT 1) THEN
    RAISE EXCEPTION 'Nenhum funcionário ativo encontrado. Crie funcionários primeiro.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM usuarios LIMIT 1) THEN
    RAISE EXCEPTION 'Nenhum supervisor encontrado. Crie usuários primeiro.';
  END IF;
  
  -- Loop para criar registros
  FOR i IN 1..quantidade_registros LOOP
    BEGIN
      -- Selecionar funcionário aleatório
      SELECT * INTO funcionario_record
      FROM funcionarios
      WHERE status = 'Ativo'
      ORDER BY RANDOM()
      LIMIT 1;
      
      -- Selecionar supervisor aleatório
      SELECT * INTO supervisor_record
      FROM usuarios
      ORDER BY RANDOM()
      LIMIT 1;
      
      -- Selecionar data aleatória
      data_trabalho := datas_array[1 + floor(random() * array_length(datas_array, 1))::int];
      
      -- Selecionar horário aleatório (0-5)
      horario_idx := floor(random() * 6)::INTEGER;
      
      CASE horario_idx
        WHEN 0 THEN
          entrada_time := '07:00'::TIME;
          saida_time := '18:00'::TIME;
          horas_trab := 11.0;
          horas_ext := 3.0;
        WHEN 1 THEN
          entrada_time := '06:00'::TIME;
          saida_time := '17:00'::TIME;
          horas_trab := 11.0;
          horas_ext := 3.0;
        WHEN 2 THEN
          entrada_time := '08:00'::TIME;
          saida_time := '20:00'::TIME;
          horas_trab := 12.0;
          horas_ext := 4.0;
        WHEN 3 THEN
          entrada_time := '07:30'::TIME;
          saida_time := '19:30'::TIME;
          horas_trab := 12.0;
          horas_ext := 4.0;
        WHEN 4 THEN
          entrada_time := '06:30'::TIME;
          saida_time := '18:30'::TIME;
          horas_trab := 12.0;
          horas_ext := 4.0;
        ELSE
          entrada_time := '05:00'::TIME;
          saida_time := '18:00'::TIME;
          horas_trab := 13.0;
          horas_ext := 5.0;
      END CASE;
      
      -- Verificar se já existe registro para este funcionário nesta data
      SELECT id INTO registro_id
      FROM registros_ponto
      WHERE funcionario_id = funcionario_record.id
        AND data = data_trabalho
      LIMIT 1;
      
      -- Se não existe, criar novo registro
      IF registro_id IS NULL THEN
        INSERT INTO registros_ponto (
          funcionario_id,
          data,
          entrada,
          saida,
          horas_trabalhadas,
          horas_extras,
          status,
          observacoes,
          created_at,
          updated_at
        ) VALUES (
          funcionario_record.id,
          data_trabalho,
          entrada_time,
          saida_time,
          horas_trab,
          horas_ext,
          'Pendente Aprovação',
          'Seed - Teste: Registro gerado automaticamente para testes de horas extras',
          NOW(),
          NOW()
        )
        RETURNING id INTO registro_id;
      END IF;
      
      -- Verificar se já existe aprovação para este registro
      IF NOT EXISTS (
        SELECT 1 FROM aprovacoes_horas_extras
        WHERE registro_ponto_id = registro_id
          AND observacoes LIKE 'Seed - Teste%'
      ) THEN
        -- Criar aprovação
        INSERT INTO aprovacoes_horas_extras (
          registro_ponto_id,
          funcionario_id,
          supervisor_id,
          horas_extras,
          data_trabalho,
          data_limite,
          status,
          observacoes,
          created_at,
          updated_at
        ) VALUES (
          registro_id,
          funcionario_record.id,
          supervisor_record.id,
          horas_ext,
          data_trabalho,
          CURRENT_DATE + INTERVAL '7 days', -- data_limite (7 dias a partir de hoje)
          'pendente',
          'Seed - Teste: Aprovação gerada automaticamente para testes do sistema WhatsApp',
          NOW(),
          NOW()
        )
        RETURNING id INTO aprovacao_id;
        
        contador := contador + 1;
        RAISE NOTICE '✅ [%/%] Registro criado: % - % - %h extras', 
          i, quantidade_registros, funcionario_record.nome, data_trabalho, horas_ext;
      ELSE
        RAISE NOTICE '⚠️  [%/%] Aprovação já existe para funcionário % em %', 
          i, quantidade_registros, funcionario_record.nome, data_trabalho;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ [%/%] Erro ao criar registro: %', i, quantidade_registros, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '📊 === RESUMO ===';
  RAISE NOTICE '✅ Aprovações criadas: %', contador;
  RAISE NOTICE '🎉 Seed concluído com sucesso!';
  
END $$;

-- Comentário na migration
COMMENT ON FUNCTION IF EXISTS seed_horas_extras() IS 'Função para gerar dados de teste de horas extras';

