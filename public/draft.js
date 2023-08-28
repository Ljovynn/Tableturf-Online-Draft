const url = window.location.href;
const searchParams = new URL(url).searchParams;
const entries = new URLSearchParams(searchParams).entries();
const entriesArray = Array.from(entries)

const draftId = entriesArray[0][1];

let body = document.querySelector(".body");

let beginningPopup = document.getElementById("beginningPopup");
let readyPopup = document.getElementById("readyPopup");

var tickSfx = new Audio('Audio/timertick.mp3');
var errorSfx = new Audio('Audio/error.mp3');
var drawCardSfx = new Audio('Audio/drawCard.mp3');
var draftFinishedSfx = new Audio('Audio/draftFinished.mp3');

let draftFiguresBox = document.getElementById("draftFigures");
let player1DeckBox = document.getElementById("deck1Figures");
let player2DeckBox = document.getElementById("deck2Figures");

let sortDeck1Button = document.getElementById("player1SortDeck");
let sortDeck2Button = document.getElementById("player2SortDeck");
let player1Title = document.getElementById("player1Title");
let player2Title = document.getElementById("player2Title");

let stageImage = document.getElementById("stageImage");

let exportDeckPopup = document.getElementById("exportDeckPopup");
let exportDeck1Button = document.getElementById("exportDeck1");
let exportDeck2Button = document.getElementById("exportDeck2");
//let copyExportButton = document.getElementById("copyExportText");
let closeExportPopupButton = document.getElementById("closeExportPopup");
let codeId = document.getElementById("code");

let optionsPopup = document.getElementById("optionsPopup")
let optionsButton = document.getElementById("options");
let closeOptionsButton = document.getElementById("closeOptions");
let langForm = document.getElementById("languages");

let muteAudioCheckbox = document.getElementById("muteAudioCheckbox");
let darkModeCheckbox = document.getElementById("darkModeCheckbox");
let sortOrderForm = document.getElementById("setSizeOrder");
let specialCardSortForm = document.getElementById("set312Order");

let player1Button = document.getElementById("player1Button");
let player2Button = document.getElementById("player2Button");
let spectatorButton = document.getElementById("spectatorButton");

let player1ReadyButton = document.getElementById("player1Ready");
let player2ReadyButton = document.getElementById("player2Ready");
let player1ReadyImage = document.getElementById("player1Check");
let player2ReadyImage = document.getElementById("player2Check");

let currentTurnMessage = document.getElementById("currentTurnMessage");
let timerMessage = document.getElementById("timer");

let backToHomepageButton = document.getElementById("backToHomepage");

let player1DeckSizeBox = document.getElementById("player1DeckSize");
let player2DeckSizeBox = document.getElementById("player2DeckSize");

let muteAudio = false;

let langData = GetLang();

/*copyExportButton.addEventListener("click", () => {
    navigator.clipboard.writeText(codeId.innerText);
});*/

backToHomepageButton.addEventListener("click", () => {
    window.location.href = "http://tableturfdraft.se";
});

closeExportPopupButton.addEventListener("click", () => {
    exportDeckPopup.classList.add("hidePopup");
    optionsButton.disabled = false;
});

optionsButton.addEventListener("click", () => {
    optionsPopup.classList.remove("hidePopup");
    optionsButton.disabled = true;
    exportDeck1Button.disabled = true;
    exportDeck2Button.disabled = true;
});

