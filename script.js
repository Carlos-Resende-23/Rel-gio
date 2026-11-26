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
const btnNotificacoesTemporizador = document.getElementById(
  "notificacoes-temporizador",
)

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
let fimTemporizador = 0
let notificacaoJaEnviada = false

const CHAVE_ESTADO = "estadoFerramentasTempo"

function lerEstadoArmazenado() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ESTADO)) || {}
  } catch {
    return {}
  }
}

function salvarEstado() {
  const estado = {
    cronometro: {
      tempo: tempoCronometro,
      tempoPausado,
      ativo: intervalo !== null,
      inicio: intervalo !== null ? inicioCronometro : 0,
      voltas: [...voltas],
    },
    temporizador: {
      tempo: tempoTemporizador,
      ativo: intervaloTemporizador !== null,
      inicio: intervaloTemporizador !== null ? Date.now() : 0,
      horas: horasTemporizador.value,
      minutos: minutosTemporizador.value,
      segundos: segundosTemporizador.value,
      somAtivado: audioTemporizadorAtivado,
      fim: fimTemporizador,
      notificacaoEnviada: notificacaoJaEnviada,
    },
  }

  try {
    localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado))
  } catch {
    // O aplicativo continua funcionando caso o armazenamento seja indisponível.
  }
}

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
  const inicio = context.currentTime
  const duracaoBipe = 0.3
  const intervaloBipe = 0.4
  const frequencias = [880, 660, 880, 660]

  oscillator.type = "triangle"
  frequencias.forEach((frequencia, indice) => {
    const inicioBipe = inicio + indice * intervaloBipe
    gainNode.gain.setValueAtTime(0.0001, inicioBipe)
    gainNode.gain.linearRampToValueAtTime(0.16, inicioBipe + 0.01)
    gainNode.gain.setValueAtTime(0.16, inicioBipe + duracaoBipe - 0.02)
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      inicioBipe + duracaoBipe,
    )
    oscillator.frequency.setValueAtTime(frequencia, inicioBipe)
  })

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start(inicio)
  oscillator.stop(inicio + (frequencias.length - 1) * intervaloBipe + duracaoBipe)
}

function atualizarBotaoNotificacoes() {
  if (!("Notification" in window)) {
    btnNotificacoesTemporizador.textContent = "🔕"
    btnNotificacoesTemporizador.disabled = true
    btnNotificacoesTemporizador.title =
      "Notificacoes nao suportadas neste navegador"
    return
  }

  const ativadas = Notification.permission === "granted"
  btnNotificacoesTemporizador.textContent = ativadas ? "🔔" : "🔕"
  btnNotificacoesTemporizador.setAttribute(
    "aria-label",
    ativadas
      ? "Notificacoes do temporizador ativadas"
      : "Ativar notificacoes do temporizador",
  )
  btnNotificacoesTemporizador.title = ativadas
    ? "Notificacoes ativadas"
    : "Ativar notificacoes"
}

async function solicitarPermissaoNotificacoes() {
  if (!("Notification" in window)) {
    return
  }

  if (Notification.permission === "granted") {
    atualizarBotaoNotificacoes()
    return
  }

  if (Notification.permission === "denied") {
    atualizarBotaoNotificacoes()
    alert(
      "As notificacoes foram bloqueadas. Ative-as nas configuracoes do navegador.",
    )
    return
  }

  const permissao = await Notification.requestPermission()
  if (permissao === "granted") {
    new Notification("Notificacoes ativadas", {
      body: "Voce sera avisado quando o temporizador terminar.",
      icon: "icon.svg",
    })
  }
  atualizarBotaoNotificacoes()
}

function finalizarTemporizador() {
  clearInterval(intervaloTemporizador)
  intervaloTemporizador = null
  fimTemporizador = 0
  mostrarAvisoTemporizador()
  atualizarBotoesTemporizador()

  if (
    !notificacaoJaEnviada &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    notificacaoJaEnviada = true
    new Notification("Tempo esgotado!", {
      body: "Seu temporizador chegou ao fim.",
      icon: "icon.svg",
      tag: "temporizador-esgotado",
    })
  }

  salvarEstado()
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
  salvarEstado()
})

btnPausar.addEventListener("click", () => {
  if (intervalo === null) {
    return
  }

  clearInterval(intervalo)
  intervalo = null
  tempoPausado = tempoCronometro
  atualizarBotoesCronometro()
  salvarEstado()
})

btnReiniciar.addEventListener("click", () => {
  clearInterval(intervalo)
  intervalo = null

  tempoCronometro = 0
  tempoPausado = 0
  atualizarCronometro()
  salvarEstado()
})

btnVolta.addEventListener("click", () => {
  if (tempoCronometro === 0) {
    return
  }

  voltas.push(tempoCronometro)
  mostrarVoltas()
  salvarEstado()
})

btnLimparVoltas.addEventListener("click", () => {
  voltas.length = 0
  mostrarVoltas()
  salvarEstado()
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

  fimTemporizador = Date.now() + tempoTemporizador
  notificacaoJaEnviada = false
  intervaloTemporizador = setInterval(() => {
    tempoTemporizador = Math.max(0, fimTemporizador - Date.now())
    atualizarTemporizador()
    salvarEstado()

    if (tempoTemporizador === 0) {
      finalizarTemporizador()
    }
  }, 100)

  atualizarBotoesTemporizador()
  salvarEstado()
})

btnPausarTemporizador.addEventListener("click", () => {
  if (intervaloTemporizador === null) {
    return
  }

  clearInterval(intervaloTemporizador)
  intervaloTemporizador = null
  fimTemporizador = 0
  atualizarBotoesTemporizador()
  salvarEstado()
})

