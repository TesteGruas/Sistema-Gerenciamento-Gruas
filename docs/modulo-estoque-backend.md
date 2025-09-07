# Documentação - Módulo de Estoque - Backend

## Visão Geral

Este documento descreve as entidades/models e relacionamentos necessários para implementar o backend do módulo de estoque do sistema de gerenciamento. O módulo permite o controle de entrada/saída de materiais por obra/grua, alertas de estoque mínimo e exportação para planilhas.

## Entidades Principais

### 1. Produto (Product)

**Tabela: `produtos`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | VARCHAR(10) | Identificador único do produto | PK, NOT NULL, UNIQUE |
| `nome` | VARCHAR(255) | Nome do produto | NOT NULL |
| `descricao` | TEXT | Descrição detalhada | NULL |
| `categoria_id` | INT | ID da categoria | FK, NOT NULL |
| `unidade_medida` | VARCHAR(20) | Unidade de medida | NOT NULL, valores: 'unidades', 'metros', 'litros', 'kg', 'toneladas' |
| `estoque_minimo` | DECIMAL(10,2) | Quantidade mínima em estoque | NOT NULL, DEFAULT 0 |
| `estoque_maximo` | DECIMAL(10,2) | Quantidade máxima em estoque | NULL |
| `valor_unitario` | DECIMAL(10,2) | Valor unitário do produto | NOT NULL, DEFAULT 0 |
| `codigo_barras` | VARCHAR(50) | Código de barras | UNIQUE, NULL |
| `localizacao` | VARCHAR(255) | Localização no estoque | NULL |
| `status` | ENUM | Status do produto | DEFAULT 'Ativo', valores: 'Ativo', 'Inativo', 'Descontinuado' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2. Categoria (Category)

**Tabela: `categorias`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(100) | Nome da categoria | NOT NULL, UNIQUE |
| `descricao` | TEXT | Descrição da categoria | NULL |
| `categoria_pai_id` | INT | ID da categoria pai (para subcategorias) | FK, NULL |
| `status` | ENUM | Status da categoria | DEFAULT 'Ativa', valores: 'Ativa', 'Inativa' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 3. Fornecedor (Supplier)

**Tabela: `fornecedores`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `nome` | VARCHAR(255) | Nome da empresa fornecedora | NOT NULL |
| `cnpj` | VARCHAR(18) | CNPJ da empresa | UNIQUE, NULL |
| `contato` | VARCHAR(255) | Nome do contato | NULL |
| `telefone` | VARCHAR(20) | Telefone de contato | NULL |
| `email` | VARCHAR(255) | E-mail de contato | NULL |
| `endereco` | VARCHAR(255) | Endereço da empresa | NULL |
| `cidade` | VARCHAR(100) | Cidade | NULL |
| `estado` | VARCHAR(2) | Estado (UF) | NULL |
| `cep` | VARCHAR(10) | CEP | NULL |
| `status` | ENUM | Status do fornecedor | DEFAULT 'Ativo', valores: 'Ativo', 'Inativo', 'Bloqueado' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 4. Estoque (Stock)

**Tabela: `estoque`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `produto_id` | VARCHAR(10) | ID do produto | FK, NOT NULL |
| `quantidade_atual` | DECIMAL(10,2) | Quantidade atual em estoque | NOT NULL, DEFAULT 0 |
| `quantidade_reservada` | DECIMAL(10,2) | Quantidade reservada | DEFAULT 0 |
| `quantidade_disponivel` | DECIMAL(10,2) | Quantidade disponível (atual - reservada) | NOT NULL, DEFAULT 0 |
| `valor_total` | DECIMAL(12,2) | Valor total do estoque | NOT NULL, DEFAULT 0 |
| `ultima_movimentacao` | TIMESTAMP | Data da última movimentação | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 5. Movimentação de Estoque (Stock Movement)

