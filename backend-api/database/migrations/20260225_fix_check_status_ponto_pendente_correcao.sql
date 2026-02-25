-- Migration: Ajustar constraint de status em registros_ponto para suportar fluxo de correcao
-- Data: 2026-02-25
-- Motivo: rota de rejeicao do responsavel grava "Pendente Correcao", mas o CHECK atual nao permite.

BEGIN;

-- Garantir tamanho suficiente para status mais longos do fluxo atual
ALTER TABLE registros_ponto
  ALTER COLUMN status TYPE VARCHAR(50);

-- Remover constraints antigas (nomeadas ou default do Postgres)
ALTER TABLE registros_ponto
  DROP CONSTRAINT IF EXISTS check_status_ponto;

ALTER TABLE registros_ponto
  DROP CONSTRAINT IF EXISTS registros_ponto_status_check;

-- Recriar constraint com todos os status usados no modulo de ponto
ALTER TABLE registros_ponto
  ADD CONSTRAINT check_status_ponto
  CHECK (
    status IN (
      'pendente',
      'Normal',
      'Completo',
      'completo',
      'Em Andamento',
      'Incompleto',
      'Atraso',
      'Falta',
      'Pendente Aprovação',
      'Pendente Assinatura',
      'Pendente Assinatura Funcionário',
      'Pendente Assinatura Funcionario',
      'Pendente Correção',
      'Pendente Correcao',
      'Aprovado',
      'Rejeitado'
    )
  );

COMMIT;

