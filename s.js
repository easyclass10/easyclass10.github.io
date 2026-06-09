// ─── IMPORTACIONES ───────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
// ⚠️ CAMBIA ESTA URL por la URL real de tu servicio en Render
const BACKEND_URL = "https://TU-SERVICIO.onrender.com";

// Las claves de Supabase pueden quedar en el cliente porque son "anon" keys
// y la seguridad real se gestiona con RLS en Supabase.
const SUPABASE_URL = "https://qyegntfgtamllmwbdoeb.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWdudGZndGFtbGxtd2Jkb2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjAxMDUsImV4cCI6MjA5NjU5NjEwNX0.ZJ6Fidp3zGb9FhrV8nSFFO7PTu-fjRhEuAO6OYfWWNw";

// ─── LISTA DE PAÍSES ──────────────────────────────────────────────────────────
const COUNTRIES_WITH_CODES = [
  { name: "Afganistán", code: "93" }, { name: "Albania", code: "355" },
  { name: "Alemania", code: "49" }, { name: "Andorra", code: "376" },
  { name: "Angola", code: "244" }, { name: "Antigua y Barbuda", code: "1-268" },
  { name: "Arabia Saudita", code: "966" }, { name: "Argelia", code: "213" },
  { name: "Argentina", code: "54" }, { name: "Armenia", code: "374" },
  { name: "Australia", code: "61" }, { name: "Austria", code: "43" },
  { name: "Azerbaiyán", code: "994" }, { name: "Bahamas", code: "1-242" },
  { name: "Bangladés", code: "880" }, { name: "Barbados", code: "1-246" },
  { name: "Baréin", code: "973" }, { name: "Bélgica", code: "32" },
  { name: "Belice", code: "501" }, { name: "Benín", code: "229" },
  { name: "Bielorrusia", code: "375" }, { name: "Bolivia", code: "591" },
  { name: "Bosnia y Herzegovina", code: "387" }, { name: "Botsuana", code: "267" },
  { name: "Brasil", code: "55" }, { name: "Brunéi", code: "673" },
  { name: "Bulgaria", code: "359" }, { name: "Burkina Faso", code: "226" },
  { name: "Burundi", code: "257" }, { name: "Bután", code: "975" },
  { name: "Cabo Verde", code: "238" }, { name: "Camboya", code: "855" },
  { name: "Camerún", code: "237" }, { name: "Canadá", code: "1" },
  { name: "Catar", code: "974" }, { name: "Chad", code: "235" },
  { name: "Chile", code: "56" }, { name: "China", code: "86" },
  { name: "Chipre", code: "357" }, { name: "Colombia", code: "57" },
  { name: "Comoras", code: "269" }, { name: "Corea del Sur", code: "82" },
  { name: "Costa Rica", code: "506" }, { name: "Croacia", code: "385" },
  { name: "Cuba", code: "53" }, { name: "Dinamarca", code: "45" },
  { name: "Ecuador", code: "593" }, { name: "Egipto", code: "20" },
  { name: "El Salvador", code: "503" }, { name: "Emiratos Árabes Unidos", code: "971" },
  { name: "España", code: "34" }, { name: "Estados Unidos", code: "1" },
  { name: "Estonia", code: "372" }, { name: "Etiopía", code: "251" },
  { name: "Filipinas", code: "63" }, { name: "Finlandia", code: "358" },
  { name: "Francia", code: "33" }, { name: "Ghana", code: "233" },
  { name: "Grecia", code: "30" }, { name: "Guatemala", code: "502" },
  { name: "Honduras", code: "504" }, { name: "Hong Kong", code: "852" },
  { name: "Hungría", code: "36" }, { name: "India", code: "91" },
  { name: "Indonesia", code: "62" }, { name: "Irak", code: "964" },
  { name: "Irán", code: "98" }, { name: "Irlanda", code: "353" },
  { name: "Islandia", code: "354" }, { name: "Israel", code: "972" },
  { name: "Italia", code: "39" }, { name: "Jamaica", code: "1-876" },
  { name: "Japón", code: "81" }, { name: "Jordania", code: "962" },
  { name: "Kazajistán", code: "7" }, { name: "Kenia", code: "254" },
  { name: "Kuwait", code: "965" }, { name: "Laos", code: "856" },
  { name: "Letonia", code: "371" }, { name: "Líbano", code: "961" },
  { name: "Libia", code: "218" }, { name: "Lituania", code: "370" },
  { name: "Luxemburgo", code: "352" }, { name: "Malasia", code: "60" },
  { name: "Maldivas", code: "960" }, { name: "Malta", code: "356" },
  { name: "Marruecos", code: "212" }, { name: "México", code: "52" },
  { name: "Moldavia", code: "373" }, { name: "Mónaco", code: "377" },
  { name: "Mongolia", code: "976" }, { name: "Montenegro", code: "382" },
  { name: "Mozambique", code: "258" }, { name: "Myanmar (Birmania)", code: "95" },
  { name: "Namibia", code: "264" }, { name: "Nepal", code: "977" },
  { name: "Nicaragua", code: "505" }, { name: "Nigeria", code: "234" },
  { name: "Noruega", code: "47" }, { name: "Nueva Zelanda", code: "64" },
  { name: "Países Bajos", code: "31" }, { name: "Pakistán", code: "92" },
  { name: "Panamá", code: "507" }, { name: "Paraguay", code: "595" },
  { name: "Perú", code: "51" }, { name: "Polonia", code: "48" },
  { name: "Portugal", code: "351" }, { name: "Puerto Rico", code: "1-787" },
  { name: "Reino Unido", code: "44" }, { name: "República Checa", code: "420" },
  { name: "República Dominicana", code: "1-809" }, { name: "Rumania", code: "40" },
  { name: "Rusia", code: "7" }, { name: "Senegal", code: "221" },
  { name: "Serbia", code: "381" }, { name: "Singapur", code: "65" },
  { name: "Siria", code: "963" }, { name: "Sri Lanka", code: "94" },
  { name: "Sudáfrica", code: "27" }, { name: "Suecia", code: "46" },
  { name: "Suiza", code: "41" }, { name: "Tailandia", code: "66" },
  { name: "Taiwán", code: "886" }, { name: "Tanzania", code: "255" },
  { name: "Trinidad y Tobago", code: "1-868" }, { name: "Túnez", code: "216" },
  { name: "Turquía", code: "90" }, { name: "Ucrania", code: "380" },
  { name: "Uganda", code: "256" }, { name: "Uruguay", code: "598" },
  { name: "Venezuela", code: "58" }, { name: "Vietnam", code: "84" },
  { name: "Yemen", code: "967" }, { name: "Zambia", code: "260" },
  { name: "Zimbabue", code: "263" },
];

