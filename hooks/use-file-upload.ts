import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

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

interface UseFileUploadOptions {
  obraId: string
  maxFiles?: number
  maxSize?: number // em MB
  acceptedTypes?: string[]
}

export function useFileUpload({
  obraId,
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
  ]
}: UseFileUploadOptions) {
  const { toast } = useToast()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Carregar arquivos existentes
  const loadFiles = useCallback(async () => {
    if (!obraId) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/arquivos/obra/${obraId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.data || [])
      } else {
        throw new Error('Erro ao carregar arquivos')
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os arquivos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [obraId, toast])

  // Upload de arquivo único
  const uploadFile = useCallback(async (file: File, categoria: string = 'geral', descricao?: string) => {
    if (!obraId) return

    const formData = new FormData()
    formData.append('arquivo', file)
    formData.append('categoria', categoria)
    if (descricao) formData.append('descricao', descricao)

    try {
      setUploading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/arquivos/upload/${obraId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro no upload')
      }

      const result = await response.json()
      setFiles(prev => [result.data, ...prev])
      
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso"
      })

      return result.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    } finally {
      setUploading(false)
    }
  }, [obraId, toast])

  // Upload múltiplo
  const uploadFiles = useCallback(async (files: File[], categoria: string = 'geral') => {
    if (!obraId || files.length === 0) return

    const formData = new FormData()
    files.forEach(file => {
      formData.append('arquivos', file)
    })
    formData.append('categoria', categoria)

    try {
      setUploading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/arquivos/upload-multiple/${obraId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro no upload')
      }

      const result = await response.json()
      
      if (result.data.sucessos.length > 0) {
        setFiles(prev => [...result.data.sucessos, ...prev])
      }

      if (result.data.erros.length > 0) {
        toast({
          title: "Alguns arquivos falharam",
          description: `${result.data.erros.length} arquivo(s) não puderam ser enviados`,
          variant: "destructive"
        })
      }

      if (result.data.sucessos.length > 0) {
        toast({
          title: "Upload concluído",
          description: `${result.data.sucessos.length} arquivo(s) enviado(s) com sucesso`
        })
      }

      return result.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive"
      })
      throw error
    } finally {
      setUploading(false)
    }
  }, [obraId, toast])

  // Deletar arquivo
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/arquivos/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId))
        toast({
          title: "Arquivo removido",
          description: "Arquivo deletado com sucesso"
        })
        return true
      } else {
        throw new Error('Erro ao deletar arquivo')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o arquivo",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  // Download de arquivo
  const downloadFile = useCallback(async (file: UploadedFile) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/arquivos/download/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.data.url, '_blank')
        return true
      } else {
        throw new Error('Erro ao gerar link de download')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  // Atualizar metadados do arquivo
  const updateFile = useCallback(async (fileId: string, updates: { descricao?: string; categoria?: string }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/arquivos/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const result = await response.json()
        setFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, ...result.data } : file
        ))
        toast({
          title: "Arquivo atualizado",
          description: "Metadados do arquivo atualizados com sucesso"
        })
        return result.data
      } else {
        throw new Error('Erro ao atualizar arquivo')
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o arquivo",
        variant: "destructive"
      })
      throw error
    }
  }, [toast])

  // Validar arquivo
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo permitido: ${maxSize}MB`
    }
    
    if (!acceptedTypes.includes(file.type)) {
      return 'Tipo de arquivo não permitido'
    }
    
    return null
  }, [maxSize, acceptedTypes])

  // Formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Obter ícone do arquivo
  const getFileIcon = useCallback((tipo: string) => {
    switch (tipo) {
      case 'imagem':
        return '🖼️'
      case 'pdf':
        return '📄'
      case 'documento':
        return '📝'
      case 'planilha':
        return '📊'
      default:
        return '📁'
    }
  }, [])

  return {
    files,
    loading,
    uploading,
    loadFiles,
    uploadFile,
    uploadFiles,
    deleteFile,
    downloadFile,
    updateFile,
    validateFile,
    formatFileSize,
    getFileIcon
  }
}
