import { PDFDocument } from 'pdf-lib';
import {
  encontrarPosicaoAssinaturaPorAncoras,
  encontrarTodasPosicoesDuasColunasFuncionario,
  encontrarTodasPosicoesRodapeColunaEsquerda,
  encontrarPosicoesCertificadoNr12MultiPagina,
  encontrarPosicoesCertificadoMultipaginaAluno,
  resolverRegraPorDocumento
} from './pdf-signature-placement.js';

export {
  extrairItensTextoPdf,
  encontrarPosicaoAssinaturaPorAncoras,
  encontrarTodasPosicoesDuasColunasFuncionario,
  encontrarTodasPosicoesRodapeColunaEsquerda,
  encontrarPosicoesCertificadoNr12MultiPagina,
  encontrarPosicoesCertificadoMultipaginaAluno,
  resolverRegraPorDocumento,
  listarPaginasComConteudo,
  PERFIS_ASSINATURA_DOCUMENTO,
  REGRA_ASSINATURA_PADRAO,
  REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO
} from './pdf-signature-placement.js';

/**
 * Adiciona uma assinatura digital (imagem) em um PDF existente
 * @param {Buffer} pdfBuffer - Buffer do PDF original
 * @param {string} signatureBase64 - Assinatura em base64 (data URL)
 * @param {Object} options - Opções de posicionamento
 * @returns {Promise<Buffer>} - Buffer do PDF com assinatura
 */
export async function adicionarAssinaturaNoPDF(pdfBuffer, signatureBase64, options = {}) {
  try {
    // Carregar o PDF existente
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Converter base64 para imagem
    let image;
    let imageBytes;
    
    // Remover prefixo data:image/png;base64, se existir
    const base64Data = signatureBase64.includes(',') 
      ? signatureBase64.split(',')[1] 
      : signatureBase64;
    
    imageBytes = Buffer.from(base64Data, 'base64');

    // Determinar tipo de imagem pelo header
    const header = imageBytes.slice(0, 4);
    let imageType;
    
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      // PNG
      imageType = 'png';
      image = await pdfDoc.embedPng(imageBytes);
    } else if (header[0] === 0xFF && header[1] === 0xD8) {
      // JPEG
      imageType = 'jpg';
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error('Formato de imagem não suportado. Use PNG ou JPEG.');
    }

    // Obter dimensões da imagem
    const imageDims = image.scale(0.3); // Reduzir para 30% do tamanho original
    const signatureWidth = imageDims.width;
    const signatureHeight = imageDims.height;

    // Opções padrão
    const {
      pageIndex = 0, // Última página por padrão
      x = null, // Se null, centralizar horizontalmente
      y = 50, // 50 pontos do fundo
      width = signatureWidth,
      height = signatureHeight,
      opacity = 1.0
    } = options;

    // Obter a página (última página por padrão, ou página especificada)
    const pages = pdfDoc.getPages();
    const pageIndexToUse = pageIndex === -1 ? pages.length - 1 : pageIndex;
    const page = pages[pageIndexToUse];
    
    if (!page) {
      throw new Error(`Página ${pageIndexToUse} não encontrada no PDF`);
    }

    // Calcular posição X (centralizar se não especificado)
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const finalX = x !== null ? x : (pageWidth - width) / 2;
    const finalY = y;

    // Adicionar a assinatura na página
    page.drawImage(image, {
      x: finalX,
      y: finalY,
      width: width,
      height: height,
      opacity: opacity
    });

    // Salvar o PDF modificado
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Erro ao adicionar assinatura no PDF:', error);
    throw error;
  }
}

/**
 * Adiciona uma assinatura em uma ou mais páginas do PDF
 * @param {Buffer} pdfBuffer - Buffer do PDF original
 * @param {string} signatureBase64 - Assinatura em base64 (data URL)
 * @param {Object} options - height, marginBottom, opacity, horizontalAlign ('left'|'right'), marginLeft, marginRight, pages ('all'|'last')
 * @returns {Promise<Buffer>} - Buffer do PDF com assinatura
 */
