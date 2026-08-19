// ===== Yachay Verde — Lógica de la aplicación =====
const URL_MODELO = "./model/";
const UMBRAL_CONFIANZA = 0.70;
const PROXY_URL_GEMINI = "https://yachay-verde-proxy.caicaver94.workers.dev";
const LIMITE_CHAT_GRATUITO = 5;
const CODIGO_DEMO = "YACHAY-SALUD-2026";

let model;

const fichas = {
  "Hercampuri": {
    quechua: "Hjircan Pureck (también conocido como harcapura o chavín)",
    uso: "Se usa tradicionalmente para cuidar el hígado, ayudar a la digestión, como apoyo en personas con diabetes, para eliminar líquidos del cuerpo (diurético) y para ayudar a bajar el colesterol.",
    parte: "Hojas y planta entera.",
    dosis: "Cocimiento de 3 a 5 gramos por litro de agua; se toma 1 taza en ayunas.",
    contraindicacion: "No se recomienda en mujeres gestantes, personas muy delgadas o con tendencia a bajar de azúcar en la sangre.",
    combinaciones: "Precaución razonada (no un estudio de interacción específico): al tener efecto antidiabético y diurético propio, se sugiere prudencia si se usa junto con medicamentos para la diabetes o diuréticos recetados, y consultar al médico antes de combinarlos.",
    fuente: "Grupo Técnico Nacional Plantas Medicinales (2006); Cuadros Oriundo y Guevara Pérez (2023)."
  },
  "Muña": {
    quechua: "Muña (el mismo término se usa en quechua y en español)",
    uso: "Ayuda a la digestión: alivia cólicos, gases, indigestión y molestias estomacales. También se usa de forma complementaria para molestias respiratorias e inflamación de la boca.",
    parte: "Hojas, flores y tallos.",
    dosis: "Infusión o decocción, 2 veces al día.",
    contraindicacion: "Usarla en dosis altas o por tiempo prolongado puede afectar el hígado y los pulmones; no abusar de la cantidad ni del tiempo de uso.",
    combinaciones: "Por su riesgo reportado de toxicidad hepática en dosis altas, se recomienda evitar su uso prolongado junto con alcohol u otras sustancias que también afecten el hígado.",
    fuente: "Linares Otoya (2020); Muñoz-Guerra et al. (2025); León-Marrou et al. (2023)."
  },
  "Tara": {
    quechua: "Tara (también llamada taya, voz de origen quechua)",
    uso: "Sus vainas se usan en gárgaras para aliviar la amigdalitis, y sus hojas en infusión para molestias en la boca (estomatitis). También se le reconoce un efecto protector del estómago y el hígado.",
    parte: "Vainas y hojas.",
    dosis: "Gárgaras o infusión de las vainas; infusión de las hojas.",
    contraindicacion: "No se reportaron contraindicaciones específicas en las fuentes revisadas; se recomienda un uso moderado por su alto contenido de taninos.",
    combinaciones: "Principio general (no específico de esta planta): los taninos, presentes en la tara, pueden reducir la absorción de suplementos de hierro; se sugiere no tomarlos juntos.",
    fuente: "PromPerú (s. f.); Callohuari, Sandoval y Miranda (2020)."
  },
  "Valeriana": {
    quechua: "Maych'a",
    uso: "Calma los nervios y ayuda a conciliar el sueño; se usa tradicionalmente para el insomnio y el nerviosismo.",
    parte: "Raíz.",
    dosis: "Hervir 10 gramos de raíz seca en 1 litro de agua durante 5 minutos; tomar 1 taza antes de dormir.",
    contraindicacion: "Se recomienda no combinarla con sedantes ni alcohol sin consultar antes con un profesional de salud.",
    combinaciones: "Evitar combinar con sedantes, ansiolíticos recetados o alcohol, ya que su efecto calmante podría sumarse al de estas sustancias.",
    fuente: "Ascate-Pasos et al. (2020); Tesis UNC — Medina Tello; estudio Scielo Perú."
  }
};

