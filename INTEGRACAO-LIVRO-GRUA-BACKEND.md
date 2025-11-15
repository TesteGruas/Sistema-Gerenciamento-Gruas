# Integração Livro da Grua - Ajustes Backend

## 📋 Resumo

Este documento descreve as integrações necessárias no backend para substituir os dados mockados do **Livro da Grua** por dados reais vindos do banco de dados.

## 🎯 Objetivo

Atualmente, o componente `LivroGruaObra` (`components/livro-grua-obra.tsx`) utiliza dados mockados quando as informações não estão disponíveis na API. Este documento lista todos os campos que precisam ser integrados ao backend.

---

## 📊 Estrutura de Dados Necessária

### Tabela: `obra_gruas_configuracao`

A tabela atual `obra_gruas_configuracao` precisa ser expandida para incluir todos os campos abaixo. Alternativamente, pode ser criada uma nova tabela `obra_gruas_locacao` para dados específicos de locação.

#### Campos Atuais (já existentes)
```sql
- obra_id (integer)
- grua_id (string)
- posicao_x (number, nullable)
- posicao_y (number, nullable)
- posicao_z (number, nullable)
- angulo_rotacao (number, default: 0)
- alcance_operacao (number, nullable)
- area_cobertura (jsonb, nullable)
- data_instalacao (date, nullable)
- observacoes (text, nullable)
- status (string, default: 'ativa')
```

#### Campos Novos Necessários

##### 1. Parâmetros Técnicos da Grua
```sql
-- Tipo de base da grua
tipo_base VARCHAR(50) DEFAULT 'chumbador', -- 'chumbador', 'fixa', 'móvel', etc.

-- Alturas
altura_inicial DECIMAL(10,2), -- Altura inicial em metros
altura_final DECIMAL(10,2),   -- Altura final em metros

-- Velocidades
velocidade_giro DECIMAL(10,2),        -- Velocidade de giro em rpm
velocidade_elevacao DECIMAL(10,2),    -- Velocidade de elevação em m/min
velocidade_translacao DECIMAL(10,2),  -- Velocidade de translação em m/min

-- Especificações Elétricas
potencia_instalada DECIMAL(10,2),      -- Potência instalada em kVA
voltagem VARCHAR(10),                  -- Voltagem (ex: '380', '220')
tipo_ligacao VARCHAR(20),              -- 'monofasica', 'trifasica'

-- Capacidades
capacidade_ponta DECIMAL(10,2),        -- Capacidade na ponta em kg
capacidade_maxima_raio DECIMAL(10,2),  -- Capacidade máxima por raio em kg

-- Informações Gerais
ano_fabricacao INTEGER,                -- Ano de fabricação
vida_util INTEGER,                     -- Vida útil estimada em anos
```

##### 2. Localização e Ambiente
```sql
-- Fundação
fundacao VARCHAR(100),                 -- Tipo de fundação
fundacao_tipo VARCHAR(100),            -- Tipo específico de fundação
fundacao_dimensoes TEXT,               -- Dimensões da fundação
fundacao_especificacoes TEXT,          -- Especificações técnicas da fundação

-- Localização
local_instalacao VARCHAR(200),        -- Local de instalação
local VARCHAR(200),                    -- Local (alternativo)
coordenadas VARCHAR(100),              -- Coordenadas geográficas (lat, lng)

-- Ambiente
condicoes_ambiente TEXT,               -- Condições do ambiente
ambiente TEXT,                         -- Ambiente (alternativo)
```

##### 3. Período de Locação
```sql
-- Datas (já podem existir, mas validar)
data_inicio_locacao DATE,             -- Data de início da locação
data_fim_locacao DATE,                 -- Data de fim da locação
```

##### 4. Valores e Custos
```sql
-- Valores principais
valor_locacao DECIMAL(12,2),           -- Valor de locação mensal
valor_locacao_mensal DECIMAL(12,2),   -- Valor de locação mensal (alternativo)

-- Valores detalhados
valor_operador DECIMAL(12,2),         -- Valor do operador/sinaleiro
valor_manutencao DECIMAL(12,2),       -- Valor de manutenção preventiva
valor_estaiamento DECIMAL(12,2),      -- Valor de estaiamento por unidade
valor_chumbadores DECIMAL(12,2),      -- Valor de chumbadores
valor_montagem DECIMAL(12,2),         -- Valor de montagem
valor_desmontagem DECIMAL(12,2),      -- Valor de desmontagem
valor_transporte DECIMAL(12,2),        -- Valor de transporte ida/volta por viagem
valor_hora_extra DECIMAL(12,2),       -- Valor de hora extra
valor_seguro DECIMAL(12,2),           -- Valor do seguro responsabilidade civil
valor_caucao DECIMAL(12,2),           -- Valor de caução/depósito de garantia
```

