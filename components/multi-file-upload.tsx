'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, File, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MultiFileUploadProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  showPreview?: boolean
  className?: string
}

export function MultiFileUpload({
  onUpload,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = ['image/*', 'application/pdf'],
  showPreview = true,
  className = ''
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    // Validar número de arquivos
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxFiles} arquivos permitidos`,
        variant: "destructive"
      })
      return
    }

    // Validar tamanho
    const oversizedFiles = selectedFiles.filter(
      file => file.size > maxSizeMB * 1024 * 1024
    )
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: `Tamanho máximo: ${maxSizeMB}MB`,
        variant: "destructive"
      })
      return
    }

    // Gerar previews
    const newPreviews = await Promise.all(
      selectedFiles.map(file => {
        return new Promise<string>((resolve) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          } else {
            resolve('')
          }
        })
      })
    )

    setFiles([...files, ...selectedFiles])
    setPreviews([...previews, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    onUpload(files)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600">
            Clique para selecionar ou arraste arquivos aqui
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Máximo {maxFiles} arquivos de até {maxSizeMB}MB cada
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{files.length} arquivo(s) selecionado(s)</p>
          <div className="grid grid-cols-2 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative border rounded-lg p-4">
                {previews[index] ? (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded mb-2">
                    <File className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={handleUpload} className="w-full">
            Fazer Upload
          </Button>
        </div>
      )}
    </div>
  )
}