const otrasPlantas = {
  "Llantén": {
    quechua: "No documentado en fuentes consultadas para este proyecto.",
    uso: "Usado tradicionalmente para afecciones respiratorias (tos), y de forma externa para cicatrizar heridas leves.",
    parte: "Hojas.",
    dosis: "Infusión de hojas para uso interno; hojas machacadas para uso externo.",
    contraindicacion: "No reportada en la fuente consultada.",
    combinaciones: "No evaluado en este proyecto.",
    fuente: "MINSA (2025), información general de difusión pública. No forma parte de la investigación validada de Yachay Verde ni es identificable por la cámara."
  },
  "Eucalipto": {
    quechua: "No documentado en fuentes consultadas para este proyecto.",
    uso: "Usado tradicionalmente para afecciones respiratorias, principalmente mediante inhalaciones de vapor.",
    parte: "Hojas.",
    dosis: "Inhalación de vapor de la infusión de hojas.",
    contraindicacion: "No reportada en la fuente consultada.",
    combinaciones: "No evaluado en este proyecto.",
    fuente: "PromPerú / Peru.info, información general de difusión pública. No forma parte de la investigación validada de Yachay Verde ni es identificable por la cámara."
  }
};

/* ===================== NIVEL DE USUARIO (Gratuito / Pro) ===================== */
function esPro() { return localStorage.getItem("yv_nivel") === "pro"; }
function activarPro() {
  localStorage.setItem("yv_nivel", "pro");
  actualizarUIPorNivel();
}
function desactivarPro() {
  localStorage.removeItem("yv_nivel");
  actualizarUIPorNivel();
}
function actualizarUIPorNivel() {
  const pro = esPro();
  document.getElementById("badge-pro").hidden = !pro;
  document.getElementById("tarjeta-upsell").hidden = pro;
  document.querySelectorAll(".upsell-card-mini").forEach(el => el.hidden = pro);
  actualizarContadorChat();
}

/* ===================== NAVEGACIÓN PRINCIPAL ===================== */
function irATab(idTab) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.tab === idTab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === idTab));
  window.scrollTo({ top: 0, behavior: "instant" });
}
document.querySelectorAll(".nav-item, .btn-accion-principal").forEach(btn => {
  btn.addEventListener("click", () => irATab(btn.dataset.tab));
});

/* ===================== DRAWER Y PANELES ===================== */
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("overlay");

function abrirDrawer() { drawer.classList.add("open"); overlay.classList.add("show"); }
function cerrarTodo() { drawer.classList.remove("open"); overlay.classList.remove("show"); }
function irAInicio() {
  cerrarTodo();
  document.querySelectorAll(".modal.panel-lateral").forEach(p => p.hidden = true);
  irATab("tab-inicio");
}

document.getElementById("btn-menu").addEventListener("click", abrirDrawer);
document.getElementById("btn-logo-inicio").addEventListener("click", irAInicio);
overlay.addEventListener("click", cerrarTodo);

document.querySelectorAll("[data-panel]").forEach(item => {
  item.addEventListener("click", () => {
    cerrarTodo();
    document.getElementById(item.dataset.panel).hidden = false;
  });
});
document.querySelectorAll(".btn-cerrar-panel").forEach(btn => {
  btn.addEventListener("click", e => e.target.closest(".modal").hidden = true);
});

/* ===================== SNACKBAR ===================== */
function mostrarSnackbar(mensaje) {
  const sb = document.getElementById("snackbar");
  sb.textContent = mensaje;
  sb.classList.add("show");
  setTimeout(() => sb.classList.remove("show"), 2500);
}

/* ===================== MODO OSCURO / CLARO ===================== */
function aplicarTema(oscuro) {
  document.documentElement.classList.toggle("dark", oscuro);
  document.getElementById("switch-tema").checked = oscuro;
  document.getElementById("btn-tema").querySelector(".material-symbols-outlined").textContent = oscuro ? "light_mode" : "dark_mode";
  localStorage.setItem("yv_tema", oscuro ? "oscuro" : "claro");
}
document.getElementById("btn-tema").addEventListener("click", () => aplicarTema(!document.documentElement.classList.contains("dark")));
document.getElementById("switch-tema").addEventListener("change", e => aplicarTema(e.target.checked));
aplicarTema(localStorage.getItem("yv_tema") === "oscuro");

