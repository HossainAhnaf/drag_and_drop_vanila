class DraggingState {
  constructor() {
    this.elm = null
    this.startRect = null
    this.startYOffset = undefined
    this.maxYOffset = undefined;
    this.minYOffset = undefined;
    this.dummyElement = null
    this._visualIndex = undefined
    this.nextState = {}
    this.prevState = {}
  }
  get visualIndex() {
    return this._visualIndex
  }
  set visualIndex(val) {
    this._visualIndex = val
    this.elm?.setAttribute("data-visual-index", val)
    this.dummyElement?.setAttribute("data-visual-index", val)
  }
  updateDraggingElement(element) {
    this.elm = element
    this.startRect = element.getBoundingClientRect()
    this.updateDummyElement(this.startRect.top)
    this.visualIndex = parseInt(element.getAttribute("data-visual-index"))
    this.dummyElement.classList.add("dragging")
  }
  updateDummyElement(top) {
    const dummyElement = this.elm?.cloneNode(true)
    const { width } = getComputedStyle(this.elm)
    dummyElement.style.removeProperty("transition")
    dummyElement.style.setProperty("width", width)
    dummyElement.style.setProperty("top", `${top}px`)
    dummyElement.style.setProperty("position", "absolute")
    dummyElement.style.setProperty("cursor", "grabbing")

    // dummyElement.style.setProperty("transform", `translateY(${top}px)`)
    this.dummyElement = dummyElement
  }
  updateNextPrevState(draggableElements, draggableElementRects) {
    this.prevState = {}
    this.nextState = {}
    for (const elm of draggableElements) {
      if (this.nextElement && this.prevElement)
        break;
      const visualIndex = parseInt(elm.getAttribute("data-visual-index"))
      if (visualIndex === this.visualIndex - 1) {
        this.prevState.elm = elm
        this.prevState.rect = draggableElementRects[visualIndex]
      }
      else if (visualIndex === this.visualIndex + 1) {
        this.nextState.elm = elm
        this.nextState.rect = draggableElementRects[visualIndex]
      }
    }
  }
  updateMinMaxYOffset(container) {
    const { top, bottom } = container.getBoundingClientRect();
    this.maxYOffset = top;
    this.minYOffset = bottom;
  }
}

class DragAndDrop {

  constructor(element) {
    this.listContainer = element;
    this.draggableElements = Array.from(this.listContainer.querySelectorAll('.draggable'))
    this.draggingState = new DraggingState()
    this.draggableElementRects = []
    this.init()
  }

