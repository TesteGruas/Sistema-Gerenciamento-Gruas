-- Migração: Criar tabela responsaveis_obra
-- Data: 2026-02-21
-- Descrição: Tabela para armazenar responsáveis de obra que terão acesso para aprovar horas dos funcionários

CREATE TABLE IF NOT EXISTS responsaveis_obra (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  pedido VARCHAR(100),
  usuario VARCHAR(100),
  email VARCHAR(255),
  telefone VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responsaveis_obra_obra_id ON responsaveis_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_obra_email ON responsaveis_obra(email);
