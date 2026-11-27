import {
  atualizarEstado,
  formatarTempo,
  lerEstadoArmazenado,
} from "./tempo-utils.js"

export function iniciarCronometro() {
  const cronometro = document.getElementById("cronometro")
  const tempoPrincipal = document.getElementById("tempo-principal")
  const milissegundos = document.querySelector(".milissegundos")
  const btnIniciar = document.getElementById("iniciar")
  const btnPausar = document.getElementById("pausar")
  const btnReiniciar = document.getElementById("reiniciar")
  const btnVolta = document.getElementById("volta")
  const btnLimparVoltas = document.getElementById("limpar-voltas")
  const listaVoltas = document.getElementById("lista-voltas")
  const voltas = []

  let tempoCronometro = 0
  let inicioCronometro = 0
  let tempoPausado = 0
  let intervalo = null

  function salvarEstado() {
    atualizarEstado("cronometro", {
      tempo: tempoCronometro,
      tempoPausado,
      ativo: intervalo !== null,
      inicio: intervalo !== null ? inicioCronometro : 0,
      voltas: [...voltas],
    })
  }

  function atualizarBotoesCronometro() {
    const cronometroAtivo = intervalo !== null

    btnIniciar.disabled = cronometroAtivo
    btnPausar.disabled = !cronometroAtivo
    btnReiniciar.disabled = tempoCronometro === 0 && !cronometroAtivo
    btnVolta.disabled = tempoCronometro === 0
  }

  function atualizarCronometro() {
    const tempoFormatado = formatarTempo(tempoCronometro)

    tempoPrincipal.textContent = tempoFormatado.principal
    milissegundos.textContent = tempoFormatado.ms
    atualizarBotoesCronometro()
  }

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
    const estadoCronometro = lerEstadoArmazenado().cronometro

    if (!estadoCronometro) {
      return
    }

    tempoPausado =
      Number.isFinite(estadoCronometro.tempoPausado)
        ? estadoCronometro.tempoPausado
        : Number.isFinite(estadoCronometro.tempo)
          ? estadoCronometro.tempo
          : 0
    tempoCronometro = tempoPausado

    if (estadoCronometro.ativo) {
      inicioCronometro = Number(estadoCronometro.inicio) || 0
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

  window.addEventListener("pagehide", salvarEstado)

  carregarEstado()
  mostrarVoltas()
  atualizarCronometro()
}
