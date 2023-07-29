import express from 'express'

import dotenv from 'dotenv'
dotenv.config()

import {createServer } from 'http';

import {GetDraft, GetPlayersInDraft, GetPlayer, GetDeckCards, GetDraftCards, CreateDraft,
    CreatePlayers, CreateDraftCards, CreateDeckCard, UpdateDraft, PlayerReady, StartDraft,
    GetDeckCount} from './database.js'

import { Server } from "socket.io";

const app = express();

const server = createServer(app);

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

const io = new Server (server);

io.on("connection", socket => {
    socket.on('join', function(room){
        socket.join(room.toString());
        console.log("user joined " + room);
    });

    socket.on('player ready', message => {
        console.log("socket sent player ready in room " + socket.room);
        socket.to(message[1].toString()).emit('player ready', message[0]);
    })

    /*socket.on('start draft', message => {
        socket.to(socket.room).emit('start draft', message);
    })*/
    socket.on('add card', message => {
        socket.to(message[2].toString()).emit('add card', message);
    })
});

let allCards = [];
const amountOfDifferentCards = 209

app.use(express.static('public',{extensions:['html']}));
//</public>app.use(express.static('public'))//,{index:false,extensions:['html']});
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.get("/draft", async (req, res) => {
    res.sendFile(join(__dirname, "draft.html"));
})

//indexes 0 = draftcards, 1 = players, 2 = playerdecks
app.post("/GetDraftInfo", async (req, res) =>{
    const draftId = req.body.draftId;
    let data = [];

    //get draft
    data[0] = await GetDraft(draftId);
    if (data[0] == null){
        res.sendStatus(599);
        return;
    }

    //get draftcards
    data[1] = await GetDraftCards(draftId);

    //get players

    data[2] = await GetPlayersInDraft(draftId);

    //get player decks
    let decks = [];
    decks[0] = await GetDeckCards(data[2][0].id);
    decks[1] = await GetDeckCards(data[2][1].id);
    data[3] = decks;

    res.status(200).send(data);
})

app.post("/GenerateNewDraft", async (req, res) => {
    try {
        const data = req.body
    console.log("data: " + data);
    console.log("data [0]: " + data.player1Name);

    const result = await CreateDraft()

    let player1 = data.player1Name;
    let player2 = data.player2Name;
    if (player1 == null || player1 == ''){
        player1 = 'Player 1';
    }
    if (player2 == null || player2 == ''){
        player2 = 'Player 2';
    }
    let names = [player1, player2];
    await (CreatePlayers(result, names))
    /*await (CreatePlayer(result, 1, JSON.stringify(data.player1Name)))
    await (CreatePlayer(result, 2, JSON.stringify(data.player2Name)))*/

    const draftSize = +JSON.stringify(data.draftSize)
    const minSpecials = +JSON.stringify(data.minSpecials)

    let draftList = CreateSortedList(amountOfDifferentCards);
    Shuffle(draftList);
    draftList = GetDraftFromShuffledList(draftList, draftSize, minSpecials);
    console.log(draftList + " after shenanigans");

    //lägger in utan sort på databas

    await CreateDraftCards(result, draftList);
    /*for (let i = 0; i < draftList.length; i++){

        await CreateDraftCard(result, draftList[i]);
        console.log("create card " + draftList[i]);
    }*/

    res.status(201).send(result)
    } catch (err){
        res.sendStatus(599);
        return;
    }
})

app.post("/PlayerReady", async (req, res) =>{

    try {
        const playerId = req.body.playerId;
        const draftId = req.body.draftId;
        const players = await GetPlayersInDraft(draftId)
        const draft = await GetDraft(players[0].draft_id);
    
        console.log(playerId + " ready");
        await PlayerReady(playerId);
    
        //horrendous code ik but its fast
        if ((players[0].id == playerId || players[1].id == playerId)){
            if (draft.draft_phase == 0 && (players[0].ready || players[0].id == playerId) && (players[1].ready || players[1].id == playerId)){
                console.log("starting draft");
                await StartDraft(draft.id);
            }
        }
    } catch(err){
        res.sendStatus(599);
        return;
    }
    

    res.sendStatus(201);
})

