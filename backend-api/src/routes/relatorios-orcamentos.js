import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

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

const formatarDataHora = (data) => {
  if (!data) return '-';
  try {
    const d = new Date(data);
    return d.toLocaleString('pt-BR');
  } catch {
    return data.toString();
  }
};

/**
 * GET /api/relatorios/orcamentos/:id/pdf
 * Gerar PDF do orçamento no formato GR2025064-1
 */
router.get('/orcamentos/:id/pdf', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar orçamento completo com todos os relacionamentos
    const { data: orcamento, error: orcamentoError } = await supabaseAdmin
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          cnpj_cpf,
          endereco,
          bairro,
          cidade,
          estado,
          cep,
          telefone,
          email,
          contato
        ),
        funcionarios:vendedor_id (
          id,
          nome,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (orcamentoError || !orcamento) {
      return res.status(404).json({
        success: false,
        error: 'Orçamento não encontrado',
        message: orcamentoError?.message || 'Orçamento não encontrado'
      });
    }

    // Buscar todos os itens relacionados
    const [
      { data: valoresFixos },
      { data: custosMensais },
      { data: horasExtras },
      { data: servicosAdicionais }
    ] = await Promise.all([
      supabaseAdmin.from('orcamento_valores_fixos').select('*').eq('orcamento_id', id).order('id'),
      supabaseAdmin.from('orcamento_custos_mensais').select('*').eq('orcamento_id', id).order('id'),
      supabaseAdmin.from('orcamento_horas_extras').select('*').eq('orcamento_id', id).order('id'),
      supabaseAdmin.from('orcamento_servicos_adicionais').select('*').eq('orcamento_id', id).order('id')
    ]);

    // Criar documento PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: `Orçamento ${orcamento.numero || id}`,
        Author: 'Sistema de Gerenciamento de Gruas',
        Subject: 'Orçamento de Locação de Grua',
        Creator: 'Sistema IRBANA'
      }
    });

    // Configurar headers da resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=orcamento-${orcamento.numero || id}.pdf`);

    // Pipe do documento para a resposta
    doc.pipe(res);

    let yPos = 40;

    // ===== CABEÇALHO =====
    doc.fontSize(16).font('Helvetica-Bold').text('ORÇAMENTO DE LOCAÇÃO DE GRUA', 40, yPos, { align: 'center' });
    yPos += 25;
    
    doc.fontSize(12).font('Helvetica').text(`Nº ${orcamento.numero || `GR${id}`}`, 40, yPos, { align: 'center' });
    yPos += 20;

    // Linha separadora
    doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
    yPos += 15;

    // ===== DADOS DO CLIENTE =====
    doc.fontSize(11).font('Helvetica-Bold').text('DADOS DO CLIENTE', 40, yPos);
    yPos += 15;
    doc.fontSize(10).font('Helvetica');
    
    const cliente = orcamento.clientes || {};
    doc.text(`Nome: ${cliente.nome || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`CNPJ/CPF: ${cliente.cnpj_cpf || '-'}`, 40, yPos);
    yPos += 12;
    
    const enderecoCliente = [
      orcamento.cliente_endereco || cliente.endereco,
      orcamento.cliente_bairro || cliente.bairro,
      orcamento.cliente_cidade || cliente.cidade,
      orcamento.cliente_estado || cliente.estado,
      orcamento.cliente_cep || cliente.cep
    ].filter(Boolean).join(', ');
    
    if (enderecoCliente) {
      doc.text(`Endereço: ${enderecoCliente}`, 40, yPos);
      yPos += 12;
    }
    
    doc.text(`Telefone: ${orcamento.cliente_telefone || cliente.telefone || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Email: ${orcamento.cliente_email || cliente.email || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Contato: ${orcamento.cliente_contato || cliente.contato || '-'}`, 40, yPos);
    yPos += 20;

    // ===== DADOS DA OBRA =====
    doc.fontSize(11).font('Helvetica-Bold').text('DADOS DA OBRA', 40, yPos);
    yPos += 15;
    doc.fontSize(10).font('Helvetica');
    
    doc.text(`Nome da Obra: ${orcamento.obra_nome || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Tipo: ${orcamento.obra_tipo || '-'}`, 40, yPos);
    yPos += 12;
    
    const enderecoObra = [
      orcamento.obra_endereco,
      orcamento.obra_bairro,
      orcamento.obra_cidade,
      orcamento.obra_cep
    ].filter(Boolean).join(', ');
    
    if (enderecoObra) {
      doc.text(`Endereço: ${enderecoObra}`, 40, yPos);
      yPos += 12;
    }
    
    doc.text(`Engenheiro Responsável: ${orcamento.obra_engenheiro_responsavel || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Contato: ${orcamento.obra_contato || '-'}`, 40, yPos);
    yPos += 20;

    // ===== DADOS DA GRUA =====
    doc.fontSize(11).font('Helvetica-Bold').text('DADOS DA GRUA', 40, yPos);
    yPos += 15;
    doc.fontSize(10).font('Helvetica');
    
    doc.text(`Modelo: ${orcamento.grua_modelo || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Lança: ${orcamento.grua_lanca ? `${orcamento.grua_lanca}m` : '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Altura Final: ${orcamento.grua_altura_final ? `${orcamento.grua_altura_final}m` : '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Base: ${orcamento.grua_tipo_base || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Ano: ${orcamento.grua_ano || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Potência: ${orcamento.grua_potencia ? `${orcamento.grua_potencia} KVA` : '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Capacidade 1 cabo: ${orcamento.grua_capacidade_1_cabo ? `${orcamento.grua_capacidade_1_cabo}kg` : '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Capacidade 2 cabos: ${orcamento.grua_capacidade_2_cabos ? `${orcamento.grua_capacidade_2_cabos}kg` : '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Voltagem: ${orcamento.grua_voltagem || '-'}`, 40, yPos);
    yPos += 20;

    // Verificar se precisa de nova página
    if (yPos > 700) {
      doc.addPage();
      yPos = 40;
    }

    // ===== VALORES FIXOS =====
    if (valoresFixos && valoresFixos.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('VALORES FIXOS', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Tipo', 40, yPos);
      doc.text('Descrição', 120, yPos);
      doc.text('Qtd', 300, yPos);
      doc.text('Valor Unit.', 350, yPos);
      doc.text('Valor Total', 450, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      valoresFixos.forEach(item => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
        doc.text(item.tipo || '-', 40, yPos);
        doc.text(item.descricao || '-', 120, yPos, { width: 170 });
        doc.text(String(item.quantidade || 1), 300, yPos);
        doc.text(formatarMoeda(item.valor_unitario || 0), 350, yPos);
        doc.text(formatarMoeda(item.valor_total || 0), 450, yPos);
        yPos += 15;
        
        if (item.observacoes) {
          doc.fontSize(8).font('Helvetica-Oblique').text(`Obs: ${item.observacoes}`, 120, yPos, { width: 400 });
          yPos += 12;
          doc.fontSize(9).font('Helvetica');
        }
      });
      
      yPos += 10;
    }

    // ===== CUSTOS MENSAIS =====
    if (custosMensais && custosMensais.length > 0) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fontSize(11).font('Helvetica-Bold').text('CUSTOS MENSAIS', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Tipo', 40, yPos);
      doc.text('Descrição', 120, yPos);
      doc.text('Valor Mensal', 400, yPos);
      doc.text('Obrigatório', 480, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      let totalMensal = 0;
      custosMensais.forEach(item => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
        doc.text(item.tipo || '-', 40, yPos);
        doc.text(item.descricao || '-', 120, yPos, { width: 270 });
        doc.text(formatarMoeda(item.valor_mensal || 0), 400, yPos);
        doc.text(item.obrigatorio ? 'Sim' : 'Não', 480, yPos);
        yPos += 15;
        
        totalMensal += parseFloat(item.valor_mensal || 0);
        
        if (item.observacoes) {
          doc.fontSize(8).font('Helvetica-Oblique').text(`Obs: ${item.observacoes}`, 120, yPos, { width: 400 });
          yPos += 12;
          doc.fontSize(9).font('Helvetica');
        }
      });
      
      // Total mensal
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('TOTAL MENSAL:', 300, yPos);
      doc.text(formatarMoeda(totalMensal), 450, yPos);
      yPos += 20;
    }

    // ===== TABELA DE HORAS EXTRAS =====
    if (horasExtras && horasExtras.length > 0) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fontSize(11).font('Helvetica-Bold').text('TABELA DE HORAS EXTRAS', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Tipo', 40, yPos);
      doc.text('Dia da Semana', 120, yPos);
      doc.text('Valor/Hora', 400, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      horasExtras.forEach(item => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
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
        
        doc.text(tipoLabel, 40, yPos);
        doc.text(diaLabel, 120, yPos);
        doc.text(formatarMoeda(item.valor_hora || 0), 400, yPos);
        yPos += 15;
      });
      
      yPos += 10;
    }

    // ===== SERVIÇOS ADICIONAIS =====
    if (servicosAdicionais && servicosAdicionais.length > 0) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fontSize(11).font('Helvetica-Bold').text('SERVIÇOS ADICIONAIS', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Tipo', 40, yPos);
      doc.text('Descrição', 120, yPos);
      doc.text('Qtd', 300, yPos);
      doc.text('Valor Unit.', 350, yPos);
      doc.text('Valor Total', 450, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      servicosAdicionais.forEach(item => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
        doc.text(item.tipo || '-', 40, yPos);
        doc.text(item.descricao || '-', 120, yPos, { width: 170 });
        doc.text(String(item.quantidade || 1), 300, yPos);
        doc.text(formatarMoeda(item.valor_unitario || 0), 350, yPos);
        doc.text(formatarMoeda(item.valor_total || 0), 450, yPos);
        yPos += 15;
        
        if (item.observacoes) {
          doc.fontSize(8).font('Helvetica-Oblique').text(`Obs: ${item.observacoes}`, 120, yPos, { width: 400 });
          yPos += 12;
          doc.fontSize(9).font('Helvetica');
        }
      });
      
      yPos += 10;
    }

    // Verificar se precisa de nova página para condições gerais
    if (yPos > 700) {
      doc.addPage();
      yPos = 40;
    }

    // ===== CONDIÇÕES GERAIS =====
    if (orcamento.condicoes_gerais) {
      doc.fontSize(11).font('Helvetica-Bold').text('CONDIÇÕES GERAIS', 40, yPos);
      yPos += 15;
      doc.fontSize(9).font('Helvetica');
      doc.text(orcamento.condicoes_gerais, 40, yPos, { width: 515, align: 'justify' });
      yPos += doc.heightOfString(orcamento.condicoes_gerais, { width: 515 }) + 15;
    }

    // ===== LOGÍSTICA =====
    if (orcamento.logistica) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
      doc.fontSize(11).font('Helvetica-Bold').text('LOGÍSTICA', 40, yPos);
      yPos += 15;
      doc.fontSize(9).font('Helvetica');
      doc.text(orcamento.logistica, 40, yPos, { width: 515, align: 'justify' });
      yPos += doc.heightOfString(orcamento.logistica, { width: 515 }) + 15;
    }

    // ===== GARANTIAS =====
    if (orcamento.garantias) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
      doc.fontSize(11).font('Helvetica-Bold').text('GARANTIAS', 40, yPos);
      yPos += 15;
      doc.fontSize(9).font('Helvetica');
      doc.text(orcamento.garantias, 40, yPos, { width: 515, align: 'justify' });
      yPos += doc.heightOfString(orcamento.garantias, { width: 515 }) + 15;
    }

    // ===== ASSINATURAS =====
    if (yPos > 650) {
      doc.addPage();
      yPos = 40;
    }
    
    doc.fontSize(11).font('Helvetica-Bold').text('ASSINATURAS', 40, yPos);
    yPos += 40;
    
    // Linha para assinatura do cliente
    doc.fontSize(9).font('Helvetica');
    doc.text('Cliente:', 40, yPos);
    doc.moveTo(100, yPos + 5).lineTo(300, yPos + 5).stroke();
    doc.text(formatarData(orcamento.data_orcamento), 310, yPos);
    yPos += 30;
    
    // Linha para assinatura da empresa
    doc.text('Empresa:', 40, yPos);
    doc.moveTo(100, yPos + 5).lineTo(300, yPos + 5).stroke();
    doc.text(formatarData(orcamento.data_orcamento), 310, yPos);

    // ===== RODAPÉ =====
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Página ${i + 1} de ${pageCount} | Gerado em ${formatarDataHora(new Date())}`,
        40,
        doc.page.height - 30,
        { align: 'center', width: 515 }
      );
    }

    // Finalizar documento
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF do orçamento:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar PDF',
        message: error.message
      });
    }
  }
});

export default router;

