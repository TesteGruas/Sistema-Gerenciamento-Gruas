# Feat: Controle de Ponto com Assinatura

## 📋 Visão Geral

Implementar um sistema completo de aprovação de horas extras com assinatura digital para funcionários que trabalham mais de 8 horas por dia. O sistema deve incluir notificações automáticas, interface de aprovação para gestores/supervisores, assinatura digital obrigatória e controle de prazo de 7 dias para aprovação.

## 🎯 Funcionalidades Principais

### Para Operários
- **Detecção Automática**: Quando registrar saída com mais de 8h trabalhadas
- **Notificação**: Receber confirmação de que horas extras foram enviadas para aprovação
- **Acompanhamento**: Visualizar status das aprovações pendentes
- **Histórico**: Consultar aprovações aprovadas, rejeitadas e canceladas

### Para Gestores/Supervisores
- **Dashboard de Aprovações**: Página dedicada para aprovar horas extras
- **Notificações**: Receber alertas quando há horas extras pendentes
- **Assinatura Obrigatória**: Assinar digitalmente cada aprovação
- **Prazo de 7 dias**: Sistema automático de cancelamento após prazo
- **Relatórios**: Visualizar estatísticas de aprovações

## 🗄️ Banco de Dados

### 1. Nova Tabela: `aprovacoes_horas_extras`

```sql
CREATE TABLE aprovacoes_horas_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_ponto_id UUID NOT NULL REFERENCES registros_ponto(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id),
  supervisor_id UUID NOT NULL REFERENCES usuarios(id),
  horas_extras DECIMAL(4,2) NOT NULL,
  data_trabalho DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
  assinatura_supervisor TEXT, -- Base64 da assinatura
  observacoes TEXT,
  data_submissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_limite TIMESTAMP WITH TIME ZONE NOT NULL, -- 7 dias após submissão
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_aprovacoes_status ON aprovacoes_horas_extras(status);
CREATE INDEX idx_aprovacoes_supervisor ON aprovacoes_horas_extras(supervisor_id);
CREATE INDEX idx_aprovacoes_funcionario ON aprovacoes_horas_extras(funcionario_id);
CREATE INDEX idx_aprovacoes_data_limite ON aprovacoes_horas_extras(data_limite);
```

### 2. Nova Tabela: `notificacoes_horas_extras`

```sql
CREATE TABLE notificacoes_horas_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aprovacao_id UUID NOT NULL REFERENCES aprovacoes_horas_extras(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('nova_aprovacao', 'lembrete', 'aprovado', 'rejeitado', 'cancelado')),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notif_horas_extras_usuario ON notificacoes_horas_extras(usuario_id);
CREATE INDEX idx_notif_horas_extras_lida ON notificacoes_horas_extras(lida);
```

### 3. Atualizar Tabela `registros_ponto`

```sql
-- Adicionar campo para referenciar aprovação
ALTER TABLE registros_ponto 
ADD COLUMN aprovacao_horas_extras_id UUID REFERENCES aprovacoes_horas_extras(id);

-- Adicionar índice
CREATE INDEX idx_registros_aprovacao ON registros_ponto(aprovacao_horas_extras_id);
```

## 🔧 Backend (Node.js/Express)

### 1. Novas Rotas: `/api/aprovacoes-horas-extras`

