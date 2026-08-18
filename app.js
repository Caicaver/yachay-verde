// ===== Yachay Verde — Lógica de la aplicación =====
const URL_MODELO = "./model/";
const UMBRAL_CONFIANZA = 0.70;
let model;

const fichas = {
  "Hercampuri": {
    quechua: "Hjircan Pureck (también conocido como harcapura o chavín)",
    uso: "Se usa tradicionalmente para cuidar el hígado, ayudar a la digestión, como apoyo en personas con diabetes, para eliminar líquidos del cuerpo (diurético) y para ayudar a bajar el colesterol.",
    parte: "Hojas y planta entera.",
    dosis: "Cocimiento de 3 a 5 gramos por litro de agua; se toma 1 taza en ayunas.",
    contraindicacion: "No se recomienda en mujeres gestantes, personas muy delgadas o con tendencia a bajar de azúcar en la sangre.",
    fuente: "Grupo Técnico Nacional Plantas Medicinales (2006); Cuadros Oriundo y Guevara Pérez (2023)."
  },
  "Muña": {
    quechua: "Muña (el mismo término se usa en quechua y en español)",
    uso: "Ayuda a la digestión: alivia cólicos, gases, indigestión y molestias estomacales. También se usa de forma complementaria para molestias respiratorias e inflamación de la boca.",
    parte: "Hojas, flores y tallos.",
    dosis: "Infusión o decocción, 2 veces al día.",
    contraindicacion: "Usarla en dosis altas o por tiempo prolongado puede afectar el hígado y los pulmones; no abusar de la cantidad ni del tiempo de uso.",
    fuente: "Linares Otoya (2020); Muñoz-Guerra et al. (2025); León-Marrou et al. (2023)."
  },
  "Tara": {
    quechua: "Tara (también llamada taya, voz de origen quechua)",
    uso: "Sus vainas se usan en gárgaras para aliviar la amigdalitis, y sus hojas en infusión para molestias en la boca (estomatitis). También se le reconoce un efecto protector del estómago y el hígado.",
    parte: "Vainas y hojas.",
    dosis: "Gárgaras o infusión de las vainas; infusión de las hojas.",
    contraindicacion: "No se reportaron contraindicaciones específicas en las fuentes revisadas; se recomienda un uso moderado por su alto contenido de taninos.",
    fuente: "PromPerú (s. f.); Callohuari, Sandoval y Huamán (2017); López, Oré y Miranda (2020)."
  },
  "Valeriana": {
    quechua: "Maych'a",
    uso: "Calma los nervios y ayuda a conciliar el sueño; se usa tradicionalmente para el insomnio y el nerviosismo.",
    parte: "Raíz.",
    dosis: "Hervir 10 gramos de raíz seca en 1 litro de agua durante 5 minutos; tomar 1 taza antes de dormir.",
    contraindicacion: "Se recomienda no combinarla con sedantes ni alcohol sin consultar antes con un profesional de salud.",
    fuente: "Ascate-Pasos et al. (2020); Tesis UNC — Medina Tello; estudio Scielo Perú."
  }
};

/* ---------- Navegación entre pestañas ---------- */
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* ---------- Snackbar ---------- */
function mostrarSnackbar(mensaje) {
  const sb = document.getElementById("snackbar");
  sb.textContent = mensaje;
  sb.classList.add("show");
  setTimeout(() => sb.classList.remove("show"), 2500);
}

/* ---------- Cargar modelo ---------- */
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

/* ---------- Construir ficha HTML ---------- */
function construirFichaHTML(nombre, info) {
  return `
    <h3>${nombre}</h3>
    <div class="ficha-section"><strong>Nombre en quechua</strong>${info.quechua}</div>
    <div class="ficha-section"><strong>¿Para qué se usa?</strong>${info.uso}</div>
    <div class="ficha-section"><strong>Parte que se usa</strong>${info.parte}</div>
    <div class="ficha-section"><strong>Cómo se prepara</strong>${info.dosis}</div>
    <div class="ficha-section"><strong>Precauciones</strong>${info.contraindicacion}</div>
    <div class="ficha-acciones">
      <button class="btn-tonal btn-escuchar" data-planta="${nombre}"><span class="material-symbols-outlined">volume_up</span> Escuchar</button>
      <button class="btn-tonal btn-compartir" data-planta="${nombre}"><span class="material-symbols-outlined">share</span> Compartir</button>
    </div>
    <div class="ficha-fuente">Fuente: ${info.fuente}</div>
  `;
}

