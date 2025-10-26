// PASO 1: Importar las librerías
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// -------------------------------------------------------------------
// ⚠️ TUS CLAVES SECRETAS (PEGADAS DESDE TU SCRIPT)
// -------------------------------------------------------------------
const GEMINI_API_KEY = "AIzaSyAiz8613dVFC0cMmxgX_HJz63cXYmVJgBQ";
const SUPABASE_URL = "https://cgpioodxsryqfyofjfvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGlvb2R4c3J5cWZ5b2ZqZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTY2MjIsImV4cCI6MjA2MzI5MjYyMn0.TB8MmMzMc18hktGiWal_Fjmuq4ptqp7pz3mi0o8LJLY";
// -------------------------------------------------------------------

// --- Lista de Países e Indicativos (Sin cambios) ---
const COUNTRIES_WITH_CODES = [
  { name: 'Afganistán', code: '93' }, { name: 'Albania', code: '355' },
  { name: 'Alemania', code: '49' }, { name: 'Andorra', code: '376' },
  { name: 'Angola', code: '244' }, { name: 'Anguila', code: '1-264' },
  { name: 'Antártida', code: '672' }, { name: 'Antigua y Barbuda', code: '1-268' },
  { name: 'Arabia Saudita', code: '966' }, { name: 'Argelia', code: '213' },
  { name: 'Argentina', code: '54' }, { name: 'Armenia', code: '374' },
  { name: 'Aruba', code: '297' }, { name: 'Australia', code: '61' },
  { name: 'Austria', code: '43' }, { name: 'Azerbaiyán', code: '994' },
  { name: 'Bahamas', code: '1-242' }, { name: 'Bangladés', code: '880' },
  { name: 'Barbados', code: '1-246' }, { name: 'Baréin', code: '973' },
  { name: 'Bélgica', code: '32' }, { name: 'Belice', code: '501' },
  { name: 'Benín', code: '229' }, { name: 'Bermudas', code: '1-441' },
  { name: 'Bielorrusia', code: '375' }, { name: 'Bolivia', code: '591' },
  { name: 'Bosnia y Herzegovina', code: '387' }, { name: 'Botsuana', code: '267' },
  { name: 'Brasil', code: '55' }, { name: 'Brunéi', code: '673' },
  { name: 'Bulgaria', code: '359' }, { name: 'Burkina Faso', code: '226' },
  { name: 'Burundi', code: '257' }, { name: 'Bután', code: '975' },
  { name: 'Cabo Verde', code: '238' }, { name: 'Camboya', code: '855' },
  { name: 'Camerún', code: '237' }, { name: 'Canadá', code: '1' },
  { name: 'Caribe Neerlandés', code: '599' }, { name: 'Catar', code: '974' },
  { name: 'Chad', code: '235' }, { name: 'Chile', code: '56' },
  { name: 'China', code: '86' }, { name: 'Chipre', code: '357' },
  { name: 'Ciudad del Vaticano', code: '379' }, { name: 'Colombia', code: '57' },
  { name: 'Comoras', code: '269' }, { name: 'Corea del Norte', code: '850' },
  { name: 'Corea del Sur', code: '82' }, { name: 'Costa de Marfil', code: '225' },
  { name: 'Costa Rica', code: '506' }, { name: 'Croacia', code: '385' },
  { name: 'Cuba', code: '53' }, { name: 'Curazao', code: '599' },
  { name: 'Dinamarca', code: '45' }, { name: 'Dominica', code: '1-767' },
  { name: 'Ecuador', code: '593' }, { name: 'Egipto', code: '20' },
  { name: 'El Salvador', code: '503' }, { name: 'Emiratos Árabes Unidos', code: '971' },
  { name: 'Eritrea', code: '291' }, { name: 'Eslovaquia', code: '421' },
  { name: 'Eslovenia', code: '386' }, { name: 'España', code: '34' },
  { name: 'Estados Unidos', code: '1' }, { name: 'Estonia', code: '372' },
  { name: 'Esuatini', code: '268' }, { name: 'Etiopía', code: '251' },
  { name: 'Filipinas', code: '63' }, { name: 'Finlandia', code: '358' },
  { name: 'Fiyi', code: '679' }, { name: 'Francia', code: '33' },
  { name: 'Gabón', code: '241' }, { name: 'Gambia', code: '220' },
  { name: 'Georgia', code: '995' }, { name: 'Ghana', code: '233' },
  { name: 'Gibraltar', code: '350' }, { name: 'Granada', code: '1-473' },
  { name: 'Grecia', code: '30' }, { name: 'Groenlandia', code: '299' },
  { name: 'Guadalupe', code: '590' }, { name: 'Guam', code: '1-671' },
  { name: 'Guatemala', code: '502' }, { name: 'Guayana Francesa', code: '594' },
  { name: 'Guernsey', code: '44-1481' }, { name: 'Guinea', code: '224' },
  { name: 'Guinea Ecuatorial', code: '240' }, { name: 'Guinea-Bisáu', code: '245' },
  { name: 'Guyana', code: '592' }, { name: 'Haití', code: '509' },
  { name: 'Honduras', code: '504' }, { name: 'Hong Kong', code: '852' },
  { name: 'Hungría', code: '36' }, { name: 'India', code: '91' },
  { name: 'Indonesia', code: '62' }, { name: 'Irak', code: '964' },
  { name: 'Irán', code: '98' }, { name: 'Irlanda', code: '353' },
  { name: 'Isla de Man', code: '44-1624' }, { name: 'Isla de Navidad', code: '61' },
  { name: 'Isla Norfolk', code: '672' }, { name: 'Islandia', code: '354' },
  { name: 'Islas Caimán', code: '1-345' }, { name: 'Islas Cocos', code: '61' },
  { name: 'Islas Cook', code: '682' }, { name: 'Islas Feroe', code: '298' },
  { name: 'Islas Malvinas', code: '500' }, { name: 'Islas Marianas del Norte', code: '1-670' },
  { name: 'Islas Marshall', code: '692' }, { name: 'Islas Pitcairn', code: '64' },
  { name: 'Islas Salomón', code: '677' }, { name: 'Islas Turcas y Caicos', code: '1-649' },
  { name: 'Islas Vírgenes Británicas', code: '1-284' }, { name: 'Islas Vírgenes de EE.UU.', code: '1-340' },
  { name: 'Israel', code: '972' }, { name: 'Italia', code: '39' },
  { name: 'Jamaica', code: '1-876' }, { name: 'Japón', code: '81' },
  { name: 'Jersey', code: '44-1534' }, { name: 'Jordania', code: '962' },
  { name: 'Kazajistán', code: '7' }, { name: 'Kenia', code: '254' },
  { name: 'Kirguistán', code: '996' }, { name: 'Kiribati', code: '686' },
  { name: 'Kuwait', code: '965' }, { name: 'Laos', code: '856' },
  { name: 'Lesoto', code: '266' }, { name: 'Letonia', code: '371' },
  { name: 'Líbano', code: '961' }, { name: 'Liberia', code: '231' },
  { name: 'Libia', code: '218' }, { name: 'Liechtenstein', code: '423' },
  { name: 'Lituania', code: '370' }, { name: 'Luxemburgo', code: '352' },
  { name: 'Macao', code: '853' }, { name: 'Macedonia del Norte', code: '389' },
  { name: 'Madagascar', code: '261' }, { name: 'Malasia', code: '60' },
  { name: 'Malaui', code: '265' }, { name: 'Maldivas', code: '960' },
  { name: 'Malí', code: '223' }, { name: 'Malta', code: '356' },
  { name: 'Marruecos', code: '212' }, { name: 'Martinica', code: '596' },
  { name: 'Mauricio', code: '230' }, { name: 'Mauritania', code: '222' },
  { name: 'Mayotte', code: '262' }, { name: 'México', code: '52' },
  { name: 'Micronesia', code: '691' }, { name: 'Moldavia', code: '373' },
  { name: 'Mónaco', code: '377' }, { name: 'Mongolia', code: '976' },
  { name: 'Montenegro', code: '382' }, { name: 'Montserrat', code: '1-664' },
  { name: 'Mozambique', code: '258' }, { name: 'Myanmar (Birmania)', code: '95' },
  { name: 'Namibia', code: '264' }, { name: 'Nauru', code: '674' },
  { name: 'Nepal', code: '977' }, { name: 'Nicaragua', code: '505' },
  { name: 'Níger', code: '227' }, { name: 'Nigeria', code: '234' },
  { name: 'Niue', code: '683' }, { name: 'Noruega', code: '47' },
  { name: 'Nueva Caledonia', code: '687' }, { name: 'Nueva Zelanda', code: '64' },
  { name: 'Omán', code: '968' }, { name: 'Países Bajos', code: '31' },
  { name: 'Pakistán', code: '92' }, { name: 'Palaos', code: '680' },
  { name: 'Palestina', code: '970' }, { name: 'Panamá', code: '507' },
  { name: 'Papúa Nueva Guinea', code: '675' }, { name: 'Paraguay', code: '595' },
  { name: 'Perú', code: '51' }, { name: 'Polinesia Francesa', code: '689' },
  { name: 'Polonia', code: '48' }, { name: 'Portugal', code: '351' },
  { name: 'Puerto Rico', code: '1-787' }, { name: 'Reino Unido', code: '44' },
  { name: 'República Centroafricana', code: '236' }, { name: 'República Checa', code: '420' },
  { name: 'República del Congo', code: '242' }, { name: 'República Democrática del Congo', code: '243' },
  { name: 'República Dominicana', code: '1-809' }, { name: 'Reunión', code: '262' },
  { name: 'Ruanda', code: '250' }, { name: 'Rumania', code: '40' },
  { name: 'Rusia', code: '7' }, { name: 'Samoa', code: '685' },
  { name: 'Samoa Americana', code: '1-684' }, { name:'San Cristóbal y Nieves', code: '1-869' },
  { name: 'San Marino', code: '378' }, { name: 'San Martín (Francia)', code: '590' },
  { name: 'San Martín (Países Bajos)', code: '1-721' }, { name: 'San Pedro y Miquelón', code: '508' },
  { name: 'San Vicente y las Granadinas', code: '1-784' }, { name: 'Santa Elena', code: '290' },
  { name: 'Santa Lucía', code: '1-758' }, { name: 'Santo Tomé y Príncipe', code: '239' },
  { name: 'Senegal', code: '221' }, { name: 'Serbia', code: '381' },
  { name: 'Seychelles', code: '248' }, { name: 'Sierra Leona', code: '232' },
  { name: 'Singapur', code: '65' }, { name: 'Siria', code: '963' },
  { name: 'Somalia', code: '252' }, { name: 'Sri Lanka', code: '94' },
  { name: 'Sudáfrica', code: '27' }, { name: 'Sudán', code: '249' },
  { name: 'Sudán del Sur', code: '211' }, { name: 'Suecia', code: '46' },
  { name: 'Suiza', code: '41' }, { name: 'Surinam', code: '597' },
  { nameKE: 'Svalbard y Jan Mayen', code: '47' }, { name: 'Tailandia', code: '66' },
  { name: 'Taiwán', code: '886' }, { name: 'Tanzania', code: '255' },
  { name: 'Tayikistán', code: '992' }, { name: 'Territorio Británico del Océano Índico', code: '246' },
  { name: 'Timor Oriental', code: '670' }, { name: 'Togo', code: '228' },
  { name: 'Tokelau', code: '690' }, { name: 'Tonga', code: '676' },
  { name: 'Trinidad y Tobago', code: '1-868' }, { name: 'Túnez', code: '216' },
  { name: 'Turkmenistán', code: '993' }, { name: 'Turquía', code: '90' },
  { name: 'Tuvalu', code: '688' }, { name: 'Ucrania', code: '380' },
  { name: 'Uganda', code: '256' }, { name: 'Uruguay', code: '598' },
  { name: 'Uzbekistán', code: '998' }, { name: 'Vanuatu', code: '678' },
  { name: 'Venezuela', code: '58' }, { name: 'Vietnam', code: '84' },
  { name: 'Wallis y Futuna', code: '681' }, { name: 'Yemen', code: '967' },
  { name: 'Yibuti', code: '253' }, { name: 'Zambia', code: '260' },
  { name: 'Zimbabue', code: '263' }
];

