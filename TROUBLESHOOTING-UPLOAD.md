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
