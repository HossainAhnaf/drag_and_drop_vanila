class UseHorizontalDragableList {

  constructor(element) {
    this.listContainer = element;

    this.isTouchDevice = ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0);

    this.dragStartEventName = this.isTouchDevice ? "touchstart" : "mousedown"
    this.dragMoveHandlerName = this.isTouchDevice ? "touchmove" : "mousemove"
    this.dragEndEventName = this.isTouchDevice ? "touchend" : "mouseup"

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
    this.draggableElements.forEach((item, index) => {
      item.setAttribute("draggable", "false");
      item.setAttribute("data-visual-index", index);
      item.style.setProperty("z-index", "0")
      item.addEventListener(this.dragStartEventName, this.#dragStartHandler.bind(this))
      item.addEventListener(this.dragEndEventName, this.#dragEndHandler.bind(this))
      if (!this.isTouchDevice)
        item.addEventListener("mouseleave", this.#dragEndHandler.bind(this))

    })

  }

  #updateState(newElm, newDraggingElementVisualIndex) {

    function updateDraggingState() {
      if (newElm) {
        this.draggingState.elm = newElm
        this.draggingState.startRect = newElm.getBoundingClientRect()
      }
      this.draggingState.visualIndex = newDraggingElementVisualIndex
      this.draggingState.elm.setAttribute("data-visual-index", newDraggingElementVisualIndex)
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
        if (visualIndex === newDraggingElementVisualIndex - 1) {
          this.prevState.elm = elm
          this.prevState.rect = elm.getBoundingClientRect()
        }
        else if (visualIndex === newDraggingElementVisualIndex + 1) {
          this.nextState.elm = elm
          this.nextState.rect = elm.getBoundingClientRect()
        }
      }
    }
    updateDraggingState.bind(this)()
    updateNextPrevState.bind(this)()
  }

  #dragStartHandler(e) {
    this.#updateState(e.currentTarget, parseInt(e.currentTarget.getAttribute("data-visual-index")))

    this.startYOffset = this.isTouchDevice ? e.touches[0].clientY : e.clientY

    this.draggingState.elm.setAttribute("data-dragging", "true");
    this.draggingState.elm.style.setProperty("z-index", "1")


    this.draggingState.elm.addEventListener(this.dragMoveHandlerName, this.#dragMoveHandler.bind(this))
  }

  #dragMoveHandler(e) {
    if (this.draggingState.elm?.getAttribute("data-dragging") == "true") {
      const currentTranslateY = (this.isTouchDevice ? e.touches[0].clientY : e.clientY) - this.startYOffset
      this.draggingState.elm.style.setProperty("transform", `translateY(${(currentTranslateY)}px)`)
      const draggingElmRect = this.draggingState.elm.getBoundingClientRect()
      const isPrevElementDraggedOver = (this.prevState.rect && draggingElmRect.top <= this.prevState.rect.top + this.prevState.rect.height / 2)
      const isNextElementDraggedOver = (this.nextState.rect && draggingElmRect.top >= this.nextState.rect.top - this.nextState.rect.height / 2)

      if (isPrevElementDraggedOver || isNextElementDraggedOver)
        this.#dragOverHandler(isPrevElementDraggedOver ? { ...this.prevState, value: -1 } : { ...this.nextState, value: 1 })

    }
  }

  #dragOverHandler({ elm: dragOverElement, rect: dragOverElmRect, value }) {
    const oldTransformValue = /\d+/.exec(dragOverElement.style.getPropertyValue("transform"))
    const oldTranslateY = (oldTransformValue ? parseInt(oldTransformValue[0]) : 0)
    dragOverElement.style.setProperty("transform", `translateY(${this.draggingState.startRect.top - dragOverElmRect.top - (value === -1 ? oldTranslateY : -oldTranslateY)}px)`)
    dragOverElement.setAttribute("data-visual-index", this.draggingState.visualIndex)
    this.draggingState.startRect = dragOverElmRect
    this.#updateState(null, this.draggingState.visualIndex + value)
  }

  #dragEndHandler() {
    const { elm } = this.draggingState;
    if (elm) {
      elm.setAttribute("data-dragging", "false");
      elm.style.setProperty("z-index", "0");
      elm.removeEventListener(this.dragMoveHandlerName, this.#dragMoveHandler);
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