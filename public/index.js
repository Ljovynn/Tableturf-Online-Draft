//document.getElementById("settings").onclick = OpenSettingsPopup;
//document.getElementById("closeSettings").onclick = CloseSettingsPopup;

const site = "http://tableturfdraft.se"

let includeUnreleasedCardsCheckbox = document.getElementById("includeUnreleasedCardsCheckbox");

let linkBox = document.getElementById("link");
//let copyBtn = document.getElementById("copyDraft");
let openBtn = document.getElementById("openDraft");

let langForm = document.getElementById("languages");

let player1NameDoc = document.getElementById("player1");
let player2NameDoc = document.getElementById("player2");
let draftSizeDoc = document.getElementById("draftSize");
let minSpecialsDoc = document.getElementById("312Size");
let timerDoc = document.getElementById("timerList");
let stageDoc = document.getElementById("stages");
let generateDraftBtn = document.getElementById("generateDraft");

let optionsPopup = document.getElementById("optionsPopup")
let optionsButton = document.getElementById("options");
let closeOptionsButton = document.getElementById("closeOptions");

let muteAudioCheckbox = document.getElementById("muteAudioCheckbox");
let darkModeCheckbox = document.getElementById("darkModeCheckbox");
let sortOrderForm = document.getElementById("setSizeOrder");
let specialCardSortForm = document.getElementById("set312Order");

let mainDiv = document.querySelector(".main");
let body = document.querySelector(".body");

let langData;

//get localstorage data
var storedSort = localStorage['sort'] || '1';
var stored312Order = localStorage['312Order'] || '1';
var storedLang = localStorage['language'] || 'en';
var storedDark = localStorage['darkMode'] || '0';
document.documentElement.setAttribute('lang', storedLang);
langForm.value = storedLang;
var mute = localStorage['mute' || '0'];
if (mute == '1'){
    muteAudioCheckbox.checked = true;
}
if (+storedDark == '1'){
    body.classList.remove("lightMode");
    body.classList.add("darkMode");
    darkModeCheckbox.checked = true;
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
    
    //set localstorage
    if (muteAudioCheckbox.checked){
        localStorage['mute'] = '1';
    } else{
        localStorage['mute'] = '0';
    }
    if (darkModeCheckbox.checked){
        localStorage['darkMode'] = '1';
        body.classList.remove("lightMode");
        body.classList.add("darkMode");
    } else{
        localStorage['darkMode'] = '0';
        body.classList.add("lightMode");
        body.classList.remove("darkMode");
    }

    localStorage['sort'] = sortOrderForm.value;
    localStorage['312Order'] = specialCardSortForm.value;
});

Startup();

async function Startup(){
    langData = await GetLangJson();    
    applyStrings();
    mainDiv.classList.add("openPopup"); 
}

//get language data
async function GetLangJson(){
    const response = await fetch("langdata.json");
    const data = await response.json();

    let langList = data[0].languages;

    return langList;
}

//change language
function ChangeLang(){
    //remove options popup
    optionsButton.disabled = false;
    optionsPopup.classList.remove("openPopup");

    localStorage['language'] = langForm.value;
    storedLang = langForm.value;
    applyStrings();
}

//apply selected language to all availible strings with data-key element
function applyStrings() {
    //checks all elements with data-key
    mainDiv.querySelectorAll(`[data-key]`).forEach(element => {
        let key = element.getAttribute('data-key');
        //updates text with the key from langdata
        if (key) {
            element.textContent = langData[storedLang][key];
        }
    });
}

generateDraftBtn.addEventListener("click", () => {
    generateDraftBtn.disabled = true;

    //set data for the post
    let player1 = player1NameDoc.value;
    let player2 = player2NameDoc.value;
    let draftSize = draftSizeDoc.value;
    let minSpecials = minSpecialsDoc.value;
    let timer = timerDoc.value;
    let stage = stageDoc.value;
    let includeUnreleasedCards = false;
    includeUnreleasedCards = includeUnreleasedCardsCheckbox.checked;
    
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "GenerateNewDraft", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        player1Name: player1,
        player2Name: player2,
        draftSize: +draftSize,
        minSpecials: +minSpecials,
        timer: +timer,
        stage: +stage,
        includeUnreleasedCards: includeUnreleasedCards
    }));
    xhr.onload = function() {
        //check if status ok
        if (xhr.status != 201){
            linkBox.innerText = langData[storedLang]["somethingWentWrong"];
            return;
        }
        //response = draft id
        var data = JSON.parse(this.responseText);
        linkBox.innerText = site + "/draft?id=" + data;

        //get SLL first
        //copyBtn.disabled = false;
        openBtn.disabled = false;
    }
});

/*copyBtn.addEventListener("click", () => {
    console.log(linkBox.innerText);
    navigator.clipboard.writeText(linkBox.innerText);
});*/

openBtn.addEventListener("click", () => {
    window.location.href = linkBox.innerText;
});