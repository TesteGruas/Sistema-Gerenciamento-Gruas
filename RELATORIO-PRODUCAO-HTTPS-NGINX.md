# Relatorio de adequacao para producao (HTTPS + Nginx /api)

## Status atual

- Remocao de hardcodes de backend no frontend ativo: **concluida**.
- Fallbacks inseguros `http://localhost:3001`, `http://127.0.0.1:3001`, `ws://localhost:8081`, `72.60.60.118` em `app/components/hooks/lib/next.config/public`: **zerados**.
- Mapeamento dos 404 com evidencia de rota backend: **concluido abaixo**.

## Arquivos alterados (resumo)

Foram ajustados clientes e paginas de `app/`, `components/`, `hooks/`, `lib/`, alem de `next.config.mjs`, `public/sw.js`, `env.example` e criacao de `lib/runtime-config.ts`.

Arquivos-chave de arquitetura:
- `lib/runtime-config.ts` (novo)
- `lib/api.ts`
- `next.config.mjs`
- `hooks/use-websocket-notifications.ts`
- `hooks/use-pwa-user.ts`
- `public/sw.js`

## O que foi corrigido

- Centralizacao de runtime para API e websocket:
  - `getApiBasePath()`
  - `getApiOrigin()`
  - `getWebSocketUrl()`
- Padronizacao de chamadas para estrategia segura via proxy `/api` em producao.
- Remocao de dependencias de IP fixo da VPS e localhost em codigo frontend ativo.
- Correcao de pontos PWA (login, diagnostico, ponto, layout) e modulos de dashboard/servicos para nao depender de `http://...` hardcoded.
- Service Worker atualizado para nao depender de host local nas regras de API.
- Mensagens de erro de geolocalizacao melhoradas para cenarios reais de producao.

## Variveis de ambiente canonicas por ambiente

### Desenvolvimento

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Producao

- `NEXT_PUBLIC_API_URL=/api`
- `NEXT_PUBLIC_API_BASE_URL=/api`
- `NEXT_PUBLIC_APP_URL=https://sistemairbana.com.br`

## Inventario automatico de ocorrencias (`http://`, `ws://`, `localhost`) no frontend alvo

Escopo: `app/`, `components/`, `hooks/`, `lib/`, `next.config.mjs`, `public/`.

Ocorrencias encontradas (nao sao fallback de backend em producao):

| Arquivo | Linha | Trecho | Classificacao |
|---|---:|---|---|
| `app/navegacao-teste/page.tsx` | 21 | `window.location.hostname === 'localhost'` | check de ambiente local |
| `app/teste-aprovacoes/page.tsx` | 36 | `window.location.hostname === 'localhost'` | check de ambiente local |
| `components/livro-grua-obra.tsx` | 672 | `startsWith('http://')` | validacao de URL |
| `components/livro-grua-obra.tsx` | 686 | `startsWith('http://')` | validacao de URL |
| `app/dashboard/ponto/page.tsx` | 1443 | `!url.startsWith('http://')` | validacao de URL |
| `app/dashboard/ponto/page.tsx` | 2739 | `xmlns="http://www.w3.org/2000/svg"` | namespace SVG (nao chamada de rede) |
| `public/sw.js` | 30 | `hostname === 'localhost'` | debug/local only |
| `lib/runtime-config.ts` | 46-47 | conversao `http://` para `ws://` | normalizacao tecnica |
| `lib/runtime-config.ts` | 56 | `startsWith("http://")` | normalizacao tecnica |

Resultado: **nenhum fallback ativo para backend inseguro**.

## Mapeamento rigoroso dos 404 (rotas exatas reportadas)

### 1) `GET /api/funcionarios/161`

| Item | Evidencia |
|---|---|
| Chamada no front | `lib/api-funcionarios.ts` usa `buildApiUrl(\`funcionarios/${id}\`)` (ex.: `obterFuncionario`) |
| Rota no backend | `backend-api/src/server.js`: `app.use('/api/funcionarios', funcionariosRoutes)` |
| Definicao da rota | `backend-api/src/routes/funcionarios.js`: `router.get('/:id', ...)` |
| Parametros esperados | `id` numerico inteiro positivo |
| Natureza do 404 | **recurso ausente** (funcionario nao encontrado), nao rota ausente |

