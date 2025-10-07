# IRBANA PWA - Sistema de Ponto e Assinatura

## 📱 Sobre o PWA

O IRBANA PWA é uma aplicação web progressiva (Progressive Web App) desenvolvida para gerenciar o sistema de ponto eletrônico e assinatura digital da empresa IRBANA.

## ✨ Funcionalidades

### 🔐 Autenticação
- Login seguro com credenciais
- Suporte a diferentes tipos de usuário (Admin, Operador)
- Sessão persistente

### ⏰ Ponto Eletrônico
- Registro de entrada e saída
- Controle de intervalos (almoço)
- Status em tempo real
- Funcionamento offline
- Sincronização automática

### 📝 Assinatura Digital
- Visualização de documentos
- Assinatura digital de documentos
- Controle de status (pendente, assinado, rejeitado)
- Histórico de assinaturas

### 📱 Recursos PWA
- **Instalável**: Pode ser instalado na tela inicial
- **Offline**: Funciona sem conexão com internet
- **Notificações**: Lembretes e atualizações
- **Responsivo**: Adaptado para mobile e desktop
- **Sincronização**: Dados sincronizados automaticamente

## 🚀 Como Acessar

### 1. Via Navegador
Acesse: `https://seudominio.com/pwa`

### 2. Instalação no Dispositivo
1. Abra o PWA no navegador
2. Clique no botão "Instalar" quando aparecer
3. Ou use o menu do navegador: "Adicionar à tela inicial"

### 3. Credenciais de Teste
- **Admin**: usuário: `admin` | senha: `123456`
- **Operador**: usuário: `operador` | senha: `123456`

## 🛠️ Tecnologias Utilizadas

- **Next.js 15**: Framework React
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Radix UI**: Componentes acessíveis
- **Service Worker**: Cache e funcionalidade offline
- **Web App Manifest**: Configuração PWA

## 📁 Estrutura do Projeto

```
app/pwa/
├── layout.tsx          # Layout principal do PWA
├── page.tsx            # Dashboard principal
├── login/page.tsx      # Página de login
├── ponto/page.tsx      # Sistema de ponto
├── assinatura/page.tsx # Sistema de assinatura
└── redirect/page.tsx   # Página de redirecionamento

components/
├── pwa-install-prompt.tsx  # Componente de instalação
└── pwa-notifications.tsx   # Sistema de notificações

public/
├── manifest.json       # Manifesto PWA
├── sw.js              # Service Worker
└── placeholder-logo.png # Ícones
```

## 🔧 Configuração

### 1. Service Worker
O service worker está configurado para:
- Cache de recursos estáticos
- Funcionamento offline
- Sincronização em background

### 2. Manifest
Configurado para:
- Instalação como app nativo
- Ícones e temas
- Orientação e display

### 3. Notificações
- Lembretes de ponto
- Documentos pendentes
- Atualizações do sistema

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 80+
- Firefox 72+
- Safari 13+
- Edge 80+

### Dispositivos
- Android 5.0+
- iOS 13+
- Desktop (Windows, macOS, Linux)

## 🔒 Segurança

- Autenticação obrigatória
- Dados criptografados em trânsito
- Cache seguro
- Validação de permissões

## 🚀 Deploy

### 1. Build do Projeto
```bash
npm run build
```

### 2. Configuração do Servidor
- HTTPS obrigatório para PWA
- Headers de segurança configurados
- Service Worker registrado

### 3. Verificação PWA
Use o Lighthouse para verificar:
- Performance
- Acessibilidade
- PWA compliance
- SEO

## 📊 Monitoramento

### Métricas Importantes
- Taxa de instalação
- Uso offline
- Performance de cache
- Notificações entregues

### Analytics
- Eventos de ponto
- Assinaturas realizadas
- Tempo de uso
- Erros e falhas

## 🐛 Troubleshooting

### Problemas Comuns

1. **PWA não instala**
   - Verificar HTTPS
   - Checar manifest.json
   - Validar service worker

2. **Não funciona offline**
   - Verificar cache
   - Checar service worker
   - Validar recursos

3. **Notificações não aparecem**
   - Verificar permissões
   - Checar configuração
   - Validar browser support

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o PWA:
- Email: suporte@irbana.com
- Telefone: (11) 99999-9999
- Documentação: [Link para docs]

## 📄 Licença

© 2024 IRBANA - Todos os direitos reservados.