closeOptionsButton.addEventListener("click", () => {
    //updates deck sorting
    localStorage['sort'] = sortOrderForm.value;
    localStorage['312Order'] = specialCardSortForm.value;
    if (player1Deck.sorted == true){
        SortDeck(player1Deck, false);
    }
    if (player2Deck.sorted == true){
        SortDeck(player2Deck, false)
    }

    optionsPopup.classList.add("hidePopup");
    optionsButton.disabled = false;
    //only export decks when draft finished
    if (draftPhase == 2){
        exportDeck1Button.disabled = false;
        exportDeck2Button.disabled = false;
    }
    if (muteAudioCheckbox.checked){
        muteAudio = true;;
        localStorage['mute'] = '1';
    } else{
        muteAudio = false;
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
    ChangeLang()
});

//change language of the page
function ChangeLang(){
    localStorage['language'] = langForm.value;
    storedLang = langForm.value;
    applyStrings();

    //updates currentTurnMessage and size text
    if (draftPhase == 1){
        if (currentPlayer == 1){
            currentTurnMessage.innerHTML = player1Name + langData.languages[storedLang].strings["sTurnToChoose"];
        } else{
            currentTurnMessage.innerHTML = player2Name + langData.languages[storedLang].strings["sTurnToChoose"];
        }
    } else{
        currentTurnMessage.innerHTML = langData.languages[storedLang].strings["draftHasFinished"]
    }
    player1DeckSizeBox.innerHTML = langData.languages[storedLang].strings["size"] + player1Deck.size
    player2DeckSizeBox.innerHTML = langData.languages[storedLang].strings["size"] + player2Deck.size
}

let allCards = [];

const amountOfDifferentCards = 209;
let size;
    
let draftCards  = [];

let player1Deck;
let player2Deck;

let player1Ready;
let player2Ready;

let userRole = 0;

let player1Id;
let player2Id;
let playerId;

let player1Name;
let player2Name;

let currentPlayer = 1;
let picksUntilChangeTurn = 1;
let draftPhase = 0;
let draftTimer = 0; //maximum
let timerInterval = 0; //it ticks down
let playerIsInTime = true;
let timeSinceUpdate;

let draftData;

//check local storage
var storedSort = localStorage['sort'] || '1';
var stored312Order = localStorage['312Order'] || '1';
var mute = localStorage['mute' || '0'];
if (mute == '1'){
    muteAudio = true;
    muteAudioCheckbox.checked = true;
}
var storedDark = localStorage['darkMode'] || '0';
if (+storedDark == '1'){
    body.classList.remove("lightMode");
    body.classList.add("darkMode");
    darkModeCheckbox.checked = true;
}
var storedLang = localStorage['language'] || 'en';
document.documentElement.setAttribute('lang', storedLang);
langForm.value = storedLang;
sortOrderForm.value = storedSort;
specialCardSortForm.value = stored312Order;

player1Button.addEventListener('click',(evt) => PlayerClick(1));
player2Button.addEventListener('click',(evt) => PlayerClick(2));
spectatorButton.addEventListener('click',(evt) => PlayerClick(0));

player1ReadyButton.addEventListener('click',(evt) => ReadyClick());
player2ReadyButton.addEventListener('click',(evt) => ReadyClick());

class Card{
    id;
    size;
    image;
    constructor(id, size, image){
        this.id = id;
        this.size = size;
        this.image = image;
    }
}

class DraftCard{
    documentImg;
    card;
    inDraft = true;
    pickOrder;
    constructor(id){
        //handle unreleased cards with negative id
        let index;
        if (id < 0){
            index = amountOfDifferentCards - id - 1;
        } else{
            index = id - 1;
        }
        let tempCard = allCards[index];
        let size = +tempCard.size;
        let image = tempCard.image;
        this.card = new Card(id, size, image);
    }
}

class PlayerDeck{
    deck;
    sorted;
    size;

    constructor(){
        this.deck = [];
        this.sorted = false;
        this.size = 0;
    }
}

const socket = io();
//join socket room as draft id
socket.emit('join', draftId.toString());

//when other player sends ready
//data = playerId
socket.on('player ready', data =>{
    if (player1Id == data){
        player1Ready = true;
        player1ReadyImage.src = "images/UI/Checkmark.png";
    } else if (player2Id == data){
        player2Ready = true;
        player2ReadyImage.src = "images/UI/Checkmark.png";
    }
    CheckIfBothPlayersReady();
});

//when other player picks a card
//data = currentUserId, cardId
socket.on('add card', data =>{
    //finds card in the draft
    var index = draftCards.findIndex(e => e.card.id === data[1]);
    draftCards[index].inDraft = false;
    draftCards[index].documentImg.setAttribute('class', 'lockedCard');
    timeSinceUpdate = new Date();
    //checks which player it is
    if (+data[0] == player1Id){
        AddCardToPlayer(player1Deck, data[1], player1DeckBox, player1DeckSizeBox);
    } else if (+data[0] == player2Id){
        
        AddCardToPlayer(player2Deck, data[1], player2DeckBox, player2DeckSizeBox);
    }
    ChangeDraftTurnData();
})

Startup();

//at start of page
async function Startup(){
    player1Deck = new PlayerDeck();
    player2Deck = new PlayerDeck();
    allCards = await GetCardsJson();
    FetchDraftInfo(draftId);
}

//fetch all info from draft
function FetchDraftInfo (id) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "GetDraftInfo", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        draftId: id
    }));
    xhr.onload = function() {
        draftData = JSON.parse(this.response);
        //checks if status is ok
        if (xhr.status != 200){
            beginningPopup.classList.add("hidePopup");
            backToHomepageButton.classList.remove("hidePopup");
            alert("Invalid draft ID");
            return;
        }
        ParseDraftData();
    }
}

