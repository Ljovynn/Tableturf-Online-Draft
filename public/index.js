document.getElementById("settings").onclick = OpenSettingsPopup;
document.getElementById("closeSettings").onclick = CloseSettingsPopup;

let linkBox = document.getElementById("link");
let player1NameDoc = document.getElementById("player1");
let player2NameDoc = document.getElementById("player2");
let draftSizeDoc = document.getElementById("draftSize");
let minSpecialsDoc = document.getElementById("312Size");
let btn = document.getElementById("generateDraft");

let popup = document.getElementById("popup");

btn.addEventListener("click", () => {
    let player1 = player1NameDoc.value;
    let player2 = player2NameDoc.value;
    let draftSize = draftSizeDoc.value;
    let minSpecials = minSpecialsDoc.value;

    console.log(player1NameDoc);
    console.log("innarhtml: namn: "  + player1);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "GenerateNewDraft", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        player1Name: player1,
        player2Name: player2,
        draftSize: +draftSize,
        minSpecials: +minSpecials
    }));
    xhr.onload = function() {

    console.log(this.responseText);
    var data = JSON.parse(this.responseText);
    linkBox.innerText = "https://tableturfdraft.com/draft/" + data;
    console.log(data);
    }   
});

function OpenSettingsPopup(){
    popup.classList.add("openPopup");
}

function CloseSettingsPopup(){
    popup.classList.remove("openPopup");
}