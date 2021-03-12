import * as THREE from "/third_party/three.module.js";

export default class WebcamLayer {
  constructor() {}

  async setup(width, height) {
    this.texture = null;
    this.video = document.createElement("video");
    this.videoCanvas = document.createElement("canvas");
    this.videoContext = this.videoCanvas.getContext("2d");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    this.video.srcObject = stream;
    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        this.videoCanvas.width = this.video.videoWidth;
        this.videoCanvas.height = this.video.videoHeight;
        resolve();
      };
    });
    this.videoTexture = new THREE.Texture(this.videoCanvas);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.y = 480 / 640;
    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
  }

  draw(renderer, camera) {
    this.videoContext.drawImage(this.video, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
    this.videoTexture.needsUpdate = true;

    renderer.setRenderTarget(this.target);
    renderer.render(this.mesh, camera);
    renderer.setRenderTarget(null);
  }
}
