"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults: any = {}

    // 1. Verificar variáveis de ambiente
    testResults.env = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'Não definida',
      construida: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    }

    // 2. Testar conectividade básica
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'teste@teste.com',
          password: 'senha_errada_proposital'
        })
      })
      
      testResults.connectivity = {
        status: 'OK',
        statusCode: response.status,
        message: 'Servidor acessível'
      }

      try {
        const data = await response.json()
        testResults.responseFormat = {
          status: 'OK',
          format: JSON.stringify(data, null, 2)
        }
      } catch (e) {
        testResults.responseFormat = {
          status: 'ERRO',
          message: 'Resposta não é JSON válido'
        }
      }
    } catch (error: any) {
      testResults.connectivity = {
        status: 'ERRO',
        message: error.message || 'Não foi possível conectar'
      }
    }

    // 3. Testar login com credenciais padrão
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@admin.com',
          password: 'teste@123'
        })
      })
      
      const data = await response.json()
      
      testResults.login = {
        status: response.ok ? 'OK' : 'ERRO',
        statusCode: response.status,
        success: data.success,
        hasToken: !!data.data?.access_token,
        hasUser: !!data.data?.user,
        response: JSON.stringify(data, null, 2)
      }
    } catch (error: any) {
      testResults.login = {
        status: 'ERRO',
        message: error.message
      }
    }

    // 4. Verificar localStorage
    testResults.localStorage = {
      hasToken: !!localStorage.getItem('access_token'),
      hasUser: !!localStorage.getItem('user_data'),
      token: localStorage.getItem('access_token')?.substring(0, 20) + '...',
      user: localStorage.getItem('user_data')?.substring(0, 50) + '...'
    }

    setResults(testResults)
    setLoading(false)
  }

  const clearStorage = () => {
    localStorage.clear()
    sessionStorage.clear()
    alert('Storage limpo! Execute os testes novamente.')
    setResults({})
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">🧪 Teste de Conectividade PWA</h1>
        <p className="text-gray-600">Diagnóstico de problemas de login</p>
      </div>

      <div className="flex gap-2">
        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Testando...' : 'Executar Testes'}
        </Button>
        <Button variant="outline" onClick={clearStorage}>
          Limpar Storage
        </Button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {/* Variáveis de Ambiente */}
          <Card>
            <CardHeader>
              <CardTitle>1. Variáveis de Ambiente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>NEXT_PUBLIC_API_URL:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
                  {results.env?.NEXT_PUBLIC_API_URL}
                </pre>
              </div>
              <div>
                <strong>URL Construída:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
                  {results.env?.construida}
                </pre>
              </div>
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  {results.env?.NEXT_PUBLIC_API_URL === 'Não definida' 
                    ? '⚠️ PROBLEMA: Variável não definida! Usando fallback localhost:3001'
                    : '✅ Variável definida corretamente'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Conectividade */}
          <Card>
            <CardHeader>
              <CardTitle>2. Conectividade com API</CardTitle>
            </CardHeader>
            <CardContent>
              {results.connectivity?.status === 'OK' ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Servidor acessível (Status: {results.connectivity.statusCode})
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    ❌ {results.connectivity?.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Formato da Resposta */}
          {results.responseFormat && (
            <Card>
              <CardHeader>
                <CardTitle>3. Formato da Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                {results.responseFormat.status === 'OK' ? (
                  <>
                    <Alert className="bg-green-50 border-green-200 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ✅ Resposta é JSON válido
                      </AlertDescription>
                    </Alert>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                      {results.responseFormat.format}
                    </pre>
                  </>
                ) : (
                  <Alert className="bg-red-50 border-red-200">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      ❌ {results.responseFormat.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Login */}
          {results.login && (
            <Card>
              <CardHeader>
                <CardTitle>4. Teste de Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.login.status === 'OK' ? (
                  <>
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ✅ Login funcionando!
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2 text-sm">
                      <div>Status Code: <strong>{results.login.statusCode}</strong></div>
                      <div>Success: <strong>{results.login.success ? 'Sim' : 'Não'}</strong></div>
                      <div>Tem Token: <strong>{results.login.hasToken ? 'Sim ✅' : 'Não ❌'}</strong></div>
                      <div>Tem User: <strong>{results.login.hasUser ? 'Sim ✅' : 'Não ❌'}</strong></div>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-sm font-medium mb-2">
                        Ver resposta completa
                      </summary>
                      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                        {results.login.response}
                      </pre>
                    </details>
                  </>
                ) : (
                  <Alert className="bg-red-50 border-red-200">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      ❌ {results.login.message || 'Erro no login'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* LocalStorage */}
          <Card>
            <CardHeader>
              <CardTitle>5. LocalStorage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                Tem Token: <strong>{results.localStorage.hasToken ? 'Sim ✅' : 'Não ❌'}</strong>
              </div>
              <div>
                Tem User: <strong>{results.localStorage.hasUser ? 'Sim ✅' : 'Não ❌'}</strong>
              </div>
              {results.localStorage.hasToken && (
                <div>
                  Token (primeiros 20 chars):
                  <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
                    {results.localStorage.token}
                  </pre>
                </div>
              )}
              {results.localStorage.hasUser && (
                <div>
                  User (primeiros 50 chars):
                  <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
                    {results.localStorage.user}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnóstico Final */}
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle>🎯 Diagnóstico Final</CardTitle>
            </CardHeader>
            <CardContent>
              {results.login?.status === 'OK' && results.login?.hasToken ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>✅ Sistema funcionando!</strong>
                    <br />
                    A API está respondendo corretamente e o login está funcionando.
                  </AlertDescription>
                </Alert>
              ) : results.connectivity?.status === 'ERRO' ? (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>❌ Erro de Conectividade</strong>
                    <br />
                    <br />
                    <strong>Possíveis causas:</strong>
                    <ul className="list-disc ml-4 mt-2 space-y-1">
                      <li>Backend não está rodando (verificar: <code>pm2 list</code>)</li>
                      <li>URL da API errada (verificar .env)</li>
                      <li>Firewall bloqueando a porta 3001</li>
                      <li>Problema de rede/conexão</li>
                    </ul>
                    <br />
                    <strong>Solução:</strong>
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>No servidor: <code>pm2 list</code></li>
                      <li>Se backend não estiver rodando: <code>pm2 start backend-api</code></li>
                      <li>Verificar .env: <code>cat .env | grep NEXT_PUBLIC</code></li>
                      <li>Rebuild: <code>npm run build && pm2 restart all</code></li>
                    </ol>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>⚠️ API acessível mas login com problema</strong>
                    <br />
                    <br />
                    <strong>Possíveis causas:</strong>
                    <ul className="list-disc ml-4 mt-2 space-y-1">
                      <li>Credenciais incorretas</li>
                      <li>Formato da resposta diferente do esperado</li>
                      <li>Token não está sendo retornado</li>
                      <li>Estrutura de dados diferente</li>
                    </ul>
                    <br />
                    <strong>Verifique a resposta acima</strong> para ver o formato exato que a API está retornando.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

