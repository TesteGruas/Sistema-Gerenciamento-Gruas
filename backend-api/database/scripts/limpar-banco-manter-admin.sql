-- =============================================================================
-- Limpeza profunda do banco (PostgreSQL / Supabase)
-- Mantém APENAS o usuário master: admin@admin.com
--
-- ATENÇÃO:
--   • Operação destrutiva e difícil de reverter. Use só em homologação ou
--     quando tiver backup.
--   • Preserva estrutura de permissões (perfis, permissoes, perfil_permissoes),
--     configurações gerais, templates de e-mail, tipos de grua/imposto,
--     feriados, WhatsApp (instâncias/templates) e system_config — ajuste o
--     array abaixo se quiser apagar também isso.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  admin_email CONSTANT TEXT := 'admin@admin.com';
  admin_id INTEGER;
  tbl TEXT;
  removidos INTEGER;
  -- Lista de tabelas BASE (relkind = r) com dados operacionais.
  -- ordem não precisa ser manual: cada TRUNCATE usa CASCADE.
  tabelas TEXT[] := ARRAY[
    -- RH / pessoas (exceto usuarios, tratado ao final)
    'afastamentos',
    'ferias',
    'folha_pagamento',
    'certificados_colaboradores',
    'documentos_admissionais',
    'holerites',
    'relatorios_rh',
    'funcionarios_obras',
    'funcionarios',
    -- Obras / gruas / locação
    'obra_gruas_configuracao',
    'responsaveis_obra',
    'responsaveis_tecnicos',
    'sinaleiros_obra',
    'documentos_sinaleiro',
    'obras_arquivos',
    'obras_documento_assinaturas',
    'obras_documento_historico',
    'obras_documentos',
    'grua_funcionario',
    'grua_obra',
    'historico_locacoes',
    'historico_manutencoes',
    'grua_equipamento',
    'equipamentos_auxiliares',
    'grua_configuracoes',
    'componente_configuracao',
    'historico_componentes',
    'grua_componentes',
    'livro_grua',
    'formularios_personalizados_respostas',
    'formularios_personalizados_itens',
    'formularios_personalizados_gruas',
    'obras',
    'gruas',
    -- Clientes / contratos
    'contratos',
    'clientes',
    -- Orçamentos / medições
    'orcamento_itens_locacao',
    'orcamento_valores_fixos_locacao',
    'orcamento_custos_mensais_locacao',
    'orcamentos_locacao',
    'orcamento_itens',
    'orcamento_servicos_adicionais',
    'orcamento_horas_extras',
    'orcamento_custos_mensais',
    'orcamento_valores_fixos',
    'orcamentos',
    'medicao_aditivos',
    'medicao_anexos_aprovacao',
    'medicao_documentos',
    'medicao_componentes',
    'medicao_servicos_adicionais',
    'medicao_horas_extras',
    'medicao_custos_mensais',
    'medicoes_mensais',
    'medicoes',
    'aditivos',
    'locacoes',
    -- Estoque / produtos
    'movimentacoes_estoque',
    'estoque',
    'produtos',
    'categorias',
    -- Complementos (catálogo de itens de orçamento)
    'complementos_catalogo',
    -- Compras / vendas
    'compras_itens',
    'compras',
    'vendas_itens',
    'vendas',
    -- Financeiro
    'cobrancas_aluguel',
    'aluguel_contas_recorrentes',
    'alugueis_residencias',
    'boletos',
    'notas_fiscais_itens',
    'notas_fiscais',
    'impostos_pagamentos',
    'impostos_financeiros',
    'impostos',
    'contas_receber',
    'contas_pagar',
    'movimentacoes_bancarias',
    'transferencias_bancarias',
    'receitas',
    'custos',
    'custos_mensais',
    'itens_custos_mensais',
    -- Bancos: registros; saldos zerados abaixo
    'arquivos_alugueis',
    -- RH operacional / ponto
    'notificacoes_horas_extras',
    'aprovacoes_horas_extras',
    'confirmacoes_trabalho_corrido',
    'notificacoes_almoco',
    'justificativas',
    'registros_ponto',
    'horas_mensais',
    -- Checklists
    'checklist_anexos',
    'checklist_respostas',
    'checklists_diarios',
    'checklist_itens',
    'checklists_modelos',
    'checklist_devolucao',
    -- Manutenção
    'manutencoes_anexos',
    'manutencoes_itens',
    'manutencoes_agenda_preventiva',
    'manutencoes_ordens',
    -- Logística
    'logistica_manifestos_itens',
    'logistica_manifestos',
    'veiculos',
    -- Fornecedores
    'fornecedores',
    'ordem_compras',
    'aprovacoes_ordem_compras',
    -- Arquivos genéricos / auditoria / relatórios gerados
    'arquivos_obra',
    'arquivos',
    'assinaturas_digitais',
    'relatorios',
    'logs_auditoria',
    'email_logs',
    'whatsapp_logs',
    'password_reset_tokens',
    'pwa_push_subscriptions',
    'notificacoes',
    'webhooks',
    -- Backups antigos de migração (se existirem)
    'usuario_perfis_backup',
    'perfil_permissoes_backup',
    'perfis_backup'
  ];
BEGIN
  SELECT u.id INTO admin_id
  FROM usuarios u
  WHERE LOWER(TRIM(u.email)) = LOWER(admin_email)
  LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum registro em usuarios com email %. Abortando.', admin_email;
  END IF;

  RAISE NOTICE 'Admin preservado: id=% email=%', admin_id, admin_email;

  -- Desvincula funcionários antes de esvaziar a tabela funcionarios
  UPDATE usuarios SET funcionario_id = NULL;

  -- Mantém só vínculos de perfil do admin
  DELETE FROM usuario_perfis up WHERE up.usuario_id <> admin_id;

  FOREACH tbl IN ARRAY tabelas LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      BEGIN
        EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', tbl);
        RAISE NOTICE 'TRUNCATE: %', tbl;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Ignorado % (pode ser view ou erro): %', tbl, SQLERRM;
      END;
    END IF;
  END LOOP;

  DELETE FROM usuarios u WHERE u.id <> admin_id;

  GET DIAGNOSTICS removidos = ROW_COUNT;
  RAISE NOTICE 'Usuários removidos (exceto admin): %', removidos;

  -- Zerar saldos bancários (mantém cadastro das contas)
  IF to_regclass('public.contas_bancarias') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contas_bancarias' AND column_name = 'saldo_inicial'
    ) THEN
      UPDATE contas_bancarias
      SET saldo_atual = 0, saldo_inicial = 0, updated_at = CURRENT_TIMESTAMP;
    ELSE
      UPDATE contas_bancarias
      SET saldo_atual = 0, updated_at = CURRENT_TIMESTAMP;
    END IF;
    RAISE NOTICE 'contas_bancarias: saldos zerados';
  END IF;

  RAISE NOTICE 'Concluído. Usuários restantes: %', (SELECT COUNT(*) FROM usuarios);
END $$;

COMMIT;