// --- EL "CEREBRO" DE EASYCLASS (ACTUALIZADO) ---
const EASYCLASS_SYSTEM_PROMPT = `Eres "EasyClass Asistente", un agente de IA amigable, profesional y muy eficiente de la empresa EasyClass. Tu objetivo es contestar preguntas de los clientes y agendar servicios. Operas 24/7.

### REGLAS CRÍTICAS ###
1.  **VERIFICACIÓN DE AGENDA:** El usuario te enviará la agenda actual en un bloque [CONTEXTO_AGENDA: ...]. SIEMPRE debes revisar este contexto antes de confirmar una cita. Si la hora pedida se cruza con una cita existente, debes informar al cliente y sugerir otra hora.
2.  **AGENDAMIENTO:** Cuando el cliente confirme un servicio (Examen, Quiz, Clase), debes generar un bloque JSON especial. El formato DEBE ser:
    [BOOKING_JSON]
    {
      "service_type": "Examen" | "Quiz" | "Clase",
      "subject": "Nombre de la materia",
      "start_time": "YYYY-MM-DDTHH:MM:SSZ", // Formato ISO 8601 en UTC
      "end_time": "YYYY-MM-DDTHH:MM:SSZ", // Formato ISO 8601 en UTC
      "details": { "price": 65000, "currency": "COP", "duration_minutes": 120 }
    }
    [/BOOKING_JSON]
    Asegúrate de calcular la 'end_time' correctamente. Después del bloque JSON, añade tu mensaje de confirmación y pide el pago.
3.  **BOTONES:** Para guiar al usuario, puedes generar botones de respuesta rápida. El formato DEBE ser: [button:Texto del Botón]. Ejemplo: [button:Agendar Examen] [button:Ver Precios]
4.  **ARCHIVOS:** El usuario puede subir archivos. El sistema te informará con [INFO_SISTEMA: ...]. Acusa de recibido el archivo.
5.  **SELECTORES DE FECHA/HORA:** Cuando necesites que el usuario ingrese una fecha, añade el tag [REQUEST_DATE] al final de tu respuesta. Cuando necesites una hora, añade [REQUEST_TIME]. El sistema mostrará un selector.
    -   Ejemplo de pregunta: "¡Claro! ¿Para qué fecha necesitas el examen? [REQUEST_DATE]"
    -   Ejemplo de pregunta: "Perfecto. ¿A qué hora sería? [REQUEST_TIME]"

### Información de la Empresa (Precios, Servicios, Cuentas) ###
(Información de la empresa sin cambios... pego la de tu script)
- **Clases Particulares Online:** 1 a 1 en vivo (Matemáticas, Física, Programación, etc.)
- **Desarrollo de Trabajos:** Ensayos, informes, proyectos, tesis.
- **Asesorías Especializadas:** Preparación para exámenes (ICFES), entrevistas, etc.
- **Servicios Tecnológicos:** Desarrollo de Agentes IA, Diseño Web, Aplicaciones Web, Automatizaciones y Bots.
(Lista detallada de materias, contactos y referencias sin cambios...)

### Lógica de Agendamiento y Precios (ACTUALIZADA CON RECORDATORIOS) ###

**REGLA DE AGENDA:** Disponibilidad 24/7. Siempre confirma disponibilidad.

**FLUJO 1: Examen o Parcial**
1.  Preguntar: Materia, Fecha, Hora de inicio y Temas.
    -   **Ejemplo:** "Claro, ¿de qué materia es tu examen? **Si tienes la guía, fotos, o temas, puedes adjuntarlos usando el botón del clip 📎.**"
    -   (Después de la materia): "Perfecto, ¿qué fecha es tu examen? [REQUEST_DATE]"
    -   (Después de la fecha): "Anotado. ¿Y a qué hora inicia? [REQUEST_TIME]"
    -   (Después de la hora): "Ok. ¿Qué temas se evaluarán?"
2.  Confirmar disponibilidad (siempre hay).
3.  Preguntar: Duración del examen.
4.  Dar precio: 1.5h o 2h = $65.000 COP.
    -   Si piden descuento: $60.000 COP.
5.  Si está de acuerdo, ir al FLUJO DE PAGO.

**FLUJO 2: Quiz o Taller en clase**
1.  Preguntar: Materia, Fecha, Hora de inicio y Temas. (Usa [REQUEST_DATE] y [REQUEST_TIME] como en el flujo 1).
    -   **Al preguntar la materia, añade:** "Entendido. No dudes en adjuntar 📎 cualquier documento o imagen que tengas para el quiz/taller."
2.  Confirmar disponibilidad (siempre hay).
3.  Preguntar: Duración del quiz.
4.  Dar precio: 1.5h-2h = $60.000; 40m-1h = $35.000; <40m = $25.000.
5.  Si está de acuerdo, ir al FLUJO DE PAGO.

**FLUJO 3: Clases (Virtual o Presencial)**
1.  Preguntar: Materia y Temas.
    -   **Al preguntar la materia, añade:** "Perfecto. Si tienes algún material de estudio o ejercicios 📎, puedes adjuntarlos."
2.  Preguntar: ¿Virtual o Presencial? (Presencial solo Quito, EC).
3.  Preguntar: Disponibilidad del cliente. (Usa [REQUEST_DATE] y [REQUEST_TIME] para saber cuándo puede).
4.  Confirmar disponibilidad (siempre hay).
5.  Dar precio: 1h Presencial = 6 USD; 1h Virtual = 6 USD o $23.000 COP.
6.  Si está de acuerdo, ir al FLUJO DE PAGO.

**FLUJO 4: Otro tipo de servicios (Tesis, Apps, IA, Web, etc.)**
1.  Preguntar por el servicio (Ej: "Necesito una app web", "Ayuda con mi tesis").
2.  Confirmar que sí se puede desarrollar (basado en la lista de servicios).
    -   **Al confirmar, añade:** "Para este tipo de proyectos, es muy útil si puedes adjuntar 📎 cualquier documento con los requisitos, guías o avances que tengas."
3.  Informar al cliente: "Para este tipo de servicio, necesitamos agendar una reunión gratuita con un agente humano para revisar el trabajo y darte un costo exacto."
4.  Preguntar: "¿Estás de acuerdo en agendar la reunión?"
5.  Si acepta, finalizar diciendo: "Perfecto, un agente humano se pondrá en contacto contigo muy pronto para coordinar los detalles. ¡Gracias!" (No hay flujo de pago aquí).

**FLUJO DE PAGO (Solo si el cliente acepta un servicio de FLUJO 1, 2 o 3)**
1.  **Informar al cliente:** "Puedes realizar: ✅ Pago completo o abono de la mitad para empezar."
2.  **Preguntar:** "¿Desde qué país realizarás el pago? [button:Colombia] [button:Ecuador] [button:Otro país (Paypal)]"
3.  **Lógica de Respuesta (Reglas para la IA):**
    * **Si el cliente elige 'Colombia'**: Responde con:
        "¡Perfecto! Aquí tienes los datos para Colombia:
        Cuenta ahorros Bancolombia:
        ✅ 07800038841
        
        Nequi:
        ✅ 3184632365
        
        Daviplata:
        ✅ 3155370380
        
        ⭐ Enviar comprobante. Gracias 😊. Una vez lo envíes, tu servicio quedará 100% confirmado."
    
    * **Si el cliente elige 'Ecuador'**: Responde con:
        "¡Perfecto! Aquí tienes los datos para Ecuador:
        Banco Pichincha
        Cuenta de ahorro transaccional
        Número: 2214129032
        Nombre: Cesar Santana
        
        ⭐ Enviar comprobante. Gracias 😊. Una vez lo envíes, tu servicio quedará 100% confirmado."
        
    * **Si el cliente elige 'Otro país (Paypal)'**: Responde con:
        "¡Perfecto! Puedes usar Paypal:
        Paypal: casgereda.1@gmail.com
        
        ⭐ Enviar comprobante. Gracias 😊. Una vez lo envíes, tu servicio quedará 100% confirmado."
`;

