import { auth, shouldAuthenticate, shouldProvideRoomID } from './auth.js'
const { Color } = window.zeaEngine

const xmlns = `http://www.w3.org/2000/svg`
class SVGDialog extends HTMLElement {
  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })

    this.modal = document.createElement('div')
    this.modal.classList.add('modal')
    shadowRoot.appendChild(this.modal)

    this.modalContent = document.createElement('div')
    this.modalContent.classList.add('modal-content')
    this.modal.appendChild(this.modalContent)

    this.modalContent.innerHTML = `
        <div class="container" id="container">
          <svg id="svgContainer" xmlns="${xmlns}"></svg>
          <progress id="progress" class="hidden" max="100"></progress>
        </div>
        <text id="partId">Part:</text>
        <button type="close" id="close">Close</button>
        `

    // When the user clicks on <span> (x), close the modal
    const loginBtn = this.shadowRoot.getElementById('close')
    loginBtn.onclick = async () => {
      this.close()
    }

    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
/* The Modal (background) */
.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content/Box */
.modal-content {
  background-color: #eeeeee;
  margin: 5% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 60%; /* Could be more or less, depending on screen size */
}


/* The Close Button */
.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

/* Set a style for all buttons */
button {
  background-color: #f9ce03;
  color: black;
  padding: 14px 20px;
  margin: 8px 0;
  border: none;
  cursor: pointer;
  width: 100%;
}

/* Add a hover effect for buttons */
button:hover {
  opacity: 0.8;
}

/* Extra style for the cancel button (red) */
.cancelbtn {
  width: auto;
  padding: 10px 18px;
  background-color: #f44336;
}


/* Avatar image */
img.avatar {
  height: 40px;
}

/* Add padding to containers */
.container {
  padding: 6px;
  margin: 6px;
}

/* The "Forgot password" text */
span.psw {
  float: right;
  padding-top: 16px;
}

/* Change styles for span and cancel button on extra small screens */
@media screen and (max-width: 300px) {
  span.psw {
    display: block;
    float: none;
  }
  .cancelbtn {
    width: 100%;
  }
}


#progress {
  width: 100%;
}
.hidden {
  visibility: hidden;
}

`)
    )
    shadowRoot.appendChild(styleTag)
  }

  show(baseImageUrl, numParts) {
    this.modal.style.display = 'block'
    const svgContainer = this.shadowRoot.getElementById('svgContainer')
    while (svgContainer.lastChild) {
      svgContainer.removeChild(svgContainer.lastChild)
    }

    // Add the background image.
    const image = document.createElementNS(xmlns, 'image')
    image.setAttribute('href', baseImageUrl)
    svgContainer.appendChild(image)

    this.numParts = numParts
    this.addedParts = 0
    const progress = this.shadowRoot.getElementById('progress')
    progress.value = 0
    progress.classList.remove('hidden')
  }

  addSvg(part, svgElem, boxWidth, boxHeight, labelText, labelPos2D, labelLineEnd2D) {
    const svgContainer = this.shadowRoot.getElementById('svgContainer')
    svgContainer.setAttributeNS(null, 'viewBox', '0 0 ' + boxWidth + ' ' + boxHeight)
    svgContainer.setAttribute('width', '100%')
    svgContainer.setAttribute('height', '100%')

    console.log(part.getPath())
    const parseFill = (fillStr) => {
      return fillStr
        .substring(4, fillStr.length - 1)
        .split(',')
        .map((v) => Number.parseInt(v))
    }

    const g = document.createElementNS(xmlns, 'g')
    for (let i = svgElem.children.length - 1; i >= 0; i--) {
      const elem = svgElem.children[i]
      console.log(elem.getAttribute('fill'), elem.getAttribute('stroke'))
      const parts = parseFill(elem.getAttribute('fill'))
      if (parts[0] < 250 || parts[1] < 250 || parts[2] < 250) {
        // elem.setAttribute('fill-opacity', 0.01)
        elem.setAttribute('fill-opacity', 1)
        elem.setAttribute('stroke', 'black')
        elem.setAttribute('stroke-width', 1)
        g.appendChild(elem)
      }
    }
    if (g.firstChild) {
      g.addEventListener('click', () => {
        const partId = this.shadowRoot.getElementById('partId')
        partId.textContent = 'Part:' + part.getPath()
      })
      g.addEventListener('mouseover', () => {
        svgContainer.appendChild(g)
        for (let i = g.children.length - 1; i >= 0; i--) {
          g.children[i].setAttribute('stroke', 'red')
        }
      })
      g.addEventListener('mouseleave', () => {
        for (let i = g.children.length - 1; i >= 0; i--) {
          g.children[i].setAttribute('stroke', 'black')
        }
      })
      svgContainer.appendChild(g)
    } else {
      console.log('no image data for part:', part.getPath())
    }

    const labelLineNode = document.createElementNS(xmlns, 'line')
    labelLineNode.setAttribute('x1', labelLineEnd2D.x)
    labelLineNode.setAttribute('y1', labelLineEnd2D.y)
    labelLineNode.setAttribute('x2', labelPos2D.x)
    labelLineNode.setAttribute('y2', labelPos2D.y)
    labelLineNode.setAttribute('stroke', 'black')
    labelLineNode.setAttribute('stroke-width', 1)
    g.appendChild(labelLineNode)

    // var bbox = labelTextNode.getBBox()
    const circleWidth = 24 // bbox.width + 6

    const labelG = document.createElementNS(xmlns, 'g')
    labelG.setAttribute('transform', `translate(${labelPos2D.x},${labelPos2D.y})`)
    g.appendChild(labelG)
    const labelCircleNode = document.createElementNS(xmlns, 'circle')
    labelCircleNode.setAttribute('r', circleWidth * 0.5)
    labelCircleNode.setAttribute('fill', 'white')
    labelCircleNode.setAttribute('stroke', 'black')
    labelCircleNode.setAttribute('stroke-width', 1)
    labelG.appendChild(labelCircleNode)

    const labelTextNode = document.createElementNS(xmlns, 'text')
    labelTextNode.appendChild(document.createTextNode(labelText))
    labelTextNode.setAttribute('text-anchor', 'middle')
    labelTextNode.setAttribute('y', 6)
    labelTextNode.setAttribute('stroke', 'black')
    labelG.appendChild(labelTextNode)

    this.addedParts++

    const progress = this.shadowRoot.getElementById('progress')
    progress.value = (this.addedParts / this.numParts) * 100

    if (this.addedParts == this.numParts) {
      setTimeout(() => progress.classList.add('hidden'), 1000)
    }
  }

  close() {
    this.modal.style.display = 'none'
  }
}

customElements.define('svg-dialog', SVGDialog)
