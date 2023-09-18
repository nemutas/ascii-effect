import * as THREE from 'three'
import { three } from './core/Three'
import vertexShader from './shader/quadVs.glsl'
import fragmentShader from './shader/screenFs.glsl'
import { gui } from './Gui'

export class Canvas {
  private screen?: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial>
  private fps = document.querySelector<HTMLElement>('.fps')!
  private counter = 0

  constructor(canvas: HTMLCanvasElement) {
    this.loadTextures().then((textures) => {
      this.init(canvas)
      this.createScreen(textures)
      this.addEvents()
      three.animation(this.anime)
    })
  }

  private async loadTextures() {
    const loader = new THREE.TextureLoader()
    const paths = ['ascii_density_sort.jpg']

    return await Promise.all(
      paths.map(async (path) => {
        const texture = await loader.loadAsync(import.meta.env.BASE_URL + 'images/' + path)
        texture.name = path.split('.')[0]
        return texture
      }),
    )
  }

  private init(canvas: HTMLCanvasElement) {
    three.setup(canvas)
    three.scene.background = new THREE.Color('#000')
  }

  private async createScreen(textures: THREE.Texture[]) {
    const ascii = textures.find(({ name }) => name === 'ascii_density_sort')!
    const aw = ascii.source.data.width
    const ah = ascii.source.data.height

    const video = document.querySelector<HTMLVideoElement>('video')!
    const videoTexture = new THREE.VideoTexture(video)
    await video.play()
    const aspect = videoTexture.source.data.videoWidth / videoTexture.source.data.videoHeight

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        tImage: { value: videoTexture },
        tAsciiMap: { value: ascii },
        uAspect: { value: three.size.aspect },
        uUvTransform: { value: three.coveredScale(aspect) },
        uAsciiColorStep: { value: ah / aw },
        uTileSize: { value: 50 },
        uVisibleImage: { value: false },
      },
      vertexShader,
      fragmentShader,
    })
    const mesh = new THREE.Mesh(geometry, material)
    three.scene.add(mesh)
    three.addDisposableObject(geometry, material)
    this.screen = mesh

    gui.add(material.uniforms.uTileSize, 'value', 10, 100, 10).name('tile size')
    gui.add(material.uniforms.uVisibleImage, 'value').name('visible image')
  }

  private addEvents() {
    three.addEventListener('resize', () => {
      if (this.screen) {
        const uniforms = this.screen.material.uniforms
        const { videoWidth: width, videoHeight: height } = uniforms.tImage.value.source.data
        uniforms.uAspect.value = three.size.aspect
        uniforms.uUvTransform.value = three.coveredScale(width / height)
      }
    })
  }
  private anime = () => {
    this.counter++
    if (this.counter % 10 === 0) {
      this.fps.innerText = (1 / three.time.delta).toFixed(0)
    }

    three.render()
  }

  dispose() {
    three.dispose()
  }
}
