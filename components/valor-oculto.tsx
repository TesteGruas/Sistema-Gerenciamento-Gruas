"use client"

import { usePermissions } from "@/hooks/use-permissions"
import { Shield } from "lucide-react"
import { useMemo } from "react"

interface ValorOcultoProps {
  valor: string | number
  className?: string
  children?: React.ReactNode
}

/**
 * Componente que oculta valores monetários para Clientes
 * Mostra uma tarja com ícone de bloqueio quando o usuário é Cliente
 */
export function ValorOculto({ valor, className = "", children }: ValorOcultoProps) {
  const { isClient } = usePermissions()
  
  if (isClient()) {
    return (
      <span className={`relative inline-flex items-center gap-1 ${className}`}>
        <span className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-gray-600 text-xs font-medium">
          <Shield className="w-3 h-3" />
          <span>Restrito</span>
        </span>
        {children}
      </span>
    )
  }
  
  return <span className={className}>{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</span>
}

/**
 * Componente para valores monetários formatados (R$)
 */
export function ValorMonetarioOculto({ valor, className = "", formatar = true }: { valor: number | string, className?: string, formatar?: boolean }) {
  const { isClient } = usePermissions()
  
  if (isClient()) {
    return (
      <span className={`relative inline-flex items-center gap-1 ${className}`}>
        <span className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-gray-600 text-xs font-medium">
          <Shield className="w-3 h-3" />
          <span>Restrito</span>
        </span>
      </span>
    )
  }
  
  if (!formatar) {
    return <span className={className}>{valor}</span>
  }
  
  // Se for string, tentar converter para número
  let valorNumerico: number
  if (typeof valor === 'string') {
    // Se já contém "R$", remover e limpar
    const valorLimpo = valor.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.')
    valorNumerico = parseFloat(valorLimpo) || 0
  } else {
    valorNumerico = valor
  }
  
  const valorFormatado = `R$ ${valorNumerico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  
  return <span className={className}>{valorFormatado}</span>
}

/**
 * Componente para valores formatados com função de formatação customizada
 */
export function ValorFormatadoOculto({ valor, formatar }: { valor: number | string, formatar: (v: number) => string }) {
  const { isClient } = usePermissions()
  
  if (isClient()) {
    return (
      <span className="relative inline-flex items-center gap-1">
        <span className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-gray-600 text-xs font-medium">
          <Shield className="w-3 h-3" />
          <span>Restrito</span>
        </span>
      </span>
    )
  }
  
  const valorFormatado = typeof valor === 'number' 
    ? formatar(valor)
    : valor
  
  return <span>{valorFormatado}</span>
}

