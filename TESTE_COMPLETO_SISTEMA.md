# 🧪 **GUIA COMPLETO DE TESTES - Sistema de Gerenciamento de Gruas**

## 📋 **Índice**
1. [Configuração Inicial](#configuração-inicial)
2. [Credenciais de Acesso](#credenciais-de-acesso)
3. [Entidades do Sistema](#entidades-do-sistema)
4. [Fluxos de Teste por Módulo](#fluxos-de-teste-por-módulo)
5. [Validações e Regras de Negócio](#validações-e-regras-de-negócio)
6. [Relações entre Entidades](#relações-entre-entidades)
7. [Cenários de Teste](#cenários-de-teste)
8. [Checklist de Validação](#checklist-de-validação)

---

## 🚀 **Configuração Inicial**

### **1. Iniciar Servidores**
```bash
# Backend (Terminal 1)
cd backend-api
npm install
npm start

# Frontend (Terminal 2)
cd /Users/samuellinkon/Desktop/projeto-grua-final/Sistema-Gerenciamento-Gruas
npm install
npm run dev
```

### **2. URLs de Acesso**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Documentação Swagger**: http://localhost:3001/api-docs
- **PWA**: http://localhost:3000/pwa

---

## 🔐 **Credenciais de Acesso**

### **Credenciais Padrão**
```
Email: admin@admin.com
Senha: teste@123
```

### **Credenciais PWA**
```
Usuário: admin@admin.com
Senha: teste@123
```

---

## 🏗️ **Entidades do Sistema**

### **1. Entidades Principais**
| Entidade | Descrição | Campos Obrigatórios |
|----------|-----------|-------------------|
| **Usuários** | Sistema de autenticação | nome, email, perfil_id |
| **Funcionários** | Cadastro de funcionários | nome, cpf, cargo, salario |
| **Clientes** | Cadastro de clientes | nome, cnpj/cpf, telefone |
| **Obras** | Projetos de construção | nome, endereco, cliente_id |
| **Gruas** | Equipamentos de elevação | nome, modelo, capacidade |
| **Produtos** | Catálogo de produtos/serviços | nome, categoria, preco, tipo |

### **2. Entidades Financeiras**
| Entidade | Descrição | Campos Obrigatórios |
|----------|-----------|-------------------|
| **Receitas** | Entrada de dinheiro | obra_id, tipo, valor, data_receita |
| **Custos** | Saída de dinheiro | obra_id, tipo, valor, data_custo |
| **Contratos** | Acordos comerciais | cliente_id, tipo, valor_total |
| **Orçamentos** | Propostas comerciais | cliente_id, itens, valor_total |
| **Locações** | Aluguel de equipamentos | grua_id, obra_id, data_inicio, data_fim |

### **3. Entidades de RH**
| Entidade | Descrição | Campos Obrigatórios |
|----------|-----------|-------------------|
| **Ponto Eletrônico** | Registro de horas | funcionario_id, data, entrada |
| **Férias** | Controle de férias | funcionario_id, data_inicio, data_fim |
| **Vales** | Antecipação salarial | funcionario_id, valor, data |
| **Remuneração** | Cálculo de salários | funcionario_id, mes, ano |

### **4. Entidades de Controle**
| Entidade | Descrição | Campos Obrigatórios |
|----------|-----------|-------------------|
| **Notificações** | Sistema de alertas | titulo, mensagem, destinatario_id |
| **Assinaturas** | Documentos assinados | funcionario_id, documento_tipo |
| **Relatórios** | Geração de relatórios | nome, tipo, parametros |
| **Configurações** | Configurações do sistema | chave, valor, tipo |

---

## 🔄 **Fluxos de Teste por Módulo**

### **MÓDULO 1: AUTENTICAÇÃO E USUÁRIOS**

#### **1.1 Login e Autenticação**
```bash
# Teste 1: Login com credenciais válidas
POST /api/auth/login
{
  "email": "admin@admin.com",
  "password": "teste@123"
}

# Teste 2: Login com credenciais inválidas
POST /api/auth/login
{
  "email": "admin@admin.com",
  "password": "senha_errada"
}

# Teste 3: Verificar token de autenticação
GET /api/users/test-auth
Authorization: Bearer {token}
```

#### **1.2 Gestão de Usuários**
```bash
# Teste 1: Listar usuários
GET /api/users?page=1&limit=10

# Teste 2: Criar novo usuário
POST /api/users
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "telefone": "11999999999",
  "status": "Ativo",
  "perfil_id": 1
}

# Teste 3: Atualizar usuário
PUT /api/users/{id}
{
  "nome": "João Silva Santos",
  "status": "Inativo"
}

# Teste 4: Deletar usuário
DELETE /api/users/{id}
```

### **MÓDULO 2: FUNCIONÁRIOS E RH**

#### **2.1 Cadastro de Funcionários**
```bash
# Teste 1: Listar funcionários
GET /funcionarios?page=1&limit=10&status=Ativo

# Teste 2: Criar funcionário
POST /funcionarios
{
  "nome": "Maria Santos",
  "cpf": "123.456.789-00",
  "rg": "12.345.678-9",
  "data_nascimento": "1990-01-15",
  "telefone": "11999999999",
  "email": "maria@exemplo.com",
  "endereco": "Rua das Flores, 123",
  "cargo": "Operador",
  "salario": 3000.00,
  "data_admissao": "2024-01-01",
  "turno": "Diurno",
  "criar_usuario": true
}

# Teste 3: Atualizar funcionário
PUT /funcionarios/{id}
{
  "cargo": "Supervisor",
  "salario": 4000.00
}

# Teste 4: Deletar funcionário
DELETE /funcionarios/{id}
```

#### **2.2 Ponto Eletrônico**
```bash
# Teste 1: Registrar entrada
POST /api/ponto-eletronico/registrar
{
  "funcionario_id": 1,
  "tipo": "entrada",
  "localizacao": "Obra Centro"
}

# Teste 2: Registrar saída para almoço
POST /api/ponto-eletronico/registrar
{
  "funcionario_id": 1,
  "tipo": "saida_almoco"
}

# Teste 3: Registrar volta do almoço
POST /api/ponto-eletronico/registrar
{
  "funcionario_id": 1,
  "tipo": "volta_almoco"
}

# Teste 4: Registrar saída
POST /api/ponto-eletronico/registrar
{
  "funcionario_id": 1,
  "tipo": "saida"
}

# Teste 5: Consultar registros
GET /api/ponto-eletronico?funcionario_id=1&data_inicio=2024-01-01&data_fim=2024-01-31
```

#### **2.3 Gestão de Férias**
```bash
# Teste 1: Solicitar férias
POST /api/ferias
{
  "funcionario_id": 1,
  "data_inicio": "2024-06-01",
  "data_fim": "2024-06-30",
  "tipo": "Férias",
  "observacoes": "Férias programadas"
}

# Teste 2: Aprovar férias
PUT /api/ferias/{id}/aprovar
{
  "aprovado_por": 2,
  "observacoes": "Aprovado pelo supervisor"
}

# Teste 3: Consultar férias
GET /api/ferias?funcionario_id=1&status=aprovada
```

### **MÓDULO 3: CLIENTES E OBRAS**

#### **3.1 Gestão de Clientes**
```bash
# Teste 1: Listar clientes
GET /api/clientes?page=1&limit=10&status=ativo

# Teste 2: Criar cliente
POST /api/clientes
{
  "nome": "Construtora ABC Ltda",
  "cnpj": "12.345.678/0001-90",
  "telefone": "1133334444",
  "email": "contato@abc.com",
  "endereco": "Av. Paulista, 1000",
  "contato_responsavel": "João Silva",
  "criar_usuario": true
}

# Teste 3: Atualizar cliente
PUT /api/clientes/{id}
{
  "telefone": "1133335555",
  "email": "novo@abc.com"
}

# Teste 4: Deletar cliente
DELETE /api/clientes/{id}
```

#### **3.2 Gestão de Obras**
```bash
# Teste 1: Listar obras
GET /api/obras?page=1&limit=10&status=ativa

# Teste 2: Criar obra
POST /api/obras
{
  "nome": "Edifício Residencial XYZ",
  "endereco": "Rua das Palmeiras, 500",
  "cliente_id": 1,
  "data_inicio": "2024-01-01",
  "data_fim": "2024-12-31",
  "valor_total": 1000000.00,
  "observacoes": "Projeto residencial de alto padrão"
}

# Teste 3: Atualizar obra
PUT /api/obras/{id}
{
  "data_fim": "2025-06-30",
  "valor_total": 1200000.00
}

# Teste 4: Deletar obra
DELETE /api/obras/{id}
```

### **MÓDULO 4: GRUAS E EQUIPAMENTOS**

#### **4.1 Gestão de Gruas**
```bash
# Teste 1: Listar gruas
GET /api/gruas?page=1&limit=10&status=Disponível

# Teste 2: Criar grua
POST /api/gruas
{
  "nome": "Grua Torre 1",
  "modelo": "Potain MDT 208",
  "numero_serie": "GT001",
  "capacidade": 8.0,
  "altura_maxima": 60.0,
  "alcance_maximo": 50.0,
  "status": "Disponível",
  "observacoes": "Grua nova, em perfeito estado"
}

# Teste 3: Atualizar grua
PUT /api/gruas/{id}
{
  "status": "Manutenção",
  "data_ultima_manutencao": "2024-01-15"
}

# Teste 4: Deletar grua
DELETE /api/gruas/{id}
```

#### **4.2 Relacionamento Grua-Obra**
```bash
# Teste 1: Associar grua à obra
POST /api/grua-obras
{
  "grua_id": 1,
  "obra_id": 1,
  "data_inicio": "2024-01-01",
  "data_fim": "2024-06-30",
  "funcionario_responsavel_id": 1,
  "observacoes": "Instalação programada"
}

# Teste 2: Transferir grua entre obras
POST /api/gestao-gruas/transferir
{
  "grua_id": 1,
  "obra_origem_id": 1,
  "obra_destino_id": 2,
  "data_transferencia": "2024-03-01",
  "funcionario_responsavel_id": 1,
  "motivo": "Finalização da obra atual"
}

# Teste 3: Consultar histórico de grua
GET /api/gestao-gruas/historico/{grua_id}
```

### **MÓDULO 5: FINANCEIRO**

#### **5.1 Gestão de Receitas**
```bash
# Teste 1: Listar receitas
GET /api/receitas?page=1&limit=10&tipo=locacao

# Teste 2: Criar receita
POST /api/receitas
{
  "obra_id": 1,
  "tipo": "locacao",
  "descricao": "Locação de grua torre",
  "valor": 5000.00,
  "data_receita": "2024-01-15",
  "status": "confirmada",
  "funcionario_id": 1
}

# Teste 3: Atualizar receita
PUT /api/receitas/{id}
{
  "status": "confirmada",
  "observacoes": "Pagamento confirmado"
}

# Teste 4: Deletar receita
DELETE /api/receitas/{id}
```

#### **5.2 Gestão de Custos**
```bash
# Teste 1: Listar custos
GET /api/custos?page=1&limit=10&tipo=manutencao

# Teste 2: Criar custo
POST /api/custos
{
  "obra_id": 1,
  "tipo": "manutencao",
  "descricao": "Manutenção preventiva da grua",
  "valor": 1500.00,
  "data_custo": "2024-01-20",
  "funcionario_id": 1
}

# Teste 3: Atualizar custo
PUT /api/custos/{id}
{
  "valor": 1800.00,
  "observacoes": "Custo adicional de peças"
}

# Teste 4: Deletar custo
DELETE /api/custos/{id}
```

#### **5.3 Orçamentos e Contratos**
```bash
# Teste 1: Criar orçamento
POST /api/orcamentos
{
  "cliente_id": 1,
  "obra_id": 1,
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 1,
      "preco_unitario": 5000.00,
      "desconto": 0.00
    }
  ],
  "valor_total": 5000.00,
  "validade": "2024-02-15",
  "observacoes": "Orçamento para locação de grua"
}

# Teste 2: Converter orçamento em contrato
POST /api/contratos
{
  "orcamento_id": 1,
  "cliente_id": 1,
  "obra_id": 1,
  "tipo": "Locação",
  "valor_total": 5000.00,
  "data_inicio": "2024-01-01",
  "data_fim": "2024-06-30",
  "status": "Ativo"
}
```

### **MÓDULO 6: PRODUTOS E ESTOQUE**

#### **6.1 Gestão de Produtos**
```bash
# Teste 1: Listar produtos
GET /api/produtos?page=1&limit=10&tipo=locacao

# Teste 2: Criar produto
POST /api/produtos
{
  "nome": "Locação de Grua Torre",
  "descricao": "Locação mensal de grua torre",
  "categoria": "Equipamentos",
  "tipo": "locacao",
  "preco": 5000.00,
  "preco_custo": 3000.00,
  "unidade": "mês",
  "status": "ativo"
}

# Teste 3: Atualizar produto
PUT /api/produtos/{id}
{
  "preco": 5500.00,
  "status": "ativo"
}

# Teste 4: Deletar produto
DELETE /api/produtos/{id}
```

#### **6.2 Gestão de Estoque**
```bash
# Teste 1: Listar estoque
GET /api/estoque?page=1&limit=10

# Teste 2: Criar item de estoque
POST /api/estoque
{
  "nome": "Cabo de Aço 12mm",
  "categoria": "Cabos",
  "quantidade": 100,
  "quantidade_minima": 20,
  "preco_unitario": 15.50,
  "fornecedor": "Fornecedor ABC",
  "localizacao": "Depósito A"
}

# Teste 3: Registrar movimentação
POST /api/estoque/movimentacao
{
  "item_id": 1,
  "tipo": "saida",
  "quantidade": 10,
  "motivo": "Uso na obra",
  "funcionario_id": 1
}

# Teste 4: Consultar movimentações
GET /api/estoque/movimentacoes?item_id=1&data_inicio=2024-01-01
```

### **MÓDULO 7: NOTIFICAÇÕES E RELATÓRIOS**

#### **7.1 Sistema de Notificações**
```bash
# Teste 1: Listar notificações
GET /api/notificacoes?page=1&limit=10

# Teste 2: Criar notificação
POST /api/notificacoes
{
  "titulo": "Manutenção Programada",
  "mensagem": "A grua GT001 precisa de manutenção preventiva",
  "tipo": "manutencao",
  "destinatario_id": 1,
  "prioridade": "alta",
  "categoria": "equipamentos"
}

# Teste 3: Marcar como lida
PUT /api/notificacoes/{id}/ler

# Teste 4: Deletar notificação
DELETE /api/notificacoes/{id}
```

#### **7.2 Geração de Relatórios**
```bash
# Teste 1: Relatório de funcionários
GET /api/relatorios-rh/funcionarios?formato=pdf&filtros={"status":"Ativo"}

# Teste 2: Relatório financeiro
GET /api/relatorios/financeiro?formato=excel&periodo={"inicio":"2024-01-01","fim":"2024-12-31"}

# Teste 3: Relatório de gruas
GET /api/relatorios/gruas?formato=pdf&status=Disponível
```

---

## ⚖️ **Validações e Regras de Negócio**

### **1. Validações de Usuários**
- ✅ Email deve ser único no sistema
- ✅ CPF deve ter formato válido (XXX.XXX.XXX-XX)
- ✅ Telefone deve ter formato válido
- ✅ Status deve ser: Ativo, Inativo, Bloqueado, Pendente
- ✅ Perfil deve existir na tabela perfis

### **2. Validações de Funcionários**
- ✅ CPF deve ser único
- ✅ Data de nascimento não pode ser futura
- ✅ Data de admissão não pode ser futura
- ✅ Salário deve ser positivo
- ✅ Cargo deve ser válido: Operador, Sinaleiro, Técnico, Supervisor, etc.
- ✅ Turno deve ser: Diurno, Noturno, Sob Demanda

### **3. Validações de Clientes**
- ✅ CNPJ ou CPF deve ser fornecido (não ambos)
- ✅ CNPJ deve ter formato válido (XX.XXX.XXX/XXXX-XX)
- ✅ Email deve ser único se fornecido
- ✅ Status deve ser: ativo, inativo

### **4. Validações de Obras**
- ✅ Cliente deve existir
- ✅ Data de início não pode ser futura
- ✅ Data de fim deve ser posterior à data de início
- ✅ Valor total deve ser positivo
- ✅ Status deve ser: ativa, pausada, finalizada, cancelada

### **5. Validações de Gruas**
- ✅ Número de série deve ser único
- ✅ Capacidade deve ser positiva
- ✅ Altura máxima deve ser positiva
- ✅ Alcance máximo deve ser positivo
- ✅ Status deve ser: Disponível, Operacional, Manutenção, Vendida

### **6. Validações Financeiras**
- ✅ Valores devem ser positivos
- ✅ Datas não podem ser futuras para receitas/custos
- ✅ Obra deve existir para receitas/custos
- ✅ Status deve ser: pendente, confirmada, cancelada

### **7. Validações de Ponto Eletrônico**
- ✅ Funcionário deve existir
- ✅ Data não pode ser futura
- ✅ Entrada deve ser registrada antes de saída
- ✅ Saída para almoço deve ser registrada antes da volta
- ✅ Não pode haver registros duplicados no mesmo dia

---

## 🔗 **Relações entre Entidades**

### **1. Hierarquia Principal**
```
Usuários (1) ←→ (1) Funcionários
    ↓
Funcionários (1) ←→ (N) Ponto Eletrônico
    ↓
Funcionários (1) ←→ (N) Férias
    ↓
Funcionários (1) ←→ (N) Vales
```

### **2. Relações Comerciais**
```
Clientes (1) ←→ (N) Obras
    ↓
Obras (1) ←→ (N) Gruas (através de grua-obras)
    ↓
Obras (1) ←→ (N) Receitas
    ↓
Obras (1) ←→ (N) Custos
```

### **3. Relações de Equipamentos**
```
Gruas (1) ←→ (N) Obras (através de grua-obras)
    ↓
Gruas (1) ←→ (N) Manutenções
    ↓
Gruas (1) ←→ (N) Histórico de Locação
```

### **4. Relações Financeiras**
```
Orçamentos (1) ←→ (1) Contratos
    ↓
Contratos (1) ←→ (N) Locações
    ↓
Locações (1) ←→ (1) Receitas
```

---

## 🎯 **Cenários de Teste**

### **Cenário 1: Fluxo Completo de Locação**
1. ✅ Criar cliente
2. ✅ Criar obra para o cliente
3. ✅ Cadastrar grua
4. ✅ Criar orçamento
5. ✅ Converter em contrato
6. ✅ Associar grua à obra
7. ✅ Registrar receita
8. ✅ Gerar relatório

### **Cenário 2: Gestão de Funcionários**
1. ✅ Cadastrar funcionário
2. ✅ Criar usuário para funcionário
3. ✅ Registrar ponto eletrônico
4. ✅ Solicitar férias
5. ✅ Aprovar férias
6. ✅ Consultar histórico

### **Cenário 3: Manutenção de Equipamentos**
1. ✅ Cadastrar grua
2. ✅ Registrar manutenção
3. ✅ Atualizar status
4. ✅ Transferir entre obras
5. ✅ Consultar histórico

### **Cenário 4: Controle Financeiro**
1. ✅ Registrar receitas
2. ✅ Registrar custos
3. ✅ Gerar relatórios
4. ✅ Exportar dados
5. ✅ Análise de lucratividade

---

## ✅ **Checklist de Validação**

### **Funcionalidades Básicas**
- [ ] Login e logout funcionam
- [ ] Navegação entre páginas
- [ ] Criação de registros
- [ ] Edição de registros
- [ ] Exclusão de registros
- [ ] Listagem com paginação
- [ ] Filtros funcionam
- [ ] Busca funciona

### **Validações de Dados**
- [ ] Campos obrigatórios são validados
- [ ] Formatos de dados são validados
- [ ] Valores únicos são respeitados
- [ ] Relações entre entidades são mantidas
- [ ] Datas são validadas
- [ ] Valores numéricos são validados

### **Permissões e Segurança**
- [ ] Usuários só veem dados permitidos
- [ ] Operações requerem autenticação
- [ ] Permissões são respeitadas
- [ ] Tokens expiram corretamente
- [ ] Dados sensíveis são protegidos

### **Performance e Usabilidade**
- [ ] Páginas carregam em tempo aceitável
- [ ] Operações são responsivas
- [ ] Mensagens de erro são claras
- [ ] Confirmações são exibidas
- [ ] Loading states funcionam

### **Integração e Sincronização**
- [ ] Dados são sincronizados entre módulos
- [ ] Relatórios são gerados corretamente
- [ ] Notificações são enviadas
- [ ] Histórico é mantido
- [ ] Backup funciona

---

## 🚨 **Problemas Conhecidos e Soluções**

### **1. Erro 403 Forbidden**
**Problema**: Usuário não tem permissão para a operação
**Solução**: Verificar se o usuário tem o perfil correto e as permissões necessárias

### **2. Erro 404 Not Found**
**Problema**: Rota não existe ou recurso não encontrado
**Solução**: Verificar URL e se o recurso existe no banco

### **3. Erro 500 Internal Server Error**
**Problema**: Erro no servidor
**Solução**: Verificar logs do backend e configurações

### **4. Token Expirado**
**Problema**: Sessão expirou
**Solução**: Fazer login novamente

### **5. Validação de Dados**
**Problema**: Dados inválidos enviados
**Solução**: Verificar formato e valores dos campos

---

## 📊 **Métricas de Teste**

### **Cobertura de Testes**
- [ ] **Autenticação**: 100%
- [ ] **Usuários**: 100%
- [ ] **Funcionários**: 100%
- [ ] **Clientes**: 100%
- [ ] **Obras**: 100%
- [ ] **Gruas**: 100%
- [ ] **Financeiro**: 100%
- [ ] **RH**: 100%
- [ ] **Relatórios**: 100%

### **Tempo de Resposta**
- [ ] **Login**: < 2s
- [ ] **Listagem**: < 3s
- [ ] **Criação**: < 5s
- [ ] **Edição**: < 3s
- [ ] **Exclusão**: < 2s
- [ ] **Relatórios**: < 10s

---

## 🔧 **Ferramentas de Teste**

### **1. Postman Collection**
```bash
# Importar collection do Postman
# Arquivo: Sistema-Gruas-API.postman_collection.json
```

### **2. Testes Automatizados**
```bash
# Executar testes do backend
cd backend-api
npm test

# Executar testes específicos
npm test -- --grep "funcionarios"
```

### **3. Testes de Carga**
```bash
# Usar Artillery para testes de carga
npm install -g artillery
artillery run load-test.yml
```

---

## 📝 **Relatório de Testes**

### **Template de Relatório**
```
## Relatório de Testes - [Data]

### Resumo Executivo
- Total de testes: X
- Passou: Y
- Falhou: Z
- Taxa de sucesso: Y/X%

### Problemas Encontrados
1. [Descrição do problema]
   - Severidade: Alta/Média/Baixa
   - Solução: [Descrição da solução]

### Recomendações
1. [Recomendação 1]
2. [Recomendação 2]
```

---

## 🎉 **Conclusão**

Este guia fornece uma cobertura completa de todos os aspectos do sistema de gerenciamento de gruas. Siga os fluxos de teste na ordem apresentada para garantir que todas as funcionalidades estejam funcionando corretamente.

**Lembre-se**: Sempre teste em ambiente de desenvolvimento antes de aplicar em produção!

---

**📞 Suporte**: Para dúvidas ou problemas, consulte a documentação da API em `/api-docs` ou entre em contato com a equipe de desenvolvimento.
