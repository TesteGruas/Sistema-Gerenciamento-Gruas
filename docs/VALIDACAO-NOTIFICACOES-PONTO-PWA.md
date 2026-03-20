# Validação: notificações ao finalizar o dia (PWA Ponto)

## Comportamento esperado

Quando o funcionário registra a **saída** (fecha o dia) em `/pwa/ponto`, o backend (`POST /api/ponto-eletronico/registros` — create ou update) dispara o fluxo em `notificarResponsaveisObraPontoConcluido` (`backend-api/src/utils/notificacoes-ponto.js`):

| Canal | Descrição |
|--------|-----------|
| **E-mail** | Template HTML para `responsaveis_obra.email` (SMTP configurado em `email_configs`). |
| **WhatsApp** | `enviarMensagemWebhook` com telefone normalizado (`responsaveis_obra.telefone`). |
| **App (in-app)** | Registro em `notificacoes` para `usuario_id` do responsável + `emitirNotificacao` (WebSocket). |
| **Push PWA** | `pwa_push_subscriptions` + Web Push (`enviarPushParaUsuario`). |

Link para assinatura: `/pwa/aprovacao-assinatura?id={registro_id}`.

## Pré-requisitos no banco

1. **Funcionário** com `obra_atual_id` preenchido (ou registro com `obra_id` após migration `20260319_registros_ponto_obra_id.sql`).
2. Tabela **`responsaveis_obra`**: pelo menos um registro `ativo = true` para essa `obra_id`, com:
   - **email** válido (e-mail);
   - **telefone** para WhatsApp (formato com DDD);
   - Opcional: campo **usuario** com o mesmo e-mail do cadastro em **`usuarios`** — necessário para notificação in-app e push (resolve por e-mail).

3. **SMTP / WhatsApp / Push** configurados no ambiente (variáveis e tabelas de config).

## Como testar

1. Aplicar migration `20260319_registros_ponto_obra_id.sql` no Postgres.
2. Cadastrar responsável da obra em **Responsáveis da obra** (ou inserir em `responsaveis_obra`).
3. No app PWA, registrar entrada e depois **saída** no mesmo dia.
4. Verificar logs do servidor: linhas `[ponto-eletronico] Dia fechado — fluxo de notificação responsáveis obra X (ativos: N)`.
5. Confirmar e-mail, WhatsApp, sininho no app e notificação push (se inscrito).

## Correções aplicadas (validação)

- Notificação **sempre** é chamada quando há `obraId` (antes só era chamada se já existisse `responsaveis_obra`; na prática o mesmo efeito, mas o fluxo ficou explícito e com logs).
- Persistência de **`obra_id`** no registro de ponto (novo + atualização quando ausente).
- `resolverUsuarioId` aceita o campo **`usuario`** do responsável quando for um e-mail.
- Inserção em `notificacoes` com **`remetente`**, **`destinatarios`**, **`data`**.
