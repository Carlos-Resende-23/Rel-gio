const horas = document.getElementById("horas")
const minutos = document.getElementById("minutos")
const segundos = document.getElementById("segundos")
const data = document.getElementById("data")
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

const cronometro = document.getElementById("cronometro")
const tempoPrincipal = document.getElementById("tempo-principal")
const milissegundos = document.querySelector(".milissegundos")
const btnIniciar = document.getElementById("iniciar")
const btnPausar = document.getElementById("pausar")
const btnReiniciar = document.getElementById("reiniciar")
const btnVolta = document.getElementById("volta")
const btnLimparVoltas = document.getElementById("limpar-voltas")
const listaVoltas = document.getElementById("lista-voltas")
const temporizador = document.getElementById("temporizador")
const avisoTemporizador = document.getElementById("aviso-temporizador")
const horasTemporizador = document.getElementById("horas-temporizador")
const minutosTemporizador = document.getElementById("minutos-temporizador")
const segundosTemporizador = document.getElementById("segundos-temporizador")
const btnIniciarTemporizador = document.getElementById("iniciar-temporizador")
const btnPausarTemporizador = document.getElementById("pausar-temporizador")
const btnReiniciarTemporizador = document.getElementById(
  "reiniciar-temporizador",
)
const btnSilenciarTemporizador = document.getElementById("silenciar-temporizador")

const voltas = []

let tempoCronometro = 0
let inicioCronometro = 0
let tempoPausado = 0
let intervalo = null
let tempoTemporizador = 0
let intervaloTemporizador = null
let avisoTemporizadorTimer = null
let audioTemporizadorAtivado = true
let audioContext = null

function obterAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) {
      return null
    }
    audioContext = new AudioCtx()
  }

  if (audioContext.state === "suspended") {
    audioContext.resume()
  }

  return audioContext
}

function tocarAlarmeTemporizador() {
  if (!audioTemporizadorAtivado) {
    return
  }

  const context = obterAudioContext()
  if (!context) {
    return
  }

  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(880, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    440,
    context.currentTime + 0.3,
  )

  gainNode.gain.setValueAtTime(0.0001, context.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.03)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start()
  oscillator.stop(context.currentTime + 0.8)
}

function formatarTempo(tempo) {
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

function atualizarBotoesCronometro() {
  const cronometroAtivo = intervalo !== null

  btnIniciar.disabled = cronometroAtivo
  btnPausar.disabled = !cronometroAtivo
  btnReiniciar.disabled = tempoCronometro === 0 && !cronometroAtivo
  btnVolta.disabled = tempoCronometro === 0
}

function atualizarBotoesTemporizador() {
  const temporizadorAtivo = intervaloTemporizador !== null
  const tempoDefinido = obterTempoTemporizador()

  btnIniciarTemporizador.disabled = temporizadorAtivo || tempoDefinido === 0
  btnPausarTemporizador.disabled = !temporizadorAtivo
  btnReiniciarTemporizador.disabled =
    tempoTemporizador === 0 && tempoDefinido === 0
  horasTemporizador.disabled = temporizadorAtivo
  minutosTemporizador.disabled = temporizadorAtivo
  segundosTemporizador.disabled = temporizadorAtivo
}

function atualizarCronometro() {
  const tempoFormatado = formatarTempo(tempoCronometro)

  tempoPrincipal.textContent = tempoFormatado.principal
  milissegundos.textContent = tempoFormatado.ms
  atualizarBotoesCronometro()
}

function atualizarTemporizador() {
  const horas = Math.floor(tempoTemporizador / 3600000)
  const minutos = Math.floor((tempoTemporizador % 3600000) / 60000)
  const segundos = Math.floor((tempoTemporizador % 60000) / 1000)

  temporizador.textContent = [horas, minutos, segundos]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":")

  atualizarBotoesTemporizador()
}

function obterTempoTemporizador() {
  const horas = Number(horasTemporizador.value) || 0
  const minutos = Number(minutosTemporizador.value) || 0
  const segundos = Number(segundosTemporizador.value) || 0

  return (horas * 3600 + minutos * 60 + segundos) * 1000
}

function normalizarCamposTemporizador() {
  const campos = [
    { input: horasTemporizador, max: 99 },
    { input: minutosTemporizador, max: 59 },
    { input: segundosTemporizador, max: 59 },
  ]

  campos.forEach(({ input, max }) => {
    let valor = Number(input.value) || 0

    if (valor < 0) valor = 0
    if (valor > max) valor = max

    input.value = valor
  })
}

function mostrarAvisoTemporizador() {
  avisoTemporizador.hidden = false
  avisoTemporizador.classList.remove("visible")
  void avisoTemporizador.offsetWidth
  avisoTemporizador.classList.add("visible")

  clearTimeout(avisoTemporizadorTimer)
  avisoTemporizadorTimer = setTimeout(() => {
    avisoTemporizador.classList.remove("visible")
    avisoTemporizador.hidden = true
  }, 2500)

  tocarAlarmeTemporizador()
}

function esconderAvisoTemporizador() {
  clearTimeout(avisoTemporizadorTimer)
  avisoTemporizador.classList.remove("visible")
  avisoTemporizador.hidden = true
}

