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

// Função para carregar contexto do sistema
function carregarContextoSistema() {
  try {
    const contextoPath = path.join(__dirname, '../config/contexto-ia-prompt.txt');
    if (fs.existsSync(contextoPath)) {
      const contexto = fs.readFileSync(contextoPath, 'utf-8');
      console.log('✅ [Chat IA] Contexto do sistema carregado com sucesso');
      return contexto;
    } else {
      console.warn('⚠️ [Chat IA] Arquivo de contexto não encontrado. Execute: npm run gerar-contexto-ia');
      return null;
    }
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
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    console.log('🔍 [Chat IA] Verificando API key:', apiKey ? `Configurada (${apiKey.substring(0, 20)}...)` : 'NÃO ENCONTRADA');
    
    if (!apiKey) {
      console.error('❌ [Chat IA] GOOGLE_GEMINI_API_KEY não configurada no process.env');
      console.error('💡 [Chat IA] Verifique se:');
      console.error('   1. A variável está no arquivo .env do backend-api');
      console.error('   2. O servidor foi reiniciado após adicionar a variável');
      console.error('   3. O arquivo .env está no diretório correto (backend-api/.env)');
      
      return res.status(500).json({
        success: false,
        error: 'Serviço de IA não configurado. Entre em contato com o administrador.'
      });
    }

    // Inicializar o modelo Gemini
    // Modelos disponíveis conforme documentação oficial (2024/2025):
    // - gemini-2.5-flash: Modelo mais recente e recomendado (documentação oficial)
    // - gemini-1.5-flash: Modelo rápido e estável
    // - gemini-1.5-pro: Modelo mais poderoso
    // - gemini-2.0-flash-exp: Modelo experimental
    // Referência: https://ai.google.dev/gemini-api/docs/api-key
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    console.log(`🤖 [Chat IA] Inicializando Gemini API com modelo: ${modelName}`);
    
    // Construir prompt completo com contexto do sistema
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUsuário: ${message}\n\nAssistente:`;
    
    console.log('💬 [Chat IA] Enviando mensagem (primeiros 100 chars):', fullPrompt.substring(0, 100) + '...');
    
    // Lista de modelos para tentar em ordem de preferência (baseado na documentação oficial)
    // Ordem: modelos mais recentes primeiro, depois fallbacks
    const modelsToTry = [
      modelName, // Primeiro tenta o modelo escolhido pelo usuário
      'gemini-2.5-flash', // Modelo mais recente (documentação oficial)
      'gemini-1.5-flash', // Modelo estável e rápido
      'gemini-1.5-pro', // Modelo mais poderoso
      'gemini-2.0-flash-exp' // Experimental
    ].filter((m, index, arr) => arr.indexOf(m) === index); // Remove duplicatas
    
    let lastError = null;
    
    // Tentar cada modelo até um funcionar
    for (const tryModel of modelsToTry) {
      try {
        console.log(`🔄 [Chat IA] Tentando modelo: ${tryModel}`);
        const tryGenAI = new GoogleGenerativeAI(apiKey);
        const tryModelInstance = tryGenAI.getGenerativeModel({ model: tryModel });
        
        // Fazer a requisição para o Gemini
        const result = await tryModelInstance.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ [Chat IA] Resposta recebida do modelo ${tryModel} (primeiros 100 chars):`, text.substring(0, 100) + '...');
        
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
        console.warn(`⚠️ [Chat IA] Modelo ${tryModel} falhou:`, modelError.message?.substring(0, 100));
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
    
    if (errorMessage.includes('API_KEY') || errorMessage.includes('API key')) {
      console.error('❌ [Chat IA] Erro de API Key');
      return res.status(500).json({
        success: false,
        error: 'Chave de API inválida. Entre em contato com o administrador.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }

    if (errorMessage.includes('QUOTA') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      console.error('❌ [Chat IA] Erro de quota/rate limit');
      return res.status(429).json({
        success: false,
        error: 'Limite de requisições excedido. Tente novamente mais tarde.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
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
      const currentModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      return res.status(500).json({
        success: false,
        error: `Nenhum modelo disponível funcionou. Verifique sua chave de API e permissões no Google AI Studio.`,
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          currentModel: currentModel,
          suggestion: 'Modelos recomendados: gemini-2.5-flash, gemini-1.5-flash, gemini-1.5-pro',
          documentation: 'https://ai.google.dev/gemini-api/docs/api-key',
          tip: 'Verifique se sua chave de API tem acesso aos modelos no Google AI Studio'
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

