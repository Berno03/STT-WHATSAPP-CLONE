import time
from celery import Celery
import whisper

# 1. INIZIALIZZAZIONE DI CELERY
# Diciamo a Celery dove trovare Redis (sia come 'broker' per le code, sia come 'backend' per i risultati)

celery_app = Celery(
    "trascrizioni_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

print ("Caricamento Whisper...Attendere..")
whisper_model= whisper.load_model("base")
print ("Whisper caricato correttamente e pronto!")

# 2. DEFINIZIONE DEL LAVORO (IL TASK)
# Usiamo il decoratore @celery_app.task per dire che questa funzione sarà eseguita in background
@celery_app.task(name="trascrivi_audio")
def esegui_trascrizione(percorso_file: str):
    print(f"Trascrizione in corso di {percorso_file}")

    # estrapolo il testo dall'audio tramite il whisper
    
    risultato = whisper_model.transcribe(percorso_file)
    # Inserisco il testo dentro testo_descritto
    testo_trascritto = risultato["text"]

    print("Trascrizione completata: {testo_trascritto}")

    return testo_trascritto