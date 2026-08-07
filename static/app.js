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
        recordButton.style.color = "black";
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
            aggiungiTaskInTabella(data.task_id);
        }
        
    }
    catch (err){
        console.error("Errore di connessione con il server:", err);
    }
}
function aggiungiTaskInTabella(taskId){
    //  Creiamo un nuovo elemento <tr>
    alert("Disegno la riga per l'id: " + taskId + "..");

    const tr = document.createElement("tr");

    //  Diamo un ID alla riga
    tr.id = "row-${taskId}";

    // Essendo troppo lungo ne prendiamo solo le primo 8 cifre
    const shortId = taskId.substring(0, 8);

    // Inseriamo la riga
    tr.innerHTML = `
    <td><small>${shortId}</small></td>
    <td style="color: #f39c12; font-weight: bold;" id="status-${taskId}"> In Coda... </td>
    <td id="tex-${taskId}">-</td>
    `;
    // Inseriamo questa nuova riga nella tabella
    queueBody.prepend(tr);
}