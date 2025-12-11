"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Forklift, Building2, Wrench, Calendar } from "lucide-react"
import { gruasApi } from "@/lib/api-gruas"
import { useToast } from "@/hooks/use-toast"

export default function PWAClienteGruaDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [grua, setGrua] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      carregarGrua()
    }
  }, [params.id])

  const carregarGrua = async () => {
    try {
      setLoading(true)
      const response = await gruasApi.obterGrua(params.id as string)
      if (response.success) {
        setGrua(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar detalhes da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!grua) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Card className="mt-4">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">Grua não encontrada</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Forklift className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{grua.name}</CardTitle>
                    {grua.modelo && (
                      <CardDescription className="text-base mt-1">{grua.modelo}</CardDescription>
                    )}
                  </div>
                </div>
                <Badge variant={grua.status === 'em_obra' ? 'default' : 'secondary'}>
                  {grua.status === 'em_obra' ? 'Em Obra' : grua.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {grua.fabricante && (
                  <div>
                    <Label className="text-sm text-gray-600">Fabricante</Label>
                    <p className="font-medium">{grua.fabricante}</p>
                  </div>
                )}
                {grua.capacidade && (
                  <div>
                    <Label className="text-sm text-gray-600">Capacidade</Label>
                    <p className="font-medium">{grua.capacidade}</p>
                  </div>
                )}
                {grua.altura_trabalho && (
                  <div>
                    <Label className="text-sm text-gray-600">Altura de Trabalho</Label>
                    <p className="font-medium">{grua.altura_trabalho}</p>
                  </div>
                )}
                {grua.alcance_maximo && (
                  <div>
                    <Label className="text-sm text-gray-600">Alcance Máximo</Label>
                    <p className="font-medium">{grua.alcance_maximo}</p>
                  </div>
                )}
              </div>

              {grua.observacoes && (
                <div className="mt-6 pt-6 border-t">
                  <Label className="text-sm text-gray-600">Observações</Label>
                  <p className="text-gray-800 mt-2">{grua.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
