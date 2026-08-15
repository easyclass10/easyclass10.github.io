// =====================================================================
// EasyClass · s.js  (v2)
// Cliente del widget. Habla ÚNICAMENTE con la Edge Function "chat".
// La API key del modelo nunca toca el navegador.
//
// La anon key de abajo es pública por diseño: con RLS activado y sin
// políticas para anon, no da acceso a ninguna tabla. La que jamás
// puede salir del Dashboard es la service_role.
// =====================================================================

import { createClient } from "@supabase/supabase-js";

// ─── CONFIGURA ESTAS DOS LÍNEAS ──────────────────────────────────────
const SUPABASE_URL = "https://qyegntfgtamllmwbdoeb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWdudGZndGFtbGxtd2Jkb2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjAxMDUsImV4cCI6MjA5NjU5NjEwNX0.ZJ6Fidp3zGb9FhrV8nSFFO7PTu-fjRhEuAO6OYfWWNw";
// ─────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = "easyclass-archivos";
const WHATSAPP = "573044435307";
const MAX_HISTORIAL = 24;

// ─── PAÍSES ──────────────────────────────────────────────────────────
const COUNTRIES = [
  ["Antigua y Barbuda", "+1"], ["Argentina", "+54"], ["Aruba", "+297"],
  ["Bahamas", "+1"], ["Barbados", "+1"], ["Belice", "+501"],
  ["Bermudas", "+1"], ["Bolivia", "+591"], ["Brasil", "+55"],
  ["Canadá", "+1"], ["Chile", "+56"], ["Colombia", "+57"],
  ["Costa Rica", "+506"], ["Cuba", "+53"], ["Curazao", "+599"],
  ["Dominica", "+1"], ["Ecuador", "+593"], ["El Salvador", "+503"],
  ["España", "+34"], ["Estados Unidos", "+1"], ["Granada", "+1"],
  ["Groenlandia", "+299"], ["Guadalupe", "+590"], ["Guatemala", "+502"],
  ["Guayana Francesa", "+594"], ["Guyana", "+592"], ["Haití", "+509"],
  ["Honduras", "+504"], ["Islas Caimán", "+1"], ["Islas Vírgenes (EE.UU.)", "+1"],
  ["Italia", "+39"], ["Jamaica", "+1"], ["Martinica", "+596"],
  ["México", "+52"], ["Nicaragua", "+505"], ["Panamá", "+507"],
  ["Paraguay", "+595"], ["Perú", "+51"], ["Portugal", "+351"],
  ["Puerto Rico", "+1"], ["República Dominicana", "+1"],
  ["San Cristóbal y Nieves", "+1"], ["San Vicente y las Granadinas", "+1"],
  ["Santa Lucía", "+1"], ["Surinam", "+597"], ["Trinidad y Tobago", "+1"],
  ["Uruguay", "+598"], ["Venezuela", "+58"],
];

// ─── ELEMENTOS ───────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const el = {
  overlay: $("user-modal-overlay"),
  form: $("user-form"),
  countryName: $("country-name"),
  countryList: $("country-list"),
  countryCode: $("country-code"),
  whatsapp: $("whatsapp-number"),
  modalBtn: $("modal-submit-btn"),
  modalError: $("modal-error"),
  status: $("chat-status"),
  resetBtn: $("reset-btn"),
  messages: $("chat-messages"),
  quickReplies: $("quick-replies"),
  special: $("special-inputs-container"),
  fileInput: $("file-upload-input"),
  uploadBtn: $("upload-btn"),
  input: $("user-input"),
  sendBtn: $("send-btn"),
};

// ─── ESTADO ──────────────────────────────────────────────────────────
let user = null;      // { country, country_code, phone }
let history = [];     // [{ role:'user'|'model', parts:[{text}], silent? }]
let sessionId = null;
let ocupado = false;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* incógnito */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* incógnito */ } },
};

function nuevaSesion() {
  return "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function guardarHistorial() {
  store.set("easyclass_history", JSON.stringify(history.slice(-MAX_HISTORIAL)));
}

