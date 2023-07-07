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
    constructor(id){
        let tempCard = allCards[id - 1];
        let title = tempCard.title;
        let size = tempCard.size;
        let image = tempCard.image;
        this.card = new Card(id, title, size, image);
    }
}

class DraftManager{
    amountOfDifferentCards = 209;
    size;
    
    draftCardList = [];
    draftCards  = [];

    player1Deck = [];
    player2Deck = [];

    player1DeckSizeText = document.getElementById("player1DeckSize");
    player2DeckSizeText = document.getElementById("player2DeckSize");

    minSpecials;
    currentSpecials = 0;
    unusedSpecials = this.CreateSortedSpecialAttackList();

    currentPlayer = 1;
    turnsUntilSwitchSide = 1;

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

    DisplayDraftCards(){
        for (let i = 0; i < this.draftCards.length; i++){
            var img = document.createElement('img');
            document.getElementById('draftFigures').appendChild(img);
            img.src = this.draftCards[i].card.image;
            img.addEventListener('click', DraftClick);
            img.addEventListener('click',(evt) => DraftClick(i));

            this.draftCards[i].documentImg = img;
        }
    }

    pickCard(draftCard){
        if (this.currentPlayer == 1){
            let deckId = "player1Deck"
            this.AddCardToPlayer(this.player1Deck, this.player1DeckSizeText, draftCard.card, deckId)
        } else{
            let deckId = "player2Deck"
            this.AddCardToPlayer(this.player2Deck, this.player2DeckSizeText, draftCard.card, deckId)
        }
    }

    AddCardToPlayer(playerDeck, deckSizeText, card, ){
        const id = card.id;
        const title = card.attributes.title;
        const size = card.attributes.size;
        const image = card.attributes.image.url;
        newCard = new Card(id, title, size, image);
        playerDeck.push(card);
        deckSizeText += newCard.size;
    }
}

function DraftClick(index){
    //window.alert(evt.currentTarget.src);
    currentTurnMessage.innerHTML = index;
}

function BeginSetup() {
    beginningPopup.classList.add("hidePopup");
    this.draftManager = new DraftManager(50, 2);
}