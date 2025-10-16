# APIs Backend Necessárias para Assinaturas

**Data:** 15 de Janeiro de 2025

## 📋 Resumo do Problema

O frontend está simulando o upload de arquivos assinados, mas não há APIs reais no backend para:
1. Upload de arquivo assinado por responsável individual
2. Atualização do status da assinatura
3. Persistência dos dados no banco

## 🔧 APIs que Precisam ser Implementadas

### 1. **POST /api/assinaturas/:id/upload-assinado**
**Descrição:** Upload de arquivo assinado por responsável individual

**Parâmetros:**
- `id` (path): ID da assinatura
- `arquivo` (form-data): Arquivo PDF assinado
- `observacoes` (form-data): Observações opcionais

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Arquivo assinado enviado com sucesso",
  "data": {
    "assinatura_id": "123",
    "arquivo_url": "https://storage.../assinado_123.pdf",
    "status": "assinado",
    "data_assinatura": "2025-01-15T10:30:00Z"
  }
}
```

**Funcionalidades:**
- Validar se o usuário pode assinar (status 'aguardando')
- Upload do arquivo para Supabase Storage
- Atualizar status da assinatura para 'assinado'
- Ativar próximo assinante se houver
- Atualizar status do documento
- Registrar no histórico

### 2. **GET /api/assinaturas/:id/arquivo-assinado**
**Descrição:** Download do arquivo assinado

**Parâmetros:**
- `id` (path): ID da assinatura

**Resposta:**
- Arquivo PDF como stream
- Headers: `Content-Type: application/pdf`
- Header: `Content-Disposition: attachment; filename="arquivo.pdf"`

### 3. **PUT /api/assinaturas/:id/status**
**Descrição:** Atualizar status da assinatura (para casos especiais)

**Body:**
```json
{
  "status": "assinado|rejeitado",
  "observacoes": "Texto opcional"
}
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: `obras_documento_assinaturas`
```sql
-- Campos necessários para o upload:
arquivo_assinado_url VARCHAR(500) -- URL do arquivo no storage
arquivo_assinado_nome VARCHAR(255) -- Nome original do arquivo
data_assinatura TIMESTAMP -- Data/hora da assinatura
observacoes TEXT -- Observações do assinante
```

### Tabela: `obras_documentos`
```sql
-- Campos para controle de status:
status VARCHAR(50) -- aguardando_assinatura, em_assinatura, assinado, rejeitado
proximo_assinante_id INTEGER -- ID do próximo assinante
```

## 🔄 Fluxo de Funcionamento

1. **Usuário faz upload** → Frontend chama `POST /api/assinaturas/:id/upload-assinado`
2. **Backend valida** → Verifica se usuário pode assinar
3. **Upload arquivo** → Salva no Supabase Storage
4. **Atualiza assinatura** → Status para 'assinado', data, observações
5. **Ativa próximo** → Próximo assinante fica 'aguardando'
6. **Atualiza documento** → Status do documento (em_assinatura/assinado)
7. **Registra histórico** → Log da ação no histórico

## 📁 Configuração do Storage

### Supabase Storage Bucket: `arquivos-obras`
**Estrutura de pastas:**
```
arquivos-obras/
├── originais/
│   └── {documento_id}/
│       └── documento_original.pdf
└── assinados/
    └── {documento_id}/
        └── {assinatura_id}/
            └── arquivo_assinado.pdf
```

## 🛡️ Validações Necessárias

1. **Autenticação:** Usuário logado
2. **Autorização:** Usuário é o responsável pela assinatura
3. **Status:** Assinatura está em 'aguardando'
4. **Arquivo:** Apenas PDFs, máximo 10MB
5. **Ordem:** Respeitar ordem de assinaturas

## 🔧 Dependências Necessárias

```bash
npm install multer
```

## 📝 Exemplo de Implementação

```javascript
// Configuração do multer
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Apenas PDFs são permitidos'), false)
    }
  }
})

// Rota de upload
router.post('/:id/upload-assinado', authenticateToken, upload.single('arquivo'), async (req, res) => {
  // Implementação aqui
})
```

## 🎯 Prioridade de Implementação

1. **Alta:** `POST /api/assinaturas/:id/upload-assinado`
2. **Média:** `GET /api/assinaturas/:id/arquivo-assinado`
3. **Baixa:** `PUT /api/assinaturas/:id/status`

---

**Nota:** Este documento serve como guia para implementação das APIs necessárias para o funcionamento completo do sistema de assinaturas.
