const url = window.location.href;
const searchParams = new URL(url).searchParams;
const entries = new URLSearchParams(searchParams).entries();
const entriesArray = Array.from(entries)

const draftId = entriesArray[0][1];

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

let exportDeckPopup = document.getElementById("exportDeckPopup");
let exportDeck1Button = document.getElementById("exportDeck1");
let exportDeck2Button = document.getElementById("exportDeck2");
let copyExportButton = document.getElementById("copyExportText");
let closeExportPopupButton = document.getElementById("closeExportPopup");
let codeId = document.getElementById("code");

let optionsPopup = document.getElementById("optionsPopup")
let optionsButton = document.getElementById("options");
let closeOptionsButton = document.getElementById("closeOptions");

let muteAudioCheckbox = document.getElementById("muteAudioCheckbox");
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

let player1DeckSizeBox = document.getElementById("player1DeckSize");
let player2DeckSizeBox = document.getElementById("player2DeckSize");

let muteAudio = false;

copyExportButton.addEventListener("click", () => {
    navigator.clipboard.writeText(codeId.innerText);
});

closeExportPopupButton.addEventListener("click", () => {
    exportDeckPopup.classList.add("hidePopup");
    optionsButton.disabled = false;
});

optionsButton.addEventListener("click", () => {
    optionsPopup.classList.remove("hidePopup");
    exportDeck1Button.disabled = true;
    exportDeck2Button.disabled = true;
});

closeOptionsButton.addEventListener("click", () => {
    UpdateSort();
    optionsPopup.classList.add("hidePopup");
    exportDeck1Button.disabled = false;
    exportDeck2Button.disabled = false;
    if (muteAudioCheckbox.checked){
        muteAudio = true;;
        localStorage['mute'] = '1';
    } else{
        muteAudio = false;
        localStorage['mute'] = '0';
    }
});

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
//player2DeckSizeText = document.getElementById("player2DeckSize");

let currentPlayer = 1;
let picksUntilChangeTurn = 1;
let draftPhase = 0;
let draftTimer = 0; //maximum
let timerInterval = 0; //det som tickar ner
let playerIsInTime = true;
let timeSinceUpdate;

let draftData;

var storedSort = localStorage['sort'] || '1';
var stored312Order = localStorage['312Order'] || '1';
var mute = localStorage['mute' || '0'];
if (mute == '1'){
    muteAudio = true;
    muteAudioCheckbox.checked = true;
}
sortOrderForm.value = storedSort;
specialCardSortForm.value = stored312Order;

player1Button.addEventListener('click',(evt) => PlayerClick(1));
player2Button.addEventListener('click',(evt) => PlayerClick(2));
spectatorButton.addEventListener('click',(evt) => PlayerClick(0));

player1ReadyButton.addEventListener('click',(evt) => ReadyClick(1));
player2ReadyButton.addEventListener('click',(evt) => ReadyClick(2));

class Card{
    id;
    title;
    size;
    image;
    constructor(id, title, size, image){
        this.id = id;
        this.title = title;
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
        let tempCard = allCards[id - 1];
        let title = tempCard.title;
        let size = +tempCard.size;
        let image = tempCard.image;
        this.card = new Card(id, title, size, image);
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
//const socket = io.connect();
socket.emit('join', draftId.toString());

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

/*socket.on('start draft', data =>{
    if (+data == draftId){
        StartDraftPhase();
    }
})*/

socket.on('add card', data =>{
    var index = draftCards.findIndex(e => e.card.id === data[1]);
    draftCards[index].inDraft = false;
    draftCards[index].documentImg.setAttribute('class', 'lockedCard');
    if (+data[0] == player1Id){
        AddCardToPlayer(player1Deck, data[1], "deck1Figures", player1DeckSizeBox);
    } else if (+data[0] == player2Id){
        
        AddCardToPlayer(player2Deck, data[1], "deck2Figures", player2DeckSizeBox);
    }
    ChangeDraftTurnData();
})

Startup();

async function Startup(){
    player1Deck = new PlayerDeck();
    player2Deck = new PlayerDeck();
    allCards = await GetCardsJson();
    FetchDraftInfo(draftId);
}

function FetchDraftInfo (id) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "GetDraftInfo", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        draftId: id
    }));
    xhr.onload = function() {
        draftData = JSON.parse(this.response);
        ParseDraftData();
    }
}

