import express from 'express'

import {GetDrafts, GetDraft, GetPlayersInDraft, GetPlayer, GetDeckCards, GetDraftCards, CreateDraft, CreatePlayer, CreateDraftCards, CreateDeckCard, UpdateDraft, PlayerReady} from './database.js'

import dotenv from 'dotenv'
dotenv.config()

let allCards = [];
const amountOfDifferentCards = 209

const app = express();
app.set("view engine", "ejs")
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static ("public"))

app.get("/draft/:id", async (req, res) => {
    const id = req.params.id
    res.render(draft.ejs, {draftId: id})
})

app.post("/GenerateNewDraft", async (req, res) => {
    const data = req.body
    console.log("data: " + JSON.stringify(data));
    console.log("data [0]: " + JSON.stringify(data.player1Name));
    const result = await CreateDraft()
    await (CreatePlayer(result, JSON.stringify(data.player1Name)))
    await (CreatePlayer(result, JSON.stringify(data.player2Name)))

    const draftSize = +JSON.stringify(data.draftSize)
    const minSpecials = +JSON.stringify(data.minSpecials)
    let draftCardList = []

    let draftList = CreateSortedList(amountOfDifferentCards);

    Shuffle(draftList);

    console.log(draftList + " before shenanigans");

    draftList = GetDraftFromShuffledList(draftList, draftSize, minSpecials);

    console.log(draftList + " after shenanigans");

    //lägger in utan sort på databas

    await CreateDraftCards(result, draftList);
    /*for (let i = 0; i < draftList.length; i++){

        await CreateDraftCard(result, draftList[i]);
        console.log("create card " + draftList[i]);
    }*/

    res.status(201).send(result)
})

/*implementera bannade kort: använd en till variabel*/
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

    //sätter dit specials tills min
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

app.post("/CreateDraft", async (req, res) => {
    const data = req.body
    const result = await CreateDraft()
    res.status(201).send(result)
})

app.post("/CreatePlayer", async (req, res) => {
    const data = req.body
    const result = await CreatePlayer(data.draft_id, data.playerName)
    res.status(201).send(result)
})
/*
app.post("/CreateDraftCard", async (req, res) => {
    const data = req.body
    await CreateDraftCard(data.draft_id, data.card_id)
    res.status(201).send(data.card_id)
})*/

//ha med draft_id
app.post("/CreateDeckCard", async (req, res) => {
    const data = req.body
    await CreateDeckCard(data.player_id, data.pick_order, data.card_id)

    //ändrar draft data
    const draft = await GetDraft(data.draft_id)
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

    //kollar om det är slutet
    if (playerTurn == 2 && picksUntilChangeTurn == 1){
        const [cards] = await GetDeckCards(data.player_id)
        if (cards.length == 15) {
            draftPhase = 2
        }
    }

    await UpdateDraft(draft.id, draftPhase, playerTurn, picksUntilChangeTurn)

    res.status(201).send(data.card_id)
})

const port = 8080;
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});