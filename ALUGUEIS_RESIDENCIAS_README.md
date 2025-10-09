# 🏠 Sistema de Aluguéis de Residências - Documentação para Integração Backend

## 📋 Visão Geral

O módulo de Aluguéis de Residências gerencia imóveis que a empresa disponibiliza para funcionários, controlando contratos, pagamentos, subsídios e histórico de ocupação.

**Localização Frontend:** `/dashboard/financeiro/alugueis`

**Arquivo de API Mock:** `lib/api-alugueis-residencias.ts`

---

## 🗂️ Estruturas de Dados

### 1. Residência (Residencia)

Representa um imóvel disponível para aluguel.

```typescript
interface Residencia {
  id: string
  nome: string                    // Ex: "Casa Vila Nova"
  endereco: string                // Endereço completo
  cidade: string
  estado: string                  // SP, RJ, MG, etc.
  cep: string
  quartos: number
  banheiros: number
  area: number                    // Área em m²
  valorBase: number               // Valor de referência mensal
  mobiliada: boolean
  disponivel: boolean             // Se está disponível ou ocupada
  dataAquisicao?: string         // Data que a empresa adquiriu/alugou
  observacoes?: string
  fotos?: string[]               // URLs das fotos
  createdAt: string
  updatedAt: string
}
```

### 2. Aluguel de Residência (AluguelResidencia)

Representa um contrato de aluguel entre a empresa e um funcionário.

```typescript
interface AluguelResidencia {
  id: string
  residencia: {
    id: string
    nome: string
    endereco: string
    cidade: string
    estado: string
    cep: string
    quartos: number
    banheiros: number
    area: number
    mobiliada: boolean
  }
  funcionario: {
    id: string
    nome: string
    cargo: string
    cpf: string
  }
  contrato: {
    dataInicio: string           // Data início do contrato
    dataFim?: string            // Data fim (se encerrado)
    valorMensal: number         // Valor total do aluguel
    diaVencimento: number       // Dia do mês para vencimento (1-28)
    descontoFolha: boolean      // Se desconta direto na folha
    porcentagemDesconto?: number // % que a empresa subsidia (0-100)
  }
  status: 'ativo' | 'encerrado'
  pagamentos: PagamentoAluguel[]
  observacoes?: string
  createdAt: string
  updatedAt: string
}
```

### 3. Pagamento de Aluguel (PagamentoAluguel)

Representa o pagamento mensal de um aluguel.

```typescript
interface PagamentoAluguel {
  id: string
  aluguelId: string
  mes: string                    // Ex: "2024-01"
  dataVencimento: string
  dataPagamento?: string
  valorTotal: number             // Valor total do aluguel
  valorEmpresa: number          // Quanto a empresa paga (subsídio)
  valorFuncionario: number      // Quanto o funcionário paga
  status: 'pendente' | 'pago' | 'atrasado'
  formaPagamento?: string       // Ex: "Transferência", "Desconto em folha"
  comprovante?: string          // URL do comprovante
  observacoes?: string
  createdAt: string
  updatedAt: string
}
```

---

## 🔌 APIs Necessárias

### **RESIDÊNCIAS**

#### 1. **GET** `/api/residencias`
Lista todas as residências cadastradas.

**Query Parameters:**
- `disponivel`: boolean (opcional) - filtrar por disponibilidade
- `cidade`: string (opcional) - filtrar por cidade
- `estado`: string (opcional) - filtrar por estado

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "res-001",
      "nome": "Casa Vila Nova",
      "endereco": "Rua das Flores, 123",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01234-567",
      "quartos": 3,
      "banheiros": 2,
      "area": 120,
      "valorBase": 2500.00,
      "mobiliada": true,
      "disponivel": true,
      "createdAt": "2024-01-10T00:00:00Z",
      "updatedAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

---

