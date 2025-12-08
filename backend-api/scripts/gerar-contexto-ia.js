/**
 * Script para gerar contexto estruturado do projeto para a IA
 * Este script analisa o código e gera um arquivo com informações detalhadas
 * sobre o sistema que será usado no SYSTEM_PROMPT da IA
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Caminhos do projeto
const projectRoot = path.resolve(__dirname, '../..')
const backendRoot = path.resolve(__dirname, '..')
const routesDir = path.join(backendRoot, 'src/routes')
const appDir = path.join(projectRoot, 'app')
const componentsDir = path.join(projectRoot, 'components')

/**
 * Analisa os arquivos de rotas e extrai informações sobre endpoints
 */
async function analisarRotas() {
  const rotas = []
  const arquivosRotas = await glob('**/*.js', { 
    cwd: routesDir,
    ignore: ['node_modules/**', 'tests/**'],
    withFileTypes: false
  })
  
  for (const arquivo of arquivosRotas) {
    const caminhoCompleto = path.join(routesDir, arquivo)
    const conteudo = fs.readFileSync(caminhoCompleto, 'utf-8')
    
    // Extrair rotas HTTP (GET, POST, PUT, DELETE, PATCH)
    const rotasHTTP = conteudo.matchAll(
      /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi
    )
    
    const rotasEncontradas = []
    for (const match of rotasHTTP) {
      const metodo = match[1].toUpperCase()
      const caminho = match[2]
      
      // Extrair comentários Swagger se existirem
      const linhas = conteudo.split('\n')
      const indiceRota = conteudo.indexOf(match[0])
      const linhaRota = conteudo.substring(0, indiceRota).split('\n').length - 1
      
      let descricao = ''
      let tags = []
      
      // Procurar por comentários Swagger acima da rota
      for (let i = linhaRota - 1; i >= 0 && i >= linhaRota - 20; i--) {
        if (linhas[i].includes('@swagger') || linhas[i].includes('summary:')) {
          const summaryMatch = linhas[i].match(/summary:\s*(.+)/)
          if (summaryMatch) {
            descricao = summaryMatch[1].trim()
          }
          const tagMatch = linhas[i].match(/tags:\s*\[([^\]]+)\]/)
          if (tagMatch) {
            tags = tagMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''))
          }
          break
        }
      }
      
      rotasEncontradas.push({
        metodo,
        caminho: `/api${caminho.startsWith('/') ? '' : '/'}${caminho}`,
        descricao: descricao || 'Sem descrição',
        tags
      })
    }
    
    if (rotasEncontradas.length > 0) {
      rotas.push({
        arquivo: arquivo.replace('.js', ''),
        rotas: rotasEncontradas
      })
    }
  }
  
  return rotas
}

/**
 * Analisa a estrutura de páginas do frontend
 */
