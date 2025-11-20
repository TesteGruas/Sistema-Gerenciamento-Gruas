import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { adicionarLogosNoCabecalho, adicionarRodapeEmpresa, adicionarLogosEmTodasAsPaginas, adicionarLogosNaPagina, adicionarRodapeNaPagina } from '../utils/pdf-logos.js';

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

/**
 * GET /api/relatorios/componentes-estoque/pdf
 * Gerar relatório de componentes + estoque
 */
router.get('/componentes-estoque/pdf', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { grua_id, localizacao_tipo, status, obra_id } = req.query;

    // Construir query para componentes
    let componentesQuery = supabaseAdmin
      .from('grua_componentes')
      .select(`
        *,
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante
        ),
        obras:obra_id (
          id,
          nome
        )
      `)
      .order('nome', { ascending: true });

    // Aplicar filtros
    if (grua_id) componentesQuery = componentesQuery.eq('grua_id', grua_id);
    if (localizacao_tipo) componentesQuery = componentesQuery.eq('localizacao_tipo', localizacao_tipo);
    if (status) componentesQuery = componentesQuery.eq('status', status);
    if (obra_id) componentesQuery = componentesQuery.eq('obra_id', obra_id);

    const { data: componentes, error: componentesError } = await componentesQuery;

    if (componentesError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar componentes',
        message: componentesError.message
      });
    }

    // Buscar estoque relacionado aos componentes
    const componenteIds = componentes?.map(c => c.id) || [];
    let estoqueQuery = supabaseAdmin
      .from('estoque')
      .select(`
        *,
        componentes:componente_id (
          id,
          nome
        )
      `)
      .eq('tipo_item', 'componente');

    if (componenteIds.length > 0) {
      estoqueQuery = estoqueQuery.in('componente_id', componenteIds);
    }

    const { data: estoque, error: estoqueError } = await estoqueQuery;

    if (estoqueError) {
      console.warn('Erro ao buscar estoque:', estoqueError);
    }

    // Criar mapa de estoque por componente_id
    const estoqueMap = {};
    if (estoque) {
      estoque.forEach(item => {
        if (item.componente_id) {
          estoqueMap[item.componente_id] = item;
        }
      });
    }

    // Buscar movimentações recentes (últimos 30 dias)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const { data: movimentacoes } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .select(`
        *,
        componentes:componente_id (
          id,
          nome
        )
      `)
      .eq('tipo_item', 'componente')
      .gte('data_movimentacao', dataLimite.toISOString().split('T')[0])
      .order('data_movimentacao', { ascending: false })
      .limit(100);

    // Criar documento PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: 'Relatório de Componentes e Estoque',
        Author: 'Sistema de Gerenciamento de Gruas',
        Subject: 'Relatório de Componentes + Estoque',
        Creator: 'Sistema IRBANA'
      }
    });

    // Configurar headers da resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-componentes-estoque-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe do documento para a resposta
    doc.pipe(res);

    let yPos = 40;

    // ===== LOGOS NO CABEÇALHO =====
    yPos = adicionarLogosNoCabecalho(doc, yPos);

    // ===== CABEÇALHO =====
    doc.fontSize(16).font('Helvetica-Bold').text('RELATÓRIO DE COMPONENTES E ESTOQUE', 40, yPos, { align: 'center' });
    yPos += 25;
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Gerado em: ${formatarData(new Date())}`, 40, yPos, { align: 'center' });
    yPos += 15;
    
    // Filtros aplicados
    const filtros = [];
    if (grua_id) filtros.push(`Grua: ${grua_id}`);
    if (localizacao_tipo) filtros.push(`Localização: ${localizacao_tipo}`);
    if (status) filtros.push(`Status: ${status}`);
    if (obra_id) filtros.push(`Obra: ${obra_id}`);
    
    if (filtros.length > 0) {
      doc.text(`Filtros: ${filtros.join(' | ')}`, 40, yPos, { align: 'center' });
      yPos += 15;
    }
    
    yPos += 10;

    // Linha separadora
    doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
    yPos += 15;

    // ===== RESUMO GERAL =====
    doc.fontSize(11).font('Helvetica-Bold').text('RESUMO GERAL', 40, yPos);
    yPos += 15;
    doc.fontSize(10).font('Helvetica');
    
    const totalComponentes = componentes?.length || 0;
    const totalDisponivel = componentes?.reduce((sum, c) => sum + (parseInt(c.quantidade_disponivel) || 0), 0) || 0;
    const totalEmUso = componentes?.reduce((sum, c) => sum + (parseInt(c.quantidade_em_uso) || 0), 0) || 0;
    const valorTotalEstoque = componentes?.reduce((sum, c) => {
      const estoqueItem = estoqueMap[c.id];
      return sum + (parseFloat(estoqueItem?.valor_total || c.valor_unitario * c.quantidade_total || 0));
    }, 0) || 0;
    
    doc.text(`Total de Componentes: ${totalComponentes}`, 40, yPos);
    yPos += 12;
    doc.text(`Total Disponível: ${totalDisponivel} unidades`, 40, yPos);
    yPos += 12;
    doc.text(`Total em Uso: ${totalEmUso} unidades`, 40, yPos);
    yPos += 12;
    doc.text(`Valor Total do Estoque: ${formatarMoeda(valorTotalEstoque)}`, 40, yPos);
    yPos += 20;

    // ===== COMPONENTES ALOCADOS =====
    const componentesAlocados = componentes?.filter(c => c.quantidade_em_uso > 0) || [];
    if (componentesAlocados.length > 0) {
      if (yPos > 700) {
        doc.addPage();
        // Adicionar logos na nova página
        adicionarLogosNaPagina(doc, 40);
        yPos = 40;
      }
      
      doc.fontSize(11).font('Helvetica-Bold').text('COMPONENTES ALOCADOS', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Nome', 40, yPos);
      doc.text('Grua', 150, yPos);
      doc.text('Localização', 250, yPos);
      doc.text('Qtd. Alocada', 350, yPos);
      doc.text('Vida Útil', 420, yPos);
      doc.text('Status', 480, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(8).font('Helvetica');
      componentesAlocados.forEach(comp => {
        if (yPos > 750) {
          doc.addPage();
          // Adicionar logos na nova página
          adicionarLogosNaPagina(doc, 40);
          yPos = 40;
          // Redesenhar cabeçalho
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Nome', 40, yPos);
          doc.text('Grua', 150, yPos);
          doc.text('Localização', 250, yPos);
          doc.text('Qtd. Alocada', 350, yPos);
          doc.text('Vida Útil', 420, yPos);
          doc.text('Status', 480, yPos);
          yPos += 12;
          doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
          yPos += 8;
          doc.fontSize(8).font('Helvetica');
        }
        
        const gruaNome = comp.gruas?.name || comp.gruas?.modelo || '-';
        const localizacao = comp.localizacao_tipo === 'Obra X' && comp.obras 
          ? `${comp.localizacao_tipo} - ${comp.obras.nome}`
          : comp.localizacao_tipo || '-';
        
        doc.text(comp.nome || '-', 40, yPos, { width: 100 });
        doc.text(gruaNome, 150, yPos, { width: 90 });
        doc.text(localizacao, 250, yPos, { width: 90 });
        doc.text(String(comp.quantidade_em_uso || 0), 350, yPos);
        doc.text(`${comp.vida_util_percentual || 100}%`, 420, yPos);
        doc.text(comp.status || '-', 480, yPos, { width: 70 });
        yPos += 12;
      });
      
      yPos += 10;
    }

    // ===== COMPONENTES RETORNADOS (via checklist) =====
    // Buscar componentes com status "Danificado" ou que foram retornados
    const componentesRetornados = componentes?.filter(c => 
      c.status === 'Danificado' || 
      (c.quantidade_em_uso === 0 && c.quantidade_disponivel < c.quantidade_total)
    ) || [];
    
    if (componentesRetornados.length > 0) {
      if (yPos > 700) {
        doc.addPage();
        // Adicionar logos na nova página
        adicionarLogosNaPagina(doc, 40);
        yPos = 40;
      }
      
      doc.fontSize(11).font('Helvetica-Bold').text('COMPONENTES RETORNADOS/DANIFICADOS', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Nome', 40, yPos);
      doc.text('Grua', 150, yPos);
      doc.text('Status', 250, yPos);
      doc.text('Qtd. Total', 320, yPos);
      doc.text('Qtd. Disponível', 400, yPos);
      doc.text('Vida Útil', 480, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(8).font('Helvetica');
      componentesRetornados.forEach(comp => {
        if (yPos > 750) {
          doc.addPage();
          // Adicionar logos na nova página
          adicionarLogosNaPagina(doc, 40);
          yPos = 40;
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Nome', 40, yPos);
          doc.text('Grua', 150, yPos);
          doc.text('Status', 250, yPos);
          doc.text('Qtd. Total', 320, yPos);
          doc.text('Qtd. Disponível', 400, yPos);
          doc.text('Vida Útil', 480, yPos);
          yPos += 12;
          doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
          yPos += 8;
          doc.fontSize(8).font('Helvetica');
        }
        
        const gruaNome = comp.gruas?.name || comp.gruas?.modelo || '-';
        
        doc.text(comp.nome || '-', 40, yPos, { width: 100 });
        doc.text(gruaNome, 150, yPos, { width: 90 });
        doc.text(comp.status || '-', 250, yPos, { width: 60 });
        doc.text(String(comp.quantidade_total || 0), 320, yPos);
        doc.text(String(comp.quantidade_disponivel || 0), 400, yPos);
        doc.text(`${comp.vida_util_percentual || 100}%`, 480, yPos);
        yPos += 12;
      });
      
      yPos += 10;
    }

    // ===== MOVIMENTAÇÕES RECENTES =====
    if (movimentacoes && movimentacoes.length > 0) {
      if (yPos > 700) {
        doc.addPage();
        // Adicionar logos na nova página
        adicionarLogosNaPagina(doc, 40);
        yPos = 40;
      }
      
      doc.fontSize(11).font('Helvetica-Bold').text('MOVIMENTAÇÕES RECENTES (Últimos 30 dias)', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Data', 40, yPos);
      doc.text('Componente', 100, yPos);
      doc.text('Tipo', 250, yPos);
      doc.text('Quantidade', 320, yPos);
      doc.text('Valor Total', 400, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(8).font('Helvetica');
      movimentacoes.slice(0, 30).forEach(mov => {
        if (yPos > 750) {
          doc.addPage();
          // Adicionar logos na nova página
          adicionarLogosNaPagina(doc, 40);
          yPos = 40;
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Data', 40, yPos);
          doc.text('Componente', 100, yPos);
          doc.text('Tipo', 250, yPos);
          doc.text('Quantidade', 320, yPos);
          doc.text('Valor Total', 400, yPos);
          yPos += 12;
          doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
          yPos += 8;
          doc.fontSize(8).font('Helvetica');
        }
        
        const componenteNome = mov.componentes?.nome || mov.componente_id || '-';
        const tipoLabel = mov.tipo === 'Entrada' ? 'Entrada' : mov.tipo === 'Saída' ? 'Saída' : mov.tipo;
        
        doc.text(formatarData(mov.data_movimentacao), 40, yPos);
        doc.text(componenteNome, 100, yPos, { width: 140 });
        doc.text(tipoLabel, 250, yPos, { width: 60 });
        doc.text(String(mov.quantidade || 0), 320, yPos);
        doc.text(formatarMoeda(mov.valor_total || 0), 400, yPos);
        yPos += 12;
      });
      
      yPos += 10;
    }

    // ===== LOGOS EM TODAS AS PÁGINAS =====
    // Adicionar logos no cabeçalho de todas as páginas
    adicionarLogosEmTodasAsPaginas(doc);
    
    // ===== RODAPÉ =====
    // Adicionar informações da empresa em todas as páginas
    adicionarRodapeEmpresa(doc);
    
    // Adicionar numeração de páginas (acima do rodapé)
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
          doc.page.height - 35,
          { align: 'center', width: 515 }
        );
      } catch (error) {
        console.warn(`[PDF] Erro ao adicionar numeração na página ${i}:`, error.message);
      }
    }

    // Finalizar documento
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar relatório de componentes:', error);
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