/* ===================== TAMAÑO DE FUENTE ===================== */
function aplicarFuente(escala) {
  document.documentElement.style.setProperty("--font-scale", escala);
  localStorage.setItem("yv_fuente", escala);
}
let escalaFuente = parseFloat(localStorage.getItem("yv_fuente") || "1");
aplicarFuente(escalaFuente);
document.getElementById("btn-fuente-mas").addEventListener("click", () => { escalaFuente = Math.min(1.3, escalaFuente + 0.1); aplicarFuente(escalaFuente); });
document.getElementById("btn-fuente-menos").addEventListener("click", () => { escalaFuente = Math.max(0.85, escalaFuente - 0.1); aplicarFuente(escalaFuente); });

/* ===================== ACORDEONES ===================== */
document.querySelectorAll("#panel-fuentes .catalogo-item-header").forEach(header => {
  header.addEventListener("click", () => header.closest(".catalogo-item").classList.toggle("open"));
});

/* ===================== CARGAR MODELO ===================== */
async function cargarModelo() {
  const estado = document.getElementById("estado-modelo");
  try {
    model = await tmImage.load(URL_MODELO + "model.json", URL_MODELO + "metadata.json");
    estado.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Modelo listo. Sube una foto.';
  } catch (e) {
    estado.innerHTML = '<span class="material-symbols-outlined">wifi_off</span> No se pudo cargar el modelo. Verifica tu conexión.';
    console.error(e);
  }
}

/* ===================== FICHA HTML ===================== */
function construirFichaHTML(nombre, info) {
  const teaserPro = esPro() ? "" : `
    <div class="ficha-teaser-pro" data-panel="panel-especialistas">
      <span class="material-symbols-outlined">lock</span>
      <span>Los usuarios Pro ven aquí la ficha clínica ampliada con compuestos bioactivos.</span>
    </div>`;
  return `
    <h3>${nombre}</h3>
    <div class="ficha-section"><strong>Nombre en quechua</strong>${info.quechua}</div>
    <div class="ficha-section"><strong>¿Para qué se usa?</strong>${info.uso}</div>
    <div class="ficha-section"><strong>Parte que se usa</strong>${info.parte}</div>
    <div class="ficha-section"><strong>Cómo se prepara</strong>${info.dosis}</div>
    <div class="ficha-section"><strong>Precauciones</strong>${info.contraindicacion}</div>
    <div class="ficha-combinaciones"><span class="material-symbols-outlined">warning</span> <strong>Combinaciones a evitar:</strong> ${info.combinaciones}</div>
    <div class="ficha-acciones">
      <button class="btn-tonal btn-escuchar" data-planta="${nombre}"><span class="material-symbols-outlined">volume_up</span> Escuchar</button>
      <button class="btn-tonal btn-compartir" data-planta="${nombre}"><span class="material-symbols-outlined">share</span> Compartir</button>
    </div>
    ${teaserPro}
    <div class="ficha-fuente">Fuente: ${info.fuente}</div>
  `;
}

/* ===================== PREDICCIÓN ===================== */
let timeoutReintento;
async function predecir(imagenElemento) {
  if (!model) { mostrarSnackbar("El modelo aún no está listo."); return; }
  const prediccion = await model.predict(imagenElemento);
  prediccion.sort((a, b) => b.probability - a.probability);
  const mejor = prediccion[0];

  const reintentoCard = document.getElementById("reintento-card");
  const resultadoCard = document.getElementById("resultado-card");
  const fichaDiv = document.getElementById("ficha");
  clearTimeout(timeoutReintento);

  if (mejor.probability < UMBRAL_CONFIANZA) {
    reintentoCard.hidden = false;
    resultadoCard.hidden = true;
    fichaDiv.hidden = true;
    timeoutReintento = setTimeout(() => { reintentoCard.hidden = true; }, 6000);
    return;
  }

  reintentoCard.hidden = true;
  resultadoCard.hidden = false;
  document.getElementById("resultado-nombre").textContent = mejor.className;
  document.getElementById("resultado-confianza").innerHTML =
    `<span class="material-symbols-outlined">verified</span> ${(mejor.probability * 100).toFixed(1)}% de confianza`;

  const otrasDiv = document.getElementById("otras-posibilidades");
  const alternativas = prediccion.slice(1).filter(p => p.probability > 0.05);
  otrasDiv.innerHTML = alternativas.length > 0
    ? "<strong>Otras posibilidades:</strong>" + alternativas.map(p => `
      <div class="otra-posibilidad-item">
        <span>${p.className}</span>
        <div class="barra-prob"><div class="barra-prob-fill" style="width:${(p.probability*100).toFixed(0)}%"></div></div>
        <span>${(p.probability*100).toFixed(0)}%</span>
      </div>`).join("")
    : "";

  const info = fichas[mejor.className];
  if (info) {
    fichaDiv.hidden = false;
    fichaDiv.innerHTML = construirFichaHTML(mejor.className, info);
    guardarEnHistorial(mejor.className, mejor.probability);
  }
}