**Tabela: `movimentacoes_estoque`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | VARCHAR(10) | Identificador único | PK, NOT NULL, UNIQUE |
| `produto_id` | VARCHAR(10) | ID do produto | FK, NOT NULL |
| `tipo` | ENUM | Tipo de movimentação | NOT NULL, valores: 'Entrada', 'Saída', 'Ajuste', 'Transferência' |
| `quantidade` | DECIMAL(10,2) | Quantidade movimentada | NOT NULL |
| `valor_unitario` | DECIMAL(10,2) | Valor unitário na movimentação | NULL |
| `valor_total` | DECIMAL(12,2) | Valor total da movimentação | NULL |
| `data_movimentacao` | TIMESTAMP | Data da movimentação | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `responsavel_id` | INT | ID do responsável | FK, NULL |
| `obra_id` | INT | ID da obra (para saídas) | FK, NULL |
| `grua_id` | VARCHAR(10) | ID da grua (para saídas) | FK, NULL |
| `fornecedor_id` | INT | ID do fornecedor (para entradas) | FK, NULL |
| `numero_documento` | VARCHAR(50) | Número do documento (NF, pedido, etc.) | NULL |
| `observacoes` | TEXT | Observações da movimentação | NULL |
| `status` | ENUM | Status da movimentação | DEFAULT 'Confirmada', valores: 'Pendente', 'Confirmada', 'Cancelada' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |

### 6. Reserva de Estoque (Stock Reservation)

**Tabela: `reservas_estoque`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `produto_id` | VARCHAR(10) | ID do produto | FK, NOT NULL |
| `quantidade_reservada` | DECIMAL(10,2) | Quantidade reservada | NOT NULL |
| `obra_id` | INT | ID da obra | FK, NOT NULL |
| `grua_id` | VARCHAR(10) | ID da grua | FK, NULL |
| `data_reserva` | TIMESTAMP | Data da reserva | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `data_vencimento` | TIMESTAMP | Data de vencimento da reserva | NULL |
| `responsavel_id` | INT | ID do responsável | FK, NOT NULL |
| `observacoes` | TEXT | Observações da reserva | NULL |
| `status` | ENUM | Status da reserva | DEFAULT 'Ativa', valores: 'Ativa', 'Utilizada', 'Cancelada', 'Vencida' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 7. Alerta de Estoque (Stock Alert)

**Tabela: `alertas_estoque`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `produto_id` | VARCHAR(10) | ID do produto | FK, NOT NULL |
| `tipo_alerta` | ENUM | Tipo de alerta | NOT NULL, valores: 'Estoque Baixo', 'Estoque Zero', 'Estoque Alto', 'Vencimento' |
| `quantidade_atual` | DECIMAL(10,2) | Quantidade atual quando alerta foi gerado | NOT NULL |
| `quantidade_minima` | DECIMAL(10,2) | Quantidade mínima configurada | NOT NULL |
| `data_alerta` | TIMESTAMP | Data do alerta | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `status` | ENUM | Status do alerta | DEFAULT 'Ativo', valores: 'Ativo', 'Resolvido', 'Ignorado' |
| `observacoes` | TEXT | Observações do alerta | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |

### 8. Histórico de Preços (Price History)

**Tabela: `historico_precos`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `produto_id` | VARCHAR(10) | ID do produto | FK, NOT NULL |
| `fornecedor_id` | INT | ID do fornecedor | FK, NULL |
| `valor_anterior` | DECIMAL(10,2) | Valor anterior | NULL |
| `valor_novo` | DECIMAL(10,2) | Novo valor | NOT NULL |
| `data_alteracao` | TIMESTAMP | Data da alteração | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `responsavel_id` | INT | ID do responsável | FK, NULL |
| `observacoes` | TEXT | Observações da alteração | NULL |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |

### 9. Relacionamento Produto-Fornecedor (Product-Supplier Relationship)

**Tabela: `produto_fornecedores`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `produto_id` | VARCHAR(10) | ID do produto | FK, NOT NULL |
| `fornecedor_id` | INT | ID do fornecedor | FK, NOT NULL |
| `codigo_fornecedor` | VARCHAR(50) | Código do produto no fornecedor | NULL |
| `valor_unitario` | DECIMAL(10,2) | Valor unitário do fornecedor | NULL |
| `prazo_entrega` | INT | Prazo de entrega em dias | NULL |
| `status` | ENUM | Status do relacionamento | DEFAULT 'Ativo', valores: 'Ativo', 'Inativo' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 10. Configuração de Alertas (Alert Configuration)

