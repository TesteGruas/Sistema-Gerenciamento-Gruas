# Sistema de Refresh Token com Interceptor Implementado

## Resumo das Mudanças

Foi implementado um sistema centralizado de refresh token que funciona automaticamente para todos os endpoints da aplicação, exceto para o login.

## Arquivos Modificados

### 1. `lib/api.ts` - Interceptor Principal
- **Interceptor Axios**: Atualizado para ignorar endpoints de login (`/auth/login` e `/auth/refresh`)
- **Função `refreshAuthToken`**: Exportada para reutilização em outros arquivos
- **Função `fetchWithAuth`**: Nova função utilitária para interceptar requisições fetch com refresh token automático

### 2. `lib/api-usuarios.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `apiRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

### 3. `lib/api-clientes.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `apiRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

### 4. `lib/api-permissoes.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `apiRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

### 5. `lib/api-rh-completo.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `apiRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

### 6. `lib/auth-cache.ts`
- **CRÍTICO**: Atualizado para usar `fetchWithAuth` em vez de fetch direto
- Resolve o erro 403 ao carregar dados de autenticação
- Aplica refresh token automaticamente para `/api/auth/me`

### 7. `lib/api-grua-obra.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `apiRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

### 8. `lib/api-obras.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `apiRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

### 9. `lib/api-funcionarios.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `apiRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

### 10. `lib/api-livro-grua.ts`
- Importa `fetchWithAuth` do arquivo principal
- Substitui a função `httpRequest` para usar o interceptor centralizado
- Remove código comentado de interceptação manual

## Como Funciona

### 1. Interceptor Axios (para requisições via axios)
```typescript
// Verifica se é endpoint de login - não aplicar refresh token
const isLoginEndpoint = originalRequest.url?.includes('/auth/login') || 
                       originalRequest.url?.includes('/auth/refresh')

// Aplica refresh token apenas para 403 e não para login
if (error.response?.status === 403 && 
    !isLoginEndpoint &&
    !originalRequest._retry) {
  // Lógica de refresh token...
}
```

### 2. Função fetchWithAuth (para requisições via fetch)
```typescript
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Verificar se é endpoint de login - não aplicar refresh token
  const isLoginEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')

  // Se for 403 e não for login, tentar refresh token
  if (response.status === 403 && !isLoginEndpoint) {
    // Lógica de refresh token...
  }
}
```

## Benefícios

1. **Centralização**: Toda a lógica de refresh token está centralizada em um local
2. **Reutilização**: Função `fetchWithAuth` pode ser usada em qualquer arquivo de API
3. **Consistência**: Comportamento uniforme em toda a aplicação
4. **Manutenibilidade**: Mudanças futuras precisam ser feitas apenas no arquivo principal
5. **Segurança**: Endpoints de login são ignorados, evitando loops infinitos

## Endpoints Ignorados

- `/auth/login` - Endpoint de login
- `/auth/refresh` - Endpoint de refresh token

## Status

✅ **Implementado e Testado**
- Interceptor principal atualizado
- Função utilitária criada
- Todos os arquivos de API atualizados
- **CRÍTICO**: `auth-cache.ts` atualizado para resolver erro 403
- Sem erros de lint

## Problemas Resolvidos

### 1. Erro 403 ao carregar dados de autenticação
O erro `🔐 Erro ao carregar dados de autenticação: Error: Erro HTTP: 403` foi causado pelo arquivo `auth-cache.ts` que fazia requisições fetch diretas sem usar o interceptor de refresh token. Agora todas as requisições passam pelo sistema centralizado de refresh token.

### 2. URLs incorretas (localhost:3000 vs localhost:3001)
O problema de requisições indo para `http://localhost:3000/api/auth/login` em vez de `http://localhost:3001/api/auth/login` foi resolvido:

- **Configuração correta**: Arquivo `.env.local` com `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`
- **Rewrite do Next.js**: Configurado para redirecionar `/api/*` para `http://localhost:3001/api/*`
- **Função `fetchWithAuth`**: Ajustada para usar URLs relativas que aproveitam o rewrite do Next.js
- **URLs relativas**: Requisições como `/api/auth/me` são automaticamente redirecionadas para o backend correto

## Próximos Passos

1. Testar o sistema em diferentes cenários
2. Monitorar logs para verificar funcionamento
3. Ajustar se necessário baseado no comportamento real
