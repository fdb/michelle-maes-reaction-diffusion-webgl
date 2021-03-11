import * as THREE from "https://unpkg.com/three/build/three.module.js";

export default class ImageLayer {
  constructor(fileName) {
    this.fileName = fileName;
  }

  async setup(width, height) {
    this.scene = new THREE.Scene();
    this.texture = null;
    await new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      this.texture = textureLoader.load(this.fileName, resolve);
    });

    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial({ map: this.texture });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.set(width, height, 1);
    this.scene.add(this.mesh);
    this.target = new THREE.WebGLRenderTarget(width, height);
  }

  resize(width, height) {
    this.mesh.scale.set(width, height, 1);
  }

  draw(renderer, camera) {
    renderer.setRenderTarget(this.target);
    renderer.render(this.scene, camera);
    renderer.setRenderTarget(null);
  }
}