// ─── TEXTO → HTML ────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function chipCopiar(valor, texto = valor) {
  return `<button type="button" class="copiable" data-copiar="${escapeHtml(valor)}" ` +
    `aria-label="Copiar ${escapeHtml(texto)}"><span>${escapeHtml(texto)}</span>` +
    `<i class="fas fa-copy" aria-hidden="true"></i></button>`;
}

// Convierte números largos y correos sueltos del texto en chips copiables,
// sin tocar lo que ya está dentro de una etiqueta HTML (enlaces, negritas).
function chipsEnTextoPlano(html) {
  return html
    .split(/(<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>)/g)
    .map((seg) => {
      if (seg.startsWith("<")) return seg;
      return seg
        .replace(/(?<![\w@.\-])([\w.\-]+@[\w\-]+(?:\.[\w\-]+)+)(?![\w@])/g,
          (m) => chipCopiar(m))
        // Solo dígitos y espacios: así "2026-08-20" y "$65.000" no se
        // confunden con un número de cuenta.
        .replace(/(?<![\w@.\-])(\+?\d[\d ]{5,17}\d)(?![\w])/g, (m) => {
          const digitos = m.replace(/\D/g, "");
          if (digitos.length < 7 || digitos.length > 15) return m;
          return chipCopiar((m.startsWith("+") ? "+" : "") + digitos, m);
        });
    })
    .join("");
}

function formatear(texto) {
  let html = escapeHtml(texto);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>',
  );
  html = chipsEnTextoPlano(html);
  return html.replace(/\n/g, "<br>");
}

// ─── RENDER ──────────────────────────────────────────────────────────
function alFinal() {
  el.messages.scrollTop = el.messages.scrollHeight;
}

function addMessage(role, texto) {
  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user-message" : "bot-message"}`;
  div.innerHTML = formatear(texto);
  el.messages.appendChild(div);
  alFinal();
  return div;
}

function showTyping() {
  hideTyping();
  const div = document.createElement("div");
  div.className = "message bot-message typing-indicator";
  div.id = "typing-indicator";
  div.innerHTML = "<span></span><span></span><span></span>";
  el.messages.appendChild(div);
  alFinal();
}

function hideTyping() {
  document.getElementById("typing-indicator")?.remove();
}

// Tarjeta con TODAS las cuentas y botón de copiar en cada dato
function renderPago(pago) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "pago-card";

  const grupos = pago.grupos.map((g) => `
    <div class="pago-grupo">
      <h4>${g.bandera} ${escapeHtml(g.pais)}</h4>
      ${g.cuentas.map((c) => `
        <div class="pago-cuenta">
          <div class="pago-entidad">
            <strong>${escapeHtml(c.entidad)}</strong>
            <span>${escapeHtml(c.tipo)}${c.titular ? " · " + escapeHtml(c.titular) : ""}</span>
          </div>
          ${chipCopiar(c.valor)}
        </div>`).join("")}
    </div>`).join("");

  tarjeta.innerHTML = `
    <div class="pago-head"><i class="fas fa-receipt" aria-hidden="true"></i>
      ${escapeHtml(pago.titulo)}</div>
    ${grupos}
    <p class="pago-nota">${escapeHtml(pago.nota)}</p>`;

  el.messages.appendChild(tarjeta);
  alFinal();
}

function renderReserva(b) {
  const f = new Date(b.start_time);
  const cuando = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(f);

  const div = document.createElement("div");
  div.className = "reserva-card";
  div.innerHTML = `
    <div class="reserva-head"><i class="fas fa-calendar-check" aria-hidden="true"></i>
      Reserva registrada</div>
    <div class="reserva-linea"><span>Servicio</span><b>${escapeHtml(b.service_type)} de ${escapeHtml(b.subject)}</b></div>
    <div class="reserva-linea"><span>Cuándo</span><b>${escapeHtml(cuando)}</b></div>
    ${b.duration_minutes ? `<div class="reserva-linea"><span>Duración</span><b>${b.duration_minutes} min</b></div>` : ""}
    ${b.price ? `<div class="reserva-linea"><span>Valor</span><b>${Number(b.price).toLocaleString("es-CO")} ${escapeHtml(b.currency || "COP")}</b></div>` : ""}
    <div class="reserva-linea"><span>Estado</span><b class="estado">${escapeHtml(b.status)}</b></div>`;
  el.messages.appendChild(div);
  alFinal();
}

