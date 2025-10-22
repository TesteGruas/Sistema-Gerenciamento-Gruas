# 🚀 Backend - Sistema de Gerenciamento de Guindastes

## 📋 Visão Geral

Este documento descreve as configurações e implementações necessárias no backend para o sistema de assinaturas digitais funcionar completamente.

## 🏗️ Estrutura do Projeto

```
backend-api/
├── src/
│   ├── routes/
│   │   ├── assinaturas.js          # ✅ Implementado
│   │   ├── obras-documentos.js     # ✅ Implementado
│   │   └── auth.js                 # ✅ Implementado
│   ├── middleware/
│   │   └── auth.js                 # ✅ Implementado
│   ├── config/
│   │   └── supabase.js             # ✅ Implementado
│   └── server.js                   # ✅ Implementado
├── database/
│   ├── migrations/                 # ⚠️ Verificar
│   └── schema.sql                  # ⚠️ Verificar
└── package.json                    # ✅ Implementado
```

## 🔧 Configurações Necessárias

### 1. 📦 Dependências (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "joi": "^17.9.2",
    "uuid": "^9.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1"
  }
}
```

### 2. 🔐 Variáveis de Ambiente (.env)

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. 🗄️ Banco de Dados - Tabelas Necessárias

#### Tabela: `obras_documentos`
```sql
CREATE TABLE obras_documentos (
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
```

#### Tabela: `obras_documento_assinaturas`
```sql
CREATE TABLE obras_documento_assinaturas (
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
```

#### Tabela: `obras_documento_historico`
```sql
CREATE TABLE obras_documento_historico (
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
```

### 4. 🗂️ Supabase Storage - Bucket Configuration

#### Criar Bucket
```sql
-- No Supabase Dashboard > Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arquivos-obras', 
  'arquivos-obras', 
  true, 
  52428800, -- 50MB
  ARRAY['application/pdf']
);
```

#### Políticas RLS
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

-- Política para atualização (usuários autenticados)
CREATE POLICY "Update arquivos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'arquivos-obras' 
  AND auth.role() = 'authenticated'
);

-- Política para exclusão (usuários autenticados)
CREATE POLICY "Delete arquivos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'arquivos-obras' 
  AND auth.role() = 'authenticated'
);
```

## 🚀 APIs Implementadas

### 1. 📄 Documentos (`/api/obras-documentos`)

#### ✅ Criar Documento
```
POST /api/obras-documentos/:obraId/documentos
Content-Type: multipart/form-data

Body:
- titulo: string (required)
- descricao: string (optional)
- arquivo: File (PDF, required)
- ordem_assinatura: JSON string (required)
```

#### ✅ Listar Documentos
```
GET /api/obras-documentos/todos
GET /api/obras-documentos/:obraId/documentos
```

#### ✅ Obter Documento
```
GET /api/obras-documentos/:obraId/documentos/:documentoId
```

#### ✅ Excluir Documento
```
DELETE /api/obras-documentos/:obraId/documentos/:documentoId
```

### 2. ✍️ Assinaturas (`/api/assinaturas`)

#### ✅ Upload de Arquivo Assinado
```
POST /api/assinaturas/:id/upload-assinado
Content-Type: multipart/form-data

Body:
- arquivo: File (PDF, required)
- observacoes: string (optional)
```

#### ✅ Listar Documentos Pendentes
```
GET /api/assinaturas/pendentes
```

#### ✅ Assinar Digitalmente
```
POST /api/assinaturas/:id/assinar
Content-Type: application/json

Body:
{
  "assinatura": "base64_string",
  "geoloc": "lat,lng",
  "timestamp": "ISO_string",
  "observacoes": "string"
}
```

#### ✅ Recusar Documento
```
POST /api/assinaturas/:id/recusar
Content-Type: application/json

Body:
{
  "motivo": "string",
  "observacoes": "string"
}
```

## 🔧 Middleware e Configurações

### 1. 🔐 Autenticação (auth.js)
```javascript
// JWT Token validation
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' })
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' })
    req.user = user
    next()
  })
}
```

### 2. 📁 Upload de Arquivos (multer)
```javascript
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false)
    }
  }
})
```

### 3. 🌐 CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
```

## 🚨 Verificações Necessárias

### 1. ✅ Servidor Rodando
```bash
# Verificar se o servidor está rodando na porta 3001
curl http://localhost:3001/api/health
```

### 2. ✅ Banco de Dados Conectado
```bash
# Verificar conexão com Supabase
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/rest/v1/
```

### 3. ✅ Storage Configurado
```bash
# Verificar se o bucket existe
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/storage/v1/bucket/arquivos-obras
```

## 🐛 Troubleshooting

### Problema: "Nenhum arquivo enviado"
**Causa**: FormData não está sendo enviado corretamente
**Solução**: Verificar se o campo 'arquivo' está sendo enviado

### Problema: "Token inválido"
**Causa**: JWT_SECRET não configurado ou token expirado
**Solução**: Verificar variáveis de ambiente

### Problema: "Arquivo não encontrado no storage"
**Causa**: Bucket não configurado ou políticas RLS incorretas
**Solução**: Verificar configuração do Supabase Storage

### Problema: "Usuário não tem permissão"
**Causa**: Assinatura não existe ou usuário não é o assinante
**Solução**: Verificar dados no banco

## 📊 Logs de Debug

### Adicionar logs em pontos críticos:
```javascript
console.log('=== DEBUG UPLOAD ASSINADO ===')
console.log('ID da assinatura:', req.params.id)
console.log('User ID:', req.user?.id)
console.log('File:', req.file ? {
  originalname: req.file.originalname,
  mimetype: req.file.mimetype,
  size: req.file.size
} : 'Nenhum arquivo')
console.log('=== FIM DEBUG ===')
```

## 🚀 Scripts de Inicialização

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Executar Migrações
```bash
# Executar scripts SQL no Supabase Dashboard
```

### 4. Iniciar Servidor
```bash
npm start
# ou
npm run dev
```

## 📈 Monitoramento

### 1. Logs do Servidor
```bash
# Ver logs em tempo real
tail -f logs/server.log
```

### 2. Métricas de Upload
```javascript
// Adicionar contadores
let uploadCount = 0
let errorCount = 0

// Incrementar em cada upload
uploadCount++
console.log(`Uploads realizados: ${uploadCount}`)
```

### 3. Health Check
```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  })
})
```

## 🔒 Segurança

### 1. Validação de Arquivos
- ✅ Apenas PDFs aceitos
- ✅ Limite de 50MB para documentos originais
- ✅ Limite de 10MB para arquivos assinados
- ✅ Validação de MIME type

### 2. Autenticação
- ✅ JWT tokens obrigatórios
- ✅ Verificação de permissões por usuário
- ✅ Validação de assinatura antes do upload

### 3. Storage
- ✅ URLs públicas para arquivos
- ✅ Políticas RLS configuradas
- ✅ Nomes únicos para arquivos

---

**Desenvolvido por**: Sistema de Gerenciamento de Guindastes  
**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025

