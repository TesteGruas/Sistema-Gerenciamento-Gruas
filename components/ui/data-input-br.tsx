"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Aceita só dígitos e formata como dd/mm/aaaa durante a digitação. */
export function maskDigitosParaDataBR(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

function parseDataBR(s: string): Date | undefined {
  const t = s.trim()
  if (!t) return undefined
  const ref = new Date()
  const d = parse(t, "dd/MM/yyyy", ref, { locale: ptBR })
  return isValid(d) ? d : undefined
}

export type DataInputBrProps = {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  id?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  buttonClassName?: string
  placeholder?: string
  "aria-label"?: string
}

/**
 * Campo de data em dd/mm/aaaa com digitação manual + calendário (Popover).
 * Normalizado para uso nos relatórios e filtros.
 */
export function DataInputBr({
  value,
  onChange,
  id,
  disabled,
  className,
  inputClassName,
  buttonClassName,
  placeholder = "dd/mm/aaaa",
  "aria-label": ariaLabel = "Data (dd/mm/aaaa)",
}: DataInputBrProps) {
  const [text, setText] = React.useState(() =>
    value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : ""
  )
  const focusedRef = React.useRef(false)

  React.useEffect(() => {
    if (!focusedRef.current) {
      setText(value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : "")
    }
  }, [value])

  const commit = (s: string) => {
    const t = s.trim()
    if (!t) {
      onChange(undefined)
      setText("")
      return
    }
    const d = parseDataBR(t)
    if (d) {
      onChange(d)
      setText(format(d, "dd/MM/yyyy", { locale: ptBR }))
    } else {
      setText(value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : "")
    }
  }

  return (
    <div className={cn("flex gap-1 items-center w-full min-w-0", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "min-w-0 flex-1 font-mono tabular-nums",
          inputClassName
        )}
        value={text}
        onChange={(e) => setText(maskDigitosParaDataBR(e.target.value))}
        onFocus={() => {
          focusedRef.current = true
        }}
        onBlur={() => {
          focusedRef.current = false
          commit(text)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
        }}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className={cn("h-9 w-9 shrink-0", buttonClassName)}
            aria-label="Abrir calendário"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              if (d) {
                onChange(d)
                setText(format(d, "dd/MM/yyyy", { locale: ptBR }))
              }
            }}
            defaultMonth={value}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
