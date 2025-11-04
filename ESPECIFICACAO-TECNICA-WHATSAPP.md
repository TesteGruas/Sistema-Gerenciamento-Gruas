# 📐 ESPECIFICAÇÃO TÉCNICA DETALHADA
## Sistema de Aprovação via WhatsApp

**Versão:** 1.0  
**Data:** 31/10/2025  
**Proposta:** PRO-WHATSAPP-001 (R$ 11.500,00)

---

## 🔄 FLUXO COMPLETO DO SISTEMA

### Fluxo 1: Criação de Aprovação e Envio WhatsApp

```
┌─────────────────┐
│  Funcionário   │
│  Registra Ponto│
└────────┬───────┘
         │
         ▼
┌─────────────────────────────┐
│  Sistema detecta horas      │
│  extras > 0                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Criar registro em          │
│  aprovacoes_horas_extras     │
│  (status: 'pendente')        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Buscar supervisor da obra  │
│  (telefone WhatsApp)        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Gerar token seguro         │
│  (JWT com expiração 48h)     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Formatar mensagem WhatsApp │
│  (template personalizado)    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Enviar via API WhatsApp    │
│  (Evolution/Twilio/Business)│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Registrar em whatsapp_logs │
│  (status: 'enviado')         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Criar notificação interna  │
│  "Enviado para WhatsApp"    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Retornar sucesso para      │
│  funcionário                 │
└─────────────────────────────┘
```

### Fluxo 2: Aprovação via Link WhatsApp

```
┌─────────────────┐
│  Gestor recebe  │
│  mensagem WhatsApp│
└────────┬───────┘
         │
         ▼
┌─────────────────────────────┐
│  Clica no link de aprovação │
│  https://app.com/aprovacao/ │
│  {TOKEN_SEGURO}             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Página pública valida      │
│  token (GET /aprovacao/:token│
└────────┬────────────────────┘
         │
         ├─ Token inválido? ──► Exibe erro
         ├─ Token expirado? ──► Exibe erro
         │
         ▼ Token válido
┌─────────────────────────────┐
│  Buscar dados da aprovação   │
│  (funcionário, obra, horas)  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Exibir página com dados     │
│  e botões Aprovar/Rejeitar   │
└────────┬────────────────────┘
         │
         │ Gestor escolhe:
         ├─ Aprovar
         │  │
         │  ▼
         │  ┌─────────────────────────────┐
         │  │ POST /aprovacao/:token/aprovar│
         │  │ Validar token novamente       │
         │  │ Atualizar status aprovação   │
         │  │ Registrar em auditoria       │
         │  │ Enviar notificação funcionário│
         │  └─────────────────────────────┘
         │
         └─ Rejeitar
            │
            ▼
            ┌─────────────────────────────┐
            │ POST /aprovacao/:token/rejeitar│
            │ Validar token novamente       │
            │ Atualizar status aprovação   │
            │ Registrar em auditoria       │
            │ Enviar notificação funcionário│
            └─────────────────────────────┘
```

---

## 🔌 ESPECIFICAÇÃO DE ENDPOINTS

### Backend - Rotas Públicas

#### `GET /api/aprovacao/:token`
**Descrição:** Valida token e retorna dados da aprovação

**Parâmetros:**
- `token` (path): Token de aprovação JWT

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "aprovacao_id": 123,
    "funcionario": {
      "id": 45,
      "nome": "João Silva"
    },
    "obra": {
      "id": 10,
      "nome": "Shopping Center"
    },
    "horas_extras": 3.5,
    "data_trabalho": "2025-10-31",
    "observacoes": "Trabalho noturno",
    "dias_restantes": 5,
    "token_valido": true
  }
}
```

**Resposta Erro - Token Inválido (400):**
```json
{
  "success": false,
  "message": "Token inválido ou expirado",
  "error_code": "TOKEN_INVALID"
}
```

**Resposta Erro - Token Expirado (400):**
```json
{
  "success": false,
  "message": "Token expirado. Link válido por 48 horas.",
  "error_code": "TOKEN_EXPIRED"
}
```

---

#### `POST /api/aprovacao/:token/aprovar`
**Descrição:** Aprova horas extras via token

**Parâmetros:**
- `token` (path): Token de aprovação JWT

**Body (opcional):**
```json
{
  "observacoes": "Aprovado via WhatsApp"
}
```

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "message": "Horas extras aprovadas com sucesso",
  "data": {
    "aprovacao_id": 123,
    "status": "aprovado",
    "aprovado_em": "2025-10-31T14:30:00Z"
  }
}
```

