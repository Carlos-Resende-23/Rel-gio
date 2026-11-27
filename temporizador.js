import { atualizarEstado, lerEstadoArmazenado } from "./tempo-utils.js"

export function iniciarTemporizador() {
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

  let tempoTemporizador = 0
  let intervaloTemporizador = null
  let avisoTemporizadorTimer = null
  let audioTemporizadorAtivado = true
  let audioContext = null
  let fimTemporizador = 0
  let notificacaoJaEnviada = false

  function salvarEstado() {
    atualizarEstado("temporizador", {
      tempo: tempoTemporizador,
      ativo: intervaloTemporizador !== null,
      inicio: intervaloTemporizador !== null ? Date.now() : 0,
      horas: horasTemporizador.value,
      minutos: minutosTemporizador.value,
      segundos: segundosTemporizador.value,
      somAtivado: audioTemporizadorAtivado,
      fim: fimTemporizador,
      notificacaoEnviada: notificacaoJaEnviada,
    })
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
      alert("As notificacoes foram bloqueadas. Ative-as nas configuracoes do navegador.")
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

  function carregarEstado() {
    const estadoTemporizador = lerEstadoArmazenado().temporizador
    if (!estadoTemporizador) {
      return
    }

    horasTemporizador.value = estadoTemporizador.horas ?? "0"
    minutosTemporizador.value = estadoTemporizador.minutos ?? "0"
    segundosTemporizador.value = estadoTemporizador.segundos ?? "0"
    normalizarCamposTemporizador()
    audioTemporizadorAtivado = estadoTemporizador.somAtivado !== false

    tempoTemporizador = Number.isFinite(estadoTemporizador.tempo)
      ? estadoTemporizador.tempo
      : obterTempoTemporizador()
    notificacaoJaEnviada = estadoTemporizador.notificacaoEnviada === true

    if (estadoTemporizador.ativo) {
      const fimSalvo =
        Number(estadoTemporizador.fim) ||
        (Number(estadoTemporizador.inicio) || Date.now()) + tempoTemporizador
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

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && fimTemporizador > 0) {
      tempoTemporizador = Math.max(0, fimTemporizador - Date.now())
      atualizarTemporizador()
      if (tempoTemporizador === 0) {
        finalizarTemporizador()
      }
    }
  })

  window.addEventListener("pagehide", salvarEstado)
  carregarEstado()
  atualizarTemporizador()
  atualizarBotaoSilenciarTemporizador()
  atualizarBotaoNotificacoes()
  salvarEstado()
}
