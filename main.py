import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse 
from fastapi.statifiles import StaticFiles
from celery.result import AsyncResult
from worker import esegui_trascrizione_finta, celery_app

# Avvio server

app = FastAPI(title="Server Trascrizioni Asincrone") 

app.mount("/static", StaticFiles(directory="static"), name="static")
# Crea una cartella chiamata uploads per salvare gli audio in arrivo
CARTELLA_UPLOAD = "uploads"
os.makedirs(CARTELLA_UPLOAD, exist_ok=True)  #se esiste gia, non lo fare


@app.post("/upload")
async def ricevi_audio(file: UploadFile = File(...)):
    
     
    # Controllo se è un audio o no, tramite letture dell'etichetta
    if not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail=f"Formato non valido: Perfavore carica solo file audio"
        )
    # SE E TUTTO OK

    # Estraiamo l'estensione orginale (da "audio1.mp3" prendiamo solo ".mp3")
    estensione = os.path.splitext(file.filename)[1]

    # Generiamo un codice univoco 
    codice_univoco = str(uuid.uuid4())

    # Uniamo il codice all'estensione
    nuovo_nomefile = f"{codice_univoco}{estensione}"

    # Salviamo il file
    percorso_file = f"{CARTELLA_UPLOAD}/{nuovo_nomefile}"
    
    # Salva il file fisicamente sul server
    with open(percorso_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # .delay(), invia un messagio a Redis e Celery lo prenderà in carico
    task = esegui_trascrizione_finta.delay(percorso_file)
   
    return{
        "messaggio": "Audio ricevuto e inviato in coda di trascrizione.",
        "task_id": task.id
    }
   
   
   
    return {
        "messaggio": "Audio ricevuto e salvato con successo!",
        "codice_univoco" : codice_univoco,
        "file_salvato" : nuovo_nomefile
    }
@app.get("/status/{task_id}")
def controlla_stato(task_id: str):
    risultato = AsyncResult(task_id, app=celery_app)
    
    risposta = {
        "stato": risultato.status # "PENDING/PROCESSING/SUCCES/FAILURE"
    }

    if risultato.status == "SUCCES":
        risposta["testo_trascritto"] = risultato.result
    elif risultato.status == "FAILURE":
        risposta["errore"] = str(risultato.result)
    
    return risposta

@app.get("/", responses_class=HTMLResponse)
def home():
    #legge il file HTML e lo mostra nel browser
    with open("static/index.html", "r", encoding="utf-8") as f:
    return f.read()
    return {"status": "Il server FastAPI è online!"}