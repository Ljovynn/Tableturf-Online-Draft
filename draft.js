document.getElementById("player1Ready").onclick = BeginSetup;
let currentTurnMessage = document.getElementById("currentTurnMessage");
let draftManager;
let allCards = [];

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
    owner = 0;
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

class DraftManager{
    amountOfDifferentCards = 209;
    size;
    
    draftCardList = [];
    draftCards  = [];

    player1Deck = new PlayerDeck();
    player2Deck = new PlayerDeck();

    player1Decksorted = false;
    player2DeckSorted = false;
    //player2DeckSizeText = document.getElementById("player2DeckSize");

    minSpecials;
    currentSpecials = 0;
    unusedSpecials = this.CreateSortedSpecialAttackList();

    currentPlayer = 1;
    turnsUntilSwitchSide = 1;
    draftFinished = false;

    constructor(size, minSpecials){
        this.size = size;
        this.minSpecials = minSpecials;
        this.GetCardsJson();
    }

    async GetCardsJson(){
        const response = await fetch("cards.json");
        const data = await response.json();
        let cardsJson = data;
        for (let i = 0; i < cardsJson.length; i++){
            let card = cardsJson[i];
            const id = card.id;
            const title = card.attributes.title;
            const size = card.attributes.size;
            const image = card.attributes.image.url;
            allCards[i] = new Card(id, title, size, image);
        }

        //fortsätter med metoden här för annars funkar inte asyncg
        
        this.GenerateDraft();

        for (let i = 0; i < this.draftCardList.length; i++){
            this.draftCards[i] = new DraftCard(this.draftCardList[i]);
        }

        this.draftCards = this.SortBySize(this.draftCards);

        this.DisplayDraftCards();

    }

    GenerateDraft(){
        let tempList = this.CreateSortedList();
        this.Shuffle(tempList);
        this.draftCardList = this.GetDraftFromShuffledList(tempList);
        this.draftCardList = this.CheckMinSpecials(this.draftCardList);
        console.log(this.draftCardList);
    }

    /*implementera bannade kort: använd en till variabel*/
    CreateSortedList() {
        let tempList = [];
        for (let i = 0; i < this.amountOfDifferentCards; i++) {
            tempList[i] = i + 1;
        }
        return tempList;
    }

    CreateSortedSpecialAttackList(){
        let array = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 188, 189]
        return array;
    }

    GetDraftFromShuffledList(fullList){
        let draftList = [];
        for (let i = 0; i < this.size; i++){
            //kollar om den har specialattack
            var index = this.unusedSpecials.indexOf(fullList[i]);
            if (index !== -1) {
                this.unusedSpecials.splice(index, 1);
                this.currentSpecials++;
            }
            draftList[i] = fullList[i];
        }
        return draftList;
    }

    CheckMinSpecials(draftList){
        while (this.currentSpecials < this.minSpecials){
            for (let i = 0; i < draftList.length; i++){
                //kollar om det inte är en specialattack
                if (this.CreateSortedSpecialAttackList().includes(draftList[i]) == false){
                    let randomIndex = Math.floor(Math.random() * this.unusedSpecials.length);
                    draftList[i] = this.unusedSpecials[randomIndex];
                    this.unusedSpecials.splice(randomIndex, 1);
                    this.currentSpecials++;
                    break;
                }
            }
        }
        return draftList;
    }

    Shuffle(array) {
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

    SortBySize(array){
        array.sort((a, b) => a.card.size - b.card.size || a.card.id - b.card.id);

        return array;
    }

    SortByPickOrder(array){
        array.sort((a, b) => a.pickOrder - b.pickOrder);

        return array;
    }

    DisplayDraftCards(){
        for (let i = 0; i < this.draftCards.length; i++){
            var img = document.createElement('img');
            document.getElementById('draftFigures').appendChild(img);
            img.src = this.draftCards[i].card.image;
            img.addEventListener('click',(evt) => DraftClick(i));

            this.draftCards[i].documentImg = img;
        }
    }

    PickCard(draftCard){
        draftCard.inDraft = false;
        draftCard.documentImg.setAttribute('class', 'lockedCard');
        this.turnsUntilSwitchSide--;
        if (this.currentPlayer == 1){
            draftCard.owner = 1;
            let deckId = "deck1Figures";
            this.AddCardToPlayer(this.player1Deck, draftCard, deckId);
            this.player1Deck.size += draftCard.card.size;
            document.getElementById("player1DeckSize").innerHTML = "Size: " + this.player1Deck.size;
            
        } else{
            draftCard.owner = 2;
            let deckId = "deck2Figures";
            this.AddCardToPlayer(this.player2Deck, draftCard, deckId);
            this.player2Deck.size += draftCard.card.size;
            document.getElementById("player2DeckSize").innerHTML = "Size: " + this.player2Deck.size;
        }
        if (this.turnsUntilSwitchSide == 0){
            if (this.currentPlayer == 1){
                this.currentPlayer = 2;
                currentTurnMessage.innerHTML = "Player 2's turn to choose";
            } else{
                this.currentPlayer = 1;
                currentTurnMessage.innerHTML = "Player 1's turn to choose";
            }
            this.turnsUntilSwitchSide = 2;
        } else if (this.player2Deck.deck.length == 15){
            this.draftFinished = true;
        }
    }

    AddCardToPlayer(playerDeck, draftCard, deckId){
        const id = draftCard.card.id;
        const title = draftCard.card.title;
        const size = draftCard.card.size;
        const image = draftCard.card.image;
        let newDraftCard = new DraftCard(id);

        var img = document.createElement('img');
        document.getElementById(deckId).appendChild(img);
        img.src = image;

        newDraftCard.documentImg = img;
        newDraftCard.owner = draftCard.owner;
        newDraftCard.inDraft = false;
        newDraftCard.pickOrder = playerDeck.deck.length + 1;

        playerDeck.deck.push(newDraftCard);
        if(playerDeck.sorted){
            playerDeck.sorted= !playerDeck.sorted;
            this.SortDeck(playerDeck)
        }
        
    }

    SortDeck(playerDeck){
        let deckFigures;
        let sortButton;
        if (playerDeck == draftManager.player1Deck){
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
            playerDeck.deck = this.SortByPickOrder(playerDeck.deck);
            sortButton.textContent = "Sort by size";
        }else{
            playerDeck.deck = this.SortBySize(playerDeck.deck);
            sortButton.textContent = "Sort by pick order";
        }
        playerDeck.sorted= !playerDeck.sorted;

        //ny display
        for (let i = 0; i < playerDeck.deck.length; i++){
            var img = document.createElement('img');
            deckFigures.appendChild(img);
            img.src = playerDeck.deck[i].card.image;
        }
    }
}

function DraftClick(i){
    //window.alert(evt.currentTarget.src);
    if (draftManager.draftCards[i].inDraft && !draftManager.draftFinished){
        draftManager.PickCard(draftManager.draftCards[i]);
    }
}

function BeginSetup() {
    beginningPopup.classList.add("hidePopup");
    draftManager = new DraftManager(50, 2);
    console.log(draftManager);
    document.getElementById("player1SortDeck").onclick = (evt) => draftManager.SortDeck(draftManager.player1Deck);
    document.getElementById("player2SortDeck").onclick = (evt) => draftManager.SortDeck(draftManager.player2Deck);
}