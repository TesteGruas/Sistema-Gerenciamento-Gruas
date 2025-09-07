# Documentação - Módulo de Gruas - Backend

## Visão Geral

Este documento descreve as entidades/models e relacionamentos necessários para implementar o backend do módulo de gruas do sistema de gerenciamento. O módulo permite o cadastro, controle de disponibilidade e histórico de uso das gruas torre.

## Entidades Principais

### 1. Grua (Crane)

**Tabela: `gruas`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | VARCHAR(10) | Identificador único da grua | PK, NOT NULL, UNIQUE |
| `modelo` | VARCHAR(100) | Modelo da grua | NOT NULL |
| `fabricante` | VARCHAR(100) | Fabricante da grua | NOT NULL |
| `tipo` | ENUM | Tipo da grua | NOT NULL, valores: 'Grua Torre', 'Grua Torre Auto Estável', 'Grua Móvel' |
| `capacidade` | VARCHAR(50) | Capacidade máxima | NOT NULL |
| `capacidade_ponta` | VARCHAR(50) | Capacidade na ponta da lança | NOT NULL |
| `lanca` | VARCHAR(50) | Comprimento da lança | NOT NULL |
| `altura_trabalho` | VARCHAR(50) | Altura de trabalho | NOT NULL |
| `ano` | YEAR | Ano de fabricação | NOT NULL |
| `status` | ENUM | Status atual | NOT NULL, valores: 'Disponível', 'Operacional', 'Manutenção' |
| `localizacao` | VARCHAR(255) | Localização atual | NOT NULL |
| `horas_operacao` | INT | Total de horas de operação | DEFAULT 0 |
| `valor_locacao` | DECIMAL(10,2) | Valor mensal de locação | NOT NULL |
| `valor_operacao` | DECIMAL(10,2) | Valor mensal de operação | NOT NULL |
| `valor_sinaleiro` | DECIMAL(10,2) | Valor mensal do sinaleiro | NOT NULL |
| `valor_manutencao` | DECIMAL(10,2) | Valor mensal de manutenção | NOT NULL |
| `ultima_manutencao` | DATE | Data da última manutenção | NULL |
| `proxima_manutencao` | DATE | Data da próxima manutenção | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2. Cliente (Client)

**Tabela: `clientes`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(255) | Nome da empresa cliente | NOT NULL |
| `cnpj` | VARCHAR(18) | CNPJ da empresa | UNIQUE, formato: XX.XXX.XXX/XXXX-XX |
| `contato` | VARCHAR(255) | Nome do contato | NULL |
| `telefone` | VARCHAR(20) | Telefone de contato | NULL |
| `email` | VARCHAR(255) | E-mail de contato | NULL |
| `endereco` | VARCHAR(255) | Endereço da empresa | NULL |
| `cidade` | VARCHAR(100) | Cidade | NULL |
| `estado` | VARCHAR(2) | Estado (UF) | NULL |
| `cep` | VARCHAR(10) | CEP | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 3. Obra (Project)

**Tabela: `obras`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `cliente_id` | INT | ID do cliente | FK, NOT NULL |
| `nome` | VARCHAR(255) | Nome da obra | NOT NULL |
| `endereco` | VARCHAR(255) | Endereço da obra | NOT NULL |
| `cidade` | VARCHAR(100) | Cidade da obra | NOT NULL |
| `estado` | VARCHAR(2) | Estado da obra | NOT NULL |
| `cep` | VARCHAR(10) | CEP da obra | NULL |
| `tipo` | ENUM | Tipo de obra | NOT NULL, valores: 'Residencial', 'Comercial', 'Industrial', 'Infraestrutura' |
| `contato_obra` | VARCHAR(255) | Nome do contato na obra | NULL |
| `telefone_obra` | VARCHAR(20) | Telefone do contato na obra | NULL |
| `email_obra` | VARCHAR(255) | E-mail do contato na obra | NULL |
| `status` | ENUM | Status da obra | DEFAULT 'Ativa', valores: 'Ativa', 'Pausada', 'Finalizada', 'Cancelada' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 4. Contrato (Contract)

