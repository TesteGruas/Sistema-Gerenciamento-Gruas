/**
 * Helper para traduzir mensagens de erro técnicas em mensagens amigáveis para o usuário
 */

export interface ErrorResponse {
  error?: string
  message?: string
  description?: string
  details?: string
}

export interface UserFriendlyError {
  title: string
  description: string
  type: 'validation' | 'auth' | 'network' | 'server' | 'unknown'
}

/**
 * Traduz uma resposta de erro da API em uma mensagem amigável para o usuário
 */
export function translateError(error: any): UserFriendlyError {
  // Se já é um erro traduzido do backend
  if (error.message && error.description) {
    return {
      title: error.message,
      description: error.description,
      type: 'validation'
    }
  }

  // Se é uma resposta de erro da API
  if (error.error || error.message) {
    const errorMessage = error.error || error.message
    
    // Erros de validação (400)
    if (errorMessage.includes('email') && errorMessage.includes('válido')) {
      return {
        title: 'Email inválido',
        description: 'Por favor, insira um email válido no formato exemplo@dominio.com',
        type: 'validation'
      }
    }
    
    if (errorMessage.includes('senha') && errorMessage.includes('6 caracteres')) {
      return {
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres para maior segurança',
        type: 'validation'
      }
    }
    
    if (errorMessage.includes('obrigatório')) {
      return {
        title: 'Campo obrigatório',
        description: 'Todos os campos são obrigatórios para fazer login',
        type: 'validation'
      }
    }
    
    // Erros de autenticação (401)
    if (errorMessage.includes('Email ou senha incorretos')) {
      return {
        title: 'Credenciais inválidas',
        description: 'Verifique se o email e senha estão corretos e tente novamente',
        type: 'auth'
      }
    }
    
    if (errorMessage.includes('Email não confirmado')) {
      return {
        title: 'Email não confirmado',
        description: 'Verifique sua caixa de entrada e clique no link de confirmação enviado por email',
        type: 'auth'
      }
    }
    
    if (errorMessage.includes('Muitas tentativas')) {
      return {
        title: 'Muitas tentativas de login',
        description: 'Por segurança, aguarde alguns minutos antes de tentar fazer login novamente',
        type: 'auth'
      }
    }
    
    if (errorMessage.includes('Usuário não encontrado')) {
      return {
        title: 'Usuário não encontrado',
        description: 'Verifique se o email está correto ou entre em contato com o administrador',
        type: 'auth'
      }
    }
    
    // Usar a mensagem do backend se disponível
    return {
      title: errorMessage,
      description: error.description || 'Tente novamente em alguns instantes',
      type: 'validation'
    }
  }

  // Erros de rede
  if (error.name === 'TypeError' && error.message?.includes('fetch')) {
    return {
      title: 'Erro de conexão',
      description: 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente',
      type: 'network'
    }
  }

  // Erros de timeout
  if (error.name === 'AbortError') {
    return {
      title: 'Tempo limite esgotado',
      description: 'A operação demorou muito para responder. Tente novamente',
      type: 'network'
    }
  }

  // Erro genérico
  return {
    title: 'Erro inesperado',
    description: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte',
    type: 'unknown'
  }
}

/**
 * Obtém a cor e ícone apropriados para o tipo de erro
 */
export function getErrorStyle(type: UserFriendlyError['type']) {
  switch (type) {
    case 'validation':
      return {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: '⚠️'
      }
    case 'auth':
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '🔒'
      }
    case 'network':
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '🌐'
      }
    case 'server':
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '⚠️'
      }
    default:
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '❌'
      }
  }
}
