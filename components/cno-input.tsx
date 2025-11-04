"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface CnoInputProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
}

export function CnoInput({
  value = "",
  onChange,
  label = "CNO da Obra",
  required = false,
  error,
  disabled = false
}: CnoInputProps) {
  const [localValue, setLocalValue] = useState(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Apenas números
    const numericValue = e.target.value.replace(/\D/g, '')
    setLocalValue(numericValue)
    onChange?.(numericValue)
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Digite apenas números"
        disabled={disabled}
        maxLength={20}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

