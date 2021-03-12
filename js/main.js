import * as THREE from "/third_party/three.module.js";
import * as dat from "/third_party/dat.gui.module.js";

import ColorMapLayer from "./layers/color-map.js";
import DifferenceLayer from "./layers/difference.js";
import ImageLayer from "./layers/image.js";
import ReactionDiffusionLayer from "./layers/reaction-diffusion.js";
import WebcamLayer from "./layers/webcam.js";

let canvas, camera, renderer, layers, mesh, material;

async function main() {
  canvas = document.getElementById("c");
  let width = canvas.width;
  let height = canvas.height;

  const gui = new dat.GUI();
  window.gui = gui;

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({
    canvas,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    depth: false,
    stencil: false,
  });
  renderer.autoClear = false;
  renderer.setSize(width, height);

  const geometry = new THREE.PlaneGeometry(2, 2);
  material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  mesh = new THREE.Mesh(geometry, material);

  const imageLayer = new ImageLayer("./img/flower.jpg");
  const colorMapLayer = new ColorMapLayer("./img/sunset.jpg");
  const reactionDiffusionLayer = new ReactionDiffusionLayer();
  const webcamLayer = new WebcamLayer();
  const differenceLayer = new DifferenceLayer();
  // layers = [imageLayer, colorMapLayer];
  // layers = [webcamLayer, reactionDiffusionLayer];
  layers = [webcamLayer, differenceLayer, reactionDiffusionLayer];
  // layers = [webcamLayer, differenceLayer, reactionDiffusionLayer, colorMapLayer];

  for (const layer of layers) {
    await layer.setup(width, height);
  }

  requestAnimationFrame(animate);
}

function animate(elapsedTime) {
  for (let i = 0; i < layers.length; i++) {
    layers[i].draw(renderer, camera, elapsedTime, layers[i - 1]);
  }

  let lastLayer = layers[layers.length - 1];
  material.map = lastLayer.target.texture;

  renderer.setRenderTarget(null);
  renderer.render(mesh, camera);

  requestAnimationFrame(animate);
}

main();
// window.addEventListener("click", animate);