#### 2. **GET** `/api/residencias/:id`
Busca uma residência específica por ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "res-001",
    "nome": "Casa Vila Nova",
    "endereco": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "quartos": 3,
    "banheiros": 2,
    "area": 120,
    "valorBase": 2500.00,
    "mobiliada": true,
    "disponivel": true,
    "fotos": ["https://..."],
    "observacoes": "Próximo ao metrô",
    "createdAt": "2024-01-10T00:00:00Z",
    "updatedAt": "2024-01-10T00:00:00Z"
  }
}
```

---

#### 3. **POST** `/api/residencias`
Cadastra uma nova residência.

**Request Body:**
```json
{
  "nome": "Casa Vila Nova",
  "endereco": "Rua das Flores, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567",
  "quartos": 3,
  "banheiros": 2,
  "area": 120,
  "valorBase": 2500.00,
  "mobiliada": true,
  "dataAquisicao": "2024-01-10",
  "observacoes": "Próximo ao metrô"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Residência cadastrada com sucesso",
  "data": {
    "id": "res-001",
    "nome": "Casa Vila Nova",
    "disponivel": true,
    "createdAt": "2024-01-10T00:00:00Z",
    "updatedAt": "2024-01-10T00:00:00Z"
  }
}
```

---

#### 4. **PUT** `/api/residencias/:id`
Atualiza uma residência existente.

**Request Body:** (todos os campos opcionais)
```json
{
  "nome": "Casa Vila Nova - Atualizada",
  "valorBase": 2800.00,
  "observacoes": "Reformada em 2024"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Residência atualizada com sucesso",
  "data": {
    "id": "res-001",
    "updatedAt": "2024-02-15T10:30:00Z"
  }
}
```

---

#### 5. **DELETE** `/api/residencias/:id`
Remove uma residência (apenas se não houver aluguéis ativos).

**Response:**
```json
{
  "success": true,
  "message": "Residência removida com sucesso"
}
```

**Error (se ocupada):**
```json
{
  "success": false,
  "error": "Não é possível remover residência com aluguel ativo"
}
```

---

### **ALUGUÉIS**

#### 6. **GET** `/api/alugueis`
Lista todos os aluguéis cadastrados.

**Query Parameters:**
- `status`: 'ativo' | 'encerrado' (opcional)
- `funcionarioId`: string (opcional)
- `residenciaId`: string (opcional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alug-001",
      "residencia": {
        "id": "res-001",
        "nome": "Casa Vila Nova",
        "endereco": "Rua das Flores, 123",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01234-567",
        "quartos": 3,
        "banheiros": 2,
        "area": 120,
        "mobiliada": true
      },
      "funcionario": {
        "id": "func-001",
        "nome": "João Silva",
        "cargo": "Operador de Grua",
        "cpf": "123.456.789-00"
      },
      "contrato": {
        "dataInicio": "2024-01-01",
        "valorMensal": 2500.00,
        "diaVencimento": 5,
        "descontoFolha": true,
        "porcentagemDesconto": 60
      },
      "status": "ativo",
      "pagamentos": [],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 7. **GET** `/api/alugueis/:id`
Busca um aluguel específico por ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "alug-001",
    "residencia": { ... },
    "funcionario": { ... },
    "contrato": { ... },
    "status": "ativo",
    "pagamentos": [
      {
        "id": "pag-001",
        "mes": "2024-01",
        "valorTotal": 2500.00,
        "valorEmpresa": 1500.00,
        "valorFuncionario": 1000.00,
        "status": "pago",
        "dataPagamento": "2024-01-05"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### 8. **POST** `/api/alugueis`
Cria um novo contrato de aluguel.

**Request Body:**
```json
{
  "residenciaId": "res-001",
  "funcionarioId": "func-001",
  "contrato": {
    "dataInicio": "2024-01-01",
    "valorMensal": 2500.00,
    "diaVencimento": 5,
    "descontoFolha": true,
    "porcentagemDesconto": 60
  },
  "observacoes": "Contrato de 12 meses"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Aluguel criado com sucesso",
  "data": {
    "id": "alug-001",
    "status": "ativo",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Validações:**
- Residência deve existir e estar disponível
- Funcionário deve existir
- `porcentagemDesconto` deve estar entre 0-100

---

#### 9. **PUT** `/api/alugueis/:id`
Atualiza um aluguel existente (apenas alguns campos).

**Request Body:**
```json
{
  "contrato": {
    "valorMensal": 2800.00,
    "porcentagemDesconto": 70
  },
  "observacoes": "Valor atualizado"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Aluguel atualizado com sucesso"
}
```

---

#### 10. **POST** `/api/alugueis/:id/encerrar`
Encerra um contrato de aluguel.

**Request Body:**
```json
{
  "dataFim": "2024-12-31",
  "motivo": "Funcionário transferido"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Aluguel encerrado com sucesso",
  "data": {
    "id": "alug-001",
    "status": "encerrado",
    "contrato": {
      "dataFim": "2024-12-31"
    }
  }
}
```

**Efeito Colateral:**
- Atualiza `residencia.disponivel` para `true`
- Atualiza `aluguel.status` para `encerrado`
- Define `contrato.dataFim`

---

### **PAGAMENTOS**

#### 11. **GET** `/api/alugueis/:aluguelId/pagamentos`
Lista todos os pagamentos de um aluguel.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pag-001",
      "aluguelId": "alug-001",
      "mes": "2024-01",
      "dataVencimento": "2024-01-05",
      "dataPagamento": "2024-01-05",
      "valorTotal": 2500.00,
      "valorEmpresa": 1500.00,
      "valorFuncionario": 1000.00,
      "status": "pago",
      "formaPagamento": "Desconto em folha",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 12. **POST** `/api/alugueis/:aluguelId/pagamentos`
Registra um pagamento de aluguel.

**Request Body:**
```json
{
  "mes": "2024-01",
  "dataPagamento": "2024-01-05",
  "valorTotal": 2500.00,
  "valorEmpresa": 1500.00,
  "valorFuncionario": 1000.00,
  "formaPagamento": "Desconto em folha",
  "comprovante": "https://...",
  "observacoes": "Pagamento confirmado"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pagamento registrado com sucesso",
  "data": {
    "id": "pag-001",
    "status": "pago",
    "createdAt": "2024-01-05T00:00:00Z"
  }
}
```

**Validação:**
- Calcular automaticamente `valorEmpresa` e `valorFuncionario` com base em `porcentagemDesconto`
- Validar que a soma dos valores corresponde ao valor total

---

#### 13. **PUT** `/api/alugueis/:aluguelId/pagamentos/:pagamentoId`
Atualiza o status de um pagamento.

**Request Body:**
```json
{
  "status": "pago",
  "dataPagamento": "2024-01-05",
  "formaPagamento": "PIX",
  "comprovante": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pagamento atualizado com sucesso"
}
```

---

#### 14. **GET** `/api/alugueis/pagamentos/pendentes`
Lista todos os pagamentos pendentes (para facilitar controle).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pag-002",
      "aluguel": {
        "id": "alug-001",
        "residenciaNome": "Casa Vila Nova",
        "funcionarioNome": "João Silva"
      },
      "mes": "2024-02",
      "dataVencimento": "2024-02-05",
      "valorTotal": 2500.00,
      "status": "pendente"
    }
  ]
}
```

---

### **RELATÓRIOS E ESTATÍSTICAS**

#### 15. **GET** `/api/alugueis/estatisticas`
Retorna estatísticas gerais do módulo.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalResidencias": 5,
    "residenciasDisponiveis": 2,
    "residenciasOcupadas": 3,
    "alugueisAtivos": 3,
    "alugueisEncerrados": 2,
    "valorTotalMensal": 7500.00,
    "subsidioEmpresaMensal": 4500.00,
    "descontoFuncionariosMensal": 3000.00,
    "pagamentosPendentes": 2,
    "pagamentosAtrasados": 1
  }
}
```