//get all card data from cards.json
//returns list
async function GetCardsJson(){
    let tempList = [];
    const response = await fetch("cards.json");
    const data = await response.json();
    let cardsJson = data;
    let path;
    //change path of card images depending on language
    switch (storedLang){
        case 'ja':
            path = "images/cards/ja/";
            break;
        default:
            path = "images/cards/en/";
            break;
    }

    //for each card
    for (let i = 0; i < cardsJson.length; i++){
        let card = cardsJson[i];
        const id = card.id;
        const size = card.size;
        const image = path + card.id + ".png";
        tempList[i] = new Card(id, size, image);
    }
    return tempList;
}

//when content is loaded
document.addEventListener('DOMContentLoaded', () => {
    applyStrings();
    body.classList.remove("hidePopup");
});

//apply selected language to all availible strings with data-key element
function applyStrings() {
    //checks all elements with data-key
    body.querySelectorAll(`[data-key]`).forEach(element => {
        let key = element.getAttribute('data-key');
        if (key) {
            //updates text with the key from langdata
            element.textContent = langData.languages[storedLang].strings[key];
        }
    });
}

//handle the recieved draft data
function ParseDraftData(){
    //draft
    const draftManagerData = draftData[0];
    draftPhase = draftManagerData.draft_phase;
    picksUntilChangeTurn = draftManagerData.picks_until_change_turn;
    currentPlayer = draftManagerData.player_turn;
    draftTimer = draftManagerData.timer;
    timeSinceUpdate = CreateDateFromTimestamp(draftManagerData.formatted_update)

    //stage
    switch (draftManagerData.stage){
        case 1:
            stageImage.src = "images/stages/Main Street.png";
            break;
        case 2:
            stageImage.src = "images/stages/Thunder Point.png";
            break;
        case 3:
            stageImage.src = "images/stages/X Marks The Garden.png";
            break;
        case 4:
            stageImage.src = "images/stages/Square Squared.png";
            break;
        case 5:
            stageImage.src = "images/stages/Lakefront Property.png";
            break;
        case 6:
            stageImage.src = "images/stages/Double Gemini.png";
            break;
        case 7:
            stageImage.src = "images/stages/River Drift.png";
            break;
        case 8:
            stageImage.src = "images/stages/Box Seats.png";
            break;
        default:
            stageImage.src = "images/stages/Undefined.png";
            break;
    }
    
    //draft cards
    const draftCardList = draftData[1];
    for (let i = 0; i < draftCardList.length; i++){
        draftCards[i] = new DraftCard(draftCardList[i].card_id);
    }

    draftCards = SortBySize(draftCards, 1, 3);

    //players
    const playerData = draftData[2];
    let player1Data = playerData[0];
    let player2Data = playerData[1];
    player1Name = player1Data.player_name;
    player2Name = player2Data.player_name;
    player1Button.innerText = player1Name;
    player2Button.innerText = player2Name;
    player1Title.innerText = player1Name;
    player2Title.innerText = player2Name;
    player1ReadyButton.innerText = player1Name + langData.languages[storedLang].strings["ready"];
    player2ReadyButton.innerText = player2Name + langData.languages[storedLang].strings["ready"];
    player1Ready = player1Data.ready;
    player2Ready = player2Data.ready;
    player1Id = player1Data.id;
    player2Id = player2Data.id;

    //decks
    const deckData = draftData[3];
    for (let i = 0; i < deckData[0].length; i++){
        AddCardToPlayer(player1Deck, deckData[0][i].card_id, player1DeckBox, player1DeckSizeBox);
        var index = draftCards.findIndex(e => e.card.id === deckData[0][i].card_id);
        draftCards[index].inDraft = false;
    }
    for (let i = 0; i < deckData[1].length; i++){
        AddCardToPlayer(player2Deck, deckData[1][i].card_id, player2DeckBox, player2DeckSizeBox);
        var index = draftCards.findIndex(e => e.card.id === deckData[1][i].card_id);
        draftCards[index].inDraft = false;
    }

    DisplayDraftCards();

    //handle different draft phases
    if (draftPhase == 1){
        if (currentPlayer == 1){
            currentTurnMessage.innerHTML = player1Name + langData.languages[storedLang].strings["sTurnToChoose"];
            player1Title.style.color = '#2a7321';
        } else{
            currentTurnMessage.innerHTML = player2Name + langData.languages[storedLang].strings["sTurnToChoose"];
            player2Title.style.color = '#2a7321';
        }
        if (draftTimer != 0){
            SetTimer();
            timerInterval = setInterval(SetTimer, 1000);
        }
    }
    else if (draftPhase == 2){
        MakeDraftVisible();
        exportDeck1Button.disabled = false;
        exportDeck2Button.disabled = false;
        currentTurnMessage.innerHTML = langData.languages[storedLang].strings["draftHasFinished"];
        backToHomepageButton.classList.remove("hidePopup");
    }
}

