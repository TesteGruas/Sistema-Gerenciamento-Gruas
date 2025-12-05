import { PDFDocument } from 'pdf-lib';

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
 * Adiciona uma assinatura em todas as páginas do PDF
 * @param {Buffer} pdfBuffer - Buffer do PDF original
 * @param {string} signatureBase64 - Assinatura em base64 (data URL)
 * @param {Object} options - Opções de posicionamento
 * @returns {Promise<Buffer>} - Buffer do PDF com assinatura em todas as páginas
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
    const {
      height = 100, // Altura fixa de 100px
      marginRight = 20, // Margem direita
      marginBottom = 20, // Margem inferior
      opacity = 1.0
    } = options;

    // Calcular largura mantendo proporção (assumindo que a imagem original tem proporção)
    const imageDims = image.scale(1);
    const aspectRatio = imageDims.width / imageDims.height;
    const signatureWidth = height * aspectRatio;

    // Obter todas as páginas (já obtido acima)
    
    // Adicionar assinatura em todas as páginas
    pages.forEach((page, index) => {
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      
      // Calcular posição no canto inferior direito
      const x = pageWidth - signatureWidth - marginRight;
      const y = marginBottom;

      console.log(`🎨 [PDF Signature] Adicionando assinatura na página ${index + 1}/${pages.length} - Posição: x=${x.toFixed(2)}, y=${y.toFixed(2)}, width=${signatureWidth.toFixed(2)}, height=${height.toFixed(2)}`)

      // Adicionar a assinatura na página
      page.drawImage(image, {
        x: x,
        y: y,
        width: signatureWidth,
        height: height,
        opacity: opacity
      });
    });

    console.log(`🎨 [PDF Signature] Assinatura adicionada em ${pages.length} página(s)`)
    
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