document.getElementById("input-foto").addEventListener("change", e => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  const img = document.getElementById("imagen-preview");
  img.src = URL.createObjectURL(archivo);
  img.style.display = "block";
  img.onload = () => predecir(img);
});

/* ===================== CÁMARA EN VIVO + FLASH ===================== */
let streamActual, trackActual;
const modalCamara = document.getElementById("modal-camara");
const videoCamara = document.getElementById("video-camara");

document.getElementById("btn-abrir-camara").addEventListener("click", async () => {
  try {
    streamActual = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    videoCamara.srcObject = streamActual;
    trackActual = streamActual.getVideoTracks()[0];
    modalCamara.hidden = false;
    const capacidades = trackActual.getCapabilities ? trackActual.getCapabilities() : {};
    const btnFlash = document.getElementById("btn-flash");
    if (capacidades.torch) { btnFlash.hidden = false; btnFlash.dataset.activo = "false"; }
    else { btnFlash.hidden = true; }
  } catch (err) {
    mostrarSnackbar("No se pudo acceder a la cámara. Revisa los permisos.");
  }
});

document.getElementById("btn-flash").addEventListener("click", async e => {
  const btn = e.currentTarget;
  const activo = btn.dataset.activo === "true";
  try {
    await trackActual.applyConstraints({ advanced: [{ torch: !activo }] });
    btn.dataset.activo = String(!activo);
    btn.querySelector(".material-symbols-outlined").textContent = !activo ? "flash_on" : "flash_off";
  } catch { mostrarSnackbar("El flash no es compatible con este navegador."); }
});

document.getElementById("btn-capturar").addEventListener("click", () => {
  const canvas = document.getElementById("canvas-captura");
  canvas.width = videoCamara.videoWidth;
  canvas.height = videoCamara.videoHeight;
  canvas.getContext("2d").drawImage(videoCamara, 0, 0);
  const img = document.getElementById("imagen-preview");
  img.src = canvas.toDataURL("image/jpeg");
  img.style.display = "block";
  img.onload = () => predecir(img);
  cerrarCamara();
});
document.getElementById("btn-cerrar-camara").addEventListener("click", cerrarCamara);
function cerrarCamara() {
  if (streamActual) streamActual.getTracks().forEach(t => t.stop());
  modalCamara.hidden = true;
}

/* ===================== HISTORIAL LOCAL ===================== */
function guardarEnHistorial(especie, confianza) {
  const historial = JSON.parse(localStorage.getItem("yv_historial") || "[]");
  historial.unshift({ especie, confianza: (confianza * 100).toFixed(0), fecha: new Date().toLocaleDateString("es-PE") });
  localStorage.setItem("yv_historial", JSON.stringify(historial.slice(0, 8)));
  renderHistorial();
}
function renderHistorial() {
  const historial = JSON.parse(localStorage.getItem("yv_historial") || "[]");
  [document.getElementById("historial-chips"), document.getElementById("historial-chips-inicio")].forEach(cont => {
    if (!cont) return;
    cont.innerHTML = "";
    if (historial.length === 0) {
      cont.innerHTML = '<span class="historial-nota">Aún no has identificado ninguna planta.</span>';
      return;
    }
    historial.slice(0, 5).forEach(item => {
      const chip = document.createElement("button");
      chip.className = "historial-chip";
      chip.textContent = `${item.especie} · ${item.confianza}% · ${item.fecha}`;
      chip.addEventListener("click", () => { irATab("tab-identificar"); mostrarFichaDesdeHistorial(item.especie); });
      cont.appendChild(chip);
    });
  });
}
function mostrarFichaDesdeHistorial(nombre) {
  const info = fichas[nombre];
  if (!info) return;
  document.getElementById("reintento-card").hidden = true;
  document.getElementById("resultado-card").hidden = true;
  const fichaDiv = document.getElementById("ficha");
  fichaDiv.hidden = false;
  fichaDiv.innerHTML = construirFichaHTML(nombre, info);
}
document.getElementById("btn-borrar-historial").addEventListener("click", () => {
  localStorage.removeItem("yv_historial");
  renderHistorial();
  mostrarSnackbar("Historial borrado");
});

