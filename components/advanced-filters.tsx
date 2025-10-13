'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Filter, ChevronDown, X } from 'lucide-react'

interface FilterOption {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

interface AdvancedFiltersProps {
  filters: FilterOption[]
  onApply: (filters: Record<string, any>) => void
  onClear: () => void
  className?: string
}

export function AdvancedFilters({ 
  filters, 
  onApply, 
  onClear, 
  className = '' 
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleApply = () => {
    onApply(filterValues)
    setIsOpen(false)
  }

  const handleClear = () => {
    setFilterValues({})
    onClear()
  }

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder || `Filtrar por ${filter.label.toLowerCase()}`}
            value={filterValues[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        )
      
      case 'select':
        return (
          <Select
            value={filterValues[filter.key] || ''}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecionar ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={filterValues[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Filtrar por ${filter.label.toLowerCase()}`}
            value={filterValues[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros Avançados
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map(filter => (
                <div key={filter.key}>
                  <Label htmlFor={filter.key}>{filter.label}</Label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClear}>
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
              <Button onClick={handleApply}>
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
