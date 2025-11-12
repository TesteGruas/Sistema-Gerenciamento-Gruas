-- =====================================================
-- Migration: Add apikey field to whatsapp_instances
-- Descrição: Adiciona campo apikey na tabela whatsapp_instances para armazenar a API key da Evolution API
-- Data: 25/01/2025
-- =====================================================

-- Adicionar coluna apikey em whatsapp_instances
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS apikey TEXT;

-- Comentário na coluna
COMMENT ON COLUMN whatsapp_instances.apikey IS 'API Key da Evolution API para esta instância WhatsApp';

-- Migrar dados existentes de system_config para whatsapp_instances (se houver)
-- Atualizar instâncias existentes com a API key da system_config
UPDATE whatsapp_instances wi
SET apikey = (
  SELECT value 
  FROM system_config 
  WHERE key = 'evolution_api_key' 
  LIMIT 1
)
WHERE apikey IS NULL 
  AND EXISTS (
    SELECT 1 
    FROM system_config 
    WHERE key = 'evolution_api_key'
  );