// --- VARIABLES GLOBALES (Sin cambios) ---
let chatSession;
let supabaseClient;
let currentUserInfo = null; 
let chatHistory = []; 

// --- REFERENCIAS AL DOM (Sin cambios) ---
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


/**
 * Función principal que se ejecuta al cargar la página (Sin cambios)
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar Supabase
    try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client inicializado.");
    } catch (error) {
        console.error("Error inicializando Supabase:", error);
        chatStatus.textContent = "Error de conexión DB";
        return;
    }
    // 2. Poblar el datalist de países
    populateCountryDatalist();
    // 3. Asignar listeners
    userForm.addEventListener("submit", handleUserLogin);
    sendBtn.addEventListener("click", handleUserInput);
    userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleUserInput(); });
    uploadBtn.addEventListener("click", () => fileUploadInput.click());
    fileUploadInput.addEventListener("change", handleFileUpload);
    countryNameInput.addEventListener("input", handleCountryInput);
});

// --- Funciones del Modal de País (Sin cambios) ---
function populateCountryDatalist() {
    // (Tu lista de países va aquí)
    const countries = COUNTRIES_WITH_CODES.length > 0 ? COUNTRIES_WITH_CODES : [{ name: 'Colombia', code: '57' }, { name: 'Ecuador', code: '593' }]; // Fallback
    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country.name;
        countryDatalist.appendChild(option);
    });
}
function handleCountryInput() {
    const countryName = countryNameInput.value;
    const foundCountry = COUNTRIES_WITH_CODES.find(c => c.name === countryName);
    if (foundCountry) {
        countryCodeInput.value = `+${foundCountry.code}`;
    } else {
        countryCodeInput.value = "";
    }
}
async function handleUserLogin(event) {
    event.preventDefault();
    const countryCode = countryCodeInput.value.trim().replace('+', '');
    const whatsappNumber = whatsappNumberInput.value.trim();
    if (!countryCode || !whatsappNumber) {
        alert("Por favor selecciona un país válido y completa tu número.");
        return;
    }
    currentUserInfo = {
        id: `${countryCode}${whatsappNumber}`,
        country: countryCode
    };
    console.log("Usuario identificado:", currentUserInfo.id);
    modalOverlay.style.display = "none";
    await initializeChat();
}


/**
 * 2. INICIALIZACIÓN DEL CHAT (Sin cambios)
 */
