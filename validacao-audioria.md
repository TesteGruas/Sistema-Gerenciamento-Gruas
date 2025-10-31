# Validação de Auditoria Técnica — 30/10/2025

- Escopo: Projeto completo, incluindo `app/`, `components/`, `hooks/`, `lib/`, integrações com backend e presença de mocks/simulações/fallbacks.
- Objetivo: Mapear pontos mockados/simulados, verificar integrações, listar ações objetivas para Frontend e Backend, sem firulas.

---

## Resumo por Módulo

| Módulo | Status | Mock | Integração | Observação |
|--------|--------|------|------------|------------|
| Financeiro | OK | 0% | 100% | Pronto p/ produção, melhorias opcionais (grua_id) |
| Autenticação | Parcial | 10% | 90% | `getCurrentUser()` mockado em dev |
| Assinatura Digital | Parcial | 20% | 80% | PWA ok, dashboard tem simulações |
| Aprovações Horas Extras | Parcial | 60% | 40% | Massa/detalhes pendentes |
| Notificações | Parcial | 50% | 50% | Componentes ainda mockados |
| Ponto Eletrônico | Parcial | 40% | 60% | Fallbacks e hardcodes |
| Obras/Gruas | Parcial | 60% | 40% | Diversas páginas com `mock-data` |
| RH | Parcial | 15% | 85% | Simulações em várias páginas |

---

## Achados (mocks/simulações/fallbacks) — principais

- `app/teste-aprovacoes/page.tsx`: `mockAprovacoes`, `mockNotificacoes` (página de teste)
- `app/dashboard/obras/page.tsx`: uso de `mockClientes`, `mockGruas`, `mockCustosMensais` e comentários "ainda usando mock"
- `app/dashboard/obras/[id]/page.tsx`: "Fallback para função mockada"
- `app/dashboard/gruas-new/page.tsx`: `mockGruas`, `mockObras`, `mockUsers` (listagens/contadores)
- `app/dashboard/assinatura/page.tsx`: `mockObras`, `mockUsers` e vários "Simular ... (DocuSign, links)"; fallback para mocks
- `components/user-dropdown.tsx`: dados mock para dev
- `app/navegacao-teste/page.tsx`: página demonstrativa com dados mockados
- `app/dashboard/ponto/aprovacoes/page.tsx`: comentário "Mock" em métrica
- `components/espelho-ponto-dialog.tsx`: fallback para dados mockados no catch
- `lib/api-alugueis-residencias.ts`: API mock inteira (não core)
- `components/admin-guard.tsx`: verificação admin mock/simulação
- `app/pwa/notificacoes/page.tsx`: mock de notificações locais
- `app/dashboard/usuarios/[id]/page.tsx`: `mockUsuario`
- `app/dashboard/financeiro/vendas/page.tsx`: fallback para mock em trecho
- RH completo (várias páginas): "Simular ..." (registro de ponto, cálculo horas, pagamentos, relatórios, alocação/transferência, etc.)

TODOs notáveis:
- `app/dashboard/relatorios/page.tsx`: TODO carregar obras do backend

---

## Integrações Backend — status objetivo

- Notificações: Endpoints completos existem (listar, não lidas, contar, marcar lida, marcar todas). Frontend ainda usa mocks em PWA e fallbacks silenciosos na lib.
- Ponto Eletrônico / Horas Extras: Endpoints de listagem e aprovação individual/massa existem. Páginas de massa/detalhes não integradas.
- Obras/Gruas: Endpoints padrão existem (obras, gruas). Frontend mantém `mock-data` e fallbacks.
- Autenticação: Precisa endpoint `GET /api/auth/me` (ou equivalente) se ainda não exposto. Front substituir mock.
- Financeiro: Integrado; melhorias opcionais para `receitas`/`custos` relacionarem `grua_id` (para análises por grua).

---

## Ações por Módulo (FE/BE)

