//Scatole/Variabili

let mediaRecorder; // Registratore
let audioChuncks = []; // Contenitore pezzi di audio
let isRecording = false; // Flag di registrazione

// Pulsante e tabella dal file html

const recordButton = document.getElementById("recordButton");
const queueBody = document.getElementById("queueBody");

// quando fai click, esegui la funzione "toggle recording"

recordButton.addEventListener("click", toggleRecording);

async function toggleRecording() {
    if (isRecording == false) {

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
         };
        
        // Registrazione On

        mediaRecorder.start();
        isRecording = true;

        // aggiornamento grafica Pulsante

        console.log("Inizio registrazione...");

        recordButton.textContent=" Registrazione in corso..";
        recordButton.style.backgroundColor = "#c039";
        recordButton.style.color = "white";

        }
        catch (err) {
        //Se non dai l'autorizzazione del microfono

        alert("Per registrare, devi concedere i permessi di usare il microfono al browser!");
        console.error("Errore microfono:", err);
        }
    }
    else {
        
        mediaRecorder.stop();
        isRecording = false;
        console.log("Fine registrazione");

        recordButton.textContent=" Clicca per iniziare a registrare";
        recordButton.style.backgroundColor = "";
        recordButton.style.color = "#b9ecec";
    }
}
async function inviaAudio(blob) {
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
        });

    // Risposta del server
    const data = await response.json();

        if(data.task_id) {
            console.log("Audio ricevuto dal server! l'ID è: ", data.task_id);
            aggiungiMessaggioInChat(data.task_id);
        }
        
    }
    catch (err){
        console.error("Errore di connessione con il server:", err);
    }
}
function aggiungiMessaggioInChat(taskId){
    // Prendo il contenitore della chat invece della tabella
    const chatBox = document.getElementById("chatBox");

    // Creo la bolla del messaggio
    const msgDiv = document.createElement("div");
    msgDiv.className = "message-bubble";
    msgDiv.id = "msg-" + taskId;

    // Etichetta "NOTA VOCALE"
    const audioLabel = document.createElement("div");
    audioLabel.className = "audio-label";
    audioLabel.innerHTML = "NOTA VOCALE";

    // Testo della trascrizione
    const textDiv = document.createElement("div");
    textDiv.className = "transcription-text";
    textDiv.id = "text-" + taskId;
    textDiv.textContent = "Ti sto analizzando...";

    // Stato (In coda, Completato, Errore)
    const statusDiv = document.createElement("div");
    statusDiv.className = "status-indicator";
    statusDiv.id = "status-" + taskId;
    statusDiv.innerHTML = "Audio ricevuto ✓";

    // Inserisco gli elementi nella bolla
    msgDiv.appendChild(audioLabel);
    msgDiv.appendChild(textDiv);
    msgDiv.appendChild(statusDiv);
    
    // Inserisco la bolla nella chat
    chatBox.appendChild(msgDiv);
    
    // Faccio scorrere la chat verso il basso in automatico
    chatBox.scrollTop = chatBox.scrollHeight;

    controlloStatoTask(taskId);
}

function controlloStatoTask(taskId){
    
    // Fa ripetere questo blocco di codice ogni 2 secondi
    const interval = setInterval(async () => {
        try{
            // Domanda al server  dello stato dell'id
            const response = await fetch ("/status/" + taskId);
            const data = await response.json();

            console.log("Risposta dal server per ID " + taskId + ":", data);
            // Prendiamo dalla tabella 
            const divStatus = document.getElementById(`status-${taskId}`);
            const divText = document.getElementById(`text-${taskId}`);
            // Controllo la risposta del server

            if (divStatus === null){
                clearInterval(interval);
                return;
            }


            if(data.stato === "SUCCESS") {
                //SUCCESSO
                divStatus.textContent = "Ho capito!";
                divStatus.style.color = "#8E44AD";

                divText.textContent = data.risultato || data.result || "Trascrizione vuota";

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
            
            clearInterval(interval);
        }

    }, 2000); //2000 = 2 secondi
}