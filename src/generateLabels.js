let dialog

const { Color, Vec3, Xfo, Box3, Label, BillboardItem, Lines, LinesMaterial, GeomItem, CADPart } = zeaEngine

const lineMaterial = new LinesMaterial('Line')
lineMaterial.baseColorParam.value = new Color(0, 0, 0)
// lineMaterial.getParameter('Overlay').value = 0.5
let index = 0
const addLabel = (lineEndPos, pos, color, name) => {
  return new Promise((resolve, reject) => {
    const label = new Label(name)
    label.borderRadiusParam.value = 24
    label.fontSizeParam.value = 48
    label.fontColorParam.value = new Color(0, 0, 0)
    label.backgroundColorParam.value = new Color(0.7, 0.7, 0.7)

    const billboard = new BillboardItem('Label', label)
    billboard.globalXfoParam.value = new Xfo(pos)
    billboard.pixelsPerMeterParam.value = 3000
    billboard.alignedToCameraParam.value = true
    // billboard.drawOnTopParam.value = true
    billboard.fixedSizeOnscreenParam.value = true

    const labelOffset = pos.subtract(lineEndPos)
    if (labelOffset.z > 0) billboard.pivotParam.value.y = 0
    else billboard.pivotParam.value.y = 1

    billboard.alphaParam.value = 1

    const line = new Lines()
    line.setNumVertices(2)
    line.setNumSegments(1)
    line.setSegmentVertexIndices(0, 0, 1)
    line.getVertexAttribute('positions').setValue(0, new Vec3())
    line.getVertexAttribute('positions').setValue(1, lineEndPos.subtract(pos))
    line.setBoundingBoxDirty()

    const lineGeomItem = new GeomItem('Line', line, lineMaterial)
    lineGeomItem.setSelectable(false)

    billboard.addChild(lineGeomItem, false)

    resolve(billboard)
    // label.on('labelRendered', () => {
    //   resolve(billboard)
    // })
    index++
  })
}

export async function generateLabels(scene) {
  const parts = []

  const boundingBox = new Box3()
  scene.getRoot().traverse((treeItem) => {
    if (treeItem instanceof CADPart) {
      boundingBox.addBox3(treeItem.boundingBoxParam.value)
      parts.push(treeItem)
    }
  })

  const center = boundingBox.center()
  const boxRadius = boundingBox.diagonal().length() * 0.5
  const labelColor = new Color('gold')

  let id = 0
  for (const part of parts) {
    const partCenter = part.boundingBoxParam.value.center()
    // const xfo = part.globalXfoParam.value
    const labelOffset = partCenter.subtract(center)
    labelOffset.normalizeInPlace()
    labelOffset.scaleInPlace(boxRadius)
    const labelPos = center.add(labelOffset)

    // const instanceItem = part.getOwner()
    // const text = instanceItem.getName()
    // const text = part.getName()
    // const text = instanceItem.getName() + ':' + part.getName()
    const text = id + ''
    const billboard = await addLabel(partCenter, labelPos, labelColor, text)
    part.addChild(billboard)

    id++
  }
}
