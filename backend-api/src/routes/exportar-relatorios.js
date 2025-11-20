import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import { adicionarLogosNoCabecalho, adicionarRodapeEmpresa, adicionarLogosEmTodasAsPaginas } from '../utils/pdf-logos.js';

const router = express.Router();

/**
 * @swagger
 * /api/exportar-relatorios/pdf/financeiro:
 *   post:
 *     summary: Exportar relatório financeiro em PDF
 *     tags: [Exportações]
 */
router.post('/pdf/financeiro', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { tipo, data_inicio, data_fim, dados } = req.body;

    if (!tipo || !data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: tipo, data_inicio, data_fim'
      });
    }

    // Criar documento PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Configurar headers da resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${tipo}-${data_inicio}-${data_fim}.pdf`);

    // Pipe do documento para a resposta
    doc.pipe(res);

    // ===== LOGOS NO CABEÇALHO =====
    let yPos = 50;
    yPos = adicionarLogosNoCabecalho(doc, yPos);

    // Cabeçalho do documento
    doc.fontSize(20).font('Helvetica-Bold').text('Relatório Financeiro', 50, yPos, { align: 'center' });
    yPos += 20;
    doc.fontSize(12).font('Helvetica').text(`Tipo: ${tipo}`, 50, yPos, { align: 'center' });
    yPos += 15;
    doc.text(`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`, 50, yPos, { align: 'center' });
    yPos += 15;
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 50, yPos, { align: 'center' });
    yPos += 20;

    // Linha separadora
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 15;

    // Buscar dados conforme o tipo
    let dadosRelatorio;
    if (dados) {
      dadosRelatorio = dados;
    } else {
      dadosRelatorio = await buscarDadosFinanceiros(tipo, data_inicio, data_fim);
    }

    // Renderizar conforme o tipo de relatório
    switch (tipo) {
      case 'financeiro':
      case 'vendas':
      case 'contratos':
      case 'locacoes':
      case 'estoque':
        renderizarRelatorioGenericoPDF(doc, dadosRelatorio);
        break;
      case 'fluxo-caixa':
        renderizarFluxoCaixaPDF(doc, dadosRelatorio);
        break;
      case 'faturamento':
        renderizarFaturamentoPDF(doc, dadosRelatorio);
        break;
      case 'contas-receber':
        renderizarContasReceberPDF(doc, dadosRelatorio);
        break;
      case 'contas-pagar':
        renderizarContasPagarPDF(doc, dadosRelatorio);
        break;
      case 'impostos':
        renderizarImpostosPDF(doc, dadosRelatorio);
        break;
      case 'rentabilidade':
        renderizarRentabilidadePDF(doc, dadosRelatorio);
        break;
      default:
        renderizarRelatorioGenericoPDF(doc, dadosRelatorio);
    }

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
          `Página ${pageNumber} de ${pageCount}`,
          50,
          doc.page.height - 15,
          { align: 'center' }
        );
      } catch (error) {
        console.warn(`[PDF] Erro ao adicionar numeração na página ${i}:`, error.message);
      }
    }

    // Finalizar documento
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar PDF',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/exportar-relatorios/excel/financeiro:
 *   post:
 *     summary: Exportar relatório financeiro em Excel
 */
router.post('/excel/financeiro', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { tipo, data_inicio, data_fim, dados } = req.body;

    if (!tipo || !data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: tipo, data_inicio, data_fim'
      });
    }

    // Buscar dados conforme o tipo
    let dadosRelatorio;
    if (dados) {
      dadosRelatorio = dados;
    } else {
      dadosRelatorio = await buscarDadosFinanceiros(tipo, data_inicio, data_fim);
    }

    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Criar abas conforme o tipo
    switch (tipo) {
      case 'financeiro':
      case 'vendas':
      case 'contratos':
      case 'locacoes':
      case 'estoque':
        criarAbaGenerica(workbook, dadosRelatorio, tipo, data_inicio, data_fim);
        break;
      case 'fluxo-caixa':
        criarAbaFluxoCaixa(workbook, dadosRelatorio, data_inicio, data_fim);
        break;
      case 'faturamento':
        criarAbaFaturamento(workbook, dadosRelatorio, data_inicio, data_fim);
        break;
      case 'contas-receber':
        criarAbaContasReceber(workbook, dadosRelatorio, data_inicio, data_fim);
        break;
      case 'contas-pagar':
        criarAbaContasPagar(workbook, dadosRelatorio, data_inicio, data_fim);
        break;
      case 'impostos':
        criarAbaImpostos(workbook, dadosRelatorio, data_inicio, data_fim);
        break;
      case 'rentabilidade':
        criarAbaRentabilidade(workbook, dadosRelatorio, data_inicio, data_fim);
        break;
      default:
        criarAbaGenerica(workbook, dadosRelatorio, tipo, data_inicio, data_fim);
    }

    // Gerar buffer do arquivo Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers da resposta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${tipo}-${data_inicio}-${data_fim}.xlsx`);
    res.setHeader('Content-Length', buffer.length);

    // Enviar arquivo
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao gerar Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar Excel',
      message: error.message
    });
  }
});

