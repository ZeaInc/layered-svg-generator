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
        <div class="container" id="container"">
          <svg id="svgContainer" xmlns="${xmlns}"></svg>
        </div>
        
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
  margin: 15% auto; /* 15% from the top and centered */
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

/* Full-width inputs */
input[type=text], input[type=password] {
  width: 100%;
  padding: 12px 20px;
  margin: 8px 0;
  display: inline-block;
  border: 1px solid #ccc;
  box-sizing: border-box;
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

/* Center the avatar image inside this container */
.imgcontainer {
  text-align: center;
  margin: 24px 0 12px 0;
  overflow:auto;
}

/* Avatar image */
img.avatar {
  height: 40px;
}

/* Add padding to containers */
.container {
  padding: 16px;
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

`)
    )
    shadowRoot.appendChild(styleTag)
  }

  show() {
    this.modal.style.display = 'block'
    const svgContainer = this.shadowRoot.getElementById('svgContainer')
    while (svgContainer.firstChild) svgContainer.remove(svgContainer.firstChild)
  }

  addSvg(part, svgElem, boxWidth, boxHeight, url) {
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
        g.appendChild(elem)
      }
    }
    if (g.firstChild) {
      g.addEventListener('click', () => {
        console.log(part.getPath())
      })
      svgContainer.appendChild(g)
    } else {
      console.log('no image data for part:', part.getPath())
    }

    // const image = new Image()
    // image.src = url
    // const container = this.shadowRoot.getElementById('container')
    // container.appendChild(image)
    // image.setAttribute('width', '30%')
    // image.setAttribute('height', '30%')

    // container.appendChild(svgElem)
  }

  close() {
    this.modal.style.display = 'none'
  }
}

customElements.define('svg-dialog', SVGDialog)
