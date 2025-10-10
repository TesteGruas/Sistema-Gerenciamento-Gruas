# 🚀 Guia Rápido de Integração

Este guia mostra como integrar as novas funcionalidades nos módulos existentes.

---

## 📤 1. Adicionar Exportação em um Módulo

### Passo 1: Importar o componente
```tsx
import { ExportButton } from '@/components/export-button'
```

### Passo 2: Adicionar ao seu componente
```tsx
// No seu componente, onde você tem a lista de dados:
<div className="flex justify-between items-center mb-4">
  <h2>Lista de {moduloName}</h2>
  <ExportButton
    dados={seusDados}
    tipo="gruas" // ou 'obras', 'funcionarios', 'clientes', etc
    nomeArquivo="relatorio-gruas"
    titulo="Relatório de Gruas"
    // Opcional: definir colunas customizadas
    colunas={[
      { key: 'name', label: 'Nome' },
      { key: 'model', label: 'Modelo' },
      { key: 'status', label: 'Status' }
    ]}
  />
</div>
```

### Exemplo Completo - Página de Gruas
```tsx
'use client'

import { useState, useEffect } from 'react'
import { ExportButton } from '@/components/export-button'
import { LoadingSpinner } from '@/components/loading-spinner'
import { EmptyState } from '@/components/empty-state'
import { Briefcase } from 'lucide-react'

export default function GruasPage() {
  const [gruas, setGruas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar gruas
    fetchGruas()
  }, [])

  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando gruas..." />
  }

  if (gruas.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Nenhuma grua encontrada"
        description="Não há gruas cadastradas no sistema"
        action={{
          label: "Cadastrar Grua",
          onClick: () => router.push('/gruas/nova')
        }}
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gruas</h1>
        <ExportButton
          dados={gruas}
          tipo="gruas"
          nomeArquivo="gruas-ativas"
          titulo="Relatório de Gruas Ativas"
        />
      </div>
      
      {/* Sua tabela ou lista de gruas aqui */}
    </div>
  )
}
```

---

## 🎨 2. Usar Componentes Visuais

### LoadingSpinner
```tsx
import { LoadingSpinner } from '@/components/loading-spinner'

// Tamanhos: sm, md, lg, xl
<LoadingSpinner size="md" text="Carregando..." />

// Full screen
<LoadingSpinner size="lg" text="Processando..." fullScreen />
```

### EmptyState
```tsx
import { EmptyState } from '@/components/empty-state'
import { Inbox } from 'lucide-react'

<EmptyState
  icon={Inbox}
  title="Nenhum resultado"
  description="Não foram encontrados registros com os filtros aplicados"
  action={{
    label: "Limpar Filtros",
    onClick: handleClearFilters
  }}
/>
```

### SuccessAnimation
```tsx
import { SuccessAnimation } from '@/components/success-animation'

const [showSuccess, setShowSuccess] = useState(false)

const handleSave = async () => {
  await saveData()
  setShowSuccess(true)
}

return (
  <>
    {/* Seu conteúdo */}
    <SuccessAnimation
      show={showSuccess}
      message="Salvo com sucesso!"
      onComplete={() => setShowSuccess(false)}
      duration={2000}
    />
  </>
)
```

### StatsCard
```tsx
import { StatsCard } from '@/components/stats-card'
import { Briefcase } from 'lucide-react'

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <StatsCard
    title="Total de Gruas"
    value="45"
    icon={Briefcase}
    description="Ativas no sistema"
    trend={{ value: "+5%", isPositive: true }}
    color="blue"
    onClick={() => router.push('/gruas')}
  />
  <StatsCard
    title="Em Manutenção"
    value="3"
    icon={Briefcase}
    color="orange"
  />
  <StatsCard
    title="Disponíveis"
    value="42"
    icon={Briefcase}
    color="green"
  />
</div>
```