  init() {
    window.addEventListener('load', () => this.draggingState.updateMinMaxYOffset(this.listContainer))

    window.addEventListener('resize', () => {
      this.draggingState.updateMinMaxYOffset(this.listContainer)
      this.#updateRects.bind(this)()
    })
    window.addEventListener('scroll', this.#updateRects.bind(this))
    this.draggableElements.forEach((item, index) => {
      item.style.setProperty("transition", "transform 0.3s")
      item.style.setProperty("touch-action", "none")

      item.setAttribute("data-visual-index", index);
      item.addEventListener("pointerdown", this.#dragStartHandler.bind(this))
      this.draggableElementRects.push(item.getBoundingClientRect())
    })
  }

  #dragStartHandler({ clientY, currentTarget }) {
    this.draggingState.updateDraggingElement(currentTarget)
    this.draggingState.updateNextPrevState(this.draggableElements, this.draggableElementRects)
    currentTarget.style.setProperty("opacity", "0")
    document.documentElement.style.setProperty("cursor", "grabbing")
    this.listContainer.appendChild(this.draggingState.dummyElement)
    this.draggableElements.forEach((item) => item.style.setProperty("user-select", "none"))
    this.draggingState.startYOffset = clientY
    document.onpointermove = this.#dragMoveHandler.bind(this)
    document.onpointerup = this.#dragEndHandler.bind(this)
  }

  #dragMoveHandler({ clientY }) {
    const {
      dummyElement,
      startYOffset,
      maxYOffset,
      minYOffset,
      prevState,
      nextState
    } = this.draggingState


    const draggingDummyElmRect = dummyElement.getBoundingClientRect()
    const currentTranslateY = Math.min(minYOffset, Math.max(clientY, maxYOffset)) - startYOffset
    dummyElement.style.setProperty("transform", `translateY(${(currentTranslateY)}px)`)

    //check for drgged over    
    this.#checkForHalfDraggedOver.bind(this)(prevState, nextState, draggingDummyElmRect)
    //check for out of bounds 
    // const outOFBoundsDirection = (draggingDummyElmRect.top <= 30 ? "up" : draggingDummyElmRect.bottom >= window.innerHeight ? "down" : null)
    // if (outOFBoundsDirection) {
    //   const value = outOFBoundsDirection === "up" ? -2 : 2
    //   if (this.autoScrollInterval)
    //     clearInterval(this.autoScrollInterval)
    //   this.autoScrollInterval = setInterval(() => {
    //     window.scrollBy(0, value)
    //     this.#checkForHalfDraggedOver.bind(this)(prevState, nextState, draggingDummyElmRect)
    //   }, 10)
    // } else {
    //   if (this.autoScrollInterval)
    //     clearInterval(this.autoScrollInterval)
    // }
  }
  #checkForHalfDraggedOver( prevState, nextState, draggingDummyElmRect) {
    const isPrevElementDraggedOver = (prevState.rect && draggingDummyElmRect.top <= prevState.rect.top + prevState.rect.height / 2)
    const isNextElementDraggedOver = (nextState.rect && draggingDummyElmRect.top >= nextState.rect.top - nextState.rect.height / 2)
    if (isPrevElementDraggedOver || isNextElementDraggedOver)
      this.#changeDraggingElementVisualIndex(isPrevElementDraggedOver ? prevState : nextState)

  } 
  #changeDraggingElementVisualIndex({ elm: dragOverElement, rect: dragOverElmRect }) {
    const oldTransformValue = /\d+/.exec(dragOverElement.style.getPropertyValue("transform"))
    const oldTranslateY = (oldTransformValue ? parseInt(oldTransformValue[0]) : 0)
    const dragOverElementVisualIndex = parseInt(dragOverElement.getAttribute("data-visual-index"))
    dragOverElement.style.setProperty("transform", `translateY(${this.draggingState.startRect.top - dragOverElmRect.top - (this.draggingState.visualIndex - dragOverElementVisualIndex === 1 ? oldTranslateY : -oldTranslateY)}px)`)
    dragOverElement.setAttribute("data-visual-index", this.draggingState.visualIndex)
    this.draggingState.visualIndex = dragOverElementVisualIndex
    this.draggingState.startRect = dragOverElmRect
    this.draggingState.updateNextPrevState(this.draggableElements, this.draggableElementRects)
  }

  #dragEndHandler() {
    this.draggingState.elm.classList.remove("dragging")
    this.draggingState.elm.style.removeProperty("opacity")
    this.draggingState.elm = null;
    document.documentElement.style.removeProperty("cursor")
    this.listContainer.removeChild(this.draggingState.dummyElement)
    document.onpointermove = null;
    document.onpointerup = null;
    this.#updateSerialOfListContainerChilds();
  }

  #updateSerialOfListContainerChilds() {
    this.draggableElements.forEach((elm) => this.listContainer.removeChild(elm))
    this.draggableElements.sort((a, b) => a.getAttribute("data-visual-index") - b.getAttribute("data-visual-index"))
    for (const elm of this.draggableElements) {
      elm.style.removeProperty("user-select")
      elm.style.removeProperty("transform")
      this.listContainer.appendChild(elm);
    }
  }
  #updateRects() {
    console.clear()
    console.log(this.draggingState.dummyElement?.getBoundingClientRect().top,this.draggingState.prevState.rect);
    this.draggableElements.forEach((item, index) => {
      this.draggableElementRects[index] = item.getBoundingClientRect();
    })
  }
  #autoScroll(outOFBoundsDirection) {

  }
}