async function initializeChat() {
    chatStatus.textContent = "Cargando historial...";
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", 
            systemInstruction: EASYCLASS_SYSTEM_PROMPT,
        });
        
        await loadOrCreateChatHistory();
        chatSession = model.startChat({ history: chatHistory });

        chatStatus.textContent = "Conectado 24/7";
        userInput.disabled = false;
        sendBtn.disabled = false;
        uploadBtn.disabled = false;

        if (chatHistory.length === 0) {
            const botReply = await callChatAPI("Hola, soy un cliente nuevo.");
            addMessageToHistory('model', botReply);
            renderBotMessage(botReply);
            await saveChatHistory(); // Guardar el saludo inicial
        } else {
            renderChatHistory();
        }
    } catch (error) {
        console.error("Error al inicializar Gemini:", error);
        chatStatus.textContent = "Error de IA";
        addBotMessage("Error al conectar con la IA. Revisa la consola (F12) y verifica tu API Key de Gemini.");
    }
}

/**
 * 3. LÓGICA DE CHAT Y ORQUESTACIÓN (Sin cambios)
 */
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
    addMessageToHistory('user', messageText);
    clearQuickReplies();
    clearSpecialInputs();
    const agenda = await getAgenda();
    const agendaContext = `[CONTEXTO_AGENDA: ${JSON.stringify(agenda)}]`;
    const messageToGemini = `${agendaContext}\n\n[MENSAJE_USUARIO: ${messageText}]`;
    const botReply = await callChatAPI(messageToGemini);
    await processBotResponse(botReply);
    await saveChatHistory();
}

