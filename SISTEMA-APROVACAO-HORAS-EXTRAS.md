# Sistema de Aprovação de Horas Extras

## 📋 Visão Geral

Sistema para aprovação de horas extras com workflow de gestão, assinatura digital e notificações automáticas.

## 🎯 Regras de Negócio

### Regra Principal
- **Funcionário com +8h**: Deve ser aprovado pelo gestor da obra onde está alocado
- **Aprovação**: Feita via assinatura digital no celular do gestor
- **Notificações**: Sistema automático de lembretes diários

## 🔄 Fluxo de Aprovação

### 1. Detecção de Horas Extras
```
Funcionário registra ponto → Sistema calcula horas → Se > 8h → Status "Pendente Aprovação"
```

### 2. Seleção do Gestor
```
Funcionário/Admin → Seleciona gestor da obra → Envia para aprovação
```

### 3. Notificação ao Gestor
```
Sistema → Notificação push → Gestor recebe no celular → Abre app PWA
```

### 4. Aprovação Digital
```
Gestor → Visualiza detalhes → Assina digitalmente → Confirma aprovação
```

### 5. Finalização
```
Sistema → Atualiza status → Notifica funcionário → Registra histórico
```

## 🛠️ Implementação Técnica

### Frontend (Já Implementado)
- ✅ Componente `AprovacaoHorasExtrasDialog`
- ✅ Seleção de gestor por obra
- ✅ Interface de aprovação
- ✅ Validações de formulário

### APIs Necessárias (Para Implementar)

#### 1. Buscar Gestores por Obra
```http
GET /api/obras/{obra_id}/gestores
```
**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "cargo": "Gestor de Obra",
      "email": "joao@empresa.com",
      "telefone": "(11) 99999-0001"
    }
  ]
}
```

#### 2. Enviar para Aprovação
```http
POST /api/ponto-eletronico/registros/{id}/enviar-aprovacao
```
**Body:**
```json
{
  "gestor_id": 1,
  "observacoes": "Horas extras justificadas",
  "funcionario_id": 123,
  "obra_id": 456
}
```

#### 3. Aprovar com Assinatura
```http
POST /api/ponto-eletronico/registros/{id}/aprovar-assinatura
```
**Body:**
```json
{
  "gestor_id": 1,
  "assinatura_digital": "base64_signature_data",
  "observacoes_aprovacao": "Aprovado pelo gestor"
}
```

#### 4. Notificações
```http
POST /api/notificacoes/aprovacao-pendente
```
**Body:**
```json
{
  "gestor_id": 1,
  "registro_id": 123,
  "funcionario_nome": "João Silva",
  "horas_extras": 2.5,
  "data": "2025-01-15"
}
```

## 📱 PWA - Assinatura Digital

### Funcionalidades
- **Captura de Assinatura**: Canvas para desenhar assinatura
- **Validação**: Verificar se assinatura foi feita
- **Envio**: Upload da assinatura para o backend
- **Histórico**: Manter registro das assinaturas

### Componente de Assinatura
```tsx
// components/assinatura-digital.tsx
interface AssinaturaDigitalProps {
  onAssinatura: (assinatura: string) => void
  funcionarioNome: string
  horasExtras: number
}
```

## 🔔 Sistema de Notificações

### Tipos de Notificação

#### 1. Aprovação Pendente
- **Quando**: Horas extras enviadas para aprovação
- **Para**: Gestor da obra
- **Conteúdo**: "João Silva tem 2.5h extras para aprovar"

#### 2. Aprovação Concluída
- **Quando**: Gestor aprova/rejeita
- **Para**: Funcionário
- **Conteúdo**: "Suas horas extras foram aprovadas"

#### 3. Lembrete Diário
- **Quando**: Todo dia às 9h
- **Para**: Gestores com pendências
- **Conteúdo**: "Você tem 3 aprovações pendentes"

### Implementação de Notificações

#### 1. Notificação Push (PWA)
```javascript
// service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json()
  
  if (data.tipo === 'aprovacao_pendente') {
    self.registration.showNotification('Aprovação Pendente', {
      body: `${data.funcionario_nome} tem ${data.horas_extras}h extras para aprovar`,
      icon: '/icons/notification.png',
      badge: '/icons/badge.png',
      data: {
        url: `/pwa/aprovacoes/${data.registro_id}`
      }
    })
  }
})
```

#### 2. Notificação In-App
```tsx
// components/notificacao-aprovacao.tsx
interface NotificacaoAprovacaoProps {
  registro: {
    id: number
    funcionario_nome: string
    horas_extras: number
    data: string
    status: 'pendente' | 'aprovado' | 'rejeitado'
  }
}
```

## ⏰ Job de Verificação Diária

### Cron Job (Backend)
```javascript
// jobs/verificar-aprovacoes-pendentes.js
const verificarAprovacoesPendentes = async () => {
  // Buscar aprovações pendentes há mais de 1 dia
  const aprovacoesPendentes = await supabase
    .from('registros_ponto')
    .select(`
      *,
      funcionarios(nome, email),
      obras(nome, gestor_id, gestores(nome, email))
    `)
    .eq('status', 'Pendente Aprovação')
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000))
  
  // Enviar notificações para gestores
  for (const registro of aprovacoesPendentes) {
    await enviarNotificacaoLembrete(registro)
  }
}

