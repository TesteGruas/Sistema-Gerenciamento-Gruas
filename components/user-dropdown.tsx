"use client"

import { useState, useEffect } from 'react'
import { User, LogOut, Key, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/app/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { EditarUsuarioDialog } from '@/components/editar-usuario-dialog'

export function UserDropdown() {
  const [user, setUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Carregar dados do usuário
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AuthService.getCurrentUser()
        setUser(userData)
      } catch (error: any) {
        console.error('Erro ao carregar usuário:', error)
        // Não definir usuário mock - deixar null e tratar na UI
        setUser(null)
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      router.push('/')
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro no logout',
        description: 'Não foi possível fazer logout.',
        variant: 'destructive',
      })
    }
  }

  const handleEditUser = () => {
    setIsDialogOpen(true)
    // Forçar fechar qualquer dropdown aberto
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }
  
  const handleUserUpdated = (updatedUser: any) => {
    setUser(updatedUser)
  }

  const handlePasswordReset = () => {
    toast({
      title: 'Redefinição de senha',
      description: 'Funcionalidade em desenvolvimento.',
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.nome} />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {user?.nome ? getInitials(user.nome) : 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.nome || 'Usuário'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || 'usuario@exemplo.com'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEditUser}>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePasswordReset}>
            <Key className="mr-2 h-4 w-4" />
            <span>Alterar Senha</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditarUsuarioDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        user={user}
        onUserUpdated={handleUserUpdated}
      />
    </>
  )
}
