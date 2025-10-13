"use client"

import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Building, Save, X, Key, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/app/lib/auth'

interface EditarUsuarioDialogProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onUserUpdated: (user: any) => void
}

export function EditarUsuarioDialog({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdated 
}: EditarUsuarioDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    empresa: '',
    cargo: '',
    senha: '',
    confirmarSenha: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        endereco: user.endereco || '',
        empresa: user.empresa || '',
        cargo: user.cargo || '',
        senha: '',
        confirmarSenha: ''
      })
    }
  }, [isOpen, user])

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        empresa: '',
        cargo: '',
        senha: '',
        confirmarSenha: ''
      })
      setShowPassword(false)
    }
  }, [isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      // Validações básicas
      if (!formData.nome.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome é obrigatório.',
          variant: 'destructive',
        })
        return
      }

      if (!formData.email.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Email é obrigatório.',
          variant: 'destructive',
        })
        return
      }

      if (formData.senha && formData.senha !== formData.confirmarSenha) {
        toast({
          title: 'Erro de validação',
          description: 'Senhas não coincidem.',
          variant: 'destructive',
        })
        return
      }

      // Simular atualização (substituir por chamada real da API)
      const updatedUser = {
        ...user,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        empresa: formData.empresa,
        cargo: formData.cargo
      }

      // Aqui você faria a chamada real para a API
      // await AuthService.updateUser(updatedUser)

      onUserUpdated(updatedUser)
      
      toast({
        title: 'Perfil atualizado',
        description: 'Seus dados foram atualizados com sucesso.',
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      setLoading(true)
      
      // Simular redefinição de senha
      toast({
        title: 'Senha redefinida',
        description: 'Uma nova senha foi enviada para seu email.',
      })

      // Aqui você faria a chamada real para a API
      // await AuthService.resetPassword(user.email)
    } catch (error) {
      toast({
        title: 'Erro ao redefinir senha',
        description: 'Não foi possível redefinir a senha.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil
          </DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais e configurações de conta.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="senha">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        className="pl-10"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        className="pl-10"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="cargo"
                        value={formData.cargo}
                        onChange={(e) => handleInputChange('cargo', e.target.value)}
                        className="pl-10"
                        placeholder="Seu cargo"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      className="pl-10"
                      placeholder="Seu endereço completo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      className="pl-10"
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="senha" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Segurança da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Nova Senha</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        value={formData.senha}
                        onChange={(e) => handleInputChange('senha', e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Digite sua nova senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmarSenha"
                        type="password"
                        value={formData.confirmarSenha}
                        onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                        className="pl-10"
                        placeholder="Confirme sua nova senha"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handlePasswordReset}
                      disabled={loading}
                      className="w-full"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Enviar Nova Senha por Email
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Uma nova senha será enviada para seu email de cadastro.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
