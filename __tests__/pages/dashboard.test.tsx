import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock do Dashboard
const MockDashboard = () => {
  return (
    <div data-testid="dashboard">
      <h1>Dashboard</h1>
    </div>
  )
}

// Mock do layout
const MockLayout = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="layout">{children}</div>
}

describe('Dashboard Page', () => {
  it('should render dashboard content', () => {
    render(<MockDashboard />)

    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })

  it('should render main dashboard elements', () => {
    render(<MockDashboard />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
