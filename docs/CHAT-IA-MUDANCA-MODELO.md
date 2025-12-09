# 🔄 Mudança de Modelo: gemini-2.0-flash-exp → gemini-2.5-flash-lite

## 🎯 Problema Identificado

O sistema estava usando o modelo `gemini-2.0-flash-exp` que tem **quota 0 no tier gratuito**, causando erro 429 em todas as requisições:

```
Quota exceeded ... free_tier ... limit: 0, model: gemini-2.0-flash-exp
```

## ✅ Solução Implementada

### Mudança de Modelo Padrão

**Antes:**
- Modelo padrão: `gemini-2.5-flash` (5 RPM)
- Fallback incluía: `gemini-2.0-flash-exp` (quota 0 ❌)

**Agora:**
- **Modelo padrão: `gemini-2.5-flash-lite`** ⭐ (10 RPM, ideal para chat)
- Fallbacks: `gemini-2.5-flash` (modelos 1.5 foram descontinuados)
- **Removido completamente:** `gemini-2.0-flash-exp`

## 📊 Comparação de Modelos

| Modelo | RPM | RPD | Status | Uso Recomendado |
|--------|-----|-----|--------|-----------------|
| `gemini-2.5-flash-lite` | **10** | **20** | ✅ **PADRÃO** | Chat/FAQ (respostas rápidas) |
| `gemini-2.5-flash` | 5 | 20 | ✅ Disponível | Contexto maior |
| `gemini-2.0-flash-exp` | **0** | **0** | ❌ **REMOVIDO** | NÃO USE (quota 0) |
| `gemini-1.5-pro` | - | - | ❌ **REMOVIDO** | NÃO USE (descontinuado) |
| `gemini-1.5-flash` | - | - | ❌ **REMOVIDO** | NÃO USE (descontinuado) |

## 🔧 Mudanças no Código

### 1. Modelo Padrão Atualizado

```javascript
// Antes
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Agora
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
```

### 2. Lista de Fallbacks Atualizada

```javascript
const modelsToTry = [
  modelName,                    // Modelo escolhido pelo usuário
  'gemini-2.5-flash-lite',     // ⭐ Padrão (10 RPM)
  'gemini-2.5-flash',           // Completo (5 RPM)
  // Modelos 1.5 REMOVIDOS (descontinuados na API v1beta)
  // gemini-2.0-flash-exp REMOVIDO (quota 0)
];
```

### 3. Logging Melhorado

Agora o sistema loga:
- ✅ Modelo usado com sucesso
- ❌ Erros de quota com detalhes (usuário, modelo, retry time)
- ⚠️ Alertas quando modelo tem quota 0

## 📝 Configuração

### No arquivo `.env` do backend:

```bash
# Modelo padrão recomendado (10 RPM, ideal para chat)
GEMINI_MODEL=gemini-2.5-flash-lite

# Alternativa (se necessário):
# GEMINI_MODEL=gemini-2.5-flash      # Para contexto maior (5 RPM)
```

**⚠️ IMPORTANTE:** Não configure `gemini-2.0-flash-exp` - ele tem quota 0!

## 🚀 Benefícios

1. **Mais Requisições/Minuto**: 10 RPM vs 5 RPM (dobro!)
2. **Quota Disponível**: Modelo tem quota no tier gratuito
3. **Ideal para Chat**: Modelo leve e rápido, perfeito para FAQ/suporte
4. **Sem Erros 429**: Não usa mais modelo com quota 0

## 📊 Monitoramento

O sistema agora loga informações úteis:

```
✅ [Chat IA] Modelo gemini-2.5-flash-lite usado com sucesso para usuário 123
📊 [Chat IA] Modelo: gemini-2.5-flash-lite
📊 [Chat IA] Retry após: 55 segundos
💡 [Chat IA] Ação recomendada: Verificar uso em https://ai.dev/usage?tab=rate-limit
```

## 🔍 Verificação

Para verificar qual modelo está sendo usado:

1. **No código**: Verifique o log do servidor ao fazer uma requisição
2. **Na resposta**: O campo `model` na resposta indica qual foi usado
3. **No dashboard**: https://ai.dev/usage?tab=rate-limit

## 📚 Referências

- [Documentação Gemini API](https://ai.google.dev/gemini-api/docs)
- [Rate Limits do Gemini](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google AI Studio](https://aistudio.google.com/)
