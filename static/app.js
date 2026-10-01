//Scatole/Variabili

let mediaRecorder; // Registratore
let audioChuncks = []; // Contenitore pezzi di audio
// Pulsante e tabella dal file html

const recordButton = document.getElementById("recordButton");
// quando fai click, esegui la funzione "toggle recording"

recordButton.addEventListener("click", toggleRecording);
async function toggleRecording() {
    if (mediaRecorder?.state === "recording") { mediaRecorder.stop(); return; } // Se stai registrando, fermati

        try{
            // Chiediamo il permesso
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true});
        
            // Creiamo il registratore e svuotiamo la memoria dei pezzettini
            mediaRecorder = new MediaRecorder(stream);
            audioChuncks = [];
            
            //Comando per raccogliere l'audio mentre parli

            mediaRecorder.ondataavailable = (event) => {
                audioChuncks.push(event.data);
            };

            // Che fa il registratore quando si ferma?
         mediaRecorder.onstop = () => {
            // Raccoglie tutti i pezzettini e li fonde in un unico file audio .webm
            const audioBlob = new Blob(audioChuncks, {type: "audio/webm" });
            
            console.log("File audio creato! Dimensione:", audioBlob.size, "byte");
            //Passiamo il file alla funzione che lo spedirà

            inviaAudio(audioBlob);
            // Spenge il microfono di Windows/Mac
            stream.getTracks().forEach(track => track.stop());

            recordButton.textContent=" 🎤 ";
            recordButton.classList.remove("recording");
         };
        
        // Registrazione On

        mediaRecorder.start();

        // aggiornamento grafica Pulsante

        console.log("Inizio registrazione...");

        recordButton.textContent="⏹ Registrazione.. Clicca per fermare ";
        recordButton.classList.add("recording");


        }
        catch (err) {
        //Se non dai l'autorizzazione del microfono

        alert("Per registrare, devi concedere i permessi di usare il microfono al browser!");
        console.error("Errore microfono:", err);
        }
    }
async function inviaAudio(blob,) {
   
    
    // Creiamo un pacco postale

    const formData = new FormData();

    // Inseriamo il file nel pacco e gli diamo un nome

    formData.append("file", blob, "audio.webm");

    try {

        console.log("Spedizione file in corso..");

    //  Spediamo il pacco
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        })
        if (!response.ok) {
            alert("Errore nell'invio: " + response.status);
            return;
        }

    // Risposta del server
    const data = await response.json();

        if(data.audio_id) {
            console.log("Audio ricevuto dal server! l'ID è: ", data.audio_id);
            aggiungiMessaggioInChat(data.audio_id, blob);
        }
        
    }
    catch (err){
        console.error("Errore di connessione con il server:", err);
    }
}
function aggiungiMessaggioInChat(audioId, audioBlob){
    // Prendo il contenitore della chat invece della tabella
    const chatBox = document.getElementById("chatBox");

    //Creo un URL per ascoltare l'audio dal browser
    const audioUrl = URL.createObjectURL(audioBlob);

    // Creo la bolla del messaggio
    const msgDiv = document.createElement("div");
    msgDiv.className = "message-bubble";
    msgDiv.id = "msg-" + audioId;

    
    // Inseriamo l'HTML dentro la bolla del messaggio, con il player audio e il pulsante per mostrare/nascondere la trascrizione
    msgDiv.innerHTML = 
        `   <!-- Etichetta -->

        <div class="audio-label"> NOTA VOCALE 
        </div>

            <!-- Player audio -->

        <audio controls src="${audioUrl}" class="audio-player">
        </audio>

            <!-- Bottone Trascrizione -->

        <button id="toggleBtn-${audioId}" class="toggle-btn">▼ Mostra Trascrizione
        </button>
        
            <!-- Descrizione processo -->

        <div id="transcriptionBox-${audioId}" class="transcription-box" style="display: none;">
            <div id="text-${audioId}" class="transcription-text"> ...
            </div>
        </div>

            <!-- Stato -->

        <div id="status-${audioId}" class="status-indicator">Audio ricevuto, Premi "Mostra Trascrizione" per vedere il risultato
        </div>
        
        `;



    chatBox.appendChild(msgDiv);

    // Aggiungo l'evento al pulsante per mostrare/nascondere la trascrizione
    const toggleBtn = document.getElementById(`toggleBtn-${audioId}`);
    const transcriptionBox = document.getElementById(`transcriptionBox-${audioId}`);
    let avviata = false; // Stato della trascrizione

    toggleBtn.addEventListener("click", async () => {
        if (!avviata) {
            avviata = true;
            transcriptionBox.style.display = "block"; // Mostra la trascrizione
            toggleBtn.textContent = "▲ Nascondi Trascrizione";
            const ok = await avviaTrascrizione(audioId);
            if (!ok) avviata = false; // Se la trascrizione non è partita, resetto lo stato
            return;
        }
        if (transcriptionBox.style.display === "none") {
            transcriptionBox.style.display = "block"; // Mostra la trascrizione
            toggleBtn.textContent = "▲ Nascondi Trascrizione";
        } else {
            transcriptionBox.style.display = "none"; // Nascondi la trascrizione
            toggleBtn.textContent = "▼ Mostra Trascrizione";
        }
    });
}