/* ---------- Predicción ---------- */
async function predecir(imagenElemento) {
  if (!model) { mostrarSnackbar("El modelo aún no está listo."); return; }
  const prediccion = await model.predict(imagenElemento);
  prediccion.sort((a, b) => b.probability - a.probability);
  const mejor = prediccion[0];

  const reintentoCard = document.getElementById("reintento-card");
  const resultadoCard = document.getElementById("resultado-card");
  const fichaDiv = document.getElementById("ficha");

  if (mejor.probability < UMBRAL_CONFIANZA) {
    reintentoCard.hidden = false;
    resultadoCard.hidden = true;
    fichaDiv.hidden = true;
    return;
  }

  reintentoCard.hidden = true;
  resultadoCard.hidden = false;
  document.getElementById("resultado-nombre").textContent = mejor.className;
  document.getElementById("resultado-confianza").innerHTML =
    `<span class="material-symbols-outlined">verified</span> ${(mejor.probability * 100).toFixed(1)}% de confianza`;

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

/* ---------- Historial local (sin datos personales) ---------- */
function guardarEnHistorial(especie, confianza) {
  const historial = JSON.parse(localStorage.getItem("yv_historial") || "[]");
  historial.unshift({ especie, confianza: (confianza * 100).toFixed(0), fecha: new Date().toLocaleDateString("es-PE") });
  localStorage.setItem("yv_historial", JSON.stringify(historial.slice(0, 8)));
  renderHistorial();
}

function renderHistorial() {
  const cont = document.getElementById("historial-chips");
  const historial = JSON.parse(localStorage.getItem("yv_historial") || "[]");
  cont.innerHTML = "";
  if (historial.length === 0) {
    cont.innerHTML = '<span class="historial-nota">Aún no has identificado ninguna planta.</span>';
    return;
  }
  historial.forEach(item => {
    const chip = document.createElement("button");
    chip.className = "historial-chip";
    chip.textContent = `${item.especie} · ${item.confianza}% · ${item.fecha}`;
    chip.addEventListener("click", () => mostrarFichaDesdeHistorial(item.especie));
    cont.appendChild(chip);
  });
}

function mostrarFichaDesdeHistorial(nombre) {
  const info = fichas[nombre];
  if (!info) return;
  const fichaDiv = document.getElementById("ficha");
  document.getElementById("reintento-card").hidden = true;
  document.getElementById("resultado-card").hidden = true;
  fichaDiv.hidden = false;
  fichaDiv.innerHTML = construirFichaHTML(nombre, info);
}

document.getElementById("btn-borrar-historial").addEventListener("click", () => {
  localStorage.removeItem("yv_historial");
  renderHistorial();
  mostrarSnackbar("Historial borrado");
});

/* ---------- Catálogo con buscador ---------- */
function renderCatalogo(filtro = "") {
  const cont = document.getElementById("lista-catalogo");
  cont.innerHTML = "";
  const filtroLower = filtro.toLowerCase();
  Object.entries(fichas).forEach(([nombre, info]) => {
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
    item.querySelector(".catalogo-item-header").addEventListener("click", () => {
      item.classList.toggle("open");
    });
    cont.appendChild(item);
  });
}

document.getElementById("buscador-catalogo").addEventListener("input", e => {
  renderCatalogo(e.target.value);
});

/* ---------- Escuchar (texto a voz) y Compartir (delegación de eventos) ---------- */
document.addEventListener("click", e => {
  if (e.target.closest(".btn-escuchar")) {
    const nombre = e.target.closest(".btn-escuchar").dataset.planta;
    const info = fichas[nombre];
    if (!info) return;
    const texto = `${nombre}. En quechua: ${info.quechua}. Uso: ${info.uso}`;
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = "es-PE";
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
      mostrarSnackbar("Reproduciendo en español (pronunciación quechua aproximada)");
    } else {
      mostrarSnackbar("Tu navegador no soporta audio de texto a voz.");
    }
  }

  if (e.target.closest(".btn-compartir")) {
    const nombre = e.target.closest(".btn-compartir").dataset.planta;
    const info = fichas[nombre];
    const texto = `${nombre} (${info.quechua}) — ${info.uso} Fuente: ${info.fuente}`;
    if (navigator.share) {
      navigator.share({ title: `Yachay Verde: ${nombre}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      mostrarSnackbar("Información copiada al portapapeles");
    }
  }
});

/* ---------- Instalación PWA ---------- */
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

/* ---------- Registrar Service Worker (modo sin conexión) ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW no registrado:", err));
  });
}

/* ---------- Inicialización ---------- */
cargarModelo();
renderHistorial();
renderCatalogo();
