/* eslint-disable require-jsdoc */

import { captureOutline } from './selectionOutlineToCurve.js'
import { generateLabels } from './generateLabels.js'

export default function init() {
  const {
    Color,
    Vec3,
    Scene,
    GLRenderer,
    EnvMap,
    resourceLoader,
    AssetLoadContext,
    GeomItem,
    Lines,
    LinesProxy,
    Mesh,
    MeshProxy,
    InstanceItem,
    CADAsset,
    CADBody,
    PMIItem,
  } = zeaEngine
  const { SelectionManager } = zeaUx

  const urlParams = new URLSearchParams(window.location.search)
  const scene = new Scene()
  // scene.setupGrid(10.0, 10)

  const renderer = new GLRenderer(document.getElementById('canvas'), {
    debugGeomIds: false,
    /* Enable frustum culling which speeds up rendering on large complex scenes */
    enableFrustumCulling: true,
  })

  // HACK: Remove the OVERLAY passes because they clear the depth buffer.
  // We need to do this else the outline rendering is now depth composited.
  renderer.__passes[zeaEngine.PassType.OVERLAY] = []

  // captureOutline(renderer)
  document.getElementById('generate-labels').addEventListener('click', () => {
    generateLabels(scene)
  })
  document.getElementById('capture-outline').addEventListener('click', () => {
    captureOutline(renderer)
  })

  // renderer.solidAngleLimit = 0.0;
  renderer.setScene(scene)
  renderer.getViewport().getCamera().setPositionAndTarget(new Vec3(12, 12, 10), new Vec3(0, 0, 1.5))

  const envMap = new EnvMap()
  envMap.load('./data/StudioG.zenv')
  scene.setEnvMap(envMap)

  const appData = {
    scene,
    renderer,
  }

  // Setup Selection Manager
  const selectionManager = new SelectionManager(appData, {
    selectionOutlineColor: new Color(1, 0, 0.2, 0.1),
    branchSelectionOutlineColor: new Color(1, 0, 0.2, 0.1),
  })
  appData.selectionManager = selectionManager
  // Setup Progress Bar
  const progressElement = document.getElementById('progress')
  progressElement.resourceLoader = resourceLoader

  // Setup FPS Display
  const fpsElement = document.getElementById('fps')
  fpsElement.renderer = renderer

  // Setup TreeView Display
  const treeElement = document.getElementById('tree')
  treeElement.setTreeItem(scene.getRoot(), {
    scene,
    renderer,
    selectionManager,
    displayTreeComplexity: false,
  })

  // let highlightedItem
  const highlightColor = new Color('#F9CE03')
  highlightColor.a = 0.1
  const filterItem = (item) => {
    while (item && !(item instanceof CADBody) && !(item instanceof PMIItem)) {
      item = item.getOwner()
    }
    if (item.getOwner() instanceof InstanceItem) {
      item = item.getOwner()
    }
    return item
  }
  renderer.getViewport().on('pointerDown', (event) => {
    if (event.intersectionData) {
      const geomItem = filterItem(event.intersectionData.geomItem)
      if (geomItem) {
        console.log(geomItem.getPath())

        const geom = event.intersectionData.geomItem.geomParam.value
        console.log(geom.getNumVertices(), event.intersectionData.geomItem.geomIndex)
        let item = event.intersectionData.geomItem
        while (item) {
          const globalXfo = item.localXfoParam.value
          console.log(item.getName(), globalXfo.sc.toString())
          item = item.getOwner()
        }
      }
    }
  })

  renderer.getViewport().on('pointerUp', (event) => {
    // Detect a right click
    if (event.button == 0 && event.intersectionData) {
      // // if the selection tool is active then do nothing, as it will
      // // handle single click selection.s
      // const toolStack = toolManager.toolStack
      // if (toolStack[toolStack.length - 1] == selectionTool) return

      // To provide a simple selection when the SelectionTool is not activated,
      // we toggle selection on the item that is selcted.
      const item = filterItem(event.intersectionData.geomItem)
      if (item) {
        if (!event.shiftKey) {
          selectionManager.toggleItemSelection(item, !event.ctrlKey)
        } else {
          const items = new Set()
          items.add(item)
          selectionManager.deselectItems(items)
        }
      }
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key == 'f') {
      renderer.frameAll()
      event.stopPropagation()
    }
  })

  renderer.getXRViewport().then((xrvp) => {
    fpsElement.style.bottom = '70px'

    const xrButton = document.getElementById('xr-button')
    xrButton.textContent = 'Launch VR'
    xrButton.classList.remove('hidden')

    xrvp.on('presentingChanged', (event) => {
      const { state } = event
      if (state) {
        xrButton.textContent = 'Exit VR'
      } else {
        xrButton.textContent = 'Launch VR'
      }
    })

    xrButton.addEventListener('click', function (event) {
      xrvp.togglePresenting()
    })

    document.addEventListener('keydown', (event) => {
      if (event.key == ' ') {
        xrvp.togglePresenting()
      }
    })
  })

  if (urlParams.has('profile')) {
    renderer.startContinuousDrawing()
  }

  // ////////////////////////////////////////////
  // Load the asset
  const loadCADAsset = (zcad, filename) => {
    // Note: leave the asset name empty so that the asset
    // gets the name of the product in the file.
    const asset = new CADAsset()

    const context = new AssetLoadContext()
    context.units = 'Millimeters'
    // pass the camera in wth the AssetLoadContext so that
    // PMI classes can bind to it.
    context.camera = renderer.getViewport().getCamera()
    asset.load(zcad, context).then(() => {
      // The following is a quick hack to remove the black outlines around PMI text.
      // We do not crete ourlines around transparent geometries, so by forcing
      // the PMI items sub-trees to be considered transparent, it moves them into
      // the GLTransparentPass, which does not draw outlines. this cleans up
      // the rendering considerably.
      asset.traverse((item) => {
        if (item instanceof PMIItem) {
          item.traverse((item) => {
            if (item instanceof GeomItem) {
              item.materialParam.value.__isTransparent = true
            }
          })
          return false
        }
        return true
      })

      renderer.frameAll()
    })
    scene.getRoot().addChild(asset)
  }

  if (urlParams.has('zcad')) {
    loadCADAsset(urlParams.get('zcad'))
    const dropZone = document.getElementById('dropZone')
    if (dropZone) dropZone.hide()
  }

  // const xfo = new Xfo();
  // xfo.ori.setFromEulerAngles(new EulerAngles(90 * (Math.PI / 180), 0, 0));
  // asset.getParameter("GlobalXfo").setValue(xfo);
}