### 1) Aprovações de Horas Extras
- Frontend:
  - `app/pwa/aprovacao-massa/page.tsx`: remover `mockAprovacoes`; integrar `POST /api/ponto-eletronico/horas-extras/aprovar-lote` e `.../rejeitar-lote`; tratar loading/erros; usar usuário corrente.
  - `app/pwa/aprovacao-detalhes/page.tsx`: buscar registro via API; exibir histórico se existir; remover mocks.
  - `components/card-aprovacao-horas-extras.tsx`: extrair utilitários para `lib/utils-aprovacoes.ts`; matar dependência de mock.
  - `lib/geolocation-validator.ts`: substituir `obrasMock` por `GET /api/obras`.
- Backend: sem pendências (endpoints existentes). Validar autorização/perfis.

### 2) Notificações
- Frontend:
  - `components/pwa-notifications.tsx`: substituir `mockNotifications` por `NotificacoesAPI.listar()` ou `useNotificacoes`; loading/erro/refresh.
  - `lib/api-notificacoes.ts`: remover fallbacks silenciosos; não retornar mocks em catch; propagar erro.
  - `hooks/useNotificacoes.ts`: implementar `PATCH /api/notificacoes/marcar-todas-lidas` e remover TODO.
- Backend: endpoints OK. Confirmar paginação/filtros de acordo com UI.

### 3) Ponto Eletrônico
- Frontend:
  - `lib/api-ponto-eletronico.ts`: remover arrays de mocks e todos os catch que retornam mocks; remover `isAdmin = true`; tratar erro corretamente.
  - `app/pwa/ponto/page.tsx`: remover `obrasMock[0]`; buscar obras via API; cobrir caso sem obras.
  - `app/dashboard/ponto/page.tsx`: remover `usuarioId` hardcoded; usar usuário autenticado.
- Backend: validar filtros por funcionário/obra; garantir erros claros (4xx/5xx) para UI.

### 4) Obras e Gruas
- Frontend:
  - `app/dashboard/obras/page.tsx`: remover import/uso de `mock-data`; usar `obrasApi.listarObras()`; sem fallback para mock; loading/erro na UI.
  - `app/dashboard/obras/[id]/page.tsx`: trocar utilitários mockados por chamadas reais (`GET /api/obras/:id`, documentos, custos).
  - `app/dashboard/gruas/page.tsx` e `dashboard/gruas-new/page.tsx`: remover `mock-data`; usar `gruasApi`.
  - Substituir utilitários mockados por endpoints reais (funcionários por obra, custos, documentos, etc.).
- Backend:
  - Confirmar existência de endpoints auxiliares (documentos por obra, custos mensais por obra). Criar se faltarem.

### 5) Assinatura Digital
- Frontend:
  - `dashboard/assinatura/page.tsx` e `[id]/page.tsx`: remover simulações (DocuSign, links, upload); integrar endpoints reais; sem fallback para mocks.
- Backend:
  - Se DocuSign: expor endpoints de criação de envelope/callback. Caso contrário: `POST /api/documentos/:id/assinar` e upload de arquivo assinado.

### 6) Autenticação
- Frontend:
  - `app/lib/auth.ts`: remover mock de `getCurrentUser()`; usar `GET /api/auth/me`.
  - `components/user-dropdown.tsx` e `lib/user-context.tsx`: remover dados mock; usar usuário real.
- Backend:
  - Expor `GET /api/auth/me` (JWT) se não existir; retornar id, name, email, role, avatar.

### 7) RH
- Frontend: remover "Simular ..." nas páginas de ponto, horas, pagamentos, relatórios, obras; integrar com endpoints reais ao ficarem disponíveis.
- Backend: criar endpoints de benefícios, férias, relatórios de RH, alocação/transferência.

### 8) Financeiro e Gruas (melhorias)
- Backend (opcional, mas recomendado):
  - `ALTER TABLE receitas ADD COLUMN grua_id INT REFERENCES gruas(id)`; criar automaticamente em finalização de medição.
  - `ALTER TABLE custos ADD COLUMN grua_id INT REFERENCES gruas(id)`; criar automaticamente em manutenção.
  - Ajustar consultas de rentabilidade para filtrar por `grua_id`/`obra_id`.
- Frontend: sem pendências funcionais.

---

## Páginas do app/ — verificação de integração