/*app.post("/StartDraft", async (req, res) =>{
    console.log("starting draft")
    const draftId = req.body.draftId;
    let draft = await GetDraft(draftId);
    if (draft.draftPhase == 0){
        await StartDraft(draftId);
    }

    res.sendStatus(201);
})*/

function CreateSortedList(amountOfDifferentCards) {
    let tempList = [];
    for (let i = 0; i < amountOfDifferentCards; i++) {
        tempList[i] = i + 1;
    }
    return tempList;
}

function CreateSortedSpecialAttackList(){
    let array = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 188, 189]
    return array;
}

function Shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    while (currentIndex != 0) {
  
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // Byt elementet med sista platsen av arrayen
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

function GetDraftFromShuffledList(fullList, draftSize, minSpecials){
    let unusedSpecials = CreateSortedSpecialAttackList();
    let currentSpecials = 0;
    let draftList = [];
    for (let i = 0; i < draftSize; i++){
        //kollar om den har specialattack
        var index = unusedSpecials.indexOf(fullList[i]);
        if (index !== -1) {
            unusedSpecials.splice(index, 1);
            currentSpecials++;
        }
        draftList[i] = fullList[i];
    }

    //sätter dit specials
    while (currentSpecials < minSpecials){
        for (let i = 0; i < draftList.length; i++){
            //kollar om det inte är en specialattack
            if (CreateSortedSpecialAttackList().includes(draftList[i]) == false){
                let randomIndex = Math.floor(Math.random() * unusedSpecials.length);
                draftList[i] = unusedSpecials[randomIndex];
                unusedSpecials.splice(randomIndex, 1);
                currentSpecials++;
                break;
            }
        }
    }

    return draftList;
}

/*app.post("/CreateDraft", async (req, res) => {
    const data = req.body
    const result = await CreateDraft()
    res.status(201).send(result)
})*/

/*app.post("/CreatePlayer", async (req, res) => {
    const data = req.body
    const result = await CreatePlayer(data.draft_id, data.playerName)
    res.status(201).send(result)
})*/
/*
app.post("/CreateDraftCard", async (req, res) => {
    const data = req.body
    await CreateDraftCard(data.draft_id, data.card_id)
    res.status(201).send(data.card_id)
})*/

//ha med card id och player id
app.post("/CreateDeckCard", async (req, res) => {
    try {
        const data = req.body;
    console.log ("sent in player id: " + data.playerId);
    const player = await GetPlayer(data.playerId);
    const count = await GetDeckCount(player.id)
    const draft = await GetDraft(player.draft_id);

    console.log ("count: " + count);/*
    console.log ("player in draft id: " + player.in_draft_id);
    console.log ("player turn: " + draft.player_turn);
    console.log ("draft phase: " + draft.draft_phase);*/

    if (count < 15 && player.in_draft_id == draft.player_turn && draft.draft_phase == 1){
        await CreateDeckCard(data.playerId, count + 1, data.cardId);
    } else{
        console.log("fraud!");
        res.status(599).send(data.card_id)
        return;
    }

    //ändrar draft data
    //const draft = await GetDraft(data.draft_id)
    let picksUntilChangeTurn = draft.picks_until_change_turn
    let playerTurn = draft.player_turn
    let draftPhase = 1
    picksUntilChangeTurn--

    if (picksUntilChangeTurn == 0){
        picksUntilChangeTurn = 2
        if (playerTurn == 1){
            playerTurn = 2
        } else{
            playerTurn = 1
        }
    }

    //kollar om det är slutet, count är från innan kort 
    if (playerTurn == 2 && count == 14){
        draftPhase = 2
    }

    await UpdateDraft(draft.id, draftPhase, playerTurn, picksUntilChangeTurn)

    res.sendStatus(201);
    } catch (err){
        res.sendStatus(599);
        return;
    }
})