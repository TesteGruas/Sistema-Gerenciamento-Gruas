# Script de Teste Automatizado - Criação de Obra

Script Python usando Playwright para testar o fluxo de criação de obra no sistema.

## 📋 Requisitos

1. Python 3.7 ou superior
2. Playwright instalado

## 🚀 Instalação

```bash
# Instalar Playwright
pip install playwright==1.47.0

# Instalar navegador Chromium
playwright install chromium
```

## ⚙️ Configuração

Edite o arquivo `teste-criacao-obra.py` e ajuste as configurações no início do arquivo:

```python
HEADLESS = False  # False = mostra navegador (recomendado para acompanhar)
SLOWMO = 500      # ms entre ações (500ms = meio segundo)
TIMEOUT_MS = 60000  # 60s: tempo padrão de ações
BASE_URL = "http://localhost:3000"  # URL base do sistema

# Credenciais
LOGIN_EMAIL = "admin@admin.com"
LOGIN_PASSWORD = "teste@123"
```

## ▶️ Execução

```bash
python3 teste-criacao-obra.py
```

## 📝 O que o script faz

1. **Login**: Abre o navegador e faz login com as credenciais configuradas
2. **Navegação**: Vai para a página de criação de obra (`/dashboard/obras/nova`)
3. **Preenchimento**: Preenche os campos do formulário passo a passo:
   - Nome da obra
   - Descrição
   - Data de início
   - Endereço
   - Cidade
   - Estado
   - Tipo de obra
   - Orçamento
   - Cliente (busca e seleciona)
   - Grua (na aba Grua)
4. **Submissão**: Tenta criar a obra clicando no botão de submit
5. **Verificação**: Verifica se houve sucesso ou erro

## ⏱️ Delays

Cada passo tem um delay configurável para que você possa acompanhar em tempo real:
- **SLOWMO**: Delay entre ações do Playwright (500ms padrão)
- **Delays explícitos**: Entre 1-3 segundos após cada ação importante

## 📊 Logs

O script gera logs em dois lugares:
1. **Console**: Saída em tempo real no terminal
2. **Arquivo**: Log salvo em `teste-obra-YYYYMMDD-HHMMSS.log`

## 🔍 Acompanhamento

Com `HEADLESS = False`, você verá o navegador abrir e todas as ações sendo executadas em tempo real. Isso permite:
- Ver exatamente o que está acontecendo
- Identificar problemas visuais
- Acompanhar o fluxo passo a passo

## ⚠️ Observações

- O script tenta preencher todos os campos obrigatórios
- Se algum campo não for encontrado, o script continua e registra um aviso
- Campos obrigatórios que falharem podem impedir a criação da obra
- O script mantém o navegador aberto por 30 segundos no final para inspeção manual

## 🐛 Troubleshooting

Se o script não funcionar:

1. **Verifique se o servidor está rodando**: A URL `BASE_URL` deve estar acessível
2. **Verifique as credenciais**: Email e senha devem estar corretos
3. **Verifique os seletores**: Se a estrutura HTML mudou, os seletores podem precisar ser atualizados
4. **Aumente os delays**: Se a página carrega lentamente, aumente `SLOWMO` e os delays explícitos
5. **Verifique os logs**: O arquivo de log contém informações detalhadas sobre erros

## 📝 Personalização

Você pode modificar o script para:
- Preencher campos adicionais
- Testar diferentes cenários
- Adicionar validações
- Capturar screenshots em pontos específicos