/**
 * Llama a la API de Gemini (Sin cambios)
 */
async function callChatAPI(message) {
    showTypingIndicator();
    try {
        const result = await chatSession.sendMessage(message);
        const response = await result.response;
        const botReply = await response.text();
        hideTypingIndicator();
        return botReply;
    } catch (error) {
        hideTypingIndicator();
        console.error("Error al llamar a Gemini API:", error);
        return "Lo siento, estoy teniendo problemas de conexión con mi cerebro. 🧠 Por favor, intenta de nuevo.";
    }
}

/**
 * Procesa la respuesta del bot (Sin cambios)
 */
async function processBotResponse(botReply) {
    let cleanReply = botReply;
    const bookingJsonMatch = botReply.match(/\[BOOKING_JSON\]([\s\S]*?)\[\/BOOKING_JSON\]/);
    
    if (bookingJsonMatch && bookingJsonMatch[1]) {
        try {
            const bookingData = JSON.parse(bookingJsonMatch[1]);
            bookingData.client_id = currentUserInfo.id; 
            await bookServiceInAgenda(bookingData);
            cleanReply = cleanReply.replace(bookingJsonMatch[0], "");
            addBotMessage("✅ ¡Perfecto! Tu cita ha sido registrada en nuestra base de datos.");
        } catch (error) {
            console.error("Error al parsear o guardar el booking JSON:", error);
            addBotMessage("Tuve un problema al guardar tu cita en la agenda. Por favor, intenta de nuevo.");
        }
    }
    addMessageToHistory('model', botReply);
    renderBotMessage(cleanReply);
}

