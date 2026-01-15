// ------------------
// MARKDOWN EDITOR FIXED
// ------------------
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const toggleBtn = document.getElementById("mode-toggle");
const toolbar = document.getElementById("toolbar");
let editMode = true;

// Load saved content
editor.value = localStorage.getItem("md") || "# Capture Markdown\n\nWorks offline 🚀";
preview.innerHTML = marked.parse(editor.value);

// Toggle view/edit
function updateMode() {
  if(editMode){
    editor.style.display = "block";
    preview.style.display = "none";
    toolbar.style.display = "flex";
    toggleBtn.textContent = "✏️";
  } else {
    editor.style.display = "none";
    preview.style.display = "block";
    toolbar.style.display = "none";
    toggleBtn.textContent = "👁";
  }
}
updateMode();
toggleBtn.addEventListener("click", () => { editMode = !editMode; updateMode(); });

// Show toolbar on focus (mobile)
editor.addEventListener("focus", () => { if(editMode) toolbar.style.display = "flex"; });
editor.addEventListener("blur", () => { if(editMode) toolbar.style.display = "none"; });

// Live preview
editor.addEventListener("input", () => {
  localStorage.setItem("md", editor.value);
  preview.innerHTML = marked.parse(editor.value);
});

// Toolbar click (works for dropdown too)
toolbar.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if(!btn) return;

  const action = btn.dataset.action;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  let selected = editor.value.substring(start,end);

  let before = '', after = '';

  switch(action){
    case 'bold': before='**'; after='**'; break;
    case 'italic': before='*'; after='*'; break;
    case 'underline': before='<u>'; after='</u>'; break;
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
      const level = parseInt(action[1]);
      before = '#'.repeat(level) + ' '; after=''; break;
    case 'ul': before='- '; after=''; break;
    case 'ol': before='1. '; after=''; break;
    case 'link': before='['; after=']()'; break;
  }

  if(selected.length === 0){
    editor.value = editor.value.substring(0,start) + before + after + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + before.length;
  } else {
    // Toggle if already wrapped
    if(selected.startsWith(before) && selected.endsWith(after)){
      selected = selected.slice(before.length, selected.length - after.length);
    } else {
      selected = before + selected + after;
    }
    editor.value = editor.value.substring(0,start) + selected + editor.value.substring(end);
    editor.selectionStart = start;
    editor.selectionEnd = start + selected.length;
  }

  editor.focus();
  localStorage.setItem("md", editor.value);
  preview.innerHTML = marked.parse(editor.value);
});