---

#### 16. **GET** `/api/alugueis/relatorio-financeiro`
Relatório financeiro detalhado por período.

**Query Parameters:**
- `dataInicio`: string (YYYY-MM-DD)
- `dataFim`: string (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "inicio": "2024-01-01",
      "fim": "2024-12-31"
    },
    "totalPago": 30000.00,
    "totalSubsidio": 18000.00,
    "totalDescontado": 12000.00,
    "pagamentosPorMes": [
      {
        "mes": "2024-01",
        "totalPago": 2500.00,
        "subsidio": 1500.00,
        "descontado": 1000.00
      }
    ]
  }
}
```

---

## 🔄 Integrações Necessárias

### 1. **Integração com Funcionários**
- Buscar dados do funcionário ao criar aluguel
- Validar se funcionário existe
- Buscar foto, cargo, CPF para exibição

### 2. **Integração com Folha de Pagamento**
- Se `descontoFolha = true`, enviar valor para desconto automático
- Sincronizar com sistema de RH
- Registrar automaticamente pagamento quando descontado em folha

### 3. **Integração com Financeiro**
- Registrar subsídio da empresa como despesa
- Registrar desconto do funcionário como receita (se aplicável)
- Gerar lançamentos contábeis automáticos

### 4. **Notificações**
- Notificar funcionário 5 dias antes do vencimento
- Notificar RH sobre pagamentos atrasados
- Notificar ao encerrar contrato

### 5. **Upload de Documentos**
- Endpoint para upload de fotos de residências
- Endpoint para upload de comprovantes de pagamento
- Endpoint para upload de contratos assinados

---

## 📊 Regras de Negócio

### Residências
1. Uma residência só pode ter 1 aluguel ativo por vez
2. Não pode deletar residência com aluguel ativo
3. Ao criar aluguel, `residencia.disponivel` deve mudar para `false`
4. Ao encerrar aluguel, `residencia.disponivel` deve mudar para `true`

### Aluguéis
1. `porcentagemDesconto` deve estar entre 0-100
2. `diaVencimento` deve estar entre 1-28
3. Não pode criar aluguel para residência ocupada
4. Ao encerrar, todos os pagamentos pendentes devem ser verificados

### Pagamentos
1. Calcular automaticamente `valorEmpresa` e `valorFuncionario`:
   - `valorEmpresa = valorTotal * (porcentagemDesconto / 100)`
   - `valorFuncionario = valorTotal - valorEmpresa`
2. Status `atrasado` quando `dataVencimento < hoje` e `status = pendente`
3. Gerar pagamentos automaticamente todo mês para contratos ativos

### Cálculos
```javascript
// Funções auxiliares
function calcularSubsidioEmpresa(valorMensal, porcentagemDesconto) {
  if (!porcentagemDesconto) return 0
  return valorMensal * (porcentagemDesconto / 100)
}

