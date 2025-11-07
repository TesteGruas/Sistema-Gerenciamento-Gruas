"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Save, 
  TestTube, 
  MessageSquare, 
  Clock, 
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { whatsappApi } from "@/lib/api-whatsapp"

interface WhatsAppConfig {
  api_provider: string
  api_key: string
  api_secret?: string
  api_url?: string
  webhook_url?: string
  enabled: boolean
  mensagem_template: string
  lembrete_enabled: boolean
  lembrete_intervalo_horas: number
  lembrete_max_tentativas: number
  mensagem_lembrete_template: string
}

export function WhatsAppConfiguracao() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<WhatsAppConfig>({
    api_provider: "evolution",
    api_key: "",
    api_secret: "",
    api_url: "",
    webhook_url: "",
    enabled: false,
    mensagem_template: `Olá {nome_gestor}!

Você tem uma solicitação de aprovação de horas extras pendente:

👤 Funcionário: {nome_funcionario}
📅 Data: {data}
⏰ Horas Extras: {horas_extras}h
🏗️ Obra: {nome_obra}

Clique no link abaixo para aprovar ou rejeitar:
{link_aprovacao}

Este link expira em 48 horas.`,
    lembrete_enabled: true,
    lembrete_intervalo_horas: 24,
    lembrete_max_tentativas: 3,
    mensagem_lembrete_template: `Olá {nome_gestor}!

Lembrete: Você ainda tem uma solicitação de aprovação de horas extras pendente:

👤 Funcionário: {nome_funcionario}
📅 Data: {data}
⏰ Horas Extras: {horas_extras}h

Por favor, acesse o link para aprovar ou rejeitar:
{link_aprovacao}`
  })

  useEffect(() => {
    carregarConfiguracao()
  }, [])

  const carregarConfiguracao = async () => {
    try {
      setLoading(true)
      const response = await whatsappApi.obterConfiguracao()
      if (response.success && response.data) {
        setConfig(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await whatsappApi.salvarConfiguracao(config)
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso!",
        })
      } else {
        throw new Error(response.message || 'Erro ao salvar configurações')
      }
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      const response = await whatsappApi.testarConexao({
        api_provider: config.api_provider,
        api_key: config.api_key,
        api_secret: config.api_secret,
        api_url: config.api_url
      })
      
      if (response.success) {
        toast({
          title: "Conexão Testada",
          description: "Conexão com a API WhatsApp estabelecida com sucesso!",
        })
      } else {
        throw new Error(response.message || 'Erro ao testar conexão')
      }
    } catch (error: any) {
      console.error('Erro ao testar conexão:', error)
      toast({
        title: "Erro no Teste",
        description: error.message || "Erro ao testar conexão com a API WhatsApp",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configurações da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Configurações da API WhatsApp
          </CardTitle>
          <CardDescription>
            Configure a conexão com o provedor de API WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Habilitar Envio via WhatsApp</Label>
              <p className="text-sm text-gray-500">
                Ative ou desative o envio automático de mensagens
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          <div>
            <Label htmlFor="api_provider">Provedor da API</Label>
            <Select
              value={config.api_provider}
              onValueChange={(value) => setConfig({ ...config, api_provider: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evolution">Evolution API</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="business">WhatsApp Business API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="api_key">API Key / Token</Label>
            <Input
              id="api_key"
              type="password"
              value={config.api_key}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
              placeholder="Digite a chave da API"
            />
          </div>

          {config.api_provider === 'twilio' && (
            <div>
              <Label htmlFor="api_secret">API Secret</Label>
              <Input
                id="api_secret"
                type="password"
                value={config.api_secret || ''}
                onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
                placeholder="Digite o secret da API"
              />
            </div>
          )}

          {config.api_provider === 'evolution' && (
            <div>
              <Label htmlFor="api_url">URL da API</Label>
              <Input
                id="api_url"
                value={config.api_url || ''}
                onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                placeholder="https://api.evolution.com.br"
              />
            </div>
          )}

          <div>
            <Label htmlFor="webhook_url">Webhook URL (Opcional)</Label>
            <Input
              id="webhook_url"
              value={config.webhook_url || ''}
              onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
              placeholder="https://seu-dominio.com/api/webhook/whatsapp"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL para receber atualizações de status das mensagens
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !config.api_key}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Template de Mensagem
          </CardTitle>
          <CardDescription>
            Personalize a mensagem enviada para os gestores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mensagem_template">Mensagem de Aprovação</Label>
            <Textarea
              id="mensagem_template"
              value={config.mensagem_template}
              onChange={(e) => setConfig({ ...config, mensagem_template: e.target.value })}
              rows={12}
              className="font-mono text-sm"
              placeholder="Digite o template da mensagem..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Variáveis disponíveis: {'{nome_gestor}'}, {'{nome_funcionario}'}, {'{data}'}, {'{horas_extras}'}, {'{nome_obra}'}, {'{link_aprovacao}'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Lembretes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Configurações de Lembretes
          </CardTitle>
          <CardDescription>
            Configure o envio automático de lembretes para aprovações pendentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="lembrete_enabled">Habilitar Lembretes Automáticos</Label>
              <p className="text-sm text-gray-500">
                Enviar lembretes para aprovações pendentes
              </p>
            </div>
            <Switch
              id="lembrete_enabled"
              checked={config.lembrete_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, lembrete_enabled: checked })}
            />
          </div>

          {config.lembrete_enabled && (
            <>
              <div>
                <Label htmlFor="lembrete_intervalo_horas">Intervalo entre Lembretes (horas)</Label>
                <Input
                  id="lembrete_intervalo_horas"
                  type="number"
                  min="1"
                  max="168"
                  value={config.lembrete_intervalo_horas}
                  onChange={(e) => setConfig({ ...config, lembrete_intervalo_horas: parseInt(e.target.value) || 24 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Intervalo mínimo entre cada lembrete enviado
                </p>
              </div>

              <div>
                <Label htmlFor="lembrete_max_tentativas">Máximo de Tentativas</Label>
                <Input
                  id="lembrete_max_tentativas"
                  type="number"
                  min="1"
                  max="10"
                  value={config.lembrete_max_tentativas}
                  onChange={(e) => setConfig({ ...config, lembrete_max_tentativas: parseInt(e.target.value) || 3 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número máximo de lembretes a serem enviados por aprovação
                </p>
              </div>

              <div>
                <Label htmlFor="mensagem_lembrete_template">Template de Lembrete</Label>
                <Textarea
                  id="mensagem_lembrete_template"
                  value={config.mensagem_lembrete_template}
                  onChange={(e) => setConfig({ ...config, mensagem_lembrete_template: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Digite o template da mensagem de lembrete..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variáveis disponíveis: {'{nome_gestor}'}, {'{nome_funcionario}'}, {'{data}'}, {'{horas_extras}'}, {'{link_aprovacao}'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

