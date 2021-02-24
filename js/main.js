import * as THREE from "https://unpkg.com/three/build/three.module.js";

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-400, 400, 300, -300, 1, 100);

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(800, 600);

const textureLoader = new THREE.TextureLoader();
const flowerTexture = textureLoader.load("./img/flower.jpg");

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

// uniform float uBrightness;
uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  // float brightness = uBrightness;
  // gl_FragColor = vec4(brightness, brightness, brightness, 1.0);
  vec2 uv = vUv;
  // uv.x += sin(uTime * 0.01) * 0.2;
  gl_FragColor = texture2D(uTexture, uv);
}
`;

const geometry = new THREE.PlaneGeometry(800, 600);
const material = new THREE.RawShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uBrightness: { value: 1.0 },
    uTime: { value: 0.0 },
    uTexture: { value: flowerTexture },
  },
  // wireframe: true,
});
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

camera.position.z = 1;

function animate(elapsedTime) {
  // material.uniforms.uBrightness.value += 0.01;
  material.uniforms.uTime.value = elapsedTime;
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
