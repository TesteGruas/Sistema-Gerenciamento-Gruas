"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PerfisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirecionar para a página unificada
    const perfilId = searchParams.get('perfil')
    if (perfilId) {
      router.replace(`/dashboard/perfis-permissoes?perfil=${perfilId}`)
    } else {
      router.replace('/dashboard/perfis-permissoes')
    }
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}
