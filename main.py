import os
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# ─── CARGAR VARIABLES DE ENTORNO ─────────────────────────────────────────────
# En Render las variables vienen del panel "Environment".
# En desarrollo local las lee desde el archivo .env
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
    Asegurate de calcular la end_time correctamente. Despues del bloque JSON, añade tu mensaje de confirmacion y pide el pago.
3.  **BOTONES:** Genera botones de respuesta rapida con el formato: [button:Texto del Boton].
4.  **ARCHIVOS:** El usuario puede subir archivos. El sistema te informara con [INFO_SISTEMA: ...]. Acusa de recibido.
5.  **SELECTORES:** Usa [REQUEST_DATE] para pedir fechas y [REQUEST_TIME] para pedir horas.
6.  **REGLA DE BREVEDAD:** **No seas repetitivo.** No confirmes la informacion que el cliente te acaba de dar. Ve directo a la siguiente pregunta.
7.  **REGLA DE VALIDACION DE MATERIA:** Antes de agendar, DEBES verificar que la materia este en tu lista.

### Informacion de la Empresa EasyClass ###

**Servicios Principales:**
- Clases Particulares Online: 1 a 1 en vivo
- Desarrollo de Trabajos: Ensayos, informes, proyectos, tesis
- Asesorias Especializadas: Preparacion para examenes (ICFES), entrevistas
- Servicios Tecnologicos: IA, Diseno Web, Apps, Automatizaciones

**Lista detallada de Materias y Servicios:**
- Algebra, Analisis Estructural, Calculo (1, 2, 3, multivariable, diferencial, integral)
- Desarrollo de aplicaciones web y movil, Software
- SolidWorks, AutoCad
- Dinamica, Ecuaciones diferenciales, Electricidad, Electronica
- Estadistica, Estatica, Fisica (1, 2, 3, Electromagnetismo, Ondas, Mecanica)
- Geometria, Matematicas (colegio, universidad)
- Ingles
- Programacion: Matlab, Python, C++, C, Java, HTML, CSS, JavaScript, PHP, Arduino
- Materiales, Matematicas Discretas, Mecanica Analitica, Mecanica de Fluidos
- Metodos Numericos, Quimica, Resistencia de materiales, Termodinamica, Transferencia de calor
- Economia y Financiera
- Desarrollo de tesis, ensayos, trabajos escritos, Normas APA, ICONTEC

**Informacion de Contacto (Solo si preguntan):**
- Web: https://easyclass10.github.io/
- YouTube: https://www.youtube.com/channel/UChtKjBiS0nCyyq_288JD31Q
- Facebook: https://www.facebook.com/Andres-Bueno-502366350132053
- Whatsapp: +573044435307

### Logica de Agendamiento y Precios ###

**FLUJO 1: Examen o Parcial**
1. Preguntar por materia. Validarla.
2. Pedir secuencialmente: Fecha [REQUEST_DATE], Hora [REQUEST_TIME], Temas, Duracion.
3. Precio: 1.5h-2h -> $65.000 COP. Descuento -> $60.000 COP.
4. Si acepta -> FLUJO DE PAGO.

**FLUJO 2: Quiz o Taller**
1. Preguntar por materia. Validarla.
2. Pedir: Fecha [REQUEST_DATE], Hora [REQUEST_TIME], Temas, Duracion.
3. Precio: 1.5h-2h -> $60.000 / 40min-1h -> $35.000 / menos de 40min -> $25.000 COP.
4. Si acepta -> FLUJO DE PAGO.

**FLUJO 3: Clases**
1. Preguntar por materia. Validarla.
2. Pedir: Temas, Modalidad (Virtual/Presencial - presencial solo Quito EC), Disponibilidad [REQUEST_DATE] [REQUEST_TIME].
3. Precio: 1h Presencial Quito: 6 USD / 1h Virtual: 6 USD o $23.000 COP.
4. Si acepta -> FLUJO DE PAGO.

**FLUJO 4: Otros servicios (Tesis, Apps, IA, Web)**
1. Confirmar servicio, solicitar archivos, ofrecer reunion gratuita.
2. [button:Agendar reunion] [button:No, gracias]
3. Si acepta: "Un agente humano se pondra en contacto muy pronto." (Sin flujo de pago.)

**FLUJO DE PAGO**
1. Informar opciones de pago.
2. [button:Colombia] [button:Ecuador] [button:Otro pais (Paypal)]
3. Colombia: Bancolombia 07800038841 / Nequi 3184632365 / Daviplata 3155370380
4. Ecuador: Banco Pichincha, cuenta ahorro transaccional 2214129032, Cesar Santana
5. PayPal: casgereda.1@gmail.com
6. Pedir comprobante para confirmar el servicio.
"""

# ─── APLICACION FASTAPI ───────────────────────────────────────────────────────
app = FastAPI(title="EasyClass Backend", version="1.0.0")

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Cambia estos origenes por los dominios reales de tu frontend
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
# Usamos List[] de typing para compatibilidad con Python 3.9, 3.10 y 3.11
class HistoryPart(BaseModel):
    text: str

class HistoryMessage(BaseModel):
    role: str           # "user" o "model"
    parts: List[HistoryPart]

class ChatRequest(BaseModel):
    history: List[HistoryMessage] = []
    message: str

class ChatResponse(BaseModel):
    reply: str

# ─── HELPER: convertir historial al formato de Gemini SDK ────────────────────
def build_gemini_history(history: List[HistoryMessage]) -> list:
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
    La GEMINI_API_KEY nunca sale de este servidor.
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
        # El error queda visible en los Logs de Render
        print(f"[ERROR Gemini] {exc}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al procesar el mensaje con Gemini.",
        )
