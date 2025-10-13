# 🎨 PENDÊNCIAS DO FRONTEND - Sistema de Gerenciamento de Gruas

**Data:** 09 de Outubro de 2025  
**Status Frontend:** 85% Completo  
**Tempo Estimado para Conclusão:** 3 semanas

---

## 📊 RESUMO EXECUTIVO

| Categoria | Total | Completo | Pendente | % |
|-----------|-------|----------|----------|---|
| **Módulos Financeiros** | 8 | 4 | 4 | 50% |
| **Módulos RH** | 6 | 5 | 1 | 83% |
| **Exportação/Relatórios** | 5 | 1 | 4 | 20% |
| **Componentes Globais** | 4 | 3 | 1 | 75% |
| **PWA** | 5 | 4 | 1 | 80% |
| **Integrações UI** | 10 | 8 | 2 | 80% |
| **TOTAL** | **38** | **25** | **13** | **66%** |

---

## 🔴 PRIORIDADE CRÍTICA

### 1. Sistema de Exportação Universal
**Localização:** `components/export-button.tsx` (NÃO EXISTE)  
**Status:** ❌ Não implementado  
**Impacto:** Todos os módulos do sistema

#### Descrição:
Criar um componente reutilizável para exportação de dados em PDF, Excel e CSV que possa ser usado em qualquer parte do sistema.

#### Implementação:

```typescript
// components/export-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportButtonProps {
  dados: any[]
  tipo: 'gruas' | 'obras' | 'funcionarios' | 'financeiro' | 'estoque' | 'ponto' | 'relatorios'
  nomeArquivo?: string
  filtros?: Record<string, any>
  colunas?: string[]
  titulo?: string
  className?: string
}

export function ExportButton({
  dados,
  tipo,
  nomeArquivo,
  filtros,
  colunas,
  titulo,
  className
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async (formato: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/exportar/${tipo}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            formato,
            dados,
            filtros,
            colunas,
            titulo
          })
        }
      )

      if (!response.ok) throw new Error('Erro ao exportar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${nomeArquivo || tipo}-${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xlsx' : formato}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportação concluída!",
        description: `Arquivo ${formato.toUpperCase()} baixado com sucesso.`,
      })
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### Uso nos Módulos:

```typescript
// Exemplo em app/dashboard/gruas/page.tsx
import { ExportButton } from '@/components/export-button'

// No componente:
<ExportButton
  dados={gruas}
  tipo="gruas"
  nomeArquivo="relatorio-gruas"
  filtros={{ status: filtroSelecionado }}
  titulo="Relatório de Gruas"
/>
```

#### Módulos que precisam do componente:
- [ ] `/dashboard/gruas/page.tsx`
- [ ] `/dashboard/obras/page.tsx`
- [ ] `/dashboard/funcionarios/page.tsx`
- [ ] `/dashboard/estoque/page.tsx`
- [ ] `/dashboard/ponto/page.tsx`
- [ ] `/dashboard/relatorios/page.tsx`
- [ ] `/dashboard/financeiro/*/page.tsx` (todos os submódulos)
- [ ] `/dashboard/rh/page.tsx`
- [ ] `/dashboard/rh-completo/*/page.tsx` (todos os submódulos)

**Estimativa:** 3 dias  
**Prioridade:** 🔴 CRÍTICA

---

### 2. Dashboard Financeiro - Gráficos Interativos
**Localização:** `app/dashboard/financeiro/page.tsx` (MELHORAR)  
**Status:** ⚠️ Parcial (sem gráficos visuais)

#### Descrição:
Adicionar gráficos interativos ao dashboard financeiro para melhor visualização dos dados.

#### Bibliotecas Recomendadas:
- **Recharts** (mais simples e React-friendly)
- **Chart.js** com react-chartjs-2
- **Nivo** (mais customizável)

#### Implementação com Recharts:

```bash
npm install recharts
```

```typescript
// app/dashboard/financeiro/page.tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Adicionar após os cards de estatísticas:

