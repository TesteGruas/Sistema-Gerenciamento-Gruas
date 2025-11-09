# 📐 Especificações Técnicas Consolidadas

**Data:** 2025  
**Versão:** 1.0  
**Status:** Documentação Técnica Completa

---

## 📋 Índice

1. [Relatório de Performance de Gruas - Backend](#relatório-de-performance-de-gruas---backend)
2. [Relatório de Performance de Gruas - Frontend](#relatório-de-performance-de-gruas---frontend)
3. [Sistema de Aprovação via WhatsApp](#sistema-de-aprovação-via-whatsapp)
4. [Checklist de Implementação WhatsApp](#checklist-de-implementação-whatsapp)
5. [Componentes de Espelho de Ponto](#componentes-de-espelho-de-ponto)

---

## 🔧 Relatório de Performance de Gruas - Backend

### 📋 Visão Geral

Este documento descreve a implementação do endpoint de API para o **Relatório de Performance de Gruas** no backend, incluindo estrutura de dados, queries SQL, validações e tratamento de erros.

### 🎯 Objetivo

Fornecer dados consolidados sobre a performance operacional e financeira de gruas, calculando métricas como:
- Horas trabalhadas vs disponíveis
- Taxa de utilização
- Receita e custos por grua
- ROI (Retorno sobre Investimento)
- Comparativos temporais

### 🔌 Endpoint da API

#### Rota Principal
```
GET /api/relatorios/performance-gruas
```

#### Método
`GET`

#### Autenticação
Requer token JWT válido

#### Permissões
- `relatorios:visualizar` (mínimo)
- `gruas:visualizar` (recomendado)

### 📥 Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `data_inicio` | string | Não | Data inicial (YYYY-MM-DD) | `2024-01-01` |
| `data_fim` | string | Não | Data final (YYYY-MM-DD) | `2024-12-31` |
| `grua_id` | number | Não | ID específico da grua | `1` |
| `obra_id` | number | Não | Filtrar por obra específica | `5` |
| `agrupar_por` | string | Não | Agrupamento: `grua`, `obra`, `mes` | `grua` |
| `incluir_projecao` | boolean | Não | Incluir projeções futuras | `true` |
| `limite` | number | Não | Itens por página (padrão: 50) | `25` |
| `pagina` | number | Não | Página atual (padrão: 1) | `1` |
| `ordenar_por` | string | Não | Campo de ordenação | `taxa_utilizacao` |
| `ordem` | string | Não | `asc` ou `desc` (padrão: `desc`) | `desc` |

### Valores Padrão
- `data_inicio`: Primeiro dia do mês atual
- `data_fim`: Último dia do mês atual
- `agrupar_por`: `grua`
- `incluir_projecao`: `false`
- `limite`: `50`
- `pagina`: `1`
- `ordenar_por`: `taxa_utilizacao`
- `ordem`: `desc`

### 📤 Estrutura de Resposta

#### Sucesso (200 OK)
```json
{
  "success": true,
  "data": {
    "periodo": {
      "data_inicio": "2024-01-01",
      "data_fim": "2024-12-31",
      "dias_totais": 365,
      "dias_uteis": 252
    },
    "resumo_geral": {
      "total_gruas": 15,
      "total_horas_trabalhadas": 12450,
      "total_horas_disponiveis": 18000,
      "taxa_utilizacao_media": 69.2,
      "receita_total": 1250000.00,
      "custo_total": 850000.00,
      "lucro_total": 400000.00,
      "roi_medio": 47.1
    },
    "performance_por_grua": [
      {
        "grua": {
          "id": 1,
          "nome": "Grua 01",
          "modelo": "GT-550",
          "fabricante": "Liebherr",
          "tipo": "Torre",
          "status": "Operacional",
          "numero_serie": "LR-2020-001"
        },
        "metricas": {
          "horas_trabalhadas": 850,
          "horas_disponiveis": 1200,
          "horas_ociosas": 350,
          "taxa_utilizacao": 70.8,
          "dias_em_operacao": 35,
          "dias_total_periodo": 60
        },
        "financeiro": {
          "receita_total": 85000.00,
          "custo_operacao": 45000.00,
          "custo_manutencao": 12000.00,
          "custo_total": 57000.00,
          "lucro_bruto": 28000.00,
          "margem_lucro": 32.9,
          "receita_por_hora": 100.00,
          "custo_por_hora": 67.1,
          "lucro_por_hora": 32.9
        },
        "roi": {
          "investimento_inicial": 500000.00,
          "receita_acumulada": 85000.00,
          "custo_acumulado": 57000.00,
          "roi_percentual": 5.6,
          "tempo_retorno_meses": 18
        },
        "obras": {
          "total_obras": 3,
          "obras_visitadas": [
            {
              "obra_id": 1,
              "obra_nome": "Edifício Residencial Centro",
              "dias_permanencia": 20,
              "receita_gerada": 50000.00
            }
          ]
        },
        "comparativo_periodo_anterior": {
          "horas_trabalhadas_variacao": 5.2,
          "receita_variacao": 8.5,
          "utilizacao_variacao": 2.1
        }
      }
    ],
    "paginacao": {
      "pagina_atual": 1,
      "total_paginas": 3,
      "total_registros": 15,
      "limite": 50
    }
  },
  "ultima_atualizacao": "2024-12-15T10:30:00Z"
}
```

### 🗄️ Queries SQL Necessárias

#### 1. Obter Gruas com Informações Básicas
```sql
SELECT 
  g.id,
  g.nome,
  g.modelo,
  g.fabricante,
  g.tipo,
  g.status,
  g.numero_serie,
  g.valor_aquisicao as investimento_inicial
FROM gruas g
WHERE g.deleted_at IS NULL
  AND ($1::int IS NULL OR g.id = $1)
ORDER BY g.nome;
```

#### 2. Calcular Horas Trabalhadas por Grua
```sql
SELECT 
  l.grua_id,
  SUM(EXTRACT(EPOCH FROM (COALESCE(l.data_fim, CURRENT_DATE) - l.data_inicio)) / 3600) as horas_trabalhadas,
  COUNT(DISTINCT l.obra_id) as total_obras
FROM locacoes l
WHERE l.data_inicio >= $1::date
  AND l.data_inicio <= $2::date
  AND ($3::int IS NULL OR l.grua_id = $3)
  AND ($4::int IS NULL OR l.obra_id = $4)
GROUP BY l.grua_id;
```

#### 3. Calcular Receitas por Grua
```sql
SELECT 
  r.grua_id,
  SUM(r.valor) as receita_total
FROM receitas r
WHERE r.data_receita >= $1::date
  AND r.data_receita <= $2::date
  AND ($3::int IS NULL OR r.grua_id = $3)
  AND ($4::int IS NULL OR r.obra_id = $4)
GROUP BY r.grua_id;
```

#### 4. Calcular Custos por Grua
```sql
SELECT 
  c.grua_id,
  SUM(CASE WHEN c.tipo = 'operacao' THEN c.valor ELSE 0 END) as custo_operacao,
  SUM(CASE WHEN c.tipo = 'manutencao' THEN c.valor ELSE 0 END) as custo_manutencao,
  SUM(c.valor) as custo_total
FROM custos c
WHERE c.data_custo >= $1::date
  AND c.data_custo <= $2::date
  AND ($3::int IS NULL OR c.grua_id = $3)
GROUP BY c.grua_id;
```

### 🧮 Cálculos e Fórmulas

#### Taxa de Utilização
```
taxa_utilizacao = (horas_trabalhadas / horas_disponiveis) * 100
```

#### Horas Disponíveis
```
horas_disponiveis = dias_periodo * 24 horas
```

#### Margem de Lucro
```
margem_lucro = (lucro_bruto / receita_total) * 100
```

#### ROI (Retorno sobre Investimento)
```
roi_percentual = ((receita_acumulada - custo_acumulado) / investimento_inicial) * 100
```

#### Tempo de Retorno
```
tempo_retorno_meses = investimento_inicial / (lucro_mensal_medio)
```

### ✅ Validações

1. **Datas:**
   - `data_inicio` deve ser anterior a `data_fim`
   - Formato: YYYY-MM-DD
   - Não pode ser futura (exceto se `incluir_projecao = true`)

2. **IDs:**
   - `grua_id` e `obra_id` devem existir no banco
   - Retornar erro 404 se não encontrado

3. **Paginação:**
   - `limite` entre 1 e 100
   - `pagina` >= 1

4. **Agrupamento:**
   - Valores válidos: `grua`, `obra`, `mes`

### 🔒 Segurança

- Validar token JWT em todas as requisições
- Verificar expiração do token
- Verificar permissão `relatorios:visualizar`
- Filtrar dados baseado em permissões do usuário
- Sanitizar todos os inputs
- Prevenir SQL injection

### 📊 Performance

#### Otimizações
- Usar índices nas colunas:
  - `locacoes.grua_id`
  - `locacoes.obra_id`
  - `locacoes.data_inicio`
  - `receitas.data_receita`
  - `custos.data_custo`

- Cache de resultados:
  - Cache por 5 minutos para mesmas queries
  - Invalidar cache quando houver novas locações/receitas/custos

#### Limites
- Máximo de 100 registros por página
- Timeout de 30 segundos para queries
- Limitar período máximo a 2 anos

---

## 📊 Relatório de Performance de Gruas - Frontend

### 📋 Visão Geral

Este documento descreve a implementação do **Relatório de Performance de Gruas** no frontend, incluindo componentes, estrutura de dados, mocks e integração com a API.

### 🎯 Objetivo

Fornecer uma análise detalhada da performance operacional e financeira de cada grua, permitindo identificar:
- Gruas mais/menos rentáveis
- Horas trabalhadas vs horas disponíveis
- Custo por hora de operação
- Receita por hora de operação
- ROI (Retorno sobre Investimento)
- Comparativos entre períodos

### 📁 Estrutura de Arquivos

```
app/dashboard/relatorios/
  └── performance-gruas/
      └── page.tsx                    # Página principal do relatório

components/
  └── relatorios/
      ├── performance-gruas-filtros.tsx      # Componente de filtros
      ├── performance-gruas-tabela.tsx        # Tabela de resultados
      ├── performance-gruas-graficos.tsx     # Gráficos de análise
      └── performance-gruas-resumo.tsx       # Cards de resumo

lib/
  ├── api-relatorios-performance.ts          # API client
  └── mocks/
      └── performance-gruas-mocks.ts          # Dados mockados
```

### 🎨 Componentes Frontend

#### 1. Página Principal (`page.tsx`)

**Responsabilidades:**
- Gerenciar estado global do relatório
- Coordenar carregamento de dados
- Layout principal com tabs

**Estrutura:**
```tsx
- Header com título e ações
- Filtros (componente separado)
- Tabs:
  - Resumo Geral
  - Performance Detalhada
  - Análise Comparativa
  - Gráficos
```

#### 2. Componente de Filtros (`performance-gruas-filtros.tsx`)

**Campos:**
- Período (data início/fim ou presets)
- Grua específica (opcional)
- Obra específica (opcional)
- Agrupamento (por grua, obra, mês)
- Incluir projeções (checkbox)

**Presets de Período:**
- Última semana
- Último mês
- Último trimestre
- Último semestre
- Último ano
- Personalizado

#### 3. Componente de Resumo (`performance-gruas-resumo.tsx`)

**Cards de Métricas:**
- Total de Gruas Analisadas
- Taxa de Utilização Média
- Receita Total
- Custo Total
- Lucro Total
- ROI Médio
- Horas Trabalhadas Totais

#### 4. Componente de Tabela (`performance-gruas-tabela.tsx`)

**Colunas:**
- Grua (nome, modelo, fabricante)
- Status
- Horas Trabalhadas
- Taxa de Utilização (%)
- Receita Total
- Custo Total
- Lucro Bruto
- Margem de Lucro (%)
- ROI (%)
- Receita por Hora
- Ações (ver detalhes, exportar)

#### 5. Componente de Gráficos (`performance-gruas-graficos.tsx`)

**Gráficos:**
1. **Taxa de Utilização por Grua** (Barras horizontais)
2. **Receita vs Custo por Grua** (Barras agrupadas)
3. **ROI por Grua** (Barras)
4. **Distribuição de Horas** (Pizza: Trabalhadas vs Ociosas)
5. **Evolução Temporal** (Linha: Receita/Custo ao longo do tempo)
6. **Top 10 Gruas por Lucro** (Barras)

### 🎨 Design e UX

#### Cores e Indicadores
- **Taxa de Utilização:**
  - Verde: ≥ 80%
  - Amarelo: 60-79%
  - Vermelho: < 60%

- **ROI:**
  - Verde: ≥ 50%
  - Amarelo: 20-49%
  - Vermelho: < 20%

- **Margem de Lucro:**
  - Verde: ≥ 30%
  - Amarelo: 15-29%
  - Vermelho: < 15%

### 🎯 Funcionalidades

- ✅ Filtro por período (presets e personalizado)
- ✅ Filtro por grua específica
- ✅ Filtro por obra
- ✅ Agrupamento de resultados
- ✅ Busca por nome/modelo de grua
- ✅ Tabela ordenável e paginável
- ✅ Cards de resumo com métricas principais
- ✅ Gráficos interativos (Recharts)
- ✅ Comparativo com período anterior
- ✅ Exportar para PDF/Excel/CSV
- ✅ Modal/dialog com detalhes da grua

### 📝 Detalhes de Implementação Frontend

#### Estados e Gerenciamento
- Estados gerenciados com `useState` e `useEffect`
- Loading states em todas as operações assíncronas
- Tratamento de erros com toast notifications
- Validação de filtros antes de requisições
- Debounce em filtros de busca
- Cache de dados para melhor performance

#### Integração com API
- API Client: `lib/api-relatorios-performance.ts`
- Função `performanceGruasApi.getPerformanceGruas(filtros)`
- Tratamento de erros de rede
- Retry automático em caso de falha
- Timeout configurável

#### Responsividade
- Layout adaptável para mobile
- Tabela com scroll horizontal em telas pequenas
- Gráficos responsivos (Recharts ResponsiveContainer)
- Cards de resumo em grid responsivo
- Filtros colapsáveis em mobile

#### Permissões
- Verificação de permissão `relatorios:visualizar`
- Verificação de permissão `gruas:visualizar`
- Mensagens de erro quando sem permissão
- Ocultação de dados sensíveis baseado em permissões

---

## 📱 Sistema de Aprovação via WhatsApp

### 📋 Visão Geral

Sistema completo para aprovação de horas extras via WhatsApp, permitindo que gestores aprovem solicitações diretamente pelo aplicativo sem necessidade de login no sistema.

**Versão:** 1.0  
**Data:** 31/10/2025  
**Proposta:** PRO-WHATSAPP-001 (R$ 11.500,00)

### 🔄 Fluxo Completo do Sistema

#### Fluxo 1: Criação de Aprovação e Envio WhatsApp

```
Funcionário Registra Ponto
    ↓
Sistema detecta horas extras > 0
    ↓
Criar registro em aprovacoes_horas_extras (status: 'pendente')
    ↓
Buscar supervisor da obra (telefone WhatsApp)
    ↓
Gerar token seguro (JWT com expiração 48h)
    ↓
Formatar mensagem WhatsApp (template personalizado)
    ↓
Enviar via API WhatsApp (Evolution/Twilio/Business)
    ↓
Registrar em whatsapp_logs (status: 'enviado')
    ↓
Criar notificação interna "Enviado para WhatsApp"
    ↓
Retornar sucesso para funcionário
```

#### Fluxo 2: Aprovação via Link WhatsApp

```
Gestor recebe mensagem WhatsApp
    ↓
Clica no link de aprovação
    ↓
Página pública valida token (GET /aprovacao/:token)
    ↓
Token válido? → Buscar dados da aprovação
    ↓
Exibir página com dados e botões Aprovar/Rejeitar
    ↓
Gestor escolhe:
    ├─ Aprovar → POST /aprovacao/:token/aprovar
    └─ Rejeitar → POST /aprovacao/:token/rejeitar
```

### 🔌 Especificação de Endpoints

#### Backend - Rotas Públicas

##### `GET /api/aprovacao/:token`
**Descrição:** Valida token e retorna dados da aprovação

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "aprovacao_id": 123,
    "funcionario": {
      "id": 45,
      "nome": "João Silva"
    },
    "obra": {
      "id": 10,
      "nome": "Shopping Center"
    },
    "horas_extras": 3.5,
    "data_trabalho": "2025-10-31",
    "observacoes": "Trabalho noturno",
    "dias_restantes": 5,
    "token_valido": true
  }
}
```

##### `POST /api/aprovacao/:token/aprovar`
**Descrição:** Aprova horas extras via token

**Body (opcional):**
```json
{
  "observacoes": "Aprovado via WhatsApp"
}
```

##### `POST /api/aprovacao/:token/rejeitar`
**Descrição:** Rejeita horas extras via token

**Body:**
```json
{
  "observacoes": "Motivo da rejeição"
}
```

#### Backend - Rotas Administrativas

##### `GET /api/whatsapp-logs`
**Descrição:** Lista logs de envio WhatsApp (requer autenticação admin)

**Query Parâmetros:**
- `aprovacao_id` (opcional): Filtrar por aprovação
- `status` (opcional): Filtrar por status ('enviado', 'entregue', 'falha')
- `data_inicio` (opcional): Data início
- `data_fim` (opcional): Data fim
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

### 🔐 Especificação de Tokens

#### Estrutura do Token JWT:

**Payload:**
```json
{
  "aprovacao_id": 123,
  "funcionario_id": 45,
  "supervisor_id": 67,
  "exp": 1730419200,  // Unix timestamp (48h)
  "iat": 1730239200,  // Unix timestamp (agora)
  "jti": "unique-token-id",  // UUID único
  "type": "approval_token"
}
```

### 📱 Especificação do Serviço WhatsApp

#### Interface do Serviço:

```javascript
class WhatsAppService {
  async enviarMensagemAprovacao({ telefone, aprovacao, token }) {
    // Implementação
  }
  
  async enviarLembrete({ telefone, aprovacao, token, diasRestantes }) {
    // Implementação
  }
  
  formatarMensagemAprovacao(aprovacao, token) {
    // Template da mensagem
  }
}
```

#### Template de Mensagem:

```
*🔔 Nova Solicitação de Aprovação*

👤 *Funcionário:* {FUNCIONARIO_NOME}
🏗️ *Obra:* {OBRA_NOME}
📅 *Data:* {DATA_TRABALHO}
⏰ *Horas Extras:* {HORAS_EXTRAS}h
⏳ *Prazo:* {DIAS_RESTANTES} dias

Aprovar ou Rejeitar diretamente:

✅ Aprovar: {LINK_APROVAR}
❌ Rejeitar: {LINK_REJEITAR}

Ou acesse: {LINK_COMPLETO}

Este link expira em 48 horas.
```

### 🗄️ Estrutura do Banco de Dados

#### Migration SQL Completa:

```sql
-- Tabela de logs de envio WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id SERIAL PRIMARY KEY,
  aprovacao_id INTEGER NOT NULL REFERENCES aprovacoes_horas_extras(id) ON DELETE CASCADE,
  tipo_envio VARCHAR(50) NOT NULL CHECK (tipo_envio IN ('nova_aprovacao', 'lembrete', 'resultado')),
  destinatario_telefone VARCHAR(20) NOT NULL,
  destinatario_nome VARCHAR(255),
  mensagem TEXT,
  status_envio VARCHAR(20) NOT NULL DEFAULT 'pendente' 
    CHECK (status_envio IN ('pendente', 'enviado', 'entregue', 'lido', 'falha')),
  token_aprovacao VARCHAR(255) UNIQUE,
  data_envio TIMESTAMP,
  data_entrega TIMESTAMP,
  data_leitura TIMESTAMP,
  erro_detalhes TEXT,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de ações
CREATE TABLE IF NOT EXISTS aprovacoes_whatsapp_hist (
  id SERIAL PRIMARY KEY,
  aprovacao_id INTEGER NOT NULL REFERENCES aprovacoes_horas_extras(id) ON DELETE CASCADE,
  log_id INTEGER REFERENCES whatsapp_logs(id) ON DELETE SET NULL,
  token VARCHAR(255) NOT NULL,
  acao VARCHAR(50) NOT NULL CHECK (acao IN ('link_aberto', 'aprovar', 'rejeitar', 'token_invalido', 'token_expirado')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  observacoes TEXT,
  data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna telefone_whatsapp em funcionarios (se não existir)
ALTER TABLE funcionarios 
ADD COLUMN IF NOT EXISTS telefone_whatsapp VARCHAR(20);
```

### ⚙️ Configurações Necessárias

#### Variáveis de Ambiente (.env):

```env
# WhatsApp API
WHATSAPP_API_TYPE=evolution  # ou 'twilio' ou 'business'
WHATSAPP_API_URL=https://api.evolution.com
WHATSAPP_API_KEY=sua_api_key
WHATSAPP_INSTANCE_NAME=nome_da_instancia

# Ou para Twilio
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Configurações de Tokens
APPROVAL_TOKEN_EXPIRY_HOURS=48
APPROVAL_TOKEN_SECRET=use_jwt_secret_do_sistema

# Configurações de Lembretes
LEMBRETE_INTERVALO_HORAS=24  # Reenviar após 24h
LEMBRETE_MAX_TENTATIVAS=3    # Máximo 3 lembretes

# URLs
APP_BASE_URL=https://app.seudominio.com
WHATSAPP_APPROVAL_URL=${APP_BASE_URL}/aprovacao
```

---

## ✅ Checklist de Implementação WhatsApp

**Valor:** R$ 11.500,00  
**Prazo:** 15-20 dias úteis

### 📋 FASE 1: SETUP E INFRAESTRUTURA (3 dias)

#### Backend Setup
- [ ] Escolher API WhatsApp (Evolution/Twilio/Business)
- [ ] Configurar credenciais da API
- [ ] Adicionar variáveis de ambiente (.env)
- [ ] Testar conexão com API WhatsApp
- [ ] Configurar webhook (se disponível) para status de entrega

#### Banco de Dados
- [ ] Criar migration `create_whatsapp_logs.sql`
- [ ] Criar migration `create_aprovacoes_whatsapp_hist.sql`
- [ ] Adicionar coluna `telefone_whatsapp` em `funcionarios` (se não existir)
- [ ] Executar migrations em desenvolvimento
- [ ] Verificar índices criados
- [ ] Testar relações (foreign keys)

### 📋 FASE 2: BACKEND CORE (5 dias)

#### Serviço WhatsApp
- [ ] Implementar `enviarMensagemAprovacao()`
- [ ] Implementar `formatarMensagemAprovacao()`
- [ ] Implementar retry automático em caso de falha
- [ ] Implementar tratamento de erros
- [ ] Testar envio de mensagem simples
- [ ] Validar formato de telefone

#### Sistema de Tokens
- [ ] Implementar `gerarTokenAprovacao()`
- [ ] Implementar `validarToken()`
- [ ] Configurar expiração (48h)
- [ ] Implementar geração de token único (UUID)
- [ ] Testar geração de token
- [ ] Testar validação de token válido
- [ ] Testar validação de token expirado
- [ ] Testar validação de token inválido

#### Rotas Públicas
- [ ] Implementar `GET /api/aprovacao/:token`
- [ ] Implementar `POST /api/aprovacao/:token/aprovar`
- [ ] Implementar `POST /api/aprovacao/:token/rejeitar`
- [ ] Implementar middleware de validação
- [ ] Implementar rate limiting por IP
- [ ] Implementar logging de acessos
- [ ] Testar todas as rotas
- [ ] Validar segurança (CSRF, sanitização)

### 📋 FASE 3: SISTEMA DE LOGS (3 dias)

#### Serviço de Logging
- [ ] Implementar `registrarEnvio()`
- [ ] Implementar `atualizarStatusEnvio()`
- [ ] Implementar `registrarAcao()`
- [ ] Implementar `buscarLogsPorAprovacao()`
- [ ] Testar registro de envio
- [ ] Testar atualização de status
- [ ] Testar registro de ações

#### Endpoints de Auditoria
- [ ] Implementar `GET /api/whatsapp-logs`
- [ ] Implementar filtros (data, status, obra)
- [ ] Implementar paginação
- [ ] Implementar `GET /api/aprovacoes/:id/historico-whatsapp`
- [ ] Testar todos os endpoints
- [ ] Validar permissões (apenas admin)

### 📋 FASE 4: FRONTEND PÁGINA PÚBLICA (4 dias)

#### Página de Aprovação
- [x] Criar `app/aprovacaop/[id]/page.tsx` ✅ **IMPLEMENTADO**
- [x] Implementar validação de token (loading state) ✅
- [x] Implementar exibição de dados da aprovação ✅
- [x] Criar componentes de UI (card, botões) ✅
- [x] Implementar botão "Aprovar" ✅
- [x] Implementar botão "Rejeitar" ✅
- [x] Implementar campo de observações (opcional) ✅
- [x] Implementar feedback visual (loading, sucesso, erro) ✅
- [x] Implementar mensagens de erro (token inválido/expirado) ✅
- [x] Testar responsividade mobile ✅
- [x] Testar em diferentes navegadores ✅

**Arquivo Implementado:** `app/aprovacaop/[id]/page.tsx`

**Funcionalidades Implementadas:**
- ✅ Validação de token via query parameter (`?token=...`)
- ✅ Loading state durante carregamento
- ✅ Exibição de dados: funcionário, data, horas extras, horários
- ✅ Botões de ação: Aprovar/Rejeitar
- ✅ Campo de observações (opcional para aprovação)
- ✅ Campo de motivo (obrigatório para rejeição)
- ✅ Estados visuais: loading, sucesso, erro
- ✅ Validação de aprovação já processada
- ✅ Layout responsivo mobile-first
- ✅ Tratamento de erros com mensagens claras

### 📋 FASE 5: INTEGRAÇÃO FRONTEND (4 dias)

#### Indicadores Visuais
- [x] Modificar `app/pwa/aprovacoes/page.tsx` ✅
- [x] Adicionar badge "Enviado via WhatsApp" ✅
- [x] Adicionar ícone de status (enviado/entregue/lido) ✅
- [x] Modificar `app/dashboard/aprovacoes-horas-extras/page.tsx` ✅
- [x] Adicionar indicadores no dashboard admin ✅
- [x] Criar componente `whatsapp-status-indicator.tsx` ✅
- [x] Testar exibição de status ✅

#### Painel de Auditoria
- [x] Criar `app/dashboard/aprovacoes-horas-extras/whatsapp/page.tsx` ✅ **IMPLEMENTADO**
- [x] Implementar lista de logs ✅
- [x] Implementar filtros (data, status, obra) ✅
- [x] Implementar paginação ✅
- [x] Implementar detalhes de cada log ✅
- [x] Criar componente de visualização de histórico ✅
- [x] Implementar exportação (opcional) ✅
- [x] Testar painel completo ✅

**Componentes Implementados:**

1. **`app/dashboard/aprovacoes-horas-extras/whatsapp/page.tsx`**
   - Página principal com tabs (Configurações e Relatórios)
   - Integração com componentes `WhatsAppConfiguracao` e `WhatsAppRelatorios`

2. **`components/whatsapp-configuracao.tsx`**
   - Envio de mensagem de teste
   - Teste completo de fluxo (criação + envio + link)
   - Validação de número de telefone
   - Feedback visual de sucesso/erro
   - Links para acessar aprovação pública

3. **`components/whatsapp-relatorios.tsx`**
   - Lista de logs de envio WhatsApp
   - Filtros: data início/fim, status, tipo, aprovação
   - Estatísticas: total enviadas, entregues, lidas, erros
   - Taxa de entrega e leitura
   - Tempo médio de resposta
   - Paginação
   - Exportação de dados
   - Modal de detalhes de cada log

### 📋 FASE 6: SISTEMA DE LEMBRETES (3 dias)

#### Job Agendado
- [ ] Modificar `enviar-lembretes-aprovacoes.js`
- [ ] Adicionar lógica de envio WhatsApp
- [ ] Implementar verificação de intervalo configurável
- [ ] Implementar controle de tentativas máximas
- [ ] Implementar mensagem diferenciada para lembretes
- [ ] Testar job manualmente
- [ ] Configurar cron schedule
- [ ] Testar execução automática

### 📋 FASE 7: TESTES (3 dias)

#### Testes Unitários
- [ ] Testes do `whatsapp-service.js`
- [ ] Testes do `approval-tokens.js`
- [ ] Testes do `whatsapp-logger.js`
- [ ] Cobrir > 80% do código backend

#### Testes de Integração
- [ ] Teste: Criar aprovação → enviar WhatsApp → aprovar via link
- [ ] Teste: Criar aprovação → enviar WhatsApp → rejeitar via link
- [ ] Teste: Token expirado
- [ ] Teste: Token inválido
- [ ] Teste: Múltiplos envios (rate limiting)
- [ ] Teste: Sistema de lembretes
- [ ] Teste: Logs e auditoria

#### Testes de Segurança
- [ ] Validar proteção contra CSRF
- [ ] Validar sanitização de inputs
- [ ] Validar rate limiting
- [ ] Validar expiração de tokens
- [ ] Validar permissões de acesso

### 📋 FASE 8: DOCUMENTAÇÃO E DEPLOY (2 dias)

#### Documentação Técnica
- [ ] Documentar código (comentários)
- [ ] Criar README da funcionalidade
- [ ] Documentar endpoints da API
- [ ] Criar diagrama de arquitetura
- [ ] Documentar configurações (.env)
- [ ] Criar guia de troubleshooting

#### Deploy
- [ ] Deploy em ambiente de staging
- [ ] Testes em staging
- [ ] Configurar variáveis de ambiente em produção
- [ ] Deploy em produção
- [ ] Testes finais em produção

### 📊 Métricas de Sucesso

#### Antes da Entrega:
- ✅ 100% dos testes passando
- ✅ Cobertura de testes > 80%
- ✅ Zero erros críticos
- ✅ Performance < 2s
- ✅ Documentação completa

#### Após Entrega (30 dias):
- ✅ Taxa de envio WhatsApp > 95%
- ✅ Taxa de aprovação via WhatsApp > 50%
- ✅ Tempo médio de resposta < 24h
- ✅ Zero bugs críticos reportados

---

## 📱 Sistema de Aprovação via WhatsApp - Frontend

### 📋 Página Pública de Aprovação

**Arquivo:** `app/aprovacaop/[id]/page.tsx`

**Rota:** `/aprovacaop/[id]?token={token}`

**Características:**
- ✅ Página pública (não requer autenticação)
- ✅ Validação de token via query parameter
- ✅ Layout mobile-first responsivo
- ✅ Estados visuais claros (loading, sucesso, erro)

**Funcionalidades:**
1. **Validação de Token:**
   - Busca token da query string (`?token=...`)
   - Valida token no backend via `GET /api/aprovacao/:id?token=...`
   - Exibe erro se token inválido/expirado

2. **Exibição de Dados:**
   - Nome e CPF do funcionário
   - Data do trabalho
   - Horas extras solicitadas
   - Horários de entrada/saída (se disponível)
   - Observações do funcionário
   - Prazo para aprovação

3. **Ações Disponíveis:**
   - **Aprovar:** Campo de observações opcional
   - **Rejeitar:** Campo de motivo obrigatório
   - Validação antes de enviar
   - Feedback visual durante processamento

4. **Estados da Página:**
   - **Loading:** Spinner durante carregamento
   - **Erro:** Mensagem de erro clara
   - **Sucesso:** Confirmação visual após aprovação/rejeição
   - **Já Processada:** Alerta se aprovação já foi processada

### 📋 Componentes de Configuração e Relatórios

#### 1. WhatsAppConfiguracao

**Arquivo:** `components/whatsapp-configuracao.tsx`

**Funcionalidades:**
- ✅ Envio de mensagem de teste
- ✅ Teste completo de fluxo (criação + envio + link)
- ✅ Validação de formato de telefone
- ✅ Feedback visual (sucesso/erro)
- ✅ Links diretos para aprovação pública
- ✅ Estados de loading durante envio

**Campos:**
- Número destinatário (formato: `5511999999999`)
- Validação de formato (mínimo 10 dígitos)
- Limpeza automática de caracteres especiais

#### 2. WhatsAppRelatorios

**Arquivo:** `components/whatsapp-relatorios.tsx`

**Funcionalidades:**
- ✅ Lista de logs de envio
- ✅ Filtros avançados:
  - Data início/fim
  - Status (enviado, entregue, lido, falha)
  - Tipo (nova_aprovacao, lembrete, resultado)
  - ID da aprovação
- ✅ Estatísticas em tempo real:
  - Total enviadas
  - Total entregues
  - Total lidas
  - Total erros
  - Taxa de entrega (%)
  - Taxa de leitura (%)
  - Tempo médio de resposta
- ✅ Paginação
- ✅ Exportação de dados
- ✅ Modal de detalhes de cada log
- ✅ Atualização automática de estatísticas

**Estrutura de Dados:**
```typescript
interface WhatsAppLog {
  id: number
  aprovacao_id: number
  tipo_envio: string
  destinatario_telefone: string
  destinatario_nome: string
  status_envio: string
  data_envio: string
  data_entrega?: string
  data_leitura?: string
  erro_detalhes?: string
  tentativas: number
}
```

### 🔄 Fluxo de Integração Frontend

1. **Criação de Aprovação:**
   - Sistema detecta horas extras no registro de ponto
   - Cria aprovação automaticamente
   - Backend envia WhatsApp automaticamente
   - Frontend recebe notificação de envio

2. **Visualização no Dashboard:**
   - Badge "Enviado via WhatsApp" aparece
   - Ícone de status (enviado/entregue/lido)
   - Link para ver detalhes do envio

3. **Aprovação via Link:**
   - Gestor recebe mensagem no WhatsApp
   - Clica no link
   - Página pública carrega dados
   - Gestor aprova/rejeita
   - Sistema atualiza status
   - Notificação enviada ao funcionário

### 🎨 Design e UX

#### Cores e Indicadores
- **Status Enviado:** Azul
- **Status Entregue:** Verde
- **Status Lido:** Verde escuro
- **Status Falha:** Vermelho
- **Botão Aprovar:** Verde
- **Botão Rejeitar:** Vermelho

#### Responsividade
- Layout mobile-first
- Cards adaptáveis
- Tabelas com scroll horizontal
- Modais responsivos
- Botões touch-friendly

### 📝 Notas de Implementação

- Componentes usam `useState` e `useEffect` para gerenciar estado
- Integração com `lib/api-whatsapp.ts` para chamadas de API
- Toast notifications para feedback ao usuário
- Loading states em todas as operações assíncronas
- Validação de dados no frontend antes de enviar
- Tratamento de erros com mensagens claras
- Debounce em campos de busca/filtro

---

## 📄 Componentes de Espelho de Ponto

### 📋 Visão Geral

Componentes React para geração e visualização de espelhos de ponto (folhas de ponto) dos funcionários.

### 🎯 Componentes Disponíveis

#### 1. `EspelhoPontoAvancado`

**Arquivo:** `components/espelho-ponto-avancado.tsx`

**Interface:**
```typescript
interface EspelhoPontoAvancadoProps {
  trigger?: React.ReactNode
}
```

**Funcionalidades:**
- Busca de funcionário por nome
- Seleção de período personalizado (data início/fim)
- Exibição de registros de ponto em tabela
- Cálculo de totais (horas trabalhadas, horas extras)
- Assinatura digital do funcionário
- Assinatura digital do gestor
- Exportação para PDF
- Envio por email
- Exportação para Excel/CSV

**Dados Utilizados:**
- `funcionariosApi` - API de funcionários
- `apiRegistrosPonto` - API de registros de ponto

**Estados:**
- `funcionarioSelecionado` - Funcionário escolhido
- `registros` - Lista de registros de ponto
- `dataInicio` / `dataFim` - Período selecionado
- `assinaturaFuncionario` / `assinaturaGestor` - Assinaturas digitais

#### 2. `EspelhoPontoDialog`

**Arquivo:** `components/espelho-ponto-dialog.tsx`

**Interface:**
```typescript
interface EspelhoPontoDialogProps {
  trigger?: React.ReactNode
}
```

**Funcionalidades:**
- Busca de funcionário por nome
- Seleção de mês/ano específico
- Exibição de espelho mensal completo
- Cálculo de totais mensais:
  - Total de dias trabalhados
  - Total de horas trabalhadas
  - Total de horas extras
  - Total de faltas
- Assinatura digital do funcionário
- Assinatura digital do gestor
- Exportação para PDF
- Envio por email

**Dados Utilizados:**
- `funcionariosApi` - API de funcionários
- `apiRegistrosPonto` - API de registros de ponto

**Estrutura de Dados:**
```typescript
interface EspelhoData {
  funcionario_id: number
  funcionario_nome: string
  matricula: string
  cargo: string
  jornada_diaria: number
  mes: string
  ano: number
  registros: Array<{
    data: string
    entrada?: string
    saida_almoco?: string
    volta_almoco?: string
    saida?: string
    horas_trabalhadas?: number
    horas_extras?: number
    status: string
  }>
  total_dias_trabalhados: number
  total_horas_trabalhadas: number
  total_horas_extras: number
  total_faltas: number
}
```

### 🎨 Características Comuns

#### Busca de Funcionário
- Campo de busca com autocomplete
- Busca por nome (mínimo 2 caracteres)
- Lista de resultados clicáveis
- Fechamento ao clicar fora

#### Validações
- Funcionário obrigatório
- Período obrigatório (data início/fim ou mês/ano)
- Validação de datas (início < fim)
- Mensagens de erro claras

#### Exportação
- **PDF:** Geração de documento formatado
- **Excel/CSV:** Exportação de dados tabulares
- **Email:** Envio direto para funcionário/gestor

#### Assinaturas Digitais
- Campo de texto para assinatura do funcionário
- Campo de texto para assinatura do gestor
- Validação de assinaturas antes de exportar

### 🔄 Fluxo de Uso

1. **Abrir Modal:**
   - Usuário clica no trigger (botão ou link)
   - Modal abre com campos vazios

2. **Selecionar Funcionário:**
   - Usuário digita nome no campo de busca
   - Sistema busca e exibe resultados
   - Usuário seleciona funcionário

3. **Definir Período:**
   - **EspelhoPontoAvancado:** Seleciona data início e fim
   - **EspelhoPontoDialog:** Seleciona mês e ano

4. **Carregar Dados:**
   - Sistema busca registros de ponto
   - Exibe tabela com registros
   - Calcula totais automaticamente

5. **Assinar (Opcional):**
   - Funcionário assina digitalmente
   - Gestor assina digitalmente

6. **Exportar:**
   - Usuário escolhe formato (PDF/Excel/Email)
   - Sistema gera arquivo ou envia email
   - Download automático ou confirmação

### 📝 Notas de Implementação

- Componentes usam `Dialog` do shadcn/ui
- Estados gerenciados com `useState` e `useEffect`
- Debounce na busca de funcionários
- Loading states durante carregamento
- Tratamento de erros com toast notifications
- Responsivo para mobile

### 🔄 Integração com APIs

#### APIs Utilizadas
- `funcionariosApi` - Busca de funcionários
- `apiRegistrosPonto` - Busca de registros de ponto
- Endpoints de exportação (PDF, Excel, Email)

#### Tratamento de Dados
- Formatação de datas (date-fns)
- Formatação de valores monetários
- Cálculo de totais (horas trabalhadas, horas extras)
- Validação de períodos (data início < data fim)

#### Exportação
- **PDF:** Geração via biblioteca de PDF (ex: jsPDF, react-pdf)
- **Excel/CSV:** Exportação de dados tabulares
- **Email:** Envio via API de email

---

## 📊 Resumo de Implementação Frontend

### ✅ Relatório de Performance de Gruas - Frontend

**Status:** ✅ **IMPLEMENTADO**

**Componentes Criados:**
- ✅ `app/dashboard/relatorios/page.tsx` - Página principal com integração
- ✅ `components/relatorios/performance-gruas-filtros.tsx` - Componente de filtros
- ✅ `components/relatorios/performance-gruas-resumo.tsx` - Cards de resumo
- ✅ `components/relatorios/performance-gruas-tabela.tsx` - Tabela de resultados
- ✅ `components/relatorios/performance-gruas-graficos.tsx` - Gráficos interativos
- ✅ `lib/api-relatorios-performance.ts` - API client
- ✅ `lib/mocks/performance-gruas-mocks.ts` - Dados mockados

**Funcionalidades Implementadas:**
- ✅ Filtros avançados (período, grua, obra, agrupamento)
- ✅ Cards de resumo com métricas principais
- ✅ Tabela ordenável e paginável
- ✅ Gráficos interativos (Recharts)
- ✅ Exportação (PDF, Excel, CSV)
- ✅ Responsividade mobile
- ✅ Integração com API real
- ✅ Tratamento de erros
- ✅ Loading states

### ✅ Sistema de Aprovação via WhatsApp - Frontend

**Status:** ✅ **IMPLEMENTADO**

**Componentes Criados:**
- ✅ `app/aprovacaop/[id]/page.tsx` - Página pública de aprovação
- ✅ `app/dashboard/aprovacoes-horas-extras/whatsapp/page.tsx` - Dashboard de configuração
- ✅ `components/whatsapp-configuracao.tsx` - Componente de configuração e testes
- ✅ `components/whatsapp-relatorios.tsx` - Componente de relatórios e logs
- ✅ `lib/api-whatsapp.ts` - API client

**Funcionalidades Implementadas:**
- ✅ Página pública de aprovação (sem autenticação)
- ✅ Validação de token
- ✅ Aprovação/rejeição via link público
- ✅ Envio de mensagem de teste
- ✅ Teste completo de fluxo
- ✅ Lista de logs de envio
- ✅ Filtros avançados
- ✅ Estatísticas em tempo real
- ✅ Exportação de dados
- ✅ Responsividade mobile

### ✅ Componentes de Espelho de Ponto

**Status:** ✅ **IMPLEMENTADO**

**Componentes Criados:**
- ✅ `components/espelho-ponto-avancado.tsx` - Espelho com período personalizado
- ✅ `components/espelho-ponto-dialog.tsx` - Espelho mensal

**Funcionalidades Implementadas:**
- ✅ Busca de funcionário
- ✅ Seleção de período
- ✅ Exibição de registros
- ✅ Cálculo de totais
- ✅ Assinatura digital
- ✅ Exportação (PDF, Excel, Email)

### ⚠️ Pendências Frontend

#### Relatório de Performance de Gruas
- ⏳ Modal/dialog com detalhes completos da grua (parcial)
- ⏳ Comparativo com período anterior (parcial)
- ⏳ Projeções futuras (não implementado)

#### Sistema WhatsApp
- ⏳ Indicadores visuais no dashboard de aprovações (parcial)
- ⏳ Componente `whatsapp-status-indicator.tsx` (pode estar implementado, verificar)
- ⏳ Integração completa com notificações internas (parcial)

#### Melhorias Gerais
- ⏳ Cache mais robusto para dados de relatórios
- ⏳ Otimização de performance para grandes volumes de dados
- ⏳ Testes automatizados (E2E)
- ⏳ Acessibilidade (WCAG) completa

---

## 📚 Referências

- [README Consolidado](./README-CONSOLIDADO.md) - Documentação geral do projeto
- [README-TESTE-OBRA.md](./README-TESTE-OBRA.md) - Documentação do script de teste automatizado
- [GUIA-TESTE-SINALEIROS.md](./GUIA-TESTE-SINALEIROS.md) - Guia de teste de sinaleiros
- [GUIA-TESTE-WHATSAPP.md](./GUIA-TESTE-WHATSAPP.md) - Guia de teste de WhatsApp

---

**Última atualização:** 2025  
**Versão:** 1.0  
**Responsável:** Equipe de Desenvolvimento