/**
 * 4. MANEJO DE ARCHIVOS (STORAGE) (Sin cambios)
 */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    addBotMessage(`Subiendo archivo: ${file.name}...`);
    toggleChatInput(false); 

    try {
        const filePath = `${currentUserInfo.id}/${file.name}`;
        const { data, error } = await supabaseClient.storage
            .from('uploads')
            .upload(filePath, file, { upsert: true });

        if (error) throw error;
        
        const messageToGemini = `[INFO_SISTEMA: El usuario acaba de subir un archivo llamado '${file.name}'. Está disponible en su carpeta. Por favor, acusa de recibido y continúa.]`;
        await sendOrchestratedMessage(messageToGemini); 

    } catch (error) {
        console.error("Error al subir el archivo:", error);
        addBotMessage(`Error al subir el archivo: ${error.message}`);
    } finally {
        toggleChatInput(true); 
        fileUploadInput.value = ""; 
    }
}


/**
 * 5. FUNCIONES DE BASE DE DATOS (SUPABASE) (Sin cambios)
 */
async function loadOrCreateChatHistory() {
    const { data, error } = await supabaseClient
        .from('chats')
        .select('history')
        .eq('user_id', currentUserInfo.id)
        .single();
    if (data && data.history) {
        console.log("Historial de chat cargado.");
        chatHistory = data.history;
    } else if (error && error.code === 'PGRST116') {
        console.log("No existe historial, creando uno nuevo.");
        chatHistory = [];
    } else if (error) {
        console.error("Error al cargar el historial:", error);
        addBotMessage("Error al cargar tu historial de chat.");
    }
}

