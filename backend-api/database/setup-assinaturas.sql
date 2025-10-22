-- =============================================
-- Script de Configuração - Sistema de Assinaturas
-- =============================================

-- 1. Criar tabela de documentos
CREATE TABLE IF NOT EXISTS obras_documentos (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  arquivo_original VARCHAR(500),
  arquivo_assinado VARCHAR(500),
  caminho_arquivo VARCHAR(500),
  docu_sign_link VARCHAR(500),
  docu_sign_envelope_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aguardando_assinatura', 'em_assinatura', 'assinado', 'rejeitado')),
  proximo_assinante_id INTEGER,
  proximo_assinante_nome VARCHAR(255),
  created_by INTEGER REFERENCES auth.users(id),
  created_by_nome VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS obras_documento_assinaturas (
  id SERIAL PRIMARY KEY,
  documento_id INTEGER REFERENCES obras_documentos(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Pode ser UUID do auth ou ID numérico
  ordem INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aguardando', 'assinado', 'rejeitado')),
  tipo VARCHAR(20) DEFAULT 'interno' CHECK (tipo IN ('interno', 'cliente')),
  docu_sign_link VARCHAR(500),
  docu_sign_envelope_id VARCHAR(255),
  data_envio TIMESTAMP,
  data_assinatura TIMESTAMP,
  arquivo_assinado VARCHAR(500),
  observacoes TEXT,
  email_enviado BOOLEAN DEFAULT FALSE,
  data_email_enviado TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(documento_id, user_id)
);

-- 3. Criar tabela de histórico
CREATE TABLE IF NOT EXISTS obras_documento_historico (
  id SERIAL PRIMARY KEY,
  documento_id INTEGER REFERENCES obras_documentos(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES auth.users(id),
  acao VARCHAR(50) NOT NULL CHECK (acao IN ('criado', 'enviado', 'assinou', 'rejeitou', 'cancelou')),
  data_acao TIMESTAMP DEFAULT NOW(),
  arquivo_gerado VARCHAR(500),
  observacoes TEXT,
  ip_address INET,
  user_agent TEXT,
  user_nome VARCHAR(255),
  user_email VARCHAR(255),
  user_role VARCHAR(50)
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_obras_documentos_obra_id ON obras_documentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_obras_documentos_status ON obras_documentos(status);
CREATE INDEX IF NOT EXISTS idx_obras_documentos_created_by ON obras_documentos(created_by);

CREATE INDEX IF NOT EXISTS idx_assinaturas_documento_id ON obras_documento_assinaturas(documento_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_user_id ON obras_documento_assinaturas(user_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON obras_documento_assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_ordem ON obras_documento_assinaturas(documento_id, ordem);

CREATE INDEX IF NOT EXISTS idx_historico_documento_id ON obras_documento_historico(documento_id);
CREATE INDEX IF NOT EXISTS idx_historico_user_id ON obras_documento_historico(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_data_acao ON obras_documento_historico(data_acao);

-- 5. Configurar Supabase Storage
-- Executar no Supabase Dashboard > Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arquivos-obras', 
  'arquivos-obras', 
  true, 
  52428800, -- 50MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 6. Configurar políticas RLS para storage
-- Política para leitura pública
CREATE POLICY IF NOT EXISTS "Arquivos públicos" ON storage.objects
FOR SELECT USING (bucket_id = 'arquivos-obras');

-- Política para upload (usuários autenticados)
CREATE POLICY IF NOT EXISTS "Upload arquivos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'arquivos-obras' 
  AND auth.role() = 'authenticated'
);

-- Política para atualização (usuários autenticados)
CREATE POLICY IF NOT EXISTS "Update arquivos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'arquivos-obras' 
  AND auth.role() = 'authenticated'
);

-- Política para exclusão (usuários autenticados)
CREATE POLICY IF NOT EXISTS "Delete arquivos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'arquivos-obras' 
  AND auth.role() = 'authenticated'
);

-- 7. Configurar RLS para tabelas
ALTER TABLE obras_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_documento_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_documento_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para obras_documentos
CREATE POLICY "Documentos públicos" ON obras_documentos
FOR SELECT USING (true);

CREATE POLICY "Criar documentos" ON obras_documentos
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Atualizar documentos" ON obras_documentos
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Excluir documentos" ON obras_documentos
FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para obras_documento_assinaturas
CREATE POLICY "Assinaturas públicas" ON obras_documento_assinaturas
FOR SELECT USING (true);

CREATE POLICY "Criar assinaturas" ON obras_documento_assinaturas
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Atualizar assinaturas" ON obras_documento_assinaturas
FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para obras_documento_historico
CREATE POLICY "Histórico público" ON obras_documento_historico
FOR SELECT USING (true);

CREATE POLICY "Criar histórico" ON obras_documento_historico
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Criar funções auxiliares
CREATE OR REPLACE FUNCTION atualizar_proximo_assinante()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar próximo assinante quando uma assinatura for concluída
  IF NEW.status = 'assinado' AND OLD.status != 'assinado' THEN
    UPDATE obras_documento_assinaturas 
    SET status = 'aguardando'
    WHERE documento_id = NEW.documento_id 
      AND ordem = NEW.ordem + 1
      AND status = 'pendente';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar próximo assinante
CREATE TRIGGER trigger_atualizar_proximo_assinante
  AFTER UPDATE ON obras_documento_assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_proximo_assinante();

-- 9. Inserir dados de teste (opcional)
-- Descomente as linhas abaixo para inserir dados de teste

/*
-- Inserir documento de teste
INSERT INTO obras_documentos (obra_id, titulo, descricao, status, created_by, created_by_nome)
VALUES (1, 'Contrato de Teste', 'Documento para teste do sistema', 'rascunho', 1, 'Usuário Teste');

-- Inserir assinaturas de teste
INSERT INTO obras_documento_assinaturas (documento_id, user_id, ordem, status, tipo)
VALUES 
  (1, '1', 1, 'aguardando', 'interno'),
  (1, '2', 2, 'pendente', 'cliente');
*/

-- 10. Verificar configuração
SELECT 'Configuração concluída!' as status;

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'obras_documento%';

-- Verificar bucket criado
SELECT * FROM storage.buckets WHERE id = 'arquivos-obras';
