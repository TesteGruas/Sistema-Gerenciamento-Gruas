# Sistema de Assinaturas Digitais - Documentação Técnica

## 📋 Visão Geral

O sistema de assinaturas digitais permite que documentos sejam criados, enviados para assinatura e gerenciados através de um fluxo sequencial. Cada documento pode ter múltiplos assinantes em ordem específica.

## 🏗️ Arquitetura do Sistema

### Frontend (Next.js)
- **Página Principal**: `/app/dashboard/assinatura/page.tsx`
- **Página de Detalhes**: `/app/dashboard/assinatura/[id]/page.tsx`
- **API Client**: `/lib/api-assinaturas.ts`

### Backend (Node.js + Express)
- **Rota Principal**: `/backend-api/src/routes/obras-documentos.js`
- **Rota de Assinaturas**: `/backend-api/src/routes/assinaturas.js`
- **Storage**: Supabase Storage (bucket: `arquivos-obras`)

## 🔄 Fluxo de Funcionamento

### 1. Criação de Documento
```
POST /api/obras-documentos/:obraId/documentos
Content-Type: multipart/form-data

Body:
- titulo: string
- descricao: string (opcional)
- arquivo: File (PDF)
- ordem_assinatura: JSON string
```

**Exemplo de `ordem_assinatura`:**
```json
[
  {
    "user_id": "123",
    "ordem": 1,
    "tipo": "interno",
    "status": "pendente"
  },
  {
    "user_id": "456", 
    "ordem": 2,
    "tipo": "cliente",
    "status": "pendente"
  }
]
```

### 2. Upload de Arquivo Assinado
```
POST /api/assinaturas/:assinaturaId/upload-assinado
Content-Type: multipart/form-data

Body:
- arquivo: File (PDF assinado)
- observacoes: string (opcional)
```

## 📁 Estrutura de Armazenamento

### Supabase Storage - Bucket: `arquivos-obras`

```
arquivos-obras/
├── obras/
│   └── {obraId}/
│       └── documentos/
│           └── {documentoId}/
│               └── documento_original.pdf
└── assinados/
    └── {documentoId}/
        └── {assinaturaId}/
            └── arquivo_assinado.pdf
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: `obras_documentos`
```sql
CREATE TABLE obras_documentos (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  arquivo_original VARCHAR(500),
  arquivo_assinado VARCHAR(500),
  caminho_arquivo VARCHAR(500),
  status VARCHAR(50) DEFAULT 'rascunho',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `obras_documento_assinaturas`
```sql
CREATE TABLE obras_documento_assinaturas (
  id SERIAL PRIMARY KEY,
  documento_id INTEGER REFERENCES obras_documentos(id),
  user_id VARCHAR(255) NOT NULL,
  ordem INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  tipo VARCHAR(20) DEFAULT 'interno',
  arquivo_assinado VARCHAR(500),
  data_assinatura TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 APIs Disponíveis

### Documentos
- `GET /api/obras-documentos/todos` - Listar todos os documentos
- `GET /api/obras-documentos/:obraId/documentos` - Listar documentos de uma obra
- `POST /api/obras-documentos/:obraId/documentos` - Criar novo documento
- `GET /api/obras-documentos/:obraId/documentos/:documentoId` - Obter documento específico
- `DELETE /api/obras-documentos/:obraId/documentos/:documentoId` - Excluir documento

### Assinaturas
- `GET /api/assinaturas/pendentes` - Documentos pendentes para o usuário
- `POST /api/assinaturas/:id/upload-assinado` - Upload de arquivo assinado
- `GET /api/assinaturas/historico` - Histórico de assinaturas do usuário
- `POST /api/assinaturas/:id/assinar` - Assinatura digital (base64)
- `POST /api/assinaturas/:id/recusar` - Recusar documento

## 🚀 Como Usar

### 1. Criar Documento
```javascript
// Frontend
const formData = new FormData();
formData.append('titulo', 'Contrato de Serviços');
formData.append('descricao', 'Contrato para prestação de serviços');
formData.append('arquivo', pdfFile);
formData.append('ordem_assinatura', JSON.stringify([
  { user_id: "123", ordem: 1, tipo: "interno", status: "pendente" },
  { user_id: "456", ordem: 2, tipo: "cliente", status: "pendente" }
]));

const response = await api.post(`/obras-documentos/${obraId}/documentos`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### 2. Upload de Arquivo Assinado
```javascript
// Frontend
const formData = new FormData();
formData.append('arquivo', signedPdfFile);
formData.append('observacoes', 'Documento assinado fisicamente');

const response = await api.post(`/assinaturas/${assinaturaId}/upload-assinado`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

## 🔍 Status dos Documentos

- **`rascunho`**: Documento criado, não enviado para assinatura
- **`aguardando_assinatura`**: Aguardando primeira assinatura
- **`em_assinatura`**: Em processo de assinatura (alguns já assinaram)
- **`assinado`**: Todos os assinantes completaram
- **`rejeitado`**: Documento foi rejeitado por algum assinante

## 🔍 Status das Assinaturas

- **`pendente`**: Aguardando sua vez na ordem
- **`aguardando`**: É sua vez de assinar
- **`assinado`**: Já assinou
- **`rejeitado`**: Rejeitou o documento

## 🛠️ Configuração do Supabase Storage

### 1. Criar Bucket
```sql
-- No Supabase Dashboard > Storage
CREATE BUCKET 'arquivos-obras' WITH (
  public = true,
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY['application/pdf']
);
```

### 2. Configurar Políticas RLS
```sql
-- Política para leitura pública
CREATE POLICY "Arquivos públicos" ON storage.objects
FOR SELECT USING (bucket_id = 'arquivos-obras');

-- Política para upload (usuários autenticados)
CREATE POLICY "Upload arquivos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'arquivos-obras' 
  AND auth.role() = 'authenticated'
);
```

## 🐛 Troubleshooting

### Problema: "Nenhum arquivo enviado"
**Causa**: FormData não está sendo enviado corretamente
**Solução**: Verificar se o arquivo está sendo anexado ao FormData

### Problema: "Arquivo não encontrado no storage"
**Causa**: Caminho do arquivo incorreto ou bucket não configurado
**Solução**: Verificar configuração do Supabase Storage

### Problema: "Usuário não tem permissão"
**Causa**: Usuário não está na lista de assinantes ou ordem incorreta
**Solução**: Verificar `ordem_assinatura` e `user_id`

## 📊 Monitoramento

### Logs Importantes
```javascript
// Backend - Upload de arquivo
console.log('Upload realizado:', {
  documentoId: documento.id,
  assinaturaId: assinatura.id,
  filePath: filePath,
  url: urlData.publicUrl
});

// Frontend - Upload de arquivo
console.log('Arquivo enviado:', {
  assinaturaId,
  fileName: arquivo.name,
  fileSize: arquivo.size
});
```

## 🔒 Segurança

- **Autenticação**: Token JWT obrigatório
- **Autorização**: Verificação de permissões por usuário
- **Validação**: Apenas PDFs são aceitos
- **Tamanho**: Limite de 10MB para arquivos assinados, 50MB para documentos originais
- **Storage**: Arquivos armazenados no Supabase Storage com URLs públicas

## 📈 Melhorias Futuras

1. **Notificações por Email**: Envio automático de lembretes
2. **Assinatura Digital**: Integração com certificados digitais
3. **Auditoria**: Log detalhado de todas as ações
4. **Versionamento**: Controle de versões dos documentos
5. **Templates**: Modelos pré-definidos de documentos

---

**Desenvolvido por**: Sistema de Gerenciamento de Guindastes  
**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025

