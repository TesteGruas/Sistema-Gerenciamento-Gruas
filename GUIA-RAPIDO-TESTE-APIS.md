# 🚀 Guia Rápido - Teste de APIs

## Executar o Script de Teste

### Método 1: Direto (mais simples)

```bash
# Na raiz do projeto
node scripts/test-all-apis.js
```

### Método 2: Com credenciais personalizadas

```bash
# Linux/Mac
TEST_EMAIL=seu@email.com TEST_PASSWORD=suasenha node scripts/test-all-apis.js

# Windows (PowerShell)
$env:TEST_EMAIL="seu@email.com"; $env:TEST_PASSWORD="suasenha"; node scripts/test-all-apis.js
```

### Método 3: Via npm script (se adicionado)

```bash
npm run test:apis
```

## ⚠️ Antes de Executar

1. **Certifique-se que o backend está rodando:**
   ```bash
   cd backend-api
   npm run dev
   ```

2. **Verifique se tem as dependências:**
   ```bash
   cd backend-api
   npm install
   ```
   (axios e dotenv já devem estar instalados)

## 📊 O que o Script Faz

1. ✅ Faz login com suas credenciais
2. ✅ Obtém token de autenticação
3. ✅ Testa **TODAS** as APIs do sistema:
   - Autenticação
   - Usuários
   - Gruas e Componentes
   - Obras
   - Clientes
   - Orçamentos e Medições
   - Estoque e Produtos
   - Funcionários e RH
   - Ponto Eletrônico
   - Financeiro
   - Relatórios
   - E muito mais...

4. ✅ Mostra resultados coloridos:
   - ✓ Verde = Passou
   - ✗ Vermelho = Falhou
   - ⊘ Amarelo = Pulado (sem dados)

5. ✅ Gera estatísticas finais:
   - Total de testes
   - Quantos passaram/falharam
   - Taxa de sucesso
   - Tempo de execução

## 📝 Exemplo de Saída

```
╔════════════════════════════════════════════════════════════╗
║     TESTE COMPLETO DE APIs - Sistema de Gerenciamento     ║
╚════════════════════════════════════════════════════════════╝

API URL: http://localhost:3001
Email: admin@admin.com

🔐 AUTENTICAÇÃO
  → Login... ✓ (200)
  → Verificar Token... ✓ (200)

👥 USUÁRIOS
  → Listar Usuários... ✓ (200)
  → Buscar Usuário por ID... ✓ (200)

🏗️ GRUAS
  → Listar Gruas... ✓ (200)
  → Buscar Grua por ID... ✓ (200)

...

RESUMO DOS TESTES
════════════════════════════════════════════════════════════

  Total de testes:     85
  ✓ Passou:            82
  ✗ Falhou:            3
  ⊘ Pulado:            0
  Tempo de execução:   12.45s

  Taxa de sucesso:     96.5%
```

## 🐛 Problemas Comuns

### "Cannot find module 'axios'"
```bash
cd backend-api && npm install
```

### "ECONNREFUSED"
O backend não está rodando. Inicie com:
```bash
cd backend-api && npm run dev
```

### "401 Unauthorized"
Suas credenciais estão incorretas. Use:
```bash
TEST_EMAIL=seu@email.com TEST_PASSWORD=suasenha node scripts/test-all-apis.js
```

## 📚 Documentação Completa

Veja `scripts/README-TEST-APIS.md` para documentação detalhada.

