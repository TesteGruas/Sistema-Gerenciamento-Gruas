"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getTransferencias, createTransferencia, deleteTransferencia, confirmarTransferencia, type Transferencia } from "@/lib/api-financial"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock
} from "lucide-react"

export default function TransferenciasPage() {
  const router = useRouter()
  const [transferencias, setTransferencias] = useState<Transferencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Carregar transferências
  const loadTransferencias = async () => {
    try {
      setIsLoading(true)
      const data = await getTransferencias()
      setTransferencias(data)
    } catch (error) {
      console.error('Erro ao carregar transferências:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTransferencias()
  }, [])

  // Filtrar transferências
  const filteredTransferencias = transferencias.filter(transferencia =>
    transferencia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transferencia.banco_origem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transferencia.banco_destino?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-green-500'
      case 'pendente': return 'bg-yellow-500'
      case 'cancelada': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-500'
      case 'saida': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const handleConfirmar = async (id: number) => {
    try {
      await confirmarTransferencia(id)
      loadTransferencias()
    } catch (error) {
      console.error('Erro ao confirmar transferência:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transferências Bancárias</h1>
          <p className="text-gray-600">Gestão de transferências e movimentações bancárias</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transferência
        </Button>
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
                placeholder="Buscar por descrição, banco origem ou destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transferências */}
      <Card>
        <CardHeader>
          <CardTitle>Transferências ({filteredTransferencias.length})</CardTitle>
          <CardDescription>Lista de todas as transferências registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando transferências...</p>
            </div>
          ) : filteredTransferencias.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma transferência encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Banco Origem</TableHead>
                  <TableHead>Banco Destino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransferencias.map((transferencia) => (
                  <TableRow key={transferencia.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(transferencia.data).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{transferencia.descricao}</TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(transferencia.tipo)}>
                        {transferencia.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className={`w-4 h-4 ${transferencia.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={transferencia.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                          {transferencia.tipo === 'entrada' ? '+' : '-'}R$ {transferencia.valor.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{transferencia.banco_origem || 'N/A'}</TableCell>
                    <TableCell>{transferencia.banco_destino || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transferencia.status)}>
                        {transferencia.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {transferencia.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleConfirmar(transferencia.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
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
                            if (confirm('Tem certeza que deseja excluir esta transferência?')) {
                              deleteTransferencia(transferencia.id).then(() => loadTransferencias())
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
      <CreateTransferenciaDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          loadTransferencias()
        }}
      />
    </div>
  )
}

function CreateTransferenciaDialog({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    valor: '',
    tipo: 'entrada',
    descricao: '',
    banco_origem: '',
    banco_destino: '',
    documento_comprobatório: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTransferencia({
        data: formData.data,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo as 'entrada' | 'saida',
        descricao: formData.descricao,
        banco_origem: formData.banco_origem || undefined,
        banco_destino: formData.banco_destino || undefined,
        documento_comprobatório: formData.documento_comprobatório || undefined
      })
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar transferência:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Transferência</DialogTitle>
          <DialogDescription>
            Registre uma nova transferência bancária
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Transferência</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="banco_origem">Banco de Origem</Label>
              <Input
                id="banco_origem"
                value={formData.banco_origem}
                onChange={(e) => setFormData({ ...formData, banco_origem: e.target.value })}
                placeholder="Ex: Itaú, Santander..."
              />
            </div>
            <div>
              <Label htmlFor="banco_destino">Banco de Destino</Label>
              <Input
                id="banco_destino"
                value={formData.banco_destino}
                onChange={(e) => setFormData({ ...formData, banco_destino: e.target.value })}
                placeholder="Ex: Cliente, Fornecedor..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="documento_comprobatório">Documento Comprobatório</Label>
            <Input
              id="documento_comprobatório"
              value={formData.documento_comprobatório}
              onChange={(e) => setFormData({ ...formData, documento_comprobatório: e.target.value })}
              placeholder="Nome do arquivo ou referência"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Transferência
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
