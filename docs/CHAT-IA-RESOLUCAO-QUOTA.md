# 🔧 Resolução de Erro de Quota Excedida - Chat IA

## 📋 Problema

O sistema estava recebendo erros de quota excedida da API do Google Gemini:

```json
{
  "success": false,
  "error": "Limite de requisições excedido. Tente novamente mais tarde.",
  "details": "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [429 Too Many Requests] You exceeded your current quota..."
}
```

## ✅ Soluções Implementadas

### 1. **Retry Automático com Backoff Exponencial**

O sistema agora tenta automaticamente novamente quando recebe erros de quota:
- Extrai o tempo de retry sugerido pela API (ex: 55 segundos)
- Aguarda o tempo necessário antes de tentar novamente
- Usa backoff exponencial para outros erros temporários

### 2. **Rate Limiting no Servidor**

Implementado rate limiting para evitar exceder os limites da API:
- **Limite**: 50 requisições por minuto por usuário
- **Janela**: 1 minuto
- **Margem de segurança**: Deixa espaço para o limite de 60/min da API do Gemini

### 3. **Troca para Modelo com Quota Disponível**

O modelo `gemini-2.0-flash-exp` foi **removido completamente** porque:
- **Tem quota 0 no tier gratuito** → qualquer requisição retorna erro 429
- É experimental e pode ter instabilidade

**Agora usamos `gemini-2.5-flash-lite` como padrão:**
- ✅ **10 requisições/minuto** (vs 5 do 2.5-flash)
- ✅ **20 requisições/dia** no tier gratuito
- ✅ Ideal para chat/FAQ (respostas rápidas e objetivas)

### 4. **Melhor Tratamento de Erros**

- Mensagens mais claras para o usuário
- Informação sobre quando tentar novamente (quando disponível)
- Dicas úteis em modo de desenvolvimento

## 🚀 Como Funciona Agora

### Fluxo de Requisição

1. **Verificação de Rate Limit**: O servidor verifica se o usuário não excedeu 50 requisições/minuto
2. **Tentativa com Retry**: Para cada modelo, o sistema tenta até 3 vezes (1 inicial + 2 retries)
3. **Extração de Retry Time**: Se a API sugerir um tempo de espera, o sistema aguarda esse tempo
4. **Fallback de Modelos**: Se um modelo falhar, tenta o próximo na lista

### Modelos Disponíveis na API v1beta (2025)

1. **`gemini-2.5-flash-lite`** ⭐ **PADRÃO** - Modelo leve (10 RPM, ideal para chat/FAQ)
2. `gemini-2.5-flash` - Modelo completo (5 RPM, para contexto maior)

**⚠️ NÃO USE:**
- `gemini-2.0-flash-exp` - Quota 0 no tier gratuito
- `gemini-1.5-pro` - Não disponível na API v1beta (descontinuado)
- `gemini-1.5-flash` - Pode estar descontinuado

## 📊 Limites do Tier Gratuito do Gemini (por modelo)

### Modelos com Quota Disponível:

| Modelo | RPM (req/min) | RPD (req/dia) | Status | Recomendação |
|--------|---------------|---------------|--------|--------------|
| `gemini-2.5-flash-lite` | **10** | **20** | ✅ Disponível | ⭐ **Ideal para chat/FAQ** |
| `gemini-2.5-flash` | 5 | 20 | ✅ Disponível | Para contexto maior |

### Modelos NÃO Disponíveis (NÃO USE):
- ❌ `gemini-2.0-flash-exp` - **Quota 0** (sempre retorna 429)
- ❌ `gemini-1.5-pro` - **Descontinuado** (não disponível na API v1beta)
- ❌ `gemini-1.5-flash` - **Pode estar descontinuado**

## 💡 Recomendações

### Para Uso Normal

O sistema agora gerencia automaticamente os limites. Se ainda receber erros:

1. **Aguarde alguns minutos** antes de tentar novamente
2. **Verifique seu uso** em: https://ai.dev/usage?tab=rate-limit
3. **Use o modelo recomendado**: Configure `GEMINI_MODEL=gemini-2.5-flash-lite` no `.env`

### Para Uso Intensivo

Se você precisa de mais requisições:

1. **Considere um plano pago** do Google AI Studio
2. **Use múltiplas chaves de API** (rotação de chaves)
3. **Implemente cache** para respostas frequentes

## 🔧 Configuração Recomendada

No arquivo `.env` do backend:

```bash
# Modelo padrão: gemini-2.5-flash-lite (10 RPM, ideal para chat)
GEMINI_MODEL=gemini-2.5-flash-lite

# Alternativa (se necessário):
# GEMINI_MODEL=gemini-2.5-flash      # Para contexto maior (5 RPM)
```

**⚠️ IMPORTANTE:** Não configure `gemini-2.0-flash-exp` - ele tem quota 0!

## 📝 Exemplo de Resposta de Erro Melhorada

**Antes:**
```json
{
  "success": false,
  "error": "Limite de requisições excedido. Tente novamente mais tarde."
}
```

**Agora:**
```json
{
  "success": false,
  "error": "Limite de requisições excedido. Tente novamente em 55 segundos.",
  "retryAfter": 55
}
```

## 🐛 Troubleshooting

### Erro 429 Persistente

1. Verifique se não há múltiplas instâncias do servidor rodando
2. Verifique se não há outros serviços usando a mesma chave de API
3. Considere aumentar o intervalo entre requisições no frontend

### Rate Limit do Servidor

Se receber erro de rate limit do servidor (não da API):
- Aguarde alguns segundos antes de tentar novamente
- O limite é de 50 requisições/minuto por usuário

### Verificar Uso da API

```bash
# Acesse o dashboard do Google AI Studio
https://ai.dev/usage?tab=rate-limit
```

## 📚 Referências

- [Documentação Gemini API](https://ai.google.dev/gemini-api/docs)
- [Rate Limits do Gemini](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google AI Studio](https://aistudio.google.com/)
