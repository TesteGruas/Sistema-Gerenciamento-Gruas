"use client"

import { useState, useEffect } from 'react'
import { Plus, Send, X, User, Building2, Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotificacoesAPI, NotificationType, DestinatarioTipo, Destinatario, obterTiposPermitidosPorRole } from '@/lib/api-notificacoes'
import { ClienteSearch } from '@/components/cliente-search'
import { FuncionarioSearch } from '@/components/funcionario-search'
import { ObraSearch } from '@/components/obra-search'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface NovaNotificacaoDialogProps {
  onNotificacaoCriada?: () => void
}

export function NovaNotificacaoDialog({ onNotificacaoCriada }: NovaNotificacaoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Obter tipos permitidos baseado na role do usuário
  const tiposPermitidos = obterTiposPermitidosPorRole(user?.role)
  const tipoInicial = tiposPermitidos[0] || 'info'

  // Campos do formulário
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo] = useState<NotificationType>(tipoInicial as NotificationType)
  const [destinatarioTipo, setDestinatarioTipo] = useState<DestinatarioTipo>('geral')
  // Array de destinatários selecionados
  const [destinatariosSelecionados, setDestinatariosSelecionados] = useState<Destinatario[]>([])

  // Atualizar tipo se o tipo atual não estiver mais permitido
  useEffect(() => {
    if (!tiposPermitidos.includes(tipo)) {
      setTipo(tipoInicial as NotificationType)
    }
  }, [tiposPermitidos, tipo, tipoInicial])

  const resetForm = () => {
    setTitulo('')
    setMensagem('')
    setTipo(tipoInicial as NotificationType)
    setDestinatarioTipo('geral')
    setDestinatariosSelecionados([])
  }

  // Adicionar destinatário à lista
  const adicionarDestinatario = (destinatario: Destinatario) => {
    // Evitar duplicatas
    const jaExiste = destinatariosSelecionados.some(
      d => d.tipo === destinatario.tipo && d.id === destinatario.id
    )
    
    if (!jaExiste) {
      setDestinatariosSelecionados([...destinatariosSelecionados, destinatario])
    }
  }

  // Remover destinatário da lista
  const removerDestinatario = (index: number) => {
    setDestinatariosSelecionados(destinatariosSelecionados.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!titulo.trim() || !mensagem.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha título e mensagem.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Preparar destinatários
      let destinatarios: Destinatario[] = []
      
      if (destinatarioTipo === 'geral') {
        destinatarios = [{ tipo: 'geral' as DestinatarioTipo }]
      } else {
        // Usar a lista de selecionados
        destinatarios = destinatariosSelecionados.length > 0 
          ? destinatariosSelecionados 
          : []
      }

      // Criar notificação
      await NotificacoesAPI.criar({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        destinatarios,
        remetente: localStorage.getItem('userName') || 'Sistema',
      })

      toast({
        title: 'Notificação criada!',
        description: 'A notificação foi enviada com sucesso.',
      })

      resetForm()
      setOpen(false)
      
      if (onNotificacaoCriada) {
        onNotificacaoCriada()
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar notificação',
        description: 'Não foi possível criar a notificação.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Notificação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Notificação</DialogTitle>
          <DialogDescription>
            Envie notificações para todos os usuários ou para destinatários específicos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Tipo de Notificação */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Notificação</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposPermitidos.includes('info') && <SelectItem value="info">Informação</SelectItem>}
                {tiposPermitidos.includes('success') && <SelectItem value="success">Sucesso</SelectItem>}
                {tiposPermitidos.includes('warning') && <SelectItem value="warning">Aviso</SelectItem>}
                {tiposPermitidos.includes('error') && <SelectItem value="error">Erro</SelectItem>}
                {tiposPermitidos.includes('grua') && <SelectItem value="grua">Gruas</SelectItem>}
                {tiposPermitidos.includes('obra') && <SelectItem value="obra">Obras</SelectItem>}
                {tiposPermitidos.includes('financeiro') && <SelectItem value="financeiro">Financeiro</SelectItem>}
                {tiposPermitidos.includes('rh') && <SelectItem value="rh">RH</SelectItem>}
                {tiposPermitidos.includes('estoque') && <SelectItem value="estoque">Estoque</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Digite o título da notificação"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem *</Label>
            <Textarea
              id="mensagem"
              placeholder="Digite a mensagem da notificação"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Destinatário */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Destinatário</h3>
            
            <div className="space-y-2">
              <Label htmlFor="destinatario-tipo">Enviar para</Label>
              <Select
                value={destinatarioTipo}
                onValueChange={(v) => {
                  setDestinatarioTipo(v as DestinatarioTipo)
                  // Limpar seleções ao trocar de tipo
                  if (v !== 'geral') {
                    setDestinatariosSelecionados([])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Todos os usuários (Geral)</SelectItem>
                  <SelectItem value="cliente">Cliente específico</SelectItem>
                  <SelectItem value="funcionario">Funcionário específico</SelectItem>
                  <SelectItem value="obra">Obra específica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cliente */}
            {destinatarioTipo === 'cliente' && (
              <div className="space-y-3">
                <Label>Adicionar Clientes</Label>
                <ClienteSearch
                  onClienteSelect={(cliente) => {
                    if (cliente) {
                      adicionarDestinatario({
                        tipo: 'cliente',
                        id: String(cliente.id),
                        nome: cliente.nome || cliente.name || cliente.razao_social || 'Cliente',
                        info: cliente.cnpj || cliente.CNPJ || cliente.email || cliente.telefone || ''
                      })
                    }
                  }}
                />
              </div>
            )}

            {/* Funcionário */}
            {destinatarioTipo === 'funcionario' && (
              <div className="space-y-3">
                <Label>Adicionar Funcionários</Label>
                <FuncionarioSearch
                  onFuncionarioSelect={(funcionario) => {
                    if (funcionario) {
                      adicionarDestinatario({
                        tipo: 'funcionario',
                        id: String(funcionario.id),
                        nome: funcionario.nome || funcionario.name || 'Funcionário',
                        info: funcionario.cargo || funcionario.role || funcionario.email || ''
                      })
                    }
                  }}
                />
              </div>
            )}

            {/* Obra */}
            {destinatarioTipo === 'obra' && (
              <div className="space-y-3">
                <Label>Adicionar Obras</Label>
                <ObraSearch
                  onObraSelect={(obra) => {
                    if (obra) {
                      adicionarDestinatario({
                        tipo: 'obra',
                        id: String(obra.id),
                        nome: obra.nome || obra.name || 'Obra',
                        info: obra.endereco || obra.cidade || obra.local || ''
                      })
                    }
                  }}
                />
              </div>
            )}

            {/* Lista de Destinatários Selecionados */}
            {destinatariosSelecionados.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Destinatários Selecionados ({destinatariosSelecionados.length})
                </Label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {destinatariosSelecionados.map((dest, index) => {
                    const getIcon = () => {
                      switch (dest.tipo) {
                        case 'cliente': return Building2
                        case 'funcionario': return User
                        case 'obra': return Users
                        default: return UserPlus
                      }
                    }
                    
                    const getColor = () => {
                      switch (dest.tipo) {
                        case 'cliente': return 'bg-blue-100 text-blue-700 border-blue-200'
                        case 'funcionario': return 'bg-green-100 text-green-700 border-green-200'
                        case 'obra': return 'bg-orange-100 text-orange-700 border-orange-200'
                        default: return 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    }
                    
                    const Icon = getIcon()
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getColor()}`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dest.nome}</p>
                          {dest.info && (
                            <p className="text-xs opacity-75 truncate">{dest.info}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-white/50"
                          onClick={() => removerDestinatario(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Notificação
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

