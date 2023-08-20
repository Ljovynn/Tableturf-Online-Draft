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
        console.log("socket sent player ready in room " + message[1]);
        socket.to(message[1].toString()).emit('player ready', message[0]);
    })

    /*socket.on('start draft', message => {
        socket.to(socket.room).emit('start draft', message);
    })*/
    socket.on('add card', message => {
        socket.to(message[2].toString()).emit('add card', message);
    })
});

const amountOfDifferentCards = 209;
const unreleasedAmountOfDifferentCards = 12;
let draftProcessingList = [];

app.use(express.static('public',{extensions:['html']}));
//</public>app.use(express.static('public'))//,{index:false,extensions:['html']});
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.get("/draft", async (req, res) => {
    res.sendFile(join(__dirname, "draft.html"));
})

//indexes 0 = draftcards, 1 = players, 2 = playerdecks
app.post("/GetDraftInfo", async (req, res) =>{
    try {
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
    } catch (err){
        res.sendStatus(599);
    }
})

app.post("/TimerBelowLimit", async (req, res) =>{
    try {
        const draftId = req.body.draftId;
        const draft = await GetDraft(draftId);
        if (draft.draft_phase != 1){
            console.log("draft phase isnt 1");
            res.sendStatus(599);
            return;
        }
        var now = new Date();
        let timeSinceLastUpdate = CreateDateFromTimestamp(draft.formatted_update);
        var t = (timeSinceLastUpdate.getTime() + (draft.timer * 1000)) - now.getTime();
        //result = result / 1000;
        if (t > -2000){
            res.sendStatus(250);
            return;
        }
        if (draftProcessingList.includes(draftId)){
            res.sendStatus(260);
            return;
        }
        draftProcessingList.push(draftId);

        //genererar lista med oanvända draftkort
        console.log("draft timer depleted");
        const players = await(GetPlayersInDraft(draft.id));
        let draftCards = await GetDraftCards(draft.id);
        //let draftCards = draft;
        let draftCardList = [];
        for (let i = 0; i < draftCards.length; i++){
            draftCardList.push(draftCards[i].card_id);
        }

        let player1Deck =  await(GetDeckCards(players[0].id));
        let player2Deck = await(GetDeckCards(players[1].id));
        let unpickedCards = []
        for (let i = 0; i < draftCardList.length; i++){
            let unpicked = true;
            for (let j = 0; j < player1Deck.length; j++){
                if (player1Deck[j].card_id == draftCardList[i]){
                    unpicked = false;
                }
            }
            for (let j = 0; j < player2Deck.length; j++){
                if (player2Deck[j].card_id == draftCardList[i]){
                    unpicked = false;
                }
            }
            
            if (unpicked){
                unpickedCards.push(draftCardList[i]);
            }
        }

        let r = Math.floor(Math.random() * unpickedCards.length);
        let currentPlayerId;
        let count;
        if (draft.player_turn == 1){
            currentPlayerId = players[0].id;
            count = player1Deck.length;
        } else{
            currentPlayerId = players[1].id;
            count = player2Deck.length;
        }
        await CreateDeckCard(currentPlayerId, count + 1, unpickedCards[r]);

        //ändrar draft data
        let picksUntilChangeTurn = draft.picks_until_change_turn
        let playerTurn = draft.player_turn
        let draftPhase = 1
        picksUntilChangeTurn--

        //kollar om det är slutet, player och count är från före update
        if (playerTurn == 2 && count == 14){
            draftPhase = 2
        }

        if (picksUntilChangeTurn == 0){
            picksUntilChangeTurn = 2
            if (playerTurn == 1){
                playerTurn = 2
            } else{
                playerTurn = 1
            }
        }

        await UpdateDraft(draft.id, draftPhase, playerTurn, picksUntilChangeTurn);
        const index = draftProcessingList.indexOf(draftId);
        if (index != 1){
            draftProcessingList.splice(index, 1);
        }
        res.send(unpickedCards[r].toString());
        return;
    } catch (err){
        console.log("error timerrequest " + req.body.draftId);
        const index = draftProcessingList.indexOf(draftId);
        if (index != 1){
            draftProcessingList.splice(index, 1);
        }
        res.sendStatus(599);
    }
});

