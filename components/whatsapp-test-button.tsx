"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  MessageSquare
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/api"

interface WhatsAppTestButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function WhatsAppTestButton({ 
  variant = "outline", 
  size = "default",
  className = ""
}: WhatsAppTestButtonProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [numeroDestinatario, setNumeroDestinatario] = useState("")
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    link_aprovacao?: string
    aprovacao_id?: string
  } | null>(null)

  const handleTestCompleto = async () => {
    if (!numeroDestinatario.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o número destinatário",
        variant: "destructive"
      })
      return
    }

    // Validar formato do número
    const numeroLimpo = numeroDestinatario.replace(/\D/g, '')
    if (numeroLimpo.length < 10) {
      toast({
        title: "Erro",
        description: "Número inválido. Informe um número válido com DDD",
        variant: "destructive"
      })
      return
    }

    try {
      setTesting(true)
      setTestResult(null)

      const apiUrl = getApiOrigin()
      const response = await fetchWithAuth(`${apiUrl}/api/whatsapp/test-completo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_destinatario: numeroLimpo
        }),
      })

      // Verificar se o token expirou
      if (response.status === 403 || response.status === 401) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.code === 'INVALID_TOKEN' || errorData.code === 'MISSING_TOKEN') {
          // Tentar renovar o token automaticamente
          try {
            const { refreshAuthToken } = await import('@/lib/api')
            const newToken = await refreshAuthToken()
            
            if (newToken) {
              // Tentar novamente com o novo token
              const retryResponse = await fetchWithAuth(`${apiUrl}/api/whatsapp/test-completo`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  numero_destinatario: numeroLimpo
                }),
              })
              
              const retryData = await retryResponse.json()
              if (retryResponse.ok && retryData.success) {
                setTestResult({
                  success: true,
                  message: retryData.message || "Notificação de teste completa enviada com sucesso!",
                  link_aprovacao: retryData.data?.link_aprovacao,
                  aprovacao_id: retryData.data?.aprovacao_id
                })
                toast({
                  title: "Sucesso",
                  description: "Aprovação de teste criada e WhatsApp enviado!",
                })
                return
              }
            }
          } catch (refreshError) {
            console.error('Erro ao renovar token:', refreshError)
          }
          
          // Se não conseguiu renovar, mostrar erro e redirecionar
          toast({
            title: "Sessão Expirada",
            description: "Sua sessão expirou. Você será redirecionado para fazer login novamente.",
            variant: "destructive"
          })
          
          // Aguardar um pouco antes de redirecionar
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/'
            }
          }, 2000)
          
          throw new Error('Token expirado. Por favor, faça login novamente.')
        }
      }

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || "Notificação de teste completa enviada com sucesso!",
          link_aprovacao: data.data?.link_aprovacao,
          aprovacao_id: data.data?.aprovacao_id
        })
        toast({
          title: "Sucesso",
          description: "Aprovação de teste criada e WhatsApp enviado!",
        })
      } else {
        throw new Error(data.message || data.error || 'Erro ao criar teste completo')
      }
    } catch (error: any) {
      console.error('Erro ao testar completo:', error)
      setTestResult({
        success: false,
        message: error.message || "Erro ao criar teste completo"
      })
      toast({
        title: "Erro no Teste",
        description: error.message || "Erro ao criar teste completo",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Send className="w-4 h-4 mr-2" />
          Testar WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Disparar Notificação de Teste
          </DialogTitle>
          <DialogDescription>
            Cria uma aprovação de teste completa e envia WhatsApp com link de aprovação para validar o fluxo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="numero_destinatario">Número Destinatário</Label>
            <Input
              id="numero_destinatario"
              type="tel"
              value={numeroDestinatario}
              onChange={(e) => setNumeroDestinatario(e.target.value)}
              placeholder="5511999999999 (com código do país e DDD)"
              className="mt-1"
              disabled={testing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Informe o número no formato internacional: código do país + DDD + número (ex: 5511999999999)
            </p>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className="space-y-2">
                <p>{testResult.message}</p>
                {testResult.link_aprovacao && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      ✅ Link de Aprovação Gerado:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded border break-all">
                        {testResult.link_aprovacao}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(testResult.link_aprovacao, '_blank')
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Abrir
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      📱 Verifique se a mensagem chegou no WhatsApp e teste a aprovação pelo link acima.
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleTestCompleto}
              disabled={testing || !numeroDestinatario.trim()}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Disparar Notificação
                </>
              )}
            </Button>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              ℹ️ Este teste cria uma aprovação real no sistema e envia WhatsApp. Use apenas para validação.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

