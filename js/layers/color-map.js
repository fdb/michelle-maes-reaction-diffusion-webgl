import * as THREE from "/third_party/three.module.js";

const vertexShader = `
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vUv = uv;
}
`;

const fragmentShader = `
precision mediump float;

uniform sampler2D uInputTexture;
uniform sampler2D uColorTexture;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 originalColor = texture2D(uInputTexture, uv);
  float gray = (originalColor.r - originalColor.b);
  // float gray = (originalColor.r + originalColor.g + originalColor.b) / 3.0;
  // float gray = 0.21 * originalColor.r + 0.71 * originalColor.g + 0.07 * originalColor.b;
  gray = clamp(gray, 0.0, 1.0);
  gl_FragColor = texture2D(uColorTexture, vec2(gray, 0.5));
  // gl_FragColor = vec4(gray, gray, gray, 1.0);
}
`;

export default class ColorMapLayer {
  constructor(fileName) {
    this.fileName = fileName;
  }

  async setup(width, height) {
    this.colorTexture = null;
    await new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      this.colorTexture = textureLoader.load(this.fileName, resolve);
    });

    // Setup the material
    this.material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uInputTexture: { value: null },
        uColorTexture: { value: this.colorTexture },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);

    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
  }

  draw(renderer, camera, elapsedTime, prevLayer) {
    // Render the difference operation
    this.material.uniforms.uInputTexture.value = prevLayer.target.texture;
    this.mesh.material = this.material;
    renderer.setRenderTarget(this.target);
    renderer.render(this.mesh, camera);
    renderer.setRenderTarget(null);
  }
}
