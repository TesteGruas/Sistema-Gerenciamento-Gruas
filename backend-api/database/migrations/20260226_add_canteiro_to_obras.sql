-- Migration: Adicionar campo canteiro na tabela obras
-- Data: 2026-02-26
-- Descrição: Permite salvar o "Canteiro de Obras" no Livro da Grua

ALTER TABLE obras
ADD COLUMN IF NOT EXISTS canteiro TEXT;

COMMENT ON COLUMN obras.canteiro IS 'Descrição do canteiro de obras/local principal de instalação';