**Tabela: `configuracoes_alertas`**

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | INT | Identificador único | PK, AUTO_INCREMENT |
| `tipo_alerta` | ENUM | Tipo de alerta | NOT NULL, valores: 'Estoque Baixo', 'Estoque Zero', 'Estoque Alto' |
| `percentual_minimo` | DECIMAL(5,2) | Percentual mínimo para alerta | NOT NULL, DEFAULT 20.00 |
| `dias_antecedencia` | INT | Dias de antecedência para alerta | DEFAULT 7 |
| `email_notificacao` | VARCHAR(255) | E-mail para notificação | NULL |
| `status` | ENUM | Status da configuração | DEFAULT 'Ativa', valores: 'Ativa', 'Inativa' |
| `created_at` | TIMESTAMP | Data de criação | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Data de atualização | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

## Relacionamentos

### Relacionamentos Principais

1. **Categoria → Produto** (1:N)
   - Uma categoria pode ter vários produtos
   - Um produto pertence a uma categoria

2. **Produto → Estoque** (1:1)
   - Um produto tem um registro de estoque
   - Um registro de estoque pertence a um produto

3. **Produto → Movimentação de Estoque** (1:N)
   - Um produto pode ter várias movimentações
   - Uma movimentação pertence a um produto

4. **Fornecedor → Movimentação de Estoque** (1:N)
   - Um fornecedor pode ter várias movimentações de entrada
   - Uma movimentação de entrada pode ter um fornecedor

5. **Obra → Movimentação de Estoque** (1:N)
   - Uma obra pode ter várias movimentações de saída
   - Uma movimentação de saída pode ter uma obra

6. **Grua → Movimentação de Estoque** (1:N)
   - Uma grua pode ter várias movimentações de saída
   - Uma movimentação de saída pode ter uma grua

7. **Produto → Reserva de Estoque** (1:N)
   - Um produto pode ter várias reservas
   - Uma reserva pertence a um produto

8. **Obra → Reserva de Estoque** (1:N)
   - Uma obra pode ter várias reservas
   - Uma reserva pertence a uma obra

9. **Produto → Alerta de Estoque** (1:N)
   - Um produto pode ter vários alertas
   - Um alerta pertence a um produto

10. **Produto → Histórico de Preços** (1:N)
    - Um produto pode ter várias alterações de preço
    - Uma alteração de preço pertence a um produto

11. **Produto ↔ Fornecedor** (N:N)
    - Um produto pode ser fornecido por vários fornecedores
    - Um fornecedor pode fornecer vários produtos

## Índices Recomendados

```sql
-- Índices para melhorar performance
CREATE INDEX idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX idx_produtos_status ON produtos(status);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_estoque_produto_id ON estoque(produto_id);
CREATE INDEX idx_estoque_quantidade_atual ON estoque(quantidade_atual);
CREATE INDEX idx_movimentacoes_produto_id ON movimentacoes_estoque(produto_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(data_movimentacao);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);
CREATE INDEX idx_movimentacoes_obra_id ON movimentacoes_estoque(obra_id);
CREATE INDEX idx_movimentacoes_grua_id ON movimentacoes_estoque(grua_id);
CREATE INDEX idx_reservas_produto_id ON reservas_estoque(produto_id);
CREATE INDEX idx_reservas_obra_id ON reservas_estoque(obra_id);
CREATE INDEX idx_reservas_status ON reservas_estoque(status);
CREATE INDEX idx_alertas_produto_id ON alertas_estoque(produto_id);
CREATE INDEX idx_alertas_status ON alertas_estoque(status);
CREATE INDEX idx_alertas_data ON alertas_estoque(data_alerta);
```

## Triggers Recomendados

### 1. Atualizar Quantidade Disponível
```sql
DELIMITER //
CREATE TRIGGER tr_atualizar_quantidade_disponivel
AFTER UPDATE ON estoque
FOR EACH ROW
BEGIN
    UPDATE estoque 
    SET quantidade_disponivel = NEW.quantidade_atual - NEW.quantidade_reservada
    WHERE id = NEW.id;
END//
DELIMITER ;
```

