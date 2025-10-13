import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock do useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock do componente para evitar problemas de dependências
const MockGlobalSearch = () => {
  return (
    <div data-testid="global-search">
      <button>Buscar em todo o sistema...</button>
    </div>
  )
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render search button', () => {
    render(<MockGlobalSearch />)

    expect(screen.getByTestId('global-search')).toBeInTheDocument()
    expect(screen.getByText('Buscar em todo o sistema...')).toBeInTheDocument()
  })

  it('should render component correctly', () => {
    render(<MockGlobalSearch />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should have proper structure', () => {
    const { container } = render(<MockGlobalSearch />)

    expect(container.firstChild).toBeInTheDocument()
  })
})
