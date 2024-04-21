class DraggingState{
  constructor(){
  this.elm = null
  this.startRect = null
  this.dummyElement = null
  this._visualIndex = NaN
  }
  get visualIndex() {
    return this._visualIndex
  }
  set visualIndex(val) {
    this._visualIndex = val
    this.elm?.setAttribute("data-visual-index", val)
    this.dummyElement?.setAttribute("data-visual-index", val)
  }
  updateDummyElement(top){
    const dummyElement = this.elm?.cloneNode(true)
    const { width } = getComputedStyle(this.elm)
    dummyElement.style.removeProperty("transition")
    dummyElement.style.setProperty("width", width)
    dummyElement.style.setProperty("position", "fixed")
    dummyElement.style.setProperty("top", top + "px")
    this.dummyElement = dummyElement
  }
}

class HorizontalDragableList {

  constructor(element) {
    this.listContainer = element;
    this.draggableElements = Array.from(this.listContainer.querySelectorAll('.draggable'))
    this.draggingState = new DraggingState()
    this.nextState = {}
    this.prevState = {}
    this.draggableElementRects = []
    this.init()
  }

  init() {
    window.addEventListener('load',this.#updateMinMaxYOffset.bind(this))
    window.addEventListener('resize',()=>{
      this.#updateMinMaxYOffset.bind(this)()
      this.#updateRects.bind(this)()
    })

    this.draggableElements.forEach((item, index) => {
      item.style.setProperty("transition", "transform 0.3s")
      item.style.setProperty("touch-action", "none")

      item.setAttribute("data-visual-index", index);
      item.addEventListener("pointerdown", this.#dragStartHandler.bind(this))
      this.draggableElementRects.push(item.getBoundingClientRect())
    })
  }
  #updateMinMaxYOffset() {
    const { top, bottom } = this.listContainer.getBoundingClientRect();
    this.maxYOffset = top;
    this.minYOffset = bottom;
  }
  #updateRects() {
    this.draggableElements.forEach((item, index) => {
      this.draggableElementRects[index] = item.getBoundingClientRect();
    })
  }
  #updateNextPrevState() {
    this.prevState = {}
    this.nextState = {}
    for (const elm of this.draggableElements) {
      if (this.nextElement && this.prevElement)
        break;
      const visualIndex = parseInt(elm.getAttribute("data-visual-index"))
      if (visualIndex === this.draggingState.visualIndex - 1) {
        this.prevState.elm = elm
        this.prevState.rect = this.draggableElementRects[visualIndex]
      }
      else if (visualIndex === this.draggingState.visualIndex + 1) {
        this.nextState.elm = elm
        this.nextState.rect = this.draggableElementRects[visualIndex]
      }
    }
  }

  #dragStartHandler(e) {
    this.draggingState.elm = e.currentTarget
    this.draggingState.startRect = e.currentTarget.getBoundingClientRect()
    this.draggingState.updateDummyElement(this.draggingState.startRect.top)
    this.draggingState.visualIndex = parseInt(e.currentTarget.getAttribute("data-visual-index"))
    this.draggingState.dummyElement.setAttribute("data-dragging", "true");
    e.currentTarget.style.setProperty("opacity", "0")    
    this.draggingState.dummyElement.style.setProperty("cursor", "grabbing")
    document.documentElement.style.setProperty("cursor", "grabbing")
    this.listContainer.appendChild(this.draggingState.dummyElement)
     this.draggableElements.forEach((item) => item.style.setProperty("user-select", "none"))
    this.#updateNextPrevState()

    this.startYOffset = e.clientY
    document.onpointermove = this.#dragMoveHandler.bind(this)
    document.onpointerup = this.#dragEndHandler.bind(this)
  }

  #dragMoveHandler(e) {
    const draggingDummyElmRect = this.draggingState.dummyElement.getBoundingClientRect()
    const currentTranslateY = Math.min(this.minYOffset, Math.max(e.clientY, this.maxYOffset)) - this.startYOffset
    this.draggingState.dummyElement.style.setProperty("transform", `translateY(${(currentTranslateY)}px)`)
    const isPrevElementDraggedOver = (this.prevState.rect && draggingDummyElmRect.top <= this.prevState.rect.top + this.prevState.rect.height / 2)
    const isNextElementDraggedOver = (this.nextState.rect && draggingDummyElmRect.top >= this.nextState.rect.top - this.nextState.rect.height / 2)

    if (isPrevElementDraggedOver || isNextElementDraggedOver)
      this.#changeDraggingElementVisualIndex(isPrevElementDraggedOver ? this.prevState : this.nextState)

  }

  #changeDraggingElementVisualIndex({ elm: dragOverElement, rect: dragOverElmRect }) {
    const oldTransformValue = /\d+/.exec(dragOverElement.style.getPropertyValue("transform"))
    const oldTranslateY = (oldTransformValue ? parseInt(oldTransformValue[0]) : 0)
    const dragOverElementVisualIndex = parseInt(dragOverElement.getAttribute("data-visual-index"))
    dragOverElement.style.setProperty("transform", `translateY(${this.draggingState.startRect.top - dragOverElmRect.top - (this.draggingState.visualIndex - dragOverElementVisualIndex === 1 ? oldTranslateY : -oldTranslateY)}px)`)
    dragOverElement.setAttribute("data-visual-index", this.draggingState.visualIndex)
    this.draggingState.visualIndex = dragOverElementVisualIndex
    this.draggingState.startRect = dragOverElmRect
    this.#updateNextPrevState()
  }

  #dragEndHandler() {
    this.draggingState.elm.style.removeProperty("opacity")
    this.draggingState.elm = null;
    document.documentElement.style.removeProperty("cursor")
    this.listContainer.removeChild(this.draggingState.dummyElement)
    document.onpointermove = null;
    document.onpointerup = null;
    this.#updateSerialOfListContainerChilds();
  }

  #updateSerialOfListContainerChilds() {
    Array.from(this.listContainer.children).forEach((elm) => elm.classList.contains("draggable") && this.listContainer.removeChild(elm))
    this.draggableElements.sort((a, b) => a.getAttribute("data-visual-index") - b.getAttribute("data-visual-index"))
    for (const elm of this.draggableElements) {
      elm.style.removeProperty("user-select")
      elm.style.removeProperty("transform")
      this.listContainer.appendChild(elm);
    }
  }
}
