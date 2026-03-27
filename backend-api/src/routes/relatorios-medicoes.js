import express from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from 'pdf-lib';
import { adicionarLogosNoCabecalho, adicionarRodapeEmpresa, adicionarLogosEmTodasAsPaginas, adicionarLogosNaPagina } from '../utils/pdf-logos.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Funções auxiliares de formatação
const formatarMoeda = (valor) => {
  if (!valor && valor !== 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const formatarData = (data) => {
  if (!data) return '-';
  try {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return data.toString();
  }
};

const formatarPeriodo = (periodo) => {
  if (!periodo) return '-';
  try {
    const [ano, mes] = periodo.split('-');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  } catch {
    return periodo;
  }
};

const getDocumentoLabel = (tipo) => {
  const labels = {
    medicao_pdf: 'PDF da Medição',
    nf_servico: 'NF de Serviço',
    nf_produto: 'NF de Produto',
    nf_locacao: 'Locação',
    boleto_nf_servico_1: 'Boleto (NF Serviço)',
    boleto_nf_servico_2: 'Boleto (NF Serviço)',
    boleto_nf_locacao_1: 'Boleto (Locação)',
    boleto_nf_locacao_2: 'Boleto (Locação)'
  };
  return labels[tipo] || tipo;
};

const gerarResumoMedicaoPdfBuffer = async (medicao, documentos) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
    info: {
      Title: `Relatório Completo da Medição ${medicao.numero}`,
      Author: 'Sistema de Gerenciamento de Gruas',
      Subject: 'Medição com anexos',
      Creator: 'Sistema IRBANA'
    }
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const finalizado = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  let yPos = 40;
  yPos = adicionarLogosNoCabecalho(doc, yPos);

  doc.fontSize(16).font('Helvetica-Bold').text('RELATÓRIO COMPLETO DA MEDIÇÃO', 40, yPos, { align: 'center' });
  yPos += 25;
  doc.fontSize(11).font('Helvetica');
  doc.text(`Medição: ${medicao.numero || `#${medicao.id}`}`, 40, yPos, { align: 'center' });
  yPos += 14;
  doc.text(`Período: ${formatarPeriodo(medicao.periodo)}`, 40, yPos, { align: 'center' });
  yPos += 14;
  doc.text(`Data: ${formatarData(medicao.data_medicao)}`, 40, yPos, { align: 'center' });
  yPos += 20;

  doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
  yPos += 15;

  doc.fontSize(11).font('Helvetica-Bold').text('Informações Gerais', 40, yPos);
  yPos += 14;
  doc.fontSize(9).font('Helvetica');
  doc.text(`Obra: ${medicao.obras?.nome || '-'}`, 40, yPos); yPos += 12;
  doc.text(`Cliente: ${medicao.obras?.clientes?.nome || medicao.orcamentos?.clientes?.nome || '-'}`, 40, yPos); yPos += 12;
  doc.text(`Grua: ${medicao.gruas?.name || '-'}`, 40, yPos); yPos += 12;
  doc.text(`Status: ${medicao.status || '-'}`, 40, yPos); yPos += 12;
  doc.text(`Aprovação: ${medicao.status_aprovacao || 'pendente'}`, 40, yPos); yPos += 18;

  doc.fontSize(11).font('Helvetica-Bold').text('Valores', 40, yPos);
  yPos += 14;
  doc.fontSize(9).font('Helvetica');
  doc.text(`Valor Mensal Bruto: ${formatarMoeda(medicao.valor_mensal_bruto || 0)}`, 40, yPos); yPos += 12;
  doc.text(`Aditivos: ${formatarMoeda(medicao.valor_aditivos || 0)}`, 40, yPos); yPos += 12;
  doc.text(`Custos Extras: ${formatarMoeda(medicao.valor_custos_extras || 0)}`, 40, yPos); yPos += 12;
  doc.text(`Descontos: ${formatarMoeda(medicao.valor_descontos || 0)}`, 40, yPos); yPos += 12;
  doc.font('Helvetica-Bold').text(`VALOR TOTAL: ${formatarMoeda(medicao.valor_total || 0)}`, 40, yPos); yPos += 18;
  doc.font('Helvetica');

  if (medicao.observacoes) {
    doc.fontSize(11).font('Helvetica-Bold').text('Observações', 40, yPos);
    yPos += 14;
    doc.fontSize(9).font('Helvetica').text(medicao.observacoes, 40, yPos, { width: 515 });
    yPos = doc.y + 16;
  }

  doc.fontSize(11).font('Helvetica-Bold').text('Arquivos incluídos no PDF único', 40, yPos);
  yPos += 14;
  doc.fontSize(9).font('Helvetica');
  if (!documentos.length) {
    doc.text('Nenhum documento com arquivo encontrado.', 40, yPos);
  } else {
    documentos.forEach((arquivo, index) => {
      const observacao = arquivo.observacoes ? ` - ${arquivo.observacoes}` : '';
      doc.text(`${index + 1}. ${getDocumentoLabel(arquivo.tipo_documento)}${observacao}`, 40, yPos, { width: 515 });
      yPos = doc.y + 6;
      if (yPos > 740) {
        doc.addPage();
        try { adicionarLogosNaPagina(doc, 40); } catch {}
        yPos = 150;
      }
    });
  }

  adicionarLogosEmTodasAsPaginas(doc);
  adicionarRodapeEmpresa(doc);
  doc.end();

  return finalizado;
};

const buscarMedicaoCompleta = async (medicaoId) => {
  const { data: medicao, error: medicaoError } = await supabaseAdmin
    .from('medicoes_mensais')
    .select(`
      *,
      obras:obra_id (
        id,
        nome,
        clientes:cliente_id (id, nome)
      ),
      orcamentos:orcamento_id (
        id,
        numero,
        clientes:cliente_id (id, nome)
      ),
      gruas:grua_id (id, name),
      medicao_custos_mensais (*),
      medicao_horas_extras (*),
      medicao_servicos_adicionais (*),
      medicao_aditivos (*),
      medicao_documentos (*)
    `)
    .eq('id', medicaoId)
    .single();

  if (medicaoError || !medicao) {
    const err = new Error(medicaoError?.message || 'Não foi possível localizar a medição');
    err.statusCode = 404;
    throw err;
  }

  return medicao;
};

const gerarPdfCompletoMedicao = async (medicao, medicaoId) => {
  const documentosComArquivo = (medicao.medicao_documentos || [])
    .filter((doc) => doc.caminho_arquivo)
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

  const resumoBuffer = await gerarResumoMedicaoPdfBuffer(medicao, documentosComArquivo);
  const pdfFinal = await PDFLibDocument.create();
  const fonteRegular = await pdfFinal.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await pdfFinal.embedFont(StandardFonts.HelveticaBold);

  const resumoPdf = await PDFLibDocument.load(resumoBuffer);
  const paginasResumo = await pdfFinal.copyPages(resumoPdf, resumoPdf.getPageIndices());
  paginasResumo.forEach((page) => pdfFinal.addPage(page));

  for (let i = 0; i < documentosComArquivo.length; i++) {
    const documento = documentosComArquivo[i];
    const tituloAnexo = `${i + 1}. ${getDocumentoLabel(documento.tipo_documento)}`;
    try {
      const resposta = await fetch(documento.caminho_arquivo);
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const bytes = await resposta.arrayBuffer();
      const contentType = (resposta.headers.get('content-type') || '').toLowerCase();
      const caminho = String(documento.caminho_arquivo || '').toLowerCase();

      const isPdf = contentType.includes('pdf') || caminho.endsWith('.pdf');
      const isPng = contentType.includes('png') || caminho.endsWith('.png');
      const isJpg = contentType.includes('jpeg') || contentType.includes('jpg') || caminho.endsWith('.jpg') || caminho.endsWith('.jpeg');

      if (isPdf) {
        const anexoPdf = await PDFLibDocument.load(bytes, { ignoreEncryption: true });
        const paginas = await pdfFinal.copyPages(anexoPdf, anexoPdf.getPageIndices());
        paginas.forEach((page) => pdfFinal.addPage(page));
        continue;
      }

      if (isPng || isJpg) {
        const page = pdfFinal.addPage([595.28, 841.89]);
        page.drawText(tituloAnexo, {
          x: 40,
          y: 810,
          size: 12,
          font: fonteNegrito,
          color: rgb(0, 0, 0)
        });

        const imagem = isPng
          ? await pdfFinal.embedPng(bytes)
          : await pdfFinal.embedJpg(bytes);

        const larguraMax = 515;
        const alturaMax = 720;
        const escala = Math.min(larguraMax / imagem.width, alturaMax / imagem.height);
        const largura = imagem.width * escala;
        const altura = imagem.height * escala;
        const x = 40 + (larguraMax - largura) / 2;
        const y = 60 + (alturaMax - altura) / 2;

        page.drawImage(imagem, { x, y, width: largura, height: altura });
        continue;
      }

      const page = pdfFinal.addPage([595.28, 841.89]);
      page.drawText(tituloAnexo, { x: 40, y: 810, size: 12, font: fonteNegrito });
      page.drawText('Este tipo de arquivo não pode ser incorporado automaticamente ao PDF.', { x: 40, y: 780, size: 10, font: fonteRegular });
    } catch (error) {
      const page = pdfFinal.addPage([595.28, 841.89]);
      page.drawText(tituloAnexo, { x: 40, y: 810, size: 12, font: fonteNegrito });
      page.drawText(`Erro ao incorporar anexo: ${error.message}`, { x: 40, y: 780, size: 10, font: fonteRegular });
    }
  }

  const nomeArquivo = `medicao-completa-${medicao.numero || medicaoId}-${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBytes = await pdfFinal.save();
  return { pdfBytes, nomeArquivo };
};

/**
 * GET /api/relatorios/medicoes/:orcamento_id/pdf
 * Gerar relatório de medições mensais de um orçamento
 */
router.get('/medicoes/:orcamento_id/pdf', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { orcamento_id } = req.params;

    // Buscar orçamento
    const { data: orcamento, error: orcamentoError } = await supabaseAdmin
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          cnpj,
          contato_cpf
        )
      `)
      .eq('id', orcamento_id)
      .single();

    if (orcamentoError || !orcamento) {
      return res.status(404).json({
        success: false,
        error: 'Orçamento não encontrado',
        message: orcamentoError?.message || 'Orçamento não encontrado'
      });
    }

    // Buscar todas as medições do orçamento ordenadas por período
    const { data: medicoes, error: medicoesError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        medicao_custos_mensais (*),
        medicao_horas_extras (*),
        medicao_servicos_adicionais (*),
        medicao_aditivos (*)
      `)
      .eq('orcamento_id', orcamento_id)
      .order('periodo', { ascending: true });

    if (medicoesError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar medições',
        message: medicoesError.message
      });
    }

    if (!medicoes || medicoes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nenhuma medição encontrada',
        message: 'Não há medições registradas para este orçamento'
      });
    }

    // Criar documento PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: `Relatório de Medições - Orçamento ${orcamento.numero || orcamento_id}`,
        Author: 'Sistema de Gerenciamento de Gruas',
        Subject: 'Relatório de Medições Mensais',
        Creator: 'Sistema IRBANA'
      }
    });

    // Configurar headers da resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-medicoes-${orcamento.numero || orcamento_id}.pdf`);

    // Pipe do documento para a resposta
    doc.pipe(res);

    // Constante para posição inicial após logos 
    // Padding de 150px do topo em todas as páginas para garantir espaçamento adequado
    const Y_POS_APOS_LOGOS = 150;
    
    // Função auxiliar para adicionar nova página com logos
    const adicionarNovaPaginaComLogos = () => {
      doc.addPage();
      // Adicionar logos imediatamente na nova página criada
      try {
        adicionarLogosNaPagina(doc, 40);
        console.log(`[PDF] Logos adicionados imediatamente na nova página`);
      } catch (error) {
        console.error('[PDF] Erro ao adicionar logos na nova página:', error.message);
      }
      // Retornar posição Y para começar o conteúdo abaixo dos logos (150px do topo)
      return Y_POS_APOS_LOGOS;
    };

    let yPos = 40;
    let totalAcumulado = 0;

    // ===== LOGOS NO CABEÇALHO =====
    yPos = adicionarLogosNoCabecalho(doc, yPos);

    // ===== CABEÇALHO =====
    doc.fontSize(16).font('Helvetica-Bold').text('RELATÓRIO DE MEDIÇÕES MENSAIS', 40, yPos, { align: 'center' });
    yPos += 25;
    
    doc.fontSize(12).font('Helvetica');
    doc.text(`Orçamento: ${orcamento.numero || `#${orcamento_id}`}`, 40, yPos, { align: 'center' });
    yPos += 15;
    doc.text(`Cliente: ${orcamento.clientes?.nome || '-'}`, 40, yPos, { align: 'center' });
    yPos += 15;
    const documento = orcamento.clientes?.cnpj || orcamento.clientes?.contato_cpf || '-';
    doc.text(`CNPJ/CPF: ${documento}`, 40, yPos, { align: 'center' });
    yPos += 20;

    // Linha separadora
    doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
    yPos += 15;

    // ===== RESUMO GERAL =====
    doc.fontSize(11).font('Helvetica-Bold').text('RESUMO GERAL', 40, yPos);
    yPos += 15;
    doc.fontSize(10).font('Helvetica');
    
    const medicoesFinalizadas = medicoes.filter(m => m.status === 'finalizada');
    const totalFaturado = medicoesFinalizadas.reduce((sum, m) => sum + parseFloat(m.valor_total || 0), 0);
    
    doc.text(`Total de Medições: ${medicoes.length}`, 40, yPos);
    yPos += 12;
    doc.text(`Medições Finalizadas: ${medicoesFinalizadas.length}`, 40, yPos);
    yPos += 12;
    doc.text(`Total Faturado: ${formatarMoeda(totalFaturado)}`, 40, yPos);
    yPos += 12;
    doc.text(`Total Acumulado no Orçamento: ${formatarMoeda(orcamento.total_faturado_acumulado || 0)}`, 40, yPos);
    yPos += 20;

    // ===== DETALHAMENTO POR MÊS =====
    doc.fontSize(11).font('Helvetica-Bold').text('DETALHAMENTO MENSAL', 40, yPos);
    yPos += 20;

    medicoes.forEach((medicao, index) => {
      // Verificar se precisa de nova página
      if (yPos > 700) {
        yPos = adicionarNovaPaginaComLogos();
      }

      // Cabeçalho do mês
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Mês: ${formatarPeriodo(medicao.periodo)}`, 40, yPos);
      doc.text(`Status: ${medicao.status.toUpperCase()}`, 400, yPos);
      yPos += 15;
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`Número: ${medicao.numero}`, 40, yPos);
      doc.text(`Data: ${formatarData(medicao.data_medicao)}`, 200, yPos);
      yPos += 15;

      // Linha separadora
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 10;

      // Custos Mensais
      if (medicao.medicao_custos_mensais && medicao.medicao_custos_mensais.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Custos Mensais:', 40, yPos);
        yPos += 12;
        
        medicao.medicao_custos_mensais.forEach(item => {
          if (yPos > 750) {
            yPos = adicionarNovaPaginaComLogos();
          }
          
          doc.fontSize(8).font('Helvetica');
          doc.text(`  • ${item.descricao}: ${formatarMoeda(item.valor_total)}`, 50, yPos);
          yPos += 10;
        });
        yPos += 5;
      }

      // Horas Extras
      if (medicao.medicao_horas_extras && medicao.medicao_horas_extras.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Horas Extras:', 40, yPos);
        yPos += 12;
        
        medicao.medicao_horas_extras.forEach(item => {
          if (yPos > 750) {
            yPos = adicionarNovaPaginaComLogos();
          }
          
          doc.fontSize(8).font('Helvetica');
          const tipoLabel = {
            'operador': 'Operador',
            'sinaleiro': 'Sinaleiro',
            'equipamento': 'Equipamento'
          }[item.tipo] || item.tipo;
          
          const diaLabel = {
            'sabado': 'Sábado',
            'domingo_feriado': 'Domingo/Feriado',
            'normal': 'Normal'
          }[item.dia_semana] || item.dia_semana;
          
          doc.text(`  • ${tipoLabel} - ${diaLabel}: ${item.quantidade_horas}h × ${formatarMoeda(item.valor_hora)} = ${formatarMoeda(item.valor_total)}`, 50, yPos);
          yPos += 10;
        });
        yPos += 5;
      }

      // Serviços Adicionais
      if (medicao.medicao_servicos_adicionais && medicao.medicao_servicos_adicionais.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Serviços Adicionais:', 40, yPos);
        yPos += 12;
        
        medicao.medicao_servicos_adicionais.forEach(item => {
          if (yPos > 750) {
            yPos = adicionarNovaPaginaComLogos();
          }
          
          doc.fontSize(8).font('Helvetica');
          doc.text(`  • ${item.descricao}: ${item.quantidade} × ${formatarMoeda(item.valor_unitario)} = ${formatarMoeda(item.valor_total)}`, 50, yPos);
          yPos += 10;
        });
        yPos += 5;
      }

      // Aditivos
      if (medicao.medicao_aditivos && medicao.medicao_aditivos.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Aditivos:', 40, yPos);
        yPos += 12;
        
        medicao.medicao_aditivos.forEach(item => {
          if (yPos > 750) {
            yPos = adicionarNovaPaginaComLogos();
          }
          
          doc.fontSize(8).font('Helvetica');
          const tipoLabel = item.tipo === 'adicional' ? 'Adicional' : 'Desconto';
          doc.text(`  • ${tipoLabel} - ${item.descricao}: ${formatarMoeda(item.valor)}`, 50, yPos);
          yPos += 10;
        });
        yPos += 5;
      }

      // Resumo do mês
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Resumo do Mês:', 40, yPos);
      yPos += 12;
      
      doc.fontSize(8).font('Helvetica');
      doc.text(`  Valor Mensal Bruto: ${formatarMoeda(medicao.valor_mensal_bruto || 0)}`, 50, yPos);
      yPos += 10;
      doc.text(`  Aditivos: ${formatarMoeda(medicao.valor_aditivos || 0)}`, 50, yPos);
      yPos += 10;
      doc.text(`  Custos Extras: ${formatarMoeda(medicao.valor_custos_extras || 0)}`, 50, yPos);
      yPos += 10;
      doc.text(`  Descontos: ${formatarMoeda(medicao.valor_descontos || 0)}`, 50, yPos);
      yPos += 10;
      
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`  VALOR TOTAL: ${formatarMoeda(medicao.valor_total || 0)}`, 50, yPos);
      yPos += 15;

      // Acumulado até este mês
      if (medicao.status === 'finalizada') {
        totalAcumulado += parseFloat(medicao.valor_total || 0);
      }
      doc.fontSize(8).font('Helvetica-Oblique');
      doc.text(`Total Acumulado até este mês: ${formatarMoeda(totalAcumulado)}`, 50, yPos);
      yPos += 20;

      // Linha separadora entre meses
      if (index < medicoes.length - 1) {
        doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
        yPos += 15;
      }
    });

    // ===== LOGOS EM TODAS AS PÁGINAS =====
    // Adicionar logos no cabeçalho de todas as páginas
    adicionarLogosEmTodasAsPaginas(doc);
    
    // ===== RODAPÉ =====
    // Adicionar informações da empresa em todas as páginas
    adicionarRodapeEmpresa(doc);
    
    // Adicionar numeração de páginas
    const pageRange = doc.bufferedPageRange();
    const startPage = pageRange.start || 0;
    const pageCount = pageRange.count || 0;
    
    for (let i = startPage; i < startPage + pageCount; i++) {
      try {
        doc.switchToPage(i);
        doc.fontSize(7).font('Helvetica');
        const pageNumber = i - startPage + 1;
        doc.text(
          `Página ${pageNumber} de ${pageCount} | Gerado em ${formatarData(new Date())}`,
          40,
          doc.page.height - 15,
          { align: 'center', width: 515 }
      );
      } catch (error) {
        console.warn(`[PDF] Erro ao adicionar numeração na página ${i}:`, error.message);
      }
    }

    // Finalizar documento
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar relatório de medições:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório',
        message: error.message
      });
    }
  }
});

/**
 * GET /api/relatorios/medicao/:medicao_id/pdf-completo
 * Exporta medição completa com anexos em um único PDF
 */
router.get('/medicao/:medicao_id/pdf-completo', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { medicao_id } = req.params;
    const medicao = await buscarMedicaoCompleta(medicao_id);
    const { pdfBytes, nomeArquivo } = await gerarPdfCompletoMedicao(medicao, medicao_id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}`);
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Erro ao gerar PDF completo da medição:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao gerar PDF completo da medição',
      message: error.message
    });
  }
});

/**
 * GET /api/relatorios/medicao/publico/pdf/:token
 * Exporta medição completa com anexos via token público
 */
router.get('/medicao/publico/pdf/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token obrigatório',
        message: 'Informe o token de acesso'
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'Link inválido ou expirado'
      });
    }

    if (!payload || payload.type !== 'medicao_pdf_publico' || !payload.medicao_id) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'Token não corresponde a um link público de medição'
      });
    }

    const medicaoId = payload.medicao_id;
    const medicao = await buscarMedicaoCompleta(medicaoId);
    const { pdfBytes, nomeArquivo } = await gerarPdfCompletoMedicao(medicao, medicaoId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${nomeArquivo}`);
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: 'Erro ao gerar PDF público da medição',
      message: error.message
    });
  }
});

export { buscarMedicaoCompleta, gerarPdfCompletoMedicao };
export default router;