function CreateDateFromTimestamp(timestamp){
    console.log("timestamp: " + timestamp);
    var t = timestamp.split(/[- :.]/);
    let result = new Date(t[0], t[1] -1, t[2], t[3], t[4], t[5]);
    return result;
}

app.post("/GenerateNewDraft", async (req, res) => {
    try {
        const data = req.body

    const result = await CreateDraft(data.timer, data.stage)

    let player1 = data.player1Name;
    let player2 = data.player2Name;
    if (player1 == null || player1 == ''){
        player1 = 'Player 1';
    }
    if (player2 == null || player2 == ''){
        player2 = 'Player 2';
    }
    
    let r = Math.floor(Math.random() * 2);
    if (r == 1){
        let tempName = player1;
        player1 = player2;
        player2 = tempName;
    }

    let names = [player1, player2];
    await (CreatePlayers(result, names));
    /*await (CreatePlayer(result, 1, JSON.stringify(data.player1Name)))
    await (CreatePlayer(result, 2, JSON.stringify(data.player2Name)))*/

    const draftSize = +JSON.stringify(data.draftSize);
    const minSpecials = +JSON.stringify(data.minSpecials);
    
    let draftList;
    if (data.includeUnreleasedCards == true){
        draftList = CreateSortedList(amountOfDifferentCards, unreleasedAmountOfDifferentCards);
    } else{
        draftList = CreateSortedList(amountOfDifferentCards, 0);
    }
    
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
        let otherPlayer;
        if (playerId == players[0].id){
            otherPlayer = players[1];
        } else if (playerId == players[1].id){
            otherPlayer = players[0];
        } else{
            console.log("player not in draft");
            res.sendStatus(599);
            return;
        }
    
        if (draft.draft_phase == 0 && otherPlayer.ready){
            console.log("starting draft");
            await StartDraft(draft.id);
        }
        res.sendStatus(201);
    } catch(err){
        res.sendStatus(599);
    }
})

function CreateSortedList(amountOfDifferentCards, unreleasedCards) {
    let tempList = [];
    for (let i = -unreleasedCards; i < 0; i++){
        tempList.push(i);
    }
    for (let i = 0; i < amountOfDifferentCards; i++) {
        tempList.push(i + 1);
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

//ha med card id och player id
app.post("/CreateDeckCard", async (req, res) => {
    try {
        const data = req.body;
    console.log ("sent in player id: " + data.playerId);
    const player = await GetPlayer(data.playerId);
    const count = await GetDeckCount(player.id)
    const draft = await GetDraft(player.draft_id);
    const players = await GetPlayersInDraft(draft.id)
    let playerInDraftId = 0;
    if (player.id == players[0].id){
        playerInDraftId = 1;
    } else if (player.id = players[1].id){
        playerInDraftId = 2;
    }

    if (count < 15 && (playerInDraftId == draft.player_turn) && draft.draft_phase == 1){
        await CreateDeckCard(data.playerId, count + 1, data.cardId);
    } else{
        console.log("Fraudulent attempt");
        res.status(599).send(data.card_id)
        return;
    }

    //ändrar draft data
    let picksUntilChangeTurn = draft.picks_until_change_turn
    let playerTurn = draft.player_turn
    let draftPhase = 1
    picksUntilChangeTurn--

    //kollar om det är slutet, player och count är från före update
    if (playerTurn == 2 && count == 14){
        draftPhase = 2
    }

    if (picksUntilChangeTurn == 0){
        picksUntilChangeTurn = 2
        if (playerTurn == 1){
            playerTurn = 2
        } else{
            playerTurn = 1
        }
    }

    await UpdateDraft(draft.id, draftPhase, playerTurn, picksUntilChangeTurn)

    res.sendStatus(201);
    } catch (err){
        res.sendStatus(599);
    }
})