// ─── VARIABLES GLOBALES ───────────────────────────────────────────────────────
let supabaseClient;
let currentUserInfo = null;
let chatHistory = [];

// ─── REFERENCIAS AL DOM ───────────────────────────────────────────────────────
const modalOverlay = document.getElementById("user-modal-overlay");
const userForm = document.getElementById("user-form");
const countryNameInput = document.getElementById("country-name");
const countryCodeInput = document.getElementById("country-code");
const whatsappNumberInput = document.getElementById("whatsapp-number");
const countryDatalist = document.getElementById("country-list");
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const uploadBtn = document.getElementById("upload-btn");
const fileUploadInput = document.getElementById("file-upload-input");
const quickRepliesContainer = document.getElementById("quick-replies");
const specialInputsContainer = document.getElementById("special-inputs-container");
const chatStatus = document.getElementById("chat-status");

// ─── INICIO ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error("Error inicializando Supabase:", error);
    chatStatus.textContent = "Error de conexión DB";
    return;
  }

  populateCountryDatalist();
  userForm.addEventListener("submit", handleUserLogin);
  sendBtn.addEventListener("click", handleUserInput);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserInput();
    }
  });
  uploadBtn.addEventListener("click", () => fileUploadInput.click());
  fileUploadInput.addEventListener("change", handleFileUpload);
  countryNameInput.addEventListener("input", handleCountryInput);
});

