"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEnhancedToast } from "@/hooks/use-enhanced-toast"
import { AlertCircle, CheckCircle, Info, WifiOff, Mail, RefreshCw } from "lucide-react"

/**
 * Componente de demonstração das melhorias no toast
 * Mostra diferentes tipos de toast com ícones e ações
 */
export default function ToastDemo() {
  const { 
    showError, 
    showSuccess, 
    showInfo, 
    showNetworkError, 
    showValidationError, 
    showAuthError 
  } = useEnhancedToast()

  const [isLoading, setIsLoading] = useState(false)

  const demoScenarios = [
    {
      name: "Erro de Validação",
      description: "Senha muito curta",
      action: () => showValidationError("senha", "A senha deve ter pelo menos 6 caracteres")
    },
    {
      name: "Erro de Autenticação",
      description: "Credenciais inválidas",
      action: () => showAuthError({
        error: "Credenciais inválidas",
        message: "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
      })
    },
    {
      name: "Email não confirmado",
      description: "Com ação de reenvio",
      action: () => showAuthError({
        error: "Email não confirmado",
        message: "Verifique sua caixa de entrada e confirme seu email"
      })
    },
    {
      name: "Muitas tentativas",
      description: "Com ação de ajuda",
      action: () => showAuthError({
        error: "Muitas tentativas de login",
        message: "Por segurança, aguarde alguns minutos antes de tentar novamente"
      })
    },
    {
      name: "Erro de Rede",
      description: "Com botão de tentar novamente",
      action: () => showNetworkError(() => {
        console.log("Tentando novamente...")
      })
    },
    {
      name: "Sucesso",
      description: "Login realizado",
      action: () => showSuccess(
        "Login realizado com sucesso!",
        "Bem-vindo ao sistema!"
      )
    },
    {
      name: "Informação",
      description: "Dica do sistema",
      action: () => showInfo(
        "Dica de segurança",
        "Use uma senha forte com pelo menos 8 caracteres, incluindo números e símbolos"
      )
    }
  ]

  const simulateLoginError = async () => {
    setIsLoading(true)
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simular diferentes tipos de erro
    const errorTypes = [
      { error: "Dados inválidos", details: "\"password\" length must be at least 6 characters long" },
      { error: "Credenciais inválidas", message: "Email ou senha incorretos" },
      { error: "Email não confirmado", message: "Verifique sua caixa de entrada" },
      { name: "TypeError", message: "Failed to fetch" }
    ]
    
    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]
    showError(randomError)
    
    setIsLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Demonstração de Toast Melhorado</span>
          </CardTitle>
          <CardDescription>
            Teste diferentes tipos de notificações com ícones, cores e ações específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cenários de demonstração */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              Cenários de Demonstração:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {demoScenarios.map((scenario, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={scenario.action}
                  className="h-auto p-4 text-left justify-start"
                >
                  <div>
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {scenario.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Simulação de erro aleatório */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              Simulação de Erro Aleatório:
            </h3>
            <Button
              onClick={simulateLoginError}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Simulando...
                </>
              ) : (
                "Simular Erro de Login"
              )}
            </Button>
          </div>

          {/* Características do toast melhorado */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              Características do Toast Melhorado:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Ícones específicos por tipo de erro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cores apropriadas para cada situação</span>
                </div>
                <div className="flex items-center space-x-2">
                  <WifiOff className="h-4 w-4 text-orange-500" />
                  <span>Layout melhorado com espaçamento</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span>Ações contextuais (reenviar email, tentar novamente)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                  <span>Mensagens traduzidas e amigáveis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Duração apropriada para cada tipo</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