**Validações:**
- Token válido e não expirado
- Aprovação ainda está pendente
- Rate limiting: máx 10 tentativas/hora por IP

---

#### `POST /api/aprovacao/:token/rejeitar`
**Descrição:** Rejeita horas extras via token

**Parâmetros:**
- `token` (path): Token de aprovação JWT

**Body:**
```json
{
  "observacoes": "Motivo da rejeição"
}
```

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "message": "Horas extras rejeitadas",
  "data": {
    "aprovacao_id": 123,
    "status": "rejeitado",
    "rejeitado_em": "2025-10-31T14:30:00Z"
  }
}
```

---

### Backend - Rotas Administrativas

#### `GET /api/whatsapp-logs`
**Descrição:** Lista logs de envio WhatsApp (requer autenticação admin)

**Query Parâmetros:**
- `aprovacao_id` (opcional): Filtrar por aprovação
- `status` (opcional): Filtrar por status ('enviado', 'entregue', 'falha')
- `data_inicio` (opcional): Data início
- `data_fim` (opcional): Data fim
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "aprovacao_id": 123,
      "tipo_envio": "nova_aprovacao",
      "destinatario_telefone": "+5511999999999",
      "destinatario_nome": "José Santos",
      "status_envio": "entregue",
      "data_envio": "2025-10-31T10:00:00Z",
      "data_entrega": "2025-10-31T10:00:05Z",
      "token_aprovacao": "abc123..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

#### `GET /api/aprovacoes/:id/historico-whatsapp`
**Descrição:** Histórico completo de ações WhatsApp de uma aprovação

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "aprovacao_id": 123,
    "logs": [
      {
        "id": 1,
        "tipo_envio": "nova_aprovacao",
        "data_envio": "2025-10-31T10:00:00Z",
        "status": "entregue"
      }
    ],
    "acoes": [
      {
        "id": 1,
        "acao": "link_aberto",
        "data_acao": "2025-10-31T14:00:00Z",
        "ip_address": "192.168.1.1"
      },
      {
        "id": 2,
        "acao": "aprovar",
        "data_acao": "2025-10-31T14:05:00Z",
        "ip_address": "192.168.1.1"
      }
    ]
  }
}
```

---

## 🔐 ESPECIFICAÇÃO DE TOKENS

### Estrutura do Token JWT:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "aprovacao_id": 123,
  "funcionario_id": 45,
  "supervisor_id": 67,
  "exp": 1730419200,  // Unix timestamp (48h)
  "iat": 1730239200,  // Unix timestamp (agora)
  "jti": "unique-token-id",  // UUID único
  "type": "approval_token"
}
```

### Geração do Token:

```javascript
const token = jwt.sign(
  {
    aprovacao_id: aprovacao.id,
    funcionario_id: aprovacao.funcionario_id,
    supervisor_id: aprovacao.supervisor_id,
    exp: Math.floor(Date.now() / 1000) + (48 * 60 * 60), // 48 horas
    jti: uuidv4(),
    type: 'approval_token'
  },
  process.env.JWT_SECRET,
  { algorithm: 'HS256' }
);
```

### Validação do Token:

```javascript
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Validar tipo
  if (decoded.type !== 'approval_token') {
    throw new Error('Token inválido');
  }
  
  // Validar expiração (jwt.verify já faz isso)
  // Validar se aprovação ainda existe e está pendente
  
  return { valid: true, data: decoded };
} catch (error) {
  return { valid: false, error: error.message };
}
```

---

## 📱 ESPECIFICAÇÃO DO SERVIÇO WHATSAPP

### Interface do Serviço:

```javascript
// backend-api/src/services/whatsapp-service.js