**Tabela: `contratos`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `grua_id` | VARCHAR(10) | ID da grua | FK, NOT NULL |
| `obra_id` | INT | ID da obra | FK, NOT NULL |
| `numero_contrato` | VARCHAR(50) | Número do contrato | UNIQUE, NOT NULL |
| `data_inicio` | DATE | Data de início do contrato | NOT NULL |
| `data_fim` | DATE | Data de fim do contrato | NOT NULL |
| `prazo_meses` | INT | Prazo em meses | NOT NULL |
| `valor_total` | DECIMAL(12,2) | Valor total do contrato | NOT NULL |
| `status` | ENUM | Status do contrato | DEFAULT 'Ativo', valores: 'Ativo', 'Pausado', 'Finalizado', 'Cancelado' |
| `observacoes` | TEXT | Observações do contrato | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 5. Funcionário (Employee)

**Tabela: `funcionarios`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(255) | Nome completo | NOT NULL |
| `cargo` | ENUM | Cargo do funcionário | NOT NULL, valores: 'Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico' |
| `telefone` | VARCHAR(20) | Telefone de contato | NULL |
| `email` | VARCHAR(255) | E-mail | NULL |
| `turno` | ENUM | Turno de trabalho | NOT NULL, valores: 'Diurno', 'Noturno', 'Sob Demanda' |
| `status` | ENUM | Status do funcionário | DEFAULT 'Ativo', valores: 'Ativo', 'Inativo', 'Férias', 'Afastado' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 6. Equipamento Auxiliar (Auxiliary Equipment)

**Tabela: `equipamentos_auxiliares`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(255) | Nome do equipamento | NOT NULL |
| `tipo` | ENUM | Tipo do equipamento | NOT NULL, valores: 'Garfo', 'Balde', 'Caçamba', 'Plataforma', 'Garra', 'Outro' |
| `status` | ENUM | Status do equipamento | DEFAULT 'Ativo', valores: 'Ativo', 'Manutenção', 'Inativo' |
| `responsavel_id` | INT | ID do funcionário responsável | FK, NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 7. Alocação de Funcionário (Employee Allocation)

**Tabela: `alocacoes_funcionarios`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `contrato_id` | INT | ID do contrato | FK, NOT NULL |
| `funcionario_id` | INT | ID do funcionário | FK, NOT NULL |
| `data_inicio` | DATE | Data de início da alocação | NOT NULL |
| `data_fim` | DATE | Data de fim da alocação | NULL |
| `status` | ENUM | Status da alocação | DEFAULT 'Ativa', valores: 'Ativa', 'Finalizada', 'Cancelada' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 8. Alocação de Equipamento (Equipment Allocation)

**Tabela: `alocacoes_equipamentos`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `contrato_id` | INT | ID do contrato | FK, NOT NULL |
| `equipamento_id` | INT | ID do equipamento | FK, NOT NULL |
| `data_inicio` | DATE | Data de início da alocação | NOT NULL |
| `data_fim` | DATE | Data de fim da alocação | NULL |
| `status` | ENUM | Status da alocação | DEFAULT 'Ativa', valores: 'Ativa', 'Finalizada', 'Cancelada' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 9. Histórico de Manutenção (Maintenance History)

**Tabela: `historico_manutencoes`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `grua_id` | VARCHAR(10) | ID da grua | FK, NOT NULL |
| `tipo` | ENUM | Tipo de manutenção | NOT NULL, valores: 'Preventiva', 'Corretiva', 'Preditiva' |
| `data_manutencao` | DATE | Data da manutenção | NOT NULL |
| `descricao` | TEXT | Descrição da manutenção | NOT NULL |
| `tecnico_responsavel` | VARCHAR(255) | Nome do técnico | NULL |
| `custo` | DECIMAL(10,2) | Custo da manutenção | NULL |
| `proxima_manutencao` | DATE | Data da próxima manutenção | NULL |
| `observacoes` | TEXT | Observações | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |

### 10. Proposta Comercial (Commercial Proposal)

