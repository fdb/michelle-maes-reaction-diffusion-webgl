import * as THREE from "https://unpkg.com/three/build/three.module.js";

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

uniform sampler2D uTexture;
uniform sampler2D uDrawTexture;
uniform float udA;
uniform float udB;
uniform float uFeed;
uniform float uKill;
uniform float uInfluence;
uniform vec2 uTexelSize;

varying vec2 vUv;

vec4 laplace(vec2 uv) {
  vec4 sum = vec4(0.0);
  // Center point
  sum += texture2D(uTexture, uv) * -1.0;

  // Cross
  sum += texture2D(uTexture, uv - vec2(-1.0,  0.0) * uTexelSize) * 0.2;
  sum += texture2D(uTexture, uv - vec2( 1.0,  0.0) * uTexelSize) * 0.2;
  sum += texture2D(uTexture, uv - vec2( 0.0, -1.0) * uTexelSize) * 0.2;
  sum += texture2D(uTexture, uv - vec2( 0.0,  1.0) * uTexelSize) * 0.2;

  // Corner
  sum += texture2D(uTexture, uv - vec2(-1.0, -1.0) * uTexelSize) * 0.05;
  sum += texture2D(uTexture, uv - vec2( 1.0, -1.0) * uTexelSize) * 0.05;
  sum += texture2D(uTexture, uv - vec2( 1.0,  1.0) * uTexelSize) * 0.05;
  sum += texture2D(uTexture, uv - vec2(-1.0,  1.0) * uTexelSize) * 0.05;

  return sum;
}

vec4 react(vec4 pixel, vec4 neighbors) {
  float a = pixel.r;
  float b = pixel.g;

  float reactionRate = a * b * b;
  a = a + udA * neighbors.r - reactionRate + uFeed * (1.0 - a);
  b = b + udB * neighbors.g + reactionRate - (uKill + uFeed) * b;

  a = clamp(a, 0.0, 1.0);
  b = clamp(b, 0.0, 1.0);

  return vec4(a, b, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  vec4 pixel = texture2D(uTexture, uv) + texture2D(uDrawTexture, uv) * uInfluence;
  vec4 neighbors = laplace(uv);
  vec4 result = react(pixel, neighbors);
  gl_FragColor = result;
}
`;

export default class ReactionDiffusionLayer {
  constructor() {}

  async setup(width, height) {
    // Setup the material
    this.material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uDrawTexture: { value: null },
        udA: { value: 1.0 },
        udB: { value: 0.13 },
        uFeed: { value: 0.051 },
        uKill: { value: 0.08 },
        uInfluence: { value: 0.5 },
        uTexelSize: { value: new THREE.Vector2(1 / width, 1 / height) },
      },
    });

    gui
      .add(this.material.uniforms.udA, "value")
      .min(0)
      .max(1)
      .step(0.01)
      .name("dA");
    gui
      .add(this.material.uniforms.udB, "value")
      .min(0)
      .max(1)
      .step(0.01)
      .name("dB");
    gui
      .add(this.material.uniforms.uFeed, "value")
      .min(0)
      .max(0.1)
      .step(0.0001)
      .name("Feed");
    gui
      .add(this.material.uniforms.uKill, "value")
      .min(0)
      .max(0.1)
      .step(0.0001)
      .name("Kill");
    gui
      .add(this.material.uniforms.uInfluence, "value")
      .min(0)
      .max(1.0)
      .step(0.1)
      .name("Influence");

    this.targetA = new THREE.WebGLRenderTarget(width, height);
    this.targetB = new THREE.WebGLRenderTarget(width, height);

    const geometry = new THREE.PlaneGeometry();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.scale.set(width, height, 1);
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
  }

  resize(width, height) {
    this.mesh.scale.set(width, height, 1);
    this.targetA.setSize(width, height);
    this.targetB.setSize(width, height);
  }

  swapRenderTargets() {
    let tmp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = tmp;
  }

  draw(renderer, camera, elapsedTime, prevLayer) {
    renderer.setRenderTarget(this.targetA);
    this.material.uniforms.uDrawTexture.value = prevLayer.target.texture;
    renderer.render(this.scene, camera);
    renderer.setRenderTarget(null);
    this.swapRenderTargets();
    this.material.uniforms.uTexture.value = this.targetB.texture;
    this.target = this.targetA;
  }
}