function atualizarBotaoSilenciarTemporizador() {
  btnSilenciarTemporizador.textContent = audioTemporizadorAtivado ? "🔊" : "🔇"
  btnSilenciarTemporizador.setAttribute(
    "aria-label",
    audioTemporizadorAtivado
      ? "Silenciar alarme do temporizador"
      : "Ativar alarme do temporizador",
  )
}

btnIniciar.addEventListener("click", () => {
  if (intervalo !== null) {
    return
  }

  inicioCronometro = Date.now() - tempoPausado
  intervalo = setInterval(() => {
    tempoCronometro = Date.now() - inicioCronometro
    atualizarCronometro()
  }, 10)
  atualizarBotoesCronometro()
})

btnPausar.addEventListener("click", () => {
  if (intervalo === null) {
    return
  }

  clearInterval(intervalo)
  intervalo = null
  tempoPausado = tempoCronometro
  atualizarBotoesCronometro()
})

btnReiniciar.addEventListener("click", () => {
  clearInterval(intervalo)
  intervalo = null

  tempoCronometro = 0
  tempoPausado = 0
  atualizarCronometro()
})

btnVolta.addEventListener("click", () => {
  if (tempoCronometro === 0) {
    return
  }

  voltas.push(tempoCronometro)
  mostrarVoltas()
})

btnLimparVoltas.addEventListener("click", () => {
  voltas.length = 0
  mostrarVoltas()
})

btnIniciarTemporizador.addEventListener("click", () => {
  esconderAvisoTemporizador()
  normalizarCamposTemporizador()

  if (intervaloTemporizador !== null) {
    return
  }

  const tempoDefinido = obterTempoTemporizador()

  if (tempoDefinido === 0) {
    return
  }

  if (tempoTemporizador === 0) {
    tempoTemporizador = tempoDefinido
  }

  let ultimaAtualizacao = Date.now()
  intervaloTemporizador = setInterval(() => {
    const agora = Date.now()
    const tempoDecorrido = agora - ultimaAtualizacao
    ultimaAtualizacao = agora
    tempoTemporizador = Math.max(0, tempoTemporizador - tempoDecorrido)
    atualizarTemporizador()

    if (tempoTemporizador === 0) {
      clearInterval(intervaloTemporizador)
      intervaloTemporizador = null
      mostrarAvisoTemporizador()
      atualizarBotoesTemporizador()
    }
  }, 100)

  atualizarBotoesTemporizador()
})

btnPausarTemporizador.addEventListener("click", () => {
  if (intervaloTemporizador === null) {
    return
  }

  clearInterval(intervaloTemporizador)
  intervaloTemporizador = null
  atualizarBotoesTemporizador()
})

btnReiniciarTemporizador.addEventListener("click", () => {
  clearInterval(intervaloTemporizador)
  intervaloTemporizador = null
  tempoTemporizador = obterTempoTemporizador()
  esconderAvisoTemporizador()
  atualizarTemporizador()
})

btnSilenciarTemporizador.addEventListener("click", () => {
  audioTemporizadorAtivado = !audioTemporizadorAtivado
  atualizarBotaoSilenciarTemporizador()
})

;[horasTemporizador, minutosTemporizador, segundosTemporizador].forEach(
  (input) => {
    input.addEventListener("input", () => {
      normalizarCamposTemporizador()
      tempoTemporizador = obterTempoTemporizador()
      atualizarTemporizador()
    })
  },
)

function mostrarVoltas() {
  listaVoltas.innerHTML = ""

  voltas.forEach((volta, index) => {
    const li = document.createElement("li")

    const tempoFormatado = formatarTempo(volta)
    li.append(`Volta ${index + 1}: ${tempoFormatado.principal}`)

    const milissegundosVolta = document.createElement("span")
    milissegundosVolta.className = "milissegundos"
    milissegundosVolta.textContent = tempoFormatado.ms
    li.appendChild(milissegundosVolta)

    listaVoltas.appendChild(li)
  })
}

atualizarCronometro()
atualizarTemporizador()
atualizarBotaoSilenciarTemporizador()

function atualizarRelogio() {
  let dateToday = new Date()
  let hr = dateToday.getHours()
  let min = dateToday.getMinutes()
  let s = dateToday.getSeconds()
  let dia = dateToday.getDate()
  let mes = dateToday.getMonth() + 1
  let ano = dateToday.getFullYear()
  let diaSemana = diasSemana[dateToday.getDay()]

  if (hr < 10) hr = "0" + hr
  if (min < 10) min = "0" + min
  if (s < 10) s = "0" + s
  if (dia < 10) dia = "0" + dia
  if (mes < 10) mes = "0" + mes

  horas.textContent = hr
  minutos.textContent = min
  segundos.textContent = s
  data.textContent = `${diaSemana} - ${dia}/${mes}/${ano}`
}

atualizarRelogio()
setInterval(atualizarRelogio, 1000)

const temaBtn = document.getElementById("tema-btn")

temaBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark")
  salvarTema()
})

function salvarTema() {
  const isDark = document.body.classList.contains("dark")
  localStorage.setItem("temaEscuro", isDark)
}

function carregarTema() {
  const temaSalvo = localStorage.getItem("temaEscuro")

  if (temaSalvo === "true") {
    document.body.classList.add("dark")
  }
}

carregarTema()
