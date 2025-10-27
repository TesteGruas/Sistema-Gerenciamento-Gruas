"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const redirect = () => {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') return

      const userData = localStorage.getItem('user_data')
      
      if (!userData) {
        router.push('/pwa/login')
        return
      }

      try {
        const user = JSON.parse(userData)
        const cargo = user.user_metadata?.cargo || user.cargo || ''
        const role = user.role || user.user_metadata?.role || ''

        // Função auxiliar para verificar se é gestor
        const isGestor = () => {
          const cargoStr = cargo?.toLowerCase() || ''
          const roleStr = role?.toLowerCase() || ''
          
          return (
            cargoStr.includes('gestor') ||
            cargoStr.includes('gerente') ||
            cargoStr.includes('diretor') ||
            cargoStr.includes('admin') ||
            cargoStr.includes('supervisor') ||
            cargoStr.includes('encarregado') ||
            roleStr.includes('gestor') ||
            roleStr.includes('gerente') ||
            roleStr.includes('admin') ||
            roleStr.includes('supervisor')
          )
        }

        // Redirecionar baseado no perfil
        if (isGestor()) {
          router.push('/dashboard')
        } else {
          router.push('/pwa')
        }
      } catch (error) {
        router.push('/pwa/login')
      }
    }

    redirect()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M2 12h20" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Redirecionando...</h1>
        <p className="text-gray-600 mt-2">Verificando seu perfil de acesso</p>
      </div>
    </div>
  )
}