### ActionCard
```tsx
import { ActionCard } from '@/components/action-card'
import { Clock, FileSignature, Briefcase } from 'lucide-react'

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <ActionCard
    title="Registrar Ponto"
    description="Marcar entrada, saída e intervalos"
    icon={Clock}
    color="blue"
    onClick={() => router.push('/ponto')}
  />
  <ActionCard
    title="Assinar Documentos"
    description="2 documentos pendentes"
    icon={FileSignature}
    color="green"
    badge={{ text: "2", variant: "destructive" }}
    onClick={() => router.push('/documentos')}
  />
  <ActionCard
    title="Gerenciar Gruas"
    description="Ver e editar gruas"
    icon={Briefcase}
    color="purple"
    onClick={() => router.push('/gruas')}
  />
</div>
```

---

## 🔔 3. Integrar Notificações

### No componente raiz do seu app/módulo:
```tsx
import { useEffect } from 'react'
import { pwaNotifications } from '@/lib/pwa-notifications'

useEffect(() => {
  // Inicializar serviço de notificações
  pwaNotifications.initialize()
  
  // Solicitar permissão
  pwaNotifications.requestPermission()
  
  // Agendar lembretes automáticos
  pwaNotifications.scheduleAllReminders()
}, [])
```

### Enviar notificação personalizada:
```tsx
import { pwaNotifications } from '@/lib/pwa-notifications'

const handleAction = async () => {
  // Sua lógica aqui...
  
  // Enviar notificação
  await pwaNotifications.showNotification('Ação Concluída', {
    body: 'Sua ação foi realizada com sucesso!',
    tag: 'action-completed',
    icon: '/icon-192x192.png',
    data: { url: '/caminho/para/detalhes' }
  })
}
```

### Notificações específicas:
```tsx
// Após registrar ponto
await pwaNotifications.notifyPontoRegistered('entrada')

// Após assinar documento
await pwaNotifications.notifyDocumentSigned('Contrato de Trabalho.pdf')
```

---

## 📡 4. Adicionar Sincronização Offline

### Para registro de ponto:
```tsx
import { offlineSync } from '@/lib/offline-sync'
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

const handleRegistrarPonto = async (tipo: string) => {
  try {
    const result = await offlineSync.syncPonto(
      funcionarioId,
      tipo,
      localizacao
    )
    
    if (result.offline) {
      toast({
        title: "Registrado offline",
        description: "Será sincronizado quando voltar online",
        variant: "default"
      })
    } else {
      toast({
        title: "Ponto registrado",
        description: "Registro enviado com sucesso",
      })
    }
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível registrar o ponto",
      variant: "destructive"
    })
  }
}
```

### Para assinatura de documento:
```tsx
import { offlineSync } from '@/lib/offline-sync'

const handleAssinarDocumento = async (documentoId: number, assinatura: string) => {
  const result = await offlineSync.syncDocumento(documentoId, assinatura)
  
  if (result.offline) {
    // Mostrar feedback de offline
    setMensagem("Assinatura salva. Será enviada quando voltar online.")
  } else {
    // Sucesso online
    setMensagem("Documento assinado com sucesso!")
  }
}
```

### Adicionar indicador de sincronização:
```tsx
import { OfflineSyncIndicator } from '@/components/offline-sync-indicator'

// No topo da sua página/layout:
<div className="mb-4">
  <OfflineSyncIndicator />
</div>
```

---

## 🎯 5. Padrão Completo de Página

Aqui está um exemplo completo de como uma página deve ficar com todas as funcionalidades integradas:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// Componentes novos
import { ExportButton } from '@/components/export-button'
import { LoadingSpinner } from '@/components/loading-spinner'
import { EmptyState } from '@/components/empty-state'
import { SuccessAnimation } from '@/components/success-animation'
import { StatsCard } from '@/components/stats-card'
import { ActionCard } from '@/components/action-card'
import { OfflineSyncIndicator } from '@/components/offline-sync-indicator'

// Ícones
import { Briefcase, Plus, Search } from 'lucide-react'

// Hooks
import { useToast } from '@/hooks/use-toast'

