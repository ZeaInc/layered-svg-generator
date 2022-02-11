let dialog

const { Color, Material, GeomItem, Box3, CADPart } = zeaEngine

const renderPartMask = (cadPart, renderer) => {
  return new Promise((resolve) => {
    renderer.forceRender()

    const color = Color.random(0.5)
    cadPart.addHighlight('pickingMask', color, true)
    const viewport = renderer.getViewport()
    viewport.drawHighlights = (renderstate) => {
      const gl = renderer.gl
      gl.clearColor(1, 1, 1, 1)
      gl.colorMask(true, true, true, false)
      gl.clear(gl.COLOR_BUFFER_BIT)
      renderstate.glShader = null // clear any bound shaders.

      renderer.drawHighlightedGeoms(renderstate)
      // resolve({
      //   svg: { children: [] },
      //   width: 0,
      //   height: 0,
      // })
      // cadPart.removeHighlight('pickingMask', true)

      const canvas = renderer.getGLCanvas()
      const url = canvas.toDataURL()
      ImageTracer.imageToSVG(
        url,
        function (svgstr) {
          cadPart.removeHighlight('pickingMask', true)
          const parser = new DOMParser()
          const doc = parser.parseFromString(svgstr, 'image/svg+xml')
          resolve({
            url,
            svg: doc.children[0],
            width: doc.children[0].width.baseVal.value,
            height: doc.children[0].height.baseVal.value,
          })
        },
        { pathomit: 0, roundcoords: 2, ltres: 0.5, qtres: 0.5, numberofcolors: 2, linefilter: false }
      )
    }
    renderer.requestRedraw()
  })
}

export async function captureOutline(renderer) {
  const viewport = renderer.getViewport()
  const origDrawHighlights = viewport.drawHighlights

  const url = renderer.getGLCanvas().toDataURL()

  const scene = renderer.getScene()
  const parts = []
  const boundingBox = new Box3()
  scene.getRoot().traverse((treeItem) => {
    if (treeItem instanceof CADPart) {
      boundingBox.addBox3(treeItem.boundingBoxParam.value)
      parts.push(treeItem)
    }
  })

  dialog = document.getElementById('svg-dialog')
  dialog.show(url, parts.length)

  const center = boundingBox.center()
  const boxRadius = boundingBox.diagonal().length() * 0.5

  let id = 0
  for (const part of parts) {
    const result = await renderPartMask(part, renderer)
    if (result.svg.children.length > 0) {
      // Calculate the 2d position of label elements
      const partCenter = part.boundingBoxParam.value.center()
      const labelOffset = partCenter.subtract(center)
      labelOffset.normalizeInPlace()
      labelOffset.scaleInPlace(boxRadius * 0.75 + boxRadius * 0.25 * Math.random())
      const labelPos = center.add(labelOffset)
      const labelPos2D = renderer.getViewport().calcScreenPosFromWorldPos(labelPos)
      const labelLineEnd2D = renderer.getViewport().calcScreenPosFromWorldPos(partCenter)
      // const labelText = instanceItem.getName()
      // const labelText = part.getName()
      // const labelText = instanceItem.getName() + ':' + part.getName()
      const labelText = id + ''

      dialog.addSvg(part, result.svg, result.width, result.height, labelText, labelPos2D, labelLineEnd2D)
      id++
    }
  }

  parts.forEach((part) => {
    part.visibleParam.value = true
  })

  viewport.drawHighlights = origDrawHighlights
  renderer.requestRedraw()
}
