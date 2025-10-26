# 🔧 Troubleshooting - Upload de Arquivo Assinado

## 🚨 Problema: Endpoint não responde ou retorna erro

### 📍 Endpoint: `POST /api/assinaturas/:id/upload-assinado`

## 🔍 Checklist de Diagnóstico

### 1. ✅ Verificar se o servidor está rodando
```bash
# Terminal 1 - Backend
cd backend-api
npm start

# Verificar se aparece:
# ✅ Servidor rodando na porta 3001
# ✅ Rotas de assinaturas registradas
```

### 2. ✅ Verificar se as rotas estão registradas
```bash
# No terminal do backend, deve aparecer:
# 📍 /api/assinaturas/:id/upload-assinado
```

### 3. ✅ Verificar autenticação
```javascript
// No frontend, verificar se o token está sendo enviado:
console.log('Token:', localStorage.getItem('access_token'))
```

### 4. ✅ Verificar dados da requisição
```javascript
// No frontend, antes de enviar:
console.log('Assinatura ID:', assinaturaId)
console.log('Arquivo:', arquivo.name, arquivo.size, arquivo.type)
console.log('Observações:', observacoes)
```

## 🐛 Problemas Comuns e Soluções

### ❌ Problema: "Arquivo é obrigatório"
**Causa**: FormData não está sendo criado corretamente
**Solução**:
```javascript
// ✅ Correto
const formData = new FormData()
formData.append('arquivo', arquivo) // Nome deve ser 'arquivo'
formData.append('observacoes', observacoes)

// ❌ Incorreto
formData.append('file', arquivo) // Nome errado
```

### ❌ Problema: "Você não tem permissão"
**Causa**: Usuário não é o assinante ou assinatura não está 'aguardando'
**Solução**:
```sql
-- Verificar no banco:
SELECT * FROM obras_documento_assinaturas 
WHERE id = 102 AND user_id = 'SEU_USER_ID' AND status = 'aguardando';
```

### ❌ Problema: "Documento não está disponível"
**Causa**: Status do documento não permite assinatura
**Solução**:
```sql
-- Verificar status do documento:
SELECT status FROM obras_documentos 
WHERE id = (SELECT documento_id FROM obras_documento_assinaturas WHERE id = 102);

-- Status deve ser: 'aguardando_assinatura' ou 'em_assinatura'
```

### ❌ Problema: Erro 500 - Upload para Storage
**Causa**: Supabase Storage não configurado
**Solução**:
1. Verificar se o bucket 'arquivos-obras' existe
2. Verificar políticas RLS
3. Verificar credenciais do Supabase

## 🔧 Script de Teste Manual

### 1. Teste com curl:
```bash
curl -X POST http://localhost:3001/api/assinaturas/102/upload-assinado \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "arquivo=@/caminho/para/arquivo.pdf" \
  -F "observacoes=Teste manual"
```

### 2. Teste com JavaScript:
```javascript
// No console do navegador:
const formData = new FormData()
formData.append('arquivo', new File(['teste'], 'teste.pdf', { type: 'application/pdf' }))
formData.append('observacoes', 'Teste manual')

fetch('/api/assinaturas/102/upload-assinado', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  body: formData
})
.then(r => r.json())
.then(console.log)
```

## 📊 Logs de Debug

### Backend (Terminal do servidor):
```
=== DEBUG UPLOAD ASSINADO ===
ID da assinatura: 102
User ID: 123
File: { originalname: 'documento.pdf', mimetype: 'application/pdf', size: 12345 }
Body: { observacoes: 'Teste' }
=== FIM DEBUG ===
```

### Frontend (Console do navegador):
```
=== DEBUG UPLOAD ASSINATURA ===
Assinatura ID: 102
Arquivo: documento.pdf
Observações: Teste
```

## 🚀 Verificação Rápida

### 1. Testar endpoint básico:
```bash
curl http://localhost:3001/api/assinaturas/pendentes
```

### 2. Verificar se o arquivo está sendo enviado:
```javascript
// No frontend, antes do upload:
console.log('Arquivo selecionado:', {
  name: arquivo.name,
  size: arquivo.size,
  type: arquivo.type,
  lastModified: arquivo.lastModified
})
```

### 3. Verificar FormData:
```javascript
// No frontend, antes de enviar:
for (let [key, value] of formData.entries()) {
  console.log(`${key}:`, value)
}
```

## 🔒 Configuração do Supabase Storage

### 1. Criar bucket:
```sql
-- No Supabase Dashboard > Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('arquivos-obras', 'arquivos-obras', true);
```

### 2. Configurar políticas:
```sql
-- Política de leitura
CREATE POLICY "Arquivos públicos" ON storage.objects
FOR SELECT USING (bucket_id = 'arquivos-obras');

-- Política de upload
CREATE POLICY "Upload arquivos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'arquivos-obras' 
  AND auth.role() = 'authenticated'
);
```

## 📞 Suporte

Se o problema persistir:

