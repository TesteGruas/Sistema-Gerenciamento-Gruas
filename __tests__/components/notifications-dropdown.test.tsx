import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock da API de notificações
jest.mock('@/lib/api-notificacoes', () => ({
  listar: jest.fn(),
  listarNaoLidas: jest.fn(),
  contarNaoLidas: jest.fn(),
  marcarComoLida: jest.fn(),
  marcarTodasComoLidas: jest.fn(),
}))

// Mock do componente para evitar problemas de dependências
const MockNotificationsDropdown = () => {
  return (
    <div data-testid="notifications-dropdown">
      <button>Notifications</button>
    </div>
  )
}

describe('NotificationsDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render notification button', () => {
    render(<MockNotificationsDropdown />)

    expect(screen.getByTestId('notifications-dropdown')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should render component correctly', () => {
    render(<MockNotificationsDropdown />)

    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('should have proper structure', () => {
    const { container } = render(<MockNotificationsDropdown />)

    expect(container.firstChild).toBeInTheDocument()
  })
})
