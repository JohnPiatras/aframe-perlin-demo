// references for lighting
// https://stackoverflow.com/questions/37342114/three-js-shadermaterial-lighting-not-working
// https://stackoverflow.com/questions/30151086/threejs-how-do-i-make-a-custom-shader-be-lit-by-the-scenes-lights
// https://stackoverflow.com/questions/35596705/using-lights-in-three-js-shader
const vertexShader = `
precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D heightmap;
uniform sampler2D normalmap;
uniform float max_height;
void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;
  
  float position_x = modelMatrix[3][0];
  float position_y = modelMatrix[3][1];
  
  float position_z = modelMatrix[3][2];
  float a = position_x / (3200.0/2.55);
  float b = position_z / (3200.0/2.55);
  a = fract(a);
  b = fract(b);
  vUv = uv + vec2(a, b);

  //get vertex x and z in world coords
  float wx = position_x + position.x;
  float wz = position_z + position.z;

  //fix vertex world x and z to integer multiples of 1600 / 255
  //
  float space = 4800.0 / 255.0;
  float ix = floor(wx / space) * space;
  float iz = floor(wz / space) * space;
  //get remainder parts to use to displace vertex x and z
  float rx = wx - ix;
  float rz = wz - iz;
  

  vec2 hUV = vec2(ix/4800.0, -iz/4800.0) + vec2(0.5, 0.5);


  vec4 height = texture2D(heightmap, hUV) * max_height;
  vUv = hUV * 50.0;
  //vPosition.y = height.r;
  vPosition += vec3(-rx, height.r - (max_height / 2.0), -rz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
  vNormal = texture2D(normalmap, hUV).rgb;
  //transform vertex normal to camera space as direction lights will be in cam space in frag shader
  vNormal = normalMatrix * vNormal;

}
`;



