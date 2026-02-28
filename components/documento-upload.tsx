"use client"

import { useState, useRef, useEffect, useId } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, FileText, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentoUploadProps {
  accept?: string
  maxSize?: number // em bytes
  onUpload: (file: File) => void
  onRemove?: () => void
  preview?: boolean
  label?: string
  required?: boolean
  currentFile?: File | null
  fileUrl?: string | null
  disabled?: boolean
}

export function DocumentoUpload({
  accept = "application/pdf,image/*",
  maxSize = 5 * 1024 * 1024, // 5MB padrão
  onUpload,
  onRemove,
  preview = true,
  label = "Upload de Documento",
  required = false,
  currentFile = null,
  fileUrl = null,
  disabled = false
}: DocumentoUploadProps) {
  const [file, setFile] = useState<File | null>(currentFile || null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(fileUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const { toast } = useToast()

  // Sincroniza estado interno quando o arquivo é definido externamente
  // (ex.: auto-preencher da tela de Nova Obra).
  useEffect(() => {
    setFile(currentFile || null)
  }, [currentFile])

  // Sincroniza URL de preview externa quando aplicável.
  useEffect(() => {
    setPreviewUrl(fileUrl || null)
  }, [fileUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validação de tipo
    const acceptedTypes = accept.split(',').map(t => t.trim())
    const fileType = selectedFile.type
    const isValidType = acceptedTypes.some(type => {
      if (type === 'image/*') return fileType.startsWith('image/')
      if (type === 'application/pdf') return fileType === 'application/pdf'
      return fileType === type
    })

    if (!isValidType) {
      setError(`Tipo de arquivo não permitido. Aceitos: ${accept}`)
      toast({
        title: "Erro",
        description: `Tipo de arquivo não permitido`,
        variant: "destructive"
      })
      return
    }

    // Validação de tamanho
    if (selectedFile.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
      setError(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`)
      toast({
        title: "Erro",
        description: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
        variant: "destructive"
      })
      return
    }

    setError(null)
    setFile(selectedFile)

    // Criar preview
    if (preview && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else if (selectedFile.type === 'application/pdf') {
      setPreviewUrl(null) // PDF não tem preview de imagem
    }

    onUpload(selectedFile)
  }

  const handleRemove = () => {
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove?.()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {!file && !previewUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={inputId}
            disabled={disabled}
          />
          <Label
            htmlFor={inputId}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              Clique para fazer upload ou arraste o arquivo aqui
            </span>
            <span className="text-xs text-gray-500">
              {accept} (máx. {formatFileSize(maxSize)})
            </span>
          </Label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {(file || previewUrl) && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {previewUrl && file?.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-sm">{file?.name || 'Documento'}</p>
                <p className="text-xs text-gray-500">
                  {file ? formatFileSize(file.size) : 'Carregado'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {file && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