function calcularValorFuncionario(valorMensal, porcentagemDesconto) {
  return valorMensal - calcularSubsidioEmpresa(valorMensal, porcentagemDesconto)
}
```

---

## 🔐 Permissões e Segurança

### Permissões Necessárias:
- `alugueis.visualizar` - Ver lista de aluguéis e residências
- `alugueis.criar` - Criar novos aluguéis e residências
- `alugueis.editar` - Editar aluguéis e residências
- `alugueis.deletar` - Deletar residências
- `alugueis.encerrar` - Encerrar contratos
- `alugueis.pagamentos` - Gerenciar pagamentos
- `alugueis.relatorios` - Visualizar relatórios financeiros

### Validações de Segurança:
- Apenas RH e Financeiro podem criar/editar aluguéis
- Funcionário pode ver apenas seus próprios contratos
- Upload de arquivos deve validar extensão e tamanho
- Logs de auditoria para todas as operações

---

## 📱 Funcionalidades Futuras (Opcional)

1. **Portal do Funcionário:**
   - Ver contrato ativo
   - Histórico de pagamentos
   - Solicitar manutenção
   - Avisar saída antecipada

2. **Geração Automática de Pagamentos:**
   - Cron job mensal para criar registros de pagamento
   - Integração com boleto/PIX

3. **Manutenções:**
   - Registro de manutenções nas residências
   - Orçamentos de reparos
   - Histórico de manutenções

4. **Contratos:**
   - Upload de contrato assinado
   - Geração automática de contrato PDF
   - Assinatura digital

5. **Dashboard:**
   - Gráficos de ocupação
   - Previsão de custos mensais
   - Taxa de ocupação histórica

---

## 🗄️ Estrutura de Banco de Dados Sugerida

### Tabela: `residencias`
```sql
CREATE TABLE residencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  cep VARCHAR(10) NOT NULL,
  quartos INTEGER NOT NULL,
  banheiros INTEGER NOT NULL,
  area DECIMAL(10,2) NOT NULL,
  valor_base DECIMAL(10,2) NOT NULL,
  mobiliada BOOLEAN DEFAULT false,
  disponivel BOOLEAN DEFAULT true,
  data_aquisicao DATE,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `alugueis_residencias`
