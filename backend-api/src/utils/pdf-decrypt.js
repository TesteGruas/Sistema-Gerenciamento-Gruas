import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { createRequire } from 'module'
import { spawnSync } from 'child_process'
import zlib from 'zlib'
import { PDFDocument, EncryptedPDFError } from 'pdf-lib'

const require = createRequire(import.meta.url)

/**
 * PDFs com restrição de edição (/Encrypt) — comuns em ASO / OS NR-1 —
 * não podem ser modificados com pdf-lib (ignoreEncryption gera arquivo corrompido).
 *
 * Ordem de tentativas:
 * 1) muhammara (opcional, se instalado no servidor)
 * 2) qpdf no PATH (opcional)
 * 3) reconstrução via pdfjs + PNG (zlib nativo) — sem deps extras
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
  } catch {
    return null
  }
}

async function descriptografarComMuhammara(input) {
  let muhammara = carregarMuhammara()
  if (!muhammara) {
    try {
      const mod = await import('muhammara')
      muhammara = mod.default || mod
    } catch (e) {
      throw new Error(e?.message || 'pacote muhammara não instalado')
    }
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
 * CRC32 para chunks PNG (IEEE).
 * @param {Buffer} buf
 */
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

/**
 * Codifica RGB/RGBA raw em PNG usando só zlib do Node (sem pngjs).
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array|Buffer} src
 * @param {number} channels
 */
function rgbParaPng(width, height, src, channels) {
  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1)
    raw[rowStart] = 0 // filter None
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * channels
      const d = rowStart + 1 + x * 3
      raw[d] = src[s]
      raw[d + 1] = src[s + 1]
      raw[d + 2] = src[s + 2]
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 })

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii')
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const crcBuf = Buffer.concat([typeBuf, data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(crcBuf), 0)
    return Buffer.concat([len, typeBuf, data, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/**
 * Para PDFs escaneados (ASO/OS): cada página é uma imagem full-bleed.
 * Extrai via pdfjs (lê com proteção de owner) e monta PDF novo sem Encrypt.
 * Usa apenas pdfjs-dist + pdf-lib + zlib (já no projeto).
 */
async function reconstruirPdfDeImagensPagina(input) {
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs')

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
    /** @type {Array<{ area: number, img: any }>} */
    const candidatos = []
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] !== OPS.paintImageXObject) continue
      const name = ops.argsArray[i][0]
      const img = await new Promise((resolve) => page.objs.get(name, resolve))
      if (!img?.width || !img?.height || !img?.data) continue
      candidatos.push({ area: img.width * img.height, img })
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

    const pngBuf = rgbParaPng(img.width, img.height, img.data, channels)
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
