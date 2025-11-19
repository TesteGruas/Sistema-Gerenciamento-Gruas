"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAlocacoesAtivasFuncionario } from "@/lib/api-funcionarios-obras"
import { getFuncionarioId } from "@/lib/get-funcionario-id"

export default function ValidarObraPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-obra'>('loading')
  const [mensagem, setMensagem] = useState('')
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null)
  const [obra, setObra] = useState<any>(null)

  useEffect(() => {
    const validarObra = async () => {
      try {
        setStatus('loading')
        setMensagem('Validando obra ativa...')

        const token = localStorage.getItem('access_token')
        if (!token) {
          setStatus('error')
          setMensagem('Token de autenticação não encontrado. Faça login novamente.')
          setTimeout(() => router.push('/pwa/login'), 2000)
          return
        }

        const userData = localStorage.getItem('user_data')
        if (!userData) {
          setStatus('error')
          setMensagem('Dados do usuário não encontrados. Faça login novamente.')
          setTimeout(() => router.push('/pwa/login'), 2000)
          return
        }

        const parsedUser = JSON.parse(userData)
        console.log('[ValidarObra] parsedUser completo:', parsedUser)

        // Tentar obter funcionario_id - priorizar ID direto
        let funcId: number | null = null

        // 1. Tentar diretamente do user_data.funcionario_id
        if (parsedUser.funcionario_id && !isNaN(Number(parsedUser.funcionario_id))) {
          funcId = Number(parsedUser.funcionario_id)
          console.log('[ValidarObra] ✅ funcionario_id encontrado no user_data:', funcId)
        } 
        // 2. Tentar do user_metadata.funcionario_id (Supabase Auth)
        else if (parsedUser.user_metadata?.funcionario_id && !isNaN(Number(parsedUser.user_metadata.funcionario_id))) {
          funcId = Number(parsedUser.user_metadata.funcionario_id)
          console.log('[ValidarObra] ✅ funcionario_id encontrado no user_metadata:', funcId)
        }
        // 3. Tentar do profile.funcionario_id
        else if (parsedUser.profile?.funcionario_id && !isNaN(Number(parsedUser.profile.funcionario_id))) {
          funcId = Number(parsedUser.profile.funcionario_id)
          console.log('[ValidarObra] ✅ funcionario_id encontrado no profile:', funcId)
        }
        // 4. Buscar via API usando email ou ID do usuário
        else {
          console.log('[ValidarObra] 🔍 Buscando funcionario_id via API...')
          console.log('[ValidarObra] Dados para busca:', {
            email: parsedUser.email,
            userId: parsedUser.id,
            nome: parsedUser.nome
          })
          
          // Tentar buscar diretamente pela API usando o ID do usuário ou email
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            
            // Primeiro, tentar buscar pelo email
            if (parsedUser.email) {
              const searchUrl = `${apiUrl}/api/funcionarios?search=${encodeURIComponent(parsedUser.email)}&limit=20`
              console.log('[ValidarObra] 🔍 Buscando em:', searchUrl)
              
              const response = await fetch(searchUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (response.ok) {
                const data = await response.json()
                const funcionarios = data.data || []
                console.log('[ValidarObra] 📦 Funcionários encontrados:', funcionarios.length)
                
                // Procurar funcionário que corresponde ao usuário
                const funcionario = funcionarios.find((f: any) => 
                  f.usuario?.id === parsedUser.id || 
                  f.usuario?.email === parsedUser.email ||
                  f.email === parsedUser.email
                )
                
                if (funcionario && funcionario.id) {
                  funcId = typeof funcionario.id === 'number' ? funcionario.id : parseInt(funcionario.id)
                  console.log('[ValidarObra] ✅ funcionario_id encontrado via busca direta:', funcId)
                }
              }
            }
            
            // Se ainda não encontrou, usar a função utilitária
            if (!funcId) {
              funcId = await getFuncionarioId(parsedUser, token)
              console.log('[ValidarObra] funcionario_id obtido via função utilitária:', funcId)
            }
          } catch (apiError) {
            console.error('[ValidarObra] Erro na busca direta, tentando função utilitária:', apiError)
            funcId = await getFuncionarioId(parsedUser, token)
          }
        }

        if (!funcId) {
          setStatus('error')
          setMensagem('Não foi possível identificar o funcionário. Entre em contato com o administrador.')
          return
        }

        setFuncionarioId(funcId)
        setMensagem(`Funcionário ID: ${funcId}. Buscando obra ativa...`)

        // Buscar alocações ativas usando o funcionario_id diretamente
        console.log('[ValidarObra] 🔍 Buscando alocações para funcionario_id:', funcId)
        const alocacoes = await getAlocacoesAtivasFuncionario(funcId)
        console.log('[ValidarObra] 📦 Alocações retornadas:', {
          success: alocacoes.success,
          total: alocacoes.data?.length || 0,
          alocacoes: alocacoes.data
        })

        if (alocacoes.data && alocacoes.data.length > 0) {
          const primeiraObra = alocacoes.data[0]
          setObra(primeiraObra.obras)
          
          // Salvar no localStorage para uso posterior
          localStorage.setItem('obra_ativa', JSON.stringify({
            funcionario_id: funcId,
            obra_id: primeiraObra.obra_id,
            obra: primeiraObra.obras,
            alocacao: primeiraObra
          }))
          localStorage.setItem('tem_obra_ativa', 'true')

          setStatus('success')
          setMensagem(`Obra encontrada: ${primeiraObra.obras?.nome || 'N/A'}`)
          
          // Redirecionar após 2 segundos
          setTimeout(() => {
            router.push('/pwa')
          }, 2000)
        } else {
          setStatus('no-obra')
          setMensagem('Nenhuma obra ativa encontrada para este funcionário.')
          localStorage.setItem('tem_obra_ativa', 'false')
        }
      } catch (error: any) {
        console.error('[ValidarObra] Erro:', error)
        setStatus('error')
        setMensagem(`Erro ao validar obra: ${error.message || 'Erro desconhecido'}`)
      }
    }

    validarObra()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            {status === 'no-obra' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
            Validação de Obra
          </CardTitle>
          <CardDescription>
            Verificando se você possui uma obra ativa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">{mensagem}</p>
          </div>

          {funcionarioId && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Funcionário ID:</p>
              <p className="text-sm font-semibold">{funcionarioId}</p>
            </div>
          )}

          {obra && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">Obra Ativa:</p>
              <p className="text-sm font-semibold text-green-900">{obra.nome}</p>
              <p className="text-xs text-green-700 mt-1">{obra.cidade}, {obra.estado}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-green-600">Redirecionando para o dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <Button 
              onClick={() => router.push('/pwa/login')}
              className="w-full"
              variant="destructive"
            >
              Voltar para Login
            </Button>
          )}

          {status === 'no-obra' && (
            <div className="space-y-2">
              <p className="text-sm text-yellow-600 text-center">
                Você não possui uma obra ativa no momento. Entre em contato com o administrador.
              </p>
              <Button 
                onClick={() => router.push('/pwa')}
                className="w-full"
                variant="outline"
              >
                Continuar mesmo assim
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