```sql
CREATE TABLE alugueis_residencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residencia_id UUID REFERENCES residencias(id),
  funcionario_id UUID REFERENCES funcionarios(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  valor_mensal DECIMAL(10,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 28),
  desconto_folha BOOLEAN DEFAULT false,
  porcentagem_desconto INTEGER CHECK (porcentagem_desconto BETWEEN 0 AND 100),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `pagamentos_aluguel`
```sql
CREATE TABLE pagamentos_aluguel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluguel_id UUID REFERENCES alugueis_residencias(id),
  mes VARCHAR(7) NOT NULL, -- YYYY-MM
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_empresa DECIMAL(10,2) NOT NULL,
  valor_funcionario DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado')),
  forma_pagamento VARCHAR(100),
  comprovante TEXT,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(aluguel_id, mes)
);
```

### Tabela: `residencias_fotos`
```sql
CREATE TABLE residencias_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residencia_id UUID REFERENCES residencias(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Índices Recomendados:
```sql
CREATE INDEX idx_residencias_disponivel ON residencias(disponivel);
CREATE INDEX idx_residencias_cidade ON residencias(cidade);
CREATE INDEX idx_alugueis_residencia_id ON alugueis_residencias(residencia_id);
CREATE INDEX idx_alugueis_funcionario_id ON alugueis_residencias(funcionario_id);
CREATE INDEX idx_alugueis_status ON alugueis_residencias(status);
CREATE INDEX idx_pagamentos_aluguel_id ON pagamentos_aluguel(aluguel_id);
CREATE INDEX idx_pagamentos_status ON pagamentos_aluguel(status);
CREATE INDEX idx_pagamentos_mes ON pagamentos_aluguel(mes);
```

---

## 🧪 Testes Recomendados

### Testes de API:
1. ✅ Criar residência com sucesso
2. ✅ Listar residências disponíveis
3. ✅ Criar aluguel para residência disponível
4. ❌ Tentar criar aluguel para residência ocupada (deve falhar)
5. ✅ Encerrar aluguel e verificar residência ficar disponível
6. ❌ Deletar residência com aluguel ativo (deve falhar)
7. ✅ Registrar pagamento e calcular valores corretamente
8. ✅ Marcar pagamento como atrasado após vencimento

---

## 📞 Suporte e Contato

Para dúvidas sobre a implementação backend:
- Consultar arquivo mock: `lib/api-alugueis-residencias.ts`
- Ver componente frontend: `app/dashboard/financeiro/alugueis/page.tsx`

---

**Versão:** 1.0  
**Última Atualização:** Outubro 2024  
**Status:** ⏳ Aguardando Implementação Backend

