"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRedirectPath, getUserLevel } from '@/lib/redirect-handler'

export default function RedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const redirect = () => {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') return

      // Verificar se tem token de acesso
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/pwa/login')
        return
      }

      try {
        // Tentar obter dados do usuário de várias fontes
        const userDataStr = localStorage.getItem('user_data')
        const userPerfilStr = localStorage.getItem('user_perfil')
        const userLevelStr = localStorage.getItem('user_level')
        const userRole = localStorage.getItem('user_role')

        let userData: any = null

        // Construir objeto userData
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr)
          } catch (e) {
            console.warn('Erro ao parsear user_data:', e)
          }
        }

        // Se não tem userData, construir a partir dos dados disponíveis
        if (!userData) {
          userData = {
            role: userRole || '',
            level: userLevelStr ? parseInt(userLevelStr, 10) : undefined,
            perfil: userPerfilStr ? JSON.parse(userPerfilStr) : null
          }
        } else {
          // Adicionar level e perfil se disponíveis
          if (userLevelStr) {
            userData.level = parseInt(userLevelStr, 10)
          }
          if (userRole) {
            userData.role = userRole
          }
          if (userPerfilStr) {
            try {
              userData.perfil = JSON.parse(userPerfilStr)
            } catch (e) {
              console.warn('Erro ao parsear user_perfil:', e)
            }
          }
        }

        // Obter nível do usuário
        const level = getUserLevel(userData)
        const role = (userData.role || userRole || '').toLowerCase()

        // Determinar redirecionamento baseado no nível
        // Apenas Admin (nível 10) → Dashboard (web)
        // Demais níveis → PWA
        let redirectPath = '/pwa'
        if (level === 10 || role === 'admin' || role === 'administrador') {
          redirectPath = '/dashboard'
        }

        console.log(`🔄 [Redirect] Redirecionando para: ${redirectPath} (nível: ${level}, role: ${role})`)
        router.push(redirectPath)
      } catch (error) {
        console.error('Erro ao redirecionar:', error)
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
