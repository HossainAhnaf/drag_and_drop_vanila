class UseHorizontalDragableList {
  constructor(element) {

    this.listContainer = element;
    this.dragStartEventName = this.isTouchDevice ? "touchstart" : "mousedown"
    this.dragMoveHandlerName = this.isTouchDevice ? "touchmove" : "mousemove"
    this.dragEndEventName = this.isTouchDevice ? "touchend" : "mouseup"
    
    
    this.isTouchDevice = ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0);

    this.touchDeviceScanInterval = setInterval(() => {
      this.isTouchDevice = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0);
      }, 3000)
    this.init()
  }
  init() {
    Array.from(this.listContainer.children).forEach((item) => {
      item.addEventListener(this.dragStartEventName, this.#dragStartHandler.bind(this))
      item.addEventListener(this.dragEndEventName, this.#dragEndHandler.bind(this))
    })
  }

  #dragStartHandler(e) {
    console.log(this.isTouchDevice);

    const startYOffset = this.isTouchDevice ? e.touches[0].clientY : e.clientY
  
    e.currentTarget.setAttribute("data-dragging", "true");
    e.currentTarget.addEventListener(this.dragMoveHandlerName, (e) => this.#dragMoveHandler(e, startYOffset))
  }
  #dragMoveHandler(e, startYOffset) {
    const clientY = this.isTouchDevice ? e.touches[0].clientY : e.clientY
    if (e.currentTarget.getAttribute("data-dragging") == "true") {
      e.currentTarget.style.top = clientY - startYOffset + "px";
    }

  }
  #dragEndHandler({ currentTarget }) {
    currentTarget.setAttribute("data-dragging", "false");
    currentTarget.removeEventListener("mousemove", this.#dragMoveHandler)
  }


}