async function avviaTrascrizione(audioId) {
    const divStatus = document.getElementById(`status-${audioId}`);
    divStatus.textContent = "Invio in coda...";
    try {
        const response = await fetch("/trascrivi/" + audioId, { method: "POST" });
        if (!response.ok) throw new Error("Errore nella richiesta di trascrizione: " + response.status);
        const data = await response.json();
        controlloStatoTask(audioId, data.task_id);
        return true;
     } catch (err) {
        divStatus.textContent = "Errore durante l'avvio della trascrizione.";
        console.error("Errore durante l'avvio della trascrizione.", err);
        return false;
     }
}

// Avvia il controllo dello stato del task
function controlloStatoTask(audioId, taskId) {
    
    // Fa ripetere questo blocco di codice ogni 2 secondi
    const interval = setInterval(async () => {
        try{
            // Domanda al server  dello stato dell'id
            const response = await fetch ("/status/" + taskId);
            const data = await response.json();

            console.log("Risposta dal server per ID " + taskId + ":", data);
            // Prendiamo dalla tabella 
            const divStatus = document.getElementById(`status-${audioId}`);
            const divText = document.getElementById(`text-${audioId}`);
            // Controllo la risposta del server

            if (divStatus === null){
                clearInterval(interval);
                return;
            }


            if(data.stato === "SUCCESS") {
                //SUCCESSO
                divStatus.textContent = "Ho capito!";
                divStatus.style.color = "#8E44AD";

                clearInterval(interval); //stop alla domanda del server
            }
            else if (data.stato === "FAILURE") {
                //ERRORE
                divStatus.textContent = "Non ci ho capito nulla, scusa :(";
                divStatus.style.color = "#FF7F50";
                divText.textContent = "Trascrizione fallita.";
                
                clearInterval(interval);
            }

            else {
                //PENDING 

                divStatus.textContent = "Sto cercando di capirti...";

            }
        }
        catch(err) {
            console.error("Errore durante il controllo dello stato.", err);
        }
    }, 2000); // Controlla ogni 2 secondi
}

const nomi = { queued: "In coda", processing: "In elaborazione", error: "Fallito", done: "Completato" };

async function aggiornaCoda() {
    try {
        const res = await fetch("/jobs");
        const data = await res.json();
        const conta = { queued: 0, processing: 0, error: 0, done: 0 };
        const lista = document.getElementById("job-list");
            
        lista.innerHTML = ""; // Pulisce la lista prima di aggiornarla
        data.jobs.forEach(job => {
            const s = job.stato === "SUCCESS" ? "done" 
                    : job.stato === "FAILURE" ? "error" 
                    : job.stato === "STARTED" ? "processing" : "queued";
            conta[s]++;
            const li = document.createElement("li");
            const ora = new Date(job.creato * 1000).toLocaleTimeString();
            li.textContent = `[${ora}] ${job.file} - ${nomi[s]}`;
            lista.appendChild(li);
        });


        for (const k in conta) document.getElementById("count-" +k).textContent = conta[k];
    }catch (err) {
            console.error("Errore durante l'aggiornamento della coda.", err);
    }
}
aggiornaCoda();
setInterval(aggiornaCoda, 2000); // Aggiorna la coda ogni 2 secondi
