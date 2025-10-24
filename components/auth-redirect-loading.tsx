"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, LogOut } from "lucide-react"

interface AuthRedirectLoadingProps {
  reason?: string
}

export function AuthRedirectLoading({ reason = "Verificando autenticação..." }: AuthRedirectLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Redirecionando para Login
            </h2>
            
            <p className="text-gray-600 mb-4">
              {reason}
            </p>
            
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Aguarde enquanto redirecionamos você...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
