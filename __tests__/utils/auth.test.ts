import { AuthService } from '@/app/lib/auth'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should store token and user data on successful login', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      }

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await AuthService.login('test@example.com', 'password')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'mock-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userRole', 'admin')
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error on failed login', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(AuthService.login('test@example.com', 'wrong-password'))
        .rejects.toThrow('Credenciais inválidas')
    })
  })

  describe('logout', () => {
    it('should clear stored data', () => {
      AuthService.logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userRole')
    })
  })

  describe('getToken', () => {
    it('should return stored token', () => {
      localStorageMock.getItem.mockReturnValue('mock-token')

      const token = AuthService.getToken()

      expect(token).toBe('mock-token')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token')
    })

    it('should return null when no token', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const token = AuthService.getToken()

      expect(token).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('mock-token')

      const isAuth = AuthService.isAuthenticated()

      expect(isAuth).toBe(true)
    })

    it('should return false when no token', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const isAuth = AuthService.isAuthenticated()

      expect(isAuth).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return mock user data', async () => {
      const user = await AuthService.getCurrentUser()

      expect(user).toEqual({
        id: 1,
        name: 'Usuário Demo',
        email: 'demo@sistema.com',
        role: 'admin',
        avatar: '/placeholder-user.jpg'
      })
    })
  })

  describe('removeToken', () => {
    it('should remove token from localStorage', () => {
      AuthService.removeToken()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
    })
  })
})
