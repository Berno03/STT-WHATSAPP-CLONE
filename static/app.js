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