// ─── MODAL DE PAÍS ────────────────────────────────────────────────────────────
function populateCountryDatalist() {
  COUNTRIES_WITH_CODES.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.name;
    countryDatalist.appendChild(option);
  });
}

function handleCountryInput() {
  const found = COUNTRIES_WITH_CODES.find((c) => c.name === countryNameInput.value);
  countryCodeInput.value = found ? `+${found.code}` : "";
}

async function handleUserLogin(event) {
  event.preventDefault();
  const countryCode = countryCodeInput.value.trim().replace("+", "");
  const whatsappNumber = whatsappNumberInput.value.trim();
  if (!countryCode || !whatsappNumber) {
    alert("Por favor selecciona un país válido y completa tu número.");
    return;
  }
  currentUserInfo = { id: `${countryCode}${whatsappNumber}`, country: countryCode };
  modalOverlay.style.display = "none";
  await initializeChat();
}

// ─── INICIALIZACIÓN DEL CHAT ──────────────────────────────────────────────────
async function initializeChat() {
  chatStatus.textContent = "Cargando historial...";
  try {
    await loadOrCreateChatHistory();
    chatStatus.textContent = "Conectado 24/7";
    userInput.disabled = false;
    sendBtn.disabled = false;
    uploadBtn.disabled = false;

    if (chatHistory.length === 0) {
      const welcomeMessage =
        "¡Hola! Soy EasyClass Asistente. ¿En qué puedo asistirte hoy?\n\nPara empezar, ¿qué tipo de servicio te interesa? Te puedo ayudar con:\n* Exámenes o parciales\n* Quizzes o talleres en clase\n* Clases particulares online o presenciales\n* Otras necesidades como desarrollo de trabajos, asesorías, tesis, o servicios tecnológicos (Apps, IA, Web).";
      const welcomeButtons = ["Agendar Examen", "Agendar Quiz", "Agendar Clase", "Otro Servicio"];

      renderBotMessage(welcomeMessage);
      welcomeButtons.forEach((btnText) => createQuickReplyButton(btnText));

      const messageWithTags =
        welcomeMessage +
        "\n[button:Agendar Examen][button:Agendar Quiz][button:Agendar Clase][button:Otro Servicio]";
      addMessageToHistory("model", messageWithTags);
      await saveChatHistory();
    } else {
      renderChatHistory();
    }
  } catch (error) {
    console.error("Error al inicializar chat:", error);
    chatStatus.textContent = "Error de conexión";
    addBotMessage("Error al conectar. Intenta recargar la página.");
  }
}

// ─── MANEJO DE MENSAJES ───────────────────────────────────────────────────────
async function handleUserInput() {
  const messageText = userInput.value.trim();
  if (!messageText) return;
  userInput.value = "";
  toggleChatInput(false);
  await sendOrchestratedMessage(messageText);
  toggleChatInput(true);
}

async function sendOrchestratedMessage(messageText) {
  addUserMessage(messageText);
  addMessageToHistory("user", messageText);
  clearQuickReplies();
  clearSpecialInputs();

  const agenda = await getAgenda();
  const agendaContext = `[CONTEXTO_AGENDA: ${JSON.stringify(agenda)}]`;
  const messageToBackend = `${agendaContext}\n\n[MENSAJE_USUARIO: ${messageText}]`;

  const botReply = await callBackendAPI(messageToBackend);
  await processBotResponse(botReply);
  await saveChatHistory();
}

