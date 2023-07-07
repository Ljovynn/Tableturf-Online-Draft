document.getElementById("settings").onclick = OpenSettingsPopup;
document.getElementById("closeSettings").onclick = CloseSettingsPopup;

let popup = document.getElementById("popup");

function OpenSettingsPopup(){
    popup.classList.add("openPopup");
}

function CloseSettingsPopup(){
    popup.classList.remove("openPopup");
}