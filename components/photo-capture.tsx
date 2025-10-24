"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  Camera, 
  X, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PhotoCaptureProps {
  isOpen: boolean
  onClose: () => void
  onPhotoTaken: (photoData: string) => void
  title?: string
  description?: string
}

export function PhotoCapture({ 
  isOpen, 
  onClose, 
  onPhotoTaken, 
  title = "Capturar Foto",
  description = "Tire uma foto para confirmar sua presença"
}: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const { toast } = useToast()

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true)
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
      toast({
        title: "Erro de Câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive"
      })
    } finally {
      setIsCapturing(false)
    }
  }, [facingMode, toast])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Configurar canvas com as dimensões do vídeo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Converter para base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedPhoto(photoData)
    
    // Parar a câmera
    stopCamera()
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null)
    startCamera()
  }, [startCamera])

  const confirmPhoto = useCallback(() => {
    if (capturedPhoto) {
      onPhotoTaken(capturedPhoto)
      onClose()
    }
  }, [capturedPhoto, onPhotoTaken, onClose])

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    if (streamRef.current) {
      stopCamera()
      startCamera()
    }
  }, [stopCamera, startCamera])

  const handleClose = useCallback(() => {
    stopCamera()
    setCapturedPhoto(null)
    setError(null)
    onClose()
  }, [stopCamera, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-medium">Erro ao acessar câmera</p>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <Button 
                  onClick={startCamera} 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : capturedPhoto ? (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={capturedPhoto} 
                  alt="Foto capturada" 
                  className="w-full h-64 object-cover rounded-lg border"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={retakePhoto} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tirar Novamente
                </Button>
                <Button 
                  onClick={confirmPhoto} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Foto
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                {isCapturing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={startCamera} 
                  disabled={isCapturing}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isCapturing ? "Iniciando..." : "Iniciar Câmera"}
                </Button>
                <Button 
                  onClick={switchCamera} 
                  variant="outline"
                  disabled={isCapturing}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas oculto para captura */}
        <canvas 
          ref={canvasRef} 
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
}
