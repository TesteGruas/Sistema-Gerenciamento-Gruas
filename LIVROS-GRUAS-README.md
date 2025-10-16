# 📚 Sistema de Livros de Gruas

Sistema completo para gerenciamento de livros de ocorrências de gruas, permitindo que funcionários registrem checklists, manutenções e falhas das gruas em suas respectivas obras.

## 🎯 Funcionalidades

### ✅ **Implementadas**
- **Menu de Acesso**: Interface dedicada para funcionários
- **Seleção de Grua-Obra**: Lista todas as relações ativas
- **Filtros Avançados**: Por obra, status, busca por texto
- **Livro da Grua**: Interface completa para registro de ocorrências
- **Dados Mock**: Sistema funciona offline com dados de demonstração
- **Fallback Inteligente**: Usa dados mock quando API não disponível

### 🔄 **Em Desenvolvimento**
- **Integração com Backend**: Endpoints para dados reais
- **Sistema de Funcionários**: Vinculação de funcionários às obras
- **Upload de Arquivos**: Evidências fotográficas
- **Relatórios Avançados**: Análises e estatísticas

## 🚀 Como Usar

### 1. **Acessar o Sistema**
```
Dashboard → Livros de Gruas
```

### 2. **Selecionar Grua-Obra**
- Visualize todas as relações ativas
- Use filtros para encontrar rapidamente
- Clique em "Acessar Livro"

### 3. **Registrar Ocorrências**
- **Checklist**: Verificações diárias
- **Manutenção**: Reparos e manutenções
- **Falha**: Problemas e incidentes

## 🏗️ Arquitetura

### **Frontend (Next.js)**
```
app/dashboard/livros-gruas/
├── page.tsx                    # Lista de relações grua-obra
├── [relacaoId]/
│   └── livro/
│       └── page.tsx           # Livro da grua específica
```

### **Backend (Node.js + Supabase)**
```
backend-api/src/routes/
├── livro-grua.js              # Endpoints principais
├── funcionarios.js            # Gestão de funcionários
└── auth.js                    # Autenticação
```

### **Dados Mock**
```
lib/mock-data.ts
├── mockRelacoesGruaObra        # Relações grua-obra
├── mockFuncionarios           # Funcionários
└── mockEntradasLivroGrua      # Entradas do livro
```

## 📊 Endpoints da API

### ✅ **Implementados**

#### **Relações Grua-Obra**
```http
GET /api/livro-grua/relacoes-grua-obra
GET /api/livro-grua/grua-by-relation/:id
```

#### **Entradas do Livro**
```http
GET    /api/livro-grua/                    # Listar entradas
GET    /api/livro-grua/:id                 # Obter entrada
POST   /api/livro-grua/                    # Criar entrada
PUT    /api/livro-grua/:id                 # Atualizar entrada
DELETE /api/livro-grua/:id                 # Excluir entrada
```

#### **Estatísticas e Exportação**
```http
GET /api/livro-grua/stats/:grua_id         # Estatísticas
GET /api/livro-grua/export/:grua_id        # Exportar CSV
```

### ❌ **Faltantes (Críticos)**

#### **Funcionários**
```http
GET /api/funcionarios/obra/:obra_id        # Funcionários por obra
GET /api/funcionarios                      # Todos os funcionários
GET /api/funcionarios/:id                  # Funcionário específico
```

#### **Autenticação**
```http
GET /api/auth/me                          # Dados do usuário logado
GET /api/auth/permissions                 # Permissões do usuário
```

## 🛠️ Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+
- npm ou yarn
- Supabase (opcional para dados reais)

### **1. Instalar Dependências**
```bash
npm install
```