### 2) `GET /api/funcionarios-obras?...`

| Item | Evidencia |
|---|---|
| Chamada no front | `lib/api-obras.ts`: `buildApiUrl(\`funcionarios-obras?obra_id=${obraId}\`)` |
| Rota no backend | `backend-api/src/server.js`: `app.use('/api/funcionarios-obras', funcionariosObrasRoutes)` |
| Definicao da rota | `backend-api/src/routes/funcionarios-obras.js`: `router.get('/', ...)` |
| Parametros esperados | query opcional: `obra_id`, `funcionario_id`, `status`, `page`, `limit` |
| Natureza do 404 | em geral **nao deveria ser 404 para query**, salvo proxy/path incorreto; investigar resposta real do backend para esse caso |

### 3) `GET /api/colaboradores/161/certificados`

| Item | Evidencia |
|---|---|
| Chamada no front | `lib/api-colaboradores-documentos.ts`: `buildApiUrl(\`colaboradores/${colaboradorId}/certificados\`)` |
| Rota no backend | `backend-api/src/server.js`: `app.use('/api/colaboradores', colaboradoresDocumentosRoutes)` |
| Definicao da rota | `backend-api/src/routes/colaboradores-documentos.js`: `router.get('/:id/certificados', ...)` |
| Parametros esperados | `id` (funcionario_id) |
| Natureza do 404 | nessa rota especifica, implementacao retorna `200` com lista vazia; se houve 404, indicio principal e path/proxy divergente ou endpoint diferente do esperado no ambiente em execucao |

### 4) `GET /api/colaboradores/161/documentos-admissionais`

| Item | Evidencia |
|---|---|
| Chamada no front | `lib/api-colaboradores-documentos.ts`: `buildApiUrl(\`colaboradores/${colaboradorId}/documentos-admissionais\`)` |
| Rota no backend | `backend-api/src/server.js`: `app.use('/api/colaboradores', colaboradoresDocumentosRoutes)` |
| Definicao da rota | `backend-api/src/routes/colaboradores-documentos.js`: `router.get('/:id/documentos-admissionais', ...)` |
| Parametros esperados | `id` (funcionario_id) |
| Natureza do 404 | nessa rota especifica, implementacao retorna `200` com lista vazia; 404 sugere path/proxy divergente ou backend diferente do codigo analisado |

## Build e validacao tecnica

- `ReadLints`: sem erros nos arquivos alterados.
- `npm run build`: **falhou por erro pre-existente** em `app/dashboard/clientes/page.tsx` (sintaxe com `}` extra).
- Impacto: nao foi possivel concluir validacao de bundle de producao ate corrigir esse arquivo.

## PM2 / deploy

- Nao executei `pm2 restart` neste workspace (nao e o host de runtime de producao).
- Assim que o build estiver verde no servidor:
  1. `npm run build`
  2. `pm2 restart <processo-front>`
  3. hard reload no browser e limpeza de cache do service worker se necessario.

## Checklist de validacao manual (producao)

- [ ] Login PWA e Dashboard sem erro de rede.
- [ ] Console sem `mixed content`.
- [ ] Console sem tentativa de `ws://localhost:8081`.
- [ ] Chamadas `/api/...` funcionando via Nginx proxy.
- [ ] Geolocalizacao com permissoes/timeout/negacao tratados no UI.
- [ ] Google Maps sem dependencia de endpoint HTTP inseguro.
- [ ] `/pwa` sem erro de service worker.
- [ ] `GET /api/chat-ia/health` funcionando via dominio/proxy.
- [ ] Rotas de certificados/documentos retornando dado ou vazio sem quebrar tela.
- [ ] Rotas `funcionarios` e `funcionarios-obras` testadas com IDs reais e evidencias de resposta.