class WhatsAppService {
  /**
   * Envia mensagem de aprovação via WhatsApp
   * @param {Object} options
   * @param {string} options.telefone - Telefone do destinatário (formato: +5511999999999)
   * @param {Object} options.aprovacao - Dados da aprovação
   * @param {string} options.token - Token de aprovação
   * @returns {Promise<Object>} Resultado do envio
   */
  async enviarMensagemAprovacao({ telefone, aprovacao, token }) {
    // Implementação
  }
  
  /**
   * Envia lembrete de aprovação pendente
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async enviarLembrete({ telefone, aprovacao, token, diasRestantes }) {
    // Implementação
  }
  
  /**
   * Formata mensagem de aprovação
   * @param {Object} aprovacao
   * @param {string} token
   * @returns {string} Mensagem formatada
   */
  formatarMensagemAprovacao(aprovacao, token) {
    // Template da mensagem
  }
}
```

### Template de Mensagem:

```
*🔔 Nova Solicitação de Aprovação*

👤 *Funcionário:* {FUNCIONARIO_NOME}
🏗️ *Obra:* {OBRA_NOME}
📅 *Data:* {DATA_TRABALHO}
⏰ *Horas Extras:* {HORAS_EXTRAS}h
⏳ *Prazo:* {DIAS_RESTANTES} dias

Aprovar ou Rejeitar diretamente:

✅ Aprovar: {LINK_APROVAR}
❌ Rejeitar: {LINK_REJEITAR}

Ou acesse: {LINK_COMPLETO}

