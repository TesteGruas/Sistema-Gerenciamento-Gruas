'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FiltrosAprovacoesProps {
  filtros: {
    status: string;
    dataInicio: string;
    dataFim: string;
    funcionario: string;
    obra: string;
  };
  onFiltrosChange: (filtros: any) => void;
}

export function FiltrosAprovacoes({ filtros, onFiltrosChange }: FiltrosAprovacoesProps) {
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtrosLocais, setFiltrosLocais] = useState(filtros);

  const handleApplyFilters = () => {
    onFiltrosChange(filtrosLocais);
    setShowFiltros(false);
  };

  const handleClearFilters = () => {
    const filtrosLimpos = {
      status: '',
      dataInicio: '',
      dataFim: '',
      funcionario: '',
      obra: ''
    };
    setFiltrosLocais(filtrosLimpos);
    onFiltrosChange(filtrosLimpos);
  };

  const hasActiveFilters = Object.values(filtros).some(value => value !== '');

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        size="sm"
        onClick={() => setShowFiltros(!showFiltros)}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
        {hasActiveFilters && (
          <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-1 text-xs">
            {Object.values(filtros).filter(v => v !== '').length}
          </span>
        )}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <Popover open={showFiltros} onOpenChange={setShowFiltros}>
        <PopoverTrigger asChild>
          <div />
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtros</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFiltros(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filtrosLocais.status}
                  onValueChange={(value) => setFiltrosLocais(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Funcionário */}
              <div className="space-y-2">
                <Label htmlFor="funcionario">Funcionário</Label>
                <Input
                  id="funcionario"
                  placeholder="Nome do funcionário"
                  value={filtrosLocais.funcionario}
                  onChange={(e) => setFiltrosLocais(prev => ({ ...prev, funcionario: e.target.value }))}
                />
              </div>

              {/* Obra */}
              <div className="space-y-2">
                <Label htmlFor="obra">Obra</Label>
                <Select
                  value={filtrosLocais.obra}
                  onValueChange={(value) => setFiltrosLocais(prev => ({ ...prev, obra: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as obras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as obras</SelectItem>
                    <SelectItem value="Obra Centro">Obra Centro</SelectItem>
                    <SelectItem value="Obra Norte">Obra Norte</SelectItem>
                    <SelectItem value="Obra Sul">Obra Sul</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Início */}
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtrosLocais.dataInicio ? (
                        format(new Date(filtrosLocais.dataInicio), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecionar data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filtrosLocais.dataInicio ? new Date(filtrosLocais.dataInicio) : undefined}
                      onSelect={(date) => setFiltrosLocais(prev => ({ 
                        ...prev, 
                        dataInicio: date ? date.toISOString().split('T')[0] : '' 
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtrosLocais.dataFim ? (
                        format(new Date(filtrosLocais.dataFim), "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecionar data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filtrosLocais.dataFim ? new Date(filtrosLocais.dataFim) : undefined}
                      onSelect={(date) => setFiltrosLocais(prev => ({ 
                        ...prev, 
                        dataFim: date ? date.toISOString().split('T')[0] : '' 
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyFilters}
                  className="flex-1"
                >
                  Aplicar
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}