// ============================================
// FUNÇÕES AUXILIARES - PDF
// ============================================

function renderizarFluxoCaixaPDF(doc, dados) {
  doc.fontSize(14).font('Helvetica-Bold').text('Fluxo de Caixa', { underline: true });
  doc.moveDown(1);

  if (dados.fluxoCaixa && dados.fluxoCaixa.length > 0) {
    // Cabeçalho da tabela
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 200;
    const col3 = 350;
    const col4 = 480;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Período', col1, tableTop);
    doc.text('Entradas', col2, tableTop);
    doc.text('Saídas', col3, tableTop);
    doc.text('Saldo', col4, tableTop);

    // Linhas da tabela
    let y = tableTop + 20;
    doc.fontSize(9).font('Helvetica');

    dados.fluxoCaixa.forEach(item => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const periodo = item.mes || item.dia || item.hora || '-';
      doc.text(periodo, col1, y);
      doc.text(`R$ ${formatarMoeda(item.entrada)}`, col2, y);
      doc.text(`R$ ${formatarMoeda(item.saida)}`, col3, y);
      doc.text(`R$ ${formatarMoeda(item.entrada - item.saida)}`, col4, y);
      y += 20;
    });
  }

  // Resumo
  if (dados.saldoAtual) {
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Saldo Atual: R$ ${formatarMoeda(dados.saldoAtual)}`, { align: 'right' });
  }
}

function renderizarFaturamentoPDF(doc, dados) {
  doc.fontSize(14).font('Helvetica-Bold').text('Relatório de Faturamento', { underline: true });
  doc.moveDown(1);

  if (dados.resumo) {
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total de Vendas: R$ ${formatarMoeda(dados.resumo.total_vendas || 0)}`);
    doc.text(`Total de Locações: R$ ${formatarMoeda(dados.resumo.total_locacoes || 0)}`);
    doc.text(`Total Geral: R$ ${formatarMoeda(dados.resumo.total_faturamento || 0)}`);
    doc.moveDown(1);
  }

  // Renderizar dados por tipo
  if (dados.data && dados.data.tipos) {
    doc.fontSize(12).font('Helvetica-Bold').text('Faturamento por Tipo:', { underline: true });
    doc.moveDown(0.5);
    
    dados.data.tipos.forEach(tipo => {
      doc.fontSize(10).font('Helvetica');
      doc.text(`${tipo.tipo}: R$ ${formatarMoeda(tipo.total)} (${tipo.quantidade} itens) - ${tipo.percentual}%`);
    });
  }
}

function renderizarContasReceberPDF(doc, dados) {
  doc.fontSize(14).font('Helvetica-Bold').text('Contas a Receber', { underline: true });
  doc.moveDown(1);

  if (dados.alertas) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('red');
    doc.text(`Vencidas: ${dados.alertas.vencidas.quantidade} contas - R$ ${formatarMoeda(dados.alertas.vencidas.valor_total)}`);
    doc.fillColor('orange');
    doc.text(`Vencendo: ${dados.alertas.vencendo.quantidade} contas - R$ ${formatarMoeda(dados.alertas.vencendo.valor_total)}`);
    doc.fillColor('black');
    doc.moveDown(1);
  }
}

function renderizarContasPagarPDF(doc, dados) {
  doc.fontSize(14).font('Helvetica-Bold').text('Contas a Pagar', { underline: true });
  doc.moveDown(1);

  if (dados.alertas) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('red');
    doc.text(`Vencidas: ${dados.alertas.vencidas.quantidade} contas - R$ ${formatarMoeda(dados.alertas.vencidas.valor_total)}`);
    doc.fillColor('orange');
    doc.text(`Vencendo: ${dados.alertas.vencendo.quantidade} contas - R$ ${formatarMoeda(dados.alertas.vencendo.valor_total)}`);
    doc.fillColor('black');
    doc.moveDown(1);
  }
}

