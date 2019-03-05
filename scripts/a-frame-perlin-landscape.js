const vertexShader = `
precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
uniform sampler2D heightmap;
uniform float max_height;
void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;
  //float position_x = mod(modelMatrix[3][0], 1600.0);
  float position_x = modelMatrix[3][0];
  float position_y = modelMatrix[3][1];
  //float position_z = mod(modelMatrix[3][2], 1600.0);
  float position_z = modelMatrix[3][2];
  float a = position_x / (1600.0/2.55);
  float b = position_z / (1600.0/2.55);
  a = fract(a);
  b = fract(b);
  vUv = uv + vec2(a, b);

  //get vertex x and z in world coords
  float wx = position_x + position.x;
  float wz = position_z + position.z;

  //fix vertex world x and z to integer multiples of 1600 / 255
  //
  float space = 1600.0 / 255.0;
  float ix = floor(wx / space) * space;
  float iz = floor(wz / space) * space;
  //get remainder parts to use to displace vertex x and z
  float rx = wx - ix;
  float rz = wz - iz;
  

  vec2 hUV = vec2(ix/1600.0, iz/1600.0);


  vec4 height = texture2D(heightmap, hUV) * 300.0;
  vUv = hUV * 15.0;
  //vPosition.y = height.r;
  vPosition += vec3(-rx, height.r, -rz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
}
`;



const fragmentShader = `

uniform sampler2D texture;
uniform sampler2D rock_texture;
uniform sampler2D sand_texture;
varying vec3 vNormal; 
varying vec3 vPosition;
varying vec2 vUv;

vec3 heightblend(vec3 color1, vec3 color2, float vertexHeight, float transitionHeight, float blendDistance)
{    
    
    float level2 = clamp((vertexHeight - (transitionHeight - blendDistance)) / (transitionHeight - (transitionHeight - blendDistance)), 0.0, 1.0);    
    float level1 = 1.0 - level2;
    return (color1 * level1) + (color2 * level2);
}

void main() {
    vec3 light = vec3(0.5, 0.5, 1.0);
    light = normalize(light);

    float dProd = 0.5 + 0.5 * max(0.0, dot(vNormal, light));

    vec3 blend0 = heightblend( texture2D(sand_texture, vUv).rgb, texture2D(texture, vUv).rgb , vPosition.y, 120.0, 10.0);
    vec3 blend1 = heightblend( blend0, texture2D(rock_texture, vUv).rgb , vPosition.y, 225.0, 30.0);
    vec3 blend2 = heightblend( blend1, vec3(1.0, 1.0, 1.0) , vPosition.y, 275.0, 15.0);
    gl_FragColor = vec4(dProd * blend2, 1.0);

    //green - x axis
    //blue y axis

    float x = abs(vUv.x) - floor(abs(vUv.x));
    float y = abs(vUv.y) - floor(abs(vUv.y));
    /*if(x < 0.01 || y < 0.01){      
        gl_FragColor = vec4(x, y, 0.0, 1.0);      
    }else{
        vec3 c = vec3(vUv.x, vUv.y, 0.0);
        vec3 c2 = vec3(dProd * blend2);
        vec3 f = (0.25 * c) + (0.75 * c2);
        //gl_FragColor = vec4(f, 1.0);
    }*/
      

}
`;

var debug = {
  do: true,
  maxu: 0.0,
  maxv: 0.0,
  max_x:0,
  max_y:0,  
  space_x: null,
  space_y: null,
  recordxy: function(x, y){
    if(x>this.max_x)this.max_x = x;
    if(y > this.max_y)this.max_y = y;
  },
  recorduv: function(u, v){
    if(u>this.max_u)this.max_u = u;
    if(v > this.max_v)this.max_v = v;
  },
  recordspacing: function (x, y){
    this.space_x = x;
    this.space_y = y;
  }
};



