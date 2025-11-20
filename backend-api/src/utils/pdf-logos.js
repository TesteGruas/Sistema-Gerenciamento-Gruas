import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// O public está na raiz do projeto, não dentro de backend-api
// backend-api/src/utils -> backend-api -> raiz do projeto -> public
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const publicPath = path.join(projectRoot, 'public');

/**
 * Adiciona os logos no cabeçalho do PDF
 * @param {PDFDocument} doc - Documento PDF do PDFKit
 * @param {number} yPos - Posição Y inicial (será atualizada)
 * @returns {number} Nova posição Y após os logos
 */
export function adicionarLogosNoCabecalho(doc, yPos = 40) {
  try {
    const logo1Path = path.join(publicPath, 'logo.png');
    const logo2Path = path.join(publicPath, 'logo2.png');
    
    // Debug: verificar caminhos
    console.log('[PDF Logos] Public Path:', publicPath);
    console.log('[PDF Logos] Logo1 Path:', logo1Path);
    console.log('[PDF Logos] Logo2 Path:', logo2Path);
    
    // Verificar se os arquivos existem
    const logo1Exists = fs.existsSync(logo1Path);
    const logo2Exists = fs.existsSync(logo2Path);
    
    console.log('[PDF Logos] Logo1 existe:', logo1Exists);
    console.log('[PDF Logos] Logo2 existe:', logo2Exists);
    
    if (!logo1Exists && !logo2Exists) {
      console.warn('[PDF Logos] Logos não encontrados em:', publicPath);
      return yPos + 20;
    }
    
    // Tamanho dos logos (aumentado e posicionado nas extremidades)
    const logoHeight = 45; // Aumentado de 30 para 45
    const logoWidth1 = 90; // Aumentado de 60 para 90
    const logoWidth2 = 90; // Aumentado de 60 para 90
    const margin = 40; // Margem lateral (mesma margem do documento)
    
    // Posição X: logos nas extremidades
    const pageWidth = doc.page.width;
    const logo1X = margin; // Logo1 na extremidade esquerda
    const logo2X = pageWidth - margin - logoWidth2; // Logo2 na extremidade direita
    
    // Adicionar logo1 (logo.png) à esquerda
    if (logo1Exists) {
      try {
        // PDFKit image() sintaxe: image(path, x, y, width, height)
        doc.image(logo1Path, logo1X, yPos, { width: logoWidth1, height: logoHeight });
        console.log('[PDF Logos] Logo1 adicionado com sucesso em', logo1X, yPos);
      } catch (error) {
        console.error('[PDF Logos] Erro ao adicionar logo.png:', error.message);
        console.error('[PDF Logos] Stack:', error.stack);
      }
    } else {
      console.warn('[PDF Logos] logo.png não encontrado em:', logo1Path);
    }
    
    // Adicionar logo2 (logo2.png) à direita
    if (logo2Exists) {
      try {
        doc.image(logo2Path, logo2X, yPos, { width: logoWidth2, height: logoHeight });
        console.log('[PDF Logos] Logo2 adicionado com sucesso em', logo2X, yPos);
      } catch (error) {
        console.error('[PDF Logos] Erro ao adicionar logo2.png:', error.message);
        console.error('[PDF Logos] Stack:', error.stack);
      }
    } else {
      console.warn('[PDF Logos] logo2.png não encontrado em:', logo2Path);
    }
    
    // Retornar nova posição Y (abaixo dos logos + espaçamento)
    return yPos + logoHeight + 15;
  } catch (error) {
    console.warn('Erro ao adicionar logos no cabeçalho:', error.message);
    // Se houver erro, retornar a posição Y original + um pequeno espaço
    return yPos + 20;
  }
}

/**
 * Adiciona os logos no cabeçalho de uma página específica
 * @param {PDFDocument} doc - Documento PDF do PDFKit
 * @param {number} yPos - Posição Y (padrão: 40)
 */
