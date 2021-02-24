import * as THREE from "https://unpkg.com/three/build/three.module.js";
import * as dat from "https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js";

const gui = new dat.GUI();

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-400, 400, 300, -300, 1, 100);

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(800, 600);

const textureLoader = new THREE.TextureLoader();
const flowerTexture = textureLoader.load("./img/flower.jpg", start);

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

uniform float uTime;
uniform sampler2D uTexture;
uniform float udA;
uniform float udB;
uniform float uFeed;
uniform float uKill;
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
  vec4 pixel = texture2D(uTexture, uv);
  vec4 neighbors = laplace(uv);
  vec4 result = react(pixel, neighbors);
  gl_FragColor = result;
}
`;

const geometry = new THREE.PlaneGeometry(800, 600);
const material = new THREE.RawShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0.0 },
    uTexture: { value: flowerTexture },
    udA: { value: 1.0 },
    udB: { value: 0.13 },
    uFeed: { value: 0.051 },
    uKill: { value: 0.08 },
    uTexelSize: { value: new THREE.Vector2(1 / 800, 1 / 600) },
  },
  // wireframe: true,
});

gui.add(material.uniforms.udA, "value").min(0).max(1).step(0.01).name("dA");
gui.add(material.uniforms.udB, "value").min(0).max(1).step(0.01).name("dB");
gui
  .add(material.uniforms.uFeed, "value")
  .min(0)
  .max(0.1)
  .step(0.001)
  .name("Feed");
gui
  .add(material.uniforms.uKill, "value")
  .min(0)
  .max(0.1)
  .step(0.001)
  .name("Kill");
// console.log(geometry);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

camera.position.z = 1;

let targetA = new THREE.WebGLRenderTarget(800, 600);
let targetB = new THREE.WebGLRenderTarget(800, 600);

function swapRenderTargets() {
  let tmp = targetA;
  targetA = targetB;
  targetB = tmp;
}

function animate(elapsedTime) {
  material.uniforms.uTime.value = elapsedTime;

  for (let i = 0; i < 10; i++) {
    renderer.setRenderTarget(targetA);
    material.uniforms.uTexture.value = targetB.texture;
    renderer.render(scene, camera);
    swapRenderTargets();
  }

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

function start() {
  renderer.setRenderTarget(targetB);
  renderer.render(scene, camera);

  animate();
}
