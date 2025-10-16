"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { translateError, getErrorStyle } from "@/lib/error-messages"

/**
 * Componente de demonstração das mensagens de erro melhoradas
 * Este componente mostra como as mensagens de erro são traduzidas
 */
export default function ErrorDemo() {
  const [currentError, setCurrentError] = useState<any>(null)
  const [friendlyError, setFriendlyError] = useState<any>(null)

  const demoErrors = [
    {
      name: "Senha muito curta",
      error: {
        error: "Dados inválidos",
        details: "\"password\" length must be at least 6 characters long"
      }
    },
    {
      name: "Email inválido",
      error: {
        error: "Dados inválidos", 
        details: "\"email\" must be a valid email"
      }
    },
    {
      name: "Credenciais inválidas",
      error: {
        error: "Credenciais inválidas",
        message: "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
      }
    },
    {
      name: "Email não confirmado",
      error: {
        error: "Email não confirmado",
        message: "Email não confirmado",
        description: "Verifique sua caixa de entrada e confirme seu email"
      }
    },
    {
      name: "Muitas tentativas",
      error: {
        error: "Muitas tentativas de login",
        message: "Muitas tentativas de login",
        description: "Aguarde alguns minutos antes de tentar novamente"
      }
    },
    {
      name: "Erro de rede",
      error: {
        name: "TypeError",
        message: "Failed to fetch"
      }
    }
  ]

  const handleDemoError = (demoError: any) => {
    setCurrentError(demoError.error)
    const translated = translateError(demoError.error)
    setFriendlyError(translated)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demonstração de Mensagens de Erro Melhoradas</CardTitle>
          <CardDescription>
            Veja como as mensagens de erro técnicas são traduzidas para mensagens amigáveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {demoErrors.map((demo, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleDemoError(demo)}
                className="text-left justify-start"
              >
                {demo.name}
              </Button>
            ))}
          </div>

          {currentError && friendlyError && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  Erro Original (Técnico):
                </h3>
                <Alert className="bg-gray-50 border-gray-200">
                  <AlertDescription className="font-mono text-sm">
                    <pre>{JSON.stringify(currentError, null, 2)}</pre>
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  Mensagem Traduzida (Amigável):
                </h3>
                <Alert className={`${getErrorStyle(friendlyError.type).bgColor} ${getErrorStyle(friendlyError.type).borderColor}`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{getErrorStyle(friendlyError.type).icon}</span>
                    <div>
                      <div className={`font-semibold ${getErrorStyle(friendlyError.type).color}`}>
                        {friendlyError.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {friendlyError.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Tipo: {friendlyError.type}
                      </div>
                    </div>
                  </div>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
