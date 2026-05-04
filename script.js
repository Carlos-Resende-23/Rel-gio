const horas = document.getElementById("horas")
const minutos = document.getElementById("minutos")
const segundos = document.getElementById("segundos")
const data = document.getElementById("data")
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

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
