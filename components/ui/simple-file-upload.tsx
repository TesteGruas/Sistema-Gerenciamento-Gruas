"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Plus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SimpleFileUploadProps {
  obraId: string
  onFilesChange?: (files: any[]) => void
  maxFiles?: number
  maxSize?: number
  className?: string
}

interface UploadedFile {
  id: string
  nome_original: string
  tamanho: number
  tipo_arquivo: string
  categoria: string
  created_at: string
}

interface FileUploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function SimpleFileUpload({
  obraId,
  onFilesChange,
  maxFiles = 5,
  maxSize = 10,
  className = ''
}: SimpleFileUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [categoria, setCategoria] = useState('geral')

  const acceptedTypes = [
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
  ]

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
      // Usar a URL completa do backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const url = `${apiUrl}/api/arquivos/upload/${obraId}`
      const token = localStorage.getItem('token')
      
      console.log('🔍 DEBUG: Fazendo upload para:', url)
      console.log('🔍 DEBUG: Token disponível:', !!token)
      console.log('🔍 DEBUG: Arquivo:', file.name, 'Tamanho:', file.size)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('🔍 DEBUG: Resposta recebida:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ DEBUG: Erro na resposta:', errorData)
        throw new Error(errorData.message || 'Erro no upload')
      }

      const result = await response.json()
      console.log('✅ DEBUG: Upload bem-sucedido:', result)
      setUploadedFiles(prev => [result.data, ...prev])
      
      if (onFilesChange) {
        onFilesChange([result.data, ...uploadedFiles])
      }

    } catch (error) {
      console.error('❌ DEBUG: Erro no upload:', error)
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

    // Upload sequencial
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

  // Handler de seleção de arquivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 DEBUG: Arquivo selecionado:', e.target.files)
    if (e.target.files && e.target.files[0]) {
      console.log('🔍 DEBUG: Iniciando upload de', e.target.files.length, 'arquivo(s)')
      uploadFiles(e.target.files)
    } else {
      console.log('🔍 DEBUG: Nenhum arquivo selecionado')
    }
  }

  // Função para deletar arquivo
  const handleDeleteFile = async (fileId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/arquivos/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
        
        if (onFilesChange) {
          onFilesChange(uploadedFiles.filter(file => file.id !== fileId))
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/arquivos/download/${file.id}`, {
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
      {/* Controles de Upload */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label htmlFor="categoria">Categoria dos arquivos</Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="geral">Geral</option>
              <option value="contratos">Contratos</option>
              <option value="projetos">Projetos</option>
              <option value="fotos">Fotos</option>
              <option value="documentos">Documentos</option>
              <option value="certificados">Certificados</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Arquivos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
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
      </div>

      {/* Lista de Arquivos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Arquivos anexados ({uploadedFiles.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.tipo_arquivo)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.nome_original}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.tamanho)}</span>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {file.categoria}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadFile(file)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações */}
      <div className="text-xs text-gray-500">
        <p>Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF</p>
        <p>Tamanho máximo: {maxSize}MB por arquivo • Máximo: {maxFiles} arquivos</p>
      </div>
    </div>
  )
}