1. **Verificar logs do servidor** para mensagens de erro
2. **Verificar console do navegador** para erros JavaScript
3. **Verificar Network tab** no DevTools para ver a requisição
4. **Verificar banco de dados** para dados inconsistentes

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0

------------------------------------------ RESOLVIDO ---------------------------------------------

Vejo que você está enfrentando um erro ao fazer upload de um ícone, mas a URL que você mencionou (`http://localhost/Módulo Listagem de Serviço/wp-admin/post.php`) parece ser de um sistema WordPress, não do sistema de gerenciamento de gruas que estamos analisando.

Vou ajudar você a diagnosticar e resolver o problema de upload de ícone no contexto do sistema atual:


[8 tools called]

## 🔍 **Diagnóstico do Erro de Upload de Ícone**

Baseado na análise do sistema, identifiquei que você está enfrentando um problema de upload de ícone. Vou te ajudar a resolver isso com base nas configurações do sistema atual.

### 🚨 **Problema Identificado:**

A URL que você mencionou (`http://localhost/Módulo Listagem de Serviço/wp-admin/post.php`) parece ser de um sistema WordPress diferente do sistema de gerenciamento de gruas que estamos analisando. 

### ✅ **Sistema de Upload Atual - Configurações:**

O sistema atual tem **múltiplas implementações de upload** funcionais:

#### 1. **Tipos de Arquivo Suportados para Ícones:**
```64:75:components/ui/file-upload.tsx
acceptedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'text/plain'
]
```

#### 2. **Configuração do Multer (Backend):**
```18:42:backend-api/src/routes/obras-arquivos.js
fileFilter: (req, file, cb) => {
  // Aceitar vários tipos de arquivo
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false)
  }
}
```

### 🔧 **Soluções para Upload de Ícone:**

#### **Opção 1: Usar o Sistema de Upload Existente**

Se você está tentando fazer upload de um ícone no sistema atual, use um destes endpoints:

1. **Upload de Arquivo Simples:**
   - **Endpoint**: `POST /api/arquivos/upload/:obraId`
   - **Componente**: `FileUpload` ou `SimpleFileUpload`

2. **Upload Múltiplo:**
   - **Endpoint**: `POST /api/arquivos/upload-multiple/:obraId`
   - **Componente**: `MultiFileUpload`

#### **Opção 2: Verificar Configuração do Servidor**

Se o erro está relacionado ao servidor backend:

```bash
# Verificar se o servidor está rodando
cd backend-api
npm start

# Verificar logs em tempo real
npm run dev
```

#### **Opção 3: Debug do Upload**

Use o componente `SimpleFileUpload` que tem logs detalhados:

```112:155:components/ui/simple-file-upload.tsx
const uploadFile = async (file: File): Promise<void> => {
  const formData = new FormData()
  formData.append('arquivo', file)
  formData.append('categoria', categoria)

  try {
    // Usar a URL completa do backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const url = `${apiUrl}/arquivos/upload/${obraId}`
    const token = localStorage.getItem('token')
    
    console.log('🔍 DEBUG: Fazendo upload para:', url)
    console.log('🔍 DEBUG: Token disponível:', !!token)
    console.log('🔍 DEBUG: Arquivo:', file.name, 'Tamanho:', file.size)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    console.log('🔍 DEBUG: Resposta recebida:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ DEBUG: Erro na resposta:', errorData)
      throw new Error(errorData.message || 'Erro no upload')
    }

    const result = await response.json()
    console.log('✅ DEBUG: Upload bem-sucedido:', result)
    setUploadedFiles(prev => [result.data, ...prev])
    
    if (onFilesChange) {
      onFilesChange([result.data, ...uploadedFiles])
    }

  } catch (error) {
    console.error('❌ DEBUG: Erro no upload:', error)
    throw error
  }
}
```

### 🛠️ **Passos para Resolver:**

1. **Verificar se está usando o sistema correto:**
   - Confirme se você está no sistema de gerenciamento de gruas
   - URL deve ser `http://localhost:3000` (frontend) ou `http://localhost:3001` (backend)

2. **Verificar tipo de arquivo:**
   - Ícones devem ser: `.png`, `.jpg`, `.jpeg`, `.gif`
   - Tamanho máximo: 100MB (configurado no backend)

3. **Verificar autenticação:**
   - Token deve estar presente no localStorage
   - Usuário deve ter permissões adequadas

4. **Usar componente correto:**
   ```tsx
   import { SimpleFileUpload } from '@/components/ui/simple-file-upload'
   
   <SimpleFileUpload
     obraId={obraId}
     onFilesChange={(files) => console.log('Arquivos:', files)}
     maxFiles={5}
     maxSize={10}
   />
   ```

### 📞 **Próximos Passos:**

Se você puder fornecer mais detalhes sobre:
- **Qual sistema** você está usando (WordPress ou o sistema de gruas)
- **Tipo de arquivo** que está tentando fazer upload
- **Mensagem de erro específica** que aparece
- **Console do navegador** com erros

Posso te ajudar de forma mais específica! 🚀