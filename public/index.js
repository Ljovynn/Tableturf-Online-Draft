document.getElementById("settings").onclick = OpenSettingsPopup;
document.getElementById("closeSettings").onclick = CloseSettingsPopup;

const site = "http://localhost:8080"

let linkBox = document.getElementById("link");
let copyBtn = document.getElementById("copyDraft");
let openBtn = document.getElementById("openDraft");

let LangForm = document.getElementById("languages");

let player1NameDoc = document.getElementById("player1");
let player2NameDoc = document.getElementById("player2");
let draftSizeDoc = document.getElementById("draftSize");
let minSpecialsDoc = document.getElementById("312Size");
let generateDraftBtn = document.getElementById("generateDraft");

let popup = document.getElementById("popup");

/*var storedLang = localStorage['language'] || 'en';
document.documentElement.setAttribute('lang', storedLang);
console.log(storedLang);*/

generateDraftBtn.addEventListener("click", () => {
    generateDraftBtn.disabled = true;
    let player1 = player1NameDoc.value;
    let player2 = player2NameDoc.value;
    let draftSize = draftSizeDoc.value;
    let minSpecials = minSpecialsDoc.value;

    console.log(player1NameDoc);
    console.log("innarhtml: namn: "  + player1);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "GenerateNewDraft", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        player1Name: player1,
        player2Name: player2,
        draftSize: +draftSize,
        minSpecials: +minSpecials
    }));
    xhr.onload = function() {

    console.log(this.responseText);
    var data = JSON.parse(this.responseText);
    linkBox.innerText = site + "/draft?id=" + data;
    console.log(data);

    copyBtn.disabled = false;
    openBtn.disabled = false;
    }   
});

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(linkBox.innerText);
});

openBtn.addEventListener("click", () => {
    window.location.href = linkBox.innerText;
});

function OpenSettingsPopup(){
    popup.classList.add("openPopup");
}

function CloseSettingsPopup(){
    popup.classList.remove("openPopup");
}

/*function ChangeLang(){
    let value = LangForm.value;
    console.log(value);
    localStorage['language'] = value; // only strings
}

function setLang(value){
    document.documentElement.setAttribute('lang', value);
}*/