/* ===================== CATÁLOGO ===================== */
let conjuntoActivo = "validadas";
document.querySelectorAll(".segmented-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".segmented-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    conjuntoActivo = btn.dataset.set;
    renderCatalogo(document.getElementById("buscador-catalogo").value);
  });
});

function renderCatalogo(filtro = "") {
  const cont = document.getElementById("lista-catalogo");
  cont.innerHTML = "";
  const fuenteDatos = conjuntoActivo === "validadas" ? fichas : otrasPlantas;
  const filtroLower = filtro.toLowerCase();

  Object.entries(fuenteDatos).forEach(([nombre, info]) => {
    const textoCompleto = (nombre + " " + info.uso + " " + info.quechua).toLowerCase();
    if (filtro && !textoCompleto.includes(filtroLower)) return;
    const item = document.createElement("div");
    item.className = "catalogo-item";
    item.innerHTML = `
      <div class="catalogo-item-header">
        <h3>${nombre}</h3>
        <span class="material-symbols-outlined expand-icon">expand_more</span>
      </div>
      <div class="catalogo-item-body">${construirFichaHTML(nombre, info)}</div>
    `;
    item.querySelector(".catalogo-item-header").addEventListener("click", () => item.classList.toggle("open"));
    cont.appendChild(item);
  });

  if (cont.innerHTML === "") cont.innerHTML = '<p class="historial-nota">No se encontraron resultados para tu búsqueda.</p>';
}
document.getElementById("buscador-catalogo").addEventListener("input", e => renderCatalogo(e.target.value));

/* ===================== ESCUCHAR, COMPARTIR Y TEASER PRO (delegación) ===================== */
document.addEventListener("click", e => {
  if (e.target.closest(".btn-escuchar")) {
    const nombre = e.target.closest(".btn-escuchar").dataset.planta;
    const info = fichas[nombre] || otrasPlantas[nombre];
    if (!info) return;
    const texto = `${nombre}. En quechua: ${info.quechua}. Uso: ${info.uso}`;
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = "es-PE";
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
      mostrarSnackbar("Reproduciendo en español (pronunciación quechua aproximada)");
    } else { mostrarSnackbar("Tu navegador no soporta audio de texto a voz."); }
  }

  if (e.target.closest(".btn-compartir")) {
    const nombre = e.target.closest(".btn-compartir").dataset.planta;
    const info = fichas[nombre] || otrasPlantas[nombre];
    const texto = `${nombre} (${info.quechua}) — ${info.uso} Fuente: ${info.fuente}`;
    if (navigator.share) navigator.share({ title: `Yachay Verde: ${nombre}`, text: texto });
    else { navigator.clipboard.writeText(texto); mostrarSnackbar("Información copiada al portapapeles"); }
  }

  const teaser = e.target.closest(".ficha-teaser-pro");
  if (teaser) {
    document.getElementById(teaser.dataset.panel).hidden = false;
  }
});

/* ===================== ESPECIALISTAS / PRO ===================== */
document.getElementById("btn-validar-codigo").addEventListener("click", () => {
  const valor = document.getElementById("input-codigo-acceso").value.trim().toUpperCase();
  if (valor === CODIGO_DEMO) {
    document.getElementById("especialista-bloqueado").hidden = true;
    document.getElementById("especialista-desbloqueado").hidden = false;
    activarPro();
    mostrarSnackbar("¡Bienvenido al plan Pro!");
  } else {
    mostrarSnackbar("Código incorrecto. Verifica con el equipo del proyecto.");
  }
});
document.getElementById("btn-cerrar-sesion-pro").addEventListener("click", () => {
  document.getElementById("especialista-bloqueado").hidden = false;
  document.getElementById("especialista-desbloqueado").hidden = true;
  desactivarPro();
  mostrarSnackbar("Sesión Pro cerrada");
});
(function restaurarSesionPro() {
  if (esPro()) {
    document.getElementById("especialista-bloqueado").hidden = true;
    document.getElementById("especialista-desbloqueado").hidden = false;
  }
})();