function renderChatHistory() {
    chatMessages.innerHTML = "";
    chatHistory.forEach(message => {
        if (message.role === 'user') {
            addUserMessage(message.parts[0].text);
        } else if (message.role === 'model') {
            renderBotMessage(message.parts[0].text);
        }
    });
}

async function saveChatHistory() {
    const { error } = await supabaseClient
        .from('chats')
        .upsert({ 
            user_id: currentUserInfo.id, 
            history: chatHistory 
        })
        .eq('user_id', currentUserInfo.id);
    if (error) {
        console.error("Error al guardar el chat:", error);
    } else {
        console.log("Historial de chat guardado en Supabase.");
    }
}

async function getAgenda() {
    const today = new Date().toISOString();
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseClient
        .from('agenda')
        .select('subject, start_time, end_time')
        .gt('start_time', today)
        .lt('start_time', twoWeeks);
    if (error) {
        console.error("Error al obtener la agenda:", error);
        return [];
    }
    return data;
}
async function bookServiceInAgenda(bookingData) {
    const { data, error } = await supabaseClient
        .from('agenda')
        .insert([bookingData])
        .select();
    if (error) {
        console.error("Error al insertar en la agenda:", error);
        throw error;
    }
    console.log("Cita agendada:", data);
}

/**
 * 6. FUNCIONES DE UTILIDAD (UI) (Sin cambios)
 */

