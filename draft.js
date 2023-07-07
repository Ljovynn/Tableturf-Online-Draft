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

        /*cards = cards.map(card=>{
            const title = card.attributes.title;
            const mass = card.attributes.mass;
            const image = card.attributes.image.url;
            return{title, id, mass, image};
        })*/

class DraftManager{
    amountOfDifferentCards = 209;
    size;
    minSpecials;
    currentSpecials;
    draftCardList;
    unusedSpecials = this.CreateSortedSpecialAttackList();
    draftCards;
    constructor(size, minSpecials){
        this.size = size;
        this.currentSpecials = 0;
        this.minSpecials = minSpecials;
        this.draftCardList = [];
        this.draftCards = [];
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

        this.CreateCards();

        this.draftCards = this.SortBySize(this.draftCards);

        console.log(this.draftCards);

        this.DisplayDraftBox();
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
        /*array.sort(function(a, b) {
            return parseFloat(a.size) - parseFloat(b.size);
        });*/
        
        array.sort((a, b) => a.size - b.size || a.id - b.id);

        return array;
    }

    DisplayDraftBox(){
        var ul = document.createElement('ul');
        ul.setAttribute('id','draftBoxList');
        
        currentTurnMessage.innerHTML = "hål";
        for (let i = 0; i < this.draftCards.length; i++){
            var img = document.createElement('img');
            document.getElementById('draftFigures').appendChild(img);
                //img.setAttribute('class','draftBoxCard');
                
                //console.log(this.draftCards[i]);
                img.src = this.draftCards[i].image;
                //console.log(img.src);

                img.addEventListener('click', this.DraftClick(this.draftCards[i]));
                //img.setAttribute("url", this.draftCards[i].attributes.image);
                //li.innerHTML=li.innerHTML + element;
        }
    }

    CreateCards(){
        for (let i = 0; i < this.draftCardList.length; i++){
            let tempCard = allCards[this.draftCardList[i] - 1];
            let title = tempCard.title;
            let size = tempCard.size;
            let image = tempCard.image;
            this.draftCards[i] = new Card(this.draftCardList[i], title, size, image);
        }
    }

    DraftClick(id){

    }
}
/*
class DraftCard{
    card;
    inDraft = true;
    owner = 1;
    constructor(id){
        let tempCard = allCards[id - 1];
        let title = tempCard.title;
        let size = tempCard.size;
        let image = tempCard.image;
        this.card = new Card(id, title, size, image);
    }
}*/

function BeginSetup() {
    beginningPopup.classList.add("hidePopup");
    this.draftManager = new DraftManager(50, 2);
}