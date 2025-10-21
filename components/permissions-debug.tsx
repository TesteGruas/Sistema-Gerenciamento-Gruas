"use client"

import { usePermissions } from "@/hooks/use-permissions"
import { useState, useEffect } from "react"

export function PermissionsDebug() {
  const { permissions, perfil, isAdmin, hasPermission, loading } = usePermissions()
  const [isVisible, setIsVisible] = useState(false)
  const [localStorageData, setLocalStorageData] = useState<any>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = {
        userRole: localStorage.getItem('userRole'),
        userPerfil: localStorage.getItem('user_perfil'),
        userPermissions: localStorage.getItem('user_permissions'),
        accessToken: localStorage.getItem('access_token') ? 'Presente' : 'Ausente'
      }
      setLocalStorageData(data)
    }
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Debug Permissões"
      >
        🔧
      </button>
    )
  }

  const menuPermissions = [
    { perm: 'dashboard:visualizar', name: 'Dashboard' },
    { perm: 'notificacoes:visualizar', name: 'Notificações' },
    { perm: 'clientes:visualizar', name: 'Clientes' },
    { perm: 'obras:visualizar', name: 'Obras' },
    { perm: 'gruas:visualizar', name: 'Gruas' },
    { perm: 'livros_gruas:visualizar', name: 'Livros Gruas' },
    { perm: 'estoque:visualizar', name: 'Estoque' },
    { perm: 'ponto_eletronico:visualizar', name: 'Ponto Eletrônico' },
    { perm: 'rh:visualizar', name: 'RH' },
    { perm: 'financeiro:visualizar', name: 'Financeiro' },
    { perm: 'relatorios:visualizar', name: 'Relatórios' },
    { perm: 'historico:visualizar', name: 'Histórico' },
    { perm: 'assinatura_digital:visualizar', name: 'Assinatura Digital' },
    { perm: 'usuarios:visualizar', name: 'Usuários' },
    { perm: 'email:configurar', name: 'Config Email' }
  ]

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Debug Permissões</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>Perfil:</strong> {perfil?.nome || 'Carregando...'}
        </div>
        <div>
          <strong>Admin:</strong> {isAdmin() ? 'Sim' : 'Não'}
        </div>
        <div>
          <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}
        </div>
        <div>
          <strong>Permissões:</strong> {permissions.length}
        </div>

        <div className="border-t pt-2">
          <strong>LocalStorage:</strong>
          <div className="ml-2">
            <div>Role: {localStorageData.userRole || 'N/A'}</div>
            <div>Token: {localStorageData.accessToken || 'N/A'}</div>
            <div>Perfil: {localStorageData.userPerfil ? 'Presente' : 'Ausente'}</div>
            <div>Permissões: {localStorageData.userPermissions ? 'Presente' : 'Ausente'}</div>
          </div>
        </div>

        <div className="border-t pt-2">
          <strong>Permissões do Menu:</strong>
          <div className="max-h-32 overflow-y-auto">
            {menuPermissions.map(({ perm, name }) => (
              <div key={perm} className="flex items-center gap-1">
                <span className={hasPermission(perm) ? 'text-green-600' : 'text-red-600'}>
                  {hasPermission(perm) ? '✅' : '❌'}
                </span>
                <span className="text-xs">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-2 space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => {
                // Configurar como operador
                const operatorData = {
                  user: { id: "operator-123", email: "operador@empresa.com", nome: "Operador", role: "operador" },
                  perfil: { id: 2, nome: "Operador", nivel_acesso: 4, descricao: "Acesso operacional limitado", status: "Ativo" },
                  permissoes: [
                    { id: 1, nome: "dashboard:visualizar", modulo: "dashboard", acao: "visualizar" },
                    { id: 2, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
                    { id: 3, nome: "gruas:criar", modulo: "gruas", acao: "criar" },
                    { id: 4, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
                    { id: 5, nome: "obras:visualizar", modulo: "obras", acao: "visualizar" }
                  ]
                }
                localStorage.setItem('user_profile', JSON.stringify(operatorData.user))
                localStorage.setItem('user_perfil', JSON.stringify(operatorData.perfil))
                localStorage.setItem('userRole', 'operador')
                const permissionStrings = operatorData.permissoes.map(p => `${p.modulo}:${p.acao}`)
                localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
                window.location.reload()
              }}
              className="bg-orange-600 text-white px-2 py-1 rounded text-xs flex-1"
            >
              👷 Operador
            </button>
            <button
              onClick={() => {
                // Configurar como admin
                const adminData = {
                  user: { id: "admin-123", email: "admin@admin.com", nome: "Administrador", role: "admin" },
                  perfil: { id: 1, nome: "Admin", nivel_acesso: 10, descricao: "Acesso completo", status: "Ativo" },
                  permissoes: [
                    { id: 1, nome: "dashboard:visualizar", modulo: "dashboard", acao: "visualizar" },
                    { id: 2, nome: "notificacoes:visualizar", modulo: "notificacoes", acao: "visualizar" },
                    { id: 3, nome: "clientes:visualizar", modulo: "clientes", acao: "visualizar" },
                    { id: 4, nome: "obras:visualizar", modulo: "obras", acao: "visualizar" },
                    { id: 5, nome: "gruas:visualizar", modulo: "gruas", acao: "visualizar" },
                    { id: 6, nome: "livros_gruas:visualizar", modulo: "livros_gruas", acao: "visualizar" },
                    { id: 7, nome: "estoque:visualizar", modulo: "estoque", acao: "visualizar" },
                    { id: 8, nome: "ponto_eletronico:visualizar", modulo: "ponto_eletronico", acao: "visualizar" },
                    { id: 9, nome: "rh:visualizar", modulo: "rh", acao: "visualizar" },
                    { id: 10, nome: "financeiro:visualizar", modulo: "financeiro", acao: "visualizar" },
                    { id: 11, nome: "relatorios:visualizar", modulo: "relatorios", acao: "visualizar" },
                    { id: 12, nome: "historico:visualizar", modulo: "historico", acao: "visualizar" },
                    { id: 13, nome: "assinatura_digital:visualizar", modulo: "assinatura_digital", acao: "visualizar" },
                    { id: 14, nome: "usuarios:visualizar", modulo: "usuarios", acao: "visualizar" },
                    { id: 15, nome: "email:configurar", modulo: "email", acao: "configurar" }
                  ]
                }
                localStorage.setItem('user_profile', JSON.stringify(adminData.user))
                localStorage.setItem('user_perfil', JSON.stringify(adminData.perfil))
                localStorage.setItem('userRole', 'admin')
                const permissionStrings = adminData.permissoes.map(p => `${p.modulo}:${p.acao}`)
                localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
                window.location.reload()
              }}
              className="bg-purple-600 text-white px-2 py-1 rounded text-xs flex-1"
            >
              👑 Admin
            </button>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs w-full"
          >
            🔄 Recarregar
          </button>
        </div>
      </div>
    </div>
  )
}