// Executar diariamente às 9h
cron.schedule('0 9 * * *', verificarAprovacoesPendentes)
```

### Função de Lembrete
```javascript
const enviarNotificacaoLembrete = async (registro) => {
  const gestor = registro.obras.gestores
  
  // Notificação push
  await enviarPushNotification({
    user_id: gestor.id,
    title: 'Aprovação Pendente',
    body: `${registro.funcionarios.nome} tem horas extras pendentes há mais de 1 dia`,
    data: {
      tipo: 'aprovacao_pendente',
      registro_id: registro.id
    }
  })
  
  // Notificação in-app
  await criarNotificacao({
    destinatario_id: gestor.id,
    titulo: 'Aprovação Pendente',
    mensagem: `Você tem aprovações pendentes há mais de 1 dia`,
    tipo: 'aprovacao',
    link: `/dashboard/ponto/aprovacoes`
  })
}
```

## 📊 Dashboard de Aprovações

### Página de Gestão
```
/dashboard/ponto/aprovacoes
```

### Funcionalidades
- **Lista de Pendências**: Aprovações aguardando
- **Histórico**: Aprovações já processadas
- **Estatísticas**: Tempo médio de aprovação
- **Filtros**: Por obra, funcionário, data

### Componentes
```tsx
// components/aprovacoes-dashboard.tsx
interface AprovacoesDashboardProps {
  aprovacoes: Aprovacao[]
  gestorId: number
  onAprovar: (id: number) => void
  onRejeitar: (id: number, motivo: string) => void
}
```

## 🔐 Segurança e Validação

### Validações
- **Gestor**: Deve ser gestor da obra do funcionário
- **Assinatura**: Deve ser válida e única
- **Tempo**: Aprovação deve ser feita em tempo hábil
- **Permissões**: Apenas gestores podem aprovar

### Auditoria
- **Log de Aprovações**: Quem, quando, como
- **Histórico de Assinaturas**: Backup das assinaturas
- **Rastreabilidade**: Link entre funcionário, obra e gestor

## 📈 Métricas e Relatórios

### KPIs
- **Tempo Médio de Aprovação**: Por obra, por gestor
- **Taxa de Aprovação**: Percentual aprovado vs rejeitado
- **Horas Extras**: Total por funcionário, por obra
- **Eficiência**: Aprovações por dia

### Relatórios
- **Aprovações Pendentes**: Lista de gestores com pendências
- **Histórico de Aprovações**: Por período
- **Análise de Padrões**: Horários mais comuns de horas extras

## 🚀 Próximos Passos

### Fase 1 - Implementação Básica
1. ✅ Frontend de seleção de gestor
2. 🔄 API de busca de gestores por obra
3. 🔄 API de envio para aprovação
4. 🔄 Interface de assinatura digital

### Fase 2 - Notificações
1. 🔄 Sistema de notificações push
2. 🔄 Notificações in-app
3. 🔄 Job de verificação diária

### Fase 3 - Dashboard
1. 🔄 Página de gestão de aprovações
2. 🔄 Relatórios e métricas
3. 🔄 Auditoria e logs

### Fase 4 - Otimizações
1. 🔄 Notificações inteligentes
2. 🔄 Aprovação em lote
3. 🔄 Integração com outros sistemas

## 📝 Considerações Importantes

### Performance
- **Cache**: Gestores por obra em cache
- **Paginação**: Listas grandes de aprovações
- **Otimização**: Queries eficientes no banco

### UX/UI
- **Mobile First**: Interface otimizada para celular
- **Offline**: Funcionamento sem internet
- **Feedback**: Confirmações visuais claras

### Compliance
- **LGPD**: Proteção de dados pessoais
- **Auditoria**: Rastreabilidade completa
- **Backup**: Preservação de assinaturas

---

**Desenvolvido por**: Samuel Linkon Guedes Figueiredo  
**Data**: Janeiro 2025  
**Versão**: 1.0.0