**Tabela: `propostas_comerciais`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `grua_id` | VARCHAR(10) | ID da grua | FK, NOT NULL |
| `cliente_id` | INT | ID do cliente | FK, NOT NULL |
| `obra_id` | INT | ID da obra | FK, NULL |
| `numero_proposta` | VARCHAR(50) | Número da proposta | UNIQUE, NOT NULL |
| `data_proposta` | DATE | Data da proposta | NOT NULL |
| `validade` | DATE | Data de validade | NOT NULL |
| `prazo_meses` | INT | Prazo em meses | NOT NULL |
| `altura_final` | VARCHAR(50) | Altura final da obra | NULL |
| `tipo_base` | ENUM | Tipo de base | NULL, valores: 'Base Fixa', 'Base Móvel', 'Trilhos' |
| `voltagem` | VARCHAR(10) | Voltagem necessária | NULL |
| `potencia` | VARCHAR(20) | Potência necessária | NULL |
| `valor_total` | DECIMAL(12,2) | Valor total da proposta | NOT NULL |
| `status` | ENUM | Status da proposta | DEFAULT 'Pendente', valores: 'Pendente', 'Aprovada', 'Rejeitada', 'Expirada' |
| `observacoes` | TEXT | Observações | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

## Relacionamentos

### Relacionamentos Principais

1. **Cliente → Obra** (1:N)
   - Um cliente pode ter várias obras
   - Uma obra pertence a um cliente

2. **Grua → Contrato** (1:N)
   - Uma grua pode ter vários contratos (ao longo do tempo)
   - Um contrato pertence a uma grua

3. **Obra → Contrato** (1:N)
   - Uma obra pode ter vários contratos
   - Um contrato pertence a uma obra

4. **Contrato → Alocação de Funcionário** (1:N)
   - Um contrato pode ter várias alocações de funcionários
   - Uma alocação pertence a um contrato

5. **Contrato → Alocação de Equipamento** (1:N)
   - Um contrato pode ter várias alocações de equipamentos
   - Uma alocação pertence a um contrato

6. **Funcionário → Alocação de Funcionário** (1:N)
   - Um funcionário pode ter várias alocações
   - Uma alocação pertence a um funcionário

7. **Equipamento → Alocação de Equipamento** (1:N)
   - Um equipamento pode ter várias alocações
   - Uma alocação pertence a um equipamento

8. **Grua → Histórico de Manutenção** (1:N)
   - Uma grua pode ter várias manutenções
   - Uma manutenção pertence a uma grua

9. **Grua → Proposta Comercial** (1:N)
   - Uma grua pode ter várias propostas
   - Uma proposta pertence a uma grua

10. **Cliente → Proposta Comercial** (1:N)
    - Um cliente pode ter várias propostas
    - Uma proposta pertence a um cliente

## Índices Recomendados

```sql
-- Índices para melhorar performance
CREATE INDEX idx_gruas_status ON gruas(status);
CREATE INDEX idx_gruas_localizacao ON gruas(localizacao);
CREATE INDEX idx_contratos_grua_id ON contratos(grua_id);
CREATE INDEX idx_contratos_obra_id ON contratos(obra_id);
CREATE INDEX idx_contratos_status ON contratos(status);
CREATE INDEX idx_contratos_data_inicio ON contratos(data_inicio);
CREATE INDEX idx_contratos_data_fim ON contratos(data_fim);
CREATE INDEX idx_historico_manutencoes_grua_id ON historico_manutencoes(grua_id);
CREATE INDEX idx_historico_manutencoes_data ON historico_manutencoes(data_manutencao);
CREATE INDEX idx_propostas_status ON propostas_comerciais(status);
CREATE INDEX idx_propostas_data_proposta ON propostas_comerciais(data_proposta);
```

## Triggers Recomendados

### 1. Atualizar Status da Grua
```sql
DELIMITER //
CREATE TRIGGER tr_atualizar_status_grua
AFTER UPDATE ON contratos
FOR EACH ROW
BEGIN
    IF NEW.status = 'Ativo' AND OLD.status != 'Ativo' THEN
        UPDATE gruas SET status = 'Operacional' WHERE id = NEW.grua_id;
    ELSEIF NEW.status IN ('Finalizado', 'Cancelado') AND OLD.status = 'Ativo' THEN
        UPDATE gruas SET status = 'Disponível' WHERE id = NEW.grua_id;
    END IF;
END//
DELIMITER ;
```

