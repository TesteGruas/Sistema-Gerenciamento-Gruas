"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCcw, Check, X } from "lucide-react"

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  onCancel: () => void
  title?: string
  description?: string
}

export function SignaturePad({ onSave, onCancel, title, description }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar canvas para responsividade
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = 200

      // Configurar estilo de desenho
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    setHasSignature(true)

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const dataUrl = canvas.toDataURL("image/png")
    onSave(dataUrl)
  }

  return (
    <Card className="p-6 space-y-4">
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      {description && <p className="text-sm text-gray-600">{description}</p>}

      {/* Canvas de Assinatura */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white touch-none cursor-crosshair"
          style={{ height: "200px" }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Assine aqui</p>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={saveSignature}
          disabled={!hasSignature}
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirmar Assinatura
        </Button>
      </div>
    </Card>
  )
}

