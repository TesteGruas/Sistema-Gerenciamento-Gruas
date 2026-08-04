import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { PDFDocument, EncryptedPDFError } from 'pdf-lib'

/**
 * PDFs com restrição de edição (/Encrypt, senha de owner vazia) — comuns em ASO —
 * não podem ser modificados com pdf-lib (ignoreEncryption gera arquivo corrompido).
 * Remove a criptografia via muhammara quando necessário.
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
    const isEncrypted =
      error instanceof EncryptedPDFError || /encrypt/i.test(msg)
    if (!isEncrypted) throw error
  }

  let muhammara
  try {
    muhammara = (await import('muhammara')).default
  } catch (importErr) {
    console.error('[PDF] muhammara indisponível para descriptografar PDF:', importErr?.message || importErr)
    throw new Error(
      'Este PDF está protegido e não pode receber assinatura. Remova a proteção do arquivo ou reinstale a dependência muhammara.'
    )
  }

  const dir = os.tmpdir()
  const inPath = path.join(dir, `irbana-pdf-in-${randomUUID()}.pdf`)
  const outPath = path.join(dir, `irbana-pdf-out-${randomUUID()}.pdf`)

  try {
    fs.writeFileSync(inPath, input)
    try {
      muhammara.recrypt(inPath, outPath, { password: '' })
    } catch (e1) {
      // Alguns ASOs usam senha de owner não vazia com user vazio — tenta sem options
      try {
        muhammara.recrypt(inPath, outPath)
      } catch (e2) {
        console.error('[PDF] Falha ao descriptografar com muhammara:', e2?.message || e2)
        throw new Error(
          'Não foi possível remover a proteção deste PDF para aplicar a assinatura. Exporte o ASO sem senha/restrição e tente novamente.'
        )
      }
    }

    const unlocked = fs.readFileSync(outPath)
    // Validar que o resultado abre sem criptografia
    const check = await PDFDocument.load(unlocked)
    if (check.isEncrypted) {
      throw new Error('PDF ainda criptografado após tentativa de remoção de proteção')
    }
    console.log('[PDF] PDF descriptografado para composição de assinatura')
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