// ─── LLAMADA AL BACKEND DE RENDER (en lugar de Gemini directamente) ───────────
async function callBackendAPI(message) {
  showTypingIndicator();
  try {
    // Enviamos el historial completo para que el backend reconstruya la sesión
    const historyToSend = chatHistory.slice(0, -1); // excluir el mensaje del usuario recién agregado

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: historyToSend,
        message,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    hideTypingIndicator();
    return data.reply;
  } catch (error) {
    hideTypingIndicator();
    console.error("Error al llamar al backend:", error);
    return "Lo siento, estoy teniendo problemas de conexión. 🧠 Por favor, intenta de nuevo.";
  }
}

// ─── PROCESAMIENTO DE RESPUESTA DEL BOT ──────────────────────────────────────
async function processBotResponse(botReply) {
  let cleanReply = botReply;
  const bookingJsonMatch = botReply.match(/\[BOOKING_JSON\]([\s\S]*?)\[\/BOOKING_JSON\]/);

  if (bookingJsonMatch && bookingJsonMatch[1]) {
    try {
      const bookingData = JSON.parse(bookingJsonMatch[1]);
      bookingData.client_id = currentUserInfo.id;
      await bookServiceInAgenda(bookingData);
      cleanReply = cleanReply.replace(bookingJsonMatch[0], "");
      addBotMessage("✅ ¡Perfecto! Tu cita ha sido registrada en nuestra agenda.");
    } catch (error) {
      console.error("Error al guardar la cita:", error);
      addBotMessage("⚠️ Hubo un problema al guardar tu cita. Por favor, intenta de nuevo.");
      cleanReply = cleanReply.replace(bookingJsonMatch[0], "");
    }
  }

  addMessageToHistory("model", botReply);
  renderBotMessage(cleanReply);
}

// ─── MANEJO DE ARCHIVOS ───────────────────────────────────────────────────────
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  addBotMessage(`Subiendo archivo: ${file.name}...`);
  toggleChatInput(false);

  try {
    const filePath = `${currentUserInfo.id}/${file.name}`;
    const { error } = await supabaseClient.storage
      .from("uploads")
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const systemMessage = `[INFO_SISTEMA: El usuario acaba de subir un archivo llamado '${file.name}'. Está disponible en su carpeta. Por favor, acusa de recibido y continúa.]`;
    await sendOrchestratedMessage(systemMessage);
  } catch (error) {
    console.error("Error al subir el archivo:", error);
    addBotMessage(`Error al subir el archivo: ${error.message}`);
  } finally {
    toggleChatInput(true);
    fileUploadInput.value = "";
  }
}

// ─── FUNCIONES DE SUPABASE ────────────────────────────────────────────────────
async function loadOrCreateChatHistory() {
  const { data, error } = await supabaseClient
    .from("chats")
    .select("history")
    .eq("user_id", currentUserInfo.id)
    .single();

  if (data && data.history) {
    chatHistory = data.history;
  } else if (error && error.code === "PGRST116") {
    chatHistory = [];
  } else if (error) {
    console.error("Error al cargar historial:", error);
  }
}

function renderChatHistory() {
  chatMessages.innerHTML = "";
  chatHistory.forEach((message) => {
    if (message.role === "user") {
      addUserMessage(message.parts[0].text);
    } else if (message.role === "model") {
      renderBotMessage(message.parts[0].text);
    }
  });
}

async function saveChatHistory() {
  const { error } = await supabaseClient
    .from("chats")
    .upsert({ user_id: currentUserInfo.id, history: chatHistory })
    .eq("user_id", currentUserInfo.id);

  if (error) console.error("Error al guardar el chat:", error);
}

async function getAgenda() {
  const today = new Date().toISOString();
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseClient
    .from("agenda")
    .select("subject, start_time, end_time")
    .gt("start_time", today)
    .lt("start_time", twoWeeks);

  if (error) {
    console.error("Error al obtener agenda:", error);
    return [];
  }
  return data;
}

