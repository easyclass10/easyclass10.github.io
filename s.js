// =====================================================================
// EasyClass · s.js
// Cliente del widget. Habla ÚNICAMENTE con la Edge Function "chat".
// La API key de DeepSeek nunca toca el navegador.
// =====================================================================

import { createClient } from "@supabase/supabase-js";

// ─── CONFIGURA ESTAS DOS LÍNEAS ──────────────────────────────────────
// Dashboard > Project Settings > API
const SUPABASE_URL = "https://qyegntfgtamllmwbdoeb.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWdudGZndGFtbGxtd2Jkb2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjAxMDUsImV4cCI6MjA5NjU5NjEwNX0.ZJ6Fidp3zGb9FhrV8nSFFO7PTu-fjRhEuAO6OYfWWNw";
// ─────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = "easyclass-archivos";

// ─── PAÍSES (agrega los que necesites) ───────────────────────────────
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
  status: $("chat-status"),
  messages: $("chat-messages"),
  quickReplies: $("quick-replies"),
  special: $("special-inputs-container"),
  fileInput: $("file-upload-input"),
  uploadBtn: $("upload-btn"),
  input: $("user-input"),
  sendBtn: $("send-btn"),
};

// ─── ESTADO ──────────────────────────────────────────────────────────
let user = null;                 // { country, country_code, phone }
let history = [];                // formato { role, parts:[{text}] }
let ocupado = false;

// Almacenamiento tolerante a fallos (modo incógnito, iframes, etc.)
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignorar */ } },
};

// ─── UTILIDADES DE TEXTO ─────────────────────────────────────────────
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Markdown mínimo: **negrita**, saltos de línea y enlaces.
function formatear(texto) {
  let html = escapeHtml(texto);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>',
  );
  return html.replace(/\n/g, "<br>");
}

// ─── RENDER DE MENSAJES ──────────────────────────────────────────────
function addMessage(role, texto) {
  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user-message" : "bot-message"}`;
  div.innerHTML = formatear(texto);
  el.messages.appendChild(div);
  el.messages.scrollTop = el.messages.scrollHeight;
  return div;
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "message bot-message typing-indicator";
  div.id = "typing-indicator";
  div.innerHTML = "<span></span><span></span><span></span>";
  el.messages.appendChild(div);
  el.messages.scrollTop = el.messages.scrollHeight;
}

function hideTyping() {
  document.getElementById("typing-indicator")?.remove();
}

// ─── PARSEO DE LA RESPUESTA DEL BOT ──────────────────────────────────
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
    .replace(/\[REQUEST_DATE\]|\[REQUEST_TIME\]/gi, "")
    .replace(/\[CONTEXTO_[^\]]*\]/gi, "")
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
  labels.forEach((label) => {
    const b = document.createElement("button");
    b.className = "quick-reply-btn";
    b.textContent = label;
    b.addEventListener("click", () => {
      limpiarExtras();
      enviar(label);
    });
    el.quickReplies.appendChild(b);
  });
}