### 2. Atualizar Valor Total do Estoque
```sql
DELIMITER //
CREATE TRIGGER tr_atualizar_valor_total_estoque
AFTER UPDATE ON estoque
FOR EACH ROW
BEGIN
    DECLARE valor_unitario DECIMAL(10,2);
    
    SELECT valor_unitario INTO valor_unitario
    FROM produtos
    WHERE id = NEW.produto_id;
    
    UPDATE estoque 
    SET valor_total = NEW.quantidade_atual * valor_unitario
    WHERE id = NEW.id;
END//
DELIMITER ;
```

### 3. Gerar Alertas de Estoque Baixo
```sql
DELIMITER //
CREATE TRIGGER tr_gerar_alerta_estoque_baixo
AFTER UPDATE ON estoque
FOR EACH ROW
BEGIN
    DECLARE estoque_minimo DECIMAL(10,2);
    
    SELECT estoque_minimo INTO estoque_minimo
    FROM produtos
    WHERE id = NEW.produto_id;
    
    IF NEW.quantidade_atual <= estoque_minimo THEN
        INSERT INTO alertas_estoque (produto_id, tipo_alerta, quantidade_atual, quantidade_minima)
        VALUES (NEW.produto_id, 'Estoque Baixo', NEW.quantidade_atual, estoque_minimo);
    END IF;
END//
DELIMITER ;
```

### 4. Atualizar Estoque após Movimentação
```sql
DELIMITER //
CREATE TRIGGER tr_atualizar_estoque_movimentacao
AFTER INSERT ON movimentacoes_estoque
FOR EACH ROW
BEGIN
    IF NEW.tipo = 'Entrada' THEN
        UPDATE estoque 
        SET quantidade_atual = quantidade_atual + NEW.quantidade,
            ultima_movimentacao = NEW.data_movimentacao
        WHERE produto_id = NEW.produto_id;
    ELSEIF NEW.tipo = 'Saída' THEN
        UPDATE estoque 
        SET quantidade_atual = quantidade_atual - NEW.quantidade,
            ultima_movimentacao = NEW.data_movimentacao
        WHERE produto_id = NEW.produto_id;
    END IF;
END//
DELIMITER ;
```

## Views Úteis

### 1. View de Estoque com Informações Completas
```sql
CREATE VIEW vw_estoque_completo AS
SELECT 
    e.*,
    p.nome as produto_nome,
    p.descricao,
    p.unidade_medida,
    p.estoque_minimo,
    p.estoque_maximo,
    p.valor_unitario,
    p.localizacao,
    c.nome as categoria_nome,
    CASE 
        WHEN e.quantidade_atual <= p.estoque_minimo THEN 'Estoque Baixo'
        WHEN e.quantidade_atual <= p.estoque_minimo * 1.5 THEN 'Atenção'
        ELSE 'Normal'
    END as status_estoque
FROM estoque e
JOIN produtos p ON e.produto_id = p.id
JOIN categorias c ON p.categoria_id = c.id;
```

### 2. View de Movimentações Detalhadas
```sql
CREATE VIEW vw_movimentacoes_detalhadas AS
SELECT 
    m.*,
    p.nome as produto_nome,
    p.unidade_medida,
    o.nome as obra_nome,
    g.modelo as grua_modelo,
    f.nome as fornecedor_nome,
    u.nome as responsavel_nome
FROM movimentacoes_estoque m
JOIN produtos p ON m.produto_id = p.id
LEFT JOIN obras o ON m.obra_id = o.id
LEFT JOIN gruas g ON m.grua_id = g.id
LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
LEFT JOIN usuarios u ON m.responsavel_id = u.id;
```

### 3. View de Alertas de Estoque
```sql
CREATE VIEW vw_alertas_estoque AS
SELECT 
    a.*,
    p.nome as produto_nome,
    p.unidade_medida,
    c.nome as categoria_nome,
    e.quantidade_atual,
    e.quantidade_reservada,
    e.quantidade_disponivel
FROM alertas_estoque a
JOIN produtos p ON a.produto_id = p.id
JOIN categorias c ON p.categoria_id = c.id
JOIN estoque e ON p.id = e.produto_id
WHERE a.status = 'Ativo';
```