export function adicionarLogosNaPagina(doc, yPos = 40) {
  try {
    const logo1Path = path.join(publicPath, 'logo.png');
    const logo2Path = path.join(publicPath, 'logo2.png');
    const logo1Exists = fs.existsSync(logo1Path);
    const logo2Exists = fs.existsSync(logo2Path);
    
    if (!logo1Exists && !logo2Exists) {
      return;
    }
    
    const logoHeight = 45;
    const logoWidth1 = 90;
    const logoWidth2 = 90;
    const margin = 40;
    const pageWidth = doc.page.width;
    const logo1X = margin;
    const logo2X = pageWidth - margin - logoWidth2;
    
    if (logo1Exists) {
      doc.image(logo1Path, logo1X, yPos, { width: logoWidth1, height: logoHeight });
    }
    if (logo2Exists) {
      doc.image(logo2Path, logo2X, yPos, { width: logoWidth2, height: logoHeight });
    }
  } catch (error) {
    console.warn('[PDF Logos] Erro ao adicionar logos na página:', error.message);
  }
}

/**
 * Adiciona os logos no cabeçalho de cada nova página
 * @param {PDFDocument} doc - Documento PDF do PDFKit
 */
export function adicionarLogosEmTodasAsPaginas(doc) {
  try {
    // Aguardar um pouco para garantir que todas as páginas estejam no buffer
    const pageRange = doc.bufferedPageRange();
    const startPage = pageRange.start || 0;
    const pageCount = pageRange.count || 0;
    
    if (pageCount === 0) {
      console.warn('[PDF Logos] Nenhuma página encontrada no buffer');
      return;
    }
    
    console.log(`[PDF Logos] Adicionando logos em ${pageCount} páginas (start: ${startPage})`);
    
    for (let i = startPage; i < startPage + pageCount; i++) {
      try {
        doc.switchToPage(i);
        adicionarLogosNaPagina(doc, 40);
        console.log(`[PDF Logos] Logos adicionados na página ${i}`);
      } catch (error) {
        console.warn(`[PDF Logos] Erro ao adicionar logos na página ${i}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[PDF Logos] Erro ao adicionar logos em todas as páginas:', error.message);
  }
}

/**
 * Adiciona o rodapé com informações da empresa em uma página específica
 * @param {PDFDocument} doc - Documento PDF do PDFKit
 */
export function adicionarRodapeNaPagina(doc) {
  try {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const margin = 40;
    
    // Texto exato do rodapé conforme solicitado (duas linhas separadas)
    const linha1 = 'IRBANA COPAS SERV. DE MANT E MONTG LTDA www.gruascopa.com.br e-mail: info@gruascopa.com.br';
    const linha2 = 'Rua Benevenuto Vieira, 48 Jardim Rancho Grande 13306-141 ITU - SP (11) 3656-1847 (11) 3656-1722 Whats (11) 98818-5951';
    
    // Linha separadora acima do rodapé
    const linhaY = pageHeight - 60;
    doc.moveTo(margin, linhaY).lineTo(pageWidth - margin, linhaY).stroke();
    
    // Texto do rodapé
    const rodapeY = linhaY + 8;
    doc.fontSize(8).font('Helvetica');
    
    // Primeira linha - texto exato
    doc.text(linha1, margin, rodapeY, {
      width: pageWidth - (margin * 2),
      align: 'center'
    });
    
    // Segunda linha - texto exato
    doc.text(linha2, margin, rodapeY + 10, {
      width: pageWidth - (margin * 2),
      align: 'center'
    });
  } catch (error) {
    console.warn('[PDF Rodapé] Erro ao adicionar rodapé na página:', error.message);
  }
}

/**
 * Adiciona o rodapé com informações da empresa em todas as páginas
 * @param {PDFDocument} doc - Documento PDF do PDFKit
 */
export function adicionarRodapeEmpresa(doc) {
  try {
    // Obter o range de páginas disponíveis no buffer
    const pageRange = doc.bufferedPageRange();
    const startPage = pageRange.start || 0;
    const pageCount = pageRange.count || 0;
    
    if (pageCount === 0) {
      console.warn('[PDF Rodapé] Nenhuma página encontrada no buffer');
      return;
    }
    
    console.log(`[PDF Rodapé] Adicionando rodapé em ${pageCount} páginas (start: ${startPage})`);
    
    // Iterar pelas páginas usando o range correto
    for (let i = startPage; i < startPage + pageCount; i++) {
      try {
        doc.switchToPage(i);
        adicionarRodapeNaPagina(doc);
        console.log(`[PDF Rodapé] Rodapé adicionado na página ${i}`);
      } catch (error) {
        console.warn(`[PDF Rodapé] Erro ao adicionar rodapé na página ${i}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[PDF Rodapé] Erro ao adicionar rodapé:', error.message);
  }
}

