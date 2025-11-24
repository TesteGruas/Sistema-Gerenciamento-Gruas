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
    let orcamento = null;
    let isLocacao = false;

    // Primeiro tentar buscar em orcamentos normais
    const { data: orcamentoNormal, error: orcamentoNormalError } = await supabaseAdmin
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          cnpj,
          contato_cpf,
          endereco,
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
        ),
        obras:obra_id (
          id,
          nome,
          tipo,
          endereco,
          cidade,
          cep,
          contato_obra
        ),
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante,
          tipo,
          lanca,
          altura_final,
          tipo_base,
          ano,
          potencia_instalada,
          capacidade_1_cabo,
          capacidade_2_cabos,
          voltagem
        )
      `)
      .eq('id', id)
      .single();

    // Se não encontrou, tentar em orcamentos_locacao
    if (orcamentoNormalError || !orcamentoNormal) {
      console.log(`[PDF] Orçamento ${id} não encontrado em orcamentos, buscando em orcamentos_locacao...`);
      
      const { data: orcamentoLocacao, error: orcamentoLocacaoError } = await supabaseAdmin
        .from('orcamentos_locacao')
        .select(`
          *,
          clientes:cliente_id (
            id,
            nome,
            cnpj,
            contato_cpf,
            endereco,
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

      if (orcamentoLocacaoError || !orcamentoLocacao) {
        console.error(`[PDF] Erro ao buscar orçamento de locação ${id}:`, orcamentoLocacaoError);
        return res.status(404).json({
          success: false,
          error: 'Orçamento não encontrado',
          message: orcamentoLocacaoError?.message || 'Orçamento não encontrado'
        });
      }

      console.log(`[PDF] Orçamento de locação encontrado:`, JSON.stringify(orcamentoLocacao, null, 2));
      orcamento = orcamentoLocacao;
      isLocacao = true;
    } else {
      console.log(`[PDF] Orçamento normal encontrado:`, JSON.stringify(orcamentoNormal, null, 2));
      orcamento = orcamentoNormal;
      isLocacao = false;
    }

    // Buscar todos os itens relacionados conforme o tipo
    let itens = [];
    let valoresFixos = [];
    let custosMensais = [];
    let horasExtras = [];
    let servicosAdicionais = [];

    if (isLocacao) {
      // Buscar dados de orçamentos de locação
      const [
        { data: itensLocacao },
        { data: valoresFixosLocacao },
        { data: custosMensaisLocacao }
      ] = await Promise.all([
        supabaseAdmin.from('orcamento_itens_locacao').select('*').eq('orcamento_id', id).order('id'),
        supabaseAdmin.from('orcamento_valores_fixos_locacao').select('*').eq('orcamento_id', id).order('id'),
        supabaseAdmin.from('orcamento_custos_mensais_locacao').select('*').eq('orcamento_id', id).order('id')
      ]);

      itens = itensLocacao || [];
      valoresFixos = valoresFixosLocacao || [];
      custosMensais = custosMensaisLocacao || [];
      
      // Debug: verificar se os dados foram encontrados
      console.log(`[PDF Locação] Orçamento ID: ${id}`);
      console.log(`[PDF Locação] Orçamento:`, JSON.stringify(orcamento, null, 2));
      console.log(`[PDF Locação] Itens encontrados: ${itens.length}`, itens);
      console.log(`[PDF Locação] Valores Fixos: ${valoresFixos.length}`, valoresFixos);
      console.log(`[PDF Locação] Custos Mensais: ${custosMensais.length}`, custosMensais);
    } else {
      // Buscar dados de orçamentos normais
      const [
        { data: itensNormal },
        { data: valoresFixosNormal },
        { data: custosMensaisNormal },
        { data: horasExtrasNormal },
        { data: servicosAdicionaisNormal }
      ] = await Promise.all([
        supabaseAdmin.from('orcamento_itens').select('*').eq('orcamento_id', id).order('id'),
        supabaseAdmin.from('orcamento_valores_fixos').select('*').eq('orcamento_id', id).order('id'),
        supabaseAdmin.from('orcamento_custos_mensais').select('*').eq('orcamento_id', id).order('id'),
        supabaseAdmin.from('orcamento_horas_extras').select('*').eq('orcamento_id', id).order('id'),
        supabaseAdmin.from('orcamento_servicos_adicionais').select('*').eq('orcamento_id', id).order('id')
      ]);

      itens = itensNormal || [];
      valoresFixos = valoresFixosNormal || [];
      custosMensais = custosMensaisNormal || [];
      horasExtras = horasExtrasNormal || [];
      servicosAdicionais = servicosAdicionaisNormal || [];
    }

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

    // ===== LOGOS NO CABEÇALHO =====
    yPos = adicionarLogosNoCabecalho(doc, yPos);

    // ===== CABEÇALHO =====
    doc.fontSize(16).font('Helvetica-Bold').text('ORÇAMENTO DE LOCAÇÃO DE GRUA', 40, yPos, { align: 'center' });
    yPos += 25;
    
    // Usar o número correto do orçamento
    const numeroOrcamento = orcamento.numero || (isLocacao ? `LOC-${id}` : `ORC-${id}`);
    doc.fontSize(12).font('Helvetica').text(`Nº ${numeroOrcamento}`, 40, yPos, { align: 'center' });
    yPos += 20;

    // Linha separadora
    doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
    yPos += 15;

    // ===== DADOS DO CLIENTE =====
    doc.fontSize(11).font('Helvetica-Bold').text('DADOS DO CLIENTE', 40, yPos);
    yPos += 15;
    doc.fontSize(10).font('Helvetica');
    
    // Buscar dados do cliente - pode estar em clientes (relacionamento) ou em campos diretos
    const cliente = orcamento.clientes || {};
    
    // Debug: verificar dados do cliente
    console.log(`[PDF] Cliente relacionamento:`, JSON.stringify(cliente, null, 2));
    console.log(`[PDF] Cliente ID do orçamento:`, orcamento.cliente_id);
    console.log(`[PDF] Orçamento completo:`, JSON.stringify(orcamento, null, 2));
    
    doc.text(`Nome: ${cliente.nome || '-'}`, 40, yPos);
    yPos += 12;
    
    // Formatar CNPJ/CPF
    const cnpj = cliente.cnpj || '';
    const cpf = cliente.contato_cpf || '';
    let documento = '-';
    if (cnpj) {
      // Formatar CNPJ: 00.000.000/0000-00
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      if (cnpjLimpo.length === 14) {
        documento = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      } else {
        documento = cnpj;
      }
    } else if (cpf) {
      // Formatar CPF: 000.000.000-00
      const cpfLimpo = cpf.replace(/\D/g, '');
      if (cpfLimpo.length === 11) {
        documento = cpfLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
      } else {
        documento = cpf;
      }
    }
    
    doc.text(`CNPJ/CPF: ${documento}`, 40, yPos);
    yPos += 12;
    
    const enderecoCliente = [
      cliente.endereco,
      cliente.cidade,
      cliente.estado,
      cliente.cep
    ].filter(Boolean).join(', ');
    
    if (enderecoCliente) {
      doc.text(`Endereço: ${enderecoCliente}`, 40, yPos);
      yPos += 12;
    }
    
    doc.text(`Telefone: ${cliente.telefone || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Email: ${cliente.email || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Contato: ${cliente.contato || '-'}`, 40, yPos);
    yPos += 20;

    // ===== DADOS DA OBRA =====
    // Para orçamentos de locação, os dados de obra podem estar em campos diretos ou não existir
    // Só exibir se houver dados relevantes
    const temDadosObra = !isLocacao 
      ? (orcamento.obra_nome || orcamento.obras?.nome)
      : (orcamento.obra_nome && orcamento.obra_nome !== '-');
    
    if (temDadosObra) {
      doc.fontSize(11).font('Helvetica-Bold').text('DADOS DA OBRA', 40, yPos);
      yPos += 15;
      doc.fontSize(10).font('Helvetica');
      
      if (isLocacao) {
        // Para orçamentos de locação, usar campos diretos se existirem
        const obraNome = orcamento.obra_nome || '-';
        const obraTipo = orcamento.tipo_obra || '-';
        const obraEndereco = orcamento.obra_endereco;
        const obraCidade = orcamento.obra_cidade;
        const obraEstado = orcamento.obra_estado;
        
        doc.text(`Nome da Obra: ${obraNome}`, 40, yPos);
        yPos += 12;
        doc.text(`Tipo: ${obraTipo}`, 40, yPos);
        yPos += 12;
        
        const enderecoObra = [obraEndereco, obraCidade, obraEstado].filter(Boolean).join(', ');
        if (enderecoObra) {
          doc.text(`Endereço: ${enderecoObra}`, 40, yPos);
          yPos += 12;
        }
      } else {
        // Para orçamentos normais, usar relacionamento ou campos diretos
        const obra = orcamento.obras || {};
        const obraNome = orcamento.obra_nome || obra.nome || '-';
        const obraTipo = orcamento.obra_tipo || obra.tipo || '-';
        const obraEndereco = orcamento.obra_endereco || obra.endereco;
        const obraCidade = orcamento.obra_cidade || obra.cidade;
        const obraCep = orcamento.obra_cep || obra.cep;
        const obraEngenheiro = orcamento.obra_engenheiro_responsavel || '-';
        const obraContato = orcamento.obra_contato || obra.contato_obra || '-';
        
        doc.text(`Nome da Obra: ${obraNome}`, 40, yPos);
        yPos += 12;
        doc.text(`Tipo: ${obraTipo}`, 40, yPos);
        yPos += 12;
        
        const enderecoObra = [
          obraEndereco,
          orcamento.obra_bairro,
          obraCidade,
          obraCep
        ].filter(Boolean).join(', ');
        
        if (enderecoObra) {
          doc.text(`Endereço: ${enderecoObra}`, 40, yPos);
          yPos += 12;
        }
        
        doc.text(`Engenheiro Responsável: ${obraEngenheiro}`, 40, yPos);
        yPos += 12;
        doc.text(`Contato: ${obraContato}`, 40, yPos);
        yPos += 12;
      }
      yPos += 8;
    }

    // ===== DADOS DA GRUA =====
    // Para orçamentos de locação, os dados de grua podem estar em campos diretos ou no campo equipamento
    // Só exibir se houver dados relevantes
    const temDadosGrua = !isLocacao
      ? (orcamento.grua_modelo || orcamento.gruas?.modelo || orcamento.gruas?.name)
      : (orcamento.equipamento && orcamento.equipamento !== '-');
    
    if (temDadosGrua) {
      doc.fontSize(11).font('Helvetica-Bold').text('DADOS DA GRUA', 40, yPos);
      yPos += 15;
      doc.fontSize(10).font('Helvetica');
      
      if (isLocacao) {
        // Para orçamentos de locação, usar campos diretos se existirem
        const equipamento = orcamento.equipamento || '-';
        const gruaModelo = orcamento.grua_modelo || equipamento || '-';
        const gruaLanca = orcamento.comprimento_lanca || orcamento.grua_lanca;
        const gruaAlturaFinal = orcamento.altura_final || orcamento.grua_altura_final;
        const gruaTipoBase = orcamento.grua_tipo_base || '-';
        const gruaAno = orcamento.grua_ano;
        const gruaPotencia = orcamento.potencia_eletrica || orcamento.grua_potencia;
        const gruaCapacidade1 = orcamento.carga_maxima || orcamento.grua_capacidade_1_cabo;
        const gruaCapacidade2 = orcamento.carga_ponta || orcamento.grua_capacidade_2_cabos;
        const gruaVoltagem = orcamento.energia_necessaria || orcamento.grua_voltagem || '-';
        
        doc.text(`Modelo: ${gruaModelo}`, 40, yPos);
        yPos += 12;
        doc.text(`Lança: ${gruaLanca ? `${gruaLanca}m` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Altura Final: ${gruaAlturaFinal ? `${gruaAlturaFinal}m` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Base: ${gruaTipoBase}`, 40, yPos);
        yPos += 12;
        doc.text(`Ano: ${gruaAno || '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Potência: ${gruaPotencia ? `${gruaPotencia}` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Capacidade 1 cabo: ${gruaCapacidade1 ? `${gruaCapacidade1}kg` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Capacidade 2 cabos: ${gruaCapacidade2 ? `${gruaCapacidade2}kg` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Voltagem: ${gruaVoltagem}`, 40, yPos);
        yPos += 12;
      } else {
        // Para orçamentos normais, usar relacionamento ou campos diretos
        const grua = orcamento.gruas || {};
        const gruaModelo = orcamento.grua_modelo || grua.modelo || grua.name || '-';
        const gruaLanca = orcamento.grua_lanca || grua.lanca;
        const gruaAlturaFinal = orcamento.grua_altura_final || grua.altura_final;
        const gruaTipoBase = orcamento.grua_tipo_base || grua.tipo_base || grua.tipo || '-';
        const gruaAno = orcamento.grua_ano || grua.ano;
        const gruaPotencia = orcamento.grua_potencia || grua.potencia_instalada;
        const gruaCapacidade1 = orcamento.grua_capacidade_1_cabo || grua.capacidade_1_cabo;
        const gruaCapacidade2 = orcamento.grua_capacidade_2_cabos || grua.capacidade_2_cabos;
        const gruaVoltagem = orcamento.grua_voltagem || grua.voltagem || '-';
        
        doc.text(`Modelo: ${gruaModelo}`, 40, yPos);
        yPos += 12;
        doc.text(`Lança: ${gruaLanca ? `${gruaLanca}m` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Altura Final: ${gruaAlturaFinal ? `${gruaAlturaFinal}m` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Base: ${gruaTipoBase}`, 40, yPos);
        yPos += 12;
        doc.text(`Ano: ${gruaAno || '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Potência: ${gruaPotencia ? `${gruaPotencia} KVA` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Capacidade 1 cabo: ${gruaCapacidade1 ? `${gruaCapacidade1}kg` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Capacidade 2 cabos: ${gruaCapacidade2 ? `${gruaCapacidade2}kg` : '-'}`, 40, yPos);
        yPos += 12;
        doc.text(`Voltagem: ${gruaVoltagem}`, 40, yPos);
        yPos += 12;
      }
      yPos += 8;
    }

    // Verificar se precisa de nova página
    if (yPos > 700) {
      doc.addPage();
      yPos = 40;
    }

    // ===== ITENS DO ORÇAMENTO =====
    // Para orçamentos de locação, usar apenas os itens de orcamento_itens_locacao
    // Não incluir valores fixos e custos mensais duplicados, pois já estão nos itens
    let todosItens = [];
    
    if (isLocacao) {
      // Para orçamentos de locação, usar apenas os itens de orcamento_itens_locacao
      // Os custos mensais já foram convertidos para itens quando o orçamento foi criado
      todosItens = itens || [];
      
      console.log(`[PDF Locação] Usando ${todosItens.length} itens de orcamento_itens_locacao`);
      console.log(`[PDF Locação] Itens:`, JSON.stringify(todosItens, null, 2));
      
      // Se não houver itens, mas houver valores fixos ou custos mensais, converter
      if (todosItens.length === 0 && (valoresFixos.length > 0 || custosMensais.length > 0)) {
        console.log(`[PDF Locação] Nenhum item encontrado, convertendo valores fixos e custos mensais`);
        todosItens = [
          ...valoresFixos.map(vf => ({
            produto_servico: vf.tipo || 'Valor Fixo',
            descricao: vf.descricao || '-',
            quantidade: parseFloat(vf.quantidade) || 1,
            valor_unitario: parseFloat(vf.valor_unitario) || 0,
            valor_total: parseFloat(vf.valor_total) || 0,
            unidade: 'unidade',
            observacoes: vf.observacoes
          })),
          ...custosMensais.map(cm => {
            const prazoMeses = parseInt(orcamento.prazo_locacao_meses) || 1;
            return {
              produto_servico: cm.tipo || 'Custo Mensal',
              descricao: cm.descricao || '-',
              quantidade: prazoMeses,
              valor_unitario: parseFloat(cm.valor_mensal) || 0,
              valor_total: (parseFloat(cm.valor_mensal) || 0) * prazoMeses,
              unidade: 'mês',
              observacoes: cm.observacoes
            };
          })
        ];
      }
    } else {
      // Para orçamentos normais, usar apenas itens
      todosItens = itens || [];
    }
    
    if (todosItens && todosItens.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('ITENS DO ORÇAMENTO', 40, yPos);
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Produto/Serviço', 40, yPos);
      doc.text('Descrição', 150, yPos);
      doc.text('Qtd', 300, yPos);
      doc.text('Valor Unit.', 350, yPos);
      doc.text('Valor Total', 450, yPos);
      yPos += 12;
      
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      todosItens.forEach(item => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
        // Garantir que os valores sejam numéricos
        const quantidade = parseFloat(item.quantidade) || 0;
        const valorUnitario = parseFloat(item.valor_unitario) || 0;
        const valorTotal = parseFloat(item.valor_total) || 0;
        const unidade = item.unidade || '';
        
        doc.text(item.produto_servico || '-', 40, yPos, { width: 100 });
        doc.text(item.descricao || '-', 150, yPos, { width: 140 });
        doc.text(`${quantidade} ${unidade}`.trim(), 300, yPos);
        doc.text(formatarMoeda(valorUnitario), 350, yPos);
        doc.text(formatarMoeda(valorTotal), 450, yPos);
        yPos += 15;
        
        if (item.observacoes) {
          doc.fontSize(8).font('Helvetica-Oblique').text(`Obs: ${item.observacoes}`, 150, yPos, { width: 400 });
          yPos += 12;
          doc.fontSize(9).font('Helvetica');
        }
      });
      
      // Total dos itens - garantir que os valores sejam numéricos
      const totalItens = todosItens.reduce((sum, item) => {
        const valorTotal = parseFloat(item.valor_total) || 0;
        return sum + valorTotal;
      }, 0);
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('TOTAL ITENS:', 300, yPos);
      doc.text(formatarMoeda(totalItens), 450, yPos);
      yPos += 15;
      
      // Valor Total Mensal (se houver prazo de locação)
      if (orcamento.prazo_locacao_meses && orcamento.prazo_locacao_meses > 0) {
        const valorTotal = parseFloat(orcamento.valor_total) || totalItens;
        const valorMensal = valorTotal / orcamento.prazo_locacao_meses;
        doc.text('VALOR TOTAL MENSAL:', 300, yPos);
        doc.text(formatarMoeda(valorMensal), 450, yPos);
        yPos += 15;
      }
      
      yPos += 5;
    }

    // ===== VALORES FIXOS =====
    // Para orçamentos de locação, valores fixos já foram incluídos nos itens
    if (!isLocacao && valoresFixos && valoresFixos.length > 0) {
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
    // Apenas para orçamentos normais (não locação)
    if (!isLocacao && horasExtras && horasExtras.length > 0) {
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
    // Apenas para orçamentos normais (não locação)
    if (!isLocacao && servicosAdicionais && servicosAdicionais.length > 0) {
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

    // ===== CONDIÇÕES COMERCIAIS =====
    if (orcamento.condicoes_comerciais) {
      doc.fontSize(11).font('Helvetica-Bold').text('CONDIÇÕES COMERCIAIS', 40, yPos);
      yPos += 15;
      doc.fontSize(9).font('Helvetica');
      doc.text(orcamento.condicoes_comerciais, 40, yPos, { width: 515, align: 'justify' });
      yPos += doc.heightOfString(orcamento.condicoes_comerciais, { width: 515 }) + 15;
    }

    // ===== CONDIÇÕES DE PAGAMENTO =====
    if (orcamento.condicoes_pagamento) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
      doc.fontSize(11).font('Helvetica-Bold').text('CONDIÇÕES DE PAGAMENTO', 40, yPos);
      yPos += 15;
      doc.fontSize(9).font('Helvetica');
      doc.text(orcamento.condicoes_pagamento, 40, yPos, { width: 515, align: 'justify' });
      yPos += doc.heightOfString(orcamento.condicoes_pagamento, { width: 515 }) + 15;
    }

    // ===== CONDIÇÕES GERAIS =====
    if (orcamento.condicoes_gerais) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
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
          `Página ${pageNumber} de ${pageCount} | Gerado em ${formatarDataHora(new Date())}`,
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

/**
 * GET /api/relatorios/orcamentos-locacao/:id/pdf
 * Gerar PDF do orçamento de locação
 */
router.get('/orcamentos-locacao/:id/pdf', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar orçamento de locação diretamente
    const { data: orcamento, error: orcamentoError } = await supabaseAdmin
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          cnpj,
          contato_cpf,
          endereco,
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
      console.error(`[PDF Locação] Erro ao buscar orçamento ${id}:`, orcamentoError);
      return res.status(404).json({
        success: false,
        error: 'Orçamento de locação não encontrado',
        message: orcamentoError?.message || 'Orçamento de locação não encontrado'
      });
    }

    console.log(`[PDF Locação] Orçamento encontrado:`, JSON.stringify(orcamento, null, 2));

    // Buscar dados relacionados de orçamentos de locação
    const [
      { data: itensLocacao },
      { data: valoresFixosLocacao },
      { data: custosMensaisLocacao }
    ] = await Promise.all([
      supabaseAdmin.from('orcamento_itens_locacao').select('*').eq('orcamento_id', id).order('id'),
      supabaseAdmin.from('orcamento_valores_fixos_locacao').select('*').eq('orcamento_id', id).order('id'),
      supabaseAdmin.from('orcamento_custos_mensais_locacao').select('*').eq('orcamento_id', id).order('id')
    ]);

    const itens = itensLocacao || [];
    const valoresFixos = valoresFixosLocacao || [];
    const custosMensais = custosMensaisLocacao || [];
    
    console.log(`[PDF Locação] Itens encontrados: ${itens.length}`, itens);
    console.log(`[PDF Locação] Valores Fixos: ${valoresFixos.length}`, valoresFixos);
    console.log(`[PDF Locação] Custos Mensais: ${custosMensais.length}`, custosMensais);

    // Criar documento PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: `Orçamento de Locação ${orcamento.numero || id}`,
        Author: 'Sistema de Gerenciamento de Gruas',
        Subject: 'Orçamento de Locação de Grua',
        Creator: 'Sistema IRBANA'
      }
    });

    // Configurar headers da resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=orcamento-locacao-${orcamento.numero || id}.pdf`);

    // Pipe do documento para a resposta
    doc.pipe(res);

    // Cor principal: #d93020 (RGB: 217, 48, 32)
    const corPrincipal = '#d93020';
    const corPrincipalRGB = { r: 217, g: 48, b: 32 };

    let yPos = 40;

    // ===== CABEÇALHO COM LOGOS =====
    yPos = adicionarLogosNoCabecalho(doc, yPos);
    yPos += 10;

    // Título com cor
    doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('ORÇAMENTO DE LOCAÇÃO DE GRUA', 40, yPos, { align: 'center' });
    yPos += 25;
    
    const numeroOrcamento = orcamento.numero || `LOC-${id}`;
    doc.fillColor('black')
       .fontSize(12)
       .font('Helvetica')
       .text(`Nº ${numeroOrcamento}`, 40, yPos, { align: 'center' });
    yPos += 20;

    // Linha separadora com cor
    doc.strokeColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
       .lineWidth(2)
       .moveTo(40, yPos)
       .lineTo(555, yPos)
       .stroke();
    doc.strokeColor('black').lineWidth(1); // Resetar para preto
    yPos += 15;

    // ===== DADOS DO CLIENTE =====
    doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('DADOS DO CLIENTE', 40, yPos);
    doc.fillColor('black'); // Resetar para preto
    yPos += 15;
    doc.fontSize(10).font('Helvetica');
    
    const cliente = orcamento.clientes || {};
    
    doc.text(`Nome: ${cliente.nome || '-'}`, 40, yPos);
    yPos += 12;
    
    // Formatar CNPJ/CPF
    const cnpj = cliente.cnpj || '';
    const cpf = cliente.contato_cpf || '';
    let documento = '-';
    if (cnpj) {
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      if (cnpjLimpo.length === 14) {
        documento = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      } else {
        documento = cnpj;
      }
    } else if (cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '');
      if (cpfLimpo.length === 11) {
        documento = cpfLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
      } else {
        documento = cpf;
      }
    }
    
    doc.text(`CNPJ/CPF: ${documento}`, 40, yPos);
    yPos += 12;
    
    const enderecoCliente = [
      cliente.endereco,
      cliente.cidade,
      cliente.estado,
      cliente.cep
    ].filter(Boolean).join(', ');
    
    if (enderecoCliente) {
      doc.text(`Endereço: ${enderecoCliente}`, 40, yPos);
      yPos += 12;
    }
    
    doc.text(`Telefone: ${cliente.telefone || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Email: ${cliente.email || '-'}`, 40, yPos);
    yPos += 12;
    doc.text(`Contato: ${cliente.contato || '-'}`, 40, yPos);
    yPos += 20;

    // ===== DADOS DA OBRA =====
    const temDadosObra = orcamento.obra_nome && orcamento.obra_nome !== '-';
    
    if (temDadosObra) {
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('DADOS DA OBRA', 40, yPos);
      doc.fillColor('black'); // Resetar para preto
      yPos += 15;
      doc.fontSize(10).font('Helvetica');
      
      const obraNome = orcamento.obra_nome || '-';
      const obraTipo = orcamento.tipo_obra || '-';
      const obraEndereco = orcamento.obra_endereco;
      const obraCidade = orcamento.obra_cidade;
      const obraEstado = orcamento.obra_estado;
      
      doc.text(`Nome da Obra: ${obraNome}`, 40, yPos);
      yPos += 12;
      doc.text(`Tipo: ${obraTipo}`, 40, yPos);
      yPos += 12;
      
      const enderecoObra = [obraEndereco, obraCidade, obraEstado].filter(Boolean).join(', ');
      if (enderecoObra) {
        doc.text(`Endereço: ${enderecoObra}`, 40, yPos);
        yPos += 12;
      }
      yPos += 8;
    }

    // ===== DADOS DA GRUA =====
    const temDadosGrua = orcamento.equipamento && orcamento.equipamento !== '-';
    
    if (temDadosGrua) {
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('DADOS DA GRUA', 40, yPos);
      doc.fillColor('black'); // Resetar para preto
      yPos += 15;
      doc.fontSize(10).font('Helvetica');
      
      const equipamento = orcamento.equipamento || '-';
      const gruaModelo = orcamento.grua_modelo || equipamento || '-';
      const gruaLanca = orcamento.comprimento_lanca || orcamento.grua_lanca;
      const gruaAlturaFinal = orcamento.altura_final || orcamento.grua_altura_final;
      const gruaTipoBase = orcamento.grua_tipo_base || '-';
      const gruaAno = orcamento.grua_ano;
      const gruaPotencia = orcamento.potencia_eletrica || orcamento.grua_potencia;
      const gruaCapacidade1 = orcamento.carga_maxima || orcamento.grua_capacidade_1_cabo;
      const gruaCapacidade2 = orcamento.carga_ponta || orcamento.grua_capacidade_2_cabos;
      const gruaVoltagem = orcamento.energia_necessaria || orcamento.grua_voltagem || '-';
      
      doc.text(`Modelo: ${gruaModelo}`, 40, yPos);
      yPos += 12;
      doc.text(`Lança: ${gruaLanca ? `${gruaLanca}m` : '-'}`, 40, yPos);
      yPos += 12;
      doc.text(`Altura Final: ${gruaAlturaFinal ? `${gruaAlturaFinal}m` : '-'}`, 40, yPos);
      yPos += 12;
      doc.text(`Base: ${gruaTipoBase}`, 40, yPos);
      yPos += 12;
      doc.text(`Ano: ${gruaAno || '-'}`, 40, yPos);
      yPos += 12;
      doc.text(`Potência: ${gruaPotencia ? `${gruaPotencia}` : '-'}`, 40, yPos);
      yPos += 12;
      doc.text(`Capacidade 1 cabo: ${gruaCapacidade1 ? `${gruaCapacidade1}kg` : '-'}`, 40, yPos);
      yPos += 12;
      doc.text(`Capacidade 2 cabos: ${gruaCapacidade2 ? `${gruaCapacidade2}kg` : '-'}`, 40, yPos);
      yPos += 12;
      doc.text(`Voltagem: ${gruaVoltagem}`, 40, yPos);
      yPos += 12;
      yPos += 8;
    }

    // Verificar se precisa de nova página
    if (yPos > 700) {
      doc.addPage();
      yPos = 40;
    }

    // ===== ITENS DO ORÇAMENTO =====
    // Para orçamentos de locação, usar apenas os itens de orcamento_itens_locacao
    let todosItens = itens || [];
    
    // Flag para indicar se valores fixos foram convertidos em itens
    let valoresFixosConvertidosEmItens = false;
    
    // Se não houver itens, mas houver valores fixos ou custos mensais, converter
    if (todosItens.length === 0 && (valoresFixos.length > 0 || custosMensais.length > 0)) {
      valoresFixosConvertidosEmItens = true;
      todosItens = [
        ...valoresFixos.map(vf => ({
          produto_servico: vf.tipo || 'Valor Fixo',
          descricao: vf.descricao || '-',
          quantidade: parseFloat(vf.quantidade) || 1,
          valor_unitario: parseFloat(vf.valor_unitario) || 0,
          valor_total: parseFloat(vf.valor_total) || 0,
          unidade: 'unidade',
          observacoes: vf.observacoes
        })),
        ...custosMensais.map(cm => {
          const prazoMeses = parseInt(orcamento.prazo_locacao_meses) || 1;
          return {
            produto_servico: cm.tipo || 'Custo Mensal',
            descricao: cm.descricao || '-',
            quantidade: prazoMeses,
            valor_unitario: parseFloat(cm.valor_mensal) || 0,
            valor_total: (parseFloat(cm.valor_mensal) || 0) * prazoMeses,
            unidade: 'mês',
            observacoes: cm.observacoes
          };
        })
      ];
    }
    
    if (todosItens && todosItens.length > 0) {
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('ITENS DO ORÇAMENTO', 40, yPos);
      doc.fillColor('black'); // Resetar para preto
      yPos += 15;
      
      // Cabeçalho da tabela com cor
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(9)
         .font('Helvetica-Bold');
      doc.text('Produto/Serviço', 40, yPos);
      doc.text('Descrição', 150, yPos);
      doc.text('Qtd', 300, yPos);
      doc.text('Valor Unit.', 350, yPos);
      doc.text('Valor Total', 450, yPos);
      doc.fillColor('black'); // Resetar para preto
      yPos += 12;
      
      // Linha separadora com cor
      doc.strokeColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .lineWidth(1.5)
         .moveTo(40, yPos)
         .lineTo(555, yPos)
         .stroke();
      doc.strokeColor('black').lineWidth(1); // Resetar para preto
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      todosItens.forEach(item => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
        // Garantir que os valores sejam numéricos
        const quantidade = parseFloat(item.quantidade) || 0;
        const valorUnitario = parseFloat(item.valor_unitario) || 0;
        const valorTotal = parseFloat(item.valor_total) || 0;
        const unidade = item.unidade || '';
        
        doc.text(item.produto_servico || '-', 40, yPos, { width: 100 });
        doc.text(item.descricao || '-', 150, yPos, { width: 140 });
        doc.text(`${quantidade} ${unidade}`.trim(), 300, yPos);
        doc.text(formatarMoeda(valorUnitario), 350, yPos);
        doc.text(formatarMoeda(valorTotal), 450, yPos);
        yPos += 15;
        
        if (item.observacoes) {
          doc.fontSize(8).font('Helvetica-Oblique').text(`Obs: ${item.observacoes}`, 150, yPos, { width: 400 });
          yPos += 12;
          doc.fontSize(9).font('Helvetica');
        }
      });
      
      // Total dos itens (será usado depois para calcular o total geral)
      const totalItens = todosItens.reduce((sum, item) => {
        const valorTotal = parseFloat(item.valor_total) || 0;
        return sum + valorTotal;
      }, 0);
      
      // Linha separadora com cor
      doc.strokeColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .lineWidth(1.5)
         .moveTo(40, yPos)
         .lineTo(555, yPos)
         .stroke();
      doc.strokeColor('black').lineWidth(1); // Resetar para preto
      yPos += 8;
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(10)
         .font('Helvetica-Bold');
      doc.text(`TOTAL ITENS: ${formatarMoeda(totalItens)}`, 350, yPos, { align: 'right' });
      doc.fillColor('black'); // Resetar para preto
      yPos += 20;
    }

    // ===== VALORES FIXOS =====
    // Só exibir valores fixos se não foram convertidos em itens
    if (valoresFixos && valoresFixos.length > 0 && !valoresFixosConvertidosEmItens) {
      // Verificar se há espaço suficiente para a tabela (precisa de ~100px mínimo)
      if (yPos > 680) {
        doc.addPage();
        yPos = 40;
      }
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('VALORES FIXOS', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(9)
         .font('Helvetica-Bold');
      doc.text('Tipo', 40, yPos);
      doc.text('Descrição', 120, yPos);
      doc.text('Qtd', 300, yPos);
      doc.text('Valor Unit.', 350, yPos);
      doc.text('Valor Total', 450, yPos);
      doc.fillColor('black');
      yPos += 12;
      
      // Linha separadora
      doc.strokeColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .lineWidth(1.5)
         .moveTo(40, yPos)
         .lineTo(555, yPos)
         .stroke();
      doc.strokeColor('black').lineWidth(1);
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      valoresFixos.forEach(vf => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
        const quantidade = parseFloat(vf.quantidade) || 0;
        const valorUnitario = parseFloat(vf.valor_unitario) || 0;
        const valorTotal = parseFloat(vf.valor_total) || 0;
        
        doc.text(vf.tipo || '-', 40, yPos, { width: 70 });
        doc.text(vf.descricao || '-', 120, yPos, { width: 170 });
        doc.text(quantidade.toString(), 300, yPos);
        doc.text(formatarMoeda(valorUnitario), 350, yPos);
        doc.text(formatarMoeda(valorTotal), 450, yPos);
        yPos += 15;
      });
      
      // Total dos valores fixos
      const totalValoresFixos = valoresFixos.reduce((sum, vf) => {
        const valorTotal = parseFloat(vf.valor_total) || 0;
        return sum + valorTotal;
      }, 0);
      
      // Linha separadora com cor
      doc.strokeColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .lineWidth(1.5)
         .moveTo(40, yPos)
         .lineTo(555, yPos)
         .stroke();
      doc.strokeColor('black').lineWidth(1);
      yPos += 8;
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(10)
         .font('Helvetica-Bold');
      doc.text(`TOTAL VALORES FIXOS: ${formatarMoeda(totalValoresFixos)}`, 350, yPos, { align: 'right' });
      doc.fillColor('black');
      yPos += 20;
    }
    
    // ===== TOTAL GERAL =====
    // Calcular total geral (itens + valores fixos, mas só somar valores fixos se não foram convertidos em itens)
    const totalItens = (todosItens || []).reduce((sum, item) => {
      const valorTotal = parseFloat(item.valor_total) || 0;
      return sum + valorTotal;
    }, 0);
    
    // Só somar valores fixos se não foram convertidos em itens
    const totalValoresFixos = valoresFixosConvertidosEmItens ? 0 : (valoresFixos || []).reduce((sum, vf) => {
      const valorTotal = parseFloat(vf.valor_total) || 0;
      return sum + valorTotal;
    }, 0);
    
    const totalGeral = totalItens + totalValoresFixos;
    
    // Exibir total geral apenas se houver valores
    if (totalGeral > 0) {
      // Verificar se há espaço suficiente
      if (yPos > 700) {
        doc.addPage();
        yPos = 40;
      }
      
      // Linha separadora com cor
      doc.strokeColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .lineWidth(2)
         .moveTo(40, yPos)
         .lineTo(555, yPos)
         .stroke();
      doc.strokeColor('black').lineWidth(1);
      yPos += 10;
      
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(12)
         .font('Helvetica-Bold');
      doc.text(`TOTAL GERAL: ${formatarMoeda(totalGeral)}`, 350, yPos, { align: 'right' });
      doc.fillColor('black');
      yPos += 25;
    }

    // ===== CUSTOS MENSAIS =====
    if (custosMensais && custosMensais.length > 0) {
      // Verificar se há espaço suficiente para a tabela (precisa de ~100px mínimo)
      if (yPos > 680) {
        doc.addPage();
        yPos = 40;
      }
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('CUSTOS MENSAIS', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(9)
         .font('Helvetica-Bold');
      doc.text('Tipo', 40, yPos);
      doc.text('Descrição', 120, yPos);
      doc.text('Valor Mensal', 350, yPos);
      doc.text('Obrigatório', 450, yPos);
      doc.fillColor('black');
      yPos += 12;
      
      // Linha separadora
      doc.strokeColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .lineWidth(1.5)
         .moveTo(40, yPos)
         .lineTo(555, yPos)
         .stroke();
      doc.strokeColor('black').lineWidth(1);
      yPos += 8;
      
      doc.fontSize(9).font('Helvetica');
      custosMensais.forEach(cm => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }
        
        const valorMensal = parseFloat(cm.valor_mensal) || 0;
        const obrigatorio = cm.obrigatorio ? 'Sim' : 'Não';
        
        doc.text(cm.tipo || '-', 40, yPos, { width: 70 });
        doc.text(cm.descricao || '-', 120, yPos, { width: 220 });
        doc.text(formatarMoeda(valorMensal), 350, yPos);
        doc.text(obrigatorio, 450, yPos);
        yPos += 15;
      });
      
      yPos += 10;
    }

    // ===== CONDIÇÕES DE PAGAMENTO =====
    if (orcamento.condicoes_pagamento) {
      // Verificar se há espaço suficiente (precisa de ~50px mínimo)
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('CONDIÇÕES DE PAGAMENTO', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      doc.fontSize(10).font('Helvetica');
      const textoCondicoesPagamento = orcamento.condicoes_pagamento || '';
      const linhas = textoCondicoesPagamento.split('\n');
      const alturaPorLinha = 12;
      const alturaEstimada = linhas.length * alturaPorLinha;
      
      if (yPos + alturaEstimada > 750) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.text(textoCondicoesPagamento, 40, yPos, {
        width: 515,
        align: 'left'
      });
      yPos += alturaEstimada + 15;
    }

    // ===== CONDIÇÕES GERAIS =====
    if (orcamento.condicoes_gerais) {
      // Verificar se há espaço suficiente (precisa de ~50px mínimo)
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('CONDIÇÕES GERAIS', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      doc.fontSize(10).font('Helvetica');
      const textoCondicoes = orcamento.condicoes_gerais || '';
      const linhas = textoCondicoes.split('\n');
      const alturaPorLinha = 12;
      const alturaEstimada = linhas.length * alturaPorLinha;
      
      if (yPos + alturaEstimada > 750) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.text(textoCondicoes, 40, yPos, {
        width: 515,
        align: 'left'
      });
      yPos += alturaEstimada + 15;
    }

    // ===== LOGÍSTICA =====
    if (orcamento.logistica) {
      // Verificar se há espaço suficiente (precisa de ~50px mínimo)
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('LOGÍSTICA', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      doc.fontSize(10).font('Helvetica');
      const textoLogistica = orcamento.logistica || '';
      const linhas = textoLogistica.split('\n');
      const alturaPorLinha = 12;
      const alturaEstimada = linhas.length * alturaPorLinha;
      
      if (yPos + alturaEstimada > 750) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.text(textoLogistica, 40, yPos, {
        width: 515,
        align: 'left'
      });
      yPos += alturaEstimada + 15;
    }

    // ===== PRAZO DE ENTREGA =====
    if (orcamento.prazo_entrega) {
      // Verificar se há espaço suficiente (precisa de ~50px mínimo)
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('PRAZO DE ENTREGA', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      doc.fontSize(10).font('Helvetica');
      const textoPrazoEntrega = orcamento.prazo_entrega || '';
      const linhas = textoPrazoEntrega.split('\n');
      const alturaPorLinha = 12;
      const alturaEstimada = linhas.length * alturaPorLinha;
      
      if (yPos + alturaEstimada > 750) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.text(textoPrazoEntrega, 40, yPos, {
        width: 515,
        align: 'left'
      });
      yPos += alturaEstimada + 15;
    }

    // ===== GARANTIAS =====
    if (orcamento.garantias) {
      // Verificar se há espaço suficiente (precisa de ~50px mínimo)
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('GARANTIAS', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      doc.fontSize(10).font('Helvetica');
      const textoGarantias = orcamento.garantias || '';
      const linhas = textoGarantias.split('\n');
      const alturaPorLinha = 12;
      const alturaEstimada = linhas.length * alturaPorLinha;
      
      if (yPos + alturaEstimada > 750) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.text(textoGarantias, 40, yPos, {
        width: 515,
        align: 'left'
      });
      yPos += alturaEstimada + 15;
    }

    // ===== OBSERVAÇÕES =====
    if (orcamento.observacoes) {
      // Verificar se há espaço suficiente (precisa de ~50px mínimo)
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('OBSERVAÇÕES', 40, yPos);
      doc.fillColor('black');
      yPos += 15;
      
      doc.fontSize(10).font('Helvetica');
      const textoObservacoes = orcamento.observacoes || '';
      const linhas = textoObservacoes.split('\n');
      const alturaPorLinha = 12;
      const alturaEstimada = linhas.length * alturaPorLinha;
      
      if (yPos + alturaEstimada > 750) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.text(textoObservacoes, 40, yPos, {
        width: 515,
        align: 'left'
      });
      yPos += alturaEstimada + 15;
    }

    // ===== ASSINATURAS =====
    // Verificar se há espaço suficiente para as assinaturas (precisa de ~70px)
    // Altura da página A4 é ~792px, margem inferior ~60px, então máximo é ~732px
    if (yPos > 660) {
      doc.addPage();
      yPos = 40;
    }
    
    doc.fillColor(corPrincipalRGB.r, corPrincipalRGB.g, corPrincipalRGB.b)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('ASSINATURAS', 40, yPos);
    doc.fillColor('black'); // Resetar para preto
    yPos += 20;
    doc.fontSize(10).font('Helvetica');
    
    const dataAtual = formatarData(new Date());
    doc.text(`Cliente: ${dataAtual}`, 40, yPos);
    yPos += 15;
    doc.text(`Empresa: ${dataAtual}`, 40, yPos);
    yPos += 20;

    // ===== LOGOS EM TODAS AS PÁGINAS =====
    // Adicionar logos no cabeçalho de todas as páginas
    adicionarLogosEmTodasAsPaginas(doc);
    
    // ===== RODAPÉ =====
    // Adicionar informações da empresa em todas as páginas
    adicionarRodapeEmpresa(doc);

    // Finalizar documento
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF do orçamento de locação:', error);
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