const fragmentShader = `
#if (NUM_DIR_LIGHTS > 0)
struct DirectionalLight {
  vec3 direction;
  vec3 color;
  int shadow;
	float shadowBias;
	float shadowRadius;
	vec2 shadowMapSize;
};
uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif

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
    vec3 light = vec3(1.0, 0.5, 0.0);
    light = normalize(light);

    float dProd = 1.0;//0.5 + 0.5 * max(0.0, dot(vNormal, light));
    
    vec3 blend0 = heightblend( texture2D(sand_texture, vUv).rgb, texture2D(texture, vUv).rgb , vPosition.y, 120.0, 10.0);
    vec3 blend1 = heightblend( blend0, texture2D(rock_texture, vUv).rgb , vPosition.y, 350.0, 30.0);
    vec3 blend2 = heightblend( blend1, vec3(1.0, 1.0, 1.0) , vPosition.y, 500.0, 15.0);
    
    gl_FragColor = dProd * vec4(blend2, 1.0);
  
#if (NUM_DIR_LIGHTS > 0)
    vec3 addlights = vec3(0.0, 0.0, 0.0);
    
    for(int i = 0; i < NUM_DIR_LIGHTS; i++) {
        DirectionalLight directLight = directionalLights[i];
        vec3 direction = directLight.direction;// - vPosition;
        addlights += clamp(dot(direction.xyz, vNormal), 0.0, 1.0) * directLight.color;     
    }
    gl_FragColor = vec4(addlights * blend2, 1.0);
#endif
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
      //var spacing_x = this.data.width / this.data.width_divisions;//(this.data.width / ((this.data.width_divisions / chunk_width) + 1)) / (chunk_width - 1);
      //var spacing_y = this.data.depth / this.data.depth_divisions;//(this.data.depth / ((this.data.depth_divisions / chunk_depth) + 1)) / (chunk_depth - 1);
      debug.recordspacing(spacing_x, spacing_y);
      //console.log("start y = " + start_y);
      for(var y = start_y; y < chunk_depth + start_y; y++){        
        for(var x = start_x; x < chunk_width + start_x; x++){                    
          //console.log(x+", "+y)          
          geometry.vertices.push(new THREE.Vector3((x - start_x) * spacing_x, this.data.max_height / 2 , (y - start_y) * spacing_y));          
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
          var i = (y * chunk_width) + x;  
          
          geometry.faces.push(new THREE.Face3(i + chunk_width, i + 1, i ));          
          geometry.faces.push(new THREE.Face3(i + chunk_width, i + chunk_width + 1, i + 1));
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
      if(x == 800 && y == 800){
        console.log("ix = " + ix + ", iy = " + iy);
        console.log("spacing x = " + spacing_x + ", spacing y = " + spacing_y);
        console.log("nearest vertex = " + (ix*spacing_x) + ", " + (iy*spacing_y));
        console.log("fx = " + fx + ", fy = " + fy);
        console.log("Vertex index = " + vertex);
      
        console.log("Height = " + h);
      }
      return h;
    },

    // helper function - generates perlin noise based heightmap and stores it
    // as an array for use in getting height later and as a canvas context to
    //be used as a texture
    generateHeightMap: function(){
      var perlin_gen = new PerlinNoiseGenerator();
      //var perlinData =perlin_gen.generate(this.data.width_divisions, this.data.depth_divisions, 128, 5, 1.4);
      this.heightMap = perlin_gen.generate2(this.data.width_divisions, this.data.depth_divisions, [128, 64, 32, 16, 8], [1, 0.5, 0.25, 0.125, 0.125/2]);      
      
      var scene = this.el.sceneEl;
      this.cameraEl = document.querySelector("a-camera");     
      this.heightMapCanvas = document.getElementById("heightcanvas");
      var ctx = this.heightMapCanvas.getContext("2d");
      var imgData = ctx.createImageData(this.data.width_divisions, this.data.depth_divisions);      
      for (var i = 0; i < imgData.data.length; i += 4) {
          var p = this.heightMap[i / 4];
          var rgb = (p * 255) | 0;

          /*var px = (i/4) % 512;
          var py = ((i/4) / 512) | 0;
          if(px > 127 & py > 127){
            this.heightMap[i/4] = 0;            
          }else if(px == py) {
            this.heightMap[i/4] = 1.0; 
          }else{
            px = px * (2 * Math.PI) / 512;
            py = py * (2 * Math.PI) / 512;          
            this.heightMap[i/4] = Math.abs(Math.sin(px) * Math.sin(py));
          }
          rgb = (255 * this.heightMap[i/4]) | 0;
          //rgb = (px % 2) * (py % 2) * 128;*/
          
          imgData.data[i+0] = rgb;
          imgData.data[i+1] = rgb;
          imgData.data[i+2] = rgb;
          imgData.data[i+3] = 255;
          //this.heightMap[i/4] = imgData[i];
          
      }

      for(var i = 0;i < this.heightMap.length; i++){
        this.heightMap[i] *= this.data.max_height;            
      }
      
      ctx.putImageData(imgData, 0, 0);   
    },

    generateNormalMap: function(){
      var vertexSpacing = {
        x: this.data.width / (this.data.width_divisions - 1),
        z: this.data.depth / (this.data.depth_divisions - 1),
      }
      var mapDim = {
        x: this.data.width_divisions,
        y: this.data.depth_divisions,
      }

      var scene = this.el.sceneEl;     
      this.normalMapCanvas = document.getElementById("normcanvas");
      var ctx = this.normalMapCanvas.getContext("2d");
      var imgData = ctx.createImageData(this.data.width_divisions, this.data.depth_divisions);      
      for (var i = 0; i < imgData.data.length; i += 4) {
          var v_index = i / 4; //current vertex index                     
          var ix = v_index % this.data.width_divisions;
          var iy = (v_index / this.data.width_divisions) | 0;
          var curVertex = new THREE.Vector3(0,0,0);
          curVertex.x = ix * vertexSpacing.x;
          curVertex.y = this.heightMap[ix + iy * mapDim.y];
          curVertex.z = iy * vertexSpacing.z;
          
          //build array of surrounding vertix indices (there are six)
          
          var vertex_indices = [];
          vertex_indices.push( {x: ix - 1, y : iy + 1} );
          vertex_indices.push( {x: ix    , y : iy + 1} );
          vertex_indices.push( {x: ix + 1, y : iy    } );
          vertex_indices.push( {x: ix + 1, y : iy - 1} );
          vertex_indices.push( {x: ix    , y : iy - 1} );
          vertex_indices.push( {x: ix - 1, y : iy    } );
                    
          //now fetch actual vertex x, y, z values
          var vertices = vertex_indices.map( (vi) => {
            var v = {x: 0, y: 0, z: 0};
            v.x = vi.x * vertexSpacing.x;
            v.z = vi.y * vertexSpacing.z;

            v.y = this.heightMap[((vi.x + 256) % 256)+ ((vi.y + 256) % 256) * mapDim.y];
            return new THREE.Vector3(v.x, v.y, v.z);
          });  

          var normal = new THREE.Vector3(0,0,0);
          var v1 = new THREE.Vector3(0,0,0);
          var v2 = new THREE.Vector3(0,0,0);
          var n = new THREE.Vector3(0,0,0);
          var next_f;
          //iterate through 6 surrounding faces
          for(var f = 0; f < 6; f++){
            next_f = (f + 1) % 6;            
            v1.subVectors(vertices[f], curVertex);
            v2.subVectors(vertices[next_f], curVertex);
            n.crossVectors(v1, v2);
            normal.add(n);
          }
          normal.normalize();

          imgData.data[i+0] = (normal.x * 255) | 0;
          imgData.data[i+1] = (normal.y * 255) | 0;
          imgData.data[i+2] = (normal.z * 255) | 0;
          imgData.data[i+3] = 255;                    
      }
      
      ctx.putImageData(imgData, 0, 0);   

    },

    init: function () {        
      //sets up this.heightMap and this.heightMapCanvas
      this.generateHeightMap();
      this.generateNormalMap();
      var texture = new THREE.TextureLoader().load( "assets/grass.jpg");
      texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
      var rock_texture = new THREE.TextureLoader().load( "assets/rock.jpg");
      rock_texture.wrapT = rock_texture.wrapS = THREE.RepeatWrapping;
      var sand_texture = new THREE.TextureLoader().load( "assets/sand.jpg");
      sand_texture.wrapT = sand_texture.wrapS = THREE.RepeatWrapping;
      var heightmap = new THREE.CanvasTexture(this.heightMapCanvas);
      heightmap.wrapT = heightmap.wrapS = THREE.RepeatWrapping;
      var normalmap = new THREE.CanvasTexture(this.normalMapCanvas);
      normalmap.wrapT = normalmap.wrapS = THREE.RepeatWrapping;
      
      var uniforms = {     
        texture: { type: "t", value: null },
        rock_texture: { type: "t", value: null },
        sand_texture: { type: "t", value: null },
        heightmap: { type: "t", value: heightmap},
        normalmap: { type: "t", value: normalmap},
        max_height: { type: "f", value: this.data.max_height},        
      };
      uniforms = THREE.UniformsUtils.merge( [
        THREE.UniformsLib[ "lights" ],
        uniforms
      ] );
      //textures get removed during the uniform merge so I set these here rather than above
      uniforms.texture.value = texture;
      uniforms.rock_texture.value = rock_texture;
      uniforms.sand_texture.value = sand_texture;
    
      console.dir(uniforms);
          
      this.material  = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader,
        fragmentShader,
        lights:true
      });

      var geo;
      var mesh; 
      //n chunks must be > chunk size
      var n_chunks_x = this.data.width_divisions / 16;
      var n_chunks_y = this.data.depth_divisions / 16;
      for(var j = 0; j < n_chunks_y + 1; j++){
        for(var i = 0; i < n_chunks_x + 1; i++){
          //console.log("Generating terrain chunk...");
          //console.log('j=', j);
          geo = this.generateChunk((i* n_chunks_x) - i, (j * n_chunks_y) - j, n_chunks_x, n_chunks_y);
          mesh = new THREE.Mesh(geo, this.material);
          mesh.position.x = i * this.data.width / (n_chunks_x + 1);                                                     
          mesh.position.y = 0;
          mesh.position.z = j * this.data.depth/ (n_chunks_y + 1);
          //mesh.frustumCulled=false;
          //mesh.position.x*=1.1;
          //mesh.position.z*=1.1;
          this.el.object3D.add(mesh);
          

        }     
      }     
    
      //find and record the sea element
      this.seaEl = this.el.sceneEl.querySelector('#sea');
      
      
    },

    update: function(){
      
    },

    tick: function(){
      
      this.el.object3D.position.x = this.cameraEl.object3D.position.x - (this.data.width / 2);
      this.el.object3D.position.z = this.cameraEl.object3D.position.z - (this.data.depth / 2);  
      this.seaEl.object3D.position.x = this.cameraEl.object3D.position.x;
      this.seaEl.object3D.position.z = this.cameraEl.object3D.position.z;

      var h = this.getHeight(this.cameraEl.object3D.position.x + (this.data.width / 2), this.cameraEl.object3D.position.z + (this.data.depth / 2));
      if(this.cameraEl.object3D.position.y < h){
        this.cameraEl.object3D.position.set(this.cameraEl.object3D.position.x, h + 25, this.cameraEl.object3D.position.z);
      }
    },
    
  });