function addMessageToHistory(role, text) {
    chatHistory.push({ role: role, parts: [{ text: text }] });
}
function addUserMessage(message) {
    renderMessage('user', message);
}
function addBotMessage(message) {
    renderMessage('bot', message);
}

function renderBotMessage(message) {
    clearQuickReplies();
    clearSpecialInputs(); 
    
    let cleanMessage = message;

    // 1. Buscar y crear botones
    const buttonRegex = /\[button:([^\]]+)\]/g;
    let match;
    while ((match = buttonRegex.exec(message)) !== null) {
        createQuickReplyButton(match[1]);
        cleanMessage = cleanMessage.replace(match[0], ""); 
    }

    // 2. Buscar y crear selector de FECHA
    const dateRegex = /\[REQUEST_DATE\]/g;
    if (dateRegex.test(cleanMessage)) {
        createDatePicker();
        cleanMessage = cleanMessage.replace(dateRegex, ""); 
    }

    // 3. Buscar y crear selector de HORA
    const timeRegex = /\[REQUEST_TIME\]/g;
    if (timeRegex.test(cleanMessage)) {
        createTimePicker();
        cleanMessage = cleanMessage.replace(timeRegex, ""); 
    }

    // 4. Renderizar el texto limpio del mensaje
    if (cleanMessage.trim().length > 0) {
        renderMessage('bot', cleanMessage.trim());
    }
}

function renderMessage(sender, message) {
    const formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\n/g, '<br>');
    const msgDiv = document.createElement("div");
    
    // AQUÍ ESTABA EL ERROR: Decía "m.className"
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

// --- NUEVAS FUNCIONES PARA SELECTORES ---

function createDatePicker() {
    const wrapper = document.createElement("div");
    wrapper.className = "special-input-wrapper";

    const input = document.createElement("input");
    input.type = "date";
    input.className = "special-input";
    
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    input.min = today; // No permitir agendar en el pasado

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

    // AQUÍ ESTABA EL OTRO ERROR: Decía "s.className"
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

// --- FIN DE NUEVAS FUNCIONES ---

function toggleChatInput(enabled) {
    userInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    uploadBtn.disabled = !enabled;
    
    if (enabled) {
        userInput.focus();
    }
}

function showTypingIndicator() {
    let typingDiv = document.getElementById("typing-indicator");
    if (!typingDiv) {
        typingDiv = document.createElement("div");
        typingDiv.id = "typing-indicator";
        typingDiv.className = "message bot-message";
        typingDiv.innerHTML = `<div class="message-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
        chatMessages.appendChild(typingDiv);
    }
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById("typing-indicator");
    if (typingDiv) typingDiv.remove();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}