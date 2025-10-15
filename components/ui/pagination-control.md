# PaginationControl Component

Um componente reutilizável para controle de paginação baseado no design system do projeto.

## Características

- ✅ **Navegação completa**: Primeira, anterior, próxima, última página
- ✅ **Páginas numeradas**: Botões com lógica inteligente de exibição
- ✅ **Seletor de itens por página**: Dropdown configurável
- ✅ **Informações de paginação**: "Mostrando X a Y de Z itens"
- ✅ **Responsivo**: Adapta-se a diferentes tamanhos de tela
- ✅ **Acessibilidade**: Navegação por teclado e screen readers

## Props

```typescript
interface PaginationControlProps {
  currentPage: number                    // Página atual
  totalPages: number                     // Total de páginas
  totalItems: number                     // Total de itens
  itemsPerPage: number                   // Itens por página
  onPageChange: (page: number) => void   // Callback para mudança de página
  onItemsPerPageChange: (itemsPerPage: number) => void // Callback para mudança de itens por página
  itemsPerPageOptions?: number[]        // Opções de itens por página (padrão: [9, 15, 30, 50])
  className?: string                     // Classes CSS adicionais
}
```

## Exemplo de Uso

```tsx
import { PaginationControl } from "@/components/ui/pagination-control"

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [totalItems] = useState(100)
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset para primeira página
  }

  return (
    <PaginationControl
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      onItemsPerPageChange={handleItemsPerPageChange}
      itemsPerPageOptions={[9, 15, 30, 50]}
    />
  )
}
```

## Funcionalidades

### 1. Navegação de Páginas
- **Primeira página**: Botão com ícone `ChevronsLeft`
- **Página anterior**: Botão com ícone `ChevronLeft`
- **Páginas numeradas**: Botões com números (máximo 5 visíveis)
- **Próxima página**: Botão com ícone `ChevronRight`
- **Última página**: Botão com ícone `ChevronsRight`

### 2. Lógica de Exibição de Páginas
```typescript
// Se total de páginas <= 5: mostrar todas
// Se página atual <= 3: mostrar 1-5
// Se página atual >= totalPages - 2: mostrar últimas 5
// Caso contrário: mostrar 2 antes e 2 depois da atual
```

### 3. Seletor de Itens por Página
- Dropdown com opções configuráveis
- Padrão: [9, 15, 30, 50]
- Reset automático para página 1 ao alterar

### 4. Informações de Paginação
- Formato: "Mostrando X a Y de Z itens"
- Cálculo automático de índices
- Atualização em tempo real

### 5. Responsividade
- **Desktop**: Navegação completa com páginas numeradas
- **Mobile**: Indicador simples "Página X de Y"
- **Tablet**: Adaptação automática baseada no tamanho da tela

## Estilos

O componente usa as classes do design system:
- `Card` e `CardContent` para o container
- `Button` com variantes `outline` e `default`
- `Select` para o seletor de itens por página
- Classes responsivas com `sm:` prefix

## Acessibilidade

- Navegação por teclado (Tab, Enter, Space)
- Atributos ARIA para screen readers
- Estados visuais para botões desabilitados
- Foco visível em todos os elementos interativos

## Casos de Uso

1. **Listas de dados**: Tabelas, grids, cards
2. **Relatórios**: Dados paginados com filtros
3. **Catálogos**: Produtos, serviços, itens
4. **Administração**: Usuários, configurações, logs

## Integração

O componente pode ser facilmente integrado em qualquer página que precise de paginação:

```tsx
// Em uma página de dashboard
{!loading && !error && totalPages > 1 && (
  <PaginationControl
    currentPage={currentPage}
    totalPages={totalPages}
    totalItems={totalItems}
    itemsPerPage={itemsPerPage}
    onPageChange={setCurrentPage}
    onItemsPerPageChange={handleItemsPerPageChange}
  />
)}
```
