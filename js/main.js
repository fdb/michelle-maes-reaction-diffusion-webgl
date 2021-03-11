import * as THREE from "https://unpkg.com/three/build/three.module.js";
import * as dat from "https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js";
import ImageLayer from "./layers/image.js";
import ReactionDiffusionLayer from "./layers/reaction-diffusion.js";
import WebcamLayer from "./layers/webcam.js";

let canvas, scene, camera, renderer, layers, mesh, material;

async function main() {
  canvas = document.getElementById("c");
  let width = canvas.width;
  let height = canvas.height;

  const gui = new dat.GUI();
  window.gui = gui;

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    1,
    100
  );
  camera.position.z = 1;

  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(width, height);

  const geometry = new THREE.PlaneGeometry();
  material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(width, height, 1);
  scene.add(mesh);

  const imageLayer = new ImageLayer("./img/flower.jpg");
  const reactionDiffusionLayer = new ReactionDiffusionLayer();
  const webcamLayer = new WebcamLayer();
  layers = [reactionDiffusionLayer];

  for (const layer of layers) {
    await layer.setup(width, height);
  }

  requestAnimationFrame(animate);
}

function animate(elapsedTime) {
  // material.uniforms.uTime.value = elapsedTime;

  // for (let i = 0; i < 10; i++) {
  //   renderer.setRenderTarget(targetA);
  //   material.uniforms.uTexture.value = targetB.texture;
  //   renderer.render(scene, camera);
  //   swapRenderTargets();
  // }

  for (let i = 0; i < layers.length; i++) {
    layers[i].draw(renderer, camera, elapsedTime);
  }

  let lastLayer = layers[layers.length - 1];
  material.map = lastLayer.target.texture;

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  camera.left = (-aspect * height) / 2;
  camera.right = (aspect * height) / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  for (const layer of layers) {
    layer.resize(width, height);
  }
}

main();
// window.addEventListener("resize", resize);
window.addEventListener("click", animate);
