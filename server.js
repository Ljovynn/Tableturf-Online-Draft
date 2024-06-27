import express, { json } from 'express'

import dotenv from 'dotenv'
dotenv.config()

import {createServer } from 'http';

import {GetDraft, GetPlayersInDraft, GetDeckCards, GetDraftCards, CreateDraft,
    CreatePlayers, CreateDraftCards, CreateDeckCard, UpdateDraft, PlayerReady, StartDraft,
    GetDeckCount} from './database.js'

import { Server } from "socket.io";

const app = express();

const server = createServer(app);

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`Draft website up at port ${port}`);
});

const io = new Server (server);

io.on("connection", socket => {
    //join draft id as room
    socket.on('join', function(room){
        socket.join(room.toString());
        //console.log("user joined " + room);
    });

    //message: playerId, draftId
    socket.on('player ready', message => {
        //console.log("socket sent player ready in room " + message[1]);
        socket.to(message[1].toString()).emit('player ready', message[0]);
    })

    //message: currentUserId, cardId, draftId
    socket.on('add card', message => {
        socket.to(message[2].toString()).emit('add card', [message[0], message[1]]);
    })

    socket.on('add cards', message => {
        socket.to(message[3].toString()).emit('add cards', [message[0], message[1], message[2]]);
    })
});

const amountOfDifferentCards = 266;
const amountOfSpecialCards = 19;
const unreleasedAmountOfDifferentCards = 0;

let draftProcessingList = [];

app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.get("/draft", async (req, res) => {
    res.sendFile(join(__dirname, "draft.html"));
})

//fetch all draft info from draft
//include draftId
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

//when client thinks timer is below limit
//include draftId
//respond with unpicked cards ID
app.post("/TimerBelowLimit", async (req, res) =>{
    try {
        const draftId = req.body.draftId;
        const draft = await GetDraft(draftId);
        if (draft.draft_phase != 1){
            //console.log("draft phase isnt 1");
            res.sendStatus(599);
            return;
        }

        var now = new Date();
        let timeSinceLastUpdate = CreateDateFromTimestamp(draft.formatted_update);
        //get time between now and draft timer depleted
        var t = (timeSinceLastUpdate.getTime() + (draft.timer * 1000)) - now.getTime();
        //check if valid request
        if (t > -2000){
            res.sendStatus(250);
            return;
        }
        if (draftProcessingList.includes(draftId)){
            res.sendStatus(260);
            return;
        }
        draftProcessingList.push(draftId);

        //generate list of the unpicked cards
        //console.log("draft timer depleted");
        const players = await GetPlayersInDraft(draft.id);
        let draftCards = await GetDraftCards(draft.id);
        let draftCardList = [];
        for (let i = 0; i < draftCards.length; i++){
            draftCardList.push(draftCards[i].card_id);
        }

        let player1Deck =  await GetDeckCards(players[0].id);
        let player2Deck = await GetDeckCards(players[1].id);
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

        //choose random card for the player
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

        let cardArray = [unpickedCards[r]];
        await CreateDeckCard(currentPlayerId, count + 1, unpickedCards[r]);

        //update draft data
        let picksUntilChangeTurn = draft.picks_until_change_turn;
        let playerTurn = draft.player_turn;
        let draftPhase = 1;
        picksUntilChangeTurn--;

        //check if it's the end, player and count from before update
        if (playerTurn == 2 && count == 14){
            draftPhase = 2;
        }

        if (picksUntilChangeTurn == 0){
            picksUntilChangeTurn = 2;
            if (playerTurn == 1){
                playerTurn = 2;
            } else{
                playerTurn = 1;
            }
        } else if (draftPhase != 2){
            //add another card to be picked
            unpickedCards.splice(r, 1);
            r = Math.floor(Math.random() * unpickedCards.length);
            cardArray.push(unpickedCards[r]);
            await CreateDeckCard(currentPlayerId, count + 2, unpickedCards[r]);
            picksUntilChangeTurn = 2;
            if (playerTurn == 1){
                playerTurn = 2;
            } else{
                playerTurn = 1;
            }
        }
        //console.log("cardarray: " + cardArray);

        await UpdateDraft(draft.id, draftPhase, playerTurn, picksUntilChangeTurn, true);
        const index = draftProcessingList.indexOf(draftId);
        if (index !== -1){
            draftProcessingList.splice(index, 1);
        }
        //.tostring??
        res.send(JSON.stringify(cardArray));
        return;
    } catch (err){
        //console.log("error timerrequest " + req.body.draftId);
        const index = draftProcessingList.indexOf(draftId);
        if (index !== -1){
            draftProcessingList.splice(index, 1);
        }
        res.sendStatus(599);
    }
});

//creates js date from sql timestamp
function CreateDateFromTimestamp(timestamp){
    var t = timestamp.split(/[- :.]/);
    let result = new Date(t[0], t[1] -1, t[2], t[3], t[4], t[5]);
    return result;
}

