# 🖥️ **GUIA DE TESTES FRONTEND - Experiência do Usuário**

## 📋 **Índice**
1. [Configuração Inicial](#configuração-inicial)
2. [Fluxos de Teste por Módulo](#fluxos-de-teste-por-módulo)
3. [Cenários de Teste Completos](#cenários-de-teste-completos)
4. [Validações de Interface](#validações-de-interface)
5. [Checklist de Testes](#checklist-de-testes)

---

## 🚀 **Configuração Inicial**

### **1. Acessar o Sistema**
```
URL: http://localhost:3000
Login: admin@admin.com
Senha: teste@123
```

### **2. Verificar Login**
- ✅ Página de login carrega
- ✅ Campos de email e senha funcionam
- ✅ Botão de login funciona
- ✅ Redirecionamento para dashboard após login
- ✅ Menu lateral aparece
- ✅ Dados do usuário são exibidos

---

## 🔄 **Fluxos de Teste por Módulo**

### **MÓDULO 1: GRUAS** 🏗️

#### **1.1 Criar Nova Grua**
```
1. Acessar: Dashboard → Gruas
2. Clicar em "Nova Grua" ou "+"
3. Preencher formulário:
   - Nome: "Grua Torre 1"
   - Modelo: "Potain MDT 208"
   - Número de Série: "GT001"
   - Capacidade: 8.0
   - Altura Máxima: 60.0
   - Alcance Máximo: 50.0
   - Status: "Disponível"
   - Observações: "Grua nova, em perfeito estado"
4. Clicar em "Salvar"
5. Verificar: Mensagem de sucesso
6. Verificar: Grua aparece na lista
```

#### **1.2 Editar Grua**
```
1. Na lista de gruas, clicar no ícone "Editar" da grua criada
2. Alterar dados:
   - Nome: "Grua Torre 1 - Atualizada"
   - Status: "Manutenção"
   - Data Última Manutenção: "2024-01-15"
3. Clicar em "Salvar"
4. Verificar: Mensagem de sucesso
5. Verificar: Dados atualizados na lista
```

#### **1.3 Visualizar Detalhes da Grua**
```
1. Na lista de gruas, clicar no nome da grua
2. Verificar: Página de detalhes carrega
3. Verificar: Todos os dados são exibidos
4. Verificar: Histórico de manutenções (se houver)
5. Verificar: Obras associadas (se houver)
```

#### **1.4 Excluir Grua**
```
1. Na lista de gruas, clicar no ícone "Excluir"
2. Confirmar exclusão no modal
3. Verificar: Mensagem de confirmação
4. Verificar: Grua não aparece mais na lista
```

#### **1.5 Filtrar e Buscar Gruas**
```
1. Usar filtros:
   - Status: "Disponível"
   - Tipo: "Grua Torre"
2. Usar busca por nome: "Torre"
3. Verificar: Resultados filtrados corretamente
4. Limpar filtros e verificar: Lista completa
```

---

### **MÓDULO 2: OBRAS** 🏢

#### **2.1 Criar Nova Obra**
```
1. Acessar: Dashboard → Obras
2. Clicar em "Nova Obra" ou "+"
3. Preencher formulário:
   - Nome: "Edifício Residencial XYZ"
   - Endereço: "Rua das Palmeiras, 500"
   - Cliente: Selecionar cliente existente
   - Data Início: "2024-01-01"
   - Data Fim: "2024-12-31"
   - Valor Total: 1000000.00
   - Observações: "Projeto residencial de alto padrão"
4. Clicar em "Salvar"
5. Verificar: Mensagem de sucesso
6. Verificar: Obra aparece na lista
```

#### **2.2 Editar Obra**
```
1. Na lista de obras, clicar no ícone "Editar"
2. Alterar dados:
   - Nome: "Edifício Residencial XYZ - Atualizado"
   - Data Fim: "2025-06-30"
   - Valor Total: 1200000.00
3. Clicar em "Salvar"
4. Verificar: Mensagem de sucesso
5. Verificar: Dados atualizados na lista
```

#### **2.3 Associar Cliente à Obra**
```
1. Ao criar/editar obra, no campo "Cliente"
2. Se não houver cliente, criar um:
   - Clicar em "Novo Cliente"
   - Preencher dados do cliente
   - Salvar cliente
3. Selecionar cliente na obra
4. Salvar obra
5. Verificar: Cliente aparece na obra
```

#### **2.4 Excluir Obra**
```
1. Na lista de obras, clicar no ícone "Excluir"
2. Confirmar exclusão no modal
3. Verificar: Mensagem de confirmação
4. Verificar: Obra não aparece mais na lista
```

#### **2.5 Visualizar Detalhes da Obra**
```
1. Na lista de obras, clicar no nome da obra
2. Verificar: Página de detalhes carrega
3. Verificar: Dados da obra
4. Verificar: Cliente associado
5. Verificar: Gruas associadas (se houver)
6. Verificar: Receitas e custos (se houver)
```

---

### **MÓDULO 3: CLIENTES** 👥

#### **3.1 Criar Novo Cliente**
```
1. Acessar: Dashboard → Clientes
2. Clicar em "Novo Cliente" ou "+"
3. Preencher formulário:
   - Nome: "Construtora ABC Ltda"
   - CNPJ: "12.345.678/0001-90"
   - Telefone: "1133334444"
   - Email: "contato@abc.com"
   - Endereço: "Av. Paulista, 1000"
   - Contato Responsável: "João Silva"
   - Status: "Ativo"
4. Clicar em "Salvar"
5. Verificar: Mensagem de sucesso
6. Verificar: Cliente aparece na lista
```

#### **3.2 Editar Cliente**
```
1. Na lista de clientes, clicar no ícone "Editar"
2. Alterar dados:
   - Telefone: "1133335555"
   - Email: "novo@abc.com"
   - Status: "Ativo"
3. Clicar em "Salvar"
4. Verificar: Mensagem de sucesso
5. Verificar: Dados atualizados na lista
```

#### **3.3 Visualizar Obras do Cliente**
```
1. Na lista de clientes, clicar no nome do cliente
2. Verificar: Página de detalhes carrega
3. Verificar: Dados do cliente
4. Verificar: Lista de obras do cliente
5. Clicar em uma obra para ver detalhes
```

#### **3.4 Excluir Cliente**
```
1. Na lista de clientes, clicar no ícone "Excluir"
2. Verificar: Modal de confirmação
3. Verificar: Aviso sobre obras associadas (se houver)
4. Confirmar exclusão
5. Verificar: Mensagem de confirmação
6. Verificar: Cliente não aparece mais na lista
```

---

### **MÓDULO 4: FUNCIONÁRIOS** 👷

#### **4.1 Criar Novo Funcionário**
```
1. Acessar: Dashboard → Funcionários
2. Clicar em "Novo Funcionário" ou "+"
3. Preencher formulário:
   - Nome: "Maria Santos"
   - CPF: "123.456.789-00"
   - RG: "12.345.678-9"
   - Data Nascimento: "1990-01-15"
   - Telefone: "11999999999"
   - Email: "maria@exemplo.com"
   - Endereço: "Rua das Flores, 123"
   - Cargo: "Operador"
   - Salário: 3000.00
   - Data Admissão: "2024-01-01"
   - Turno: "Diurno"
   - Status: "Ativo"
   - Criar Usuário: ✅ (marcar)
4. Clicar em "Salvar"
5. Verificar: Mensagem de sucesso
6. Verificar: Funcionário aparece na lista
7. Verificar: Usuário foi criado (ir em Usuários)
```

#### **4.2 Editar Funcionário**
```
1. Na lista de funcionários, clicar no ícone "Editar"
2. Alterar dados:
   - Cargo: "Supervisor"
   - Salário: 4000.00
   - Status: "Ativo"
3. Clicar em "Salvar"
4. Verificar: Mensagem de sucesso
5. Verificar: Dados atualizados na lista
```

#### **4.3 Visualizar Detalhes do Funcionário**
```
1. Na lista de funcionários, clicar no nome
2. Verificar: Página de detalhes carrega
3. Verificar: Dados pessoais
4. Verificar: Dados profissionais
5. Verificar: Histórico de ponto (se houver)
6. Verificar: Férias e licenças (se houver)
```

#### **4.4 Excluir Funcionário**
```
1. Na lista de funcionários, clicar no ícone "Excluir"
2. Verificar: Modal de confirmação
3. Verificar: Aviso sobre dados relacionados
4. Confirmar exclusão
5. Verificar: Mensagem de confirmação
6. Verificar: Funcionário não aparece mais na lista
```

---

### **MÓDULO 5: PONTO ELETRÔNICO** ⏰

#### **5.1 Registrar Entrada**
```
1. Acessar: Dashboard → Ponto Eletrônico
2. Selecionar funcionário
3. Clicar em "Registrar Entrada"
4. Verificar: Horário registrado
5. Verificar: Status atualizado para "Trabalhando"
```

#### **5.2 Registrar Saída para Almoço**
```
1. Com funcionário "Trabalhando"
2. Clicar em "Saída Almoço"
3. Verificar: Horário registrado
4. Verificar: Status atualizado para "Almoço"
```

#### **5.3 Registrar Volta do Almoço**
```
1. Com funcionário "Almoço"
2. Clicar em "Volta Almoço"
3. Verificar: Horário registrado
4. Verificar: Status atualizado para "Trabalhando"
```

#### **5.4 Registrar Saída**
```
1. Com funcionário "Trabalhando"
2. Clicar em "Registrar Saída"
3. Verificar: Horário registrado
4. Verificar: Status atualizado para "Finalizado"
5. Verificar: Total de horas calculado
```

#### **5.5 Consultar Histórico**
```
1. Na página de ponto, usar filtros:
   - Funcionário: Selecionar
   - Período: Definir datas
2. Verificar: Lista de registros
3. Verificar: Totais de horas
4. Verificar: Status de cada dia
```

---

### **MÓDULO 6: FINANCEIRO** 💰

#### **6.1 Registrar Receita**
```
1. Acessar: Dashboard → Financeiro → Receitas
2. Clicar em "Nova Receita"
3. Preencher formulário:
   - Obra: Selecionar obra
   - Tipo: "Locação"
   - Descrição: "Locação de grua torre"
   - Valor: 5000.00
   - Data: "2024-01-15"
   - Status: "Confirmada"
4. Clicar em "Salvar"
5. Verificar: Mensagem de sucesso
6. Verificar: Receita aparece na lista
```

#### **6.2 Registrar Custo**
```
1. Acessar: Dashboard → Financeiro → Custos
2. Clicar em "Novo Custo"
3. Preencher formulário:
   - Obra: Selecionar obra
   - Tipo: "Manutenção"
   - Descrição: "Manutenção preventiva da grua"
   - Valor: 1500.00
   - Data: "2024-01-20"
4. Clicar em "Salvar"
5. Verificar: Mensagem de sucesso
6. Verificar: Custo aparece na lista
```

#### **6.3 Criar Orçamento**
```
1. Acessar: Dashboard → Financeiro → Orçamentos
2. Clicar em "Novo Orçamento"
3. Preencher formulário:
   - Cliente: Selecionar cliente
   - Obra: Selecionar obra
   - Itens: Adicionar produtos/serviços
   - Valor Total: Calcular automaticamente
   - Validade: "2024-02-15"
4. Clicar em "Salvar"
5. Verificar: Mensagem de sucesso
6. Verificar: Orçamento aparece na lista
```

#### **6.4 Converter Orçamento em Contrato**
```
1. Na lista de orçamentos, clicar em "Converter em Contrato"
2. Preencher dados adicionais:
   - Data Início: "2024-01-01"
   - Data Fim: "2024-06-30"
   - Status: "Ativo"
3. Clicar em "Salvar"
4. Verificar: Mensagem de sucesso
5. Verificar: Contrato criado
6. Verificar: Orçamento marcado como "Convertido"
```

---

### **MÓDULO 7: RELATÓRIOS** 📊

#### **7.1 Gerar Relatório de Funcionários**
```
1. Acessar: Dashboard → Relatórios → RH
2. Selecionar "Relatório de Funcionários"
3. Definir filtros:
   - Status: "Ativo"
   - Cargo: "Operador"
   - Período: Último mês
4. Clicar em "Gerar Relatório"
5. Verificar: Relatório é gerado
6. Verificar: Dados estão corretos
7. Testar exportação (PDF/Excel)
```

#### **7.2 Gerar Relatório Financeiro**
```
1. Acessar: Dashboard → Relatórios → Financeiro
2. Selecionar "Relatório de Receitas e Custos"
3. Definir filtros:
   - Obra: Selecionar obra
   - Período: Último trimestre
4. Clicar em "Gerar Relatório"
5. Verificar: Relatório é gerado
6. Verificar: Totais estão corretos
7. Testar exportação (PDF/Excel)
```

#### **7.3 Gerar Relatório de Gruas**
```
1. Acessar: Dashboard → Relatórios → Equipamentos
2. Selecionar "Relatório de Gruas"
3. Definir filtros:
   - Status: "Disponível"
   - Tipo: "Grua Torre"
4. Clicar em "Gerar Relatório"
5. Verificar: Relatório é gerado
6. Verificar: Dados das gruas
7. Testar exportação (PDF/Excel)
```

---

## 🎯 **Cenários de Teste Completos**

### **Cenário 1: Fluxo Completo de Locação**
```
1. ✅ Criar cliente "Construtora XYZ"
2. ✅ Criar obra "Edifício ABC" para o cliente
3. ✅ Cadastrar grua "Grua Torre 1"
4. ✅ Criar orçamento para locação
5. ✅ Converter orçamento em contrato
6. ✅ Associar grua à obra
7. ✅ Registrar receita da locação
8. ✅ Gerar relatório financeiro
```

### **Cenário 2: Gestão Completa de Funcionário**
```
1. ✅ Cadastrar funcionário "João Silva"
2. ✅ Criar usuário para o funcionário
3. ✅ Registrar ponto eletrônico (entrada, almoço, volta, saída)
4. ✅ Solicitar férias para o funcionário
5. ✅ Aprovar férias
6. ✅ Consultar histórico de ponto
7. ✅ Gerar relatório de funcionário
```

### **Cenário 3: Manutenção de Equipamento**
```
1. ✅ Cadastrar grua "Grua Móvel 1"
2. ✅ Registrar manutenção preventiva
3. ✅ Atualizar status para "Manutenção"
4. ✅ Transferir grua entre obras
5. ✅ Consultar histórico de manutenções
6. ✅ Gerar relatório de equipamentos
```

### **Cenário 4: Controle Financeiro Completo**
```
1. ✅ Criar cliente e obra
2. ✅ Cadastrar grua
3. ✅ Criar orçamento
4. ✅ Converter em contrato
5. ✅ Registrar receitas
6. ✅ Registrar custos
7. ✅ Gerar relatório financeiro
8. ✅ Exportar dados
```

---

## ✅ **Validações de Interface**

### **1. Validações de Formulários**
- ✅ Campos obrigatórios são marcados com *
- ✅ Validação em tempo real
- ✅ Mensagens de erro claras
- ✅ Formatação automática (CPF, CNPJ, telefone)
- ✅ Máscaras de entrada funcionam

### **2. Validações de Navegação**
- ✅ Menu lateral funciona
- ✅ Breadcrumbs aparecem
- ✅ Botões de voltar funcionam
- ✅ Links internos funcionam
- ✅ Redirecionamentos funcionam

### **3. Validações de Dados**
- ✅ Listas carregam corretamente
- ✅ Paginação funciona
- ✅ Filtros funcionam
- ✅ Busca funciona
- ✅ Ordenação funciona

### **4. Validações de Responsividade**
- ✅ Layout funciona em desktop
- ✅ Layout funciona em tablet
- ✅ Layout funciona em mobile
- ✅ Menu colapsa em mobile
- ✅ Formulários são responsivos

### **5. Validações de Performance**
- ✅ Páginas carregam em < 3 segundos
- ✅ Operações são responsivas
- ✅ Loading states aparecem
- ✅ Não há travamentos
- ✅ Dados são carregados progressivamente

---

## 📋 **Checklist de Testes**

### **Funcionalidades Básicas**
- [ ] Login e logout funcionam
- [ ] Navegação entre páginas
- [ ] Menu lateral funciona
- [ ] Dados do usuário são exibidos
- [ ] Notificações aparecem

### **CRUD de Entidades**
- [ ] **Gruas**: Criar, Editar, Visualizar, Excluir
- [ ] **Obras**: Criar, Editar, Visualizar, Excluir
- [ ] **Clientes**: Criar, Editar, Visualizar, Excluir
- [ ] **Funcionários**: Criar, Editar, Visualizar, Excluir
- [ ] **Usuários**: Criar, Editar, Visualizar, Excluir

### **Relacionamentos**
- [ ] Cliente → Obra (associação)
- [ ] Obra → Grua (associação)
- [ ] Funcionário → Usuário (criação)
- [ ] Obra → Receitas/Custos (vinculação)

### **Funcionalidades Específicas**
- [ ] **Ponto Eletrônico**: Registrar entrada, saída, almoço
- [ ] **Financeiro**: Receitas, custos, orçamentos, contratos
- [ ] **Relatórios**: Geração e exportação
- [ ] **Notificações**: Criação e visualização

### **Validações de Interface**
- [ ] Formulários validam dados
- [ ] Mensagens de erro são claras
- [ ] Confirmações aparecem
- [ ] Loading states funcionam
- [ ] Responsividade funciona

### **Performance e Usabilidade**
- [ ] Páginas carregam rapidamente
- [ ] Operações são responsivas
- [ ] Interface é intuitiva
- [ ] Dados são consistentes
- [ ] Navegação é fluida

---

## 🚨 **Problemas Comuns e Soluções**

### **1. Erro ao Salvar**
**Problema**: Formulário não salva
**Solução**: 
- Verificar campos obrigatórios
- Verificar formato dos dados
- Verificar conexão com backend

### **2. Lista Não Carrega**
**Problema**: Página fica em branco
**Solução**:
- Verificar console do navegador
- Verificar se backend está rodando
- Verificar permissões do usuário

### **3. Relacionamentos Não Funcionam**
**Problema**: Não consegue associar entidades
**Solução**:
- Verificar se entidades existem
- Verificar se dados estão corretos
- Verificar permissões

### **4. Relatórios Não Geram**
**Problema**: Relatório não é criado
**Solução**:
- Verificar filtros selecionados
- Verificar se há dados para o período
- Verificar permissões de relatório

---

## 📊 **Métricas de Teste**

### **Tempo de Resposta**
- [ ] **Login**: < 2 segundos
- [ ] **Listagem**: < 3 segundos
- [ ] **Criação**: < 5 segundos
- [ ] **Edição**: < 3 segundos
- [ ] **Exclusão**: < 2 segundos
- [ ] **Relatórios**: < 10 segundos

### **Cobertura de Funcionalidades**
- [ ] **Autenticação**: 100%
- [ ] **CRUD Básico**: 100%
- [ ] **Relacionamentos**: 100%
- [ ] **Relatórios**: 100%
- [ ] **Ponto Eletrônico**: 100%

---

## 🎉 **Conclusão**

Este guia fornece uma cobertura completa de todos os fluxos de interface do sistema. Siga os cenários na ordem apresentada para garantir que todas as funcionalidades estejam funcionando corretamente do ponto de vista do usuário.

**Lembre-se**: Teste sempre como um usuário real, prestando atenção na experiência e usabilidade!

---

**📞 Suporte**: Para dúvidas ou problemas, verifique o console do navegador (F12) ou consulte a documentação da API.
