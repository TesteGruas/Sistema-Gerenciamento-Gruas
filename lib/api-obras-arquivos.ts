import api from './api'

export interface ArquivoObra {
  id: number
  obra_id: number
  obra_nome: string
  grua_id?: string
  grua_modelo?: string
  grua_fabricante?: string
  nome_original: string
  nome_arquivo: string
  caminho: string
  tamanho: number
  tipo_mime: string
  tipo_arquivo: string
  descricao?: string
  categoria: 'geral' | 'manual' | 'certificado' | 'licenca' | 'contrato' | 'relatorio' | 'foto' | 'outro'
  uploaded_by: number
  uploaded_by_nome: string
  uploaded_by_email: string
  is_public: boolean
  download_count: number
  last_download_at?: string
  created_at: string
  updated_at: string
  tamanho_formatado: string
}

export interface ArquivoCreate {
  obra_id: number
  nome_original: string
  descricao?: string
  categoria?: string
  arquivo: File
  grua_id?: string
  is_public?: boolean
}

export interface ArquivoUpdate {
  descricao?: string
  categoria?: string
  is_public?: boolean
}

export interface ArquivoResponse {
  success: boolean
  data: ArquivoObra | ArquivoObra[]
  message?: string
}

export interface UploadMultipleResponse {
  success: boolean
  message: string
  data: {
    sucessos: ArquivoObra[]
    erros: Array<{
      arquivo: string
      erro: string
    }>
  }
}

export const obrasArquivosApi = {
  // Listar arquivos de uma obra
  async listarPorObra(
    obraId: number, 
    categoria?: string, 
    tipo_arquivo?: string, 
    grua_id?: string
  ): Promise<ArquivoResponse> {
    const params = new URLSearchParams()
    if (categoria) params.append('categoria', categoria)
    if (tipo_arquivo) params.append('tipo_arquivo', tipo_arquivo)
    if (grua_id) params.append('grua_id', grua_id)
    
    const response = await api.get(`/obras/${obraId}/arquivos?${params.toString()}`)
    return response.data
  },

  // Obter arquivo específico
  async obter(obraId: number, arquivoId: number): Promise<ArquivoResponse> {
    const response = await api.get(`/obras/${obraId}/arquivos/${arquivoId}`)
    return response.data
  },

  // Upload de arquivo único
  async upload(dados: ArquivoCreate): Promise<ArquivoResponse> {
    const formData = new FormData()
    formData.append('arquivo', dados.arquivo)
    formData.append('nome_original', dados.nome_original)
    if (dados.descricao) formData.append('descricao', dados.descricao)
    if (dados.categoria) formData.append('categoria', dados.categoria)
    if (dados.grua_id) formData.append('grua_id', dados.grua_id)
    if (dados.is_public !== undefined) formData.append('is_public', dados.is_public.toString())

    const response = await api.post(`/obras/${dados.obra_id}/arquivos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Upload múltiplo de arquivos
  async uploadMultiple(obraId: number, arquivos: File[], categoria?: string): Promise<UploadMultipleResponse> {
    const formData = new FormData()
    arquivos.forEach(arquivo => {
      formData.append('arquivos', arquivo)
    })
    if (categoria) formData.append('categoria', categoria)

    const response = await api.post(`/obras/${obraId}/arquivos/upload-multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Atualizar metadados do arquivo
  async atualizar(obraId: number, arquivoId: number, dados: ArquivoUpdate): Promise<ArquivoResponse> {
    const response = await api.put(`/obras/${obraId}/arquivos/${arquivoId}`, dados)
    return response.data
  },

  // Excluir arquivo
  async excluir(arquivoId: number): Promise<ArquivoResponse> {
    const response = await api.delete(`/obras/arquivos/${arquivoId}`)
    return response.data
  },

  // Baixar arquivo
  async baixar(obraId: number, arquivoId: number): Promise<void> {
    const response = await api.get(`/obras/${obraId}/arquivos/${arquivoId}/download`)
    
    if (response.data.success) {
      // Redirecionar para a URL de download
      window.open(response.data.data.download_url, '_blank')
    } else {
      throw new Error(response.data.message || 'Erro ao baixar arquivo')
    }
  },

  // Download do arquivo
  async download(obraId: number, arquivoId: number): Promise<{ download_url: string; nome_arquivo: string }> {
    const response = await api.get(`/obras/${obraId}/arquivos/${arquivoId}/download`)
    return response.data.data
  },

  // Obter URL de download direto
  async obterUrlDownload(obraId: number, arquivoId: number): Promise<string> {
    const dados = await this.download(obraId, arquivoId)
    return dados.download_url
  },

  // Função auxiliar para formatar tamanho de arquivo
  formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Função auxiliar para obter ícone do tipo de arquivo
  obterIconeTipo(tipo: string): string {
    switch (tipo) {
      case 'pdf':
        return '📄'
      case 'imagem':
        return '🖼️'
      case 'documento':
        return '📝'
      case 'planilha':
        return '📊'
      case 'apresentacao':
        return '📽️'
      case 'texto':
        return '📄'
      case 'compactado':
        return '📦'
      default:
        return '📁'
    }
  },

  // Função auxiliar para obter cor da categoria
  obterCorCategoria(categoria: string): string {
    switch (categoria) {
      case 'geral':
        return 'bg-gray-100 text-gray-800'
      case 'manual':
        return 'bg-blue-100 text-blue-800'
      case 'certificado':
        return 'bg-green-100 text-green-800'
      case 'licenca':
        return 'bg-yellow-100 text-yellow-800'
      case 'contrato':
        return 'bg-purple-100 text-purple-800'
      case 'relatorio':
        return 'bg-indigo-100 text-indigo-800'
      case 'foto':
        return 'bg-pink-100 text-pink-800'
      case 'outro':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
}

export default obrasArquivosApi
