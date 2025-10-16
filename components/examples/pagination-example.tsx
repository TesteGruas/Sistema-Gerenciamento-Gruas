"use client"

import { useState } from "react"
import { PaginationControl } from "@/components/ui/pagination-control"

export function PaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [totalItems] = useState(33) // Exemplo: 33 itens total
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset para primeira página
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exemplo de Controle de Paginação</h2>
        <p className="text-gray-600">
          Componente reutilizável para paginação com navegação completa
        </p>
      </div>

      {/* Exemplo de uso básico */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Uso Básico</h3>
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {/* Exemplo com opções customizadas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Com Opções Customizadas</h3>
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[6, 12, 24, 48]}
        />
      </div>

      {/* Informações de debug */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Estado Atual:</h4>
        <ul className="text-sm space-y-1">
          <li>Página atual: {currentPage}</li>
          <li>Itens por página: {itemsPerPage}</li>
          <li>Total de itens: {totalItems}</li>
          <li>Total de páginas: {totalPages}</li>
          <li>Índice inicial: {((currentPage - 1) * itemsPerPage) + 1}</li>
          <li>Índice final: {Math.min(currentPage * itemsPerPage, totalItems)}</li>
        </ul>
      </div>
    </div>
  )
}
