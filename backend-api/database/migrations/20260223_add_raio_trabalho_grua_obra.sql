-- Migration: Adicionar campo raio_trabalho na tabela grua_obra
-- Data: 2026-02-23
-- Descrição: Campo para armazenar o raio de trabalho (tamanho da lança) da grua na obra

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS raio_trabalho DECIMAL(10,2);

COMMENT ON COLUMN grua_obra.raio_trabalho IS 'Raio de trabalho da grua em metros (determina o tamanho da lança)';
