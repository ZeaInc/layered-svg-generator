let dialog

function drawHighlights(renderstate) {
  const gl = this.__renderer.gl
  // gl.enable(gl.DEPTH_TEST)
  // gl.depthFunc(gl.LESS)
  // gl.depthMask(true)
  gl.clearColor(1, 1, 1, 1)
  gl.colorMask(true, true, true, false)
  gl.clear(gl.COLOR_BUFFER_BIT)
  renderstate.glShader = null // clear any bound shaders.

  this.__renderer.drawHighlightedGeoms(renderstate)

  const canvas = this.__renderer.getGLCanvas()
  ImageTracer.imageToSVG(canvas.toDataURL(), function (svgstr) {
    var parser = new DOMParser()
    var doc = parser.parseFromString(svgstr, 'image/svg+xml')
    console.log(doc)
    dialog.addSvg(doc.children[0].children[0], doc.children[0].width, doc.children[0].height)
    // ImageTracer.appendSVGString(svgstr, 'svgcontainer')
  })
}

export function captureOutline(renderer) {
  const viewport = renderer.getViewport()

  dialog = document.getElementById('svg-dialog')
  dialog.show()

  // const scene = renderer.getScene()
  // scene.getRoot().traverse((treeItem) => {})

  const origDrawHighlights = viewport.drawHighlights
  viewport.drawHighlights = (renderstate) => {
    drawHighlights.call(viewport, renderstate)
    viewport.drawHighlights = origDrawHighlights
    renderer.requestRedraw()
  }
  renderer.requestRedraw()

  // viewport.drawHighlights = drawHighlights
}
