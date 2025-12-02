# 📋 TASK-008: Implementar Validação Completa de Dados

**ID da Task:** TASK-008  
**Título:** Adicionar Validação Joi/Zod em Todas as Rotas POST/PUT  
**Fase:** 2  
**Módulo:** Segurança - Backend  
**Arquivo(s):** 
- `backend-api/src/routes/*.js` (todas as rotas)
- `backend-api/src/middleware/validation.js` (criar se não existir)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 MÉDIA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar validação completa de dados em todas as rotas POST/PUT do backend usando Joi ou Zod. Atualmente, algumas rotas não validam entrada adequadamente, o que pode levar a:
- Dados inválidos no banco
- Vulnerabilidades de segurança
- Erros em runtime
- Comportamento inesperado

Também implementar sanitização de inputs de texto e validação de tipos MIME de arquivos.

---

## 🎯 Objetivos

- [ ] Auditar todas as rotas POST/PUT para identificar falta de validação
- [ ] Criar schemas de validação para todas as rotas
- [ ] Implementar middleware de validação reutilizável
- [ ] Adicionar sanitização de inputs de texto
- [ ] Validar tipos MIME de arquivos
- [ ] Padronizar mensagens de erro de validação
- [ ] Documentar schemas de validação

---

## 📋 Situação Atual

### Validações Existentes

- ✅ Algumas rotas já usam Joi (ex: `complementos.js`, `colaboradores-documentos.js`)
- ⚠️ Muitas rotas não têm validação
- ⚠️ Validação não é padronizada
- ⚠️ Sanitização de inputs não é implementada
- ⚠️ Validação de tipos MIME pode ser melhorada

### Integrações Existentes

- ✅ Joi está instalado no projeto
- ✅ Alguns exemplos de validação existem
- ❌ Middleware de validação reutilizável não existe
- ❌ Sanitização não está implementada

---

## 🔧 Ações Necessárias

### Backend

- [ ] Criar middleware de validação (`backend-api/src/middleware/validation.js`):
  ```javascript
  import Joi from 'joi'
  
  export const validate = (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      })
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        })
      }
      
      req.body = value
      next()
    }
  }
  
  export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str
    return str.trim().replace(/[<>]/g, '') // Remover tags HTML básicas
  }
  ```

- [ ] Auditar todas as rotas e criar lista de rotas sem validação:
  - `backend-api/src/routes/obras.js`
  - `backend-api/src/routes/gruas.js`
  - `backend-api/src/routes/funcionarios.js`
  - `backend-api/src/routes/clientes.js`
  - `backend-api/src/routes/orcamentos.js`
  - `backend-api/src/routes/financeiro/*.js`
  - `backend-api/src/routes/rh/*.js`
  - Outras rotas

- [ ] Criar schemas de validação para cada rota:
  - Schemas para criar (POST)
  - Schemas para atualizar (PUT)
  - Schemas para queries (GET com parâmetros)

- [ ] Implementar validação em cada rota:
  ```javascript
  import { validate } from '../middleware/validation.js'
  import Joi from 'joi'
  
  const createSchema = Joi.object({
    nome: Joi.string().min(1).max(255).required(),
    // ... outros campos
  })
  
  router.post('/', validate(createSchema), async (req, res) => {
    // ...
  })
  ```

- [ ] Adicionar sanitização:
  - Sanitizar strings (trim, remover caracteres perigosos)
  - Validar emails
  - Validar URLs
  - Validar CPF/CNPJ

- [ ] Melhorar validação de arquivos:
  - Validar tipos MIME permitidos
  - Validar tamanho máximo
  - Validar extensões

- [ ] Padronizar mensagens de erro:
  - Formato consistente
  - Mensagens amigáveis
  - Detalhes técnicos em desenvolvimento

### Documentação

- [ ] Documentar schemas de validação
- [ ] Criar guia de validação para novos desenvolvedores
- [ ] Listar tipos MIME permitidos

---

## 🔌 Exemplos de Validação

