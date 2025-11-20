import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { adicionarLogosNoCabecalho, adicionarRodapeEmpresa, adicionarLogosEmTodasAsPaginas } from '../utils/pdf-logos.js';

const router = express.Router();

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
          cnpj_cpf
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
    doc.text(`CNPJ/CPF: ${orcamento.clientes?.cnpj_cpf || '-'}`, 40, yPos, { align: 'center' });
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
        doc.addPage();
        yPos = 40;
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
            doc.addPage();
            yPos = 40;
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
            doc.addPage();
            yPos = 40;
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
            doc.addPage();
            yPos = 40;
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
            doc.addPage();
            yPos = 40;
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

export default router;

