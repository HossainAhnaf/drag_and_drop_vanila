class HorizontalDragableList {

  constructor(element) {
    this.listContainer = element;
    this.draggableElements = Array.from(this.listContainer.querySelectorAll('.draggable'))
    this.draggingState = {
      elm: null,
      visualIndex: NaN,
      startRect: null
    }
    this.nextState = { elm: null, rect: null }
    this.prevState = { elm: null, rect: null }

    this.init()
  }

  init() {
   window.addEventListener('load',this.#updateMinMaxYOffset.bind(this))
   window.addEventListener('resize', this.#updateMinMaxYOffset.bind(this))

    this.draggableElements.forEach((item, index) => {
      item.setAttribute("draggable", "false");
      item.setAttribute("data-visual-index", index);
      item.style.setProperty("touch-action", "none");
      item.style.setProperty("z-index", "0")
      item.addEventListener("pointerdown", this.#dragStartHandler.bind(this))

    })
  }
  #updateMinMaxYOffset() {
    const {top,bottom} = this.listContainer.getBoundingClientRect();
    this.maxYOffset = top;
    this.minYOffset = bottom;
  }
  #updateState(newElm, draggingElementNewVisualIndex) {

    function updateDraggingState() {
      if (newElm) {
        this.draggingState.elm = newElm
        this.draggingState.startRect = newElm.getBoundingClientRect()
      }
      this.draggingState.visualIndex = draggingElementNewVisualIndex
      this.draggingState.elm.setAttribute("data-visual-index", draggingElementNewVisualIndex)
    }

    function updateNextPrevState() {
      this.nextState.elm = null
      this.prevState.elm = null

      this.prevState.rect = null
      this.nextState.rect = null

      for (const elm of this.draggableElements) {
        if (this.nextElement && this.prevElement)
          break;
        const visualIndex = parseInt(elm.getAttribute("data-visual-index"))
        if (visualIndex === draggingElementNewVisualIndex - 1) {
          this.prevState.elm = elm
          this.prevState.rect = elm.getBoundingClientRect()
        }
        else if (visualIndex === draggingElementNewVisualIndex + 1) {
          this.nextState.elm = elm
          this.nextState.rect = elm.getBoundingClientRect()
        }
      }
    }
    updateDraggingState.bind(this)()
    updateNextPrevState.bind(this)()
  }
  #changeDraggingElementVisualIndex({ elm: dragOverElement, rect: dragOverElmRect}) {
    const oldTransformValue = /\d+/.exec(dragOverElement.style.getPropertyValue("transform"))
    const oldTranslateY = (oldTransformValue ? parseInt(oldTransformValue[0]) : 0)
    const dragOverElementVisualIndex = parseInt(dragOverElement.getAttribute("data-visual-index")) 
    dragOverElement.style.setProperty("transform", `translateY(${this.draggingState.startRect.top - dragOverElmRect.top - (this.draggingState.visualIndex - dragOverElementVisualIndex === 1 ? oldTranslateY : -oldTranslateY)}px)`)
    dragOverElement.setAttribute("data-visual-index", this.draggingState.visualIndex)
    this.draggingState.startRect = dragOverElmRect
    this.#updateState(null, dragOverElementVisualIndex)
  }
  
  #dragStartHandler(e) {
    this.#updateState(e.currentTarget, parseInt(e.currentTarget.getAttribute("data-visual-index")))
    this.startYOffset = e.clientY
    this.draggingState.elm.setAttribute("data-dragging", "true");
    this.draggingState.elm.style.setProperty("z-index", "1")
    document.onpointermove = this.#dragMoveHandler.bind(this)
    document.addEventListener("pointerup", this.#dragEndHandler.bind(this))
    document.documentElement.style.setProperty("cursor", "grabbing")
    this.draggingState.elm.style.setProperty("cursor", "grabbing")
  }

  #dragMoveHandler(e) {
    if (this.draggingState.elm?.getAttribute("data-dragging") == "true") {
    const draggingElmRect = this.draggingState.elm.getBoundingClientRect()
    const currentTranslateY = Math.min(this.minYOffset,Math.max(e.clientY,this.maxYOffset)) - this.startYOffset 
    this.draggingState.elm.style.setProperty("transform", `translateY(${(currentTranslateY)}px)`)
    //check if the dragged element is dragged over the prev or next element
    const isPrevElementDraggedOver = (this.prevState.rect && draggingElmRect.top <= this.prevState.rect.bottom)
    const isNextElementDraggedOver = (this.nextState.rect && draggingElmRect.bottom >= this.nextState.rect.top)
    if (isPrevElementDraggedOver || isNextElementDraggedOver)
      this.#dragOverHandler(isPrevElementDraggedOver,draggingElmRect)
  }
}

 #dragOverHandler(isPrevElementDraggedOver,draggingElmRect)  {
  const { elm,rect } = (isPrevElementDraggedOver ? this.prevState : this.nextState )
  elm.style.setProperty("transition", `transform 333ms`)
  elm.classList.add("drag-over")
 console.clear()
  console.log();
   const isDraggedHalfElement = (isPrevElementDraggedOver ? (draggingElmRect.top <= rect.bottom - rect.height / 2) : (draggingElmRect.bottom >= rect.top + rect.height / 2) )
   if (isDraggedHalfElement){
     this.#changeDraggingElementVisualIndex(isPrevElementDraggedOver ? this.prevState : this.nextState)
     document.onpointermove = null
    }

    setTimeout(() => {
      document.onpointermove = this.#dragMoveHandler.bind(this)

    },333)
  // const isPrevElementDraggedOver = (this.prevState.rect && draggingElmRect.top <= this.prevState.rect.top + this.prevState.rect.height / 2)
  // const isNextElementDraggedOver = (this.nextState.rect && draggingElmRect.top >= this.nextState.rect.top - this.nextState.rect.height / 2)
  // if (isPrevElementDraggedOver || isNextElementDraggedOver)
  //   this.#changeDraggingElementVisualIndex(isPrevElementDraggedOver ? this.prevState : this.nextState)
 }
 #dragLeaveHandler(e) {
 }
  #dragEndHandler() {
    const { elm } = this.draggingState;
    if (elm) {
      elm.setAttribute("data-dragging", "false");
      elm.style.setProperty("z-index", "0");
      document.removeEventListener("pointermove",this.#dragMoveHandler.bind(this))
      document.removeEventListener("pointerup", this.#dragEndHandler.bind(this))
      document.documentElement.style.removeProperty("cursor")
      this.draggingState.elm.style.removeProperty("cursor")
      this.draggingState.elm = null;
      this.#updateDragableElements();
    }
  }

  #updateDragableElements() {
    Array.from(this.listContainer.children).forEach((elm) => elm.classList.contains("draggable") && this.listContainer.removeChild(elm))
    this.draggableElements.sort((a, b) => a.getAttribute("data-visual-index") - b.getAttribute("data-visual-index"))
    for (const elm of this.draggableElements) {
      elm.style.removeProperty("transform")
      this.listContainer.appendChild(elm);
    }
  }
}