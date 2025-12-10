import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Joi from 'joi';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Rate limiting simples (em memória)
// Limite: 50 requisições por minuto por usuário (deixando margem para o limite de 60/min da API)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto em milissegundos
const RATE_LIMIT_MAX_REQUESTS = 50; // Máximo de requisições por minuto

// Função para verificar rate limit
function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remover requisições antigas (fora da janela de 1 minuto)
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW - now) / 1000) // segundos
    };
  }
  
  // Adicionar nova requisição
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  
  return { allowed: true };
}

// Função para extrair tempo de retry do erro da API
function extractRetryAfter(error) {
  try {
    // Tentar extrair do campo retryDelay se disponível
    if (error.retryDelay) {
      return Math.ceil(error.retryDelay / 1000); // Converter para segundos
    }
    
    // Tentar extrair da mensagem de erro
    const errorMessage = error.message || error.toString() || '';
    
    // Procurar por padrões como "Please retry in 55.338727046s"
    const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      return Math.ceil(parseFloat(retryMatch[1]));
    }
    
    // Procurar por "RetryInfo" no JSON do erro
    if (errorMessage.includes('RetryInfo')) {
      const retryInfoMatch = errorMessage.match(/retryDelay["\s:]+"?([^"}\s]+)/i);
      if (retryInfoMatch) {
        const delay = retryInfoMatch[1].replace(/s$/, ''); // Remove 's' se presente
        return Math.ceil(parseFloat(delay));
      }
    }
  } catch (e) {
    console.warn('⚠️ [Chat IA] Erro ao extrair retryAfter:', e.message);
  }
  
  return null; // Não foi possível extrair
}

// Função para fazer retry com backoff exponencial
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || error.toString() || '';
      
      // Se for erro de quota/rate limit, tentar extrair o tempo de retry
      if (errorMessage.includes('QUOTA') || errorMessage.includes('quota') || 
          errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        
        const retryAfter = extractRetryAfter(error);
        
        if (retryAfter && attempt < maxRetries - 1) {
          console.log(`⏳ [Chat IA] Rate limit atingido. Aguardando ${retryAfter}s antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue; // Tentar novamente após o delay
        }
      }
      
      // Para outros erros ou se não conseguir extrair retryAfter, usar backoff exponencial
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⏳ [Chat IA] Erro na tentativa ${attempt + 1}/${maxRetries}. Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Função para carregar contexto do sistema
function carregarContextoSistema() {
  try {
    const contextoPath = path.join(__dirname, '../config/contexto-ia-prompt.txt');
    const guiaUsoPath = path.join(__dirname, '../config/guia-uso-app.txt');
    
    let contextoCompleto = '';
    
    // Carregar contexto técnico (se existir)
    if (fs.existsSync(contextoPath)) {
      const contexto = fs.readFileSync(contextoPath, 'utf-8');
      contextoCompleto += contexto + '\n\n';
      console.log('✅ [Chat IA] Contexto técnico do sistema carregado com sucesso');
    } else {
      console.warn('⚠️ [Chat IA] Arquivo de contexto técnico não encontrado. Execute: npm run gerar-contexto-ia');
    }
    
    // Carregar guia de uso do app (sempre tentar carregar)
    if (fs.existsSync(guiaUsoPath)) {
      const guiaUso = fs.readFileSync(guiaUsoPath, 'utf-8');
      contextoCompleto += '# GUIA COMPLETO DE USO DO APLICATIVO\n\n' + guiaUso;
      console.log('✅ [Chat IA] Guia de uso do aplicativo carregado com sucesso');
    } else {
      console.warn('⚠️ [Chat IA] Arquivo de guia de uso não encontrado em:', guiaUsoPath);
    }
    
    return contextoCompleto || null;
  } catch (error) {
    console.error('❌ [Chat IA] Erro ao carregar contexto:', error.message);
    return null;
  }
}

// Carregar contexto uma vez ao iniciar
const contextoCarregado = carregarContextoSistema();

// Schema de validação para mensagens do chat
const chatMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(2000).messages({
    'string.empty': 'A mensagem não pode estar vazia',
    'string.min': 'A mensagem deve ter pelo menos 1 caractere',
    'string.max': 'A mensagem não pode exceder 2000 caracteres'
  }),
  conversationHistory: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().required(),
      timestamp: Joi.string().isoDate().optional() // Aceitar timestamp opcional do frontend
    })
  ).optional().default([])
});

// Prompt base do sistema
const PROMPT_BASE = `Você é um assistente virtual especializado no Sistema de Gerenciamento de Gruas. 
Seu papel é ajudar os usuários a entender como usar o sistema, responder dúvidas sobre funcionalidades e fornecer orientações gerais.

## INSTRUÇÕES PRINCIPAIS:

1. **Quando o usuário perguntar "Como usar o App?" ou "Como fazer X no sistema?"**:
   - Use o GUIA COMPLETO DE USO DO APLICATIVO que está incluído no contexto
   - Forneça instruções passo a passo claras e detalhadas
   - Sempre mencione a navegação específica (ex: "Menu > Obras > Nova Obra")
   - Explique cada etapa de forma didática

2. **Exemplos de perguntas que você deve responder usando o guia:**
   - "Como bato o ponto?"
   - "Como cadastrar uma obra?"
   - "Como assinar um documento?"
   - "Como aprovar horas extras?"
   - "Como visualizar meu holerite?"
   - "Como acessar o PWA no celular?"
   - Qualquer pergunta sobre funcionalidades do sistema

3. **Sobre Ponto Eletrônico:**
   - IMPORTANTE: Apenas Operários e Sinaleiros podem bater ponto
   - Supervisores NÃO podem bater ponto
   - Sempre mencione essa restrição quando explicar sobre ponto eletrônico
   - Explique os 4 tipos de registro: Entrada, Saída Almoço, Volta Almoço, Saída

4. **Sobre Permissões:**
   - Diferentes cargos têm diferentes permissões
   - Sempre verifique se o usuário tem permissão para a ação que está perguntando
   - Explique as diferenças entre Operários, Sinaleiros, Supervisores, Gestores e Administradores

ALÉM DISSO, você também pode responder perguntas gerais sobre:
- Cálculos trabalhistas (custo de funcionários CLT, encargos sociais, FGTS, INSS, etc.)
- Gestão de recursos humanos
- Cálculos financeiros e custos operacionais
- Gestão de obras e construção civil
- Operação e manutenção de equipamentos (gruas, máquinas)
- Questões relacionadas a construção, engenharia e gestão empresarial

Quando o usuário perguntar sobre cálculos trabalhistas ou custos de funcionários:
- Forneça cálculos práticos e detalhados
- Explique os encargos sociais (INSS, FGTS, 13º salário, férias, etc.)
- Calcule o custo total de um funcionário CLT baseado no salário bruto
- Use valores atualizados da legislação brasileira quando possível
- Seja específico e forneça exemplos numéricos quando solicitado

Exemplo de cálculo de custo de funcionário CLT (valores aproximados):
- Salário bruto: R$ 3.000,00
- INSS (empresa): ~11% = R$ 330,00
- FGTS: 8% = R$ 240,00
- 13º salário: 1/12 = R$ 250,00/mês
- Férias + 1/3: ~11,11% = R$ 333,33/mês
- Total aproximado: R$ 4.153,33/mês (custo total para a empresa)

IMPORTANTE: Sempre mencione que valores exatos podem variar conforme a legislação vigente e acordos coletivos, e recomende consulta com contador ou profissional de RH para cálculos oficiais.

Seja sempre educado, claro e objetivo. Se não souber a resposta exata, oriente o usuário sobre onde encontrar a informação no sistema ou como entrar em contato com o suporte.

Responda sempre em português brasileiro.`;

// Construir SYSTEM_PROMPT com contexto do projeto (se disponível)
const SYSTEM_PROMPT = contextoCarregado 
  ? `${PROMPT_BASE}\n\n${contextoCarregado}`
  : `${PROMPT_BASE}\n\nO sistema possui os seguintes módulos principais:
- Obras: Cadastro e gerenciamento de obras, sinaleiros, responsáveis técnicos
- Gruas: Controle de equipamentos, manutenções, configurações
- RH: Gestão de colaboradores, documentos, holerites, férias
- Ponto Eletrônico: Registro e aprovação de horas trabalhadas
- Financeiro: Receitas, custos, medições, contas a pagar/receber
- Documentos: Upload, assinaturas digitais, certificados
- Notificações: Sistema de alertas em tempo real

NOTA: Para informações mais detalhadas sobre endpoints e funcionalidades, execute 'npm run gerar-contexto-ia' no backend.`;

/**
 * @swagger
 * /api/chat-ia:
 *   post:
 *     summary: Envia mensagem para o assistente de IA
 *     tags: [Chat IA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Mensagem do usuário
 *                 example: "Como cadastrar uma nova obra?"
 *               conversationHistory:
 *                 type: array
 *                 description: Histórico da conversa (opcional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Resposta do assistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       description: Resposta do assistente
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Verificar rate limit antes de processar
    const userId = req.user?.id || req.user?.userId || req.ip || 'unknown';
    const rateLimitCheck = checkRateLimit(userId);
    
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ [Chat IA] Rate limit excedido para usuário ${userId}`);
      return res.status(429).json({
        success: false,
        error: 'Muitas requisições. Aguarde um momento antes de tentar novamente.',
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    // Validar entrada
    const { error, value } = chatMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { message, conversationHistory = [] } = value;

    // Verificar se a API key está configurada
    let apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    // Limpar espaços antes e depois da chave
    if (apiKey) {
      apiKey = apiKey.trim();
    }
    
    console.log('🔍 [Chat IA] Verificando API key:', apiKey ? `Configurada (${apiKey.substring(0, 20)}...)` : 'NÃO ENCONTRADA');
    
    if (!apiKey) {
      console.error('❌ [Chat IA] GOOGLE_GEMINI_API_KEY não configurada no process.env');
      console.error('💡 [Chat IA] Verifique se:');
      console.error('   1. A variável está no arquivo .env do backend-api');
      console.error('   2. O servidor foi reiniciado após adicionar a variável');
      console.error('   3. O arquivo .env está no diretório correto (backend-api/.env)');
      
      return res.status(500).json({
        success: false,
        error: 'Serviço de IA não configurado. Entre em contato com o administrador.',
        details: process.env.NODE_ENV === 'development' ? {
          suggestion: 'Execute: node scripts/verificar-chave-gemini.js para diagnosticar o problema'
        } : undefined
      });
    }
    
    // Verificar se a chave parece válida
    if (!apiKey.startsWith('AIza')) {
      console.error('❌ [Chat IA] Chave de API inválida: não começa com "AIza"');
      console.error('📊 [Chat IA] Chave recebida:', apiKey.substring(0, 30) + '...');
      return res.status(500).json({
        success: false,
        error: 'Chave de API inválida. A chave deve começar com "AIza".',
        details: process.env.NODE_ENV === 'development' ? {
          tip: 'Verifique se copiou a chave corretamente do Google AI Studio',
          suggestion: 'Execute: node scripts/verificar-chave-gemini.js para testar a chave',
          link: 'https://aistudio.google.com/apikey'
        } : undefined
      });
    }
    
    if (apiKey.length < 30) {
      console.error('❌ [Chat IA] Chave de API muito curta:', apiKey.length, 'caracteres');
      return res.status(500).json({
        success: false,
        error: 'Chave de API inválida. A chave parece estar incompleta.',
        details: process.env.NODE_ENV === 'development' ? {
          tip: 'Chaves de API geralmente têm mais de 30 caracteres',
          suggestion: 'Execute: node scripts/verificar-chave-gemini.js para testar a chave'
        } : undefined
      });
    }

    // Inicializar o modelo Gemini
    // Modelos disponíveis na API v1beta (2025):
    // - gemini-2.5-flash-lite: Modelo leve e rápido (10 RPM, recomendado para chat/FAQ) ⭐
    // - gemini-2.5-flash: Modelo completo (5 RPM, para contexto maior)
    // Referência: https://ai.google.dev/gemini-api/docs/api-key
    // NOTA: 
    // - gemini-2.0-flash-exp: Removido (quota 0 no tier gratuito)
    // - gemini-1.5-pro: Removido (não disponível na API v1beta, descontinuado)
    // - gemini-1.5-flash: Pode estar descontinuado, não incluído na lista
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    console.log(`🤖 [Chat IA] Inicializando Gemini API com modelo: ${modelName}`);
    
    // Construir prompt completo com contexto do sistema
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUsuário: ${message}\n\nAssistente:`;
    
    console.log('💬 [Chat IA] Enviando mensagem (primeiros 100 chars):', fullPrompt.substring(0, 100) + '...');
    
    // Lista de modelos para tentar em ordem de preferência (baseado na documentação oficial)
    // Ordem: modelos com quota disponível no tier gratuito e disponíveis na API v1beta
    // NOTA: 
    // - gemini-2.0-flash-exp foi removido pois tem quota 0 no tier gratuito
    // - gemini-1.5-pro foi removido pois não está disponível na API v1beta (descontinuado)
    // - gemini-1.5-flash pode estar descontinuado, então priorizamos modelos 2.5
    const modelsToTry = [
      modelName, // Primeiro tenta o modelo escolhido pelo usuário
      'gemini-2.5-flash-lite', // Modelo leve (10 RPM, ideal para chat/FAQ) ⭐
      'gemini-2.5-flash', // Modelo completo (5 RPM, para contexto maior)
      // Modelos 1.5 podem estar descontinuados - removidos da lista principal
    ].filter((m, index, arr) => {
      // Remove duplicatas
      const isUnique = arr.indexOf(m) === index;
      // Remove modelos descontinuados ou sem quota
      const isAllowed = m !== 'gemini-2.0-flash-exp' && 
                       m !== 'gemini-1.5-pro' &&
                       m !== null && 
                       m !== undefined;
      return isUnique && isAllowed;
    });
    
    let lastError = null;
    
    // Tentar cada modelo até um funcionar (com retry automático para erros de quota)
    for (const tryModel of modelsToTry) {
      try {
        console.log(`🔄 [Chat IA] Tentando modelo: ${tryModel}`);
        
        // Usar retry com backoff para lidar com erros temporários de quota
        const result = await retryWithBackoff(async () => {
          // Garantir que a chave está limpa (sem espaços)
          const cleanApiKey = apiKey.trim();
          const tryGenAI = new GoogleGenerativeAI(cleanApiKey);
          const tryModelInstance = tryGenAI.getGenerativeModel({ model: tryModel });
          
          // Fazer a requisição para o Gemini
          const result = await tryModelInstance.generateContent(fullPrompt);
          return result;
        }, 2); // Máximo 2 tentativas por modelo (3 total: 1 inicial + 2 retries)
        
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ [Chat IA] Resposta recebida do modelo ${tryModel} (primeiros 100 chars):`, text.substring(0, 100) + '...');
        console.log(`📊 [Chat IA] Modelo ${tryModel} usado com sucesso para usuário ${userId}`);
        
        // Retornar resposta
        return res.json({
          success: true,
          data: {
            response: text,
            model: tryModel, // Informar qual modelo foi usado
            timestamp: new Date().toISOString()
          }
        });
      } catch (modelError) {
        const errorMsg = modelError.message?.substring(0, 100) || 'Erro desconhecido';
        console.warn(`⚠️ [Chat IA] Modelo ${tryModel} falhou após retries:`, errorMsg);
        lastError = modelError;
        // Continuar para o próximo modelo
        continue;
      }
    }
    
    // Se nenhum modelo funcionou, lançar o último erro
    throw lastError || new Error('Nenhum modelo disponível funcionou');

  } catch (error) {
    console.error('❌ [Chat IA] Erro completo:', error);
    console.error('❌ [Chat IA] Mensagem de erro:', error.message);
    console.error('❌ [Chat IA] Stack:', error.stack);
    
    // Tratar erros específicos da API do Gemini
    const errorMessage = error.message || error.toString() || 'Erro desconhecido';
    
    if (errorMessage.includes('API_KEY') || errorMessage.includes('API key') || 
        errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('not valid') ||
        errorMessage.includes('API key not valid')) {
      const rawApiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
      const cleanApiKey = rawApiKey.trim();
      
      console.error('❌ [Chat IA] Erro de API Key inválida');
      console.error('📊 [Chat IA] Chave configurada:', rawApiKey ? 
        `${rawApiKey.substring(0, 20)}... (${rawApiKey.length} chars)` : 'NÃO ENCONTRADA');
      console.error('📊 [Chat IA] Chave após trim:', cleanApiKey ? 
        `${cleanApiKey.substring(0, 20)}... (${cleanApiKey.length} chars)` : 'VAZIA');
      
      if (rawApiKey !== cleanApiKey) {
        console.warn('⚠️ [Chat IA] ATENÇÃO: A chave contém espaços extras!');
        console.warn('   Chave original:', `"${rawApiKey}"`);
        console.warn('   Chave limpa:', `"${cleanApiKey}"`);
      }
      
      return res.status(500).json({
        success: false,
        error: 'Chave de API inválida. Verifique se a chave está correta e se o servidor foi reiniciado.',
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          suggestion: 'Execute o script de verificação: node scripts/verificar-chave-gemini.js',
          tips: [
            '1. Verifique se a chave está correta no arquivo .env',
            '2. Verifique se não há espaços antes ou depois da chave',
            '3. Reinicie o servidor após atualizar o .env',
            '4. A chave deve começar com "AIza" e ter mais de 30 caracteres',
            '5. Crie uma nova chave em: https://aistudio.google.com/apikey se necessário',
            '6. Se a chave foi exposta, ela pode ter sido desabilitada - veja: docs/CHAT-IA-NOVA-CHAVE-API.md'
          ],
          chaveInfo: {
            encontrada: !!rawApiKey,
            tamanho: rawApiKey.length,
            comecaComAIza: rawApiKey.startsWith('AIza'),
            temEspacos: rawApiKey !== cleanApiKey
          }
        } : undefined
      });
    }

    if (errorMessage.includes('QUOTA') || errorMessage.includes('quota') || 
        errorMessage.includes('rate limit') || errorMessage.includes('429') ||
        errorMessage.includes('Too Many Requests')) {
      const userId = req.user?.id || req.user?.userId || req.ip || 'unknown';
      const retryAfter = extractRetryAfter(error);
      
      // Log detalhado para monitoramento
      console.error('❌ [Chat IA] Erro de quota/rate limit');
      console.error(`📊 [Chat IA] Usuário: ${userId}`);
      console.error(`📊 [Chat IA] Modelo tentado: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'}`);
      console.error(`📊 [Chat IA] Retry após: ${retryAfter || 'N/A'} segundos`);
      console.error(`💡 [Chat IA] Ação recomendada: Verificar uso em https://ai.dev/usage?tab=rate-limit`);
      
      // Se for erro 429, pode ser hora de considerar billing ou limitar acesso
      if (errorMessage.includes('free_tier') && errorMessage.includes('limit: 0')) {
        console.warn('⚠️ [Chat IA] ATENÇÃO: Modelo sem quota no tier gratuito. Considere trocar de modelo ou ativar billing.');
      }
      
      return res.status(429).json({
        success: false,
        error: retryAfter 
          ? `Limite de requisições excedido. Tente novamente em ${Math.ceil(retryAfter)} segundos.`
          : 'Limite de requisições excedido. Tente novamente mais tarde.',
        retryAfter: retryAfter || undefined,
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          suggestion: 'O tier gratuito do Gemini tem limites por modelo. Considere:',
          tips: [
            '1. Aguardar alguns minutos antes de tentar novamente',
            '2. Verificar seu uso em: https://ai.dev/usage?tab=rate-limit',
            '3. Usar gemini-2.5-flash-lite (10 RPM) ou gemini-2.5-flash (5 RPM)',
            '4. Para uso intensivo, considere ativar billing no Google AI Studio',
            '5. Implementar limite de requisições por usuário no sistema'
          ],
          currentModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
        } : undefined
      });
    }

    if (errorMessage.includes('SAFETY') || errorMessage.includes('safety')) {
      console.error('❌ [Chat IA] Erro de segurança do conteúdo');
      return res.status(400).json({
        success: false,
        error: 'A mensagem foi bloqueada por filtros de segurança. Tente reformular sua pergunta.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }

    if (errorMessage.includes('not found') || errorMessage.includes('not supported') || errorMessage.includes('404')) {
      console.error('❌ [Chat IA] Modelo não encontrado ou não suportado');
      const currentModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
      return res.status(500).json({
        success: false,
        error: `Nenhum modelo disponível funcionou. Verifique sua chave de API e permissões no Google AI Studio.`,
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          currentModel: currentModel,
          suggestion: 'Modelos recomendados com quota free e disponíveis na API v1beta: gemini-2.5-flash-lite (10 RPM), gemini-2.5-flash (5 RPM)',
          documentation: 'https://ai.google.dev/gemini-api/docs/api-key',
          tip: 'Verifique se sua chave de API tem acesso aos modelos no Google AI Studio. Modelos 1.5 foram descontinuados. Use apenas modelos 2.5.'
        } : undefined
      });
    }

    // Retornar erro detalhado em desenvolvimento, genérico em produção
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Erro ao processar mensagem: ${errorMessage}` 
        : 'Erro ao processar sua mensagem. Tente novamente.',
      details: process.env.NODE_ENV === 'development' ? {
        message: errorMessage,
        stack: error.stack
      } : undefined
    });
  }
});

/**
 * @swagger
 * /api/chat-ia/health:
 *   get:
 *     summary: Verifica se o serviço de IA está disponível
 *     tags: [Chat IA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do serviço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                     configured:
 *                       type: boolean
 */
router.get('/health', authenticateToken, (req, res) => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  return res.json({
    success: true,
    data: {
      available: true,
      configured: !!apiKey
    }
  });
});

export default router;