function renderWhatsapp(numero) {
  const texto = encodeURIComponent("Hola, vengo del chat de EasyClass.");
  const a = document.createElement("a");
  a.className = "wa-btn";
  a.href = `https://wa.me/${String(numero).replace(/\D/g, "")}?text=${texto}`;
  a.target = "_blank";
  a.rel = "noopener";
  a.innerHTML = `<i class="fab fa-whatsapp" aria-hidden="true"></i> Escribir a un asesor`;
  el.messages.appendChild(a);
  alFinal();
}

// ─── PARSEO DE LA RESPUESTA ──────────────────────────────────────────
function parseReply(raw) {
  const buttons = [];
  const re = /\[button:([^\]]+)\]/g;
  let m;
  while ((m = re.exec(raw)) !== null) buttons.push(m[1].trim());

  const pideFecha = /\[REQUEST_DATE\]/i.test(raw);
  const pideHora = /\[REQUEST_TIME\]/i.test(raw);

  const texto = raw
    .replace(/\[BOOKING_JSON\][\s\S]*?\[\/BOOKING_JSON\]/gi, "")
    .replace(/\[button:[^\]]+\]/g, "")
    .replace(/\[REQUEST_DATE\]|\[REQUEST_TIME\]|\[PAGO\]|\[WHATSAPP\]/gi, "")
    .replace(/\[CONTEXTO_[^\]]*\]/gi, "")
    .replace(/\[INFO_SISTEMA:[^\]]*\]/gi, "")
    .replace(/```json|```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { texto, buttons, pideFecha, pideHora };
}

// ─── BOTONES Y SELECTORES ────────────────────────────────────────────
function limpiarExtras() {
  el.quickReplies.innerHTML = "";
  el.special.innerHTML = "";
}

function renderButtons(labels) {
  labels.slice(0, 4).forEach((label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "quick-reply-btn";
    b.textContent = label;
    b.addEventListener("click", () => { limpiarExtras(); enviar(label); });
    el.quickReplies.appendChild(b);
  });
}