Este link expira em 48 horas.
```

### Integração com Evolution API:

```javascript
// Exemplo usando Evolution API
const response = await axios.post(
  `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
  {
    number: telefone, // +5511999999999
    text: mensagemFormatada,
    options: {
      delay: 1200,
      presence: 'composing'
    }
  },
  {
    headers: {
      'apikey': EVOLUTION_API_KEY
    }
  }
);
```

### Integração com Twilio:

```javascript
// Exemplo usando Twilio
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

const message = await client.messages.create({
  from: 'whatsapp:+14155238886', // Número Twilio
  to: `whatsapp:${telefone}`,
  body: mensagemFormatada
});
```

---

## 🗄️ ESTRUTURA COMPLETA DO BANCO

### Migration SQL Completa:

```sql
-- Tabela de logs de envio WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id SERIAL PRIMARY KEY,
  aprovacao_id INTEGER NOT NULL REFERENCES aprovacoes_horas_extras(id) ON DELETE CASCADE,
  tipo_envio VARCHAR(50) NOT NULL CHECK (tipo_envio IN ('nova_aprovacao', 'lembrete', 'resultado')),
  destinatario_telefone VARCHAR(20) NOT NULL,
  destinatario_nome VARCHAR(255),
  mensagem TEXT,
  status_envio VARCHAR(20) NOT NULL DEFAULT 'pendente' 
    CHECK (status_envio IN ('pendente', 'enviado', 'entregue', 'lido', 'falha')),
  token_aprovacao VARCHAR(255) UNIQUE,
  data_envio TIMESTAMP,
  data_entrega TIMESTAMP,
  data_leitura TIMESTAMP,
  erro_detalhes TEXT,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_whatsapp_logs_aprovacao ON whatsapp_logs(aprovacao_id);
CREATE INDEX idx_whatsapp_logs_token ON whatsapp_logs(token_aprovacao);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_logs(status_envio);
CREATE INDEX idx_whatsapp_logs_data_envio ON whatsapp_logs(data_envio);

-- Tabela de histórico de ações
CREATE TABLE IF NOT EXISTS aprovacoes_whatsapp_hist (
  id SERIAL PRIMARY KEY,
  aprovacao_id INTEGER NOT NULL REFERENCES aprovacoes_horas_extras(id) ON DELETE CASCADE,
  log_id INTEGER REFERENCES whatsapp_logs(id) ON DELETE SET NULL,
  token VARCHAR(255) NOT NULL,
  acao VARCHAR(50) NOT NULL CHECK (acao IN ('link_aberto', 'aprovar', 'rejeitar', 'token_invalido', 'token_expirado')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  observacoes TEXT,
  data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_aprovacoes_whatsapp_hist_aprovacao ON aprovacoes_whatsapp_hist(aprovacao_id);
CREATE INDEX idx_aprovacoes_whatsapp_hist_token ON aprovacoes_whatsapp_hist(token);
CREATE INDEX idx_aprovacoes_whatsapp_hist_acao ON aprovacoes_whatsapp_hist(acao);
CREATE INDEX idx_aprovacoes_whatsapp_hist_data ON aprovacoes_whatsapp_hist(data_acao);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_logs_updated_at
  BEFORE UPDATE ON whatsapp_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_logs_updated_at();

-- Adicionar coluna telefone_whatsapp em funcionarios (se não existir)
ALTER TABLE funcionarios 
ADD COLUMN IF NOT EXISTS telefone_whatsapp VARCHAR(20);

-- Comentários
COMMENT ON TABLE whatsapp_logs IS 'Logs de envio de mensagens WhatsApp para aprovações';
COMMENT ON TABLE aprovacoes_whatsapp_hist IS 'Histórico de ações realizadas via links WhatsApp';
```

---

## ⚙️ CONFIGURAÇÕES NECESSÁRIAS

### Variáveis de Ambiente (.env):

```env
# WhatsApp API
WHATSAPP_API_TYPE=evolution  # ou 'twilio' ou 'business'
WHATSAPP_API_URL=https://api.evolution.com
WHATSAPP_API_KEY=sua_api_key
WHATSAPP_INSTANCE_NAME=nome_da_instancia

# Ou para Twilio
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Configurações de Tokens
APPROVAL_TOKEN_EXPIRY_HOURS=48
APPROVAL_TOKEN_SECRET=use_jwt_secret_do_sistema

# Configurações de Lembretes
LEMBRETE_INTERVALO_HORAS=24  # Reenviar após 24h
LEMBRETE_MAX_TENTATIVAS=3    # Máximo 3 lembretes

# URLs
APP_BASE_URL=https://app.seudominio.com
WHATSAPP_APPROVAL_URL=${APP_BASE_URL}/aprovacao
```

---

## 🧪 CASOS DE TESTE

### Testes de Unidade:

```javascript
describe('WhatsApp Service', () => {
  test('deve formatar mensagem corretamente', () => {
    // Teste
  });
  
  test('deve enviar mensagem via API', async () => {
    // Teste
  });
  
  test('deve tratar erro de envio', async () => {
    // Teste
  });
});

describe('Token Service', () => {
  test('deve gerar token válido', () => {
    // Teste
  });
  
  test('deve validar token expirado', () => {
    // Teste
  });
  
  test('deve rejeitar token inválido', () => {
    // Teste
  });
});
```

### Testes de Integração:

```javascript
describe('Fluxo Completo WhatsApp', () => {
  test('criar aprovação → enviar WhatsApp → aprovar via link', async () => {
    // 1. Criar aprovação
    // 2. Verificar envio WhatsApp
    // 3. Validar token gerado
    // 4. Aprovar via link
    // 5. Verificar atualização no banco
  });
});
```

---

## 📊 MONITORAMENTO E MÉTRICAS

### Métricas a Implementar:

1. **Taxa de Envio:**
   - Total de mensagens enviadas
   - Taxa de sucesso/falha

2. **Taxa de Aprovação:**
   - % de aprovações via WhatsApp vs sistema
   - Tempo médio de resposta

3. **Uso de Tokens:**
   - Tokens gerados
   - Tokens utilizados
   - Tokens expirados

4. **Performance:**
   - Tempo de envio de mensagem
   - Tempo de resposta da página pública

---

**Documento preparado em:** 31/10/2025  
**Versão:** 1.0


