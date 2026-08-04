import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { createRequire } from 'module'
import { spawnSync } from 'child_process'
import { PDFDocument, EncryptedPDFError } from 'pdf-lib'

const require = createRequire(import.meta.url)

/**
 * PDFs com restrição de edição (/Encrypt) — comuns em ASO / OS NR-1 —
 * não podem ser modificados com pdf-lib (ignoreEncryption gera arquivo corrompido).
 *
 * Ordem de tentativas:
 * 1) muhammara (nativo)
 * 2) qpdf no PATH (se instalado no servidor)
 * 3) reconstrução via pdfjs + pngjs (scans de página inteira; puro JS)
 *
 * @param {Buffer|Uint8Array} pdfBuffer
 * @returns {Promise<Buffer>}
 */
export async function garantirPdfSemCriptografia(pdfBuffer) {
  const input = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)

  try {
    const doc = await PDFDocument.load(input)
    if (!doc.isEncrypted) return input
  } catch (error) {
    const msg = String(error?.message || error)
    const isEncrypted = error instanceof EncryptedPDFError || /encrypt/i.test(msg)
    if (!isEncrypted) throw error
  }

  const erros = []

  try {
    const unlocked = await descriptografarComMuhammara(input)
    console.log('[PDF] PDF descriptografado com muhammara')
    return unlocked
  } catch (e) {
    erros.push(`muhammara: ${e?.message || e}`)
    console.warn('[PDF] muhammara falhou:', e?.message || e)
  }

  try {
    const unlocked = descriptografarComQpdf(input)
    if (unlocked) {
      console.log('[PDF] PDF descriptografado com qpdf')
      return unlocked
    }
  } catch (e) {
    erros.push(`qpdf: ${e?.message || e}`)
    console.warn('[PDF] qpdf falhou:', e?.message || e)
  }

  try {
    const unlocked = await reconstruirPdfDeImagensPagina(input)
    console.log('[PDF] PDF reconstruído a partir das imagens das páginas (fallback pdfjs)')
    return unlocked
  } catch (e) {
    erros.push(`pdfjs-rebuild: ${e?.message || e}`)
    console.error('[PDF] Fallback pdfjs falhou:', e?.message || e)
  }

  throw new Error(
    `Este PDF está protegido e não pôde ser preparado para assinatura. Detalhes: ${erros.join(' | ')}`
  )
}

function carregarMuhammara() {
  try {
    return require('muhammara')
  } catch (e1) {
    // ignore — tenta ESM abaixo
  }
  return null
}

async function descriptografarComMuhammara(input) {
  let muhammara = carregarMuhammara()
  if (!muhammara) {
    const mod = await import('muhammara')
    muhammara = mod.default || mod
  }
  if (!muhammara?.recrypt) {
    throw new Error('módulo muhammara sem recrypt (binding nativo ausente?)')
  }

  const dir = os.tmpdir()
  const inPath = path.join(dir, `irbana-pdf-in-${randomUUID()}.pdf`)
  const outPath = path.join(dir, `irbana-pdf-out-${randomUUID()}.pdf`)

  try {
    fs.writeFileSync(inPath, input)
    try {
      muhammara.recrypt(inPath, outPath, { password: '' })
    } catch {
      muhammara.recrypt(inPath, outPath)
    }
    const unlocked = fs.readFileSync(outPath)
    await assertPdfNaoCriptografado(unlocked)
    return unlocked
  } finally {
    for (const p of [inPath, outPath]) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p)
      } catch {
        /* ignore */
      }
    }
  }
}

function descriptografarComQpdf(input) {
  const which = spawnSync('which', ['qpdf'], { encoding: 'utf8' })
  if (which.status !== 0) return null

  const dir = os.tmpdir()
  const inPath = path.join(dir, `irbana-pdf-in-${randomUUID()}.pdf`)
  const outPath = path.join(dir, `irbana-pdf-out-${randomUUID()}.pdf`)
  try {
    fs.writeFileSync(inPath, input)
    const r = spawnSync('qpdf', ['--decrypt', inPath, outPath], { encoding: 'utf8' })
    if (r.status !== 0) {
      throw new Error(r.stderr || r.stdout || `exit ${r.status}`)
    }
    return fs.readFileSync(outPath)
  } finally {
    for (const p of [inPath, outPath]) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p)
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Para PDFs escaneados (ASO/OS): cada página é uma imagem full-bleed.
 * Extrai as imagens via pdfjs (consegue ler com proteção de owner) e monta PDF novo sem Encrypt.
 */
async function reconstruirPdfDeImagensPagina(input) {
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const { PNG } = await import('pngjs')

  const loadingTask = getDocument({
    data: new Uint8Array(input),
    useSystemFonts: true,
    disableFontFace: true
  })
  const pdf = await loadingTask.promise
  if (!pdf.numPages) throw new Error('PDF sem páginas')

  const outDoc = await PDFDocument.create()

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const viewport = page.getViewport({ scale: 1 })
    const pageWidth = viewport.width
    const pageHeight = viewport.height

    const ops = await page.getOperatorList()
    /** @type {Array<{ name: string, area: number }>} */
    const candidatos = []
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] !== OPS.paintImageXObject) continue
      const name = ops.argsArray[i][0]
      const img = await new Promise((resolve) => page.objs.get(name, resolve))
      if (!img?.width || !img?.height || !img?.data) continue
      candidatos.push({ name, area: img.width * img.height, img })
    }

    if (candidatos.length === 0) {
      throw new Error(`Página ${p}: nenhuma imagem de fundo encontrada para reconstruir o PDF`)
    }

    candidatos.sort((a, b) => b.area - a.area)
    const { img } = candidatos[0]

    const channels = img.data.length / (img.width * img.height)
    if (channels < 3) {
      throw new Error(`Página ${p}: formato de imagem não suportado (channels=${channels})`)
    }

    const png = new PNG({ width: img.width, height: img.height })
    const src = img.data
    for (let i = 0, px = 0; i < img.width * img.height; i++, px += 4) {
      const s = i * channels
      png.data[px] = src[s]
      png.data[px + 1] = src[s + 1]
      png.data[px + 2] = src[s + 2]
      png.data[px + 3] = 255
    }
    const pngBuf = PNG.sync.write(png)
    const embedded = await outDoc.embedPng(pngBuf)
    const outPage = outDoc.addPage([pageWidth, pageHeight])
    outPage.drawImage(embedded, { x: 0, y: 0, width: pageWidth, height: pageHeight })
  }

  const unlocked = Buffer.from(await outDoc.save())
  await assertPdfNaoCriptografado(unlocked)
  return unlocked
}

async function assertPdfNaoCriptografado(buf) {
  const check = await PDFDocument.load(buf)
  if (check.isEncrypted) {
    throw new Error('PDF ainda criptografado após tentativa de remoção de proteção')
  }
}