async function analisarPaginas() {
  const paginas = []
  const arquivosPaginas = await glob('**/page.tsx', { 
    cwd: appDir,
    ignore: ['node_modules/**'],
    withFileTypes: false
  })
  
  for (const arquivo of arquivosPaginas) {
    const caminhoCompleto = path.join(appDir, arquivo)
    const conteudo = fs.readFileSync(caminhoCompleto, 'utf-8')
    
    // Extrair título da página (se houver)
    const tituloMatch = conteudo.match(/title[:\s]*['"`]([^'"`]+)['"`]/i)
    const titulo = tituloMatch ? tituloMatch[1] : arquivo.replace('/page.tsx', '')
    
    // Extrair rotas dinâmicas
    const rotasDinamicas = arquivo.match(/\[([^\]]+)\]/g) || []
    
    paginas.push({
      caminho: `/${arquivo.replace('/page.tsx', '').replace(/\[([^\]]+)\]/g, ':$1')}`,
      arquivo,
      titulo,
      rotasDinamicas: rotasDinamicas.map(r => r.replace(/[\[\]]/g, ''))
    })
  }
  
  return paginas
}

/**
 * Analisa componentes principais
 */
async function analisarComponentes() {
  const componentes = []
  const arquivosComponentes = await glob('*.tsx', { 
    cwd: componentsDir,
    ignore: ['node_modules/**', 'ui/**'],
    withFileTypes: false
  })
  
  for (const arquivo of arquivosComponentes) {
    const caminhoCompleto = path.join(componentsDir, arquivo)
    const conteudo = fs.readFileSync(caminhoCompleto, 'utf-8')
    
    // Extrair nome do componente
    const nomeMatch = conteudo.match(/(?:export\s+(?:default\s+)?(?:function|const)\s+)?(\w+)/)
    const nome = nomeMatch ? nomeMatch[1] : arquivo.replace('.tsx', '')
    
    // Verificar se é um componente principal (não UI)
    if (!arquivo.includes('ui/') && nome) {
      componentes.push({
        nome,
        arquivo
      })
    }
  }
  
  return componentes
}

/**
 * Gera o contexto completo do sistema
 */
async function gerarContexto() {
  console.log('🔍 Analisando rotas da API...')
  const rotas = await analisarRotas()
  
  console.log('🔍 Analisando páginas do frontend...')
  const paginas = await analisarPaginas()
  
  console.log('🔍 Analisando componentes...')
  const componentes = await analisarComponentes()
  
  // Organizar rotas por módulo
  const rotasPorModulo = {}
  rotas.forEach(arquivoRota => {
    arquivoRota.rotas.forEach(rota => {
      const modulo = rota.tags[0] || arquivoRota.arquivo || 'outros'
      if (!rotasPorModulo[modulo]) {
        rotasPorModulo[modulo] = []
      }
      rotasPorModulo[modulo].push({
        metodo: rota.metodo,
        caminho: rota.caminho,
        descricao: rota.descricao
      })
    })
  })
  
  // Organizar páginas por módulo
  const paginasPorModulo = {}
  paginas.forEach(pagina => {
    const modulo = pagina.caminho.split('/')[1] || 'outros'
    if (!paginasPorModulo[modulo]) {
      paginasPorModulo[modulo] = []
    }
    paginasPorModulo[modulo].push({
      caminho: pagina.caminho,
      titulo: pagina.titulo
    })
  })
  
  const contexto = {
    geradoEm: new Date().toISOString(),
    versao: '1.0.0',
    sistema: {
      nome: 'Sistema de Gerenciamento de Gruas',
      descricao: 'Sistema completo para gerenciamento de gruas, obras, funcionários, RH e controle financeiro',
      stack: {
        frontend: 'Next.js 15 com PWA (Progressive Web App)',
        backend: 'Node.js/Express',
        bancoDados: 'PostgreSQL (Supabase)',
        autenticacao: 'JWT',
        ia: 'Google Gemini API'
      }
    },
    modulos: {
      obras: {
        descricao: 'Cadastro e gerenciamento de obras, sinaleiros, responsáveis técnicos',
        rotas: rotasPorModulo['Obras'] || rotasPorModulo['obras'] || [],
        paginas: paginasPorModulo['obras'] || []
      },
      gruas: {
        descricao: 'Controle de equipamentos, manutenções, configurações, livro de grua',
        rotas: rotasPorModulo['Gruas'] || rotasPorModulo['gruas'] || [],
        paginas: paginasPorModulo['gruas'] || []
      },
      rh: {
        descricao: 'Gestão completa de colaboradores, documentos, holerites, férias, vales',
        rotas: rotasPorModulo['RH'] || rotasPorModulo['rh'] || rotasPorModulo['Funcionários'] || [],
        paginas: paginasPorModulo['rh'] || []
      },
      ponto: {
        descricao: 'Registro e aprovação de horas trabalhadas, ponto eletrônico',
        rotas: rotasPorModulo['Ponto'] || rotasPorModulo['ponto'] || [],
        paginas: paginasPorModulo['ponto'] || []
      },
      financeiro: {
        descricao: 'Receitas, custos, medições, contas a pagar/receber, orçamentos',
        rotas: rotasPorModulo['Financeiro'] || rotasPorModulo['financeiro'] || [],
        paginas: paginasPorModulo['financeiro'] || []
      },
      documentos: {
        descricao: 'Upload, assinaturas digitais, certificados',
        rotas: rotasPorModulo['Documentos'] || rotasPorModulo['documentos'] || rotasPorModulo['Assinaturas'] || [],
        paginas: paginasPorModulo['documentos'] || []
      },
      notificacoes: {
        descricao: 'Sistema de alertas em tempo real',
        rotas: rotasPorModulo['Notificações'] || rotasPorModulo['notificacoes'] || [],
        paginas: paginasPorModulo['notificacoes'] || []
      },
      estoque: {
        descricao: 'Gestão de estoque e produtos',
        rotas: rotasPorModulo['Estoque'] || rotasPorModulo['estoque'] || [],
        paginas: paginasPorModulo['estoque'] || []
      },
      clientes: {
        descricao: 'Cadastro e gerenciamento de clientes',
        rotas: rotasPorModulo['Clientes'] || rotasPorModulo['clientes'] || [],
        paginas: paginasPorModulo['clientes'] || []
      },
      relatorios: {
        descricao: 'Relatórios e análises do sistema',
        rotas: rotasPorModulo['Relatórios'] || rotasPorModulo['relatorios'] || [],
        paginas: paginasPorModulo['relatorios'] || []
      }
    },
    estatisticas: {
      totalRotas: rotas.reduce((acc, r) => acc + r.rotas.length, 0),
      totalPaginas: paginas.length,
      totalComponentes: componentes.length,
      modulos: Object.keys(rotasPorModulo).length
    },
    componentesPrincipais: componentes.slice(0, 50).map(c => c.nome),
    todasRotas: rotas.flatMap(r => r.rotas.map(rota => ({
      metodo: rota.metodo,
      caminho: rota.caminho,
      descricao: rota.descricao,
      modulo: r.arquivo
    })))
  }
  
  return contexto
}

/**
 * Gera o prompt formatado para a IA
 */
function gerarPromptFormatado(contexto) {
  let prompt = `# CONTEXTO DO SISTEMA DE GERENCIAMENTO DE GRUAS

## INFORMAÇÕES GERAIS
- **Nome:** ${contexto.sistema.nome}
- **Descrição:** ${contexto.sistema.descricao}
- **Stack Tecnológico:**
  - Frontend: ${contexto.sistema.stack.frontend}
  - Backend: ${contexto.sistema.stack.backend}
  - Banco de Dados: ${contexto.sistema.stack.bancoDados}
  - Autenticação: ${contexto.sistema.stack.autenticacao}
  - IA: ${contexto.sistema.stack.ia}

## MÓDULOS DO SISTEMA

`

  // Adicionar informações de cada módulo
  Object.entries(contexto.modulos).forEach(([nomeModulo, dados]) => {
    prompt += `### ${nomeModulo.toUpperCase()}\n`
    prompt += `${dados.descricao}\n\n`
    
    if (dados.rotas && dados.rotas.length > 0) {
      prompt += `**Principais Endpoints da API:**\n`
      dados.rotas.slice(0, 10).forEach(rota => {
        prompt += `- ${rota.metodo} ${rota.caminho}: ${rota.descricao}\n`
      })
      if (dados.rotas.length > 10) {
        prompt += `- ... e mais ${dados.rotas.length - 10} endpoints\n`
      }
      prompt += `\n`
    }
    
    if (dados.paginas && dados.paginas.length > 0) {
      prompt += `**Páginas do Frontend:**\n`
      dados.paginas.slice(0, 5).forEach(pagina => {
        prompt += `- ${pagina.caminho}: ${pagina.titulo}\n`
      })
      if (dados.paginas.length > 5) {
        prompt += `- ... e mais ${dados.paginas.length - 5} páginas\n`
      }
      prompt += `\n`
    }
    
    prompt += `\n`
  })
  
  prompt += `## ESTATÍSTICAS DO SISTEMA
- Total de Rotas da API: ${contexto.estatisticas.totalRotas}
- Total de Páginas: ${contexto.estatisticas.totalPaginas}
- Total de Componentes: ${contexto.estatisticas.totalComponentes}
- Módulos: ${contexto.estatisticas.modulos}

## COMPONENTES PRINCIPAIS
${contexto.componentesPrincipais.slice(0, 20).join(', ')}

## COMO AJUDAR OS USUÁRIOS

Você deve usar essas informações para:
1. **Responder dúvidas sobre funcionalidades** - Saber quais endpoints e páginas existem
2. **Orientar sobre como usar o sistema** - Explicar fluxos e processos
3. **Explicar a estrutura do sistema** - Entender como os módulos se relacionam
4. **Fornecer informações técnicas** - Sobre APIs, componentes e arquitetura

IMPORTANTE: Sempre responda em português brasileiro e seja claro e objetivo.
`

  return prompt
}

