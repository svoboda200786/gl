// WebGL - 2D Geometry Matrix Transform with simpler functions
// from https://webglfundamentals.org/webgl/webgl-2d-geometry-matrix-transform-simpler-functions.html


"use strict";
var gl, trans_mat, x_rot_mat, y_rot_mat, z_rot_mat, scale_mat, proj_mat, y_rot_camera_mat,
trans_camera_mat, fieldOfViewRadians, cameraAngleRadians, myarray2;
var uv = 100;
var translation= [];
var rotation= [];
var scale= [];
var color= [];

function main() {

  var canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

  var positionLocation = gl.getAttribLocation(program, "a_position");
  var normalLocation = gl.getAttribLocation(program, "a_normal");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  var colorLocation = gl.getUniformLocation(program, "u_color");
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  var proj_matrixLocation = gl.getUniformLocation(program, "u_proj_mat");
  var x_rot_matrixLocation = gl.getUniformLocation(program, "u_x_rot_mat");
  var y_rot_matrixLocation = gl.getUniformLocation(program, "u_y_rot_mat"); 
  var z_rot_matrixLocation = gl.getUniformLocation(program, "u_z_rot_mat");    
  var trans_matrixLocation = gl.getUniformLocation(program, "u_trans_mat"); 
  var scale_matrixLocation = gl.getUniformLocation(program, "u_scale_mat"); 
  var y_rot_camera_matrixLocation = gl.getUniformLocation(program, "u_y_rot_camera_mat");
  var trans_camera_matrixLocation = gl.getUniformLocation(program, "u_trans_camera_mat"); 
  var textureLocation = gl.getUniformLocation(program, "u_texture"); 
  var uvLocation = gl.getUniformLocation(program, "u_uv");        

  var positionBuffer = gl.createBuffer();

  translation = [100, 150, 0];
  rotation = [degToRad(90), degToRad(180), degToRad(0)];
  scale = [0.001, 0.001, 0.001];
  color = [Math.random(), Math.random(), Math.random(), 1];
  fieldOfViewRadians = degToRad(90);
  cameraAngleRadians = degToRad(0);

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);   

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  setNormals(gl);

  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  setTexcoords(gl);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // Asynchronously load an image
  var image = new Image();
  requestCORSIfNotSameOrigin(image, "https://oleg-okhotnikov.ru/Cube.png")
  image.src = "https://oleg-okhotnikov.ru/Cube.png";
  image.addEventListener('load', function() {
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    // Check if the image is a power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    drawScene();
  });

  drawScene();

  webglLessonsUI.setupSlider("#x", {value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
  webglLessonsUI.setupSlider("#y", {value: translation[1], slide: updatePosition(1), max: gl.canvas.height});
  webglLessonsUI.setupSlider("#z", {value: translation[2], slide: updatePosition(2), max: gl.canvas.height});
  webglLessonsUI.setupSlider("#angleX", {value: radToDeg(rotation[0]), slide: updateRotation(0), max: 360});
  webglLessonsUI.setupSlider("#angleY", {value: radToDeg(rotation[1]), slide: updateRotation(1), max: 360});
  webglLessonsUI.setupSlider("#angleZ", {value: radToDeg(rotation[2]), slide: updateRotation(2), max: 360});
  webglLessonsUI.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: 0.001, max: 0.01, step: 0.001, precision: 2});
  webglLessonsUI.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: 0.001, max: 0.01, step: 0.001, precision: 2});
  webglLessonsUI.setupSlider("#scaleZ", {value: scale[2], slide: updateScale(2), min: 0.001, max: 0.01, step: 0.001, precision: 2});
  webglLessonsUI.setupSlider("#cameraAngle", {value: radToDeg(cameraAngleRadians), slide: updateCameraAngle(), min: -360, max: 360});
  webglLessonsUI.setupSlider("#fieldOfView", {value: radToDeg(fieldOfViewRadians), slide: updateFieldOfViewRadians(), min: -360, max: 360}); 
  webglLessonsUI.setupSlider("#uv", {value: uv, slide: updateUV(), min: 0, max: 200});    

  function updateUV() {
    return function(event, ui) {
      uv = ui.value / 100;
      drawScene();
    };
  }

  function updateFieldOfViewRadians() {
    return function(event, ui) {
      fieldOfViewRadians = degToRad(ui.value);
      drawScene();
    };
  }

  function updateCameraAngle() {
    return function(event, ui) {
      cameraAngleRadians = degToRad(ui.value);
      drawScene();
    };
  }

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[index] = angleInRadians;
      drawScene();
    };
  }

  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  function updateScale(index) {
    return function(event, ui) {
      scale[index] = ui.value;
      drawScene();
    };
  }

  // Draw the scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var size = 3;         
    var type = gl.FLOAT;   
    var normalize = false; 
    var stride = 0;       
    var offset = 0;        
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    gl.enableVertexAttribArray(normalLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    size = 3;         
    type = gl.FLOAT;   
    normalize = false; 
    stride = 0;       
    offset = 0;     
    gl.vertexAttribPointer(
        normalLocation, size, type, normalize, stride, offset);

    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    size = 2;          // 2 components per iteration
    type = gl.FLOAT;   // the data is 32bit floats
    normalize = false; // don't normalize the data
    stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset);

    gl.uniform4fv(colorLocation, color);
    gl.uniform1i(textureLocation, 0);

    trans_mat = m3.translation(translation[0], translation[1], translation[2]);
    x_rot_mat = m3.xRotation(rotation[0]);      
    y_rot_mat = m3.yRotation(rotation[1]);    
    z_rot_mat = m3.zRotation(rotation[2]);
    scale_mat = m3.scaling(scale[0], scale[1], scale[2]);
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    proj_mat = m3.perspective(fieldOfViewRadians, aspect, zNear, zFar);  

    gl.uniform3f(resolutionUniformLocation, gl.canvas.height / gl.canvas.width, 1, 1);
    gl.uniformMatrix4fv(proj_matrixLocation, false, proj_mat);    
    gl.uniformMatrix4fv(x_rot_matrixLocation, false, x_rot_mat);
    gl.uniformMatrix4fv(y_rot_matrixLocation, false, y_rot_mat); 
    gl.uniformMatrix4fv(z_rot_matrixLocation, false, z_rot_mat);        
    gl.uniformMatrix4fv(trans_matrixLocation, false, trans_mat); 
    gl.uniformMatrix4fv(scale_matrixLocation, false, scale_mat);

    gl.uniform1f(uvLocation, uv);    

    var radius = 200;           

    y_rot_camera_mat = m3.yRotation(cameraAngleRadians);
    trans_camera_mat = m3.translation(0, 0, radius * 1.5);

    gl.uniformMatrix4fv(y_rot_camera_matrixLocation, false, y_rot_camera_mat);
    gl.uniformMatrix4fv(trans_camera_matrixLocation, false, trans_camera_mat);    

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 384492;  // 6 triangles in the 'F', 3 points per triangle
    // var indexType = gl.UNSIGNED_SHORT;
    // gl.drawElements(primitiveType, count, indexType, offset);
    gl.drawArrays(primitiveType, offset, count);
  }
}

var m3 = {
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx / gl.canvas.clientWidth, ty / gl.canvas.clientHeight, tz / 800, 1,       
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, -near * far * rangeInv * 2, 0
    ];
  }
};

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array( myarray ),
      gl.STATIC_DRAW);
}

function setIndecies(gl){
  // var myarray2 = [];
  // var temp = JSON.parse(myarray);
  // for(var a in temp){
  //   myarray2.push(temp[a])
  // }

  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  var indices = [0, 4, 6, 6, 2, 0, 3, 2, 6, 6, 7, 3, 7, 6, 4, 4, 5, 7, 5, 1, 3, 3, 7, 5, 1, 0, 2, 2, 3, 1, 5, 4, 0, 0, 1, 5]

  gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
  ); 

}

function setNormals(gl) {
  var normals = new Float32Array(norm_array);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(tex_coord_array),
      gl.STATIC_DRAW);
}

function requestCORSIfNotSameOrigin(img, url) {
  if ((new URL(url, window.location.href)).origin !== window.location.origin) {
    img.crossOrigin = "";
  }
}

main();
