const horas = document.getElementById("horas")
const minutos = document.getElementById("minutos")
const segundos = document.getElementById("segundos")
const data = document.getElementById("data")
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const cronometro = document.getElementById("cronometro")
const btnIniciar = document.getElementById("iniciar")
const btnPausar = document.getElementById("pausar")
const btnReiniciar = document.getElementById("reiniciar")

let tempoCronometro = 0
let intervalo = null

function atualizarCronometro() {
  let horas = Math.floor(tempoCronometro / 3600)
  let minutos = Math.floor((tempoCronometro % 3600) / 60)
  let segundos = tempoCronometro % 60

  if (horas < 10) horas = "0" + horas
  if (minutos < 10) minutos = "0" + minutos
  if (segundos < 10) segundos = "0" + segundos

  cronometro.textContent = `${horas}:${minutos}:${segundos}`
}

btnIniciar.addEventListener("click", () => {
  if (intervalo !== null) {
    return
  }
  intervalo = setInterval(() => {
    tempoCronometro++
    atualizarCronometro()
  }, 1000)
})

btnPausar.addEventListener("click", () => {
  clearInterval(intervalo)
  intervalo = null
})

btnReiniciar.addEventListener("click", () => {
  clearInterval(intervalo)
  intervalo = null
  tempoCronometro = 0
  atualizarCronometro()
})

const relogio = setInterval(function time() {
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
}, 1000)

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