function renderizarImpostosPDF(doc, dados) {
  doc.fontSize(14).font('Helvetica-Bold').text('Relatório de Impostos', { underline: true });
  doc.moveDown(1);

  if (dados.impostos) {
    doc.fontSize(11).font('Helvetica');
    Object.keys(dados.impostos).forEach(imposto => {
      doc.text(`${imposto.toUpperCase()}: R$ ${formatarMoeda(dados.impostos[imposto])}`);
    });
  }
}

function renderizarRentabilidadePDF(doc, dados) {
  doc.fontSize(14).font('Helvetica-Bold').text('Análise de Rentabilidade', { underline: true });
  doc.moveDown(1);

  if (dados.data && Array.isArray(dados.data)) {
    dados.data.forEach((grua, index) => {
      if (index > 0 && doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`${grua.grua_nome} (${grua.modelo})`);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Receitas: R$ ${formatarMoeda(grua.receitas)}`);
      doc.text(`Custos: R$ ${formatarMoeda(grua.custos)}`);
      doc.text(`Lucro: R$ ${formatarMoeda(grua.lucro)}`);
      doc.text(`Margem de Lucro: ${grua.margem_lucro}%`);
      doc.text(`ROI: ${grua.roi}%`);
      doc.moveDown(1);
    });
  }
}

function renderizarRelatorioGenericoPDF(doc, dados) {
  if (dados.resumo) {
    // Relatório Financeiro Consolidado
    doc.fontSize(16).font('Helvetica-Bold').text('RESUMO FINANCEIRO', { underline: true, align: 'center' });
    doc.moveDown(1.5);
    
    // RECEITAS
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0066cc').text('RECEITAS', { underline: true });
    doc.fillColor('black');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    if (dados.resumo.receitasVendas > 0) {
      doc.text(`  • Vendas: R$ ${formatarMoeda(dados.resumo.receitasVendas)}`);
    }
    if (dados.resumo.receitasLocacoes > 0) {
      doc.text(`  • Locações: R$ ${formatarMoeda(dados.resumo.receitasLocacoes)}`);
    }
    if (dados.resumo.receitasMedicoes > 0) {
      doc.text(`  • Medições: R$ ${formatarMoeda(dados.resumo.receitasMedicoes)}`);
    }
    if (dados.resumo.receitasRecebidasPagas > 0) {
      doc.text(`  • Contas Recebidas: R$ ${formatarMoeda(dados.resumo.receitasRecebidasPagas)}`);
    }
    
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066cc');
    doc.text(`TOTAL DE RECEITAS: R$ ${formatarMoeda(dados.resumo.totalReceitas)}`);
    doc.fillColor('black');
    doc.moveDown(1.5);
    
    // DESPESAS
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#cc0000').text('DESPESAS', { underline: true });
    doc.fillColor('black');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    if (dados.resumo.despesasContasPagar > 0) {
      doc.text(`  • Contas a Pagar: R$ ${formatarMoeda(dados.resumo.despesasContasPagar)}`);
    }
    if (dados.resumo.despesasImpostos > 0) {
      doc.text(`  • Impostos: R$ ${formatarMoeda(dados.resumo.despesasImpostos)}`);
    }
    
    // Custos Operacionais
    if (dados.resumo.totalCustosOperacionais > 0) {
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica-Bold').text('  Custos Operacionais:');
      doc.fontSize(10).font('Helvetica');
      if (dados.resumo.custosSalarios > 0) {
        doc.text(`    ◦ Salários: R$ ${formatarMoeda(dados.resumo.custosSalarios)}`);
      }
      if (dados.resumo.custosMateriais > 0) {
        doc.text(`    ◦ Materiais: R$ ${formatarMoeda(dados.resumo.custosMateriais)}`);
      }
      if (dados.resumo.custosServicos > 0) {
        doc.text(`    ◦ Serviços: R$ ${formatarMoeda(dados.resumo.custosServicos)}`);
      }
      if (dados.resumo.custosManutencao > 0) {
        doc.text(`    ◦ Manutenção: R$ ${formatarMoeda(dados.resumo.custosManutencao)}`);
      }
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`    Subtotal Custos: R$ ${formatarMoeda(dados.resumo.totalCustosOperacionais)}`);
      doc.font('Helvetica');
    }
    
    if (dados.resumo.despesasCompras > 0) {
      doc.moveDown(0.3);
      doc.text(`  • Compras: R$ ${formatarMoeda(dados.resumo.despesasCompras)}`);
    }
    
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#cc0000');
    doc.text(`TOTAL DE DESPESAS: R$ ${formatarMoeda(dados.resumo.totalDespesas)}`);
    doc.fillColor('black');
    doc.moveDown(1.5);
    
    // RESULTADO
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold');
    const lucro = dados.resumo.lucroOperacional;
    doc.fillColor(lucro >= 0 ? '#00aa00' : '#cc0000');
    doc.text(`LUCRO OPERACIONAL: R$ ${formatarMoeda(lucro)}`, { underline: true });
    doc.fillColor('black');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);
    
    // INDICADORES
    doc.fontSize(13).font('Helvetica-Bold').text('OUTROS INDICADORES');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Saldo Bancário Atual: R$ ${formatarMoeda(dados.resumo.saldoBancario)}`);
    doc.text(`Contas a Receber (Pendentes): R$ ${formatarMoeda(dados.resumo.totalReceber)}`);
    doc.text(`Contas a Pagar (Pendentes): R$ ${formatarMoeda(dados.resumo.totalPagar)}`);
    doc.moveDown(2);

    // Contas a Receber
    if (dados.contasReceber?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('Contas a Receber', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      
      dados.contasReceber.slice(0, 10).forEach((conta, idx) => {
        doc.text(`${idx + 1}. ${conta.descricao || 'N/A'} - R$ ${formatarMoeda(conta.valor)} - Venc: ${formatarData(conta.data_vencimento)}`);
      });
      
      if (dados.contasReceber.length > 10) {
        doc.text(`... e mais ${dados.contasReceber.length - 10} contas`);
      }
      doc.moveDown(1);
    }

    // Contas a Pagar
    if (dados.contasPagar?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('Contas a Pagar', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      
      dados.contasPagar.slice(0, 10).forEach((conta, idx) => {
        doc.text(`${idx + 1}. ${conta.descricao || 'N/A'} - R$ ${formatarMoeda(conta.valor)} - Venc: ${formatarData(conta.data_vencimento)}`);
      });
      
      if (dados.contasPagar.length > 10) {
        doc.text(`... e mais ${dados.contasPagar.length - 10} contas`);
      }
      doc.moveDown(1);
    }

    // Vendas
    if (dados.vendas?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('Vendas Recentes', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      
      dados.vendas.slice(0, 10).forEach((venda, idx) => {
        doc.text(`${idx + 1}. Venda #${venda.id} - R$ ${formatarMoeda(venda.valor_total)} - ${formatarData(venda.data_venda)}`);
      });
      
      if (dados.vendas.length > 10) {
        doc.text(`... e mais ${dados.vendas.length - 10} vendas`);
      }
      doc.moveDown(1);
    }

    // Impostos
    if (dados.impostos?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('Impostos', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      
      dados.impostos.slice(0, 10).forEach((imposto, idx) => {
        doc.text(`${idx + 1}. ${imposto.tipo_imposto || 'N/A'} - R$ ${formatarMoeda(imposto.valor)} - ${imposto.status || 'pendente'}`);
      });
      
      if (dados.impostos.length > 10) {
        doc.text(`... e mais ${dados.impostos.length - 10} impostos`);
      }
    }
  } else if (dados.data && Array.isArray(dados.data)) {
    // Relatório genérico com array de dados
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total de registros: ${dados.data.length}`);
    doc.moveDown(1);
    
    dados.data.slice(0, 20).forEach((item, idx) => {
      doc.fontSize(10).text(`${idx + 1}. ${JSON.stringify(item).substring(0, 100)}...`);
    });
    
    if (dados.data.length > 20) {
      doc.text(`... e mais ${dados.data.length - 20} registros`);
    }
  } else {
    // Fallback: mostrar JSON
    doc.fontSize(10).font('Helvetica');
    doc.text(JSON.stringify(dados, null, 2), { width: 500 });
  }
}

// ============================================
// FUNÇÕES AUXILIARES - EXCEL
// ============================================

function criarAbaFluxoCaixa(workbook, dados, data_inicio, data_fim) {
  // Aba: Resumo
  const resumoData = [
    ['Relatório de Fluxo de Caixa'],
    [`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`],
    [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
    [],
    ['Saldo Atual', dados.saldoAtual || 0],
    ['Total a Receber Hoje', dados.receberHoje || 0],
    ['Total a Pagar Hoje', dados.pagarHoje || 0]
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

  // Aba: Fluxo de Caixa
  if (dados.fluxoCaixa && dados.fluxoCaixa.length > 0) {
    const fluxoData = dados.fluxoCaixa.map(item => ({
      'Período': item.mes || item.dia || item.hora,
      'Entradas': item.entrada || 0,
      'Saídas': item.saida || 0,
      'Saldo': (item.entrada || 0) - (item.saida || 0)
    }));
    const wsFluxo = XLSX.utils.json_to_sheet(fluxoData);
    XLSX.utils.book_append_sheet(workbook, wsFluxo, 'Fluxo de Caixa');
  }
}

function criarAbaFaturamento(workbook, dados, data_inicio, data_fim) {
  // Aba: Resumo
  const resumoData = [
    ['Relatório de Faturamento'],
    [`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`],
    [],
    ['Total de Vendas', dados.resumo?.total_vendas || 0],
    ['Total de Locações', dados.resumo?.total_locacoes || 0],
    ['Total Geral', dados.resumo?.total_faturamento || 0]
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

  // Aba: Por Tipo
  if (dados.data && dados.data.tipos) {
    const tiposData = dados.data.tipos.map(tipo => ({
      'Tipo': tipo.tipo,
      'Total': tipo.total,
      'Quantidade': tipo.quantidade,
      'Percentual': `${tipo.percentual}%`
    }));
    const wsTipos = XLSX.utils.json_to_sheet(tiposData);
    XLSX.utils.book_append_sheet(workbook, wsTipos, 'Por Tipo');
  }
}

function criarAbaContasReceber(workbook, dados, data_inicio, data_fim) {
  const resumoData = [
    ['Contas a Receber'],
    [`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`],
    [],
    ['Vencidas', dados.alertas?.vencidas?.quantidade || 0, dados.alertas?.vencidas?.valor_total || 0],
    ['Vencendo', dados.alertas?.vencendo?.quantidade || 0, dados.alertas?.vencendo?.valor_total || 0]
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(workbook, wsResumo, 'Contas a Receber');
}

function criarAbaContasPagar(workbook, dados, data_inicio, data_fim) {
  const resumoData = [
    ['Contas a Pagar'],
    [`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`],
    [],
    ['Vencidas', dados.alertas?.vencidas?.quantidade || 0, dados.alertas?.vencidas?.valor_total || 0],
    ['Vencendo', dados.alertas?.vencendo?.quantidade || 0, dados.alertas?.vencendo?.valor_total || 0]
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(workbook, wsResumo, 'Contas a Pagar');
}

function criarAbaImpostos(workbook, dados, data_inicio, data_fim) {
  const impostoData = [
    ['Relatório de Impostos'],
    [`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`],
    [],
    ['Imposto', 'Valor']
  ];

  if (dados.impostos) {
    Object.keys(dados.impostos).forEach(imposto => {
      impostoData.push([imposto.toUpperCase(), dados.impostos[imposto]]);
    });
  }

  const wsImpostos = XLSX.utils.aoa_to_sheet(impostoData);
  XLSX.utils.book_append_sheet(workbook, wsImpostos, 'Impostos');
}

function criarAbaRentabilidade(workbook, dados, data_inicio, data_fim) {
  if (dados.data && Array.isArray(dados.data)) {
    const rentabilidadeData = dados.data.map(grua => ({
      'Grua': grua.grua_nome,
      'Modelo': grua.modelo,
      'Receitas': grua.receitas,
      'Custos': grua.custos,
      'Lucro': grua.lucro,
      'Margem (%)': grua.margem_lucro,
      'ROI (%)': grua.roi,
      'Taxa Utilização (%)': grua.taxa_utilizacao
    }));

    const wsRentabilidade = XLSX.utils.json_to_sheet(rentabilidadeData);
    XLSX.utils.book_append_sheet(workbook, wsRentabilidade, 'Rentabilidade');
  }
}

function criarAbaGenerica(workbook, dados, tipo, data_inicio, data_fim) {
  if (tipo === 'financeiro' && dados.resumo) {
    // Aba: Resumo
    const resumoData = [
      ['Relatório Financeiro Consolidado'],
      [`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`],
      [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
      [],
      ['RECEITAS'],
      ['  Vendas', `R$ ${formatarMoeda(dados.resumo.receitasVendas)}`],
      ['  Locações', `R$ ${formatarMoeda(dados.resumo.receitasLocacoes)}`],
      ['  Medições', `R$ ${formatarMoeda(dados.resumo.receitasMedicoes)}`],
      ['  Contas Recebidas', `R$ ${formatarMoeda(dados.resumo.receitasRecebidasPagas)}`],
      ['TOTAL DE RECEITAS', `R$ ${formatarMoeda(dados.resumo.totalReceitas)}`],
      [],
      ['DESPESAS'],
      ['  Contas a Pagar', `R$ ${formatarMoeda(dados.resumo.despesasContasPagar)}`],
      ['  Impostos', `R$ ${formatarMoeda(dados.resumo.despesasImpostos)}`],
      ['  Custos Operacionais:'],
      ['    • Salários', `R$ ${formatarMoeda(dados.resumo.custosSalarios)}`],
      ['    • Materiais', `R$ ${formatarMoeda(dados.resumo.custosMateriais)}`],
      ['    • Serviços', `R$ ${formatarMoeda(dados.resumo.custosServicos)}`],
      ['    • Manutenção', `R$ ${formatarMoeda(dados.resumo.custosManutencao)}`],
      ['    Subtotal Custos', `R$ ${formatarMoeda(dados.resumo.totalCustosOperacionais)}`],
      ['  Compras', `R$ ${formatarMoeda(dados.resumo.despesasCompras)}`],
      ['TOTAL DE DESPESAS', `R$ ${formatarMoeda(dados.resumo.totalDespesas)}`],
      [],
      ['LUCRO OPERACIONAL', `R$ ${formatarMoeda(dados.resumo.lucroOperacional)}`],
      [],
      ['OUTROS INDICADORES'],
      ['Saldo Bancário Atual', `R$ ${formatarMoeda(dados.resumo.saldoBancario)}`],
      ['Contas a Receber (Pendentes)', `R$ ${formatarMoeda(dados.resumo.totalReceber)}`],
      ['Contas a Pagar (Pendentes)', `R$ ${formatarMoeda(dados.resumo.totalPagar)}`]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

    // Aba: Contas a Receber
    if (dados.contasReceber?.length > 0) {
      const receberData = dados.contasReceber.map(conta => ({
        'ID': conta.id,
        'Descrição': conta.descricao,
        'Valor': conta.valor,
        'Data Vencimento': formatarData(conta.data_vencimento),
        'Status': conta.status,
        'Cliente': conta.cliente_id
      }));
      const wsReceber = XLSX.utils.json_to_sheet(receberData);
      XLSX.utils.book_append_sheet(workbook, wsReceber, 'Contas a Receber');
    }

    // Aba: Contas a Pagar
    if (dados.contasPagar?.length > 0) {
      const pagarData = dados.contasPagar.map(conta => ({
        'ID': conta.id,
        'Descrição': conta.descricao,
        'Valor': conta.valor,
        'Data Vencimento': formatarData(conta.data_vencimento),
        'Status': conta.status,
        'Fornecedor': conta.fornecedor_id
      }));
      const wsPagar = XLSX.utils.json_to_sheet(pagarData);
      XLSX.utils.book_append_sheet(workbook, wsPagar, 'Contas a Pagar');
    }

    // Aba: Vendas
    if (dados.vendas?.length > 0) {
      const vendasData = dados.vendas.map(venda => ({
        'ID': venda.id,
        'Cliente': venda.cliente_id,
        'Valor Total': venda.valor_total,
        'Data Venda': formatarData(venda.data_venda),
        'Status': venda.status
      }));
      const wsVendas = XLSX.utils.json_to_sheet(vendasData);
      XLSX.utils.book_append_sheet(workbook, wsVendas, 'Vendas');
    }

    // Aba: Impostos
    if (dados.impostos?.length > 0) {
      const impostosData = dados.impostos.map(imposto => ({
        'ID': imposto.id,
        'Tipo': imposto.tipo_imposto,
        'Valor': imposto.valor,
        'Data Vencimento': formatarData(imposto.data_vencimento),
        'Status': imposto.status,
        'Competência': imposto.mes_competencia
      }));
      const wsImpostos = XLSX.utils.json_to_sheet(impostosData);
      XLSX.utils.book_append_sheet(workbook, wsImpostos, 'Impostos');
    }

    // Aba: Custos Operacionais
    if (dados.custos?.length > 0) {
      const custosData = dados.custos.map(custo => ({
        'ID': custo.id,
        'Tipo': custo.tipo,
        'Descrição': custo.descricao,
        'Valor': custo.valor,
        'Data': formatarData(custo.data_custo),
        'Obra ID': custo.obra_id,
        'Status': custo.status
      }));
      const wsCustos = XLSX.utils.json_to_sheet(custosData);
      XLSX.utils.book_append_sheet(workbook, wsCustos, 'Custos Operacionais');
    }

    // Aba: Compras
    if (dados.compras?.length > 0) {
      const comprasData = dados.compras.map(compra => ({
        'ID': compra.id,
        'Número Pedido': compra.numero_pedido,
        'Fornecedor ID': compra.fornecedor_id,
        'Valor Total': compra.valor_total,
        'Data Pedido': formatarData(compra.data_pedido),
        'Data Entrega': compra.data_entrega ? formatarData(compra.data_entrega) : 'N/A',
        'Status': compra.status
      }));
      const wsCompras = XLSX.utils.json_to_sheet(comprasData);
      XLSX.utils.book_append_sheet(workbook, wsCompras, 'Compras');
    }
  } else if (dados.data && Array.isArray(dados.data) && dados.data.length > 0) {
    // Para outros tipos com array de dados
    const ws = XLSX.utils.json_to_sheet(dados.data);
    XLSX.utils.book_append_sheet(workbook, ws, tipo || 'Dados');
  } else {
    // Fallback genérico
    const genericoData = [
      [`Relatório: ${tipo}`],
      [`Período: ${formatarData(data_inicio)} a ${formatarData(data_fim)}`],
      [],
      ['Nenhum dado disponível para o período selecionado']
    ];
    const wsGenerico = XLSX.utils.aoa_to_sheet(genericoData);
    XLSX.utils.book_append_sheet(workbook, wsGenerico, 'Dados');
  }
}

// ============================================
// FUNÇÕES DE BUSCA DE DADOS
// ============================================

async function buscarDadosFinanceiros(tipo, data_inicio, data_fim) {
  // Implementação básica - pode ser expandida
  switch (tipo) {
    case 'financeiro': {
      // Buscar dados consolidados de várias tabelas
      const [contasReceber, contasPagar, vendas, impostos, contas, locacoes, medicoes, custos, compras] = await Promise.all([
        supabaseAdmin
          .from('contas_receber')
          .select('*')
          .gte('data_vencimento', data_inicio)
          .lte('data_vencimento', data_fim),
        supabaseAdmin
          .from('contas_pagar')
          .select('*')
          .gte('data_vencimento', data_inicio)
          .lte('data_vencimento', data_fim),
        supabaseAdmin
          .from('vendas')
          .select('*')
          .gte('data_venda', data_inicio)
          .lte('data_venda', data_fim),
        supabaseAdmin
          .from('impostos_financeiros')
          .select('*')
          .gte('data_vencimento', data_inicio)
          .lte('data_vencimento', data_fim),
        supabaseAdmin
          .from('contas_bancarias')
          .select('*'),
        supabaseAdmin
          .from('locacoes')
          .select('*')
          .gte('data_inicio', data_inicio),
        supabaseAdmin
          .from('medicoes')
          .select('*')
          .gte('data_medicao', data_inicio)
          .lte('data_medicao', data_fim),
        supabaseAdmin
          .from('custos')
          .select('*')
          .gte('data_custo', data_inicio)
          .lte('data_custo', data_fim),
        supabaseAdmin
          .from('compras')
          .select('*')
          .gte('data_pedido', data_inicio)
          .lte('data_pedido', data_fim)
      ]);

      // RECEITAS: Vendas + Locações + Medições + Contas Receber pagas
      const receitasVendas = vendas.data?.reduce((sum, v) => sum + (v.valor_total || 0), 0) || 0;
      const receitasLocacoes = locacoes.data?.reduce((sum, l) => sum + (l.valor_mensal || 0), 0) || 0;
      const receitasMedicoes = medicoes.data?.reduce((sum, m) => sum + (m.valor || 0), 0) || 0;
      const receitasRecebidasPagas = contasReceber.data?.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const totalReceitas = receitasVendas + receitasLocacoes + receitasMedicoes + receitasRecebidasPagas;

      // DESPESAS: Contas a Pagar + Impostos + Custos Operacionais + Compras
      const despesasContasPagar = contasPagar.data?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const despesasImpostos = impostos.data?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
      
      // Custos Operacionais por tipo
      const custosSalarios = custos.data?.filter(c => c.tipo === 'salario').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const custosMateriais = custos.data?.filter(c => c.tipo === 'material').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const custosServicos = custos.data?.filter(c => c.tipo === 'servico').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const custosManutencao = custos.data?.filter(c => c.tipo === 'manutencao').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const totalCustosOperacionais = custosSalarios + custosMateriais + custosServicos + custosManutencao;
      
      // Compras (excluir canceladas)
      const despesasCompras = compras.data?.filter(c => c.status !== 'cancelado').reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0;
      
      const totalDespesas = despesasContasPagar + despesasImpostos + totalCustosOperacionais + despesasCompras;

      // A RECEBER: Contas a receber pendentes
      const totalReceber = contasReceber.data?.filter(c => c.status === 'pendente' || c.status === 'atrasado').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;

      // A PAGAR: Contas a pagar e impostos pendentes
      const totalPagar = contasPagar.data?.filter(c => c.status === 'pendente' || c.status === 'atrasado').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const impostosPendentes = impostos.data?.filter(i => i.status === 'pendente' || i.status === 'atrasado').reduce((sum, i) => sum + (i.valor || 0), 0) || 0;

      const saldoBancario = contas.data?.reduce((sum, c) => sum + (c.saldo || 0), 0) || 0;

      return {
        resumo: {
          totalReceitas,
          totalDespesas,
          totalReceber,
          totalPagar: totalPagar + impostosPendentes,
          saldoBancario,
          lucroOperacional: totalReceitas - totalDespesas,
          // Detalhamento de receitas
          receitasVendas,
          receitasLocacoes,
          receitasMedicoes,
          receitasRecebidasPagas,
          // Detalhamento de despesas
          despesasContasPagar,
          despesasImpostos,
          // Custos Operacionais
          custosSalarios,
          custosMateriais,
          custosServicos,
          custosManutencao,
          totalCustosOperacionais,
          // Compras
          despesasCompras
        },
        contasReceber: contasReceber.data || [],
        contasPagar: contasPagar.data || [],
        vendas: vendas.data || [],
        impostos: impostos.data || [],
        locacoes: locacoes.data || [],
        medicoes: medicoes.data || [],
        custos: custos.data || [],
        compras: compras.data || [],
        contasBancarias: contas.data || []
      };
    }

    case 'contas-receber':
      const { data: contasReceber } = await supabaseAdmin
        .from('contas_receber')
        .select('*')
        .gte('data_vencimento', data_inicio)
        .lte('data_vencimento', data_fim);
      return { data: contasReceber };

    case 'contas-pagar':
      const { data: contasPagar } = await supabaseAdmin
        .from('contas_pagar')
        .select('*')
        .gte('data_vencimento', data_inicio)
        .lte('data_vencimento', data_fim);
      return { data: contasPagar };

    case 'vendas': {
      const { data: vendas } = await supabaseAdmin
        .from('vendas')
        .select('*')
        .gte('data_venda', data_inicio)
        .lte('data_venda', data_fim);
      return { data: vendas };
    }

    case 'faturamento': {
      const [vendas, locacoes] = await Promise.all([
        supabaseAdmin
          .from('vendas')
          .select('*')
          .gte('data_venda', data_inicio)
          .lte('data_venda', data_fim),
        supabaseAdmin
          .from('locacoes')
          .select('*')
          .gte('data_inicio', data_inicio)
      ]);

      const totalVendas = vendas.data?.reduce((sum, v) => sum + (v.valor_total || 0), 0) || 0;
      const totalLocacoes = locacoes.data?.reduce((sum, l) => sum + (l.valor_mensal || 0), 0) || 0;

      return {
        resumo: {
          totalVendas,
          totalLocacoes,
          totalGeral: totalVendas + totalLocacoes
        },
        vendas: vendas.data || [],
        locacoes: locacoes.data || []
      };
    }

    case 'impostos': {
      const { data: impostos } = await supabaseAdmin
        .from('impostos_financeiros')
        .select('*')
        .gte('data_vencimento', data_inicio)
        .lte('data_vencimento', data_fim);
      
      const total = impostos?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
      const pago = impostos?.filter(i => i.status === 'pago').reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
      
      return {
        resumo: {
          total,
          pago,
          pendente: total - pago
        },
        data: impostos || []
      };
    }

    case 'contratos': {
      const { data: contratos } = await supabaseAdmin
        .from('contratos')
        .select('*')
        .gte('data_inicio', data_inicio)
        .lte('data_inicio', data_fim);
      return { data: contratos };
    }

    case 'locacoes': {
      const { data: locacoes } = await supabaseAdmin
        .from('locacoes')
        .select('*')
        .gte('data_inicio', data_inicio);
      return { data: locacoes };
    }

    case 'estoque': {
      const { data: estoque } = await supabaseAdmin
        .from('produtos')
        .select('*');
      return { data: estoque };
    }

    default:
      return {};
  }
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0);
}

function formatarData(data) {
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default router;

