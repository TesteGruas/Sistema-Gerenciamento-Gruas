"use client"

import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export const DebugPermissions = () => {
  const { permissions, perfil, loading, hasPermission } = usePermissions()
  const [testPermission, setTestPermission] = useState("dashboard:visualizar")

  const testPermissions = [
    "dashboard:visualizar",
    "usuarios:visualizar",
    "gruas:visualizar",
    "estoque:visualizar",
    "relatorios:visualizar",
    "configuracoes:visualizar",
    "ponto_eletronico:visualizar",
    "assinatura_digital:visualizar"
  ]

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">🔍 Debug - Sistema de Permissões</CardTitle>
        <CardDescription className="text-blue-700">
          Testando sistema de permissões em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado atual */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Estado Atual:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Perfil: <span className="font-mono">{perfil?.nome || 'N/A'}</span></div>
            <div>Nível: <span className="font-mono">{perfil?.nivel_acesso || 'N/A'}</span></div>
            <div>Carregando: <span className="font-mono">{loading ? 'Sim' : 'Não'}</span></div>
            <div>Total: <span className="font-mono">{permissions.length}</span></div>
          </div>
        </div>

        {/* Permissões disponíveis */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Permissões Disponíveis:</h4>
          <div className="flex flex-wrap gap-1">
            {permissions.length > 0 ? (
              permissions.map((permission, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {permission}
                </span>
              ))
            ) : (
              <span className="text-red-600 text-sm">Nenhuma permissão carregada</span>
            )}
          </div>
        </div>

        {/* Teste de permissão específica */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Teste de Permissão:</h4>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={testPermission}
              onChange={(e) => setTestPermission(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="Ex: dashboard:visualizar"
            />
            <Button
              size="sm"
              onClick={() => {
                const hasAccess = hasPermission(testPermission)
                alert(`Permissão "${testPermission}": ${hasAccess ? 'TEM ACESSO' : 'NÃO TEM ACESSO'}`)
              }}
            >
              Testar
            </Button>
          </div>
        </div>

        {/* Teste de todas as permissões */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Teste Rápido:</h4>
          <div className="grid grid-cols-2 gap-1">
            {testPermissions.map((permission) => (
              <div
                key={permission}
                className={`text-xs p-2 rounded ${
                  hasPermission(permission)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {permission}: {hasPermission(permission) ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>

        {/* Logs do console */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Logs do Console:</h4>
          <p className="text-xs text-gray-600">
            Abra o console do navegador (F12) para ver os logs detalhados do sistema de permissões.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
