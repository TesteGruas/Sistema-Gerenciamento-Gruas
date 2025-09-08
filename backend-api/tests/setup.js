// Configuração global para os testes

// Configurar timeout para testes
jest.setTimeout(10000)

// Mock global do console para evitar logs durante os testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Configurações de ambiente para testes
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
