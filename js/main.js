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
uniform vec2 uTexelSize;
uniform sampler2D uTexture;
uniform float uDa;
uniform float uDb;
uniform float uFeed;
uniform float uKill;

varying vec2 vUv;

vec4 neighbors(vec2 uv) {
  vec4 sum = vec4(0.0);

  // Center pixel
  sum += texture2D(uTexture, uv) * -1.0;

  // Cross
  sum += texture2D(uTexture, uv + vec2(-1.0,  0.0) * uTexelSize) * 0.2;
  sum += texture2D(uTexture, uv + vec2( 1.0,  0.0) * uTexelSize) * 0.2;
  sum += texture2D(uTexture, uv + vec2( 0.0,  1.0) * uTexelSize) * 0.2;
  sum += texture2D(uTexture, uv + vec2( 0.0, -1.0) * uTexelSize) * 0.2;

  // Corners
  sum += texture2D(uTexture, uv + vec2(-1.0, -1.0) * uTexelSize) * 0.05;
  sum += texture2D(uTexture, uv + vec2( 1.0, -1.0) * uTexelSize) * 0.05;
  sum += texture2D(uTexture, uv + vec2( 1.0,  1.0) * uTexelSize) * 0.05;
  sum += texture2D(uTexture, uv + vec2(-1.0,  1.0) * uTexelSize) * 0.05;

  return sum;
}

vec4 react(vec4 pixel, vec4 convolution) {
  float a = pixel.r;
  float b = pixel.g;

  float reactionRate = a * (b * b);
  float du = uDa * convolution.r - reactionRate + uFeed * (1.0 - a);
  float dv = uDb * convolution.g + reactionRate - (uKill + uFeed) * b;
  du = clamp(du, 0.0, 1.0);
  dv = clamp(dv, 0.0, 1.0);
  return vec4(du, dv, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;

  vec4 pixel = texture2D(uTexture, uv);
  vec4 neighbors = neighbors(uv);
  vec4 result = react(pixel, neighbors);
  result = clamp(result, 0.0, 1.0);
  gl_FragColor = result;

  // gl_FragColor = neighbors(uv);
  // uv.x += sin(uTime * 0.01) * 0.2;
  // gl_FragColor = texture2D(uTexture, uv);
}
`;

const geometry = new THREE.PlaneGeometry(800, 600);
const material = new THREE.RawShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uBrightness: { value: 1.0 },
    uTime: { value: 0.0 },
    uSize: { value: new THREE.Vector2(800, 600) },
    uDa: { value: 1.0 },
    uDb: { value: 0.6 },
    uFeed: { value: 0.2 },
    uKill: { value: 0.05 },
    uTexelSize: { value: new THREE.Vector2(1 / 800, 1 / 600) },
    uTexture: { value: flowerTexture },
  },
});
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

gui
  .add(material.uniforms.uDa, "value")
  .min(0.0)
  .max(1.0)
  .step(0.0001)
  .name("dA");
gui
  .add(material.uniforms.uDb, "value")
  .min(0.0)
  .max(1.0)
  .step(0.0001)
  .name("dB");
gui
  .add(material.uniforms.uFeed, "value")
  .min(0.0)
  .max(1.0)
  .step(0.0001)
  .name("Feed");
gui
  .add(material.uniforms.uKill, "value")
  .min(0.0)
  .max(1.0)
  .step(0.0001)
  .name("Kill");

camera.position.z = 1;

let targetA = new THREE.WebGLRenderTarget(800, 600);
let targetB = new THREE.WebGLRenderTarget(800, 600);

function swapRenderTargets() {
  let tmp = targetA;
  targetA = targetB;
  targetB = tmp;
}

function animate(elapsedTime) {
  // material.uniforms.uBrightness.value += 0.01;
  material.uniforms.uTime.value = elapsedTime;
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

  renderer.setRenderTarget(targetB);
  renderer.render(scene, camera);

  renderer.setRenderTarget(targetA);
  material.uniforms.uTexture.value = targetB.texture;
  renderer.render(scene, camera);
  swapRenderTargets();

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

function start() {
  animate();
}
