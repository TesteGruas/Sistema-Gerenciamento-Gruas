import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import { adicionarLogosNoCabecalho, adicionarRodapeEmpresa, adicionarLogosEmTodasAsPaginas } from '../utils/pdf-logos.js';

const router = express.Router();

/**
 * @swagger
 * /api/exportar/{tipo}:
 *   post:
 *     summary: Exportar dados em diferentes formatos (PDF, Excel, CSV)
 *     tags: [Exportações]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de dados a exportar (obras, gruas, etc)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formato:
 *                 type: string
 *                 enum: [pdf, excel, csv]
 *               dados:
 *                 type: array
 *               filtros:
 *                 type: object
 *               colunas:
 *                 type: array
 *               titulo:
 *                 type: string
 */
// Middleware dinâmico para verificar permissão baseado no tipo
const verificarPermissaoPorTipo = (req, res, next) => {
  const { tipo } = req.params;
  
  // Verificar permissão baseada no tipo
  let permission = 'obras:visualizar';
  if (tipo === 'gruas') {
    permission = 'gruas:visualizar';
  } else if (tipo === 'clientes') {
    permission = 'clientes:visualizar';
  }

  // Usar o middleware de permissão
  const permissionMiddleware = requirePermission(permission);
  return permissionMiddleware(req, res, next);
};

