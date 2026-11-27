const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export function iniciarRelogioETema() {
  const horas = document.getElementById("horas")
  const minutos = document.getElementById("minutos")
  const segundos = document.getElementById("segundos")
  const data = document.getElementById("data")
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

  function atualizarRelogio() {
    const dateToday = new Date()
    let hr = dateToday.getHours()
    let min = dateToday.getMinutes()
    let s = dateToday.getSeconds()
    let dia = dateToday.getDate()
    let mes = dateToday.getMonth() + 1
    let ano = dateToday.getFullYear()
    const diaSemana = diasSemana[dateToday.getDay()]

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

  temaBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark")
    salvarTema()
  })

  carregarTema()
  atualizarRelogio()
  setInterval(atualizarRelogio, 1000)
}
