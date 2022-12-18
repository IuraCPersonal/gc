"use strict";

var view_x = 0;
var view_y = 0;
var view_z = 0;

var pos_x = 0.0;
var pos_y = -0.0;
var pos_z = -6.0;

var scale_x = -1.0;
var scale_y = 0.0;
var scale_z = 0.0;

var scale = [1, 1, 1];

var zNear = 1;
var zFar = 2000;
var fieldOfView = (45 * Math.PI) / 180; // in radians

// Start here

function main() {
  const canvas = document.getElementById("gl-canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  // If we don't have a GL context, give up now
  if (!gl) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Draw the scene repeatedly
  function render() {
    drawScene(gl, programInfo, buffers);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// Initialize the buffers we'll need.
//

function initBuffers(gl) {

  // Create a buffer for the object's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Initialize event handlers

  document.getElementById("rotate1").oninput = (e) => {
    view_x = e.target.value / 10;
  };

  document.getElementById("rotate2").oninput = (e) => {
    view_y = e.target.value / 10;
  };

  document.getElementById("rotate3").oninput = (e) => {
    view_z = e.target.value / 10;
  };

  document.getElementById("pos_x").oninput = (e) => {
    pos_x = e.target.value / 50;
  };

  document.getElementById("pos_y").oninput = (e) => {
    pos_y = e.target.value / 50;
  };

  document.getElementById("pos_z").oninput = (e) => {
    pos_z = -e.target.value / 10;
  };

  document.getElementById("scale_x").oninput = (e) => {
    scale[0] = -e.target.value / 40;
  }

  document.getElementById("scale_y").oninput = (e) => {
    scale[1] = -e.target.value / 40;
  }

  document.getElementById("scale_z").oninput = (e) => {
    scale[2] = -e.target.value / 40;
  }

  document.getElementById("fov").oninput = (e) => {
    fieldOfView = (e.target.value * Math.PI) / 180;
  }

  document.getElementById("zNear").oninput = (e) => {
    zNear = e.target.value / 10;
  }

  document.getElementById("zFar").oninput = (e) => {
    zFar = e.target.value / 10;
  }

  // Now create an array of positions for the cube.

  let positions = [
    // Front face
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces.
  // Random color generator

  const faceColors = [
    [Math.random(), Math.random(), Math.random(), 1.0], // Front face
    [Math.random(), Math.random(), Math.random(), 1.0], // Front face
    [Math.random(), Math.random(), Math.random(), 1.0], // Back face
    [Math.random(), Math.random(), Math.random(), 1.0], // Top face
    [Math.random(), Math.random(), Math.random(), 1.0], // Bottom face
    [Math.random(), Math.random(), Math.random(), 1.0], // Right face
    [Math.random(), Math.random(), Math.random(), 1.0], // Left face
  ];

  // Convert the array of colors into a table for all the vertices.

  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];

    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ];

  // Now send the element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

//
// Draw the scene.
//

function drawScene(gl, programInfo, buffers) {

  // Clear to white, fully opaque

  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  // Clear everything

  gl.clearDepth(1.0);

  // Enable depth testing

  gl.enable(gl.DEPTH_TEST);

  // Near things obscure far things

  gl.depthFunc(gl.LEQUAL);

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(
    projectionMatrix,
    fieldOfView,
    aspect, zNear, zFar
  );

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(
    modelViewMatrix,      // destination matrix
    modelViewMatrix,      // matrix to translate
    [pos_x, pos_y, pos_z] // amount to translate
  );

  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    view_z,          // amount to rotate in radians
    [0, 0, 1]
  ); // axis to rotate around (Z)

  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    view_x,          // amount to rotate in radians
    [0, 1, 0]
  ); // axis to rotate around (X)

  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    view_y,          // amount to rotate in radians
    [1, 0, 0]
  ); // axis to rotate around (Y)

  mat4.scale(
    modelViewMatrix,
    modelViewMatrix,
    [scale[0], scale[1], scale[2]],
  ); // Scaling the object

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}