{/* Gráfico de Fluxo de Caixa */}
<Card>
  <CardHeader>
    <CardTitle>Fluxo de Caixa Mensal</CardTitle>
    <CardDescription>Comparativo de entradas e saídas</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={financialData.fluxoCaixa}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip 
          formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
        />
        <Legend />
        <Bar dataKey="entrada" fill="#10b981" name="Entradas" />
        <Bar dataKey="saida" fill="#ef4444" name="Saídas" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

{/* Gráfico de Evolução */}
<Card>
  <CardHeader>
    <CardTitle>Evolução Financeira</CardTitle>
    <CardDescription>Saldo acumulado nos últimos 6 meses</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={financialData.fluxoCaixa}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip 
          formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="entrada" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Entradas"
        />
        <Line 
          type="monotone" 
          dataKey="saida" 
          stroke="#ef4444" 
          strokeWidth={2}
          name="Saídas"
        />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

{/* Gráfico Pizza - Distribuição */}
<Card>
  <CardHeader>
    <CardTitle>Distribuição de Despesas</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={distribuicaoDespesas}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="valor"
        >
          {distribuicaoDespesas.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

#### Tarefas:
- [ ] Instalar biblioteca de gráficos
- [ ] Criar componente de gráfico de barras (fluxo de caixa)
- [ ] Criar componente de gráfico de linha (evolução)
- [ ] Criar componente de gráfico de pizza (distribuição)
- [ ] Adicionar filtros de período
- [ ] Adicionar animações de transição
- [ ] Responsividade mobile

**Estimativa:** 2 dias  
**Prioridade:** 🔴 CRÍTICA

---

### 3. Espelho de Ponto - Visualização e Assinatura
**Localização:** `app/dashboard/ponto/page.tsx` (ADICIONAR)  
**Status:** ❌ Não implementado

#### Descrição:
Adicionar funcionalidade de geração e visualização do espelho de ponto com assinatura digital.

#### Implementação:

```typescript
// app/dashboard/ponto/page.tsx
// Adicionar ao componente existente:

const [showEspelho, setShowEspelho] = useState(false)
const [espelhoData, setEspelhoData] = useState(null)
const [assinaturaFuncionario, setAssinaturaFuncionario] = useState('')
const [assinaturaGestor, setAssinaturaGestor] = useState('')

const gerarEspelhoPonto = async (funcionarioId: number, mes: string, ano: number) => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ponto-eletronico/espelho-ponto?funcionario_id=${funcionarioId}&mes=${mes}&ano=${ano}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) throw new Error('Erro ao gerar espelho')

    const data = await response.json()
    setEspelhoData(data.data)
    setShowEspelho(true)
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível gerar o espelho de ponto",
      variant: "destructive"
    })
  }
}

const baixarEspelhoPDF = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ponto-eletronico/espelho-ponto?funcionario_id=${espelhoData.funcionario_id}&mes=${espelhoData.mes}&ano=${espelhoData.ano}&formato=pdf`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assinatura_funcionario: assinaturaFuncionario,
          assinatura_gestor: assinaturaGestor
        })
      }
    )

    if (!response.ok) throw new Error('Erro ao baixar PDF')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `espelho-ponto-${espelhoData.funcionario_nome}-${espelhoData.mes}-${espelhoData.ano}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Sucesso!",
      description: "Espelho de ponto baixado com sucesso",
    })
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível baixar o PDF",
      variant: "destructive"
    })
  }
}

// Modal de Espelho de Ponto:
<Dialog open={showEspelho} onOpenChange={setShowEspelho}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Espelho de Ponto - {espelhoData?.funcionario_nome}</DialogTitle>
      <DialogDescription>
        Período: {espelhoData?.mes}/{espelhoData?.ano}
      </DialogDescription>
    </DialogHeader>

    {espelhoData && (
      <div className="space-y-6">
        {/* Dados do Funcionário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Funcionário</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{espelhoData.funcionario_nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cargo</p>
              <p className="font-medium">{espelhoData.cargo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Matrícula</p>
              <p className="font-medium">{espelhoData.matricula}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jornada</p>
              <p className="font-medium">{espelhoData.jornada_diaria}h/dia</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Registros */}
        <div>
          <h3 className="font-semibold mb-2">Registros de Ponto</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída Almoço</TableHead>
                <TableHead>Volta Almoço</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Extras</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {espelhoData.registros.map((registro: any) => (
                <TableRow key={registro.data}>
                  <TableCell>{new Date(registro.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{registro.entrada || '-'}</TableCell>
                  <TableCell>{registro.saida_almoco || '-'}</TableCell>
                  <TableCell>{registro.volta_almoco || '-'}</TableCell>
                  <TableCell>{registro.saida || '-'}</TableCell>
                  <TableCell>{registro.horas_trabalhadas?.toFixed(2) || '0.00'}h</TableCell>
                  <TableCell>{registro.horas_extras?.toFixed(2) || '0.00'}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totalizadores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Totalizadores do Período</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Dias Trabalhados</p>
              <p className="text-2xl font-bold">{espelhoData.total_dias_trabalhados}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Horas Trabalhadas</p>
              <p className="text-2xl font-bold">{espelhoData.total_horas_trabalhadas?.toFixed(2)}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Horas Extras</p>
              <p className="text-2xl font-bold text-green-600">{espelhoData.total_horas_extras?.toFixed(2)}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Faltas</p>
              <p className="text-2xl font-bold text-red-600">{espelhoData.total_faltas}</p>
            </div>
          </CardContent>
        </Card>

        {/* Assinaturas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Assinatura do Funcionário</Label>
            <Input
              placeholder="Digite seu nome completo"
              value={assinaturaFuncionario}
              onChange={(e) => setAssinaturaFuncionario(e.target.value)}
            />
          </div>
          <div>
            <Label>Assinatura do Gestor</Label>
            <Input
              placeholder="Digite seu nome completo"
              value={assinaturaGestor}
              onChange={(e) => setAssinaturaGestor(e.target.value)}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowEspelho(false)}>
            Cancelar
          </Button>
          <Button onClick={baixarEspelhoPDF}>
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

// Botão para gerar espelho (adicionar na interface):
<Button onClick={() => gerarEspelhoPonto(funcionarioSelecionado.id, mesAtual, anoAtual)}>
  <FileText className="w-4 h-4 mr-2" />
  Gerar Espelho de Ponto
</Button>
```

