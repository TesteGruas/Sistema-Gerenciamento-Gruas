"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Save } from "lucide-react"
import { TEMPLATES_ORCAMENTO, isTemplatePadrao } from "@/lib/templates-orcamento"

interface OrcamentoCondicoesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condicoes: {
    escopo_incluso?: string
    responsabilidades_cliente?: string
    condicoes_comerciais?: string
    condicoes_gerais?: string
    logistica?: string
    garantias?: string
  }
  onSave: (condicoes: {
    escopo_incluso?: string
    responsabilidades_cliente?: string
    condicoes_comerciais?: string
    condicoes_gerais?: string
    logistica?: string
    garantias?: string
  }) => void
}

export function OrcamentoCondicoesDialog({
  open,
  onOpenChange,
  condicoes,
  onSave
}: OrcamentoCondicoesDialogProps) {
  const [localCondicoes, setLocalCondicoes] = useState(condicoes)

  // Atualizar estado local quando condicoes mudarem
  useEffect(() => {
    setLocalCondicoes(condicoes)
  }, [condicoes])

  // Pré-preencher com templates se estiver vazio
  useEffect(() => {
    if (open) {
      const updated = { ...localCondicoes }
      
      if (!updated.escopo_incluso) {
        updated.escopo_incluso = TEMPLATES_ORCAMENTO.escopo_incluso
      }
      if (!updated.responsabilidades_cliente) {
        updated.responsabilidades_cliente = TEMPLATES_ORCAMENTO.responsabilidades_cliente
      }
      if (!updated.condicoes_comerciais) {
        updated.condicoes_comerciais = TEMPLATES_ORCAMENTO.condicoes_comerciais
      }
      if (!updated.condicoes_gerais) {
        updated.condicoes_gerais = TEMPLATES_ORCAMENTO.condicoes_gerais
      }
      if (!updated.logistica) {
        updated.logistica = TEMPLATES_ORCAMENTO.logistica
      }
      if (!updated.garantias) {
        updated.garantias = TEMPLATES_ORCAMENTO.garantias
      }
      
      setLocalCondicoes(updated)
    }
  }, [open])

  const handleRestaurarTemplate = (campo: keyof typeof TEMPLATES_ORCAMENTO) => {
    setLocalCondicoes({
      ...localCondicoes,
      [campo]: TEMPLATES_ORCAMENTO[campo]
    })
  }

  const handleSave = () => {
    onSave(localCondicoes)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Condições do Orçamento</DialogTitle>
          <DialogDescription>
            Configure as condições fixas do orçamento. Os textos padrão são pré-preenchidos mas podem ser editados.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="escopo" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="escopo">Escopo</TabsTrigger>
            <TabsTrigger value="responsabilidades">Responsabilidades</TabsTrigger>
            <TabsTrigger value="comerciais">Comerciais</TabsTrigger>
            <TabsTrigger value="gerais">Gerais</TabsTrigger>
            <TabsTrigger value="logistica">Logística</TabsTrigger>
            <TabsTrigger value="garantias">Garantias</TabsTrigger>
          </TabsList>

          <TabsContent value="escopo" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Escopo Básico Incluso</CardTitle>
                    <CardDescription>
                      O que está incluído no orçamento básico
                    </CardDescription>
                  </div>
                  {!isTemplatePadrao('escopo_incluso', localCondicoes.escopo_incluso || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestaurarTemplate('escopo_incluso')}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar Padrão
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localCondicoes.escopo_incluso || ''}
                  onChange={(e) => setLocalCondicoes({ ...localCondicoes, escopo_incluso: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responsabilidades" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Responsabilidades do Cliente</CardTitle>
                    <CardDescription>
                      O que o cliente deve fornecer/preparar
                    </CardDescription>
                  </div>
                  {!isTemplatePadrao('responsabilidades_cliente', localCondicoes.responsabilidades_cliente || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestaurarTemplate('responsabilidades_cliente')}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar Padrão
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localCondicoes.responsabilidades_cliente || ''}
                  onChange={(e) => setLocalCondicoes({ ...localCondicoes, responsabilidades_cliente: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comerciais" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Condições Comerciais</CardTitle>
                    <CardDescription>
                      Termos de pagamento e condições gerais
                    </CardDescription>
                  </div>
                  {!isTemplatePadrao('condicoes_comerciais', localCondicoes.condicoes_comerciais || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestaurarTemplate('condicoes_comerciais')}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar Padrão
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localCondicoes.condicoes_comerciais || ''}
                  onChange={(e) => setLocalCondicoes({ ...localCondicoes, condicoes_comerciais: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gerais" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Condições Gerais</CardTitle>
                    <CardDescription>
                      Termos e condições gerais do contrato
                    </CardDescription>
                  </div>
                  {!isTemplatePadrao('condicoes_gerais', localCondicoes.condicoes_gerais || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestaurarTemplate('condicoes_gerais')}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar Padrão
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localCondicoes.condicoes_gerais || ''}
                  onChange={(e) => setLocalCondicoes({ ...localCondicoes, condicoes_gerais: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistica" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Logística</CardTitle>
                    <CardDescription>
                      Detalhes sobre transporte, montagem e desmontagem
                    </CardDescription>
                  </div>
                  {!isTemplatePadrao('logistica', localCondicoes.logistica || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestaurarTemplate('logistica')}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar Padrão
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localCondicoes.logistica || ''}
                  onChange={(e) => setLocalCondicoes({ ...localCondicoes, logistica: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="garantias" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Garantias</CardTitle>
                    <CardDescription>
                      Garantias oferecidas pela locadora
                    </CardDescription>
                  </div>
                  {!isTemplatePadrao('garantias', localCondicoes.garantias || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestaurarTemplate('garantias')}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar Padrão
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localCondicoes.garantias || ''}
                  onChange={(e) => setLocalCondicoes({ ...localCondicoes, garantias: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Condições
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