export async function adicionarAssinaturaEmTodasPaginas(pdfBuffer, signatureBase64, options = {}) {
  try {
    console.log('🎨 [PDF Signature] Iniciando adição de assinatura em todas as páginas')
    console.log('🎨 [PDF Signature] Tipo de assinatura:', signatureBase64?.substring(0, 50))
    
    // Carregar o PDF existente
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    console.log(`🎨 [PDF Signature] PDF carregado com ${pages.length} página(s)`)

    // Converter base64 para imagem
    let image;
    let imageBytes;
    
    // Remover prefixo data:image/png;base64, se existir
    const base64Data = signatureBase64.includes(',') 
      ? signatureBase64.split(',')[1] 
      : signatureBase64;
    
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Assinatura base64 vazia ou inválida')
    }
    
    imageBytes = Buffer.from(base64Data, 'base64');
    console.log(`🎨 [PDF Signature] Imagem decodificada: ${imageBytes.length} bytes`)

    // Determinar tipo de imagem pelo header
    const header = imageBytes.slice(0, 4);
    
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      // PNG
      console.log('🎨 [PDF Signature] Tipo detectado: PNG')
      image = await pdfDoc.embedPng(imageBytes);
    } else if (header[0] === 0xFF && header[1] === 0xD8) {
      // JPEG
      console.log('🎨 [PDF Signature] Tipo detectado: JPEG')
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      console.error('🎨 [PDF Signature] Header inválido:', header)
      throw new Error('Formato de imagem não suportado. Use PNG ou JPEG.');
    }

    // Opções padrão
    // horizontalAlign: 'right' (legado) | 'left' (ex.: holerite — acima do rótulo "Assinatura")
    // pages: 'all' | 'last' — em qual(is) página(s) desenhar
    const {
      height = 100,
      marginRight = 20,
      marginLeft = 48,
      marginBottom = 20,
      horizontalAlign = 'right',
      pages: pagesOption = 'all',
      opacity = 1.0
    } = options;

    // Calcular largura mantendo proporção (assumindo que a imagem original tem proporção)
    const imageDims = image.scale(1);
    const aspectRatio = imageDims.width / imageDims.height;
    const signatureWidth = height * aspectRatio;

    const indicesToDraw =
      pagesOption === 'last' && pages.length > 0
        ? [pages.length - 1]
        : pages.map((_, i) => i);

    indicesToDraw.forEach((pageIndex) => {
      const page = pages[pageIndex];
      if (!page) return;

      const pageWidth = page.getWidth();

      let x;
      if (horizontalAlign === 'left') {
        x = marginLeft;
      } else {
        x = pageWidth - signatureWidth - marginRight;
      }
      const y = marginBottom;

      console.log(`🎨 [PDF Signature] Adicionando assinatura na página ${pageIndex + 1}/${pages.length} (align=${horizontalAlign}) - Posição: x=${x.toFixed(2)}, y=${y.toFixed(2)}, width=${signatureWidth.toFixed(2)}, height=${height.toFixed(2)}`)

      page.drawImage(image, {
        x: x,
        y: y,
        width: signatureWidth,
        height: height,
        opacity: opacity
      });
    });

    console.log(`🎨 [PDF Signature] Assinatura adicionada em ${indicesToDraw.length} página(s)`)
    
    // Salvar o PDF modificado
    const pdfBytes = await pdfDoc.save();
    console.log(`🎨 [PDF Signature] PDF salvo: ${pdfBytes.length} bytes`)
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Erro ao adicionar assinatura em todas as páginas:', error);
    throw error;
  }
}

/**
 * Adiciona múltiplas assinaturas em um PDF
 * @param {Buffer} pdfBuffer - Buffer do PDF original
 * @param {Array} assinaturas - Array de objetos { signatureBase64, options }
 * @returns {Promise<Buffer>} - Buffer do PDF com assinaturas
 */
export async function adicionarMultiplasAssinaturasNoPDF(pdfBuffer, assinaturas) {
  let currentPdf = pdfBuffer;
  
  for (const assinatura of assinaturas) {
    currentPdf = await adicionarAssinaturaNoPDF(
      currentPdf,
      assinatura.signatureBase64,
      assinatura.options || {}
    );
  }
  
  return currentPdf;
}

/**
 * Baixa um PDF de uma URL e adiciona assinatura
 * @param {string} pdfUrl - URL do PDF
 * @param {string} signatureBase64 - Assinatura em base64
 * @param {Object} options - Opções de posicionamento
 * @returns {Promise<Buffer>} - Buffer do PDF com assinatura
 */
/**
 * Dimensões naturais da imagem da assinatura (proporção para largura/altura no PDF).
 */
