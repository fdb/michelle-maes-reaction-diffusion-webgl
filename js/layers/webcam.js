import * as THREE from "https://unpkg.com/three/build/three.module.js";

export default class WebcamLayer {
  constructor() {}

  async setup(width, height) {
    this.scene = new THREE.Scene();
    this.texture = null;
    this.video = document.createElement("video");
    this.videoCanvas = document.createElement("canvas");
    this.videoContext = this.videoCanvas.getContext("2d");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    this.video.srcObject = stream;
    await new Promise((resolve, reject) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        console.log(this.video);
        this.videoCanvas.width = this.video.videoWidth;
        this.videoCanvas.height = this.video.videoHeight;
        console.log(this.videoCanvas);
        resolve();
      };
    });
    this.videoTexture = new THREE.Texture(this.videoCanvas);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.set(width, height, 1);
    this.scene.add(this.mesh);
    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
  }

  resize(width, height) {
    this.mesh.scale.set(width, height, 1);
  }

  draw(renderer, camera) {
    this.videoContext.drawImage(this.video, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
    this.videoTexture.needsUpdate = true;

    renderer.setRenderTarget(this.target);
    renderer.render(this.scene, camera);
    renderer.setRenderTarget(null);
  }
}
