# Relatório de Integrações Pendentes - Sistema de Gerenciamento de Gruas

Este documento lista todos os módulos que ainda utilizam dados mockados/hardcoded e precisam de integração com o backend.

## 📊 Resumo Executivo

*Total de Módulos Analisados:* 30+
*Módulos com Dados Mockados:* 18
*Prioridade:* Alta para módulos financeiros e RH

---

## 🔴 PRIORIDADE ALTA - Módulos Financeiros

### 1. *Medições Financeiras* (app/dashboard/financeiro/medicoes/page.tsx)
*Status:* ⚠️ Parcialmente Integrado
- ✅ *Integrado:* Medições e Locações
- ❌ *Mockado:* 
  - Receitas (linhas 168-191)
  - Custos (linhas 193-218)
  
*Dados Mockados:*
typescript
const mockReceitas: Receita[] = [...]  // Receitas de obras
const mockCustos: Custo[] = [...]      // Custos por obra


*Ação Necessária:*
- Integrar com API de receitas (lib/api-receitas.ts)
- Integrar com API de custos (lib/api-custos.ts)

---

### 2. *Relatórios Financeiros* (app/dashboard/financeiro/relatorios/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 44-163):*
- mockRelatorioFinanceiro - Relatórios financeiros gerais
- mockRelatorioVendas - Dados de vendas
- mockRelatorioContratos - Contratos
- mockRelatorioFaturamento - Faturamento mensal
- mockRelatorioLocacoes - Locações
- mockRelatorioEstoque - Estoque
- obrasMock - Lista de obras
- gruasMock - Lista de gruas

*Ação Necessária:*
- Criar endpoints de relatórios no backend
- Integrar com api-relatorios.ts
- Implementar geração de relatórios em PDF/Excel

---

### 3. *Cadastro Financeiro* (app/dashboard/financeiro/cadastro/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 41-126):*
- mockClientes - Lista de clientes
- mockFornecedores - Lista de fornecedores
- mockProdutos - Catálogo de produtos
- mockFuncionarios - Lista de funcionários

*Ação Necessária:*
- Integrar com APIs existentes:
  - lib/api-clientes.ts
  - lib/api-funcionarios.ts
- Criar API de fornecedores
- Criar API de produtos/catálogo

---

### 4. *Logística* (app/dashboard/financeiro/logistica/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 42-132):*
- mockManifestos - Manifestos de carga
- mockCTe - Conhecimentos de Transporte Eletrônico
- mockMotoristas - Cadastro de motoristas
- mockViagens - Controle de viagens

*Ação Necessária:*
- Criar módulo completo de logística no backend
- Implementar API de manifestos e CT-e
- Implementar controle de motoristas e viagens

---

### 5. *Impostos* (app/dashboard/financeiro/impostos/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 37-87):*
- mockPagamentosImpostos - Pagamentos de impostos
- mockRelatorioImpostos - Relatórios mensais de impostos

*Ação Necessária:*
- Criar API de impostos no backend
- Implementar cálculo automático de impostos
- Integrar com sistema de pagamentos

---

### 6. *Compras* (app/dashboard/financeiro/compras/page.tsx)
*Status:* ⚠️ Parcialmente Mockado

*Dados Mockados (linhas 664-668):*
- fornecedoresMock - Lista de fornecedores (fallback)

*Ação Necessária:*
- Criar API completa de fornecedores
- Implementar sistema de compras

---

### 7. *Vendas* (app/dashboard/financeiro/vendas/page.tsx)
*Status:* ⚠️ Parcialmente Mockado

*Dados Mockados (linhas 1232-1236):*
- Fallback para clientes mockados em caso de erro

*Ação Necessária:*
- Garantir API de clientes sempre disponível
- Remover fallback mockado

---

## 🟡 PRIORIDADE MÉDIA - Módulos de RH

### 8. *Alocação de Funcionários em Obras* (app/dashboard/rh-completo/obras/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 86-186):*
- Lista completa de alocações funcionário-obra
- Dados de obras e funcionários

*Ação Necessária:*
- Criar API de alocação de funcionários
- Integrar com lib/api-funcionarios-obras.ts

---

### 9. *Ponto Eletrônico* (app/dashboard/rh-completo/ponto/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 75-165):*
- registros - Registros de ponto
- funcionarios - Resumo de horas por funcionário

*Ação Necessária:*
- Integrar com lib/api-ponto-eletronico.ts
- Implementar sistema completo de ponto

---

### 10. *Férias e Afastamentos* (app/dashboard/rh-completo/ferias/page.tsx)
*Status:* ⚠️ Parcialmente Integrado

*Dados Mockados (linhas 92-128):*
- feriasSimuladas - Registros de férias
- afastamentosSimulados - Registros de afastamentos

*Ação Necessária:*
- Criar endpoints de férias no backend
- Criar endpoints de afastamentos
- Integrar com lib/api-ferias.ts

---

### 11. *Auditoria e Permissões* (app/dashboard/rh-completo/auditoria/page.tsx)
*Status:* ⚠️ Parcialmente Mockado

*Dados Mockados (linhas 79-127):*
- perfisSimulados - Perfis de usuário
- permissoesSimuladas - Permissões do sistema

*Ação Necessária:*
- Implementar sistema completo de permissões
- Integrar com controle de acesso

---

## 🟢 PRIORIDADE BAIXA - Módulos Operacionais

### 12. *Gruas por Mês* (app/dashboard/gruas-mes/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 40-157):*
- mockGruasMes - Controle mensal de gruas
- Horas trabalhadas, eficiência, custos

