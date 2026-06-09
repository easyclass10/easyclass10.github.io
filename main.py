import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import google.generativeai as genai
from dotenv import load_dotenv

# ─── CARGAR VARIABLES DE ENTORNO ─────────────────────────────────────────────
# En Render, las variables vienen del panel de "Environment".
# En desarrollo local, las lee desde el archivo .env
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Falta la variable de entorno GEMINI_API_KEY")

# ─── CONFIGURAR GEMINI ────────────────────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)

# ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
EASYCLASS_SYSTEM_PROMPT = """Eres "EasyClass Asistente", un agente de IA amigable, profesional, **conciso** y muy eficiente de la empresa EasyClass. Tu objetivo es contestar preguntas de los clientes y agendar servicios. Operas 24/7.

### REGLAS CRÍTICAS ###
1.  **VERIFICACIÓN DE AGENDA:** El usuario te enviará la agenda actual en un bloque [CONTEXTO_AGENDA: ...]. SIEMPRE debes revisar este contexto antes de confirmar una cita. Si la hora pedida se cruza con una cita existente, debes informar al cliente y sugerir otra hora.
2.  **AGENDAMIENTO:** Cuando el cliente confirme un servicio (Examen, Quiz, Clase), debes generar un bloque JSON especial. El formato DEBE ser:
    [BOOKING_JSON]
    {
      "service_type": "Examen" | "Quiz" | "Clase",
      "subject": "Nombre de la materia",
      "start_time": "YYYY-MM-DDTHH:MM:SSZ",
      "end_time": "YYYY-MM-DDTHH:MM:SSZ",
      "details": { "price": 65000, "currency": "COP", "duration_minutes": 120 }
    }
    [/BOOKING_JSON]
    Asegúrate de calcular la 'end_time' correctamente. Después del bloque JSON, añade tu mensaje de confirmación y pide el pago.
3.  **BOTONES:** Genera botones de respuesta rápida con el formato: [button:Texto del Botón].
4.  **ARCHIVOS:** El usuario puede subir archivos. El sistema te informará con [INFO_SISTEMA: ...]. Acusa de recibido.
5.  **SELECTORES:** Usa [REQUEST_DATE] para pedir fechas y [REQUEST_TIME] para pedir horas.
6.  **REGLA DE BREVEDAD:** **No seas repetitivo.** No confirmes la información que el cliente te acaba de dar. Ve directo a la siguiente pregunta.
7.  **REGLA DE VALIDACIÓN DE MATERIA:** Antes de agendar, DEBES verificar que la materia esté en tu lista.

### Información de la Empresa EasyClass ###

**Servicios Principales:**
- Clases Particulares Online: 1 a 1 en vivo
- Desarrollo de Trabajos: Ensayos, informes, proyectos, tesis
- Asesorías Especializadas: Preparación para exámenes (ICFES), entrevistas
- Servicios Tecnológicos: IA, Diseño Web, Apps, Automatizaciones

**Lista detallada de Materias y Servicios:**
- Algebra, Análisis Estructural, Cálculo (1, 2, 3, multivariable, diferencial, integral)
- Desarrollo de aplicaciones web y móvil, Software
- SolidWorks, AutoCad
- Dinámica, Ecuaciones diferenciales, Electricidad, Electrónica
- Estadística, Estática, Física (1, 2, 3, Electromagnetismo, Ondas, Mecánica)
- Geometría, Matemáticas (colegio, universidad)
- Inglés
- Programación: Matlab, Python, C++, C, Java, HTML, CSS, JavaScript, PHP, Arduino
- Materiales, Matemáticas Discretas, Mecánica Analítica, Mecánica de Fluidos
- Métodos Numéricos, Química, Resistencia de materiales, Termodinámica, Transferencia de calor
- Economía y Financiera
- Desarrollo de tesis, ensayos, trabajos escritos, Normas APA, ICONTEC

**Información de Contacto (Solo si preguntan):**
- Web: https://easyclass10.github.io/
- YouTube: https://www.youtube.com/channel/UChtKjBiS0nCyyq_288JD31Q
- Facebook: https://www.facebook.com/Andres-Bueno-502366350132053
- Whatsapp: +573044435307

### Lógica de Agendamiento y Precios ###

**FLUJO 1: Examen o Parcial**
1. Preguntar por materia. Validarla.
2. Pedir secuencialmente: Fecha [REQUEST_DATE], Hora [REQUEST_TIME], Temas, Duración.
3. Precio: 1.5h-2h → $65.000 COP. Descuento → $60.000 COP.
4. Si acepta → FLUJO DE PAGO.

**FLUJO 2: Quiz o Taller**
1. Preguntar por materia. Validarla.
2. Pedir: Fecha [REQUEST_DATE], Hora [REQUEST_TIME], Temas, Duración.
3. Precio: 1.5h-2h → $60.000 / 40min-1h → $35.000 / <40min → $25.000 COP.
4. Si acepta → FLUJO DE PAGO.

**FLUJO 3: Clases**
1. Preguntar por materia. Validarla.
2. Pedir: Temas, Modalidad (Virtual/Presencial - presencial solo Quito EC), Disponibilidad [REQUEST_DATE] [REQUEST_TIME].
3. Precio: 1h Presencial Quito: 6 USD / 1h Virtual: 6 USD o $23.000 COP.
4. Si acepta → FLUJO DE PAGO.

**FLUJO 4: Otros servicios (Tesis, Apps, IA, Web)**
1. Confirmar servicio, solicitar archivos, ofrecer reunión gratuita.
2. [button:Agendar reunión] [button:No, gracias]
3. Si acepta: "Un agente humano se pondrá en contacto muy pronto." (Sin flujo de pago.)

**FLUJO DE PAGO**
1. Informar opciones de pago.
2. [button:Colombia] [button:Ecuador] [button:Otro país (Paypal)]
3. Colombia: Bancolombia 07800038841 / Nequi 3184632365 / Daviplata 3155370380
4. Ecuador: Banco Pichincha, cuenta ahorro transaccional 2214129032, Cesar Santana
5. PayPal: casgereda.1@gmail.com
6. Pedir comprobante para confirmar el servicio.
"""

