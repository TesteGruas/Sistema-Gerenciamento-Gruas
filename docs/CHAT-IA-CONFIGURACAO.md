# 🤖 Configuração do Chat de IA

Este documento explica como configurar o chat de IA assistente virtual do sistema.

## 📋 Visão Geral

O sistema possui um chat de IA integrado que ajuda os usuários com:
- Dúvidas sobre como usar o sistema
- Informações sobre funcionalidades
- Orientações gerais sobre os módulos

## 🔧 Solução Utilizada

Utilizamos a **Google Gemini API** (modelo `gemini-1.5-flash`) por ser:
- ✅ **100% Gratuita** (tier gratuito generoso)
- ✅ **60 requisições/minuto**
- ✅ **1.500 requisições/dia**
- ✅ **Sem necessidade de cartão de crédito** inicialmente
- ✅ **Fácil integração**

## 🚀 Como Configurar

### Passo 1: Obter a Chave da API

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### Passo 2: Configurar no Backend

1. Abra o arquivo `.env` na pasta `backend-api/`
2. Adicione a variável:

```bash
GOOGLE_GEMINI_API_KEY=sua_chave_aqui
```

3. Reinicie o servidor backend:

```bash
cd backend-api
npm run dev
```

### Passo 3: Instalar Dependência

A dependência já está no `package.json`, mas se necessário:

```bash
cd backend-api
npm install @google/generative-ai
```

## 📱 Como Usar no Frontend

### Opção 1: Botão Flutuante (Recomendado)

Adicione o componente em qualquer página ou layout:

```tsx
import { ChatIa } from "@/components/chat-ia"

export default function MinhaPage() {
  return (
    <div>
      {/* Seu conteúdo */}
      <ChatIa floating={true} />
    </div>
  )
}
```

### Opção 2: Componente Inline

Para usar dentro de uma página específica:

```tsx
import { ChatIa } from "@/components/chat-ia"

export default function SuportePage() {
  return (
    <div>
      <h1>Central de Ajuda</h1>
      <ChatIa floating={false} />
    </div>
  )
}
```

## 🔌 API Endpoints

### POST `/api/chat-ia`

Envia uma mensagem para o assistente.

**Request:**
```json
{
  "message": "Como cadastrar uma nova obra?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Olá"
    },
    {
      "role": "assistant",
      "content": "Olá! Como posso ajudar?"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Para cadastrar uma nova obra...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET `/api/chat-ia/health`

Verifica se o serviço está disponível.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "configured": true
  }
}
```

## 💰 Limites do Tier Gratuito

- **60 requisições por minuto**
- **1.500 requisições por dia**
- **Sem custo** até esses limites

Se precisar de mais, você pode:
- Aguardar o reset diário
- Fazer upgrade para um plano pago (se necessário)
- Implementar cache para respostas frequentes

## 🛠️ Personalização

### Modificar o Prompt do Sistema

Edite o arquivo `backend-api/src/routes/chat-ia.js`:

```javascript
const SYSTEM_PROMPT = `Seu prompt personalizado aqui...`
```

### Alterar o Modelo

No arquivo `backend-api/src/routes/chat-ia.js`:

```javascript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro' // ou outro modelo disponível
});
```

## 🔒 Segurança

- ✅ Todas as requisições requerem autenticação (JWT)
- ✅ Validação de entrada com Joi
- ✅ Limite de tamanho de mensagem (2000 caracteres)
- ✅ Tratamento de erros robusto
- ✅ API key armazenada apenas no servidor (nunca exposta ao frontend)

## 🐛 Troubleshooting

### Erro: "Serviço de IA não configurado"

- Verifique se `GOOGLE_GEMINI_API_KEY` está no `.env`
- Reinicie o servidor backend
- Verifique os logs do servidor

### Erro: "Limite de requisições excedido"

- Aguarde alguns minutos
- Verifique seu uso no Google Cloud Console
- Considere implementar cache

### Erro: "Chave de API inválida"

- Verifique se a chave está correta
- Gere uma nova chave se necessário
- Verifique se a chave não expirou

## 📚 Recursos Adicionais

- [Documentação Google Gemini](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Limites e Quotas](https://ai.google.dev/pricing)

## ✅ Checklist de Configuração

- [ ] Chave da API obtida
- [ ] Variável `GOOGLE_GEMINI_API_KEY` configurada no `.env`
- [ ] Dependência `@google/generative-ai` instalada
- [ ] Servidor backend reiniciado
- [ ] Componente `ChatIa` adicionado ao frontend
- [ ] Teste realizado com sucesso

## 🎉 Pronto!

Agora seu sistema tem um assistente virtual que pode ajudar os usuários 24/7!