## APIs Recomendadas

### Endpoints Principais

1. **Produtos**
   - `GET /api/produtos` - Listar produtos
   - `GET /api/produtos/{id}` - Obter produto específico
   - `POST /api/produtos` - Criar produto
   - `PUT /api/produtos/{id}` - Atualizar produto
   - `DELETE /api/produtos/{id}` - Deletar produto

2. **Estoque**
   - `GET /api/estoque` - Listar estoque
   - `GET /api/estoque/{produto_id}` - Obter estoque de produto
   - `GET /api/estoque/baixo` - Listar itens com estoque baixo
   - `POST /api/estoque/ajuste` - Fazer ajuste de estoque

3. **Movimentações**
   - `GET /api/movimentacoes` - Listar movimentações
   - `POST /api/movimentacoes` - Registrar movimentação
   - `GET /api/movimentacoes/produto/{id}` - Movimentações de um produto
   - `GET /api/movimentacoes/obra/{id}` - Movimentações de uma obra

4. **Reservas**
   - `GET /api/reservas` - Listar reservas
   - `POST /api/reservas` - Criar reserva
   - `PUT /api/reservas/{id}` - Atualizar reserva
   - `DELETE /api/reservas/{id}` - Cancelar reserva

5. **Alertas**
   - `GET /api/alertas` - Listar alertas ativos
   - `PUT /api/alertas/{id}/resolver` - Resolver alerta
   - `GET /api/alertas/estoque-baixo` - Alertas de estoque baixo

6. **Relatórios**
   - `GET /api/relatorios/estoque` - Relatório de estoque
   - `GET /api/relatorios/movimentacoes` - Relatório de movimentações
   - `GET /api/relatorios/valor-estoque` - Relatório de valor do estoque
   - `GET /api/relatorios/exportar-excel` - Exportar para Excel

## Funcionalidades Específicas

### 1. Controle de Entrada/Saída por Obra/Grua

- **Entrada**: Registro de compras, doações, devoluções
- **Saída**: Uso em obras específicas, manutenção de gruas
- **Rastreabilidade**: Histórico completo de movimentações
- **Associação**: Vinculação com obras e gruas específicas

### 2. Alertas de Estoque Mínimo

- **Configuração**: Percentual mínimo configurável por produto
- **Notificações**: E-mail automático quando estoque baixa
- **Dashboard**: Indicadores visuais de status do estoque
- **Relatórios**: Lista de itens que precisam de reposição

### 3. Exportação para Planilha

- **Formatos**: Excel (.xlsx), CSV
- **Dados**: Estoque atual, movimentações, alertas
- **Filtros**: Por categoria, período, status
- **Agendamento**: Exportação automática programada

## Considerações de Segurança

1. **Validação de Dados**
   - Quantidades não podem ser negativas
   - Valores monetários devem ser positivos
   - Datas devem ser válidas e lógicas

2. **Controle de Acesso**
   - Apenas usuários autorizados podem fazer movimentações
   - Logs de auditoria para todas as operações
   - Controle de permissões por tipo de operação

3. **Integridade**
   - Não permitir saída maior que estoque disponível
   - Validação de reservas antes de confirmação
   - Controle de concorrência em movimentações

## Relatórios Sugeridos

1. **Relatório de Estoque Atual**
2. **Relatório de Movimentações por Período**
3. **Relatório de Itens com Estoque Baixo**
4. **Relatório de Valor do Estoque**
5. **Relatório de Consumo por Obra**
6. **Relatório de Consumo por Grua**
7. **Relatório de Fornecedores**
8. **Relatório de Alertas de Estoque**
9. **Relatório de Reservas Ativas**
10. **Relatório de Histórico de Preços**

Esta estrutura de banco de dados fornece uma base sólida para o sistema de controle de estoque, permitindo rastreabilidade completa, alertas automáticos e integração com o módulo de gruas e obras.