*Ação Necessária:*
- Criar API de controle mensal de gruas
- Implementar cálculos de eficiência e custos

---

### 13. *Checklist de Devolução* (app/dashboard/checklist-devolucao/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 110-187):*
- mockItens - Itens de devolução de peças
- obrasMock - Lista de obras
- gruasMock - Lista de gruas

*Ação Necessária:*
- Criar API de checklist de devolução
- Integrar com controle de peças/componentes

---

### 14. *Múltiplas Gruas por Obra* (components/multiple-gruas-manager.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 105-167):*
- mockGruasObra - Gruas alocadas em obra
- mockGruasDisponiveis - Gruas disponíveis

*Ação Necessária:*
- Integrar com lib/api-grua-obra.ts ou lib/api-obra-gruas.ts
- Implementar gestão de múltiplas gruas

---

## 📱 PWA - Aplicativo Mobile

### 15. *PWA - Encarregador* (app/pwa/encarregador/page.tsx)
*Status:* ⚠️ Fallback Mockado

*Dados Mockados (linhas 135-164):*
- Fallback para lista de funcionários
- Fallback para registros pendentes

*Ação Necessária:*
- Garantir endpoints sempre disponíveis
- Remover fallbacks mockados

---

### 16. *PWA - Documentos* (app/pwa/documentos/page.tsx)
*Status:* ⚠️ Fallback Mockado

*Dados Mockados (linhas 108-130):*
- Fallback para documentos do funcionário

*Ação Necessária:*
- Garantir API de documentos funcionando
- Remover fallback

---

### 17. *PWA - Assinatura* (app/pwa/assinatura/page.tsx)
*Status:* ❌ Totalmente Mockado

*Dados Mockados (linhas 61-90):*
- docs - Lista completa de documentos para assinatura

*Ação Necessária:*
- Integrar com sistema de assinaturas
- Conectar com API de documentos

---

## 📚 Biblioteca de Dados Mock

### 18. *Mock Data Central* (lib/mock-data.ts)
*Status:* ⚠️ Arquivo Completo de Mocks

*Contém:*
- mockClientes (178-256)
- mockUsers (258-341)
- mockObras (343-407)
- mockGruas (409-474)
- mockDocumentos (476-569)
- mockCustos (571-596)
- mockCustosMensais (599-783)
- Funções utilitárias de acesso

*Ação Necessária:*
- Este arquivo deve ser mantido apenas para testes
- Remover todas as importações deste arquivo do código de produção
- Migrar todos os módulos para APIs reais

---

## 📋 Plano de Ação Recomendado

### Fase 1 - Financeiro (2-3 semanas)
1. ✅ Medições (receitas e custos)
2. ✅ Relatórios financeiros
3. ✅ Cadastros (clientes, fornecedores, produtos)
4. ✅ Impostos

### Fase 2 - RH (2-3 semanas)
1. ✅ Ponto eletrônico completo
2. ✅ Alocação funcionários-obras
3. ✅ Férias e afastamentos
4. ✅ Permissões e auditoria

### Fase 3 - Operacional (1-2 semanas)
1. ✅ Gruas por mês
2. ✅ Checklist devolução
3. ✅ Múltiplas gruas
4. ✅ Logística

### Fase 4 - PWA (1 semana)
1. ✅ Remover todos os fallbacks
2. ✅ Garantir funcionamento offline
3. ✅ Sincronização de dados

---

## 🔧 APIs que Precisam Ser Criadas

### Novas APIs Necessárias:
1. *api-receitas-custos.ts* - Receitas e custos por obra
2. *api-relatorios-financeiros.ts* - Geração de relatórios
3. *api-fornecedores.ts* - Gestão de fornecedores
4. *api-produtos.ts* - Catálogo de produtos
5. *api-logistica.ts* - Manifestos, CT-e, motoristas, viagens
6. *api-impostos.ts* - Cálculo e controle de impostos
7. *api-alocacao-funcionarios.ts* - Alocação em obras
8. *api-ferias-afastamentos.ts* - Gestão de férias e afastamentos
9. *api-gruas-mensais.ts* - Controle mensal de gruas
10. *api-checklist-devolucao.ts* - Checklist de peças

### APIs Existentes que Precisam Ser Melhoradas:
1. *api-ponto-eletronico.ts* - Expandir funcionalidades
2. *api-grua-obra.ts* - Suporte a múltiplas gruas
3. *api-permissoes.ts* - Sistema completo de permissões

---

## 📊 Estatísticas

- *Total de Arquivos com Mock:* 18
- *Linhas de Código Mock:* ~2.500+
- *APIs a Criar:* 10
- *APIs a Melhorar:* 3
- *Tempo Estimado:* 6-9 semanas

---

## ✅ Checklist de Verificação

Para cada módulo integrado, verificar:
- [ ] Substituir dados mock por chamadas de API
- [ ] Implementar tratamento de erros adequado
- [ ] Adicionar loading states
- [ ] Implementar validações
- [ ] Testar CRUD completo
- [ ] Documentar endpoints
- [ ] Remover imports de mock-data.ts
- [ ] Testar em produção

---

## 📝 Notas Importantes

1. *Priorização:* Focar primeiro nos módulos financeiros (impacto direto no negócio)
2. *Testes:* Manter dados mock apenas para ambiente de testes/desenvolvimento
3. *Migração:* Fazer migração gradual, módulo por módulo
4. *Documentação:* Documentar cada API criada
5. *Versionamento:* Criar branches específicas para cada módulo

---

*Data do Relatório:* 09 de Outubro de 2025  
*Próxima Revisão:* Após conclusão da Fase 1