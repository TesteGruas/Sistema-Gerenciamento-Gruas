/** Remove máscara e retorna só os dígitos do CPF. */
export function somenteDigitosCpf(val: string): string {
  return String(val || "").replace(/\D/g, "")
}

/** No máximo 11 dígitos; formata como 000.000.000-00 (caracteres não numéricos são ignorados). */
export function aplicarMascaraCpf(val: string): string {
  const d = somenteDigitosCpf(val).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Valida CPF brasileiro (11 dígitos + dígitos verificadores). */
export function cpfValido(val: string): boolean {
  const cpf = somenteDigitosCpf(val)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i)
  }
  let d1 = 11 - (sum % 11)
  if (d1 >= 10) d1 = 0
  if (d1 !== parseInt(cpf.charAt(9), 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i)
  }
  let d2 = 11 - (sum % 11)
  if (d2 >= 10) d2 = 0
  return d2 === parseInt(cpf.charAt(10), 10)
}

function digitoVerificadorCpf(base: string, pesoInicial: number): string {
  let sum = 0
  for (let i = 0; i < base.length; i++) {
    sum += parseInt(base.charAt(i), 10) * (pesoInicial - i)
  }
  const d = 11 - (sum % 11)
  return String(d >= 10 ? 0 : d)
}

/** Apenas para desenvolvimento / botão “Preencher dados”. */
export function gerarCpfValidoFormatado(): string {
  let nine = ""
  for (let attempt = 0; attempt < 50; attempt++) {
    nine = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("")
    if (!/^(\d)\1{8}$/.test(nine)) break
  }
  const d1 = digitoVerificadorCpf(nine, 10)
  const d2 = digitoVerificadorCpf(nine + d1, 11)
  const digits = nine + d1 + d2
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
}
