import time
from celery import Celery
import whisper

modello_toload = "large-v3-turbo"
# 1. INIZIALIZZAZIONE DI CELERY
# Diciamo a Celery dove trovare Redis (sia come 'broker' per le code, sia come 'backend' per i risultati)




celery_app = Celery(
    "trascrizioni_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)
celery_app.conf.task_track_started = True #

modello_attuale = None

def get_modello():
    global modello_attuale
    if modello_attuale is None:
        print(f"Caricamento Whisper ({modello_toload})... Attendere...")
        modello_attuale = whisper.load_model(modello_toload)
        print(f"Modello Whisper {modello_toload} caricato correttamente e pronto!")
    return modello_attuale

# 2. DEFINIZIONE DEL LAVORO (IL TASK)
# Usiamo il decoratore @celery_app.task per dire che questa funzione sarà eseguita in background
@celery_app.task(name="trascrivi_audio")
def esegui_trascrizione(percorso_file: str):
    print(f"Trascrizione in corso di {percorso_file}")

    # estrapolo il testo dall'audio tramite il whisper
    
    risultato = get_modello().transcribe(percorso_file)
    # Inserisco il testo dentro testo_descritto
    testo_trascritto = risultato["text"]

    print(f"Trascrizione completata: {testo_trascritto}")

    return testo_trascritto