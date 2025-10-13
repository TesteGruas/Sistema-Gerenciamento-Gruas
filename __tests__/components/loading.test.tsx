import React from 'react'
import { render, screen } from '@testing-library/react'
import { Loading } from '@/components/ui/loading'

describe('Loading Component', () => {
  it('should render with default props', () => {
    const { container } = render(<Loading />)
    
    // Should render the component
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render with custom text', () => {
    render(<Loading text="Carregando dados..." />)
    
    expect(screen.getByText('Carregando dados...')).toBeInTheDocument()
  })

  it('should render with different sizes', () => {
    const { rerender, container } = render(<Loading size="sm" />)
    expect(container.firstChild).toBeInTheDocument()
    
    rerender(<Loading size="md" />)
    expect(container.firstChild).toBeInTheDocument()
    
    rerender(<Loading size="lg" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    const { container } = render(<Loading className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should render without text when no text prop', () => {
    render(<Loading />)
    
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
  })

  it('should render skeleton variant', () => {
    const { container } = render(<Loading variant="skeleton" />)
    
    // Skeleton variant should render skeleton elements
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render overlay variant', () => {
    render(<Loading variant="overlay" text="Carregando..." />)
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })
})