#### Tarefas:
- [ ] Criar modal de visualização do espelho
- [ ] Implementar campos de assinatura
- [ ] Adicionar preview antes do download
- [ ] Integrar com endpoint de geração de PDF
- [ ] Adicionar opção de envio por e-mail
- [ ] Validar assinaturas obrigatórias

**Estimativa:** 2 dias  
**Prioridade:** 🔴 CRÍTICA

---

## 🟡 PRIORIDADE ALTA

### 4. Conectar Módulo de Impostos ao Backend
**Localização:** `app/dashboard/financeiro/impostos/page.tsx`  
**Status:** ❌ Totalmente mockado

#### Tarefas:

```typescript
// Remover dados mockados e conectar com API real:

const [impostos, setImpostos] = useState<Imposto[]>([])
const [loading, setLoading] = useState(true)

const carregarImpostos = async () => {
  try {
    setLoading(true)
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/impostos?mes=${mesAtual}&ano=${anoAtual}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) throw new Error('Erro ao carregar impostos')

    const data = await response.json()
    setImpostos(data.data)
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível carregar os impostos",
      variant: "destructive"
    })
  } finally {
    setLoading(false)
  }
}

const calcularImpostos = async (dados: CalculoImpostoData) => {
  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/impostos/calcular`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      }
    )

    if (!response.ok) throw new Error('Erro ao calcular impostos')

    const data = await response.json()
    
    toast({
      title: "Cálculo concluído!",
      description: `Total de impostos: R$ ${data.data.total_impostos.toLocaleString('pt-BR')}`,
    })
    
    await carregarImpostos()
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível calcular os impostos",
      variant: "destructive"
    })
  }
}