### Schema de Criação de Obra
```javascript
const createObraSchema = Joi.object({
  nome: Joi.string().min(1).max(255).required(),
  cliente_id: Joi.string().uuid().required(),
  endereco: Joi.string().min(1).max(500).required(),
  cidade: Joi.string().min(1).max(100).required(),
  estado: Joi.string().length(2).required(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).required(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().greater(Joi.ref('data_inicio')).optional(),
  status: Joi.string().valid('planejamento', 'em_andamento', 'pausada', 'concluida').default('planejamento')
})
```

### Schema de Upload de Arquivo
```javascript
const uploadSchema = Joi.object({
  tipo: Joi.string().valid('pdf', 'imagem', 'documento').required(),
  tamanho_maximo: Joi.number().max(10 * 1024 * 1024).required() // 10MB
})

const allowedMimeTypes = {
  pdf: ['application/pdf'],
  imagem: ['image/jpeg', 'image/png', 'image/gif'],
  documento: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}
```

---

## ✅ Critérios de Aceitação

- [ ] Todas as rotas POST/PUT têm validação
- [ ] Middleware de validação reutilizável criado
- [ ] Schemas de validação padronizados
- [ ] Sanitização de inputs implementada
- [ ] Validação de tipos MIME implementada
- [ ] Mensagens de erro padronizadas
- [ ] Documentação atualizada
- [ ] Testes de validação criados
- [ ] Validações testadas e funcionando

---

## 🧪 Casos de Teste

### Teste 1: Validação de Campo Obrigatório
**Dado:** Rota que requer campo obrigatório  
**Quando:** Enviar requisição sem campo obrigatório  
**Então:** Deve retornar erro 400 com mensagem clara

### Teste 2: Validação de Tipo
**Dado:** Rota que requer número  
**Quando:** Enviar string no lugar de número  
**Então:** Deve retornar erro 400

### Teste 3: Validação de Formato
**Dado:** Rota que requer email  
**Quando:** Enviar email inválido  
**Então:** Deve retornar erro 400

### Teste 4: Sanitização de String
**Dado:** String com espaços e caracteres perigosos  
**Quando:** Processar string  
**Então:** Deve remover espaços e caracteres perigosos

### Teste 5: Validação de Arquivo
**Dado:** Upload de arquivo  
**Quando:** Enviar tipo MIME não permitido  
**Então:** Deve retornar erro 400

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-007 - Restringir CORS (parte de segurança)
- TASK-009 - Adicionar índices (validação pode melhorar queries)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "4.3 Validação de Dados"
- `backend-api/src/routes/complementos.js` - Exemplo de validação existente
- Documentação Joi: https://joi.dev/

---

## 💡 Notas Técnicas

1. **Joi vs Zod:** Verificar qual biblioteca já está sendo usada. Se ambas, padronizar em uma.

2. **Performance:** Validação não deve impactar performance significativamente. Usar `stripUnknown: true` para remover campos não esperados.

3. **Sanitização:** Não usar bibliotecas pesadas. Implementar sanitização básica (trim, remover tags HTML básicas).

4. **Validação de Arquivos:** Validar no middleware de upload (Multer) antes de processar.

5. **Mensagens de Erro:** Em produção, não expor detalhes técnicos. Em desenvolvimento, mostrar detalhes completos.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Validação muito restritiva pode quebrar integrações existentes
  - **Mitigação:** Testar extensivamente, usar `stripUnknown: true`

- **Risco 2:** Muitas rotas para validar
  - **Mitigação:** Priorizar rotas críticas, fazer incrementalmente

- **Risco 3:** Performance pode ser impactada
  - **Mitigação:** Validar apenas campos necessários, otimizar schemas

---

## 📊 Estimativas

**Tempo Estimado:** 5-7 dias  
**Complexidade:** Alta  
**Esforço:** Grande

**Breakdown:**
- Auditoria de rotas: 4 horas
- Criar middleware: 2 horas
- Criar schemas: 2-3 dias
- Implementar validações: 2-3 dias
- Testes: 1 dia
- Documentação: 4 horas

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada |

---

## ✅ Checklist Final

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review realizado
- [ ] Documentação atualizada
- [ ] Deploy em dev
- [ ] Testes em dev
- [ ] Deploy em homologação
- [ ] Testes em homologação
- [ ] Aprovação do PO
- [ ] Deploy em produção
- [ ] Verificação em produção
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

