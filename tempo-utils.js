export const CHAVE_ESTADO = "estadoFerramentasTempo"

export function lerEstadoArmazenado() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ESTADO)) || {}
  } catch {
    return {}
  }
}

export function atualizarEstado(chave, valores) {
  const estado = lerEstadoArmazenado()
  estado[chave] = valores

  try {
    localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado))
  } catch {
    // O aplicativo continua funcionando caso o armazenamento seja indisponível.
  }
}

export function formatarTempo(tempo) {
  let horas = Math.floor(tempo / 3600000)
  let minutos = Math.floor((tempo % 3600000) / 60000)
  let segundos = Math.floor((tempo % 60000) / 1000)
  let ms = tempo % 1000

  if (horas < 10) horas = "0" + horas
  if (minutos < 10) minutos = "0" + minutos
  if (segundos < 10) segundos = "0" + segundos

  ms = String(ms).padStart(3, "0")

  return {
    principal: `${horas}:${minutos}:${segundos}`,
    ms: `.${ms}`,
  }
}
