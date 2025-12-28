# Solução para Erro de Build do Next.js na VPS

## Erro
```
Cannot find module '../server/node-polyfill-crypto'
```

## Causa
Este erro geralmente ocorre quando:
- Os `node_modules` estão corrompidos ou incompletos
- Há incompatibilidade entre versões do Node.js e Next.js
- A instalação do Next.js foi interrompida ou falhou
- Cache do npm está corrompido

## Solução Automática (Recomendada)

Execute o script de correção na VPS:

```bash
cd /home/Sistema-Gerenciamento-Gruas
bash scripts/fix-build-error.sh
```

## Solução Manual

### Passo 1: Verificar Versão do Node.js
```bash
node --version
```
**Recomendado:** Node.js 18.x ou 20.x

Se a versão for muito antiga ou muito nova, atualize:
```bash
# Usando nvm (recomendado)
nvm install 20
nvm use 20

# Ou usando apt (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Passo 2: Limpar Cache e Dependências
```bash
cd /home/Sistema-Gerenciamento-Gruas

# Limpar cache do npm
npm cache clean --force

# Remover node_modules e arquivos de lock
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next
```

### Passo 3: Verificar Espaço em Disco
```bash
df -h
```
Certifique-se de que há pelo menos 2GB de espaço livre.

### Passo 4: Reinstalar Dependências
```bash
# Reinstalar todas as dependências
npm install

# Se ainda falhar, tente com --force
npm install --force
```

### Passo 5: Verificar Instalação do Next.js
```bash
# Verificar se o módulo existe
ls -la node_modules/next/dist/server/node-polyfill-crypto.js

# Se não existir, reinstalar Next.js especificamente
npm install next@15.2.4 --force
```

### Passo 6: Tentar Build Novamente
```bash
npm run build
```

## Soluções Alternativas

### Opção 1: Atualizar Next.js
Se o problema persistir, tente atualizar para a versão mais recente:
```bash
npm install next@latest --force
npm run build
```

### Opção 2: Downgrade do Next.js
Se a atualização causar problemas, tente uma versão estável anterior:
```bash
npm install next@15.1.0 --force
npm run build
```

### Opção 3: Usar Yarn ao invés de npm
```bash
# Instalar yarn
npm install -g yarn

# Limpar e reinstalar
rm -rf node_modules package-lock.json .next
yarn install
yarn build
```

### Opção 4: Verificar Permissões
```bash
# Verificar permissões do diretório
ls -la

# Se necessário, corrigir permissões
chown -R $USER:$USER /home/Sistema-Gerenciamento-Gruas
chmod -R 755 /home/Sistema-Gerenciamento-Gruas
```

## Verificação Pós-Correção

Após aplicar a solução, verifique:

1. **Módulo existe:**
   ```bash
   ls -la node_modules/next/dist/server/node-polyfill-crypto.js
   ```

2. **Build funciona:**
   ```bash
   npm run build
   ```

3. **Versões compatíveis:**
   ```bash
   node --version  # Deve ser 18.x ou 20.x
   npm --version   # Deve ser 9.x ou 10.x
   ```

## Prevenção

Para evitar este problema no futuro:

1. **Sempre use Node.js LTS:**
   ```bash
   nvm install --lts
   nvm use --lts
   ```

2. **Mantenha dependências atualizadas:**
   ```bash
   npm outdated
   npm update
   ```

3. **Use lock files:**
   - Sempre commite `package-lock.json`
   - Use `npm ci` em produção ao invés de `npm install`

4. **Limpe cache periodicamente:**
   ```bash
   npm cache clean --force
   ```

## Logs de Debug

Se o problema persistir, colete informações:

```bash
# Informações do sistema
node --version
npm --version
uname -a

# Informações do Next.js
npm list next

# Verificar estrutura do Next.js
ls -la node_modules/next/dist/server/ | grep crypto

# Logs detalhados do build
npm run build -- --debug
```

## Contato e Suporte

Se nenhuma solução funcionar, forneça:
- Versão do Node.js (`node --version`)
- Versão do npm (`npm --version`)
- Versão do Next.js (`npm list next`)
- Output completo do erro
- Sistema operacional (`uname -a`)






