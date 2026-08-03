import time
from celery import Celery

# 1. INIZIALIZZAZIONE DI CELERY
# Diciamo a Celery dove trovare Redis (sia come 'broker' per le code, sia come 'backend' per i risultati)
# Se stai usando il Docker locale, l'indirizzo standard è localhost:6379
celery_app = Celery(
    "trascrizioni_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

# 2. DEFINIZIONE DEL LAVORO (IL TASK)
# Usiamo il decoratore @celery_app.task per dire che questa funzione sarà eseguita in background
@celery_app.task(name="trascrivi_audio")
def esegui_trascrizione_finta(percorso_file: str):
    """
    Questa per ora è una funzione finta (Mock).
    Più avanti inseriremo qui dentro l'intelligenza artificiale di Whisper.
    """
    print(f"👷 Celery ha preso in carico il file: {percorso_file}")
    
    # Fingiamo che ci voglia del tempo per trascrivere (es. 10 secondi)
    print("⏳ Inizio trascrizione...")
    time.sleep(10)
    
    testo_finto = "Questa è una trascrizione di prova. Più avanti ci sarà Whisper qui!"
    
    print("✅ Trascrizione completata!")
    
    # Celery salverà in automatico questo risultato dentro Redis!
    return testo_finto