# 🚀 Guia Rápido - Chat de IA

## Como Adicionar o Chat ao Sistema

### Opção 1: Adicionar Globalmente (Recomendado)

Adicione o componente no layout principal para que apareça em todas as páginas:

**`app/pwa/layout.tsx`** ou **`app/layout.tsx`**:

```tsx
import { ChatIa } from "@/components/chat-ia"

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ChatIa floating={true} />
    </>
  )
}
```

### Opção 2: Adicionar em uma Página Específica

**Exemplo: Página de Suporte**

```tsx
import { ChatIa } from "@/components/chat-ia"

export default function SuportePage() {
  return (
    <div className="container mx-auto p-4">
      <h1>Central de Ajuda</h1>
      <ChatIa floating={false} />
    </div>
  )
}
```

### Opção 3: Adicionar na Página Principal PWA

**`app/pwa/page.tsx`**:

```tsx
import { ChatIa } from "@/components/chat-ia"

export default function PWAMainPage() {
  return (
    <div>
      {/* Seu conteúdo existente */}
      
      {/* Chat flutuante */}
      <ChatIa floating={true} />
    </div>
  )
}
```

## 📝 Próximos Passos

1. **Instalar dependência no backend:**
   ```bash
   cd backend-api
   npm install
   ```

2. **Configurar API Key:**
   - Obtenha a chave em: https://makersuite.google.com/app/apikey
   - Adicione no `.env` do backend: `GOOGLE_GEMINI_API_KEY=sua_chave`

3. **Reiniciar o servidor:**
   ```bash
   cd backend-api
   npm run dev
   ```

4. **Testar:**
   - Abra o sistema
   - Clique no botão flutuante de chat (canto inferior direito)
   - Faça uma pergunta!

## ✨ Funcionalidades

- ✅ Chat em tempo real
- ✅ Histórico de conversa
- ✅ Interface responsiva
- ✅ Botão flutuante ou inline
- ✅ Indicador de digitação
- ✅ Tratamento de erros

## 🎯 Exemplos de Perguntas

- "Como cadastrar uma nova obra?"
- "Como funciona o ponto eletrônico?"
- "Onde encontro os documentos de uma grua?"
- "Como aprovar horas extras?"
- "Como gerar um relatório?"












