"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { mockUsers } from './mock-data'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'engenheiro' | 'chefe_obras' | 'funcionario' | 'diretor' | 'cliente'
  obraId?: string
  obraName?: string
  status: 'ativo' | 'inativo'
  createdAt: string
  lastLogin?: string
}

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  login: (email: string, password: string) => boolean
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  // Inicializar com admin por padrão para demonstração
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]) // João Silva (admin)

  const login = (email: string, password: string): boolean => {
    const user = mockUsers.find(u => u.email === email && u.status === 'ativo')
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