const registrarPagamento = async (impostoId: number, dadosPagamento: any) => {
  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/impostos/pagar`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...dadosPagamento, imposto_id: impostoId })
      }
    )

    if (!response.ok) throw new Error('Erro ao registrar pagamento')

    toast({
      title: "Pagamento registrado!",
      description: "O pagamento foi registrado com sucesso",
    })
    
    await carregarImpostos()
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível registrar o pagamento",
      variant: "destructive"
    })
  }
}
```

#### Checklist:
- [ ] Remover array mockado de impostos
- [ ] Implementar `carregarImpostos()`
- [ ] Implementar `calcularImpostos()`
- [ ] Implementar `registrarPagamento()`
- [ ] Adicionar loading states
- [ ] Adicionar tratamento de erros
- [ ] Testar integração completa

**Estimativa:** 1 dia  
**Prioridade:** 🟡 ALTA

---

### 5. Conectar Módulo de Logística ao Backend
**Localização:** `app/dashboard/financeiro/logistica/page.tsx`  
**Status:** ❌ Totalmente mockado

#### Tarefas:

```typescript
// Conectar APIs de logística:

const [manifestos, setManifestos] = useState<Manifesto[]>([])
const [ctes, setCtes] = useState<CTE[]>([])
const [motoristas, setMotoristas] = useState<Motorista[]>([])
const [viagens, setViagens] = useState<Viagem[]>([])

const carregarDados = async () => {
  try {
    setLoading(true)
    const token = localStorage.getItem('access_token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    const [manifestosRes, ctesRes, motoristasRes, viagensRes] = await Promise.all([
      fetch(`${baseUrl}/api/logistica/manifestos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/logistica/cte`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/logistica/motoristas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/logistica/viagens`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])

    const [manifestosData, ctesData, motoristasData, viagensData] = await Promise.all([
      manifestosRes.json(),
      ctesRes.json(),
      motoristasRes.json(),
      viagensRes.json()
    ])

    setManifestos(manifestosData.data)
    setCtes(ctesData.data)
    setMotoristas(motoristasData.data)
    setViagens(viagensData.data)
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível carregar os dados",
      variant: "destructive"
    })
  } finally {
    setLoading(false)
  }
}

const criarManifesto = async (dados: ManifestoData) => {
  // Implementar criação de manifesto
}

const emitirCTE = async (dados: CTEData) => {
  // Implementar emissão de CT-e
}

const registrarViagem = async (dados: ViagemData) => {
  // Implementar registro de viagem
}
```

#### Checklist:
- [ ] Remover dados mockados
- [ ] Implementar carregamento de manifestos
- [ ] Implementar carregamento de CT-es
- [ ] Implementar carregamento de motoristas
- [ ] Implementar carregamento de viagens
- [ ] Formulário de criação de manifesto
- [ ] Formulário de emissão de CT-e
- [ ] Formulário de registro de viagem
- [ ] Testes de integração

**Estimativa:** 1 dia  
**Prioridade:** 🟡 ALTA

---

### 6. Conectar Cadastro de Fornecedores
**Localização:** `app/dashboard/financeiro/cadastro/page.tsx`  
**Status:** ⚠️ Com fallback mockado

#### Tarefas:

```typescript
// Remover fallback e conectar com API real:

const carregarFornecedores = async () => {
  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fornecedores`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) throw new Error('Erro ao carregar fornecedores')

    const data = await response.json()
    setFornecedores(data.data)
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error)
    // REMOVER este fallback mockado:
    // setFornecedores(mockFornecedores)
    
    toast({
      title: "Erro",
      description: "Não foi possível carregar fornecedores",
      variant: "destructive"
    })
  }
}

const criarFornecedor = async (dados: FornecedorData) => {
  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fornecedores`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      }
    )

    if (!response.ok) throw new Error('Erro ao criar fornecedor')

    toast({
      title: "Fornecedor cadastrado!",
      description: "Fornecedor criado com sucesso",
    })
    
    await carregarFornecedores()
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível criar o fornecedor",
      variant: "destructive"
    })
  }
}
```

#### Checklist:
- [ ] Remover fallback mockado
- [ ] Implementar carregamento real
- [ ] Implementar CRUD completo
- [ ] Formulário de cadastro
- [ ] Validação de CNPJ
- [ ] Histórico de compras
- [ ] Testes

**Estimativa:** 1 dia  
**Prioridade:** 🟡 ALTA

---

### 7. Conectar Alocação de Funcionários em Obras
**Localização:** `app/dashboard/rh-completo/obras/page.tsx`  
**Status:** ❌ Totalmente mockado

#### Tarefas:

```typescript
// Conectar com API de alocações:

const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
const [obras, setObras] = useState<Obra[]>([])
const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])

const carregarDados = async () => {
  try {
    setLoading(true)
    const token = localStorage.getItem('access_token')
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    const [alocacoesRes, obrasRes, funcionariosRes] = await Promise.all([
      fetch(`${baseUrl}/api/alocacoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/obras`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/funcionarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])

    const [alocacoesData, obrasData, funcionariosData] = await Promise.all([
      alocacoesRes.json(),
      obrasRes.json(),
      funcionariosRes.json()
    ])

    setAlocacoes(alocacoesData.data)
    setObras(obrasData.data)
    setFuncionarios(funcionariosData.data)
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    setLoading(false)
  }
}

const alocarFuncionario = async (dados: AlocacaoData) => {
  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/alocacoes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      }
    )

    if (!response.ok) throw new Error('Erro ao alocar funcionário')

    toast({
      title: "Funcionário alocado!",
      description: "A alocação foi registrada com sucesso",
    })
    
    await carregarDados()
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível alocar o funcionário",
      variant: "destructive"
    })
  }
}

const removerAlocacao = async (alocacaoId: number) => {
  try {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/alocacoes/${alocacaoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) throw new Error('Erro ao remover alocação')

    toast({
      title: "Alocação removida!",
      description: "A alocação foi removida com sucesso",
    })
    
    await carregarDados()
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível remover a alocação",
      variant: "destructive"
    })
  }
}
```

#### Melhorias de UX:
- [ ] Implementar drag & drop para alocar funcionários
- [ ] Visualização em kanban por obra
- [ ] Timeline de alocações do funcionário
- [ ] Filtros avançados
- [ ] Alertas de conflito de alocação

**Estimativa:** 2 dias  
**Prioridade:** 🟡 ALTA

---

### 8. Conectar Relatórios Financeiros
**Localização:** `app/dashboard/financeiro/relatorios/page.tsx`  
**Status:** ❌ Totalmente mockado

#### Tarefas:

```typescript
// Conectar com API de relatórios:

const gerarRelatorio = async () => {
  try {
    setLoading(true)
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/relatorios/gerar`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: tipoRelatorio,
          periodo_inicio: dataInicio,
          periodo_fim: dataFim,
          formato: formatoSelecionado,
          filtros: filtrosAvancados
        })
      }
    )

    if (!response.ok) throw new Error('Erro ao gerar relatório')

    if (formatoSelecionado === 'json') {
      const data = await response.json()
      setRelatorioData(data.data)
    } else {
      // Baixar PDF/Excel
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${tipoRelatorio}-${new Date().toISOString()}.${formatoSelecionado}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }

    toast({
      title: "Relatório gerado!",
      description: "O relatório foi gerado com sucesso",
    })
  } catch (error) {
    console.error('Erro:', error)
    toast({
      title: "Erro",
      description: "Não foi possível gerar o relatório",
      variant: "destructive"
    })
  } finally {
    setLoading(false)
  }
}
```

#### Checklist:
- [ ] Remover dados mockados
- [ ] Implementar geração de relatórios
- [ ] Conectar relatório de faturamento
- [ ] Conectar relatório de vendas
- [ ] Conectar relatório de locações
- [ ] Conectar fluxo de caixa
- [ ] Preview antes de baixar
- [ ] Salvar relatórios favoritos

**Estimativa:** 2 dias  
**Prioridade:** 🟡 ALTA

---

## 🟢 PRIORIDADE MÉDIA

### 9. Melhorias no PWA - Offline Mode
**Localização:** `public/sw.js` e páginas PWA  
**Status:** ⚠️ Funcional mas sem cache offline completo

#### Tarefas:

```javascript
// Melhorar service worker para cache offline:

// public/sw.js
const CACHE_NAME = 'gruas-v1'
const urlsToCache = [
  '/',
  '/pwa/login',
  '/pwa/ponto',
  '/pwa/gruas',
  '/pwa/documentos',
  '/offline.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      })
      .catch(() => {
        return caches.match('/offline.html')
      })
  )
})
```

#### Melhorias:
- [ ] Cache de dados essenciais
- [ ] Sincronização quando voltar online
- [ ] Indicador visual de modo offline
- [ ] Fila de ações pendentes
- [ ] IndexedDB para dados locais

**Estimativa:** 2 dias  
**Prioridade:** 🟢 MÉDIA

---

### 10. Componente de Upload de Arquivos Múltiplos
**Localização:** `components/multi-file-upload.tsx` (NÃO EXISTE)  
**Status:** ❌ Não implementado

#### Descrição:
Criar componente reutilizável para upload múltiplo de arquivos com preview, validação e compressão de imagens.

#### Implementação:

```typescript
// components/multi-file-upload.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, File, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MultiFileUploadProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  showPreview?: boolean
}

export function MultiFileUpload({
  onUpload,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = ['image/*', 'application/pdf'],
  showPreview = true
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    // Validar número de arquivos
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxFiles} arquivos permitidos`,
        variant: "destructive"
      })
      return
    }

    // Validar tamanho
    const oversizedFiles = selectedFiles.filter(
      file => file.size > maxSizeMB * 1024 * 1024
    )
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: `Tamanho máximo: ${maxSizeMB}MB`,
        variant: "destructive"
      })
      return
    }

    // Gerar previews
    const newPreviews = await Promise.all(
      selectedFiles.map(file => {
        return new Promise<string>((resolve) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          } else {
            resolve('')
          }
        })
      })
    )

    setFiles([...files, ...selectedFiles])
    setPreviews([...previews, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    onUpload(files)
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600">
            Clique para selecionar ou arraste arquivos aqui
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Máximo {maxFiles} arquivos de até {maxSizeMB}MB cada
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{files.length} arquivo(s) selecionado(s)</p>
          <div className="grid grid-cols-2 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative border rounded-lg p-4">
                {previews[index] ? (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded mb-2">
                    <File className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={handleUpload} className="w-full">
            Fazer Upload
          </Button>
        </div>
      )}
    </div>
  )
}
```

#### Uso:

```typescript
// Exemplo de uso em app/dashboard/financeiro/alugueis/page.tsx
<MultiFileUpload
  onUpload={handleUploadFotos}
  maxFiles={10}
  maxSizeMB={5}
  acceptedTypes={['image/*']}
  showPreview={true}