//create js Date from sql timestamp
function CreateDateFromTimestamp(timestamp){
    var t = timestamp.split(/[- :.]/);
    let result = new Date(t[0], t[1] -1, t[2], t[3], t[4], t[5], t[6]);
    return result;
}

//update timer
function SetTimer(){
    var now = new Date();

    //ms until post varies depending on userRole
    let timeUntilPost = -5000;
    if (currentPlayer == userRole){
        timeUntilPost = -2000;
    }
    if (userRole == 0){
        timeUntilPost = -8000;
    }

    //get time between now and when draft timer depleted
    var result = (timeSinceUpdate.getTime() + (draftTimer * 1000)) - now.getTime();
    //if under 5 seconds left
    if (result < 5000){
        if (result <= timeUntilPost){
            TimerBelowLimit();
        } else if (result >= 0){
            PlayAudio(tickSfx);
            timerMessage.style.color = '#F90100';
        } else{
            //player cant pick cards below timer 0
            playerIsInTime = false;
        }
    }

    //update timer text
    var secondsTimer = Math.floor((result % (1000 * 60)) / 1000)
    let message = Math.max(secondsTimer, 0).toString();
    timerMessage.innerHTML = message;
}

//when timer is below limit, post to server
function TimerBelowLimit(){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "TimerBelowLimit", true);
    xhr.setRequestHeader('Content-Type', 'application/json');;
    xhr.send(JSON.stringify({
        draftId: +draftId
    }));
    xhr.onload = function() {
        //check if status is ok
        if (xhr.status != 200){
            console.log("status not 200, " + xhr.status);
            return;
        }
        //response is cardId
        const cardData = JSON.parse(this.response);
        let cardToPick = +cardData;

        //finds card in draft
        var index = draftCards.findIndex(e => e.card.id === cardToPick);

        //checks which player should get card
        let currentUserId;
        if (currentPlayer == 1){
            currentUserId = player1Id;
        } else{
            currentUserId = player2Id;
        }

        PickCard(draftCards[index]);

        //send socket message
        let message = [currentUserId, draftCards[index].card.id, draftId];
        socket.emit('add card', message);
    }
}

