
const textarea = document.querySelector("textarea");
const saveStatus = document.getElementById('saveStatus')
let StoredContent = localStorage.getItem("__XenOS_Apps_Notes_Content_ANOTE") || "";
const notename = document.getElementById('notename').value
 var reWhiteSpace = new RegExp("/^\s+$/");
const { parent } = xen;
textarea.value = StoredContent;


var status = false; 
document.addEventListener("keydown", function(event) {
  console.log(notename)
  
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    console.log('hi')
    event.preventDefault();
      saveStatus.innerText = 'Saved!'

if (notename !== "" && reWhiteSpace.test(notename) || notename !== ""  || reWhiteSpace.test(notename)){
   saveStatus.innerText = 'cannot save' 
} else {
  parent.send("save", notename, textarea.value);
}


    
  } else if(!event.ctrlKey || !event.metaKey) {
     setTimeout(function(){
    saveStatus.innerText = 'unsaved changes! (ctrl+s)'
         }, 1000)
  }
});