async function GetCardsJson(){
    let tempList = [];
    const response = await fetch("cards.json");
    const data = await response.json();
    let cardsJson = data;
    for (let i = 0; i < cardsJson.length; i++){
        let card = cardsJson[i];
        const id = card.id;
        const title = card.attributes.title;
        const size = card.attributes.size;
        const image = card.attributes.image.url;
        tempList[i] = new Card(id, title, size, image);
    }
    return tempList;
}

function ParseDraftData(){
    //draft
    const draftManagerData = draftData[0];
    draftPhase = draftManagerData.draft_phase;
    picksUntilChangeTurn = draftManagerData.picks_until_change_turn;
    currentPlayer = draftManagerData.player_turn;
    draftTimer = draftManagerData.timer;
    timeSinceUpdate = CreateDateFromTimestamp(draftManagerData.formatted_update)
    
    //draftkort
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
    document.getElementById("player1Title").innerText = player1Name;
    document.getElementById("player2Title").innerText = player2Name;
    player1ReadyButton.innerText = player1Name + " Ready";
    player2ReadyButton.innerText = player2Name + " Ready";
    player1Ready = player1Data.ready;
    player2Ready = player2Data.ready;
    player1Id = player1Data.id;
    player2Id = player2Data.id;

    //decks
    const deckData = draftData[3];
    for (let i = 0; i < deckData[0].length; i++){
        AddCardToPlayer(player1Deck, deckData[0][i].card_id, "deck1Figures", player1DeckSizeBox);
        var index = draftCards.findIndex(e => e.card.id === deckData[0][i].card_id);
        draftCards[index].inDraft = false;
    }
    for (let i = 0; i < deckData[1].length; i++){
        AddCardToPlayer(player2Deck, deckData[1][i].card_id, "deck2Figures", player2DeckSizeBox);
        var index = draftCards.findIndex(e => e.card.id === deckData[1][i].card_id);
        draftCards[index].inDraft = false;
    }

    DisplayDraftCards();

    if (draftPhase == 1){
        if (currentPlayer == 1){
            currentTurnMessage.innerHTML = player1Name + "'s turn to choose";
        } else{
            currentTurnMessage.innerHTML = player2Name + "'s turn to choose";
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
        currentTurnMessage.innerHTML = "Draft has finished";
    }
}

function CreateDateFromTimestamp(timestamp){
    console.log("timestamp: " + timestamp);
    var t = timestamp.split(/[- :.]/);
    let result = new Date(t[0], t[1] -1, t[2], t[3], t[4], t[5], t[6]);
    console.log ("resulting date: " + result);
    console.log("result MS: " + result.getTime().toString());
    return result;
}

function SetTimer(){
    var now = new Date();
    let timeUntilPost = -5000;
    if (currentPlayer == userRole){
        timeUntilPost = -2000;
    }
    if (userRole == 0){
        timeUntilPost = -8000;
    }

    console.log("time since last update: " + timeSinceUpdate)
    var result = (timeSinceUpdate.getTime() + (draftTimer * 1000)) - now.getTime();
    //result = result / 1000;
    if (result < 5000){
        if (result <= timeUntilPost){
            TimerBelowLimit();
        } else if (result >= 0){
            PlayAudio(tickSfx);
            timerMessage.style.color = '#F90100';
        } else{
            playerIsInTime = false;
        }
    }
    var secondsTimer = Math.floor((result % (1000 * 60)) / 1000)
    let message = Math.max(secondsTimer, 0).toString();
    timerMessage.innerHTML = message;
    //timerMessage.innerHTML = result / 1000;
    return result;
}

function TimerBelowLimit(){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "TimerBelowLimit", true);
    xhr.setRequestHeader('Content-Type', 'application/json');;
    xhr.send(JSON.stringify({
        draftId: +draftId
    }));
    xhr.onload = function() {
        if (xhr.status != 200){
            console.log("status not 200, " + xhr.status);
            return;
        }
        const cardData = JSON.parse(this.response);
        let cardToPick = +cardData;
        var index = draftCards.findIndex(e => e.card.id === cardToPick);
        PickCard(draftCards[index]);
        let currentUserId;
        if (currentPlayer == 1){
            currentUserId = player1Id;
        } else{
            currentUserId = player2Id;
        }
        let message = [currentUserId, draftCards[index].card.id, draftId];
        socket.emit('add card', message);
    }
}

function CreateSortedSpecialAttackList(){
    let array = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 188, 189]
    return array;
}