btnReiniciarTemporizador.addEventListener("click", () => {
  clearInterval(intervaloTemporizador)
  intervaloTemporizador = null
  tempoTemporizador = obterTempoTemporizador()
  fimTemporizador = 0
  notificacaoJaEnviada = false
  esconderAvisoTemporizador()
  atualizarTemporizador()
  salvarEstado()
})

btnSilenciarTemporizador.addEventListener("click", () => {
  audioTemporizadorAtivado = !audioTemporizadorAtivado
  atualizarBotaoSilenciarTemporizador()
  salvarEstado()
})

btnNotificacoesTemporizador.addEventListener("click", () => {
  solicitarPermissaoNotificacoes()
})

;[horasTemporizador, minutosTemporizador, segundosTemporizador].forEach(
  (input) => {
    input.addEventListener("input", () => {
      normalizarCamposTemporizador()
      tempoTemporizador = obterTempoTemporizador()
      atualizarTemporizador()
      salvarEstado()
    })
  },
)

function mostrarVoltas() {
  listaVoltas.innerHTML = ""

  voltas.forEach((volta, index) => {
    const li = document.createElement("li")

    const tempoFormatado = formatarTempo(volta)
    const numeroVolta = document.createElement("span")
    numeroVolta.className = "numero-volta"
    numeroVolta.textContent = `Volta ${index + 1}`

    const tempoVolta = document.createElement("span")
    tempoVolta.className = "tempo-volta"
    tempoVolta.textContent = tempoFormatado.principal

    const milissegundosVolta = document.createElement("span")
    milissegundosVolta.className = "milissegundos"
    milissegundosVolta.textContent = tempoFormatado.ms

    tempoVolta.appendChild(milissegundosVolta)
    li.append(numeroVolta, tempoVolta)
    listaVoltas.appendChild(li)
  })
}

function carregarEstado() {
  const estado = lerEstadoArmazenado()
  const estadoCronometro = estado.cronometro
  const estadoTemporizador = estado.temporizador

  if (estadoCronometro) {
    tempoPausado =
      Number.isFinite(estadoCronometro.tempoPausado)
        ? estadoCronometro.tempoPausado
        : Number.isFinite(estadoCronometro.tempo)
          ? estadoCronometro.tempo
          : 0
    tempoCronometro = tempoPausado

    if (estadoCronometro.ativo) {
      const inicioSalvo = Number(estadoCronometro.inicio) || 0
      inicioCronometro = inicioSalvo
      tempoCronometro = Date.now() - inicioCronometro
      tempoPausado = tempoCronometro
      intervalo = setInterval(() => {
        tempoCronometro = Date.now() - inicioCronometro
        tempoPausado = tempoCronometro
        atualizarCronometro()
        salvarEstado()
      }, 10)
    }

    if (Array.isArray(estadoCronometro.voltas)) {
      voltas.push(
        ...estadoCronometro.voltas.filter((volta) =>
          Number.isFinite(volta),
        ),
      )
    }
  }

  if (estadoTemporizador) {
    horasTemporizador.value = estadoTemporizador.horas ?? "0"
    minutosTemporizador.value = estadoTemporizador.minutos ?? "0"
    segundosTemporizador.value = estadoTemporizador.segundos ?? "0"
    normalizarCamposTemporizador()

    audioTemporizadorAtivado =
      estadoTemporizador.somAtivado !== false

    tempoTemporizador = Number.isFinite(estadoTemporizador.tempo)
      ? estadoTemporizador.tempo
      : obterTempoTemporizador()
    notificacaoJaEnviada =
      estadoTemporizador.notificacaoEnviada === true

    if (estadoTemporizador.ativo) {
      const fimSalvo =
        Number(estadoTemporizador.fim) ||
        (Number(estadoTemporizador.inicio) || Date.now()) +
          tempoTemporizador
      fimTemporizador = fimSalvo
      tempoTemporizador = Math.max(0, fimSalvo - Date.now())

      if (tempoTemporizador > 0) {
        intervaloTemporizador = setInterval(() => {
          tempoTemporizador = Math.max(0, fimTemporizador - Date.now())
          atualizarTemporizador()
          salvarEstado()

          if (tempoTemporizador === 0) {
            finalizarTemporizador()
          }
        }, 100)
      } else {
        intervaloTemporizador = null
        finalizarTemporizador()
      }
    }
  }

  salvarEstado()
}

carregarEstado()
mostrarVoltas()
atualizarCronometro()
atualizarTemporizador()
atualizarBotaoSilenciarTemporizador()
atualizarBotaoNotificacoes()

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && fimTemporizador > 0) {
    tempoTemporizador = Math.max(0, fimTemporizador - Date.now())
    atualizarTemporizador()
    if (tempoTemporizador === 0) {
      finalizarTemporizador()
    }
  }
})

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // O aplicativo continua funcionando sem cache offline.
    })
  })
}

window.addEventListener("pagehide", salvarEstado)

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

function atualizarTextoTema() {
  const temaAtivo = document.body.classList.contains("dark")
  temaBtn.textContent = temaAtivo ? "Tema claro" : "Tema escuro"
  temaBtn.setAttribute("aria-pressed", String(temaAtivo))
}

function salvarTema() {
  const isDark = document.body.classList.contains("dark")
  localStorage.setItem("temaEscuro", String(isDark))
  atualizarTextoTema()
}

function carregarTema() {
  const temaSalvo = localStorage.getItem("temaEscuro")

  if (temaSalvo === "true") {
    document.body.classList.add("dark")
  }

  atualizarTextoTema()
}

temaBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark")
  salvarTema()
})

carregarTema()
