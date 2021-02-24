const gl = document.getElementById("c").getContext("webgl");

// Load shader program

const VERTEX_SHADER = `
attribute vec2 position;
attribute vec2 texCoord;

varying vec2 v_position;

void main() {
  v_position = texCoord;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform float time;
uniform sampler2D texture;

varying vec2 v_position;

void main() {
  // vec2 newPosition = vec2(sin(time * 0.1), v_position.y);
  gl_FragColor = texture2D(texture, v_position);
}
`;

const programInfo = twgl.createProgramInfo(gl, [
  VERTEX_SHADER,
  FRAGMENT_SHADER,
]);

// Create plane

const arrays = {
  position: { data: [1, 1, 1, -1, -1, -1, -1, 1], numComponents: 2 },
  texCoord: { data: [1, 0, 1, 1, 0, 1, 0, 0] },
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

// Load texture

const flowerTexture = twgl.createTexture(gl, { src: "./img/flower.jpg" });

function draw(time) {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(1.0, 0.0, 1.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const uniforms = {
    time: time / 1000,
    texture: flowerTexture,
  };

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_FAN);

  requestAnimationFrame(draw);
}

draw();