#### `POST /api/aprovacoes-horas-extras`
```javascript
// Criar nova aprovação quando funcionário trabalha mais de 8h
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { registro_ponto_id, horas_extras, observacoes } = req.body;
    
    // Buscar supervisor da obra do funcionário
    const supervisor = await buscarSupervisorPorObra(registro.funcionario.obra_atual_id);
    
    // Criar aprovação
    const aprovacao = await criarAprovacaoHorasExtras({
      registro_ponto_id,
      funcionario_id: registro.funcionario_id,
      supervisor_id: supervisor.id,
      horas_extras,
      data_trabalho: registro.data,
      observacoes,
      data_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    });
    
    // Criar notificação para supervisor
    await criarNotificacaoAprovacao(aprovacao, supervisor);
    
    res.status(201).json({
      success: true,
      data: aprovacao,
      message: 'Aprovação de horas extras criada com sucesso'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

#### `GET /api/aprovacoes-horas-extras/pendentes`
```javascript
// Listar aprovações pendentes para supervisor
router.get('/pendentes', authenticateToken, async (req, res) => {
  try {
    const supervisorId = req.user.id;
    
    const aprovacoes = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select(`
        *,
        funcionario:funcionarios!fk_aprovacoes_funcionario(nome, cargo),
        registro:registros_ponto!fk_aprovacoes_registro(entrada, saida, horas_trabalhadas)
      `)
      .eq('supervisor_id', supervisorId)
      .eq('status', 'pendente')
      .order('data_submissao', { ascending: false });
    
    res.json({ success: true, data: aprovacoes.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

#### `PUT /api/aprovacoes-horas-extras/:id/aprovar`
```javascript
// Aprovar horas extras com assinatura
router.put('/:id/aprovar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { assinatura, observacoes } = req.body;
    
    if (!assinatura) {
      return res.status(400).json({
        success: false,
        message: 'Assinatura é obrigatória para aprovação'
      });
    }
    
    // Verificar se aprovação ainda está pendente e dentro do prazo
    const aprovacao = await verificarAprovacaoValida(id);
    
    // Atualizar aprovação
    await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'aprovado',
        assinatura_supervisor: assinatura,
        observacoes,
        data_aprovacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    // Criar notificação para funcionário
    await criarNotificacaoResultado(aprovacao, 'aprovado');
    
    res.json({ success: true, message: 'Horas extras aprovadas com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

#### `PUT /api/aprovacoes-horas-extras/:id/rejeitar`
```javascript
// Rejeitar horas extras
router.put('/:id/rejeitar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    
    await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'rejeitado',
        observacoes,
        data_aprovacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    res.json({ success: true, message: 'Horas extras rejeitadas' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 2. Job Automático: Cancelamento por Prazo

#### `src/jobs/cancelar-aprovacoes-vencidas.js`
```javascript
// Executar diariamente para cancelar aprovações vencidas
export async function cancelarAprovacoesVencidas() {
  try {
    const hoje = new Date();
    
    // Buscar aprovações pendentes vencidas
    const { data: aprovacoesVencidas } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select(`
        *,
        funcionario:funcionarios!fk_aprovacoes_funcionario(nome)
      `)
      .eq('status', 'pendente')
      .lt('data_limite', hoje.toISOString());
    
    // Cancelar cada aprovação vencida
    for (const aprovacao of aprovacoesVencidas) {
      await supabaseAdmin
        .from('aprovacoes_horas_extras')
        .update({
          status: 'cancelado',
          observacoes: 'Cancelado automaticamente por prazo expirado',
          updated_at: new Date().toISOString()
        })
        .eq('id', aprovacao.id);
      
      // Criar notificação para funcionário
      await criarNotificacaoResultado(aprovacao, 'cancelado');
    }
    
    console.log(`${aprovacoesVencidas.length} aprovações canceladas por prazo`);
  } catch (error) {
    console.error('Erro ao cancelar aprovações vencidas:', error);
  }
}
```

### 3. Integração com Sistema de Ponto Existente

#### Modificar `src/routes/ponto-eletronico.js`
```javascript
// Adicionar lógica após criar/atualizar registro de ponto
const horasTrabalhadas = calcularHorasTrabalhadas(entrada, saida, saida_almoco, volta_almoco);
const horasExtras = calcularHorasExtras(horasTrabalhadas);

// Se há horas extras, criar aprovação automaticamente
if (horasExtras > 0) {
  await criarAprovacaoHorasExtras({
    registro_ponto_id: registro.id,
    funcionario_id: registro.funcionario_id,
    horas_extras,
    data_trabalho: registro.data
  });
}
```

## 🎨 Frontend (React/Next.js)

### 1. Nova Página: `/app/dashboard/aprovacoes-horas-extras/page.tsx`

```tsx
export default function AprovacoesHorasExtrasPage() {
  const [aprovacoes, setAprovacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: 'pendente',
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => {
    carregarAprovacoes();
  }, [filtros]);

  const carregarAprovacoes = async () => {
    try {
      const response = await apiAprovacoesHorasExtras.listar(filtros);
      setAprovacoes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Aprovações de Horas Extras</h1>
        <FiltrosAprovacoes filtros={filtros} onFiltrosChange={setFiltros} />
      </div>

      <div className="grid gap-4">
        {aprovacoes.map(aprovacao => (
          <CardAprovacao 
            key={aprovacao.id} 
            aprovacao={aprovacao}
            onAprovacaoChange={carregarAprovacoes}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. Componente: `components/card-aprovacao-horas-extras.tsx`

```tsx
interface CardAprovacaoProps {
  aprovacao: AprovacaoHorasExtras;
  onAprovacaoChange: () => void;
}

export function CardAprovacao({ aprovacao, onAprovacaoChange }: CardAprovacaoProps) {
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showRejeitar, setShowRejeitar] = useState(false);

  const handleAprovar = async (assinatura: string) => {
    try {
      await apiAprovacoesHorasExtras.aprovar(aprovacao.id, {
        assinatura,
        observacoes: ''
      });
      
      toast.success('Horas extras aprovadas com sucesso');
      onAprovacaoChange();
    } catch (error) {
      toast.error('Erro ao aprovar horas extras');
    }
  };

  const handleRejeitar = async (observacoes: string) => {
    try {
      await apiAprovacoesHorasExtras.rejeitar(aprovacao.id, { observacoes });
      toast.success('Horas extras rejeitadas');
      onAprovacaoChange();
    } catch (error) {
      toast.error('Erro ao rejeitar horas extras');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">{aprovacao.funcionario.nome}</h3>
          <p className="text-sm text-gray-600">{aprovacao.funcionario.cargo}</p>
        </div>
        <Badge variant={getStatusVariant(aprovacao.status)}>
          {aprovacao.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Data do Trabalho</p>
          <p className="font-medium">{formatarData(aprovacao.data_trabalho)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Horas Extras</p>
          <p className="font-medium text-orange-600">{aprovacao.horas_extras}h</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Entrada</p>
          <p className="font-medium">{aprovacao.registro.entrada}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Saída</p>
          <p className="font-medium">{aprovacao.registro.saida}</p>
        </div>
      </div>

      {aprovacao.status === 'pendente' && (
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAssinatura(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Aprovar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowRejeitar(true)}
          >
            <X className="w-4 h-4 mr-2" />
            Rejeitar
          </Button>
        </div>
      )}

      {/* Dialog de Assinatura */}
      <Dialog open={showAssinatura} onOpenChange={setShowAssinatura}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Horas Extras</DialogTitle>
            <DialogDescription>
              Assine digitalmente para aprovar as horas extras de {aprovacao.funcionario.nome}
            </DialogDescription>
          </DialogHeader>
          
          <SignaturePad
            title="Assinatura do Supervisor"
            description="Sua assinatura confirma a aprovação das horas extras"
            onSave={handleAprovar}
            onCancel={() => setShowAssinatura(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejeitar} onOpenChange={setShowRejeitar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Horas Extras</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição das horas extras
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Motivo da rejeição..."
            onChange={(e) => setObservacoesRejeicao(e.target.value)}
          />
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowRejeitar(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleRejeitar(observacoesRejeicao)}
            >
              Rejeitar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
```

### 3. Nova Página PWA: `/app/pwa/aprovacoes/page.tsx`

```tsx
export default function PWAAprovacoesPage() {
  const [aprovacoes, setAprovacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAprovacoes();
  }, []);

  const carregarAprovacoes = async () => {
    try {
      const response = await apiAprovacoesHorasExtras.listarPorFuncionario();
      setAprovacoes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Minhas Aprovações</h1>
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            {aprovacoes.map(aprovacao => (
              <Card className="p-4" key={aprovacao.id}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{formatarData(aprovacao.data_trabalho)}</h3>
                  <Badge variant={getStatusVariant(aprovacao.status)}>
                    {aprovacao.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Horas Extras: <span className="font-medium">{aprovacao.horas_extras}h</span></p>
                  <p>Entrada: {aprovacao.registro.entrada} | Saída: {aprovacao.registro.saida}</p>
                  
                  {aprovacao.status === 'aprovado' && aprovacao.data_aprovacao && (
                    <p>Aprovado em: {formatarDataHora(aprovacao.data_aprovacao)}</p>
                  )}
                  
                  {aprovacao.observacoes && (
                    <p>Observações: {aprovacao.observacoes}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

### 4. Integração com Sistema de Ponto PWA

#### Modificar `/app/pwa/ponto/page.tsx`
```tsx
// Após registrar saída com horas extras
if (horasExtrasCalculadas > 0) {
  // Mostrar confirmação de horas extras
  setHorasExtras(horasExtrasCalculadas);
  setTipoRegistroPendente(tipo);
  setShowConfirmacaoHorasExtras(true);
  setIsLoading(false);
  return;
}

// Adicionar estado para confirmação
const [showConfirmacaoHorasExtras, setShowConfirmacaoHorasExtras] = useState(false);

// Componente de confirmação
{showConfirmacaoHorasExtras && (
  <Dialog open={showConfirmacaoHorasExtras} onOpenChange={setShowConfirmacaoHorasExtras}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Horas Extras Detectadas</DialogTitle>
        <DialogDescription>
          Você trabalhou {horasExtras.toFixed(1)} horas extras hoje. 
          Esta informação será enviada para aprovação do seu supervisor.
        </DialogDescription>
      </DialogHeader>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <span className="font-medium text-orange-800">Horas Extras</span>
        </div>
        <p className="text-orange-700">
          <strong>{horasExtras.toFixed(1)} horas</strong> serão enviadas para aprovação
        </p>
        <p className="text-sm text-orange-600 mt-1">
          Você receberá uma notificação quando o supervisor aprovar ou rejeitar.
        </p>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          onClick={() => {
            setShowConfirmacaoHorasExtras(false);
            setTipoRegistroPendente(null);
            setHorasExtras(0);
            setIsLoading(false);
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={async () => {
            // Registrar ponto normalmente
            await registrarPontoComHorasExtras();
            setShowConfirmacaoHorasExtras(false);
          }}
        >
          Confirmar e Enviar para Aprovação
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}
```

### 5. API Client: `lib/api-aprovacoes-horas-extras.ts`

```typescript
export interface AprovacaoHorasExtras {
  id: string;
  registro_ponto_id: string;
  funcionario_id: string;
  supervisor_id: string;
  horas_extras: number;
  data_trabalho: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  assinatura_supervisor?: string;
  observacoes?: string;
  data_submissao: string;
  data_aprovacao?: string;
  data_limite: string;
  funcionario: {
    nome: string;
    cargo: string;
  };
  registro: {
    entrada: string;
    saida: string;
    horas_trabalhadas: number;
  };
}

export const apiAprovacoesHorasExtras = {
  async listar(filtros: any = {}) {
    const response = await fetch('/api/aprovacoes-horas-extras', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  async listarPendentes() {
    const response = await fetch('/api/aprovacoes-horas-extras/pendentes', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return response.json();
  },

  async aprovar(id: string, dados: { assinatura: string; observacoes?: string }) {
    const response = await fetch(`/api/aprovacoes-horas-extras/${id}/aprovar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    return response.json();
  },

  async rejeitar(id: string, dados: { observacoes: string }) {
    const response = await fetch(`/api/aprovacoes-horas-extras/${id}/rejeitar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    return response.json();
  },

  async listarPorFuncionario() {
    const response = await fetch('/api/aprovacoes-horas-extras/funcionario', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return response.json();
  }
};
```

## 🔔 Sistema de Notificações

### 1. Notificações Automáticas

#### Quando funcionário trabalha mais de 8h:
- **Para Supervisor**: "Novo pedido de aprovação de horas extras"
- **Para Funcionário**: "Suas horas extras foram enviadas para aprovação"

#### Quando supervisor aprova/rejeita:
- **Para Funcionário**: "Suas horas extras foram aprovadas/rejeitadas"

#### Lembretes automáticos:
- **Para Supervisor**: "Você tem X aprovações pendentes há mais de 3 dias"
- **Para Funcionário**: "Suas horas extras ainda estão aguardando aprovação"

#### Cancelamento automático:
- **Para Funcionário**: "Suas horas extras foram canceladas por prazo expirado"

### 2. Integração com Sistema Existente

```javascript
// src/utils/notificacoes-horas-extras.js
export async function criarNotificacaoAprovacao(aprovacao, supervisor) {
  await supabaseAdmin
    .from('notificacoes')
    .insert({
      usuario_id: supervisor.id,
      tipo: 'info',
      titulo: 'Nova Aprovação de Horas Extras',
      mensagem: `${aprovacao.funcionario.nome} trabalhou ${aprovacao.horas_extras}h extras em ${formatarData(aprovacao.data_trabalho)}`,
      link: `/dashboard/aprovacoes-horas-extras`,
      lida: false,
      created_at: new Date().toISOString()
    });
}

export async function criarNotificacaoResultado(aprovacao, resultado) {
  await supabaseAdmin
    .from('notificacoes')
    .insert({
      usuario_id: aprovacao.funcionario_id,
      tipo: resultado === 'aprovado' ? 'success' : 'warning',
      titulo: `Horas Extras ${resultado === 'aprovado' ? 'Aprovadas' : 'Rejeitadas'}`,
      mensagem: `Suas ${aprovacao.horas_extras}h extras de ${formatarData(aprovacao.data_trabalho)} foram ${resultado}`,
      link: `/pwa/aprovacoes`,
      lida: false,
      created_at: new Date().toISOString()
    });
}
```

## 📱 PWA - Funcionalidades Móveis

### 1. Notificações Push
- Integrar com service worker existente
- Enviar notificações push para aprovações pendentes
- Notificações de resultado (aprovado/rejeitado)

### 2. Interface Mobile-First
- Cards responsivos para aprovações
- Swipe gestures para ações rápidas
- Modo offline com sincronização posterior

### 3. Integração com Sistema de Ponto
- Detecção automática de horas extras
- Confirmação antes de enviar para aprovação
- Histórico de aprovações no perfil do funcionário

## 🔐 Segurança e Validações

### 1. Validações de Negócio
- Verificar se funcionário pertence à obra do supervisor
- Validar prazo de 7 dias para aprovação
- Impedir aprovação de registros já processados
- Validar assinatura digital obrigatória

### 2. Auditoria
- Log de todas as ações (criar, aprovar, rejeitar, cancelar)
- Rastreabilidade completa das aprovações
- Backup das assinaturas digitais

### 3. Permissões
- Apenas supervisores podem aprovar horas extras de seus funcionários
- Funcionários só podem ver suas próprias aprovações
- Admins podem ver todas as aprovações

## 📊 Relatórios e Analytics

### 1. Dashboard de Aprovações
- Total de aprovações pendentes
- Taxa de aprovação por supervisor
- Tempo médio de aprovação
- Horas extras aprovadas por período

### 2. Relatórios Gerenciais
- Relatório de horas extras por funcionário
- Análise de padrões de horas extras
- Comparativo entre obras/supervisores
- Exportação para Excel/PDF

## 🚀 Cronograma de Implementação

### Fase 1 (Semana 1-2): Backend
- [ ] Criar tabelas no banco de dados
- [ ] Implementar rotas de API
- [ ] Integrar com sistema de ponto existente
- [ ] Criar job de cancelamento automático

### Fase 2 (Semana 3-4): Frontend Dashboard
- [ ] Página de aprovações para gestores
- [ ] Componente de assinatura digital
- [ ] Sistema de notificações
- [ ] Filtros e relatórios

### Fase 3 (Semana 5-6): PWA Mobile
- [ ] Página de aprovações para funcionários
- [ ] Integração com sistema de ponto PWA
- [ ] Notificações push
- [ ] Interface mobile otimizada

### Fase 4 (Semana 7-8): Testes e Refinamentos
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Ajustes de UX/UI
- [ ] Documentação final

## 🧪 Testes

### 1. Testes Unitários
- Validação de cálculos de horas extras
- Testes de API endpoints
- Validação de permissões

### 2. Testes de Integração
- Fluxo completo de aprovação
- Sincronização offline/online
- Notificações automáticas

### 3. Testes de Usabilidade
- Interface mobile responsiva
- Assinatura digital em diferentes dispositivos
- Performance com grande volume de dados

## 📋 Checklist de Implementação

### Backend
- [ ] Tabelas criadas no banco de dados
- [ ] Rotas de API implementadas
- [ ] Integração com sistema de ponto
- [ ] Job de cancelamento automático
- [ ] Sistema de notificações
- [ ] Validações de segurança
- [ ] Logs de auditoria

### Frontend Dashboard
- [ ] Página de aprovações
- [ ] Componente de assinatura
- [ ] Sistema de filtros
- [ ] Relatórios básicos
- [ ] Notificações em tempo real

### PWA Mobile
- [ ] Página de aprovações para funcionários
- [ ] Integração com ponto eletrônico
- [ ] Notificações push
- [ ] Interface responsiva
- [ ] Modo offline

### Testes e Deploy
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Documentação
- [ ] Deploy em produção

---

## 💡 Considerações Adicionais

### Performance
- Implementar paginação para listas grandes
- Cache de aprovações frequentes
- Índices otimizados no banco de dados

### Escalabilidade
- Sistema preparado para múltiplas obras
- Suporte a diferentes fusos horários
- Arquitetura modular para futuras expansões

### Compliance
- Conformidade com legislação trabalhista
- Backup e retenção de dados
- Logs para auditoria externa

Este sistema fornecerá controle completo sobre horas extras com rastreabilidade total, assinatura digital obrigatória e notificações automáticas, garantindo transparência e conformidade legal.
