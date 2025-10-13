import { 
  listar, 
  listarNaoLidas, 
  contarNaoLidas, 
  marcarComoLida, 
  marcarTodasComoLidas, 
  deletar, 
  deletarTodas, 
  criar 
} from '@/lib/api-notificacoes'

// Mock da API
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

describe('API Notificações', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listar', () => {
    it('should return notifications list', async () => {
      const mockApi = require('@/lib/api')
      const mockData = [
        { id: 1, titulo: 'Notificação 1', lida: false },
        { id: 2, titulo: 'Notificação 2', lida: true },
      ]
      
      mockApi.get.mockResolvedValue({ data: mockData })

      const result = await listar()

      expect(mockApi.get).toHaveBeenCalledWith('/api/notificacoes', { params: undefined })
      expect(result).toEqual(mockData)
    })

    it('should use mock data when API fails', async () => {
      const mockApi = require('@/lib/api')
      mockApi.get.mockRejectedValue(new Error('API Error'))

      const result = await listar()

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ titulo: 'Nova obra cadastrada' })
      ]))
    })
  })

  describe('listarNaoLidas', () => {
    it('should return unread notifications', async () => {
      const mockApi = require('@/lib/api')
      const mockData = [
        { id: 1, titulo: 'Notificação 1', lida: false },
      ]
      
      mockApi.get.mockResolvedValue({ data: mockData })

      const result = await listarNaoLidas()

      expect(mockApi.get).toHaveBeenCalledWith('/api/notificacoes/nao-lidas')
      expect(result).toEqual(mockData)
    })
  })

  describe('contarNaoLidas', () => {
    it('should return count of unread notifications', async () => {
      const mockApi = require('@/lib/api')
      mockApi.get.mockResolvedValue({ data: { count: 5 } })

      const result = await contarNaoLidas()

      expect(mockApi.get).toHaveBeenCalledWith('/api/notificacoes/contar-nao-lidas')
      expect(result).toBe(5)
    })
  })

  describe('marcarComoLida', () => {
    it('should mark notification as read', async () => {
      const mockApi = require('@/lib/api')
      const mockData = { id: 1, titulo: 'Notificação', lida: true }
      
      mockApi.put.mockResolvedValue({ data: mockData })

      const result = await marcarComoLida(1)

      expect(mockApi.put).toHaveBeenCalledWith('/api/notificacoes/1/marcar-lida')
      expect(result).toEqual(mockData)
    })
  })

  describe('marcarTodasComoLidas', () => {
    it('should mark all notifications as read', async () => {
      const mockApi = require('@/lib/api')
      mockApi.put.mockResolvedValue({ data: { success: true } })

      const result = await marcarTodasComoLidas()

      expect(mockApi.put).toHaveBeenCalledWith('/api/notificacoes/marcar-todas-lidas')
      expect(result).toEqual({ success: true })
    })
  })

  describe('deletar', () => {
    it('should delete notification', async () => {
      const mockApi = require('@/lib/api')
      mockApi.delete.mockResolvedValue({ data: { success: true } })

      const result = await deletar(1)

      expect(mockApi.delete).toHaveBeenCalledWith('/api/notificacoes/1')
      expect(result).toEqual({ success: true })
    })
  })

  describe('deletarTodas', () => {
    it('should delete all notifications', async () => {
      const mockApi = require('@/lib/api')
      mockApi.delete.mockResolvedValue({ data: { success: true } })

      const result = await deletarTodas()

      expect(mockApi.delete).toHaveBeenCalledWith('/api/notificacoes')
      expect(result).toEqual({ success: true })
    })
  })

  describe('criar', () => {
    it('should create new notification', async () => {
      const mockApi = require('@/lib/api')
      const notificationData = {
        titulo: 'Nova notificação',
        mensagem: 'Mensagem da notificação',
        tipo: 'info'
      }
      const mockData = { id: 1, ...notificationData }
      
      mockApi.post.mockResolvedValue({ data: mockData })

      const result = await criar(notificationData)

      expect(mockApi.post).toHaveBeenCalledWith('/api/notificacoes', notificationData)
      expect(result).toEqual(mockData)
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockApi = require('@/lib/api')
      mockApi.get.mockRejectedValue(new Error('Network error'))

      // Should not throw error, should use mock data instead
      const result = await listar()
      
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