### 2. Calcular Valor Total do Contrato
```sql
DELIMITER //
CREATE TRIGGER tr_calcular_valor_contrato
BEFORE INSERT ON contratos
FOR EACH ROW
BEGIN
    DECLARE valor_mensal DECIMAL(10,2);
    
    SELECT (valor_locacao + valor_operacao + valor_sinaleiro + valor_manutencao)
    INTO valor_mensal
    FROM gruas
    WHERE id = NEW.grua_id;
    
    SET NEW.valor_total = valor_mensal * NEW.prazo_meses;
END//
DELIMITER ;
```

## Views Úteis

### 1. View de Gruas com Status Detalhado
```sql
CREATE VIEW vw_gruas_detalhadas AS
SELECT 
    g.*,
    c.numero_contrato,
    c.status as status_contrato,
    c.data_inicio as inicio_contrato,
    c.data_fim as fim_contrato,
    o.nome as nome_obra,
    cl.nome as nome_cliente
FROM gruas g
LEFT JOIN contratos c ON g.id = c.grua_id AND c.status = 'Ativo'
LEFT JOIN obras o ON c.obra_id = o.id
LEFT JOIN clientes cl ON o.cliente_id = cl.id;
```

### 2. View de Funcionários Alocados
```sql
CREATE VIEW vw_funcionarios_alocados AS
SELECT 
    f.*,
    af.data_inicio,
    af.data_fim,
    af.status as status_alocacao,
    c.numero_contrato,
    g.modelo as modelo_grua,
    o.nome as nome_obra
FROM funcionarios f
JOIN alocacoes_funcionarios af ON f.id = af.funcionario_id
JOIN contratos c ON af.contrato_id = c.id
JOIN gruas g ON c.grua_id = g.id
JOIN obras o ON c.obra_id = o.id
WHERE af.status = 'Ativa';
```

## APIs Recomendadas

### Endpoints Principais

1. **Gruas**
   - `GET /api/gruas` - Listar todas as gruas
   - `GET /api/gruas/{id}` - Obter grua específica
   - `POST /api/gruas` - Criar nova grua
   - `PUT /api/gruas/{id}` - Atualizar grua
   - `DELETE /api/gruas/{id}` - Deletar grua

2. **Contratos**
   - `GET /api/contratos` - Listar contratos
   - `GET /api/contratos/{id}` - Obter contrato específico
   - `POST /api/contratos` - Criar novo contrato
   - `PUT /api/contratos/{id}` - Atualizar contrato

3. **Funcionários**
   - `GET /api/funcionarios` - Listar funcionários
   - `POST /api/funcionarios` - Criar funcionário
   - `PUT /api/funcionarios/{id}` - Atualizar funcionário

4. **Equipamentos**
   - `GET /api/equipamentos` - Listar equipamentos
   - `POST /api/equipamentos` - Criar equipamento
   - `PUT /api/equipamentos/{id}` - Atualizar equipamento

5. **Manutenções**
   - `GET /api/manutencoes` - Listar manutenções
   - `POST /api/manutencoes` - Registrar manutenção
   - `GET /api/gruas/{id}/manutencoes` - Manutenções de uma grua

6. **Propostas**
   - `GET /api/propostas` - Listar propostas
   - `POST /api/propostas` - Criar proposta
   - `PUT /api/propostas/{id}` - Atualizar proposta

## Considerações de Segurança

1. **Validação de Dados**
   - Validar formato de CNPJ
   - Validar datas (início não pode ser posterior ao fim)
   - Validar valores monetários (não negativos)

2. **Permissões**
   - Apenas usuários autorizados podem criar/editar contratos
   - Logs de auditoria para alterações críticas
   - Controle de acesso baseado em roles

3. **Integridade**
   - Não permitir exclusão de gruas com contratos ativos
   - Não permitir exclusão de funcionários com alocações ativas
   - Validação de conflitos de datas em contratos

## Relatórios Sugeridos

1. **Relatório de Disponibilidade de Gruas**
2. **Relatório de Contratos por Período**
3. **Relatório de Manutenções Preventivas**
4. **Relatório de Funcionários por Obra**
5. **Relatório de Equipamentos Alocados**
6. **Relatório de Propostas Comerciais**
7. **Relatório de Faturamento por Cliente**

Esta estrutura de banco de dados fornece uma base sólida para o sistema de gerenciamento de gruas, permitindo controle completo sobre equipamentos, contratos, funcionários e manutenções.