function CreateSortedSpecialAttackList(){
    let array = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 188, 189]
    return array;
}

//sort array of cards by size
//returns sorted array
function SortBySize(array, reverseValue, specialAttackValue){
    //if special cards have no uniqe sorting
    if (specialAttackValue == 3){
        if (reverseValue == 2){
            array.sort((a, b) => a.card.size - b.card.size || a.card.id - b.card.id);
        } else{
            array.sort((a, b) => b.card.size - a.card.size || a.card.id - b.card.id);
        }
        return array;
    } else{
        let tempFullList = []
        let tempNormalCardList = [];
        let temp312List = []
        let all312List = CreateSortedSpecialAttackList();

        //splits array into special cards and normal cards
        for (let i = 0; i < array.length; i++){
            var index = all312List.indexOf(array[i].card.id);
            if (index !== -1) {
                temp312List.push(array[i]);
            } else{
                tempNormalCardList.push(array[i]);
            }
        }

        //sort the seperated cards
        if (reverseValue == 2){
            tempNormalCardList.sort((a, b) => a.card.size - b.card.size || a.card.id - b.card.id);
        } else{
            tempNormalCardList.sort((a, b) => b.card.size - a.card.size || b.card.id - a.card.id);
        }
        temp312List.sort((a, b) => a.card.id - b.card.id);

        //checks which order the arrays should be put in, and adds them to one array again
        if (specialAttackValue == 1){
            for (let i = 0; i < temp312List.length; i++){
                tempFullList.push(temp312List[i]);
            }
            for (let i = 0; i < tempNormalCardList.length; i++){
                tempFullList.push(tempNormalCardList[i]);
            }
        } else{
            for (let i = 0; i < tempNormalCardList.length; i++){
                tempFullList.push(tempNormalCardList[i]);
            }
            for (let i = 0; i < temp312List.length; i++){
                tempFullList.push(temp312List[i]);
            }
        }
        return tempFullList;
    }
}

//returns array of cards sorted by pickorder
function SortByPickOrder(array){
    array.sort((a, b) => a.pickOrder - b.pickOrder);

    return array;
}

//display the draft cards in the document
function DisplayDraftCards(){
    //for each card
    for (let i = 0; i < draftCards.length; i++){
        //create the img element and add it to the draftCard
        var img = document.createElement('img');
        document.getElementById('draftFigures').appendChild(img);
        img.src = draftCards[i].card.image;
        draftCards[i].documentImg = img;

        img.addEventListener('click',(evt) => DraftClick(i));

        if (draftCards[i].inDraft == false){
            draftCards[i].documentImg.setAttribute('class', 'lockedCard');
        }
    }
}

//display a deck
function DisplayDeck(playerDeck, deckFigures){
    //for each card
    for (let i = 0; i < playerDeck.deck.length; i++){
        //create the img element with source from card's image
        var img = document.createElement('img');
        deckFigures.appendChild(img);
        img.src = playerDeck.deck[i].card.image;
    }
}

//makes all draft information visible
function MakeDraftVisible(){
    draftFiguresBox.classList.remove("hidePopup");
    player1DeckBox.classList.remove("hidePopup");
    player2DeckBox.classList.remove("hidePopup");
    beginningPopup.classList.add("hidePopup");
    readyPopup.classList.add("hidePopup");
    sortDeck1Button.disabled = false;
    sortDeck2Button.disabled = false;
    optionsButton.disabled = false;

    //adds click functionality to sort and export buttons
    sortDeck1Button.onclick = (evt) => SortDeck(player1Deck, true);
    sortDeck2Button.onclick = (evt) => SortDeck(player2Deck, true);
    exportDeck1Button.onclick = (evt) => ExportDeck(player1Deck);
    exportDeck2Button.onclick = (evt) => ExportDeck(player2Deck);
}

