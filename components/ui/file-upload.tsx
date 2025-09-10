"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  X,
  Plus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FileUploadProps {
  obraId: string
  onUploadComplete?: (files: any[]) => void
  onFileDelete?: (fileId: string) => void
  maxFiles?: number
  maxSize?: number // em MB
  acceptedTypes?: string[]
  className?: string
}

interface UploadedFile {
  id: string
  nome_original: string
  nome_arquivo: string
  tamanho: number
  tipo_mime: string
  tipo_arquivo: string
  descricao?: string
  categoria: string
  created_at: string
  uploaded_by_user?: {
    nome: string
    email: string
  }
}

interface FileUploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function FileUpload({
  obraId,
  onUploadComplete,
  onFileDelete,
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain'
  ],
  className = ''
}: FileUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [categoria, setCategoria] = useState('geral')
  const [loading, setLoading] = useState(true)

  // Carregar arquivos existentes
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/arquivos/obra/${obraId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUploadedFiles(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    } finally {
      setLoading(false)
    }
  }, [obraId])

  // Carregar arquivos na inicialização
  React.useEffect(() => {
    if (obraId) {
      loadFiles()
    }
  }, [obraId, loadFiles])

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Função para obter ícone do arquivo
  const getFileIcon = (tipo: string) => {
    switch (tipo) {
      case 'imagem':
        return <Image className="h-4 w-4 text-blue-500" />
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'documento':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'planilha':
        return <FileText className="h-4 w-4 text-green-600" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  // Função para validar arquivo
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo permitido: ${maxSize}MB`
    }
    
    if (!acceptedTypes.includes(file.type)) {
      return 'Tipo de arquivo não permitido'
    }
    
    return null
  }

  // Função para fazer upload de um arquivo
  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('arquivo', file)
    formData.append('categoria', categoria)

    try {
      const response = await fetch(`/api/arquivos/upload/${obraId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro no upload')
      }

      const result = await response.json()
      setUploadedFiles(prev => [result.data, ...prev])
      
      if (onUploadComplete) {
        onUploadComplete([result.data])
      }

    } catch (error) {
      throw error
    }
  }

  // Função para fazer upload múltiplo
  const uploadFiles = async (files: FileList) => {
    const fileArray = Array.from(files)
    
    // Validar arquivos
    const validFiles: File[] = []
    const errors: string[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      toast({
        title: "Arquivos inválidos",
        description: errors.join('\n'),
        variant: "destructive"
      })
    }

    if (validFiles.length === 0) return

    setIsUploading(true)
    
    // Inicializar progresso
    const initialProgress: FileUploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))
    setUploadProgress(initialProgress)

    // Upload sequencial para melhor controle
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      
      try {
        await uploadFile(file)
        
        // Atualizar progresso como sucesso
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 100, status: 'success' as const } : item
        ))
        
      } catch (error) {
        // Atualizar progresso como erro
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            progress: 0, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          } : item
        ))
      }
    }

    // Limpar progresso após 3 segundos
    setTimeout(() => {
      setUploadProgress([])
      setIsUploading(false)
    }, 3000)
  }

  // Handlers de drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  // Handler de seleção de arquivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFiles(e.target.files)
    }
  }

  // Função para deletar arquivo
  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/arquivos/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
        
        if (onFileDelete) {
          onFileDelete(fileId)
        }

        toast({
          title: "Arquivo removido",
          description: "Arquivo deletado com sucesso"
        })
      } else {
        throw new Error('Erro ao deletar arquivo')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o arquivo",
        variant: "destructive"
      })
    }
  }

  // Função para download de arquivo
  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      const response = await fetch(`/api/arquivos/download/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.data.url, '_blank')
      } else {
        throw new Error('Erro ao gerar link de download')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive"
      })
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos
          </CardTitle>
          <CardDescription>
            Envie documentos, imagens e outros arquivos relacionados à obra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="geral">Geral</option>
              <option value="contratos">Contratos</option>
              <option value="projetos">Projetos</option>
              <option value="fotos">Fotos</option>
              <option value="documentos">Documentos</option>
              <option value="certificados">Certificados</option>
              <option value="manutenção">Manutenção</option>
            </select>
          </div>

          {/* Área de Drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Clique para selecionar arquivos ou arraste e solte aqui
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF (máx. {maxSize}MB por arquivo)
                </span>
              </Label>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Selecionar Arquivos
            </Button>
          </div>

          {/* Progresso de Upload */}
          {uploadProgress.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Enviando arquivos...</h4>
              {uploadProgress.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{item.file.name}</span>
                    <div className="flex items-center gap-2">
                      {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {item.status === 'uploading' && (
                        <span className="text-xs text-gray-500">{item.progress}%</span>
                      )}
                    </div>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  {item.error && (
                    <p className="text-xs text-red-600">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Arquivos Enviados ({uploadedFiles.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              disabled={loading}
            >
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando arquivos...</p>
            </div>
          ) : uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum arquivo enviado ainda</p>
              <p className="text-sm">Use a área de upload acima para enviar arquivos</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.tipo_arquivo)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.nome_original}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.tamanho)}</span>
                        <span>•</span>
                        <span>{new Date(file.created_at).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.categoria}
                        </Badge>
                      </div>
                      {file.descricao && (
                        <p className="text-xs text-gray-400 truncate">
                          {file.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
