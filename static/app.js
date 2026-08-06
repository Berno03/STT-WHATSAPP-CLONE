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

        isRecording = true;
        console.log("Inizio registrazione...");

        recordButton.textContent=" Registrazione in corso..";
        recordButton.style.backgroundColor = "#c039"
        recordButton.style.color = "white";
    }
    else {
        
        isRecording = false;
        console.log("Fine registrazione");

        recordButton.textContent=" Clicca per iniziare a registrare";
        recordButton.style.backgroundColor = "";
        recordButton.style.color = "black";
    }
}