AFRAME.registerComponent('terrain', {
    schema: {
      width_divisions: {default: 128, min: 8},
      depth_divisions: {default: 128, min: 8},
      depth: {default: 100, min: 1},
      width: {default: 100, min: 1},
      max_height: {default: 10, min: 1},
    },

    //generates a chunk of terrain geometry
    generateChunk: function(start_x, start_y, chunk_width, chunk_depth){
      var geometry = new THREE.Geometry();      
      
      var spacing_x = (this.data.width / ((this.data.width_divisions / chunk_width) + 1)) / (chunk_width - 1);
      var spacing_y = (this.data.depth / ((this.data.depth_divisions / chunk_depth) + 1)) / (chunk_depth - 1);
      debug.recordspacing(spacing_x, spacing_y);
      //console.log("start y = " + start_y);
      for(var y = start_y; y < chunk_depth + start_y; y++){        
        for(var x = start_x; x < chunk_width + start_x; x++){          
          var height = this.heightMap[x + (y * this.data.depth_divisions)];
          //console.log(x+", "+y)          
          geometry.vertices.push(new THREE.Vector3((x - start_x) * spacing_x, 0.0*height , (y - start_y) * spacing_y));          
          if(debug.do){
            debug.recordxy((x - start_x) * spacing_x, (y - start_y) * spacing_y);

          }
        }
      }  

      var v,nv,u,nu;

      for(var y = 0; y < chunk_depth - 1; y++){        
        var x_str = '';
        v = (y + start_y) * 0.1;
        nv = v + 0.1;
        for(var x = 0; x < chunk_width - 1; x++){
          u = (x + start_x) * 0.1;
          nu = u + 0.1;      
          var i = (y * chunk_depth) + x;  
          
          geometry.faces.push(new THREE.Face3(i + chunk_depth, i + 1, i ));          
          geometry.faces.push(new THREE.Face3(i + chunk_depth, i + chunk_depth + 1, i + 1));
          geometry.faceVertexUvs[0].push( [new THREE.Vector2(u, nv), new THREE.Vector2(nu, v), new THREE.Vector2(u,v)] );  
          geometry.faceVertexUvs[0].push( [new THREE.Vector2(u,nv), new THREE.Vector2(nu,nv), new THREE.Vector2(nu, v)] );                                

        }

        
      }

      //console.log("u=" + u + ", v=" + v);
      geometry.mergeVertices();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      return geometry;
    },

    getWidth: function(){
      return this.data.width;
    },

    getDepth: function(){
      return this.data.depth;
    },

    getHeight: function(x, y){
      var w = this.data.width;
      var d = this.data.depth;
      var w_div = this.data.width_divisions;
      var d_div = this.data.depth_divisions;
      var spacing_x = w / (w_div - 1);
      var spacing_y = d / (d_div - 1);

      var iy = (y / spacing_y) | 0;
      var ix = (x / spacing_x) | 0;

      //position x and y within local cell, normalised to range 0.0 to 1.0
      var fx = (x - (ix * spacing_x)) / spacing_x;
      var fy = (y - (iy * spacing_y)) / spacing_y;

      var vertex = (iy * w_div) + ix;

      //get heights of the four surrounding vertices and interpolate
      var h0 = this.heightMap[vertex];
        var h1 = this.heightMap[vertex + 1];
      var h2 = this.heightMap[vertex + d_div];
      var h3 = this.heightMap[vertex + d_div + 1];
      var h01 = h0 * (1 - fx) + (h1 * fx);
      var h23 = h2 * (1 - fx) + (h3 * fx);
      var h = h01 * (1 - fy) + (h23 * fy);
      
      /*console.log("ix = " + ix + ", iy = " + iy);
      console.log("spacing x = " + spacing_x + ", spacing y = " + spacing_y);
      console.log("nearest vertex = " + (ix*spacing_x) + ", " + (iy*spacing_y));
      console.log("fx = " + fx + ", fy = " + fy);
      console.log("Vertex index = " + vertex);
      
      console.log("Height = " + h);*/
      return h;
    },

    init: function () {      
      var perlin_gen = new PerlinNoiseGenerator();
      //var perlinData =perlin_gen.generate(this.data.width_divisions, this.data.depth_divisions, 128, 5, 1.4);
      this.heightMap = perlin_gen.generate2(512, 512, [128, 64, 32, 16], [1, 0.5, 0.25, 0.125]);      
      //fix the height map
      //for(var i = 0;i < this.heightMap.length; i++){
      //  this.heightMap[i] = (this.heightMap[i] * 255.0) | 0;//this.data.max_height;
        //this.heightMap[i] = 0;
      //}      
      //this.material = new THREE.MeshStandardMaterial({color: this.data.color});
      
      var scene = this.el.sceneEl;
      this.cameraEl = document.querySelector("a-camera");     
      var c = document.getElementById("canvas");
      var ctx = c.getContext("2d");
      var imgData = ctx.createImageData(512, 512);      
      for (var i = 0; i < imgData.data.length; i += 4) {
          var p = this.heightMap[i / 4];
          var rgb = (p * 255) | 0;

          //var px = (i/4) % 512;
          //var py = ((i/4) / 512) | 0;
          //px = px * (2 * Math.PI) / 512;
          //py = py * (2 * Math.PI) / 512;
          //rgb = 128 * Math.sin(px) * Math.sin(py);

          //rgb = (px % 2) * (py % 2) * 128;

          imgData.data[i+0] = rgb;
          imgData.data[i+1] = rgb;
          imgData.data[i+2] = rgb;
          imgData.data[i+3] = 255;
      }
      
      ctx.putImageData(imgData, 0, 0);      
      var texture = new THREE.TextureLoader().load( "assets/grass.jpg");
      texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
      var rock_texture = new THREE.TextureLoader().load( "assets/rock.jpg");
      rock_texture.wrapT = rock_texture.wrapS = THREE.RepeatWrapping;
      var sand_texture = new THREE.TextureLoader().load( "assets/sand.jpg");
      sand_texture.wrapT = sand_texture.wrapS = THREE.RepeatWrapping;
      var heightmap = new THREE.CanvasTexture(c);
      heightmap.wrapT = heightmap.wrapS = THREE.RepeatWrapping;

      this.material  = new THREE.ShaderMaterial({
        uniforms: {          
          texture: { type: "t", value: texture },
          rock_texture: { type: "t", value: rock_texture },
          sand_texture: { type: "t", value: sand_texture },
          heightmap: { type: "t", value: heightmap},
          max_height: { type: "float", value: this.data.max_height}
        },
        vertexShader,
        fragmentShader
      });
      //this.material = new THREE.MeshBasicMaterial({ wireframe:true, color: "green"});

      var geo;
      var mesh; 
      //n chunks must be > chunk size
      for(var j = 0; j < 17; j++){
        for(var i = 0; i < 17; i++){
          //console.log("Generating terrain chunk...");
          //console.log('j=', j);
          geo = this.generateChunk((i* 16) - i, (j * 16) - j, 16, 16);
          mesh = new THREE.Mesh(geo, this.material);
          mesh.position.x = i * 1600/17;                                                    
          mesh.position.y = 0;
          mesh.position.z = j * 1600/17;
          mesh.frustumCulled=false;
          //mesh.position.x*=1.1;
          //mesh.position.z*=1.1;
          this.el.object3D.add(mesh);
          

        }     
      }     
    
      if(debug.do)
        console.dir(debug);
      
      //fix the height map
      for(var i = 0;i < this.heightMap.length; i++){
          this.heightMap[i] = this.heightMap[i] * this.data.max_height;
        //this.heightMap[i] = 0;
      }
    },

    tick: function(){
      this.el.object3D.position.x = this.cameraEl.object3D.position.x - 800.0;
      this.el.object3D.position.z = this.cameraEl.object3D.position.z - 800.0;
    },
    
  });