/>
```

**Estimativa:** 1 dia  
**Prioridade:** 🟢 MÉDIA

---

### 11. Componente de Filtros Avançados
**Localização:** `components/advanced-filters.tsx` (NÃO EXISTE)  
**Status:** ❌ Não implementado

#### Descrição:
Criar componente reutilizável de filtros avançados para todas as listagens do sistema.

**Estimativa:** 1 dia  
**Prioridade:** 🟢 MÉDIA

---

### 12. Dark Mode
**Localização:** `app/layout.tsx` e `components/theme-provider.tsx` (PARCIAL)  
**Status:** ⚠️ Provider existe mas não está totalmente implementado

#### Tarefas:
- [ ] Completar implementação do theme provider
- [ ] Adicionar toggle de dark mode no header
- [ ] Ajustar cores dos componentes
- [ ] Testar em todas as páginas
- [ ] Salvar preferência do usuário

**Estimativa:** 1 dia  
**Prioridade:** 🟢 BAIXA

---

### 13. Notificações em Tempo Real
**Localização:** `components/notifications-dropdown.tsx` (MELHORAR)  
**Status:** ⚠️ Funcional mas sem WebSocket

#### Tarefas:
- [ ] Implementar WebSocket client
- [ ] Conectar com servidor WebSocket
- [ ] Atualização em tempo real
- [ ] Som de notificação
- [ ] Badge com contador

**Estimativa:** 2 dias  
**Prioridade:** 🟢 MÉDIA

---

## 📋 CHECKLIST GERAL DO FRONTEND

### Componentes Globais
- [x] Layout principal
- [x] Navegação lateral
- [x] Header com notificações
- [x] Theme provider (parcial)
- [ ] Sistema de exportação universal
- [ ] Upload de arquivos múltiplos
- [ ] Filtros avançados reutilizáveis
- [x] Toast notifications

### Módulos Financeiros
- [x] Dashboard financeiro (sem gráficos)
- [ ] Dashboard com gráficos interativos
- [ ] Impostos - conectar backend
- [ ] Logística - conectar backend
- [ ] Fornecedores - remover fallback
- [ ] Relatórios - conectar backend
- [x] Vendas (funcional)
- [x] Compras (funcional)

### Módulos RH
- [x] Listagem de funcionários
- [x] Ponto eletrônico básico
- [ ] Espelho de ponto com assinatura
- [ ] Alocação funcionários-obras
- [x] Férias e afastamentos
- [x] RH completo (funcional)

### PWA
- [x] Login PWA
- [x] Ponto PWA
- [x] Gruas PWA
- [x] Documentos PWA
- [ ] Offline mode completo

### Exportação
- [ ] Componente universal de exportação
- [ ] Exportação PDF (implementar em todos)
- [ ] Exportação Excel (implementar em todos)
- [ ] Exportação CSV (implementar em todos)
- [ ] Templates customizados

---

## 🎯 PLANO DE EXECUÇÃO - FRONTEND

### Semana 1: Componentes Críticos
**Dias 1-2:**
- Criar componente de exportação universal
- Implementar em 3 módulos principais (Gruas, Obras, Funcionários)

**Dias 3-4:**
- Adicionar gráficos ao dashboard financeiro
- Testar responsividade

**Dia 5:**
- Implementar espelho de ponto com assinatura
- Testes

### Semana 2: Integrações
**Dias 1-2:**
- Conectar módulo de impostos ao backend
- Conectar módulo de logística ao backend

**Dias 3-4:**
- Conectar cadastro de fornecedores
- Conectar alocação de funcionários

**Dia 5:**
- Conectar relatórios financeiros
- Testes de integração

### Semana 3: Melhorias e Polimento
**Dias 1-2:**
- Criar componente de upload múltiplo
- Implementar em módulos que precisam

**Dias 3-4:**
- Melhorar PWA offline mode
- Notificações em tempo real

**Dia 5:**
- Testes finais
- Ajustes de UX
- Documentação

---

## 📊 MÉTRICAS DE CONCLUSÃO

Ao final das 3 semanas, o frontend deverá ter:

✅ **100%** dos módulos conectados ao backend (sem mocks)  
✅ **100%** das páginas com exportação funcional  
✅ **100%** dos gráficos implementados  
✅ **0%** de fallbacks mockados  
✅ **100%** de responsividade mobile  
✅ **100%** de testes em navegadores principais

---

## 🛠️ TECNOLOGIAS E BIBLIOTECAS

### Já Instaladas:
- ✅ Next.js 14
- ✅ React 18
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Shadcn/ui
- ✅ Lucide Icons

### A Instalar:
```bash
# Gráficos
npm install recharts

# Upload de arquivos
npm install react-dropzone

# PDF no cliente
npm install jspdf jspdf-autotable

# Excel
npm install xlsx

# WebSocket
npm install socket.io-client

# Compressão de imagens
npm install browser-image-compression
```

---

## 📝 OBSERVAÇÕES

1. **Priorize exportação:** O componente de exportação universal impacta todos os módulos.

2. **Testes incrementais:** Testar cada integração antes de passar para a próxima.

3. **Performance:** Usar lazy loading para componentes pesados (gráficos, tabelas grandes).

4. **Mobile First:** Garantir que todos os novos componentes sejam responsivos.

5. **Acessibilidade:** Seguir padrões WCAG para componentes novos.

6. **Cache:** Implementar cache de dados no frontend para melhor performance.

---

**Última Atualização:** 09 de Outubro de 2025  
**Responsável:** Equipe Frontend
