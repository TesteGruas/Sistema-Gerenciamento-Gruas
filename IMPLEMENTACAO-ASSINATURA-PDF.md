# Implementação: Assinatura Digital no PDF

## 📋 Resumo

Foi implementada a funcionalidade de adicionar assinaturas digitais diretamente no PDF no momento do download. Agora, quando o usuário baixar um documento ou holerite, pode optar por baixar com as assinaturas já aplicadas no PDF.

---

## ✅ O que foi implementado

### 1. Biblioteca de Manipulação de PDF

**Arquivo:** `backend-api/src/utils/pdf-signature.js`

- ✅ Função para adicionar uma assinatura em um PDF existente
- ✅ Suporte a múltiplas assinaturas
- ✅ Suporte a PNG e JPEG
- ✅ Posicionamento customizável (x, y, largura, altura, opacidade)
- ✅ Função para baixar PDF e adicionar assinatura em uma única operação

### 2. Endpoints de Download Atualizados

#### Documentos de Obras

**Endpoint:** `GET /api/assinaturas/documento/:id/download`

**Query Params:**
- `comAssinaturas=true` - Adiciona todas as assinaturas assinadas no PDF antes de baixar

**Exemplo:**
```
GET /api/assinaturas/documento/123/download?comAssinaturas=true
```

**Comportamento:**
- Se `comAssinaturas=true`, busca todas as assinaturas assinadas do documento
- Adiciona cada assinatura na última página do PDF
- Posiciona as assinaturas verticalmente (começando do fundo)
- Retorna o PDF modificado

#### Holerites

**Endpoint:** `GET /api/colaboradores/holerites/:id/download`

**Query Params:**
- `comAssinatura=true` - Adiciona a assinatura digital do holerite no PDF antes de baixar

**Exemplo:**
```
GET /api/colaboradores/holerites/abc-123/download?comAssinatura=true
```

**Comportamento:**
- Se `comAssinatura=true` e o holerite tem assinatura digital
- Adiciona a assinatura na última página do PDF
- Centraliza horizontalmente
- Retorna o PDF modificado

### 3. API Client Atualizado

#### Documentos

**Arquivo:** `lib/api-assinaturas.ts`

```typescript
export const downloadDocumento = async (
  id: number, 
  comAssinaturas: boolean = false
): Promise<Blob>
```

**Uso:**
```typescript
// Download sem assinaturas (comportamento padrão)
const pdf = await downloadDocumento(123)

// Download com assinaturas aplicadas
const pdfComAssinaturas = await downloadDocumento(123, true)
```

#### Holerites

**Arquivo:** `lib/api-colaboradores-documentos.ts`

```typescript
async baixar(holeriteId: string, comAssinatura: boolean = false): Promise<Blob>
```

**Uso:**
```typescript
// Download sem assinatura (comportamento padrão)
const pdf = await colaboradoresDocumentosApi.holerites.baixar('abc-123')

// Download com assinatura aplicada
const pdfComAssinatura = await colaboradoresDocumentosApi.holerites.baixar('abc-123', true)
```

---

## 🎯 Como usar no Frontend

### Exemplo 1: Download de Documento com Assinaturas

```typescript
import { downloadDocumento } from '@/lib/api-assinaturas'

const handleDownload = async (documentoId: number) => {
  try {
    // Baixar com assinaturas aplicadas
    const blob = await downloadDocumento(documentoId, true)
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documento_${documentoId}_assinado.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erro ao baixar documento:', error)
  }
}
```

### Exemplo 2: Download de Holerite com Assinatura

```typescript
import { colaboradoresDocumentosApi } from '@/lib/api-colaboradores-documentos'

const handleDownloadHolerite = async (holeriteId: string) => {
  try {
    // Baixar com assinatura aplicada
    const blob = await colaboradoresDocumentosApi.holerites.baixar(holeriteId, true)
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `holerite_assinado.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erro ao baixar holerite:', error)
  }
}
```

### Exemplo 3: Botão com Opção

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { downloadDocumento } from '@/lib/api-assinaturas'

function DocumentoDownloadButton({ documentoId }: { documentoId: number }) {
  const [baixando, setBaixando] = useState(false)

  const handleDownload = async (comAssinaturas: boolean) => {
    setBaixando(true)
    try {
      const blob = await downloadDocumento(documentoId, comAssinaturas)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `documento_${documentoId}${comAssinaturas ? '_assinado' : ''}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar:', error)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => handleDownload(false)}
        disabled={baixando}
      >
        Baixar Original
      </Button>
      <Button 
        onClick={() => handleDownload(true)}
        disabled={baixando}
        variant="outline"
      >
        {baixando ? 'Baixando...' : 'Baixar com Assinaturas'}
      </Button>
    </div>
  )
}
```

---

## 🔧 Configuração e Dependências

### Dependências Adicionadas

```json
{
  "dependencies": {
    "pdf-lib": "^1.x.x"
  }
}
```

**Instalação:**
```bash
cd backend-api
npm install pdf-lib
```

### Requisitos

- Node.js 18+ (para usar `fetch` nativo)
- PDFs válidos no formato PDF 1.4 ou superior
- Assinaturas em formato base64 (PNG ou JPEG)

---

## 📝 Detalhes Técnicos

### Posicionamento das Assinaturas

**Documentos:**
- Última página do PDF
- Centralizado horizontalmente
- Posição Y: 50 + (índice * 80) pontos do fundo
- Largura: 200 pontos
- Altura: 60 pontos

**Holerites:**
- Última página do PDF
- Centralizado horizontalmente
- Posição Y: 50 pontos do fundo
- Largura: 200 pontos
- Altura: 60 pontos

### Formatos Suportados

- ✅ PNG (recomendado)
- ✅ JPEG
- ❌ GIF (não suportado)
- ❌ SVG (não suportado)

### Limitações

1. **Tamanho do PDF:** PDFs muito grandes podem demorar mais para processar
2. **Múltiplas assinaturas:** Muitas assinaturas podem sobrepor na mesma página
3. **Posicionamento:** Assinaturas são adicionadas na última página por padrão

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Posicionamento Customizável:**
   - Permitir definir posição X e Y via parâmetros
   - Permitir escolher a página onde adicionar

2. **Múltiplas Páginas:**
   - Distribuir assinaturas em múltiplas páginas se necessário
   - Adicionar nova página se não houver espaço

3. **Cache:**
   - Cachear PDFs com assinaturas já aplicadas
   - Reduzir processamento em downloads repetidos

4. **UI Melhorada:**
   - Checkbox "Incluir assinaturas" nos botões de download
   - Preview do PDF com assinaturas antes de baixar

---

## ✅ Testes Recomendados

1. **Teste Básico:**
   - [ ] Baixar documento sem assinaturas
   - [ ] Baixar documento com assinaturas
   - [ ] Verificar se assinaturas aparecem no PDF

2. **Teste de Holerites:**
   - [ ] Baixar holerite sem assinatura
   - [ ] Baixar holerite com assinatura
   - [ ] Verificar se assinatura aparece no PDF

3. **Teste de Múltiplas Assinaturas:**
   - [ ] Documento com 2+ assinaturas
   - [ ] Verificar se todas aparecem
   - [ ] Verificar se não sobrepõem

4. **Teste de Erros:**
   - [ ] PDF inválido
   - [ ] Assinatura em formato inválido
   - [ ] PDF muito grande

---

## 📚 Referências

- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [PDF Specification](https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf)

---

**Status:** ✅ Implementado e pronto para uso

