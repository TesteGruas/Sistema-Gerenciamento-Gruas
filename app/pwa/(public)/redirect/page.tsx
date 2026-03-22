"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Clock, FileSignature } from "lucide-react"

export default function PWARedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página principal do PWA após 2 segundos
    const timer = setTimeout(() => {
      router.push('/pwa')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            IRBANA PWA
          </h1>
          <p className="text-gray-600 mb-6">
            Carregando aplicativo...
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Sistema de Ponto Eletrônico</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FileSignature className="w-4 h-4 text-green-600" />
              <span>Assinatura Digital</span>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Inicializando...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
