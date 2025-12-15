"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Save, Settings, AlertTriangle, CheckCircle2 } from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import api from "@/lib/api"
import { usePermissions } from "@/hooks/use-permissions"

export default function ConfiguracaoSistemaPage() {
  const { toast } = useToast()
  const { isAdmin } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      const response = await api.get('/configuracoes/debug_mode_enabled')
      if (response.data.success) {
        const valor = response.data.data.valor
        setDebugMode(valor === true || valor === 'true' || valor === true)
      } else {
        setDebugMode(false)
      }
    } catch (error: any) {
      // Se não existir (404), usar valor padrão false
      if (error.response?.status === 404) {
        setDebugMode(false)
        // Não mostrar erro se for 404 - é normal se a configuração ainda não foi criada
      } else if (error.response?.status === 429) {
        // Rate limit - não fazer nada, apenas usar padrão
        setDebugMode(false)
        console.warn('Rate limit atingido - usando valor padrão')
      } else {
        setDebugMode(false)
        console.error('Erro ao carregar configuração:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    const checkAndLoad = async () => {
      const adminCheck = isAdmin()
      if (adminCheck) {
        await loadConfig()
      } else {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    checkAndLoad()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez na montagem

  const saveConfig = async () => {
    if (!isAdmin()) {
      toast({
        title: "Acesso Negado",
        description: "Apenas administradores podem alterar configurações do sistema",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const response = await api.put('/configuracoes/debug_mode_enabled', {
        valor: debugMode ? 'true' : 'false'
      })

      if (response.data.success) {
        toast({
          title: "Sucesso!",
          description: "Configuração salva com sucesso",
        })
      } else {
        throw new Error(response.data.error || 'Erro ao salvar')
      }
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Erro ao salvar configuração"
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Apenas administradores podem acessar as configurações do sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações gerais do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Modo Debug
          </CardTitle>
          <CardDescription>
            Ative ou desative as funções de debug (preenchimento automático de formulários) no sistema.
            Quando ativado, apenas administradores podem ver e usar essas funções.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="debug-mode" className="text-base font-medium">
                Ativar Modo Debug
              </Label>
              <p className="text-sm text-gray-500">
                Quando ativado, botões de preenchimento automático aparecerão nos formulários
                para facilitar testes e desenvolvimento.
              </p>
            </div>
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={setDebugMode}
              disabled={loading || saving}
            />
          </div>

          {debugMode && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Modo Debug Ativado
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  As funções de debug estão ativas. Botões de preenchimento automático estarão
                  visíveis para administradores nos seguintes formulários:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                  <li>Nova Obra</li>
                  <li>Novo Orçamento</li>
                  <li>Nova Medição</li>
                </ul>
              </div>
            </div>
          )}

          {!debugMode && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Modo Debug Desativado
                </p>
                <p className="text-sm text-green-700 mt-1">
                  As funções de debug estão desativadas. Os botões de preenchimento automático
                  não estarão visíveis nos formulários.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={saveConfig}
              disabled={loading || saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <ButtonLoader text="Salvando..." />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

