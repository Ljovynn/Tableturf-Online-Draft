const url = window.location.href;
const searchParams = new URL(url).searchParams;
const entries = new URLSearchParams(searchParams).entries();
const entriesArray = Array.from(entries)

const draftId = entriesArray[0][1];

let beginningPopup = document.getElementById("beginningPopup");
let readyPopup = document.getElementById("readyPopup");

var popSfx = new Audio('Audio/Pop.mp3');
var drawCardSfx = new Audio('Audio/DrawCard.mp3');

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

let player1Button = document.getElementById("player1Button");
let player2Button = document.getElementById("player2Button");
let spectatorButton = document.getElementById("spectatorButton");

let player1ReadyButton = document.getElementById("player1Ready");
let player2ReadyButton = document.getElementById("player2Ready");
let player1ReadyImage = document.getElementById("player1Check");
let player2ReadyImage = document.getElementById("player2Check");

let currentTurnMessage = document.getElementById("currentTurnMessage");

let player1DeckSizeBox = document.getElementById("player1DeckSize");
let player2DeckSizeBox = document.getElementById("player2DeckSize");

copyExportButton.addEventListener("click", () => {
    navigator.clipboard.writeText(codeId.innerText);
});

closeExportPopupButton.addEventListener("click", () => {
    exportDeckPopup.classList.add("hidePopup");
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

let draftData;

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
//const socket = io('http://85.228.196.253:8080');
socket.emit('join', draftId.toString());
console.log("joining room " + draftId.toString());

socket.on('player ready', data =>{
    console.log("player1id: "+ player1Id +  " data: " + data)
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
    console.log("data: " + data);
    if (+data == draftId){
        StartDraftPhase();
    }
})*/

socket.on('add card', data =>{
    console.log("data: " + data);
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
    
    //draftkort
    const draftCardList = draftData[1];
    for (let i = 0; i < draftCardList.length; i++){
        draftCards[i] = new DraftCard(draftCardList[i].card_id);
    }

    draftCards = SortBySizeReverse(draftCards);

    //players
    const playerData = draftData[2];
    let player1Data;
    let player2Data;
    if (playerData[0].in_draft_id == 1){
        player1Data = playerData[0];
        player2Data = playerData[1];
    } else{
        player1Data = playerData[1];
        player2Data = playerData[0];
    }
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
    let player1DeckData = [];
    let player2DeckData = [];
    if (deckData[0].length == 0){
        if (deckData[1].length != 0){
            player1DeckData = deckData[1];
        }

    } else if (deckData[1].length == 0){
        player1DeckData = deckData[0];
    } else {
        if (deckData[0][0].player_id == player1Data.id){
            player1DeckData = deckData[0];
            player2DeckData = deckData[1];
        } else{
            player1DeckData = deckData[1];
            player2DeckData = deckData[0];
        }
    }
    console.log("player1deckdata: " + player1DeckData);
    for (let i = 0; i < player1DeckData.length; i++){
        AddCardToPlayer(player1Deck, player1DeckData[i].card_id, "deck1Figures", player1DeckSizeBox);
        var index = draftCards.findIndex(e => e.card.id === player1DeckData[i].card_id);
        draftCards[index].inDraft = false;
    }
    for (let i = 0; i < player2DeckData.length; i++){
        AddCardToPlayer(player2Deck, player2DeckData[i].card_id, "deck2Figures", player2DeckSizeBox);
        var index = draftCards.findIndex(e => e.card.id === player2DeckData[i].card_id);
        draftCards[index].inDraft = false;
    }

    DisplayDraftCards();

    if (draftPhase == 1){
        if (currentPlayer == 1){
            currentTurnMessage.innerHTML = player1Name + "'s turn to choose";
        } else{
            currentTurnMessage.innerHTML = player2Name + "'s turn to choose";
        }
    }
    else if (draftPhase == 2){
        MakeDraftVisible();
        exportDeck1Button.disabled = false;
        exportDeck2Button.disabled = false;
        currentTurnMessage.innerHTML = "Draft finished";
    }
}

function SortBySize(array){
    array.sort((a, b) => a.card.size - b.card.size || a.card.id - b.card.id);

    return array;
}

function SortBySizeReverse(array){
    array.sort((a, b) => b.card.size - a.card.size || a.card.id - b.card.id);

    return array;
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

        console.log("displaying draftcard: " + draftCards[i].documentImg.src);
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
    sortDeck1Button.onclick = (evt) => SortDeck(player1Deck);
    sortDeck2Button.onclick = (evt) => SortDeck(player2Deck);
    exportDeck1Button.onclick = (evt) => ExportDeck(player1Deck);
    exportDeck2Button.onclick = (evt) => ExportDeck(player2Deck);
}

function OpenReadyPopup(){
    console.log("Openreadypopup")
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
            //popSfx.play();
            currentTurnMessage.style.color = '#2a7321';
        } else if (userRole != 0){
            currentTurnMessage.style.color = '#4d2d3b';
        }
    }
}

function AddCardToPlayer(playerDeck, id, deckId, deckSizeBox){
    drawCardSfx.play();
    let newDraftCard = new DraftCard(id);
    playerDeck.size += newDraftCard.card.size;
    deckSizeBox.innerHTML = "Size: " + playerDeck.size;
    console.log("decksize: " + playerDeck.size);

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
        playerDeck.deck = SortBySizeReverse(playerDeck.deck);
        sortButton.textContent = "Sort by pick order";
    }
    playerDeck.sorted= !playerDeck.sorted;

    DisplayDeck(playerDeck, deckFigures);
}

function ExportDeck(playerDeck){
    exportDeckPopup.classList.remove("hidePopup");

    playerDeck.deck = SortBySizeReverse(playerDeck.deck);
    let name = "Draft"
    let cards = [];
    for (let i = 0; i < playerDeck.deck.length; i++){
        cards[i] = playerDeck.deck[i].card.id;
    }
    jsonString = JSON.stringify({name, cards});
    codeId.innerText = jsonString;
}

function CheckIfBothPlayersReady(){
    console.log("player1ready: " + player1Ready);
    console.log("player2ready: " + player2Ready);
    if (draftPhase == 0 && player1Ready && player2Ready){
        StartDraftPhase();
    }
}

function StartDraftPhase(){
    popSfx.play();
    if (draftPhase != 0){
    } else{
        draftPhase = 1;
        MakeDraftVisible();
        currentTurnMessage.innerHTML = player1Name + "'s turn to choose";
        CheckTextColour();
    }
}

function EndDraft(){
    draftPhase = 2;
    currentTurnMessage.innerHTML = "Draft has finished";
    currentTurnMessage.style.color = '#000000';
    exportDeck1Button.disabled = false;
    exportDeck2Button.disabled = false;
}

function DraftClick(i){
    //window.alert(evt.currentTarget.src);
    if (draftCards[i].inDraft && draftPhase == 1 && currentPlayer == userRole){
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

function PlayerClick(i){
    console.log("playerClick " + i + "draftphase: " + draftPhase);
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
    console.log("readyClick " + i);

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