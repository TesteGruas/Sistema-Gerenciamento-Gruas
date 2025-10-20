"use client"

import { memo, useCallback, useMemo } from "react"
import { TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  UserCheck, 
  UserX 
} from "lucide-react"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido' | 'Férias'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | 'Diurno' | 'Noturno' | 'Sob Demanda'
  observacoes?: string
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

interface FuncionarioRowProps {
  funcionario: FuncionarioRH
  onView: (id: number) => void
  onEdit: (funcionario: FuncionarioRH) => void
  onDelete: (id: number) => void
}

const FuncionarioRow = memo(function FuncionarioRow({ 
  funcionario, 
  onView, 
  onEdit, 
  onDelete 
}: FuncionarioRowProps) {
  // Memoizar cálculos pesados
  const avatarInitials = useMemo(() => {
    return funcionario.nome.split(' ').map(n => n[0]).join('').slice(0, 2)
  }, [funcionario.nome])

  const avatarUrl = useMemo(() => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${funcionario.nome}`
  }, [funcionario.nome])

  // Obter status badge - memoizado para evitar re-criação
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs"><UserCheck className="w-3 h-3 mr-1" /> Ativo</Badge>
      case 'Inativo':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs"><UserX className="w-3 h-3 mr-1" /> Inativo</Badge>
      case 'Afastado':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">Afastado</Badge>
      case 'Férias':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Férias</Badge>
      case 'Demitido':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Demitido</Badge>
      default:
        return <Badge className="text-xs">{status}</Badge>
    }
  }, [])

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="w-[200px] max-w-[200px]">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xs">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 text-sm truncate" title={funcionario.nome}>
              {funcionario.nome}
            </p>
            <div className="mt-0.5">
              {getStatusBadge(funcionario.status)}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[20%]">
        <span className="text-gray-600 text-sm">{funcionario.cpf || '-'}</span>
      </TableCell>
      <TableCell className="w-[20%]">
        {funcionario.telefone ? (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 text-sm">{funcionario.telefone}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="w-[20%]">
        <div>
          <p className="font-medium text-sm">{funcionario.cargo}</p>
          {funcionario.turno && (
            <p className="text-xs text-gray-500">{funcionario.turno}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[10%] text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(funcionario.id)}
            title="Ver detalhes"
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(funcionario)}
            title="Editar"
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(funcionario.id)}
            title="Excluir"
            className="h-8 w-8 p-0"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

export { FuncionarioRow }
