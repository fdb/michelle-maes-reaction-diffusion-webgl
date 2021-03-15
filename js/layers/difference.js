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

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 pixel1 = texture2D(uTexture1, uv);
  vec4 pixel2 = texture2D(uTexture2, uv);

  // float dist = distance(pixel1.rgb, pixel2.rgb);
  // float val = dist > 0.5 ? 1.0 : 0.0;
  // gl_FragColor = vec4(val, val, val, 1.0);

  gl_FragColor = vec4(abs(pixel2.rgb - pixel1.rgb), 1.0);
}
`;

const copyFragmentShader = `
precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 pixel = texture2D(uTexture, uv);
  gl_FragColor = pixel;
}
`;

export default class DifferenceLayer {
  async setup(width, height) {
    // Setup the material
    this.material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture1: { value: null },
        uTexture2: { value: null },
      },
    });

    this.copyMaterial = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader: copyFragmentShader,
      uniforms: { uTexture: { value: null } },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);

    this.inputTarget = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
    this.outputTarget = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
  }

  draw(renderer, camera, elapsedTime, prevLayer) {
    // Render the difference operation
    this.material.uniforms.uTexture1.value = prevLayer.target.texture;
    this.material.uniforms.uTexture2.value = this.inputTarget.texture;
    this.mesh.material = this.material;
    renderer.setRenderTarget(this.outputTarget);
    renderer.render(this.mesh, camera);
    renderer.setRenderTarget(null);

    // Copy the output of the prevLayer into the input texture
    renderer.setRenderTarget(this.inputTarget);
    this.copyMaterial.uniforms.uTexture.value = prevLayer.target.texture;
    this.mesh.material = this.copyMaterial;
    renderer.render(this.mesh, camera);
    renderer.setRenderTarget(null);

    this.target = this.outputTarget;
  }
}