export default function ModuloPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Sua lógica de carregamento
      const response = await fetch('/api/seu-endpoint')
      const data = await response.json()
      setDados(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNovo = () => {
    router.push('/seu-modulo/novo')
  }

  const handleSalvar = async () => {
    // Lógica de salvar
    setShowSuccess(true)
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando dados..." />
  }

  // Empty state
  if (dados.length === 0 && !filtro) {
    return (
      <div className="p-6">
        <OfflineSyncIndicator />
        <EmptyState
          icon={Briefcase}
          title="Nenhum registro encontrado"
          description="Comece adicionando seu primeiro registro"
          action={{
            label: "Adicionar Novo",
            onClick: handleNovo
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Indicador offline */}
      <OfflineSyncIndicator />
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seu Módulo</h1>
          <p className="text-gray-600">Gerencie seus registros</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            dados={dados}
            tipo="gruas" // seu tipo
            nomeArquivo="relatorio"
            titulo="Relatório"
          />
          <Button onClick={handleNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total"
          value={dados.length}
          icon={Briefcase}
          color="blue"
        />
        {/* Mais stats... */}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista/Tabela de dados */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Registros</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sua tabela ou lista aqui */}
        </CardContent>
      </Card>

      {/* Animação de sucesso */}
      <SuccessAnimation
        show={showSuccess}
        message="Operação realizada com sucesso!"
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  )
}
```

---

## 📋 Checklist de Integração

Ao adicionar as novas funcionalidades em um módulo, verifique:

### Exportação:
- [ ] Importou `ExportButton`
- [ ] Adicionou o botão na interface
- [ ] Definiu o `tipo` correto
- [ ] Opcionalmente, definiu `colunas` customizadas

### Componentes Visuais:
- [ ] Usa `LoadingSpinner` para estados de loading
- [ ] Usa `EmptyState` quando não há dados
- [ ] Usa `SuccessAnimation` para feedback de sucesso
- [ ] Usa `StatsCard` para estatísticas
- [ ] Usa `ActionCard` para ações rápidas

### Notificações:
- [ ] Inicializou `pwaNotifications` no componente raiz
- [ ] Envia notificações em ações importantes
- [ ] Definiu `tags` únicos para cada tipo de notificação

### Sincronização Offline:
- [ ] Importou `offlineSync` em ações críticas
- [ ] Usa `syncPonto` ou `syncDocumento` conforme necessário
- [ ] Mostra feedback apropriado (online/offline)
- [ ] Adicionou `OfflineSyncIndicator` na interface

---

## 🎨 Paleta de Cores

Use as cores consistentes nos componentes:

- **blue** - Ações principais, informações
- **green** - Sucesso, confirmações positivas
- **orange** - Alertas, atenção necessária
- **purple** - Secundário, alternativo
- **red** - Erros, ações destrutivas
- **indigo** - Especial, destaque

---

## 🚀 Dicas de Performance

1. **Lazy Load:** Importe componentes pesados dinamicamente
   ```tsx
   const ExportButton = dynamic(() => import('@/components/export-button'))
   ```

2. **Memoização:** Use `React.memo` para componentes que renderizam listas
   ```tsx
   const ListItem = React.memo(({ item }) => ...)
   ```

3. **Debounce:** Para filtros e buscas
   ```tsx
   const debouncedSearch = useDebouncedValue(searchTerm, 500)
   ```

---

## 📚 Recursos Adicionais

- **Documentação Completa:** `IMPLEMENTACOES_FRONTEND_PWA.md`
- **Resumo Executivo:** `RESUMO_IMPLEMENTACOES.md`
- **Código dos Componentes:** Veja os arquivos em `/components`

---

## 💡 Exemplos Práticos

Veja os seguintes arquivos para exemplos reais de uso:

1. **PWA Main Page:** `app/pwa/page.tsx`
2. **PWA Perfil:** `app/pwa/perfil/page.tsx`
3. **PWA Notificações:** `app/pwa/notificacoes/page.tsx`
4. **PWA Layout:** `app/pwa/layout.tsx`

---

## 🎯 Conclusão

Com este guia, você pode rapidamente integrar todas as novas funcionalidades em qualquer módulo do sistema. 

**Lembre-se:**
- Mantenha a consistência visual
- Use os componentes reutilizáveis
- Forneça feedback claro ao usuário
- Pense em offline-first
- Teste em diferentes tamanhos de tela

**Dúvidas?** Consulte a documentação completa ou os exemplos de código.

---

**Happy coding! 🚀**