//opens the ready popup
function OpenReadyPopup(){
    beginningPopup.classList.add("hidePopup");
    readyPopup.classList.remove("hidePopup");

    //checks if players are ready
    if (player1Ready){
        player1ReadyButton.disabled = true;
        player1ReadyImage.src = "images/UI/Checkmark.png";
    }
    if (player2Ready){
        player2ReadyButton.disabled = true;
        player2ReadyImage.src = "images/UI/Checkmark.png";
    }
}

//picks a card for current player
function PickCard(draftCard){
    draftCard.inDraft = false;
    draftCard.documentImg.setAttribute('class', 'lockedCard');
    timeSinceUpdate = new Date();

    //checks which player
    if (currentPlayer == 1){
        AddCardToPlayer(player1Deck, draftCard.card.id, player1DeckBox, player1DeckSizeBox);
        
    } else{
        AddCardToPlayer(player2Deck, draftCard.card.id, player2DeckBox, player2DeckSizeBox);
    }
    ChangeDraftTurnData();
}

//changes draft turn data. Does not need a post or socket message
function ChangeDraftTurnData(){
    picksUntilChangeTurn--;

    //if player turn should change
    if (picksUntilChangeTurn == 0){
        if (currentPlayer == 1){
            currentPlayer = 2;
            currentTurnMessage.innerHTML = player2Name + langData.languages[storedLang].strings["sTurnToChoose"];
            player2Title.style.color = '#2a7321';
            player1Title.style.color = GetDefaultColour();
        } else{
            currentPlayer = 1;
            currentTurnMessage.innerHTML = player1Name + langData.languages[storedLang].strings["sTurnToChoose"];
            player1Title.style.color = '#2a7321';
            player2Title.style.color = GetDefaultColour();
        }
        picksUntilChangeTurn = 2;

        //if client is the current player
        if (userRole == currentPlayer){
            currentTurnMessage.style.color = '#2a7321';
        } else if (userRole != 0){
            currentTurnMessage.style.color = '#4d2d3b';
        }
    }
}

//add card to a player's deck
function AddCardToPlayer(playerDeck, id, deckDocument, deckSizeBox){
    PlayAudio(drawCardSfx);
    playerIsInTime = true;


    let newDraftCard = new DraftCard(id);

    //update size
    playerDeck.size += newDraftCard.card.size;
    deckSizeBox.innerHTML = langData.languages[storedLang].strings["size"] + playerDeck.size;

    //create img element
    var img = document.createElement('img');
    deckDocument.appendChild(img);
    img.src = newDraftCard.card.image;

    //set draftCard info
    newDraftCard.documentImg = img;
    newDraftCard.inDraft = false;
    newDraftCard.pickOrder = playerDeck.deck.length + 1;

    playerDeck.deck.push(newDraftCard);

    //sort deck if needed
    if(playerDeck.sorted){
        SortDeck(playerDeck, false)
    }

    //check if draft should end
    if (player2Deck.deck.length == 15){
        EndDraft();
        return;
    }
    
    //check if timer should be updated
    if (draftPhase == 1 && draftTimer != 0){
        timerMessage.style.color = GetDefaultColour();
        SetTimer();
    }
}

//sorts a player's deck
function SortDeck(playerDeck, changeSortedStatus){
    let deckFigures;
    let sortButton;

    //check player
    if (playerDeck == player1Deck){
        deckFigures = player1DeckBox;
        sortButton = sortDeck1Button;
    } else{
        deckFigures = player2DeckBox;
        sortButton = sortDeck2Button;
    }

    //remove display of deck cards
    while (deckFigures.firstChild) {
        deckFigures.removeChild(deckFigures.lastChild);
    }

    //if sorting type should change
    if (changeSortedStatus){
        playerDeck.sorted= !playerDeck.sorted;
    }

    //sort deck's cards
    if (playerDeck.sorted){
        playerDeck.deck = SortBySize(playerDeck.deck, +sortOrderForm.value, +specialCardSortForm.value);
        sortButton.textContent = langData.languages[storedLang].strings["sortByPickOrder"];
    }else{
        playerDeck.deck = SortByPickOrder(playerDeck.deck);
        sortButton.textContent = langData.languages[storedLang].strings["sortBySize"];
        
    }

    DisplayDeck(playerDeck, deckFigures);
}