async function dimensoesAssinaturaBase64(signatureBase64) {
  const tmp = await PDFDocument.create();
  const base64Data = signatureBase64.includes(',')
    ? signatureBase64.split(',')[1]
    : signatureBase64;
  const imageBytes = Buffer.from(base64Data, 'base64');
  const header = imageBytes.slice(0, 4);
  let image;
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
    image = await tmp.embedPng(imageBytes);
  } else if (header[0] === 0xff && header[1] === 0xd8) {
    image = await tmp.embedJpg(imageBytes);
  } else {
    throw new Error('Formato de imagem não suportado. Use PNG ou JPEG.');
  }
  const d = image.scale(1);
  return { width: d.width, height: d.height };
}

/**
 * Lê o PDF, procura âncoras de texto (ex.: "Assinatura") e posiciona a imagem abaixo do rótulo.
 * Se não encontrar âncora, usa última página e y fixo (comportamento legado).
 *
 * @param {Buffer} pdfBuffer
 * @param {string} signatureBase64
 * @param {{ documento?: { arquivo_original?: string, titulo?: string, tipo_documento?: string }, regra?: Record<string, unknown>, opacity?: number }} contexto
 */
export async function adicionarAssinaturaPorAncorasOuFallback(pdfBuffer, signatureBase64, contexto = {}) {
  const regra = resolverRegraPorDocumento(contexto.documento || {}, contexto.regra || {});
  const dims = await dimensoesAssinaturaBase64(signatureBase64);

  /** @type {Array<{ pageIndex: number, x?: number, y?: number, height: number, metodo?: string, anchor?: string, pageWidth?: number, marginRight?: number, marginBottom?: number }>} */
  let posicoes = [];

  try {
    if (
      regra.todasOcorrenciasColunaFuncionario === true &&
      regra.metodoAncora === 'duas_colunas_funcionario_esquerda'
    ) {
      posicoes = await encontrarTodasPosicoesDuasColunasFuncionario(pdfBuffer, regra);
    } else if (
      regra.todasPaginasRodapeColunaEsquerda === true &&
      regra.metodoAncora === 'rodape_coluna_esquerda'
    ) {
      posicoes = await encontrarTodasPosicoesRodapeColunaEsquerda(pdfBuffer, regra);
    } else if (regra.metodoAncora === 'certificado_nr12_multi') {
      posicoes = await encontrarPosicoesCertificadoNr12MultiPagina(pdfBuffer, regra);
    } else if (regra.metodoAncora === 'certificado_multipagina_aluno') {
      posicoes = await encontrarPosicoesCertificadoMultipaginaAluno(pdfBuffer, regra);
    } else {
      const pos = await encontrarPosicaoAssinaturaPorAncoras(pdfBuffer, regra);
      if (pos) posicoes = [pos];
    }
  } catch (e) {
    console.warn('[PDF Signature] Análise de âncoras falhou:', e?.message || e);
  }

  if (posicoes.length > 0) {
    let buf = pdfBuffer;
    for (let i = 0; i < posicoes.length; i++) {
      const pos = posicoes[i];
      const h = pos.height;
      const w = (dims.width / dims.height) * h;
      let drawX = pos.x;
      let drawY = pos.y;
      if (pos.metodo === 'canto_inferior_direito_fixo' && typeof pos.pageWidth === 'number') {
        drawX = pos.pageWidth - w - (pos.marginRight ?? 44);
        drawY = pos.marginBottom ?? 40;
      }
      console.log(
        `[PDF Signature] Assinatura (${pos.metodo || 'âncora'}) página ${pos.pageIndex + 1} [${i + 1}/${posicoes.length}], anchor="${pos.anchor}" x=${Number(drawX).toFixed(1)} y=${Number(drawY).toFixed(1)}`
      );
      buf = await adicionarAssinaturaNoPDF(buf, signatureBase64, {
        pageIndex: pos.pageIndex,
        x: drawX,
        y: drawY,
        width: w,
        height: h,
        opacity: contexto.opacity ?? 1.0
      });
    }
    return buf;
  }

  console.warn('[PDF Signature] Nenhuma âncora encontrada; usando última página e y=50');
  return adicionarAssinaturaNoPDF(pdfBuffer, signatureBase64, {
    pageIndex: -1,
    y: 50,
    opacity: contexto.opacity ?? 1.0
  });
}

export async function baixarEAdicionarAssinatura(pdfUrl, signatureBase64, options = {}) {
  try {
    // Baixar o PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Erro ao baixar PDF: ${response.status} ${response.statusText}`);
    }
    
    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    
    // Adicionar assinatura
    return await adicionarAssinaturaNoPDF(pdfBuffer, signatureBase64, options);
  } catch (error) {
    console.error('Erro ao baixar e adicionar assinatura:', error);
    throw error;
  }
}

