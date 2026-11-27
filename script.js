import { iniciarRelogioETema } from "./relogio-tema.js"
import { iniciarCronometro } from "./cronometro.js"
import { iniciarTemporizador } from "./temporizador.js"

iniciarRelogioETema()
iniciarCronometro()
iniciarTemporizador()

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // O aplicativo continua funcionando sem cache offline.
    })
  })
}
