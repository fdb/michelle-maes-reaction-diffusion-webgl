import * as THREE from "/third_party/three.module.js";

export default class ImageLayer {
  constructor(fileName) {
    this.fileName = fileName;
  }

  async setup(width, height) {
    this.texture = null;
    await new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      this.texture = textureLoader.load(this.fileName, resolve);
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: this.texture });
    this.mesh = new THREE.Mesh(geometry, material);
    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
  }

  draw(renderer, camera) {
    renderer.setRenderTarget(this.target);
    renderer.render(this.mesh, camera);
    renderer.setRenderTarget(null);
  }
}
