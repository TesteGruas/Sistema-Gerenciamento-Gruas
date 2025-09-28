"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getContasBancarias, createContaBancaria, updateContaBancaria, deleteContaBancaria, updateSaldoConta, type ContaBancaria } from "@/lib/api-financial"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  DollarSign,
  CreditCard,
  Wallet
} from "lucide-react"

export default function ContasBancariasPage() {
  const router = useRouter()
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpdateSaldoDialogOpen, setIsUpdateSaldoDialogOpen] = useState(false)
  const [selectedConta, setSelectedConta] = useState<ContaBancaria | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Carregar contas
  const loadContas = async () => {
    try {
      setIsLoading(true)
      const data = await getContasBancarias()
      setContas(data)
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadContas()
  }, [])

  // Filtrar contas
  const filteredContas = contas.filter(conta =>
    conta.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.agencia.includes(searchTerm) ||
    conta.conta.includes(searchTerm)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-500'
      case 'inativa': return 'bg-gray-500'
      case 'bloqueada': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTipoContaColor = (tipo: string) => {
    switch (tipo) {
      case 'corrente': return 'bg-blue-500'
      case 'poupanca': return 'bg-green-500'
      case 'investimento': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const handleUpdateSaldo = (conta: ContaBancaria) => {
    setSelectedConta(conta)
    setIsUpdateSaldoDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas Bancárias</h1>
          <p className="text-gray-600">Gestão de contas bancárias e saldos</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contas</p>
                <p className="text-2xl font-bold text-gray-900">{contas.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contas.filter(c => c.status === 'ativa').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {contas.reduce((sum, conta) => sum + conta.saldo_atual, 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por banco, agência ou conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Bancárias ({filteredContas.length})</CardTitle>
          <CardDescription>Lista de todas as contas bancárias cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando contas bancárias...</p>
            </div>
          ) : filteredContas.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma conta bancária encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banco</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContas.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">{conta.banco}</TableCell>
                    <TableCell>{conta.agencia}</TableCell>
                    <TableCell>{conta.conta}</TableCell>
                    <TableCell>
                      <Badge className={getTipoContaColor(conta.tipo_conta)}>
                        {conta.tipo_conta}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        R$ {conta.saldo_atual.toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(conta.status)}>
                        {conta.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateSaldo(conta)}
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta conta bancária?')) {
                              deleteContaBancaria(conta.id).then(() => loadContas())
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação */}
      <CreateContaDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          loadContas()
        }}
      />

      {/* Dialog de Atualização de Saldo */}
      <UpdateSaldoDialog 
        isOpen={isUpdateSaldoDialogOpen}
        onClose={() => setIsUpdateSaldoDialogOpen(false)}
        conta={selectedConta}
        onSuccess={() => {
          setIsUpdateSaldoDialogOpen(false)
          setSelectedConta(null)
          loadContas()
        }}
      />
    </div>
  )
}

function CreateContaDialog({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    saldo_atual: '0',
    status: 'ativa'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createContaBancaria({
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta,
        tipo_conta: formData.tipo_conta as 'corrente' | 'poupanca' | 'investimento',
        saldo_atual: parseFloat(formData.saldo_atual),
        status: formData.status as 'ativa' | 'inativa' | 'bloqueada'
      })
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar conta bancária:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Conta Bancária</DialogTitle>
          <DialogDescription>
            Cadastre uma nova conta bancária no sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="banco">Banco</Label>
            <Input
              id="banco"
              value={formData.banco}
              onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              placeholder="Ex: Itaú, Santander, Bradesco..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agencia">Agência</Label>
              <Input
                id="agencia"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="conta">Conta</Label>
              <Input
                id="conta"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_conta">Tipo de Conta</Label>
              <Select value={formData.tipo_conta} onValueChange={(value) => setFormData({ ...formData, tipo_conta: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Conta Poupança</SelectItem>
                  <SelectItem value="investimento">Conta Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="saldo_atual">Saldo Atual (R$)</Label>
              <Input
                id="saldo_atual"
                type="number"
                step="0.01"
                value={formData.saldo_atual}
                onChange={(e) => setFormData({ ...formData, saldo_atual: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
                <SelectItem value="bloqueada">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Conta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UpdateSaldoDialog({ isOpen, onClose, conta, onSuccess }: { 
  isOpen: boolean
  onClose: () => void
  conta: ContaBancaria | null
  onSuccess: () => void
}) {
  const [novoSaldo, setNovoSaldo] = useState('')

  useEffect(() => {
    if (conta) {
      setNovoSaldo(conta.saldo_atual.toString())
    }
  }, [conta])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conta) return

    try {
      await updateSaldoConta(conta.id, parseFloat(novoSaldo))
      onSuccess()
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error)
    }
  }

  if (!conta) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Saldo</DialogTitle>
          <DialogDescription>
            Atualize o saldo da conta {conta.banco} - {conta.agencia}/{conta.conta}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="novo_saldo">Novo Saldo (R$)</Label>
            <Input
              id="novo_saldo"
              type="number"
              step="0.01"
              value={novoSaldo}
              onChange={(e) => setNovoSaldo(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Atualizar Saldo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