//generates new draft
//include player1Name, player2Name, draftSize, minSpecials, includeUnrelasedCards
app.post("/GenerateNewDraft", async (req, res) => {
    try {
        const data = req.body;

        const draftSize = +JSON.stringify(data.draftSize);
        const minSpecials = +JSON.stringify(data.minSpecials);

        //checks so draft size and min specials are viable options
        if (minSpecials < 0 || minSpecials > amountOfSpecialCards){
            res.sendStatus(599);
            return;
        }
        if (draftSize < 30 || draftSize > amountOfDifferentCards){
            res.sendStatus(599);
            return;
        }

        const result = await CreateDraft(data.timer, data.stage);

        let player1 = data.player1Name;
        let player2 = data.player2Name;
        
        if (player1 == null || player1 == ''){
            player1 = 'Player 1';
        }
        if (player2 == null || player2 == ''){
            player2 = 'Player 2';
        }

        //random positioner of players
        let r = Math.floor(Math.random() * 2);
        if (r == 1){
            let tempName = player1;
            player1 = player2;
            player2 = tempName;
        }

        let names = [player1, player2];
        await CreatePlayers(result, names);
        
        let draftList;
        if (data.includeUnreleasedCards == true){
            draftList = CreateSortedList(amountOfDifferentCards, unreleasedAmountOfDifferentCards);
        } else{
            draftList = CreateSortedList(amountOfDifferentCards, 0);
        }
        
        //generates random list of cards for draft
        Shuffle(draftList);
        draftList = GetDraftFromShuffledList(draftList, draftSize, minSpecials);

        console.log("Created draft " + result + ", min 3-12s: " + minSpecials);

        //updates database
        await CreateDraftCards(result, draftList);

        res.status(201).send(result);
    } catch (err){
        res.sendStatus(599);
    }
})

//When player sends player ready
//include player id and draft id
app.post("/PlayerReady", async (req, res) =>{
    try {
        const playerId = req.body.playerId;
        const draftId = req.body.draftId;
        const players = await GetPlayersInDraft(draftId);
        const draft = await GetDraft(draftId);
    
        //console.log(playerId + " ready");
        await PlayerReady(playerId);
        let otherPlayer;
        //checks which player sent request
        if (playerId == players[0].id){
            otherPlayer = players[1];
        } else if (playerId == players[1].id){
            otherPlayer = players[0];
        } else{
            //console.log("player not in draft");
            res.sendStatus(599);
            return;
        }
    
        if (draft.draft_phase == 0 && otherPlayer.ready){
            //console.log("starting draft");
            await StartDraft(draft.id);
        }
        res.sendStatus(201);
    } catch(err){
        res.sendStatus(599);
    }
})

//create sorted list of all availible cards. Unreleased cards have negative values
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
    let array = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 188, 189, 231, 232];
    return array;
}

//shuffles an array
function Shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    while (currentIndex != 0) {
  
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // switch element with last place of array
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

//get a real draft from a sorted list
function GetDraftFromShuffledList(fullList, draftSize, minSpecials){
    let unusedSpecials = CreateSortedSpecialAttackList();
    let currentSpecials = 0;
    let draftList = [];
    for (let i = 0; i < draftSize; i++){
        //checks if it has a special attack card
        var index = unusedSpecials.indexOf(fullList[i]);
        if (index !== -1) {
            unusedSpecials.splice(index, 1);
            currentSpecials++;
        }
        draftList[i] = fullList[i];
    }

    //puts more specials while until min amount of specials reached
    while (currentSpecials < minSpecials){
        for (let i = 0; i < draftList.length; i++){
            //checks if its not a special attack card
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

//puts deck card into players deck
//include playerId, cardId, draftId
app.post("/CreateDeckCard", async (req, res) => {
    try {
    const data = req.body;
    //console.log ("created new card for player id: " + data.playerId);
    const draft = await GetDraft(data.draftId);
    const count = await GetDeckCount(data.playerId)
    const players = await GetPlayersInDraft(draft.id)
    let playerInDraftId = 0;

    //checks if player id matches
    if (data.playerId == players[0].id){
        playerInDraftId = 1;
    } else if (data.playerId == players[1].id){
        playerInDraftId = 2;
    } else {
        //console.log("player id and draft id not matching at CreateDeckCard, " + data.playerId);
        res.status(599).send(data.card_id)
        return;
    }

    //cecks if everything is correct and updates database
    if (count < 15 && (playerInDraftId == draft.player_turn) && draft.draft_phase == 1){
        await CreateDeckCard(data.playerId, count + 1, data.cardId);
    } else{
        //console.log("Fraudulent attempt");
        res.status(599).send(data.card_id)
        return;
    }

    //change draft data
    let picksUntilChangeTurn = draft.picks_until_change_turn
    let playerTurn = draft.player_turn
    let draftPhase = 1
    picksUntilChangeTurn--

    //check if draft ended,  player turn and count from before update
    if (playerTurn == 2 && count == 14){
        draftPhase = 2
    }
    let shouldUpdateTimer = false;

    if (picksUntilChangeTurn == 0){
        shouldUpdateTimer = true;
        picksUntilChangeTurn = 2
        if (playerTurn == 1){
            playerTurn = 2
        } else{
            playerTurn = 1
        }
    }

    await UpdateDraft(draft.id, draftPhase, playerTurn, picksUntilChangeTurn, shouldUpdateTimer)

    res.sendStatus(201);
    } catch (err){
        res.sendStatus(599);
    }
})