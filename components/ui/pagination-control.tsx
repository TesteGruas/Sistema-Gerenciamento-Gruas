"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react"

interface PaginationControlProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
  className?: string
}

export function PaginationControl({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [9, 15, 30, 50],
  className = ""
}: PaginationControlProps) {
  const startIndex = ((currentPage - 1) * itemsPerPage) + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  // Calcular páginas a serem exibidas
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Se total de páginas é menor ou igual a 5, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (currentPage <= 3) {
      // Se estamos nas primeiras páginas, mostrar 1-5
      for (let i = 1; i <= maxVisiblePages; i++) {
        pages.push(i)
      }
    } else if (currentPage >= totalPages - 2) {
      // Se estamos nas últimas páginas, mostrar as últimas 5
      for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Se estamos no meio, mostrar 2 páginas antes e 2 depois
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Informações da paginação */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
            <span>
              Mostrando {startIndex} a {endIndex} de {totalItems} itens
            </span>
            
            {/* Seletor de itens por página */}
            <div className="flex items-center gap-2">
              <span>Itens por página:</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => onItemsPerPageChange(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Controles de navegação */}
          <div className="flex items-center gap-2">
            {/* Primeira página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            
            {/* Página anterior */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Páginas numeradas */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
            
            {/* Indicador de página para mobile */}
            <div className="sm:hidden flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            
            {/* Próxima página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            {/* Última página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