//open export popup and set codeId text to the deck's code for exporting to simulator
function ExportDeck(playerDeck){
    exportDeckPopup.classList.remove("hidePopup");
    optionsButton.disabled = true;

    //sort the deck
    playerDeck.deck = SortBySize(playerDeck.deck, +sortOrderForm.value, +specialCardSortForm.value);

    //export deck
    let name = "Draft"
    let cards = [];
    for (let i = 0; i < playerDeck.deck.length; i++){
        cards[i] = playerDeck.deck[i].card.id;
    }
    jsonString = JSON.stringify({name, cards});
    codeId.innerText = jsonString;
}

//check if both players are ready for draft start
function CheckIfBothPlayersReady(){
    if (draftPhase == 0 && player1Ready && player2Ready){
        StartDraftPhase();
    }
}

//start the draft
function StartDraftPhase(){
    timeSinceUpdate = new Date();
    PlayAudio(tickSfx);
    if (draftPhase != 0){
    } else{
        draftPhase = 1;
        MakeDraftVisible();
        currentTurnMessage.innerHTML = player1Name + langData.languages[storedLang].strings["sTurnToChoose"];
        player1Title.style.color = '#2a7321';
        CheckTextColour();
        //set update timer on interval 1 second
        if (draftTimer != 0){
            SetTimer();
            timerInterval = setInterval(SetTimer, 1000);
        }
    }
}

//finish draft
function EndDraft(){
    PlayAudio(draftFinishedSfx);
    clearInterval(timerInterval);
    draftPhase = 2;
    backToHomepageButton.classList.remove("hidePopup");
    currentTurnMessage.innerHTML = langData.languages[storedLang].strings["draftHasFinished"];
    currentTurnMessage.style.color = GetDefaultColour();
    player1Title.style.color = GetDefaultColour();
    player2Title.style.color = GetDefaultColour();
    timerMessage.innerText = "\n";
    exportDeck1Button.disabled = false;
    exportDeck2Button.disabled = false;
}

//click on card in draft
function DraftClick(i){
    //check if card eligible to be picked by user
    if (draftCards[i].inDraft && draftPhase == 1 && currentPlayer == userRole && playerIsInTime){
        PickCard(draftCards[i]);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "CreateDeckCard", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            playerId: playerId,
            cardId: draftCards[i].card.id,
            draftId: draftId
        }));
        xhr.onload = function() {
            //check if status ok
            if (xhr.status != 201){
                alert("Something went wrong. Please refresh the page.")
                return;
            }

            //send socket message
            let message = [playerId, draftCards[i].card.id, draftId];
            socket.emit('add card', message);
        }
    }
}

//change text colour of current turn message
function CheckTextColour(){
    if (userRole == currentPlayer){
        currentTurnMessage.style.color = '#2a7321';
    } else if (userRole != 0){
        currentTurnMessage.style.color = '#4d2d3b';
    }
}

//play audio file
function PlayAudio(audio){
    if (!muteAudio){
        audio.play();
    }
}

//get default colour of current mode
function GetDefaultColour(){
    if (darkModeCheckbox.checked){
        return '#ffffff';
    } else{
        return '#000000';
    }
}

//when user selects which player they are
function PlayerClick(i){
    userRole = i;
    if (userRole == 1){
        playerId = player1Id;
        player1ReadyButton.disabled = false;
    } else if (userRole == 2){
        playerId = player2Id;
        player2ReadyButton.disabled = false;
    }

    //check draft phase
    if (draftPhase != 0){
        MakeDraftVisible();
        CheckTextColour();
    } else{
        OpenReadyPopup();
    }
}