/* ===================== MI PERFIL ===================== */
document.getElementById("btn-guardar-perfil").addEventListener("click", () => {
  const perfil = { tipo: document.getElementById("perfil-tipo").value, zona: document.getElementById("perfil-zona").value };
  localStorage.setItem("yv_perfil", JSON.stringify(perfil));
  document.getElementById("perfil-guardado-nota").hidden = false;
  mostrarSnackbar("Perfil guardado en este dispositivo");
});
(function cargarPerfil() {
  const perfil = JSON.parse(localStorage.getItem("yv_perfil") || "null");
  if (perfil) {
    document.getElementById("perfil-tipo").value = perfil.tipo || "";
    document.getElementById("perfil-zona").value = perfil.zona || "";
  }
})();

/* ===================== ASISTENTE GEMINI (con cuota Gratuito/Pro) ===================== */
function obtenerUsoChatHoy() {
  const hoy = new Date().toLocaleDateString("es-PE");
  const registro = JSON.parse(localStorage.getItem("yv_chat_uso") || "{}");
  return registro.fecha === hoy ? registro.cantidad : 0;
}
function incrementarUsoChatHoy() {
  const hoy = new Date().toLocaleDateString("es-PE");
  const registro = JSON.parse(localStorage.getItem("yv_chat_uso") || "{}");
  const cantidad = registro.fecha === hoy ? registro.cantidad + 1 : 1;
  localStorage.setItem("yv_chat_uso", JSON.stringify({ fecha: hoy, cantidad }));
}
function actualizarContadorChat() {
  const cuotaDiv = document.getElementById("chat-cuota");
  const input = document.getElementById("chat-input");
  if (esPro()) {
    cuotaDiv.innerHTML = '<span class="material-symbols-outlined">all_inclusive</span> Preguntas ilimitadas (Pro)';
    input.disabled = false;
    return;
  }
  const usadas = obtenerUsoChatHoy();
  const restantes = Math.max(0, LIMITE_CHAT_GRATUITO - usadas);
  cuotaDiv.innerHTML = `<span class="material-symbols-outlined">chat</span> ${restantes} de ${LIMITE_CHAT_GRATUITO} preguntas gratis hoy`;
  input.disabled = restantes === 0;
  if (restantes === 0) input.placeholder = "Límite diario alcanzado. Hazte Pro para preguntas ilimitadas.";
}

function agregarMensajeChat(texto, tipo) {
  const cont = document.getElementById("chat-mensajes");
  const msg = document.createElement("div");
  msg.className = `chat-msg ${tipo}`;
  msg.textContent = texto;
  cont.appendChild(msg);
  cont.scrollTop = cont.scrollHeight;
}

async function enviarMensajeChat() {
  const input = document.getElementById("chat-input");
  const texto = input.value.trim();
  if (!texto) return;

  if (!esPro() && obtenerUsoChatHoy() >= LIMITE_CHAT_GRATUITO) {
    mostrarSnackbar("Alcanzaste el límite gratuito de hoy. Ve a Especialistas para conocer el plan Pro.");
    return;
  }

  agregarMensajeChat(texto, "usuario");
  input.value = "";
  agregarMensajeChat("Escribiendo...", "bot");
  if (!esPro()) incrementarUsoChatHoy();
  actualizarContadorChat();

  try {
    const respuesta = await fetch(PROXY_URL_GEMINI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: texto })
    });
    const data = await respuesta.json();
    document.querySelector(".chat-msg.bot:last-child").textContent = data.respuesta;
  } catch (err) {
    document.querySelector(".chat-msg.bot:last-child").textContent =
      "No se pudo conectar con el asistente. Verifica tu conexión a internet e inténtalo de nuevo.";
  }
}
document.getElementById("chat-enviar").addEventListener("click", enviarMensajeChat);
document.getElementById("chat-input").addEventListener("keydown", e => { if (e.key === "Enter") enviarMensajeChat(); });

/* ===================== INSTALACIÓN PWA ===================== */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("btn-instalar").hidden = false;
});
document.getElementById("btn-instalar").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("btn-instalar").hidden = true;
});

/* ===================== SERVICE WORKER ===================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW no registrado:", err));
  });
}

/* ===================== INICIALIZACIÓN ===================== */
cargarModelo();
renderHistorial();
renderCatalogo();
actualizarUIPorNivel();
