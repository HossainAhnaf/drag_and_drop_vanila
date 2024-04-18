class useHorizontalDragableList {
  constructor(element) {
    this.listContainer = element;   
    this.init();
  }
  init(){
    Array.from(this.listContainer.children).forEach((item) => {
    item.setAttribute("draggable", "true");
    item.addEventListener("dragstart", (e) => {
      item.classList.add("dragging");
    });

    
    item.addEventListener("dragend", (e) => {
      item.classList.remove("dragging");
    });
        
    item.addEventListener("dragover", (e) => {
      if (!item.classList.contains("dragging")) {
      item.classList.add("draggover");
      }
    });
    item.addEventListener("dragleave", (e) => {
        item.classList.remove("draggover");
    });
    
  })

  }
}