//when user clicks ready for draft start
function ReadyClick(){
    //check user
    if (userRole == 1){
        player1ReadyButton.disabled = true;
        player1Ready = true;
        player1ReadyImage.src = "images/UI/Checkmark.png";

    } else{
        player2ReadyButton.disabled = true;
        player2Ready = true;
        player2ReadyImage.src = "images/UI/Checkmark.png";
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "PlayerReady", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        playerId: playerId,
        draftId: draftId
    }));
    xhr.onload = function() {
        //check if status ok
        if (xhr.status != 201){
            alert("Something went wrong. Please refresh the page.");
            return;
        }

        //send socket message
        let message = [playerId, draftId];
        socket.emit('player ready', message);

        CheckIfBothPlayersReady();
    }
}

//get all language data
function GetLang(){
    let result = {
        "languages": {
            "en": {
                "strings": {
                    "whoAreYou": "Who are you?",
                    "spectator": "Spectator",
                    "ready": " Ready",
                    "waitingForPlayers": "Waiting for players to get ready",
                    "draftHasFinished": "Draft has finished",
                    "sTurnToChoose": "'s turn to choose",
                    "sortBySize": "Sort by size",
                    "sortByPickOrder": "Sort by pick order",
                    "exportDeck": "Export deck",
                    "exportDeckText": "Export deck to Andrio Celos' Tableturf Simulator",
                    "size": "Size: ",
                    "copy": "Copy",
                    "options": "Options",
                    "muteAudio": "Mute audio",
                    "deckSortingOrder": "Deck sorting order:",
                    "largeToSmall": "Large to small",
                    "smallToLarge": "Small to large",
                    "312Sorting": "Special attack card sorting:",
                    "start": "Start",
                    "end": "End",
                    "inSort": "In sort",
                    "language": "Language:",
                    "darkMode": "Dark mode",
                    "close": "Close",
                    "back": "Back"
                }
            },
            "sv": {
                "strings": {
                    "whoAreYou": "Vem är du?",
                    "spectator": "Åskådare",
                    "ready": " Redo",
                    "waitingForPlayers": "Väntar på spelare att bli redo",
                    "draftHasFinished": "Draften har avslutats",
                    "sTurnToChoose": "s tur att välja",
                    "sortBySize": "Sortera efter storlek",
                    "sortByPickOrder": "Sortera efter väljordning",
                    "exportDeck": "Exportera kortlek",
                    "exportDeckText": "Exportera kortlek till Andrio Celos Tableturfsimulator",
                    "size": "Storlek: ",
                    "copy": "Kopiera",
                    "options": "Inställningar",
                    "muteAudio": "Stäng av ljud",
                    "deckSortingOrder": "Sorteringsordning:",
                    "largeToSmall": "Stor till liten",
                    "smallToLarge": "Liten till stor",
                    "312Sorting": "Specialkortsortering:",
                    "start": "Början",
                    "end": "Slutet",
                    "inSort": "Inom sorteringen",
                    "language": "Språk:",
                    "darkMode": "Mörkt läge",
                    "close": "Stäng",
                    "back": "Tillbaka"
                }
            },
            "ja": {
                "strings": {
                    "whoAreYou": "プレイヤーを選択してください",
                    "spectator": "観戦",
                    "ready": " Ready",
                    "waitingForPlayers": "対戦相手を待っています...",
                    "draftHasFinished": "ドラフト終了！",
                    "sTurnToChoose": "が選択中",
                    "sortBySize": "マス数順",
                    "sortByPickOrder": "選択順",
                    "exportDeck": "シミュレーターで実行",
                    "exportDeckText": "シミュレーターで実行（下のコードをコピー",
                    "size": "合計マス数: ",
                    "copy": "コピー",
                    "options": "オプション",
                    "muteAudio": "効果音オフ",
                    "deckSortingOrder": "並べ方:",
                    "largeToSmall": "降順",
                    "smallToLarge": "昇順",
                    "312Sorting": "スペシャルカードの位置:",
                    "start": "上",
                    "end": "下",
                    "inSort": "変更なし",
                    "language": "言語:",
                    "darkMode": "ダークモード",
                    "close": "閉じる",
                    "back": "バック"
                }
            }
        }
    }
    return result;
}