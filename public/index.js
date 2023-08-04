//document.getElementById("settings").onclick = OpenSettingsPopup;
//document.getElementById("closeSettings").onclick = CloseSettingsPopup;

const site = "http://85.228.196.253:8080"

let linkBox = document.getElementById("link");
let copyBtn = document.getElementById("copyDraft");
let openBtn = document.getElementById("openDraft");

//let LangForm = document.getElementById("languages");

let player1NameDoc = document.getElementById("player1");
let player2NameDoc = document.getElementById("player2");
let draftSizeDoc = document.getElementById("draftSize");
let minSpecialsDoc = document.getElementById("312Size");
let timerDoc = document.getElementById("timerList");
let generateDraftBtn = document.getElementById("generateDraft");

let optionsPopup = document.getElementById("optionsPopup")
let optionsButton = document.getElementById("options");
let closeOptionsButton = document.getElementById("closeOptions");

let muteAudioCheckbox = document.getElementById("muteAudioCheckbox");
let sortOrderForm = document.getElementById("setSizeOrder");
let specialCardSortForm = document.getElementById("set312Order");

var storedSort = localStorage['sort'] || '1';
var stored312Order = localStorage['312Order'] || '1';
var mute = localStorage['mute' || '0'];
if (mute == '1'){
    muteAudioCheckbox.checked = true;
}
sortOrderForm.value = storedSort;
specialCardSortForm.value = stored312Order;

optionsButton.addEventListener("click", () => {
    optionsPopup.classList.add("openPopup");
    optionsButton.disabled = true;
});

closeOptionsButton.addEventListener("click", () => {
    optionsButton.disabled = false;
    optionsPopup.classList.remove("openPopup");
    if (muteAudioCheckbox.checked){
        localStorage['mute'] = '1';
    } else{
        localStorage['mute'] = '0';
    }
    localStorage['sort'] = sortOrderForm.value;
    localStorage['312Order'] = specialCardSortForm.value;
});

/*var storedLang = localStorage['language'] || 'en';
document.documentElement.setAttribute('lang', storedLang);
console.log(storedLang);*/

generateDraftBtn.addEventListener("click", () => {
    generateDraftBtn.disabled = true;
    let player1 = player1NameDoc.value;
    let player2 = player2NameDoc.value;
    let draftSize = draftSizeDoc.value;
    let minSpecials = minSpecialsDoc.value;
    let timer = timerDoc.value;

    //console.log(player1NameDoc);
    //console.log("innarhtml: namn: "  + player1);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "GenerateNewDraft", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        player1Name: player1,
        player2Name: player2,
        draftSize: +draftSize,
        minSpecials: +minSpecials,
        timer: +timer
    }));
    xhr.onload = function() {

    //console.log(this.responseText);
    var data = JSON.parse(this.responseText);
    linkBox.innerText = site + "/draft?id=" + data;
    //console.log(data);

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

/*function OpenSettingsPopup(){
    popup.classList.add("openPopup");
}

function CloseSettingsPopup(){
    popup.classList.remove("openPopup");
}*/

/*function ChangeLang(){
    let value = LangForm.value;
    console.log(value);
    localStorage['language'] = value; // only strings
}

function setLang(value){
    document.documentElement.setAttribute('lang', value);
}*/