##### 5. Serviços e Logística
```sql
-- Serviços
guindaste_montagem VARCHAR(50),       -- 'incluso', 'cliente', 'nao_aplicavel'
quantidade_viagens INTEGER,            -- Quantidade de viagens de transporte
alojamento_alimentacao VARCHAR(50),    -- 'incluso', 'cliente', 'nao_aplicavel'
responsabilidade_acessorios TEXT,     -- Texto sobre responsabilidade por acessórios
```

##### 6. Condições Comerciais
```sql
-- Condições
prazo_validade INTEGER,                -- Prazo de validade da proposta em dias
forma_pagamento VARCHAR(50),           -- 'mensal', 'quinzenal', 'semanal', 'unica'
multa_atraso DECIMAL(5,2),             -- Multa por atraso em percentual
reajuste_indice VARCHAR(20),           -- 'igp_m', 'ipca', 'inpc', 'sem_reajuste'
garantia_caucao TEXT,                  -- Texto sobre garantia/caução
retencao_contratual DECIMAL(5,2),     -- Retenção contratual em percentual
```

##### 7. Configuração e Especificações Técnicas
```sql
-- Operação
raio_operacao DECIMAL(10,2),          -- Raio de operação (alcance máximo)
raio DECIMAL(10,2),                    -- Raio (alternativo)
altura DECIMAL(10,2),                  -- Altura de operação
manual_operacao TEXT,                  -- Referência ao manual de operação

-- Procedimentos (booleanos ou flags)
procedimento_montagem BOOLEAN DEFAULT false,
procedimento_operacao BOOLEAN DEFAULT false,
procedimento_desmontagem BOOLEAN DEFAULT false,
```

---

## 🔧 Migração SQL Sugerida

```sql
-- Adicionar novos campos à tabela obra_gruas_configuracao
ALTER TABLE obra_gruas_configuracao
ADD COLUMN IF NOT EXISTS tipo_base VARCHAR(50) DEFAULT 'chumbador',
ADD COLUMN IF NOT EXISTS altura_inicial DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS altura_final DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS velocidade_giro DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS velocidade_elevacao DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS velocidade_translacao DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS potencia_instalada DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS voltagem VARCHAR(10),
ADD COLUMN IF NOT EXISTS tipo_ligacao VARCHAR(20),
ADD COLUMN IF NOT EXISTS capacidade_ponta DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS capacidade_maxima_raio DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER,
ADD COLUMN IF NOT EXISTS vida_util INTEGER,
ADD COLUMN IF NOT EXISTS fundacao VARCHAR(100),
ADD COLUMN IF NOT EXISTS fundacao_tipo VARCHAR(100),
ADD COLUMN IF NOT EXISTS fundacao_dimensoes TEXT,
ADD COLUMN IF NOT EXISTS fundacao_especificacoes TEXT,
ADD COLUMN IF NOT EXISTS local_instalacao VARCHAR(200),
ADD COLUMN IF NOT EXISTS local VARCHAR(200),
ADD COLUMN IF NOT EXISTS coordenadas VARCHAR(100),
ADD COLUMN IF NOT EXISTS condicoes_ambiente TEXT,
ADD COLUMN IF NOT EXISTS ambiente TEXT,
ADD COLUMN IF NOT EXISTS data_inicio_locacao DATE,
ADD COLUMN IF NOT EXISTS data_fim_locacao DATE,
ADD COLUMN IF NOT EXISTS valor_locacao DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_locacao_mensal DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_operador DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_manutencao DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_estaiamento DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_chumbadores DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_montagem DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_desmontagem DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_transporte DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_hora_extra DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_seguro DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS valor_caucao DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS guindaste_montagem VARCHAR(50),
ADD COLUMN IF NOT EXISTS quantidade_viagens INTEGER,
ADD COLUMN IF NOT EXISTS alojamento_alimentacao VARCHAR(50),
ADD COLUMN IF NOT EXISTS responsabilidade_acessorios TEXT,
ADD COLUMN IF NOT EXISTS prazo_validade INTEGER,
ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50),
ADD COLUMN IF NOT EXISTS multa_atraso DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS reajuste_indice VARCHAR(20),
ADD COLUMN IF NOT EXISTS garantia_caucao TEXT,
ADD COLUMN IF NOT EXISTS retencao_contratual DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS raio_operacao DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS raio DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS altura DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS manual_operacao TEXT,
ADD COLUMN IF NOT EXISTS procedimento_montagem BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS procedimento_operacao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS procedimento_desmontagem BOOLEAN DEFAULT false;
```

