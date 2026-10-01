import os
import shutil
import uuid
import time # Per coda di lavoro
import redis # Per coda di lavoro
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse 
from fastapi.staticfiles import StaticFiles
from celery.result import AsyncResult
from worker import esegui_trascrizione, celery_app


r = redis.Redis.from_url("redis://localhost:6379/0", decode_responses=True) # Connessione a Redis
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
    

    r.set(f"audio:{codice_univoco}", nuovo_nomefile)  # Salva il nome del file in Redis
    return{
        "messaggio": "Audio ricevuto",
        "audio_id": codice_univoco
    }

@app.post("/trascrivi/{audio_id}")
def trascrivi_audio(audio_id: str):
    nome_file = r.get(f"audio:{audio_id}")
    if not nome_file:
        raise HTTPException(status_code=404, detail="Audio non trovato")

    task = esegui_trascrizione.delay(f"{CARTELLA_UPLOAD}/{nome_file}")
    r.hset(f"job:{task.id}", mapping={"file": nome_file, "creato": time.time()})
    r.lpush("jobs", task.id)  # Aggiungi l'ID del task alla lista "jobs" in Redis
    return {"task_id": task.id}


@app.get("/status/{task_id}")
def controlla_stato(task_id: str):
    risultato = AsyncResult(task_id, app=celery_app)
    
    risposta = {
        "stato": risultato.status # "PENDING/SUCCES/FAILURE"
    }

    if risultato.status == "SUCCESS":
        risposta["risultato"] = risultato.result
    elif risultato.status == "FAILURE":
        risposta["errore"] = str(risultato.result)
    
    return risposta

@app.get("/", response_class = HTMLResponse)
def home():
    # legge il file HTML e lo mostra nel browser
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()
   # return {"status": "Il server FastAPI è online!"}

@app.get("/jobs")
def lista_jobs():
    # Recupera tutti gli ID dei task dalla lista "jobs" in Redis  
    jobs = []
    for task_id in r.lrange("jobs", 0, 49):  # Limitiamo a 50 job recenti
        res = AsyncResult(task_id, app=celery_app)
        jobs.append({
                "task_id": task_id,
                "file": r.hget(f"job:{task_id}", "file"),
                "creato": float(r.hget(f"job:{task_id}", "creato")or 0),
                "stato": res.status,
            })
    
    return {"jobs": jobs}