function renderSelector(tipo) {
  const wrap = document.createElement("div");
  wrap.className = "special-input";

  const input = document.createElement("input");
  input.type = tipo === "date" ? "date" : "time";
  input.setAttribute("aria-label", tipo === "date" ? "Elegir fecha" : "Elegir hora");
  if (tipo === "date") {
    const hoy = new Date();
    input.min = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(hoy);
    input.value = input.min;
  } else {
    input.step = 900; // saltos de 15 min
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "quick-reply-btn";
  btn.textContent = "Confirmar";

  const confirmar = () => {
    if (!input.value) { input.focus(); return; }
    let valor;
    if (tipo === "date") {
      // Se manda ISO + texto: el ISO evita que el modelo se equivoque de día.
      const legible = new Date(input.value + "T12:00:00").toLocaleDateString("es-CO", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      valor = `${input.value} (${legible})`;
    } else {
      valor = `${input.value} (hora Colombia/Ecuador)`;
    }
    limpiarExtras();
    enviar(valor);
  };

  btn.addEventListener("click", confirmar);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") confirmar(); });

  wrap.append(input, btn);
  el.special.appendChild(wrap);
  input.focus();
}

// ─── ENVÍO AL BACKEND ────────────────────────────────────────────────
function setOcupado(v, etiqueta) {
  ocupado = v;
  el.input.disabled = v;
  el.sendBtn.disabled = v;
  el.uploadBtn.disabled = v;
  el.status.textContent = v ? (etiqueta || "Escribiendo...") : "En línea";
}

async function llamarFuncion(payload, reintento = true) {
  const { data, error } = await supabase.functions.invoke("chat", { body: payload });
  if (error) {
    if (reintento) {
      await new Promise((r) => setTimeout(r, 1200));
      return llamarFuncion(payload, false);
    }
    throw new Error(error.message || "No hubo respuesta del servidor");
  }
  if (data?.detail) throw new Error(data.detail);
  return data;
}

async function enviar(texto, { silencioso = false } = {}) {
  if (ocupado || !texto?.trim()) return;
  const mensaje = texto.trim();

  limpiarExtras();
  if (!silencioso) addMessage("user", mensaje);
  el.input.value = "";
  autoAlto();
  setOcupado(true);
  showTyping();

  try {
    const data = await llamarFuncion({
      message: mensaje,
      history: history.map(({ role, parts }) => ({ role, parts })),
      user,
      session_id: sessionId,
    });

    hideTyping();
    const raw = data?.reply ?? "";
    const { texto: limpio, buttons, pideFecha, pideHora } = parseReply(raw);

    if (limpio) addMessage("bot", limpio);
    if (data?.booking) renderReserva(data.booking);
    if (data?.payment) renderPago(data.payment);
    if (data?.whatsapp) renderWhatsapp(data.whatsapp);
    if (!limpio && !data?.booking && !data?.payment) addMessage("bot", "…");

    history.push({ role: "user", parts: [{ text: mensaje }], silent: silencioso });
    history.push({ role: "model", parts: [{ text: raw }], pago: !!data?.payment });
    if (history.length > MAX_HISTORIAL) history = history.slice(-MAX_HISTORIAL);
    guardarHistorial();

    if (buttons.length) renderButtons(buttons);
    if (pideFecha) renderSelector("date");
    else if (pideHora) renderSelector("time");
  } catch (err) {
    hideTyping();
    console.error(err);
    const sinRed = !navigator.onLine;
    addMessage(
      "bot",
      sinRed
        ? "Se cayó tu conexión. Vuelve a enviar el mensaje cuando tengas internet."
        : "No pude responder en este momento. Intenta de nuevo o escríbenos al WhatsApp +573044435307.",
    );
    if (!silencioso) renderButtons(["Reintentar"]);
  } finally {
    setOcupado(false);
    el.input.focus();
  }
}

// ─── SUBIDA DE ARCHIVOS ──────────────────────────────────────────────
async function subirArchivo(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    addMessage("bot", "El archivo pesa más de 10 MB. Envía uno más liviano o comprímelo.");
    return;
  }

  addMessage("user", `📎 ${file.name}`);
  setOcupado(true, "Subiendo archivo...");

  const limpio = file.name.replace(/[^\w.\-]/g, "_");
  const ruta = `${user?.phone ?? "anon"}/${Date.now()}-${limpio}`;

  try {
    const { error } = await supabase.storage.from(BUCKET)
      .upload(ruta, file, { upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
    setOcupado(false);
    await enviar(
      `[INFO_SISTEMA: El cliente subió el archivo "${file.name}". Enlace: ${data.publicUrl}]`,
      { silencioso: true },
    );
  } catch (err) {
    console.error(err);
    setOcupado(false);
    addMessage("bot", "No pude subir el archivo. Revisa tu conexión e inténtalo otra vez.");
  }
}

// ─── COPIAR ──────────────────────────────────────────────────────────
async function copiar(valor, boton) {
  try {
    await navigator.clipboard.writeText(valor);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = valor;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch { /* nada */ }
    ta.remove();
  }
  const icono = boton.querySelector("i");
  if (icono) {
    icono.className = "fas fa-check";
    boton.classList.add("copiado");
    setTimeout(() => {
      icono.className = "fas fa-copy";
      boton.classList.remove("copiado");
    }, 1500);
  }
}

el.messages.addEventListener("click", (e) => {
  const btn = e.target.closest(".copiable");
  if (btn) copiar(btn.dataset.copiar, btn);
});

// ─── MODAL DE INGRESO ────────────────────────────────────────────────
function cargarPaises() {
  el.countryList.innerHTML = "";
  COUNTRIES.forEach(([nombre]) => {
    const opt = document.createElement("option");
    opt.value = nombre;
    el.countryList.appendChild(opt);
  });
}

function buscarIndicativo(nombre) {
  const n = nombre.trim().toLowerCase();
  if (!n) return "";
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hit = COUNTRIES.find(([p]) => norm(p) === norm(n)) ||
    COUNTRIES.find(([p]) => norm(p).startsWith(norm(n)));
  return hit ? hit[1] : "";
}

function errorModal(msg) {
  if (!el.modalError) return;
  el.modalError.textContent = msg;
  el.modalError.hidden = !msg;
}

// Repinta la conversación guardada al recargar la página
function restaurarHistorial() {
  let ultimoRaw = null;
  for (const m of history) {
    const texto = m.parts?.map((p) => p.text).join("") ?? "";
    if (m.role === "user") {
      if (!m.silent) addMessage("user", texto);
    } else {
      const { texto: limpio } = parseReply(texto);
      if (limpio) addMessage("bot", limpio);
      ultimoRaw = texto;
    }
  }
  if (ultimoRaw) {
    const { buttons, pideFecha, pideHora } = parseReply(ultimoRaw);
    if (buttons.length) renderButtons(buttons);
    if (pideFecha) renderSelector("date");
    else if (pideHora) renderSelector("time");
  }
  return history.length > 0;
}

async function iniciarChat(datos, { reanudar = false } = {}) {
  user = datos;
  store.set("easyclass_user", JSON.stringify(datos));
  el.overlay.style.display = "none";
  el.status.textContent = "En línea";
  el.input.disabled = false;
  el.sendBtn.disabled = false;
  el.resetBtn?.removeAttribute("hidden");
  el.input.focus();

  if (reanudar && restaurarHistorial()) return;

  await enviar(
    `[INFO_SISTEMA: Nuevo cliente desde ${datos.country}, WhatsApp ${datos.country_code}${datos.phone}. Salúdalo brevemente y pregúntale en qué servicio está interesado, ofreciendo botones.]`,
    { silencioso: true },
  );
}

function reiniciar() {
  if (!confirm("¿Empezar una conversación nueva? Se borra lo que hay en pantalla.")) return;
  store.del("easyclass_history");
  store.del("easyclass_user");
  store.del("easyclass_session");
  history = [];
  user = null;
  sessionId = nuevaSesion();
  store.set("easyclass_session", sessionId);
  el.messages.innerHTML = "";
  limpiarExtras();
  el.input.disabled = true;
  el.sendBtn.disabled = true;
  el.modalBtn.disabled = false;
  errorModal("");
  el.overlay.style.display = "flex";
  el.countryName.focus();
}

// ─── EVENTOS ─────────────────────────────────────────────────────────
el.countryName.addEventListener("input", () => {
  el.countryCode.value = buscarIndicativo(el.countryName.value);
  errorModal("");
});

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const country = el.countryName.value.trim();
  const code = el.countryCode.value.trim() || buscarIndicativo(country);
  const phone = el.whatsapp.value.replace(/\D/g, "");

  if (!country || !code) {
    errorModal("No reconozco ese país. Elígelo de la lista.");
    el.countryName.focus();
    return;
  }
  if (phone.length < 7 || phone.length > 15) {
    errorModal("El número debe tener entre 7 y 15 dígitos, sin el indicativo.");
    el.whatsapp.focus();
    return;
  }

  errorModal("");
  el.modalBtn.disabled = true;
  iniciarChat({ country, country_code: code, phone });
});

el.sendBtn.addEventListener("click", () => enviar(el.input.value));

el.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    enviar(el.input.value);
  }
});

function autoAlto() {
  el.input.style.height = "auto";
  el.input.style.height = Math.min(el.input.scrollHeight, 120) + "px";
}
el.input.addEventListener("input", autoAlto);

el.uploadBtn.addEventListener("click", () => el.fileInput.click());
el.fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  subirArchivo(file);
});

el.resetBtn?.addEventListener("click", reiniciar);

// ─── ARRANQUE ────────────────────────────────────────────────────────
(function init() {
  cargarPaises();
  el.status.textContent = "En línea";

  sessionId = store.get("easyclass_session") || nuevaSesion();
  store.set("easyclass_session", sessionId);

  try {
    const guardadoHist = store.get("easyclass_history");
    if (guardadoHist) history = JSON.parse(guardadoHist) || [];
  } catch { history = []; }

  const guardado = store.get("easyclass_user");
  if (guardado) {
    try {
      const datos = JSON.parse(guardado);
      if (datos?.phone) {
        iniciarChat(datos, { reanudar: true });
        return;
      }
    } catch { /* ignorar */ }
  }
  el.overlay.style.display = "flex";
})();