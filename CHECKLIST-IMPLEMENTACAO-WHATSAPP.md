# ✅ CHECKLIST DE IMPLEMENTAÇÃO
## Sistema de Aprovação via WhatsApp

**Valor:** R$ 11.500,00  
**Prazo:** 15-20 dias úteis

---

## 📋 FASE 1: SETUP E INFRAESTRUTURA (3 dias)

### Backend Setup
- [ ] Escolher API WhatsApp (Evolution/Twilio/Business)
- [ ] Configurar credenciais da API
- [ ] Adicionar variáveis de ambiente (.env)
- [ ] Testar conexão com API WhatsApp
- [ ] Configurar webhook (se disponível) para status de entrega

### Banco de Dados
- [ ] Criar migration `create_whatsapp_logs.sql`
- [ ] Criar migration `create_aprovacoes_whatsapp_hist.sql`
- [ ] Adicionar coluna `telefone_whatsapp` em `funcionarios` (se não existir)
- [ ] Executar migrations em desenvolvimento
- [ ] Verificar índices criados
- [ ] Testar relações (foreign keys)

### Estrutura de Arquivos
- [ ] Criar `backend-api/src/services/whatsapp-service.js`
- [ ] Criar `backend-api/src/services/whatsapp-logger.js`
- [ ] Criar `backend-api/src/utils/approval-tokens.js`
- [ ] Criar `backend-api/src/routes/aprovacao-publica.js`

---

## 📋 FASE 2: BACKEND CORE (5 dias)

### Serviço WhatsApp
- [ ] Implementar `enviarMensagemAprovacao()`
- [ ] Implementar `formatarMensagemAprovacao()`
- [ ] Implementar retry automático em caso de falha
- [ ] Implementar tratamento de erros
- [ ] Testar envio de mensagem simples
- [ ] Testar envio com botões (se API suportar)
- [ ] Validar formato de telefone

### Sistema de Tokens
- [ ] Implementar `gerarTokenAprovacao()`
- [ ] Implementar `validarToken()`
- [ ] Configurar expiração (48h)
- [ ] Implementar geração de token único (UUID)
- [ ] Testar geração de token
- [ ] Testar validação de token válido
- [ ] Testar validação de token expirado
- [ ] Testar validação de token inválido

### Rotas Públicas
- [ ] Implementar `GET /api/aprovacao/:token`
- [ ] Implementar `POST /api/aprovacao/:token/aprovar`
- [ ] Implementar `POST /api/aprovacao/:token/rejeitar`
- [ ] Implementar middleware de validação
- [ ] Implementar rate limiting por IP
- [ ] Implementar logging de acessos
- [ ] Testar todas as rotas
- [ ] Validar segurança (CSRF, sanitização)

### Integração com Sistema Existente
- [ ] Modificar `aprovacoes-horas-extras.js` - adicionar hook de envio
- [ ] Modificar `ponto-eletronico.js` - adicionar envio automático
- [ ] Garantir que não quebra funcionalidades existentes
- [ ] Testar fluxo completo de criação → envio

---

## 📋 FASE 3: SISTEMA DE LOGS (3 dias)

### Serviço de Logging
- [ ] Implementar `registrarEnvio()`
- [ ] Implementar `atualizarStatusEnvio()`
- [ ] Implementar `registrarAcao()`
- [ ] Implementar `buscarLogsPorAprovacao()`
- [ ] Testar registro de envio
- [ ] Testar atualização de status
- [ ] Testar registro de ações

### Endpoints de Auditoria
- [ ] Implementar `GET /api/whatsapp-logs`
- [ ] Implementar filtros (data, status, obra)
- [ ] Implementar paginação
- [ ] Implementar `GET /api/aprovacoes/:id/historico-whatsapp`
- [ ] Testar todos os endpoints
- [ ] Validar permissões (apenas admin)

---

## 📋 FASE 4: FRONTEND PÁGINA PÚBLICA (4 dias)

### Página de Aprovação
- [ ] Criar `app/aprovacao/[token]/page.tsx`
- [ ] Implementar validação de token (loading state)
- [ ] Implementar exibição de dados da aprovação
- [ ] Criar componentes de UI (card, botões)
- [ ] Implementar botão "Aprovar"
- [ ] Implementar botão "Rejeitar"
- [ ] Implementar campo de observações (opcional)
- [ ] Implementar feedback visual (loading, sucesso, erro)
- [ ] Implementar mensagens de erro (token inválido/expirado)
- [ ] Testar responsividade mobile
- [ ] Testar em diferentes navegadores

### Design
- [ ] Criar layout mobile-first
- [ ] Aplicar cores do sistema
- [ ] Implementar animações de loading
- [ ] Criar animação de sucesso
- [ ] Garantir acessibilidade (WCAG)

---

## 📋 FASE 5: INTEGRAÇÃO FRONTEND (4 dias)

### Indicadores Visuais
- [ ] Modificar `app/pwa/aprovacoes/page.tsx`
- [ ] Adicionar badge "Enviado via WhatsApp"
- [ ] Adicionar ícone de status (enviado/entregue/lido)
- [ ] Modificar `app/dashboard/aprovacoes-horas-extras/page.tsx`
- [ ] Adicionar indicadores no dashboard admin
- [ ] Criar componente `whatsapp-status-indicator.tsx`
- [ ] Testar exibição de status

