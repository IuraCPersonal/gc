"use strict";

let view_x = 0.0;
let view_y = 0.0;
let view_z = 0.0;

//
// Start Here
//

const main = (input) => {
  //Setup our canvas and gl
  const canvas = document.getElementById("gl-canvas");
  const gl = canvas.getContext("webgl");

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Error!");
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
  const buffers = initBuffers(gl, input);

  // Draw the scene repeatedly
  function render() {
    drawScene(gl, programInfo, buffers, get_object(input)["indices"].length);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
};

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//

const initBuffers = (gl, input) => {
  // Create a buffer for the cube's vertex positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.
  let positions = get_object(input)["positions"];
  let faceColors = get_object(input)["faceColors"];
  let indices = get_object(input)["indices"];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Convert the array of colors into a table for all the vertices.
  let colors = [];

  for (let j = 0; j < faceColors.length; ++j) {
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
};

//
// Draw the scene.
//

const drawScene = (gl, programInfo, buffers, vertexCount) => {
  gl.clearColor(1.0, 1.0, 1.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0]
  ); // amount to translate

  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    (view_z += 0.001), // amount to rotate in radians
    [0, 0, 1]
  ); // axis to rotate around (Z)

  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    (view_x += 0.001), // amount to rotate in radians
    [0, 1, 0]
  ); // axis to rotate around (X)

  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    (view_y += 0.001), // amount to rotate in radians
    [1, 0, 0]
  ); // axis to rotate around (Y)

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
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
};

const get_object = (input) => {
  let positions = [];
  let faceColors = [];
  let indices = [];
  let normals = [];

  if (input.toLowerCase() == "cube") {
    positions = [
      // Front face
      -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
      // Back face
      -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
      // Top face
      -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
      // Bottom face
      -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
      // Right face
      1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
      // Left face
      -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ];
    faceColors = [
      [Math.random(), Math.random(), Math.random(), 1.0], // Front face
      [Math.random(), Math.random(), Math.random(), 1.0], // Front face
      [Math.random(), Math.random(), Math.random(), 1.0], // Back face
      [Math.random(), Math.random(), Math.random(), 1.0], // Top face
      [Math.random(), Math.random(), Math.random(), 1.0], // Bottom face
      [Math.random(), Math.random(), Math.random(), 1.0], // Right face
      [Math.random(), Math.random(), Math.random(), 1.0], // Left face
    ];
    indices = [
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12,
      14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
    ];
  } else if (input.toLowerCase() == "pyramid") {
    positions = [
      // Front face
      0.0, 1.0, 0.0,
      -1.0, -1.0, 1.0,
      1.0, -1.0, 1.0,

      // Right face
      0.0, 1.0, 0.0,
      1.0, -1.0, 1.0,
      1.0, -1.0, -1.0,

      // Back face
      0.0, 1.0, 0.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,

      // Left face
      0.0, 1.0, 0.0,
      -1.0, -1.0, -1.0,
      -1.0, -1.0, 1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
      1.0, -1.0, -1.0,
      1.0, -1.0, 1.0,
      -1.0, -1.0, -1.0,
      1.0, -1.0, 1.0,
      -1.0, -1.0, 1.0,
    ];
    faceColors = [
      [Math.random(), Math.random(), Math.random(), 1.0], // Front face
      [Math.random(), Math.random(), Math.random(), 1.0], // Back face
      [Math.random(), Math.random(), Math.random(), 1.0], // Top face
      [Math.random(), Math.random(), Math.random(), 1.0], // Bottom face
      [Math.random(), Math.random(), Math.random(), 1.0], // Right face
    ];
    indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  } else if (input.toLowerCase() == "cone") {
    let sides = 8;
    let height = 1.0;
    let stepTheta = 2 * Math.PI / sides;
    let verticesPerCap = 9 * sides;

    let theta = 0;
    let i = 0;

    for (let i = 0; i < sides + verticesPerCap; ++i) {
      faceColors.push([Math.random(), Math.random(), Math.random(), 1.0])
    }

    // Bottom Cap
    theta = 0;
    for (; i < verticesPerCap; i += 9) {
      positions[i] = Math.cos(theta);
      positions[i + 1] = -height;
      positions[i + 2] = Math.sin(theta);
      theta -= stepTheta;

      positions[i + 3] = 0.0;
      positions[i + 4] = -height;
      positions[i + 5] = 0.0;

      positions[i + 6] = Math.cos(theta);
      positions[i + 7] = -height;
      positions[i + 8] = Math.sin(theta);
    }

    for (let j = 0; j < sides; ++j) {
      // Bottom Right
      for (let k = 0; k < 3; ++k, ++i) {
        positions[i] = positions[0 + k + 9 * j];
      }

      // Bottom Left
      for (let k = 0; k < 3; ++k, ++i) {
        positions[i] = positions[6 + k + 9 * j];
      }

      // Top
      positions[i++] = 0.0;
      positions[i++] = height;
      positions[i++] = 0.0;
    }

    indices = new Array(positions.length / 3);
    for (i = 0; i < indices.length; ++i) indices[i] = i;
  }
  return {
    positions: positions,
    faceColors: faceColors,
    indices: indices,
  };
};
