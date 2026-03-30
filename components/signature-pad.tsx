"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCcw, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void
  onCancel: () => void
  title?: string
  description?: string
  /** PWA / telas estreitas: sem Card extra, botões em coluna, área de desenho maior */
  compact?: boolean
  className?: string
  /** Texto do botão que aplica a assinatura ao estado pai (ex.: diferente do CTA final “Enviar”) */
  applyLabel?: string
}

export function SignaturePad({
  onSave,
  onCancel,
  title,
  description,
  compact = false,
  className,
  applyLabel
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  /** iOS: distinguir rolagem vertical de traço no canvas (touch-none bloqueava o scroll da página) */
  const touchModeRef = useRef<"undecided" | "scroll" | "draw">("undecided")
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

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
      canvas.height = compact ? 220 : 200

      // Configurar estilo de desenho
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = compact ? 2.5 : 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [compact])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const blockScrollWhileDrawing = (e: TouchEvent) => {
      if (touchModeRef.current === "draw") e.preventDefault()
    }

    canvas.addEventListener("touchmove", blockScrollWhileDrawing, { passive: false })
    return () => canvas.removeEventListener("touchmove", blockScrollWhileDrawing)
  }, [])

  const beginStrokeAt = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ("touches" in e) {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      touchModeRef.current = "undecided"
      touchStartRef.current = { x: t.clientX, y: t.clientY }
      return
    }
    beginStrokeAt(e)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if ("touches" in e) {
      if (e.touches.length !== 1 || !touchStartRef.current) return

      const t = e.touches[0]
      const dx = t.clientX - touchStartRef.current.x
      const dy = t.clientY - touchStartRef.current.y
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)

      if (touchModeRef.current === "undecided") {
        if (ay > 14 && ay > ax * 1.25) {
          touchModeRef.current = "scroll"
          touchStartRef.current = null
          setIsDrawing(false)
          return
        }
        if (ax > 5 || ay > 5) {
          touchModeRef.current = "draw"
          beginStrokeAt(e)
        }
        return
      }

      if (touchModeRef.current === "scroll") return
    } else if (!isDrawing) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    touchModeRef.current = "undecided"
    touchStartRef.current = null
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

  const canvasH = compact ? 220 : 200
  const applyText = applyLabel || "Confirmar Assinatura"

  const inner = (
    <>
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      {description && <p className="text-sm text-gray-600">{description}</p>}

      <div className="relative rounded-xl overflow-hidden bg-white ring-1 ring-gray-200">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={cn(
            "w-full cursor-crosshair bg-white",
            compact
              ? "border-0 rounded-xl"
              : "border-2 border-dashed border-gray-300 rounded-lg"
          )}
          style={{ height: `${canvasH}px` }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm font-medium">Assine aqui</p>
          </div>
        )}
      </div>

      {compact ? (
        <div className="flex flex-col gap-2.5 pt-1">
          <Button
            type="button"
            className="w-full h-11 text-base font-semibold bg-green-600 hover:bg-green-700"
            onClick={saveSignature}
            disabled={!hasSignature}
          >
            <Check className="w-5 h-5 mr-2 shrink-0" />
            {applyText}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={clearSignature}
              disabled={!hasSignature}
            >
              <RotateCcw className="w-4 h-4 mr-1.5 shrink-0" />
              Limpar
            </Button>
            <Button type="button" variant="outline" className="h-10" onClick={onCancel}>
              <X className="w-4 h-4 mr-1.5 shrink-0" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={clearSignature} disabled={!hasSignature}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
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
            {applyText}
          </Button>
        </div>
      )}
    </>
  )

  if (compact) {
    return <div className={cn("space-y-3", className)}>{inner}</div>
  }

  return <Card className={cn("p-6 space-y-4", className)}>{inner}</Card>
}

