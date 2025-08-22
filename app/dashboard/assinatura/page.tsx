"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSignature, Plus, Search, Edit, Upload, Download, CheckCircle, Clock, AlertCircle } from "lucide-react"

// Dados simulados de documentos para assinatura
const documentosData = [
  {
    id: "DOC001",
    nome: "Contrato de Prestação de Serviços - Cliente ABC",
    tipo: "Contrato",
    status: "Pendente",
    solicitante: "Pedro Lima",
    destinatario: "Construtora ABC Ltda",
    dataEnvio: "2024-01-20",
    prazoAssinatura: "2024-01-27",
    observacoes: "Contrato para serviços de grua na obra Centro-SP",
  },
  {
    id: "DOC002",
    nome: "Termo de Responsabilidade - Operador João",
    tipo: "Termo",
    status: "Assinado",
    solicitante: "Ana Costa",
    destinatario: "João Silva",
    dataEnvio: "2024-01-18",
    dataAssinatura: "2024-01-19",
    observacoes: "Termo de responsabilidade para operação de grua GRU003",
  },
  {
    id: "DOC003",
    nome: "Acordo de Manutenção - Fornecedor XYZ",
    tipo: "Acordo",
    status: "Expirado",
    solicitante: "Carlos Oliveira",
    destinatario: "Oficina Especializada",
    dataEnvio: "2024-01-10",
    prazoAssinatura: "2024-01-17",
    observacoes: "Acordo para manutenção preventiva das gruas",
  },
  {
    id: "DOC004",
    nome: "Procuração - Representação Legal",
    tipo: "Procuração",
    status: "Em Análise",
    solicitante: "Pedro Lima",
    destinatario: "Escritório de Advocacia",
    dataEnvio: "2024-01-22",
    prazoAssinatura: "2024-01-29",
    observacoes: "Procuração para representação em questões contratuais",
  },
]

export default function AssinaturaPage() {
  const [documentos, setDocumentos] = useState(documentosData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)

  // Formulário para novo documento
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    destinatario: "",
    prazoAssinatura: "",
    observacoes: "",
  })

  const filteredDocumentos = documentos.filter(
    (doc) =>
      doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.destinatario.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Assinado":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Assinado
          </Badge>
        )
      case "Pendente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      case "Em Análise":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Em Análise
          </Badge>
        )
      case "Expirado":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDoc) {
      setDocumentos(
        documentos.map((doc) =>
          doc.id === editingDoc.id
            ? {
                ...doc,
                ...formData,
                solicitante: "Pedro Lima", // Simulado
              }
            : doc,
        ),
      )
    } else {
      const newDoc = {
        ...formData,
        id: `DOC${String(documentos.length + 1).padStart(3, "0")}`,
        status: "Pendente",
        solicitante: "Pedro Lima", // Simulado
        dataEnvio: new Date().toISOString().split("T")[0],
      }
      setDocumentos([...documentos, newDoc])
    }

    setFormData({
      nome: "",
      tipo: "",
      destinatario: "",
      prazoAssinatura: "",
      observacoes: "",
    })
    setEditingDoc(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (documento: any) => {
    setEditingDoc(documento)
    setFormData({
      nome: documento.nome,
      tipo: documento.tipo,
      destinatario: documento.destinatario,
      prazoAssinatura: documento.prazoAssinatura || "",
      observacoes: documento.observacoes,
    })
    setIsDialogOpen(true)
  }

  const enviarDocumento = (docId: string) => {
    alert(`Documento ${docId} enviado para assinatura digital!`)
  }

  const stats = [
    {
      title: "Total de Documentos",
      value: documentos.length,
      icon: FileSignature,
      color: "bg-blue-500",
    },
    {
      title: "Pendentes",
      value: documentos.filter((d) => d.status === "Pendente").length,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Assinados",
      value: documentos.filter((d) => d.status === "Assinado").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Expirados",
      value: documentos.filter((d) => d.status === "Expirado").length,
      icon: AlertCircle,
      color: "bg-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assinatura Digital</h1>
          <p className="text-gray-600">Gestão de documentos e assinaturas eletrônicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDoc ? "Editar Documento" : "Novo Documento para Assinatura"}</DialogTitle>
              <DialogDescription>
                {editingDoc
                  ? "Atualize as informações do documento"
                  : "Cadastre um novo documento para assinatura digital"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Documento</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Contrato de Prestação de Serviços"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Documento</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contrato">Contrato</SelectItem>
                      <SelectItem value="Termo">Termo</SelectItem>
                      <SelectItem value="Acordo">Acordo</SelectItem>
                      <SelectItem value="Procuração">Procuração</SelectItem>
                      <SelectItem value="Declaração">Declaração</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazoAssinatura">Prazo para Assinatura</Label>
                  <Input
                    id="prazoAssinatura"
                    type="date"
                    value={formData.prazoAssinatura}
                    onChange={(e) => setFormData({ ...formData, prazoAssinatura: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatario">Destinatário</Label>
                <Input
                  id="destinatario"
                  value={formData.destinatario}
                  onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                  placeholder="Nome ou empresa do destinatário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o documento..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingDoc ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="documentos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
        </TabsList>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos para Assinatura</CardTitle>
              <CardDescription>Gerencie todos os documentos que precisam de assinatura digital</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, tipo ou destinatário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Data Envio</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocumentos.map((documento) => (
                      <TableRow key={documento.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{documento.nome}</p>
                            <p className="text-sm text-gray-500">{documento.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{documento.tipo}</Badge>
                        </TableCell>
                        <TableCell>{documento.destinatario}</TableCell>
                        <TableCell>{new Date(documento.dataEnvio).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          {documento.prazoAssinatura
                            ? new Date(documento.prazoAssinatura).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(documento.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(documento)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {documento.status === "Pendente" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => enviarDocumento(documento.id)}
                                className="text-blue-600"
                              >
                                <FileSignature className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Documento</CardTitle>
              <CardDescription>Faça upload de documentos para assinatura digital</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Arraste e solte seus arquivos aqui</p>
                  <p className="text-sm text-gray-500 mb-4">ou clique para selecionar arquivos</p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Arquivos
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">Formatos aceitos: PDF, DOC, DOCX (máx. 10MB)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configurações de Assinatura</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo de Assinatura</Label>
                        <Select defaultValue="digital">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="digital">Assinatura Digital</SelectItem>
                            <SelectItem value="eletronica">Assinatura Eletrônica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ordem de Assinatura</Label>
                        <Select defaultValue="sequencial">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sequencial">Sequencial</SelectItem>
                            <SelectItem value="paralela">Paralela</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notificações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notificar por e-mail</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Lembrete automático</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notificar conclusão</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