router.post('/:tipo', authenticateToken, verificarPermissaoPorTipo, async (req, res) => {
  try {
    const { tipo } = req.params;
    const { formato = 'pdf', dados, filtros, colunas, titulo } = req.body;

    // Buscar dados se não foram fornecidos
    let dadosParaExportar = dados;
    if (!dadosParaExportar || dadosParaExportar.length === 0) {
      dadosParaExportar = await buscarDadosPorTipo(tipo, filtros);
    }

    if (!dadosParaExportar || dadosParaExportar.length === 0) {
      return res.status(404).json({
        error: 'Nenhum dado encontrado para exportação',
        message: `Não há dados de ${tipo} para exportar`
      });
    }

    // Exportar conforme o formato
    switch (formato.toLowerCase()) {
      case 'pdf':
        await exportarPDF(res, dadosParaExportar, tipo, titulo);
        break;
      case 'excel':
      case 'xlsx':
        await exportarExcel(res, dadosParaExportar, tipo, titulo);
        break;
      case 'csv':
        await exportarCSV(res, dadosParaExportar, tipo, titulo);
        break;
      default:
        return res.status(400).json({
          error: 'Formato inválido',
          message: 'Formato deve ser: pdf, excel ou csv'
        });
    }
  } catch (error) {
    console.error(`Erro ao exportar ${req.params.tipo}:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erro ao exportar dados',
        message: error.message
      });
    }
  }
});

// Função para buscar dados por tipo
async function buscarDadosPorTipo(tipo, filtros = {}) {
  switch (tipo) {
    case 'obras': {
      let query = supabaseAdmin
        .from('obras')
        .select(`
          *,
          clientes (
            id,
            nome,
            cnpj,
            email,
            telefone
          ),
          grua_obra (
            id,
            grua_id,
            data_inicio_locacao,
            data_fim_locacao,
            valor_locacao_mensal,
            status,
            observacoes,
            posicao_x,
            posicao_y,
            posicao_z,
            angulo_rotacao,
            alcance_operacao,
            area_cobertura,
            data_instalacao,
            data_remocao,
            grua:gruas (
              id,
              name,
              modelo,
              fabricante,
              tipo,
              capacidade
            )
          ),
          obra_gruas_configuracao:obra_gruas_configuracao (
            id,
            grua_id,
            status,
            posicao_x,
            posicao_y,
            posicao_z,
            observacoes,
            data_remocao,
            angulo_rotacao,
            area_cobertura,
            data_instalacao,
            alcance_operacao,
            grua:gruas (
              id,
              name,
              tipo,
              modelo,
              capacidade,
              fabricante
            )
          ),
          grua_funcionario (
            id,
            grua_id,
            funcionario_id,
            data_inicio,
            data_fim,
            status,
            observacoes,
            funcionario:funcionarios (
              id,
              nome,
              cargo,
              status
            ),
            grua:gruas (
              id,
              name,
              modelo,
              fabricante,
              tipo
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros.cliente_id) {
        query = query.eq('cliente_id', filtros.cliente_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    case 'gruas': {
      let query = supabaseAdmin
        .from('gruas')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    case 'clientes': {
      const { data, error } = await supabaseAdmin
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    default:
      return [];
  }
}

// Função para exportar PDF
async function exportarPDF(res, dados, tipo, titulo) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${tipo}-${new Date().toISOString().split('T')[0]}.pdf`);

  doc.pipe(res);

  // Adicionar logos no cabeçalho
  let yPos = 50;
  yPos = adicionarLogosNoCabecalho(doc, yPos);

  // Título do documento
  doc.fontSize(20).font('Helvetica-Bold').text(titulo || `Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, 50, yPos, { align: 'center' });
  yPos += 30;
  doc.fontSize(10).font('Helvetica').text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 50, yPos, { align: 'center' });
  yPos += 20;

  // Linha separadora
  doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
  yPos += 20;

  // Tabela de dados
  if (tipo === 'obras') {
    renderizarTabelaObrasPDF(doc, dados, yPos);
  } else if (tipo === 'gruas') {
    renderizarTabelaGruasPDF(doc, dados, yPos);
  } else {
    renderizarTabelaGenericaPDF(doc, dados, yPos);
  }

  // Adicionar logos em todas as páginas
  adicionarLogosEmTodasAsPaginas(doc);
  adicionarRodapeEmpresa(doc);

  // Numeração de páginas - fazer depois de adicionar logos e rodapé
  // para garantir que temos o número correto de páginas
  try {
    const pageRange = doc.bufferedPageRange();
    const startPage = pageRange.start || 0;
    const pageCount = pageRange.count || 0;

    if (pageCount > 0) {
      for (let i = startPage; i < startPage + pageCount; i++) {
        try {
          doc.switchToPage(i);
          const pageHeight = doc.page.height;
          doc.fontSize(7).font('Helvetica');
          const pageNumber = i - startPage + 1;
          doc.text(
            `Página ${pageNumber} de ${pageCount}`,
            50,
            pageHeight - 15,
            { align: 'center' }
          );
        } catch (error) {
          // Ignorar erros de páginas que não existem mais
          console.warn(`[PDF] Erro ao adicionar numeração na página ${i}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn('[PDF] Erro ao adicionar numeração de páginas:', error.message);
  }

  doc.end();
}

// Função para renderizar tabela de obras em PDF com todos os dados
function renderizarTabelaObrasPDF(doc, dados, yPos) {
  let currentY = yPos;
  const pageHeight = 792; // Altura da página A4 em pontos
  const marginBottom = 80; // Margem inferior (aumentada para rodapé)
  const maxY = pageHeight - marginBottom; // Altura máxima antes de nova página

  dados.forEach((obra, index) => {
    // Verificar se precisa de nova página antes de começar uma nova obra
    // Estimativa: se a próxima obra vai precisar de mais de 250 pontos, adiciona página
    // Mas só adiciona se realmente estiver próximo do limite
    if (currentY > maxY - 250 && index > 0) {
      doc.addPage();
      currentY = 50;
    }

    // Título da obra
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Obra #${obra.id || index + 1}: ${obra.nome || obra.name || 'Sem nome'}`, 50, currentY);
    currentY += 20;

    // Linha separadora
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;

    doc.fontSize(9).font('Helvetica');

    // Dados principais
    if (currentY > maxY - 100) {
      doc.addPage();
      currentY = 50;
    }
    doc.font('Helvetica-Bold').text('DADOS PRINCIPAIS:', 50, currentY);
    currentY += 15;
    doc.font('Helvetica');
    doc.text(`ID: ${obra.id || 'N/A'}`, 60, currentY);
    doc.text(`Status: ${obra.status || 'N/A'}`, 200, currentY);
    doc.text(`Tipo: ${obra.tipo || 'N/A'}`, 350, currentY);
    currentY += 15;
    
    // Descrição (pode ser longa, usar quebra de linha)
    const descricao = (obra.descricao || 'N/A').substring(0, 80);
    doc.text(`Descrição: ${descricao}`, 60, currentY);
    currentY += 15;
    
    doc.text(`Endereço: ${(obra.endereco || 'N/A').substring(0, 40)}`, 60, currentY);
    doc.text(`Cidade: ${obra.cidade || 'N/A'}`, 200, currentY);
    doc.text(`Estado: ${obra.estado || 'N/A'}`, 350, currentY);
    currentY += 15;
    doc.text(`CEP: ${obra.cep || 'N/A'}`, 60, currentY);
    doc.text(`Data Início: ${obra.data_inicio ? formatarData(obra.data_inicio) : 'N/A'}`, 200, currentY);
    doc.text(`Data Fim: ${obra.data_fim ? formatarData(obra.data_fim) : 'N/A'}`, 350, currentY);
    currentY += 15;
    doc.text(`Orçamento: R$ ${formatarMoeda(obra.orcamento || 0)}`, 60, currentY);
    doc.text(`Responsável: ${(obra.responsavel_nome || 'N/A').substring(0, 30)}`, 200, currentY);
    currentY += 15;
    
    // Observações (pode ser longa)
    const observacoes = (obra.observacoes || 'Nenhuma').substring(0, 80);
    doc.text(`Observações: ${observacoes}`, 60, currentY);
    currentY += 20;

    // Dados do cliente
    if (obra.clientes) {
      if (currentY > maxY - 50) {
        doc.addPage();
        currentY = 50;
      }
      doc.font('Helvetica-Bold').text('CLIENTE:', 50, currentY);
      currentY += 15;
      doc.font('Helvetica');
      doc.text(`Nome: ${obra.clientes.nome || 'N/A'}`, 60, currentY);
      doc.text(`CNPJ: ${obra.clientes.cnpj || 'N/A'}`, 250, currentY);
      currentY += 15;
      doc.text(`Email: ${obra.clientes.email || 'N/A'}`, 60, currentY);
      doc.text(`Telefone: ${obra.clientes.telefone || 'N/A'}`, 250, currentY);
      currentY += 20;
    }

    // Documentos obrigatórios
    if (currentY > maxY - 50) {
      doc.addPage();
      currentY = 50;
    }
    doc.font('Helvetica-Bold').text('DOCUMENTOS:', 50, currentY);
    currentY += 15;
    doc.font('Helvetica');
    doc.text(`CNO: ${obra.cno || 'N/A'}`, 60, currentY);
    doc.text(`ART Número: ${obra.art_numero || 'N/A'}`, 200, currentY);
    doc.text(`ART Arquivo: ${obra.art_arquivo ? 'Sim' : 'Não'}`, 350, currentY);
    currentY += 15;
    doc.text(`Apólice Número: ${obra.apolice_numero || 'N/A'}`, 60, currentY);
    doc.text(`Apólice Arquivo: ${obra.apolice_arquivo ? 'Sim' : 'Não'}`, 200, currentY);
    currentY += 20;

    // Gruas
    const gruas = obra.grua_obra || obra.obra_gruas_configuracao || [];
    if (gruas.length > 0) {
      if (currentY > maxY - (gruas.length * 60 + 30)) {
        doc.addPage();
        currentY = 50;
      }
      doc.font('Helvetica-Bold').text(`GRUAS (${gruas.length}):`, 50, currentY);
      currentY += 15;
      doc.font('Helvetica');
      
      gruas.forEach((gruaItem, idx) => {
        const grua = gruaItem.grua || gruaItem;
        
        // Verificar se precisa de nova página antes de adicionar grua
        if (currentY > maxY - 60) {
          doc.addPage();
          currentY = 50;
        }
        
        doc.font('Helvetica-Bold').text(`Grua ${idx + 1}:`, 60, currentY);
        currentY += 15;
        doc.font('Helvetica');
        doc.text(`ID: ${grua.id || 'N/A'}`, 70, currentY);
        doc.text(`Nome: ${(grua.name || 'N/A').substring(0, 20)}`, 150, currentY);
        doc.text(`Modelo: ${(grua.modelo || 'N/A').substring(0, 15)}`, 300, currentY);
        currentY += 15;
        doc.text(`Fabricante: ${(grua.fabricante || 'N/A').substring(0, 20)}`, 70, currentY);
        doc.text(`Tipo: ${grua.tipo || 'N/A'}`, 200, currentY);
        doc.text(`Capacidade: ${grua.capacidade || 'N/A'}`, 300, currentY);
        currentY += 15;
        
        if (gruaItem.data_inicio_locacao || gruaItem.data_instalacao) {
          doc.text(`Data Início: ${formatarData(gruaItem.data_inicio_locacao || gruaItem.data_instalacao)}`, 70, currentY);
        }
        if (gruaItem.data_fim_locacao || gruaItem.data_remocao) {
          doc.text(`Data Fim: ${formatarData(gruaItem.data_fim_locacao || gruaItem.data_remocao)}`, 200, currentY);
        }
        if (gruaItem.valor_locacao_mensal) {
          doc.text(`Valor: R$ ${formatarMoeda(gruaItem.valor_locacao_mensal)}`, 300, currentY);
        }
        currentY += 15;
        if (gruaItem.observacoes) {
          const obs = gruaItem.observacoes.substring(0, 60);
          doc.text(`Observações: ${obs}`, 70, currentY);
          currentY += 15;
        }
        currentY += 5;
      });
    }

    // Funcionários
    const funcionarios = obra.grua_funcionario || [];
    if (funcionarios.length > 0) {
      if (currentY > maxY - (funcionarios.length * 20 + 30)) {
        doc.addPage();
        currentY = 50;
      }
      doc.font('Helvetica-Bold').text(`FUNCIONÁRIOS (${funcionarios.length}):`, 50, currentY);
      currentY += 15;
      doc.font('Helvetica');
      funcionarios.forEach((func, idx) => {
        if (currentY > maxY - 20) {
          doc.addPage();
          currentY = 50;
        }
        doc.text(`${idx + 1}. ${func.funcionario?.nome || 'N/A'} - ${func.funcionario?.cargo || 'N/A'}`, 60, currentY);
        currentY += 15;
      });
      currentY += 10;
    }

    // Espaço entre obras (apenas se não for a última)
    if (index < dados.length - 1) {
      // Só adiciona separador se houver espaço suficiente
      if (currentY <= maxY - 30) {
        currentY += 10;
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 20;
      }
      // Se estiver muito próximo do fim, a próxima obra vai começar em nova página
    }
  });
  
  // Retornar a posição Y final para referência (não usado, mas útil para debug)
  return currentY;
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(valor || 0);
}

// Função para renderizar tabela de gruas em PDF
function renderizarTabelaGruasPDF(doc, dados, yPos) {
  const headers = ['ID', 'Modelo', 'Fabricante', 'Tipo', 'Status'];
  let currentY = yPos;

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text(headers[0], 50, currentY);
  doc.text(headers[1], 100, currentY);
  doc.text(headers[2], 200, currentY);
  doc.text(headers[3], 300, currentY);
  doc.text(headers[4], 400, currentY);

  currentY += 15;
  doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
  currentY += 10;

  doc.fontSize(9).font('Helvetica');
  dados.forEach((grua) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    doc.text(grua.id?.toString() || '', 50, currentY);
    doc.text((grua.modelo || grua.model || '').substring(0, 20), 100, currentY);
    doc.text((grua.fabricante || '').substring(0, 20), 200, currentY);
    doc.text(grua.tipo || 'N/A', 300, currentY);
    doc.text(grua.status || 'N/A', 400, currentY);

    currentY += 20;
  });
}

// Função genérica para renderizar tabela em PDF
function renderizarTabelaGenericaPDF(doc, dados, yPos) {
  if (!dados || dados.length === 0) {
    doc.fontSize(12).text('Nenhum dado disponível', 50, yPos);
    return;
  }

  // Pegar as chaves do primeiro objeto como colunas
  const colunas = Object.keys(dados[0]);
  let currentY = yPos;

  // Cabeçalho
  doc.fontSize(10).font('Helvetica-Bold');
  const colWidth = 480 / colunas.length;
  colunas.forEach((col, index) => {
    doc.text(col.substring(0, 15), 50 + (index * colWidth), currentY);
  });

  currentY += 15;
  doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
  currentY += 10;

  // Dados
  doc.fontSize(8).font('Helvetica');
  dados.forEach((item) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    colunas.forEach((col, index) => {
      const value = item[col];
      const text = value !== null && value !== undefined ? String(value).substring(0, 15) : 'N/A';
      doc.text(text, 50 + (index * colWidth), currentY);
    });

    currentY += 20;
  });
}

// Função para exportar Excel
async function exportarExcel(res, dados, tipo, titulo) {
  const workbook = XLSX.utils.book_new();

  if (tipo === 'obras') {
    // Aba 1: Resumo das Obras
    const obrasData = dados.map(obra => ({
      'ID': obra.id,
      'Nome': obra.nome || obra.name,
      'Descrição': obra.descricao || '',
      'Status': obra.status,
      'Tipo': obra.tipo,
      'Cliente ID': obra.cliente_id,
      'Cliente Nome': obra.clientes?.nome || 'N/A',
      'Cliente CNPJ': obra.clientes?.cnpj || 'N/A',
      'Cliente Email': obra.clientes?.email || 'N/A',
      'Cliente Telefone': obra.clientes?.telefone || 'N/A',
      'Endereço': obra.endereco || '',
      'Cidade': obra.cidade || '',
      'Estado': obra.estado || '',
      'CEP': obra.cep || '',
      'Data Início': obra.data_inicio ? formatarData(obra.data_inicio) : '',
      'Data Fim': obra.data_fim ? formatarData(obra.data_fim) : '',
      'Orçamento': obra.orcamento || 0,
      'Responsável ID': obra.responsavel_id || '',
      'Responsável Nome': obra.responsavel_nome || '',
      'CNO': obra.cno || '',
      'ART Número': obra.art_numero || '',
      'ART Arquivo': obra.art_arquivo || '',
      'Apólice Número': obra.apolice_numero || '',
      'Apólice Arquivo': obra.apolice_arquivo || '',
      'Observações': obra.observacoes || '',
      'Latitude': obra.latitude || '',
      'Longitude': obra.longitude || '',
      'Raio Permitido': obra.raio_permitido || '',
      'Max Gruas Simultâneas': obra.max_gruas_simultaneas || '',
      'Tipo Gerenciamento': obra.tipo_gerenciamento || '',
      'Criado em': obra.created_at ? formatarData(obra.created_at) : '',
      'Atualizado em': obra.updated_at ? formatarData(obra.updated_at) : ''
    }));

    const wsObras = XLSX.utils.json_to_sheet(obrasData);
    XLSX.utils.book_append_sheet(workbook, wsObras, 'Obras');

    // Aba 2: Gruas das Obras
    const gruasData = [];
    dados.forEach(obra => {
      const gruas = obra.grua_obra || obra.obra_gruas_configuracao || [];
      gruas.forEach((gruaItem, idx) => {
        const grua = gruaItem.grua || gruaItem;
        gruasData.push({
          'Obra ID': obra.id,
          'Obra Nome': obra.nome || obra.name,
          'Grua ID': grua.id || '',
          'Grua Nome': grua.name || '',
          'Modelo': grua.modelo || '',
          'Fabricante': grua.fabricante || '',
          'Tipo': grua.tipo || '',
          'Capacidade': grua.capacidade || '',
          'Data Início Locação': gruaItem.data_inicio_locacao || gruaItem.data_instalacao ? formatarData(gruaItem.data_inicio_locacao || gruaItem.data_instalacao) : '',
          'Data Fim Locação': gruaItem.data_fim_locacao || gruaItem.data_remocao ? formatarData(gruaItem.data_fim_locacao || gruaItem.data_remocao) : '',
          'Valor Locação Mensal': gruaItem.valor_locacao_mensal || 0,
          'Status': gruaItem.status || '',
          'Posição X': gruaItem.posicao_x || '',
          'Posição Y': gruaItem.posicao_y || '',
          'Posição Z': gruaItem.posicao_z || '',
          'Ângulo Rotação': gruaItem.angulo_rotacao || 0,
          'Alcance Operação': gruaItem.alcance_operacao || '',
          'Área Cobertura': gruaItem.area_cobertura || '',
          'Observações': gruaItem.observacoes || ''
        });
      });
    });

    if (gruasData.length > 0) {
      const wsGruas = XLSX.utils.json_to_sheet(gruasData);
      XLSX.utils.book_append_sheet(workbook, wsGruas, 'Gruas');
    }

    // Aba 3: Funcionários das Obras
    const funcionariosData = [];
    dados.forEach(obra => {
      const funcionarios = obra.grua_funcionario || [];
      funcionarios.forEach((funcItem, idx) => {
        const funcionario = funcItem.funcionario || {};
        const grua = funcItem.grua || {};
        funcionariosData.push({
          'Obra ID': obra.id,
          'Obra Nome': obra.nome || obra.name,
          'Funcionário ID': funcionario.id || '',
          'Funcionário Nome': funcionario.nome || '',
          'Cargo': funcionario.cargo || '',
          'Status': funcionario.status || '',
          'Grua ID': grua.id || '',
          'Grua Nome': grua.name || '',
          'Data Início': funcItem.data_inicio ? formatarData(funcItem.data_inicio) : '',
          'Data Fim': funcItem.data_fim ? formatarData(funcItem.data_fim) : '',
          'Status': funcItem.status || '',
          'Observações': funcItem.observacoes || ''
        });
      });
    });

    if (funcionariosData.length > 0) {
      const wsFuncionarios = XLSX.utils.json_to_sheet(funcionariosData);
      XLSX.utils.book_append_sheet(workbook, wsFuncionarios, 'Funcionários');
    }

  } else if (tipo === 'gruas') {
    const gruasData = dados.map(grua => ({
      'ID': grua.id,
      'Modelo': grua.modelo || grua.model,
      'Fabricante': grua.fabricante,
      'Tipo': grua.tipo,
      'Capacidade': grua.capacidade || grua.capacity,
      'Status': grua.status,
      'Valor Locação': grua.valor_locacao || grua.valorLocacao || 0,
      'Valor Operação': grua.valor_operacao || grua.valorOperacao || 0
    }));

    const ws = XLSX.utils.json_to_sheet(gruasData);
    XLSX.utils.book_append_sheet(workbook, ws, 'Gruas');
  } else {
    // Genérico
    const ws = XLSX.utils.json_to_sheet(dados);
    XLSX.utils.book_append_sheet(workbook, ws, tipo);
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`);
  res.setHeader('Content-Length', buffer.length);

  res.send(buffer);
}

// Função para exportar CSV
async function exportarCSV(res, dados, tipo, titulo) {
  let csvContent = '';

  if (tipo === 'obras') {
    // Cabeçalho completo
    csvContent = 'ID,Nome,Descrição,Status,Tipo,Cliente ID,Cliente Nome,Cliente CNPJ,Cliente Email,Cliente Telefone,Endereço,Cidade,Estado,CEP,Data Início,Data Fim,Orçamento,Responsável ID,Responsável Nome,CNO,ART Número,ART Arquivo,Apólice Número,Apólice Arquivo,Observações,Latitude,Longitude,Raio Permitido,Max Gruas Simultâneas,Tipo Gerenciamento,Gruas (IDs),Funcionários (IDs),Criado em,Atualizado em\n';

    // Dados
    dados.forEach(obra => {
      // Coletar IDs das gruas
      const gruasIds = [];
      const gruas = obra.grua_obra || obra.obra_gruas_configuracao || [];
      gruas.forEach(g => {
        const grua = g.grua || g;
        if (grua.id) gruasIds.push(grua.id);
      });

      // Coletar IDs dos funcionários
      const funcionariosIds = [];
      const funcionarios = obra.grua_funcionario || [];
      funcionarios.forEach(f => {
        if (f.funcionario?.id) funcionariosIds.push(f.funcionario.id);
      });

      const linha = [
        obra.id || '',
        `"${(obra.nome || obra.name || '').replace(/"/g, '""')}"`,
        `"${(obra.descricao || '').replace(/"/g, '""')}"`,
        obra.status || '',
        obra.tipo || '',
        obra.cliente_id || '',
        `"${(obra.clientes?.nome || 'N/A').replace(/"/g, '""')}"`,
        obra.clientes?.cnpj || '',
        obra.clientes?.email || '',
        obra.clientes?.telefone || '',
        `"${(obra.endereco || '').replace(/"/g, '""')}"`,
        obra.cidade || '',
        obra.estado || '',
        obra.cep || '',
        obra.data_inicio ? formatarData(obra.data_inicio) : '',
        obra.data_fim ? formatarData(obra.data_fim) : '',
        obra.orcamento || 0,
        obra.responsavel_id || '',
        `"${(obra.responsavel_nome || '').replace(/"/g, '""')}"`,
        obra.cno || '',
        obra.art_numero || '',
        obra.art_arquivo || '',
        obra.apolice_numero || '',
        obra.apolice_arquivo || '',
        `"${(obra.observacoes || '').replace(/"/g, '""')}"`,
        obra.latitude || '',
        obra.longitude || '',
        obra.raio_permitido || '',
        obra.max_gruas_simultaneas || '',
        obra.tipo_gerenciamento || '',
        gruasIds.join('; '),
        funcionariosIds.join('; '),
        obra.created_at ? formatarData(obra.created_at) : '',
        obra.updated_at ? formatarData(obra.updated_at) : ''
      ].join(',');
      csvContent += linha + '\n';
    });
  } else if (tipo === 'gruas') {
    csvContent = 'ID,Modelo,Fabricante,Tipo,Capacidade,Status,Valor Locação,Valor Operação\n';
    dados.forEach(grua => {
      const linha = [
        grua.id || '',
        grua.modelo || grua.model || '',
        grua.fabricante || '',
        grua.tipo || '',
        grua.capacidade || grua.capacity || 0,
        grua.status || '',
        grua.valor_locacao || grua.valorLocacao || 0,
        grua.valor_operacao || grua.valorOperacao || 0
      ].join(',');
      csvContent += linha + '\n';
    });
  } else {
    // Genérico
    if (dados.length > 0) {
      const colunas = Object.keys(dados[0]);
      csvContent = colunas.join(',') + '\n';
      dados.forEach(item => {
        const linha = colunas.map(col => {
          const value = item[col];
          if (value === null || value === undefined) return '';
          const str = String(value);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',');
        csvContent += linha + '\n';
      });
    }
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${tipo}-${new Date().toISOString().split('T')[0]}.csv`);
  res.send('\ufeff' + csvContent); // BOM para Excel reconhecer UTF-8
}

// Função auxiliar para formatar data
function formatarData(data) {
  if (!data) return '';
  try {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return data;
  }
}

export default router;