- Páginas PWA integradas: `pwa/aprovacoes`, `pwa/aprovacao-assinatura` (ok)
- Páginas PWA pendentes: `pwa/aprovacao-massa`, `pwa/aprovacao-detalhes`, `pwa/notificacoes` (mock), `pwa/ponto` (obra via mock), `pwa/gerenciar-funcionarios` (simular busca), `pwa/configuracoes` (simular sync)
- Páginas Dashboard com mocks/simulações: `dashboard/obras`, `dashboard/obras/[id]`, `dashboard/gruas-new`, `dashboard/assinatura`, `dashboard/assinatura/[id]`, `dashboard/ponto` (hardcodes), RH completo (diversas), alguns pontos em `financeiro` (trechos isolados)
- Páginas de teste/demonstração: `teste-aprovacoes`, `navegacao-teste` (mantêm mocks por propósito)

---

## Limpeza de Código (curto prazo)

- Deprecar (referência até migração concluir): `lib/mock-data.ts`, `lib/mock-data-aprovacoes.ts`
- Remover mocks e fallbacks:
  - `lib/api-ponto-eletronico.ts`, `lib/api-notificacoes.ts`, `lib/geolocation-validator.ts`
  - `components/pwa-notifications.tsx`, `components/espelho-ponto-dialog.tsx`, `components/admin-guard.tsx`
- Atualizar utilidades: criar `lib/utils-aprovacoes.ts` e mover formatações do cartão de aprovações

---

## Regras de Implementação

- Não usar fallback silencioso para mock em produção. Em erro de API: exibir estado/erro e permitir retry.
- Todas as chamadas devem validar autenticação/autorização (JWT/claims/permissões).
- Sem hardcodes de `usuarioId` ou `isAdmin`. Usar contexto do usuário atual.
- Páginas devem ter estados: loading, empty, error.
- Após integrar, remover imports mortos e comentários de simulação.

---

## Prioridades (execução)

1. Notificações (FE): integrar PWA + remover fallbacks na lib; usar `marcar-todas-lidas`.
2. Aprovações (FE): massa e detalhes; utilitários do cartão; geolocalização sem mock.
3. Ponto Eletrônico (FE): matar mocks da `api`, hardcodes e obra mock.
4. Obras/Gruas (FE): remover `mock-data` e fallbacks; conectar páginas às APIs.
5. Autenticação (FE/BE): `GET /api/auth/me` e retirar mocks de usuário.
6. Assinatura (FE/BE): remover simulações; integrar upload/assinatura.
7. RH (BE/FE): criar endpoints pendentes e remover simulações.
8. Financeiro (BE): melhorias com `grua_id` (opcional, recomendado).

---

## Checklist por Equipe (Consolidado)

- Frontend (foco imediato):
  - Integrar `components/pwa-notifications.tsx` e remover fallbacks de `lib/api-notificacoes.ts`.
  - Concluir `pwa/aprovacao-massa` e `pwa/aprovacao-detalhes` com APIs reais.
  - Remover mocks de `lib/api-ponto-eletronico.ts` e hardcodes em páginas de ponto.
  - Remover `mock-data` em `obras` e `gruas`; consumir APIs (`obrasApi`, `gruasApi`).
  - Remover simulações em `dashboard/assinatura`; integrar upload/assinatura real.
  - Substituir `getCurrentUser()` mock por chamada real e ajustar `user-dropdown`/context.
  - Criar `lib/utils-aprovacoes.ts` e mover utilidades do cartão.
  - Remover páginas/trechos de simulação ou isolar como demo.

- Backend (foco imediato e melhorias):
  - Expor/confirmar `GET /api/auth/me` (JWT) se não existir.
  - Confirmar/ajustar endpoints auxiliares: documentos por obra, custos mensais por obra.
  - Melhorias recomendadas (financeiro): adicionar `grua_id` em `receitas` e `custos` e ajustar consultas de rentabilidade.
  - Garantir respostas com códigos corretos e mensagens claras (evitar incentivar fallbacks a mocks no FE).

---

Última atualização: 30/10/2025