// Executar script
async function main() {
  try {
    console.log('🚀 Iniciando geração de contexto para IA...\n')
    
    const contexto = await gerarContexto()
    
    // Salvar contexto em JSON
    const contextoPath = path.join(backendRoot, 'src/config/contexto-ia.json')
    fs.mkdirSync(path.dirname(contextoPath), { recursive: true })
    fs.writeFileSync(contextoPath, JSON.stringify(contexto, null, 2), 'utf-8')
    console.log(`✅ Contexto JSON salvo em: ${contextoPath}`)
    
    // Salvar prompt formatado
    const promptFormatado = gerarPromptFormatado(contexto)
    const promptPath = path.join(backendRoot, 'src/config/contexto-ia-prompt.txt')
    fs.writeFileSync(promptPath, promptFormatado, 'utf-8')
    console.log(`✅ Prompt formatado salvo em: ${promptPath}`)
    
    console.log(`\n📊 Estatísticas:`)
    console.log(`   - Rotas encontradas: ${contexto.estatisticas.totalRotas}`)
    console.log(`   - Páginas encontradas: ${contexto.estatisticas.totalPaginas}`)
    console.log(`   - Componentes encontrados: ${contexto.estatisticas.totalComponentes}`)
    console.log(`   - Módulos: ${contexto.estatisticas.modulos}`)
    
    console.log(`\n✨ Contexto gerado com sucesso!`)
    console.log(`\n💡 Próximo passo: Atualize o SYSTEM_PROMPT no arquivo chat-ia.js`)
    
  } catch (error) {
    console.error('❌ Erro ao gerar contexto:', error)
    process.exit(1)
  }
}

main()