### Painel de Auditoria
- [ ] Criar `app/dashboard/aprovacoes/whatsapp-logs/page.tsx`
- [ ] Implementar lista de logs
- [ ] Implementar filtros (data, status, obra)
- [ ] Implementar paginação
- [ ] Implementar detalhes de cada log
- [ ] Criar componente de visualização de histórico
- [ ] Implementar exportação (opcional)
- [ ] Testar painel completo

### Notificações Internas
- [ ] Modificar `notificacoes-horas-extras.js`
- [ ] Adicionar notificação "Enviado via WhatsApp"
- [ ] Atualizar notificações no PWA
- [ ] Testar notificações

---

## 📋 FASE 6: SISTEMA DE LEMBRETES (3 dias)

### Job Agendado
- [ ] Modificar `enviar-lembretes-aprovacoes.js`
- [ ] Adicionar lógica de envio WhatsApp
- [ ] Implementar verificação de intervalo configurável
- [ ] Implementar controle de tentativas máximas
- [ ] Implementar mensagem diferenciada para lembretes
- [ ] Testar job manualmente
- [ ] Configurar cron schedule
- [ ] Testar execução automática

### Configurações
- [ ] Criar variáveis de ambiente para configuração
- [ ] Documentar configurações
- [ ] Criar painel admin para configuração (opcional)

---

## 📋 FASE 7: TESTES (3 dias)

### Testes Unitários
- [ ] Testes do `whatsapp-service.js`
- [ ] Testes do `approval-tokens.js`
- [ ] Testes do `whatsapp-logger.js`
- [ ] Cobrir > 80% do código backend

### Testes de Integração
- [ ] Teste: Criar aprovação → enviar WhatsApp → aprovar via link
- [ ] Teste: Criar aprovação → enviar WhatsApp → rejeitar via link
- [ ] Teste: Token expirado
- [ ] Teste: Token inválido
- [ ] Teste: Múltiplos envios (rate limiting)
- [ ] Teste: Sistema de lembretes
- [ ] Teste: Logs e auditoria

### Testes de Segurança
- [ ] Validar proteção contra CSRF
- [ ] Validar sanitização de inputs
- [ ] Validar rate limiting
- [ ] Validar expiração de tokens
- [ ] Validar permissões de acesso

### Testes de Usabilidade
- [ ] Testar em diferentes dispositivos mobile
- [ ] Testar em diferentes navegadores
- [ ] Validar experiência do usuário
- [ ] Testar fluxo completo com usuário real

---

## 📋 FASE 8: DOCUMENTAÇÃO E DEPLOY (2 dias)

### Documentação Técnica
- [ ] Documentar código (comentários)
- [ ] Criar README da funcionalidade
- [ ] Documentar endpoints da API
- [ ] Criar diagrama de arquitetura
- [ ] Documentar configurações (.env)
- [ ] Criar guia de troubleshooting

### Documentação do Usuário
- [ ] Manual do gestor (uso do WhatsApp)
- [ ] FAQ de problemas comuns
- [ ] Screenshots das telas

### Deploy
- [ ] Deploy em ambiente de staging
- [ ] Testes em staging
- [ ] Configurar variáveis de ambiente em produção
- [ ] Deploy em produção
- [ ] Testes finais em produção
- [ ] Configurar monitoramento (opcional)

---

## 📋 FASE 9: TREINAMENTO E ENTREGA (1 dia)

### Treinamento
- [ ] Preparar apresentação (30 min)
- [ ] Treinar equipe técnica (1 hora)
- [ ] Treinar gestores (30 min)
- [ ] Q&A e esclarecimentos

### Entrega
- [ ] Entrega do código-fonte
- [ ] Entrega da documentação
- [ ] Entrega do acesso (se necessário)
- [ ] Assinatura de aceite

---

## 🔍 CHECKLIST DE VALIDAÇÃO FINAL

### Funcionalidades
- [ ] Envio automático funciona
- [ ] Mensagem formatada corretamente
- [ ] Link de aprovação funciona
- [ ] Aprovação sem login funciona
- [ ] Rejeição funciona
- [ ] Tokens expiram corretamente
- [ ] Logs são registrados
- [ ] Auditoria está completa
- [ ] Lembretes automáticos funcionam
- [ ] Notificações internas aparecem

### Qualidade
- [ ] Sem erros no console
- [ ] Performance adequada (< 2s)
- [ ] Responsivo em mobile
- [ ] Acessível (WCAG)
- [ ] Seguro (validações OK)

### Documentação
- [ ] Código documentado
- [ ] README completo
- [ ] Manual do usuário
- [ ] Guia de configuração

---

## 📊 MÉTRICAS DE SUCESSO

### Antes da Entrega:
- ✅ 100% dos testes passando
- ✅ Cobertura de testes > 80%
- ✅ Zero erros críticos
- ✅ Performance < 2s
- ✅ Documentação completa

### Após Entrega (30 dias):
- ✅ Taxa de envio WhatsApp > 95%
- ✅ Taxa de aprovação via WhatsApp > 50%
- ✅ Tempo médio de resposta < 24h
- ✅ Zero bugs críticos reportados

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Impacto | Mitigação | Status |
|-------|--------|-----------|--------|
| Aprovação API WhatsApp Business | Alto | Usar Evolution/Twilio como alternativa | [ ] |
| Rate Limiting API | Médio | Implementar fila de mensagens | [ ] |
| Segurança de Tokens | Alto | Validações robustas implementadas | [ ] |
| Atraso no desenvolvimento | Médio | Buffer de 5 dias no prazo | [ ] |

---

**Última atualização:** 31/10/2025  
**Versão:** 1.0