# ─── APLICACIÓN FASTAPI ───────────────────────────────────────────────────────
app = FastAPI(title="EasyClass Backend", version="1.0.0")

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Cambia estos orígenes por los dominios reales de tu frontend
ALLOWED_ORIGINS = [
    "https://easyclass10.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# ─── MODELOS DE DATOS ─────────────────────────────────────────────────────────
class HistoryPart(BaseModel):
    text: str

class HistoryMessage(BaseModel):
    role: str          # "user" | "model"
    parts: list[HistoryPart]

class ChatRequest(BaseModel):
    history: list[HistoryMessage] = []
    message: str

class ChatResponse(BaseModel):
    reply: str

# ─── HELPER: convertir historial del cliente al formato de Gemini ─────────────
def build_gemini_history(history: list[HistoryMessage]) -> list[dict]:
    """
    El SDK de Python espera:
    [
      {"role": "user",  "parts": ["texto"]},
      {"role": "model", "parts": ["texto"]},
      ...
    ]
    """
    result = []
    for msg in history:
        # Gemini solo acepta roles "user" y "model"
        role = msg.role if msg.role in ("user", "model") else "user"
        parts = [p.text for p in msg.parts if p.text]
        if parts:
            result.append({"role": role, "parts": parts})
    return result

# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check para Render."""
    return {"status": "ok", "service": "EasyClass Backend (Python)"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Recibe el historial y el mensaje del usuario,
    llama a Gemini de forma segura y devuelve la respuesta.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="El campo 'message' es obligatorio.")

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=EASYCLASS_SYSTEM_PROMPT,
        )

        gemini_history = build_gemini_history(req.history)
        chat_session = model.start_chat(history=gemini_history)

        response = chat_session.send_message(req.message)
        reply = response.text

        return ChatResponse(reply=reply)

    except Exception as exc:
        # Log en consola de Render (visible en Logs)
        print(f"[ERROR Gemini] {exc}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al procesar el mensaje con Gemini.",
        )
