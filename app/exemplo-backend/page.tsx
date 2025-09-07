"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ExemploBackendPage() {
  const [user, setUser] = useState<any>(null)
  const [gruas, setGruas] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [loadingGruas, setLoadingGruas] = useState(false)
  const [loadingEstoque, setLoadingEstoque] = useState(false)
  
  const [novaGrua, setNovaGrua] = useState({
    modelo: "",
    fabricante: "",
    tipo: "",
    capacidade: ""
  })

  // Função para obter token
  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // Função para fazer logout
  const signOut = async () => {
    try {
      const token = getToken()
      if (token) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
      localStorage.removeItem('access_token')
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  // Carregar dados do usuário
  useEffect(() => {
    const token = getToken()
    if (token) {
      fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data.user)
        } else {
          localStorage.removeItem('access_token')
          window.location.href = '/'
        }
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        window.location.href = '/'
      })
    } else {
      window.location.href = '/'
    }
  }, [])

  // Carregar gruas
  const loadGruas = async () => {
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/gruas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setGruas(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar gruas:', error)
    }
  }

  // Carregar produtos
  const loadProdutos = async () => {
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/estoque', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setProdutos(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  // Carregar dados quando usuário estiver logado
  useEffect(() => {
    if (user) {
      loadGruas()
      loadProdutos()
    }
  }, [user])

  const handleCriarGrua = async () => {
    setLoadingGruas(true)
    try {
      const token = getToken()
      const response = await fetch('http://localhost:3001/api/gruas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(novaGrua)
      })
      
      const data = await response.json()
      if (data.success) {
        setNovaGrua({ modelo: "", fabricante: "", tipo: "", capacidade: "" })
        alert("Grua criada com sucesso!")
        loadGruas() // Recarregar lista
      } else {
        alert("Erro ao criar grua: " + data.error)
      }
    } catch (error) {
      console.error("Erro ao criar grua:", error)
      alert("Erro ao criar grua")
    } finally {
      setLoadingGruas(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Backend Exemplo</CardTitle>
            <CardDescription>
              Faça login para testar o backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/"}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Exemplo de Uso do Backend</h1>
          <Button onClick={signOut} variant="outline">
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seção de Gruas */}
          <Card>
            <CardHeader>
              <CardTitle>Gruas ({gruas.length})</CardTitle>
              <CardDescription>
                Gerenciar gruas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={novaGrua.modelo}
                    onChange={(e) => setNovaGrua({...novaGrua, modelo: e.target.value})}
                    placeholder="Ex: SITI MI2348"
                  />
                </div>
                <div>
                  <Label htmlFor="fabricante">Fabricante</Label>
                  <Input
                    id="fabricante"
                    value={novaGrua.fabricante}
                    onChange={(e) => setNovaGrua({...novaGrua, fabricante: e.target.value})}
                    placeholder="Ex: SITI"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Input
                    id="tipo"
                    value={novaGrua.tipo}
                    onChange={(e) => setNovaGrua({...novaGrua, tipo: e.target.value})}
                    placeholder="Ex: Grua Torre"
                  />
                </div>
                <div>
                  <Label htmlFor="capacidade">Capacidade</Label>
                  <Input
                    id="capacidade"
                    value={novaGrua.capacidade}
                    onChange={(e) => setNovaGrua({...novaGrua, capacidade: e.target.value})}
                    placeholder="Ex: 8 toneladas"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCriarGrua}
                disabled={loadingGruas}
                className="w-full"
              >
                {loadingGruas ? "Criando..." : "Criar Grua"}
              </Button>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Gruas Existentes:</h4>
                {gruas.length === 0 ? (
                  <p className="text-gray-500">Nenhuma grua cadastrada</p>
                ) : (
                  <div className="space-y-2">
                    {gruas.map((grua) => (
                      <div key={grua.id} className="p-3 bg-gray-100 rounded">
                        <p className="font-medium">{grua.modelo} - {grua.fabricante}</p>
                        <p className="text-sm text-gray-600">{grua.tipo} - {grua.capacidade}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção de Estoque */}
          <Card>
            <CardHeader>
              <CardTitle>Estoque ({produtos.length})</CardTitle>
              <CardDescription>
                Gerenciar produtos em estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Produtos em Estoque:</h4>
                  {produtos.length === 0 ? (
                    <p className="text-gray-500">Nenhum produto em estoque</p>
                  ) : (
                    <div className="space-y-2">
                      {produtos.map((produto) => (
                        <div key={produto.id} className="p-3 bg-gray-100 rounded">
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {produto.quantidade} | 
                            Preço: R$ {produto.preco_unitario}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Último Login:</strong> {user.last_sign_in_at}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
