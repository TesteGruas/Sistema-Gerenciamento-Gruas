# 🚀 Guia Rápido de Teste - Novas Funcionalidades

## ✅ O Que Foi Implementado

### 1. 📍 **Validação de Geolocalização**
- Funcionário deve estar perto da obra para registrar ponto
- Cálculo de distância em tempo real
- Feedback visual (verde = OK, vermelho = longe)

### 2. ✍️ **Assinatura Digital para Hora Extra**
- Detecta automaticamente quando passa de 8h
- Exige assinatura do funcionário
- Envia para aprovação do gestor

### 3. 👔 **Modo Simular Gestor**
- Toggle na página de perfil
- Testa funcionalidades de encarregador
- Ativa menu "Encarregador"

---

## 🧪 Como Testar AGORA (5 minutos)

### Teste 1: Validação de Localização ⏱️ 2min

```bash
# 1. Faça login no PWA
http://72.60.60.118:3000/pwa/login

# 2. Vá para Ponto
Clique em "Ponto" no menu

# 3. Valide Localização
Clique no botão azul "Validar Localização"
Permita acesso ao GPS

# 4. Resultado esperado:
✅ Card verde com distância (se próximo)
❌ Card vermelho (se longe)
```

**⚠️ Se sempre der "longe":**
```bash
# Aumentar raio temporariamente para teste
# Edite: lib/geolocation-validator.ts
raio_permitido: 10000  # 10km para teste
```

---

### Teste 2: Hora Extra com Assinatura ⏱️ 3min

```bash
# 1. Ative Modo Gestor
Vá em: /pwa/perfil
Ative o switch "Simular Gestor"
Aguarde reload

# 2. Registre Entrada
Vá em: /pwa/ponto
Valide localização
Clique "Entrada" (ex: 08:00)

# 3. Force Hora Extra
Opção A: Altere hora do celular para 18:30
Opção B: Edite manualmente registrosHoje.entrada no código

# 4. Registre Saída
Clique "Saída"

# 5. Resultado esperado:
🎨 Diálogo de assinatura aparece
📝 Mostra "1.5 horas extras"
✍️ Canvas para assinar
```

**Como Assinar:**
- Mobile: Use o dedo
- Desktop: Use o mouse
- Clique "Confirmar Assinatura"

---

### Teste 3: Modo Gestor ⏱️ 1min

```bash
# 1. Vá para Perfil
/pwa/perfil

# 2. Ative Modo Gestor
Role até "Modo de Teste - Simular Gestor"
Clique no switch para ATIVAR

# 3. Aguarde
Página recarrega automaticamente

# 4. Verifique
✅ Menu "Encarregador" apareceu (ícone Building2)
✅ Cargo mudou para "Encarregador Simulado"
✅ Card laranja mostrando funcionalidades

# 5. Teste Aprovação
Clique em "Encarregador" no menu
Veja registros pendentes
Aprove ou rejeite uma hora extra
```

---

## 📱 Acesso Rápido

```
🌐 URL do PWA
http://72.60.60.118:3000/pwa

📍 Página de Ponto
http://72.60.60.118:3000/pwa/ponto

👤 Página de Perfil
http://72.60.60.118:3000/pwa/perfil

👔 Página Encarregador
http://72.60.60.118:3000/pwa/encarregador
```

---

## 🎯 Checklist de Teste

- [ ] GPS funciona e captura localização
- [ ] Validação mostra distância correta
- [ ] Card verde quando próximo
- [ ] Card vermelho quando longe
- [ ] Ponto só registra se validado
- [ ] Hora extra detectada automaticamente
- [ ] Diálogo de assinatura aparece
- [ ] Canvas de assinatura funciona
- [ ] Assinatura é salva
- [ ] Modo Gestor ativa corretamente
- [ ] Menu Encarregador aparece
- [ ] Registros pendentes aparecem
- [ ] Aprovação funciona

---

## 🐛 Problemas Comuns

### GPS não funciona
- Usar HTTPS ou localhost
- Dar permissão no navegador
- Testar em dispositivo real

### Sempre "fora do raio"
```typescript
// Aumentar raio em lib/geolocation-validator.ts
raio_permitido: 10000  // 10km
```

### Assinatura não aparece
- Verificar se > 8h trabalhadas
- Ver console.log do navegador
- Conferir horários de entrada/saída

### Modo Gestor não ativa
- Limpar localStorage
- Fazer logout/login
- Recarregar página

---

## 🚀 Deploy no Servidor

```bash
# SSH no servidor
ssh root@72.60.60.118

# Ir para pasta
cd /home/Sistema-Gerenciamento-Gruas

# Atualizar
git pull

# Build
npm run build

# Restart
pm2 restart all

# Ver logs
pm2 logs
```

---

## 📝 Arquivos Importantes

```
components/
  └── signature-pad.tsx          # Canvas de assinatura

lib/
  └── geolocation-validator.ts   # Validação GPS

app/pwa/
  ├── ponto/page.tsx             # Página de ponto
  └── perfil/page.tsx            # Página de perfil
```

---

## 💡 Dicas

1. **Teste no Mobile**: Funcionalidades foram feitas para touch
2. **Use GPS Real**: Emulador pode não funcionar bem
3. **Modo Gestor**: Ative para ver tudo funcionando
4. **Console**: Abra para ver logs úteis

---

**Criado em:** 10/10/2025  
**Status:** ✅ Pronto para Teste