### **2. Configurar Variáveis de Ambiente**
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_supabase
```

### **3. Executar Backend**
```bash
cd backend-api
npm install
npm start
```

### **4. Executar Frontend**
```bash
npm run dev
```

### **5. Acessar Sistema**
```
http://localhost:3000/dashboard/livros-gruas
```

## 📱 Interface do Usuário

### **Página Principal**
- **Lista de Relações**: Cards com informações da grua e obra
- **Filtros**: Por obra, status, busca por texto
- **Navegação**: Acesso direto ao livro da grua

### **Livro da Grua**
- **Informações**: Grua, obra, período de locação
- **Estatísticas**: Resumo de entradas e status
- **Lista de Entradas**: Histórico completo
- **Formulários**: Criar/editar entradas

### **Tipos de Entrada**
- **🔍 Checklist**: Verificações diárias
- **🔧 Manutenção**: Reparos e manutenções
- **⚠️ Falha**: Problemas e incidentes

## 🎨 Componentes

### **Principais**
- `LivroGruaForm`: Formulário de entrada
- `LivroGruaList`: Lista de entradas
- `ObraStoreDebug`: Debug do store (desenvolvimento)

### **UI Components**
- `Select`: Filtros com validação
- `Card`: Layout das informações
- `Dialog`: Modais de formulário
- `Badge`: Status e tipos

## 🔧 Desenvolvimento

### **Estrutura de Dados**

#### **Relação Grua-Obra**
```typescript
interface GruaObraRelacao {
  id: number
  grua_id: string
  obra_id: number
  data_inicio_locacao: string
  data_fim_locacao?: string
  status: string
  valor_locacao_mensal?: number
  observacoes?: string
  grua: { id, tipo, modelo, fabricante }
  obra: { id, nome, endereco, cidade, estado, status }
}
```

#### **Entrada do Livro**
```typescript
interface EntradaLivroGrua {
  id: number
  grua_id: string
  funcionario_id: number
  funcionario_nome: string
  data_entrada: string
  tipo_entrada: 'checklist' | 'manutencao' | 'falha'
  descricao: string
  status: 'pendente' | 'concluido' | 'cancelado'
  observacoes?: string
}
```

### **Fallback para Dados Mock**
```typescript
// Tenta API primeiro, fallback para mock
try {
  const response = await livroGruaApi.listarRelacoesGruaObra()
  setRelacoes(response.data)
} catch (apiError) {
  console.warn('API não disponível, usando dados mock')
  setRelacoes(mockRelacoesGruaObra)
}
```

## 🐛 Solução de Problemas

### **Erro: Select.Item value prop**
```bash
# Problema: Select com value=""
# Solução: Usar value="all" em vez de ""
<SelectItem value="all">Todas as obras</SelectItem>
```

### **Erro: NaN na URL**
```bash
# Problema: ID da grua como string na URL
# Solução: Usar ID da relação (número) em vez do ID da grua
/dashboard/livros-gruas/[relacaoId]/livro
```

### **API não disponível**
```bash
# Sistema usa dados mock automaticamente
# Logs no console indicam quando usa mock
```

## 📈 Roadmap

### **Fase 1 - Funcionamento Básico** ✅
- [x] Interface de seleção
- [x] Livro da grua
- [x] Dados mock
- [x] Filtros básicos

### **Fase 2 - Integração Backend** 🔄
- [ ] Endpoints de funcionários
- [ ] Autenticação completa
- [ ] Dados reais do Supabase
- [ ] Upload de arquivos

### **Fase 3 - Funcionalidades Avançadas** 📋
- [ ] Relatórios detalhados
- [ ] Notificações
- [ ] Auditoria de alterações
- [ ] Exportação avançada

## 🤝 Contribuição

### **Como Contribuir**
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### **Padrões de Código**
- TypeScript para tipagem
- ESLint para qualidade
- Prettier para formatação
- Componentes reutilizáveis

## 📞 Suporte

### **Documentação**
- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Lucide Icons](https://lucide.dev)

### **Issues**
- Use o sistema de issues do GitHub
- Inclua logs e passos para reproduzir
- Priorize bugs críticos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🎯 **Resumo Executivo**

O Sistema de Livros de Gruas é uma solução completa que permite aos funcionários registrarem ocorrências das gruas diretamente nas obras. O sistema funciona com dados mock para demonstração e está preparado para integração com backend real.

**Principais Benefícios:**
- ✅ **Interface Intuitiva**: Fácil de usar para funcionários
- ✅ **Dados Mock**: Funciona offline para demonstração
- ✅ **Fallback Inteligente**: Transição suave para dados reais
- ✅ **Filtros Avançados**: Encontre rapidamente o que precisa
- ✅ **Tipos de Entrada**: Checklist, manutenção e falhas
- ✅ **Responsivo**: Funciona em desktop e mobile

**Status Atual:** 🟢 **FUNCIONANDO** com dados mock, pronto para integração com backend real.