function renderSelector(tipo) {
  const wrap = document.createElement("div");
  wrap.className = "special-input";

  const input = document.createElement("input");
  input.type = tipo === "date" ? "date" : "time";
  if (tipo === "date") input.min = new Date().toISOString().slice(0, 10);

  const btn = document.createElement("button");
  btn.className = "quick-reply-btn";
  btn.textContent = "Confirmar";
  btn.addEventListener("click", () => {
    if (!input.value) return;
    const valor = tipo === "date"
      ? new Date(input.value + "T12:00:00").toLocaleDateString("es-CO", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
      : input.value;
    limpiarExtras();
    enviar(valor);
  });

  wrap.appendChild(input);
  wrap.appendChild(btn);
  el.special.appendChild(wrap);
  input.focus();
}

// ─── ENVÍO AL BACKEND ────────────────────────────────────────────────
function setOcupado(v) {
  ocupado = v;
  el.input.disabled = v;
  el.sendBtn.disabled = v;
  el.uploadBtn.disabled = v;
  el.status.textContent = v ? "Escribiendo..." : "En línea";
}

async function enviar(texto, { silencioso = false } = {}) {
  if (ocupado || !texto?.trim()) return;
  const mensaje = texto.trim();

  limpiarExtras();
  if (!silencioso) addMessage("user", mensaje);
  el.input.value = "";
  setOcupado(true);
  showTyping();

  try {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: { message: mensaje, history, user },
    });
    hideTyping();

    if (error) throw new Error(error.message);
    if (data?.detail) throw new Error(data.detail);

    const raw = data?.reply ?? "";
    const { texto: limpio, buttons, pideFecha, pideHora } = parseReply(raw);

    addMessage("bot", limpio || "…");

    history.push({ role: "user", parts: [{ text: mensaje }] });
    history.push({ role: "model", parts: [{ text: raw }] });
    if (history.length > 24) history = history.slice(-24);

    if (buttons.length) renderButtons(buttons);
    if (pideFecha) renderSelector("date");
    else if (pideHora) renderSelector("time");

    if (data?.booking) {
      console.log("Reserva guardada:", data.booking);
    }
  } catch (err) {
    hideTyping();
    console.error(err);
    addMessage(
      "bot",
      "Tuve un problema de conexión. Intenta de nuevo o escríbenos al WhatsApp +573044435307.",
    );
  } finally {
    setOcupado(false);
    el.input.focus();
  }
}

// ─── SUBIDA DE ARCHIVOS ──────────────────────────────────────────────
async function subirArchivo(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    addMessage("bot", "El archivo supera los 10 MB. Envía uno más liviano.");
    return;
  }

  addMessage("user", `📎 ${file.name}`);
  setOcupado(true);
  el.status.textContent = "Subiendo archivo...";

  const limpio = file.name.replace(/[^\w.\-]/g, "_");
  const ruta = `${user?.phone ?? "anon"}/${Date.now()}-${limpio}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
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
    addMessage("bot", "No pude subir el archivo. Intenta de nuevo.");
  }
}

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
  const hit = COUNTRIES.find(([p]) => p.toLowerCase() === n) ||
    COUNTRIES.find(([p]) => p.toLowerCase().startsWith(n));
  return hit ? hit[1] : "";
}

async function iniciarChat(datos) {
  user = datos;
  store.set("easyclass_user", JSON.stringify(datos));
  el.overlay.style.display = "none";
  el.status.textContent = "En línea";
  el.input.disabled = false;
  el.sendBtn.disabled = false;
  el.input.focus();

  await enviar(
    `[INFO_SISTEMA: Nuevo cliente desde ${datos.country}, WhatsApp ${datos.country_code}${datos.phone}. Salúdalo brevemente y pregúntale en qué servicio está interesado, ofreciendo botones.]`,
    { silencioso: true },
  );
}

// ─── EVENTOS ─────────────────────────────────────────────────────────
el.countryName.addEventListener("input", () => {
  el.countryCode.value = buscarIndicativo(el.countryName.value);
});

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const country = el.countryName.value.trim();
  const code = el.countryCode.value.trim() || buscarIndicativo(country);
  const phone = el.whatsapp.value.replace(/\D/g, "");

  if (!country || !code) {
    el.countryName.focus();
    return;
  }
  if (phone.length < 7) {
    el.whatsapp.focus();
    return;
  }

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

el.uploadBtn.addEventListener("click", () => el.fileInput.click());

el.fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  subirArchivo(file);
});

// ─── ARRANQUE ────────────────────────────────────────────────────────
(function init() {
  cargarPaises();
  el.status.textContent = "En línea";

  const guardado = store.get("easyclass_user");
  if (guardado) {
    try {
      const datos = JSON.parse(guardado);
      if (datos?.phone) {
        iniciarChat(datos);
        return;
      }
    } catch { /* ignorar */ }
  }
  el.overlay.style.display = "flex";
})();