function SortBySize(array, reverseValue, specialAttackValue){
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
        for (let i = 0; i < array.length; i++){
            var index = all312List.indexOf(array[i].card.id);
            if (index !== -1) {
                temp312List.push(array[i]);
            } else{
                tempNormalCardList.push(array[i]);
            }
        }

        if (reverseValue == 2){
            tempNormalCardList.sort((a, b) => a.card.size - b.card.size || a.card.id - b.card.id);
        } else{
            tempNormalCardList.sort((a, b) => b.card.size - a.card.size || b.card.id - a.card.id);
        }

        temp312List.sort((a, b) => a.card.id - b.card.id);

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

function SortByPickOrder(array){
    array.sort((a, b) => a.pickOrder - b.pickOrder);

    return array;
}

function DisplayDraftCards(){
    for (let i = 0; i < draftCards.length; i++){
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

function DisplayDeck(playerDeck, deckFigures){
    for (let i = 0; i < playerDeck.deck.length; i++){
        var img = document.createElement('img');
        deckFigures.appendChild(img);
        img.src = playerDeck.deck[i].card.image;
    }
}

function MakeDraftVisible(){
    draftFiguresBox.classList.remove("hidePopup");
    player1DeckBox.classList.remove("hidePopup");
    player2DeckBox.classList.remove("hidePopup");
    beginningPopup.classList.add("hidePopup");
    readyPopup.classList.add("hidePopup");
    sortDeck1Button.disabled = false;
    sortDeck2Button.disabled = false;
    optionsButton.disabled = false;
    sortDeck1Button.onclick = (evt) => SortDeck(player1Deck);
    sortDeck2Button.onclick = (evt) => SortDeck(player2Deck);
    exportDeck1Button.onclick = (evt) => ExportDeck(player1Deck);
    exportDeck2Button.onclick = (evt) => ExportDeck(player2Deck);
}

function OpenReadyPopup(){
    beginningPopup.classList.add("hidePopup");
    readyPopup.classList.remove("hidePopup");
    if (player1Ready){
        player1ReadyButton.disabled = true;
        player1ReadyImage.src = "images/UI/Checkmark.png";
    }
    if (player2Ready){
        player2ReadyButton.disabled = true;
        player2ReadyImage.src = "images/UI/Checkmark.png";
    }
}

function PickCard(draftCard){
    draftCard.inDraft = false;
    draftCard.documentImg.setAttribute('class', 'lockedCard');
    if (currentPlayer == 1){
        let deckId = "deck1Figures";
        AddCardToPlayer(player1Deck, draftCard.card.id, deckId, player1DeckSizeBox);
        
    } else{
        let deckId = "deck2Figures";
        AddCardToPlayer(player2Deck, draftCard.card.id, deckId, player2DeckSizeBox);
    }
    ChangeDraftTurnData();
}

function ChangeDraftTurnData(){
    picksUntilChangeTurn--;
    if (picksUntilChangeTurn == 0){
        if (currentPlayer == 1){
            currentPlayer = 2;
            currentTurnMessage.innerHTML = player2Name + "'s turn to choose";
        } else{
            currentPlayer = 1;
            currentTurnMessage.innerHTML = player1Name + "'s turn to choose";
        }
        picksUntilChangeTurn = 2;

        if (userRole == currentPlayer){
            currentTurnMessage.style.color = '#2a7321';
        } else if (userRole != 0){
            currentTurnMessage.style.color = '#4d2d3b';
        }
    }
}

function AddCardToPlayer(playerDeck, id, deckId, deckSizeBox){
    PlayAudio(drawCardSfx);
    playerIsInTime = true;
    let newDraftCard = new DraftCard(id);
    playerDeck.size += newDraftCard.card.size;
    deckSizeBox.innerHTML = "Size: " + playerDeck.size;

    var img = document.createElement('img');
    document.getElementById(deckId).appendChild(img);
    img.src = newDraftCard.card.image;

    newDraftCard.documentImg = img;
    newDraftCard.inDraft = false;
    newDraftCard.pickOrder = playerDeck.deck.length + 1;

    playerDeck.deck.push(newDraftCard);
    if(playerDeck.sorted){
        playerDeck.sorted= !playerDeck.sorted;
        SortDeck(playerDeck)
    }

    if (player2Deck.deck.length == 15){
        EndDraft();
        return;
    }
    
    if (draftPhase == 1){
        timeSinceUpdate = new Date();
        if (draftTimer != 0){
            timerMessage.style.color = '#000000';
            SetTimer();
        }
    }
    
}

function SortDeck(playerDeck){
    let deckFigures;
    let sortButton;
    if (playerDeck == player1Deck){
        deckFigures = document.getElementById("deck1Figures");
        sortButton = document.getElementById("player1SortDeck");
    } else{
        deckFigures = document.getElementById("deck2Figures");
        sortButton = document.getElementById("player2SortDeck");
    }

    //ta bort display
    while (deckFigures.firstChild) {
        deckFigures.removeChild(deckFigures.lastChild);
    }

    //sortera
    if (playerDeck.sorted){
        playerDeck.deck = SortByPickOrder(playerDeck.deck);
        sortButton.textContent = "Sort by size";
    }else{
        playerDeck.deck = SortBySize(playerDeck.deck, +sortOrderForm.value, +specialCardSortForm.value);
        sortButton.textContent = "Sort by pick order";
    }
    playerDeck.sorted= !playerDeck.sorted;

    DisplayDeck(playerDeck, deckFigures);
}

function UpdateSort(){
    localStorage['sort'] = sortOrderForm.value;
    localStorage['312Order'] = specialCardSortForm.value;

    if (player1Deck.sorted == true){
        player1Deck.deck = SortBySize(player1Deck.deck, +sortOrderForm.value, +specialCardSortForm.value);
    }
    if (player2Deck.sorted == true){
        player2Deck.deck = SortBySize(player2Deck.deck, +sortOrderForm.value, +specialCardSortForm.value);
    }
}

function ExportDeck(playerDeck){
    exportDeckPopup.classList.remove("hidePopup");
    optionsButton.disabled = true;

    playerDeck.deck = SortBySize(playerDeck.deck, +sortOrderForm.value, +specialCardSortForm.value);
    let name = "Draft"
    let cards = [];
    for (let i = 0; i < playerDeck.deck.length; i++){
        cards[i] = playerDeck.deck[i].card.id;
    }
    jsonString = JSON.stringify({name, cards});
    codeId.innerText = jsonString;
}

function CheckIfBothPlayersReady(){
    if (draftPhase == 0 && player1Ready && player2Ready){
        StartDraftPhase();
    }
}

function StartDraftPhase(){
    timeSinceUpdate = new Date();
    PlayAudio(tickSfx);
    if (draftPhase != 0){
    } else{
        draftPhase = 1;
        MakeDraftVisible();
        currentTurnMessage.innerHTML = player1Name + "'s turn to choose";
        CheckTextColour();
        if (draftTimer != 0){
            SetTimer();
            timerInterval = setInterval(SetTimer, 1000);
        }
    }
}

function EndDraft(){
    PlayAudio(draftFinishedSfx);
    clearInterval(timerInterval);
    draftPhase = 2;
    currentTurnMessage.innerHTML = "Draft has finished";
    currentTurnMessage.style.color = '#000000';
    timerMessage.innerText = "\n";
    exportDeck1Button.disabled = false;
    exportDeck2Button.disabled = false;
}

function DraftClick(i){
    //window.alert(evt.currentTarget.src);
    if (draftCards[i].inDraft && draftPhase == 1 && currentPlayer == userRole && playerIsInTime){
        PickCard(draftCards[i]);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "CreateDeckCard", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            playerId: playerId,
            cardId: draftCards[i].card.id
        }));
        xhr.onload = function() {
            let message = [playerId, draftCards[i].card.id, draftId];
            socket.emit('add card', message);
        }
    }
}

function CheckTextColour(){
    if (userRole == currentPlayer){
        currentTurnMessage.style.color = '#2a7321';
    } else if (userRole != 0){
        currentTurnMessage.style.color = '#4d2d3b';
    }
}

function PlayAudio(audio){
    if (!muteAudio){
        audio.play();
    }
}

function PlayerClick(i){
    userRole = i;
    if (userRole == 1){
        playerId = player1Id;
        player1ReadyButton.disabled = false;
    } else if (userRole == 2){
        playerId = player2Id;
        player2ReadyButton.disabled = false;
    }

    if (draftPhase != 0){
        MakeDraftVisible();
        CheckTextColour();
    } else{
        OpenReadyPopup();
    }
}

function ReadyClick(i){
    if (userRole == 1){
        player1Ready = true;
        player1ReadyImage.src = "images/UI/Checkmark.png";

    } else{
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
        let message = [playerId, draftId];
        socket.emit('player ready', message);
        CheckIfBothPlayersReady();
    }
}