async function bookServiceInAgenda(bookingData) {
  const { error } = await supabaseClient.from("agenda").insert([bookingData]);
  if (error) throw error;
}

// ─── FUNCIONES DE UI ──────────────────────────────────────────────────────────
function addMessageToHistory(role, text) {
  chatHistory.push({ role, parts: [{ text }] });
}

function addUserMessage(message) {
  renderMessage("user", message);
}

function addBotMessage(message) {
  renderMessage("bot", message);
}

function renderBotMessage(message) {
  clearQuickReplies();
  clearSpecialInputs();

  let cleanMessage = message;

  const buttonRegex = /\[button:([^\]]+)\]/g;
  let match;
  while ((match = buttonRegex.exec(message)) !== null) {
    createQuickReplyButton(match[1]);
    cleanMessage = cleanMessage.replace(match[0], "");
  }

  if (/\[REQUEST_DATE\]/g.test(cleanMessage)) {
    createDatePicker();
    cleanMessage = cleanMessage.replace(/\[REQUEST_DATE\]/g, "");
  }

  if (/\[REQUEST_TIME\]/g.test(cleanMessage)) {
    createTimePicker();
    cleanMessage = cleanMessage.replace(/\[REQUEST_TIME\]/g, "");
  }

  if (cleanMessage.trim().length > 0) {
    renderMessage("bot", cleanMessage.trim());
  }
}

function renderMessage(sender, message) {
  const formattedMessage = message
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/\n/g, "<br>");

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}-message`;
  msgDiv.innerHTML = `<div class="message-bubble">${formattedMessage}</div>`;
  chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

function createQuickReplyButton(text) {
  const btn = document.createElement("button");
  btn.className = "quick-reply-btn";
  btn.textContent = text;
  btn.addEventListener("click", async () => {
    toggleChatInput(false);
    await sendOrchestratedMessage(text);
    toggleChatInput(true);
  });
  quickRepliesContainer.appendChild(btn);
}

function clearQuickReplies() {
  quickRepliesContainer.innerHTML = "";
}

function createDatePicker() {
  const wrapper = document.createElement("div");
  wrapper.className = "special-input-wrapper";
  const input = document.createElement("input");
  input.type = "date";
  input.className = "special-input";
  input.min = new Date().toISOString().split("T")[0];
  const button = document.createElement("button");
  button.textContent = "Confirmar Fecha";
  button.onclick = async () => {
    if (!input.value) return;
    toggleChatInput(false);
    await sendOrchestratedMessage(input.value);
    toggleChatInput(true);
  };
  wrapper.appendChild(input);
  wrapper.appendChild(button);
  specialInputsContainer.appendChild(wrapper);
}

function createTimePicker() {
  const wrapper = document.createElement("div");
  wrapper.className = "special-input-wrapper";
  const input = document.createElement("input");
  input.type = "time";
  input.className = "special-input";
  const button = document.createElement("button");
  button.textContent = "Confirmar Hora";
  button.onclick = async () => {
    if (!input.value) return;
    toggleChatInput(false);
    await sendOrchestratedMessage(input.value);
    toggleChatInput(true);
  };
  wrapper.appendChild(input);
  wrapper.appendChild(button);
  specialInputsContainer.appendChild(wrapper);
}

function clearSpecialInputs() {
  specialInputsContainer.innerHTML = "";
}

function toggleChatInput(enabled) {
  userInput.disabled = !enabled;
  sendBtn.disabled = !enabled;
  uploadBtn.disabled = !enabled;
  if (enabled) userInput.focus();
}

function showTypingIndicator() {
  if (document.getElementById("typing-indicator")) return;
  const typingDiv = document.createElement("div");
  typingDiv.id = "typing-indicator";
  typingDiv.className = "message bot-message";
  typingDiv.innerHTML = `<div class="message-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  chatMessages.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  const typingDiv = document.getElementById("typing-indicator");
  if (typingDiv) typingDiv.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