---

## 🔌 Endpoints da API

### 1. GET `/api/obra-gruas/:obraId`

**Descrição:** Listar gruas de uma obra com todas as configurações

**Resposta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "obra_id": 76,
      "grua_id": "grua-123",
      "status": "ativa",
      "data_instalacao": "2025-01-15",
      
      // Parâmetros técnicos
      "tipo_base": "chumbador",
      "altura_inicial": 15.5,
      "altura_final": 45.0,
      "velocidade_giro": 0.8,
      "velocidade_elevacao": 60.0,
      "velocidade_translacao": 40.0,
      "potencia_instalada": 50.0,
      "voltagem": "380",
      "tipo_ligacao": "trifasica",
      "capacidade_ponta": 2000,
      "capacidade_maxima_raio": 8000,
      "ano_fabricacao": 2020,
      "vida_util": 25,
      
      // Localização
      "fundacao": "Fundação tipo X",
      "fundacao_tipo": "chumbador",
      "fundacao_dimensoes": "2x2x1m",
      "fundacao_especificacoes": "Concreto armado",
      "local_instalacao": "Lado esquerdo da obra",
      "coordenadas": "-8.0476, -34.8770",
      "condicoes_ambiente": "Ambiente urbano, sem ventos fortes",
      
      // Período
      "data_inicio_locacao": "2025-01-15",
      "data_fim_locacao": "2025-12-31",
      
      // Valores
      "valor_locacao": 31600.00,
      "valor_operador": 10200.00,
      "valor_manutencao": 3750.00,
      "valor_estaiamento": 2600.00,
      "valor_chumbadores": 18600.00,
      "valor_montagem": 28750.00,
      "valor_desmontagem": 36700.00,
      "valor_transporte": 7600.00,
      "valor_hora_extra": 150.00,
      "valor_seguro": 5000.00,
      "valor_caucao": 50000.00,
      
      // Serviços
      "guindaste_montagem": "incluso",
      "quantidade_viagens": 2,
      "alojamento_alimentacao": "incluso",
      "responsabilidade_acessorios": "Estropos, caçambas, garfos e baldes fornecidos pela locadora...",
      
      // Condições comerciais
      "prazo_validade": 30,
      "forma_pagamento": "mensal",
      "multa_atraso": 2.0,
      "reajuste_indice": "igp_m",
      "garantia_caucao": "10% do valor total da locação",
      "retencao_contratual": 10.0,
      
      // Configurações técnicas
      "raio_operacao": 50.0,
      "altura": 45.0,
      "manual_operacao": "Manual vinculado à obra",
      "procedimento_montagem": true,
      "procedimento_operacao": true,
      "procedimento_desmontagem": true,
      
      // Dados da grua
      "grua": {
        "id": "grua-123",
        "name": "Grua 001",
        "modelo": "Modelo X",
        "fabricante": "Fabricante Y",
        "tipo": "Grua Torre",
        "capacidade": "1000"
      }
    }
  ]
}
```

### 2. POST `/api/obra-gruas`

**Descrição:** Criar/atualizar configuração de grua na obra

**Body:**
```json
{
  "obra_id": 76,
  "grua_id": "grua-123",
  "tipo_base": "chumbador",
  "altura_inicial": 15.5,
  "altura_final": 45.0,
  "velocidade_giro": 0.8,
  "velocidade_elevacao": 60.0,
  "velocidade_translacao": 40.0,
  "potencia_instalada": 50.0,
  "voltagem": "380",
  "tipo_ligacao": "trifasica",
  "capacidade_ponta": 2000,
  "capacidade_maxima_raio": 8000,
  "ano_fabricacao": 2020,
  "vida_util": 25,
  "fundacao": "Fundação tipo X",
  "local_instalacao": "Lado esquerdo da obra",
  "data_inicio_locacao": "2025-01-15",
  "data_fim_locacao": "2025-12-31",
  "valor_locacao": 31600.00,
  "valor_operador": 10200.00,
  "valor_manutencao": 3750.00,
  "guindaste_montagem": "incluso",
  "quantidade_viagens": 2,
  "prazo_validade": 30,
  "forma_pagamento": "mensal",
  "multa_atraso": 2.0,
  "reajuste_indice": "igp_m",
  "procedimento_montagem": true,
  "procedimento_operacao": true,
  "procedimento_desmontagem": true
}
```

### 3. PUT `/api/obra-gruas/:id`

**Descrição:** Atualizar configuração existente

**Body:** Mesmo formato do POST, mas todos os campos são opcionais (apenas os enviados serão atualizados)

---

## 📝 Schema de Validação (Joi)

```javascript
const obraGruaConfiguracaoSchema = Joi.object({
  obra_id: Joi.number().integer().required(),
  grua_id: Joi.string().required(),
  
  // Parâmetros técnicos
  tipo_base: Joi.string().valid('chumbador', 'fixa', 'móvel').allow(null, ''),
  altura_inicial: Joi.number().min(0).allow(null),
  altura_final: Joi.number().min(0).allow(null),
  velocidade_giro: Joi.number().min(0).allow(null),
  velocidade_elevacao: Joi.number().min(0).allow(null),
  velocidade_translacao: Joi.number().min(0).allow(null),
  potencia_instalada: Joi.number().min(0).allow(null),
  voltagem: Joi.string().allow(null, ''),
  tipo_ligacao: Joi.string().valid('monofasica', 'trifasica').allow(null, ''),
  capacidade_ponta: Joi.number().min(0).allow(null),
  capacidade_maxima_raio: Joi.number().min(0).allow(null),
  ano_fabricacao: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
  vida_util: Joi.number().integer().min(0).allow(null),
  
  // Localização
  fundacao: Joi.string().max(100).allow(null, ''),
  fundacao_tipo: Joi.string().max(100).allow(null, ''),
  fundacao_dimensoes: Joi.string().allow(null, ''),
  fundacao_especificacoes: Joi.string().allow(null, ''),
  local_instalacao: Joi.string().max(200).allow(null, ''),
  local: Joi.string().max(200).allow(null, ''),
  coordenadas: Joi.string().max(100).allow(null, ''),
  condicoes_ambiente: Joi.string().allow(null, ''),
  ambiente: Joi.string().allow(null, ''),
  
  // Período
  data_inicio_locacao: Joi.date().allow(null),
  data_fim_locacao: Joi.date().allow(null),
  
  // Valores
  valor_locacao: Joi.number().min(0).allow(null),
  valor_locacao_mensal: Joi.number().min(0).allow(null),
  valor_operador: Joi.number().min(0).allow(null),
  valor_manutencao: Joi.number().min(0).allow(null),
  valor_estaiamento: Joi.number().min(0).allow(null),
  valor_chumbadores: Joi.number().min(0).allow(null),
  valor_montagem: Joi.number().min(0).allow(null),
  valor_desmontagem: Joi.number().min(0).allow(null),
  valor_transporte: Joi.number().min(0).allow(null),
  valor_hora_extra: Joi.number().min(0).allow(null),
  valor_seguro: Joi.number().min(0).allow(null),
  valor_caucao: Joi.number().min(0).allow(null),
  
  // Serviços
  guindaste_montagem: Joi.string().valid('incluso', 'cliente', 'nao_aplicavel').allow(null, ''),
  quantidade_viagens: Joi.number().integer().min(0).allow(null),
  alojamento_alimentacao: Joi.string().valid('incluso', 'cliente', 'nao_aplicavel').allow(null, ''),
  responsabilidade_acessorios: Joi.string().allow(null, ''),
  
  // Condições comerciais
  prazo_validade: Joi.number().integer().min(0).allow(null),
  forma_pagamento: Joi.string().valid('mensal', 'quinzenal', 'semanal', 'unica').allow(null, ''),
  multa_atraso: Joi.number().min(0).max(100).allow(null),
  reajuste_indice: Joi.string().valid('igp_m', 'ipca', 'inpc', 'sem_reajuste').allow(null, ''),
  garantia_caucao: Joi.string().allow(null, ''),
  retencao_contratual: Joi.number().min(0).max(100).allow(null),
  
  // Configurações técnicas
  raio_operacao: Joi.number().min(0).allow(null),
  raio: Joi.number().min(0).allow(null),
  altura: Joi.number().min(0).allow(null),
  manual_operacao: Joi.string().allow(null, ''),
  procedimento_montagem: Joi.boolean().allow(null),
  procedimento_operacao: Joi.boolean().allow(null),
  procedimento_desmontagem: Joi.boolean().allow(null),
  
  // Campos existentes
  posicao_x: Joi.number().allow(null),
  posicao_y: Joi.number().allow(null),
  posicao_z: Joi.number().allow(null),
  angulo_rotacao: Joi.number().default(0),
  alcance_operacao: Joi.number().allow(null),
  area_cobertura: Joi.object().allow(null),
  data_instalacao: Joi.date().allow(null),
  observacoes: Joi.string().allow(null, ''),
  status: Joi.string().valid('ativa', 'inativa', 'finalizada').default('ativa')
})
```

---

## 🔄 Integração com Sinaleiros

### Endpoint: GET `/api/obras/:obraId`

**Descrição:** O endpoint já deve retornar os sinaleiros da obra

**Resposta Esperada (seção sinaleiros):**
```json
{
  "success": true,
  "data": {
    "id": 76,
    "name": "Obra X",
    // ... outros campos da obra
    "sinaleiros_obra": [
      {
        "id": "uuid-sinaleiro-1",
        "obra_id": 76,
        "nome": "João Silva",
        "rg_cpf": "123.456.789-00",
        "cpf": "123.456.789-00",
        "rg": "12.345.678-9",
        "telefone": "81999999999",
        "email": "joao@example.com",
        "tipo": "principal",
        "tipo_vinculo": "interno",
        "documentos": [
          {
            "id": "uuid-doc-1",
            "tipo": "cnh",
            "nome": "CNH",
            "arquivo": "url-do-arquivo"
          }
        ],
        "certificados": [
          {
            "id": "uuid-cert-1",
            "nome": "NR-35 - Trabalho em Altura",
            "tipo": "nr35",
            "numero": "NR35-2024-001",
            "validade": "2025-12-31",
            "arquivo": "url-do-arquivo"
          }
        ]
      }
    ]
  }
}
```

**Nota:** Se os sinaleiros não estiverem sendo retornados, é necessário incluir na query do endpoint `/api/obras/:obraId` um JOIN com a tabela `sinaleiros_obra` e suas relações com documentos e certificados.

---

## 📋 Checklist de Implementação

### Fase 1: Estrutura do Banco de Dados
- [ ] Criar migration SQL para adicionar novos campos à `obra_gruas_configuracao`
- [ ] Validar tipos de dados e constraints
- [ ] Criar índices necessários (se aplicável)

### Fase 2: Backend - Rotas e Validação
- [ ] Atualizar schema de validação Joi
- [ ] Atualizar endpoint `GET /api/obra-gruas/:obraId` para retornar todos os campos
- [ ] Atualizar endpoint `POST /api/obra-gruas` para aceitar todos os campos
- [ ] Atualizar endpoint `PUT /api/obra-gruas/:id` para atualizar todos os campos
- [ ] Adicionar validações de negócio (ex: data_fim > data_inicio)

### Fase 3: Integração com Sinaleiros
- [ ] Verificar se endpoint `GET /api/obras/:obraId` retorna sinaleiros
- [ ] Se não, adicionar JOIN com tabela `sinaleiros_obra`
- [ ] Incluir documentos e certificados dos sinaleiros na resposta

### Fase 4: Testes
- [ ] Testar criação de configuração com todos os campos
- [ ] Testar atualização parcial de campos
- [ ] Testar listagem com todos os campos
- [ ] Validar que dados mockados não são mais necessários no frontend

---

## 🚨 Observações Importantes

1. **Compatibilidade:** Manter compatibilidade com dados existentes. Campos novos devem ser opcionais (nullable).

2. **Valores Padrão:** Não definir valores padrão no banco para campos de valores monetários. Deixar null e tratar no frontend.

3. **Validações:** 
   - `data_fim_locacao` deve ser >= `data_inicio_locacao`
   - Valores monetários devem ser >= 0
   - Percentuais (multa_atraso, retencao_contratual) devem estar entre 0 e 100

4. **Performance:** Considerar criar índices em campos frequentemente consultados:
   - `obra_id`
   - `grua_id`
   - `status`
   - `data_inicio_locacao`
   - `data_fim_locacao`

5. **Segurança:** Validar permissões nos endpoints:
   - `obras:visualizar` para GET
   - `obras:editar` para POST/PUT

---

## 📞 Contato

Em caso de dúvidas sobre a implementação, consultar:
- Componente frontend: `components/livro-grua-obra.tsx`
- Dados mockados: Linhas 243-281 do componente
- API atual: `lib/api-obra-gruas.ts`

---

## 📅 Prioridades

### Alta Prioridade (Crítico)
1. Valores e custos (campos `valor_*`)
2. Período de locação (`data_inicio_locacao`, `data_fim_locacao`)
3. Sinaleiros (já deve estar na API de obras)

### Média Prioridade (Importante)
4. Parâmetros técnicos da grua
5. Localização e ambiente
6. Serviços e logística

### Baixa Prioridade (Melhorias)
7. Condições comerciais
8. Configurações técnicas avançadas

---

**Última atualização:** Janeiro 2025

