// references for lighting
// https://stackoverflow.com/questions/37342114/three-js-shadermaterial-lighting-not-working
// https://stackoverflow.com/questions/30151086/threejs-how-do-i-make-a-custom-shader-be-lit-by-the-scenes-lights
// https://stackoverflow.com/questions/35596705/using-lights-in-three-js-shader
const vertexShader = `
precision highp float;

// terrain parameters
uniform float max_height;
uniform int width_divisions;
uniform int depth_divisions;
uniform float width;
uniform float depth;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vNormalCamSpace;
varying vec3 vPosition;

uniform sampler2D heightmap;
uniform sampler2D normalmap;

void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;
  
  float position_x = modelMatrix[3][0];
  float position_y = modelMatrix[3][1];
  
  float position_z = modelMatrix[3][2];
  //float a = position_x / (4800.0/2.55);
  //float b = position_z / (4800.0/2.55);
  float a = float(width_divisions) * position_x / (100.0 * width);
  float b = float(depth_divisions) * position_z / (100.0 * depth);
  a = fract(a);
  b = fract(b);
  vUv = uv + vec2(a, b);

  //get vertex x and z in world coords
  float wx = position_x + position.x;
  float wz = position_z + position.z;

  //fix vertex world x and z to integer multiples of 1600 / 255
  //
  //float space = 4800.0 / 255.0;
  float space = width / (float(width_divisions) - 1.0);
  float ix = floor(wx / space) * space;
  float iz = floor(wz / space) * space;
  //get remainder parts to use to displace vertex x and z
  float rx = wx - ix;
  float rz = wz - iz;
  

  vec2 hUV = vec2(ix/width, iz/depth);// + vec2(0.5, 0.5);
  
  vec4 height = texture2D(heightmap, hUV) * max_height;
  vUv = hUV * 50.0;
  //vPosition.y = height.r;
  vPosition += vec3(-rx, height.r, -rz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
  vNormal = normalize(texture2D(normalmap, hUV).rgb);
  //transform vertex normal to camera space as direction lights will be in cam space in frag shader
  vNormalCamSpace = normalMatrix * vNormal;

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
varying vec3 vNormalCamSpace;
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
    
    //how near to vertical is the surface
    float verticality = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0)); // how vertical is the surface?
    float v_lower = 0.25;
    float v_upper = 0.4;
    if(verticality > v_lower && verticality < v_upper){
      verticality = (verticality - v_lower) / (v_upper - v_lower);
      //verticality = 1.0;
    }else if (verticality > v_upper){
      verticality = 1.0;
    }else {
      verticality = 0.0;
    }

    vec3 blend0 = heightblend( texture2D(sand_texture, vUv).rgb, texture2D(texture, vUv).rgb , vPosition.y, 360.0, 20.0);
    vec3 blend1 = heightblend( blend0, texture2D(rock_texture, vUv).rgb , vPosition.y, 700.0, 80.0);
    vec3 blend2 = mix(blend1, texture2D(rock_texture, vUv).rgb, verticality);
    vec3 blend3 = heightblend( blend2, vec3(1.0, 1.0, 1.0) , vPosition.y, 1000.0, 15.0);

#if (NUM_DIR_LIGHTS > 0)
    vec3 addlights = vec3(0.0, 0.0, 0.0);
    
    for(int i = 0; i < NUM_DIR_LIGHTS; i++) {
        DirectionalLight directLight = directionalLights[i];
        vec3 direction = directLight.direction;// - vPosition;
        addlights += clamp(dot(direction.xyz, vNormalCamSpace), 0.0, 1.0) * directLight.color;     
    }
    gl_FragColor = vec4(addlights * blend3, 1.0);
#endif

  
}
`;

AFRAME.registerComponent('terrain', {
    schema: {
      width_divisions: {default: 256, min: 8},
      depth_divisions: {default: 256, min: 8},
      depth: {default: 4800, min: 1},
      width: {default: 4800, min: 1},
      max_height: {default: 1200, min: 1},
    },

    //generates a chunk of terrain geometry
    generateChunk: function(start_x, start_y, chunk_width, chunk_depth){
      //declare some temporary vars just once, for reuse      
      let t_point = {x:0, y:0, z:0};

      let geometry = new THREE.Geometry();            
      let centroid = {x:0, y:0, z:0};
      let spacing_x = (this.data.width / ((this.data.width_divisions / chunk_width) + 1)) / (chunk_width - 1);
      let spacing_y = (this.data.depth / ((this.data.depth_divisions / chunk_depth) + 1)) / (chunk_depth - 1);
            
      for(let y = start_y; y < chunk_depth + start_y; y++){        
        for(let x = start_x; x < chunk_width + start_x; x++){                              
          t_point.x = (x - start_x) * spacing_x;
          t_point.y = 0;
          t_point.z = (y - start_y) * spacing_y;
          t_point.y = this.getHeight(x * spacing_x, y * spacing_y);
          centroid.x += t_point.x;
          centroid.y += t_point.y;
          centroid.z += t_point.z;             
          geometry.vertices.push(new THREE.Vector3(t_point.x, 0, t_point.z));          
          
        }
      }  

      let v,nv,u,nu, i;

      for(let y = 0; y < chunk_depth - 1; y++){                
        v = (y + start_y) * 0.1;
        nv = v + 0.1;
        for(let x = 0; x < chunk_width - 1; x++){
          u = (x + start_x) * 0.1;
          nu = u + 0.1;      
          i = (y * chunk_width) + x;  
          
          geometry.faces.push(new THREE.Face3(i + chunk_width, i + 1, i ));          
          geometry.faces.push(new THREE.Face3(i + chunk_width, i + chunk_width + 1, i + 1));
          geometry.faceVertexUvs[0].push( [new THREE.Vector2(u, nv), new THREE.Vector2(nu, v), new THREE.Vector2(u,v)] );  
          geometry.faceVertexUvs[0].push( [new THREE.Vector2(u,nv), new THREE.Vector2(nu,nv), new THREE.Vector2(nu, v)] );                                
        }  
      }

      geometry.mergeVertices();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
            
      centroid.x = chunk_width * spacing_x / 2;      
      centroid.z = chunk_depth * spacing_y / 2;
      centroid.y = this.data.max_height / 2;
      radius = Math.sqrt(centroid.x ** 2 + centroid.y **2 + centroid.z **2);      
      
      let bufGeometry =  new THREE.BufferGeometry().fromGeometry(geometry);
      bufGeometry.boundingSphere = {
        radius: radius,
        center: centroid
      };
      
      
      return bufGeometry;
    },

    getWidth: function(){
      return this.data.width;
    },

    getDepth: function(){
      return this.data.depth;
    },

    getHeight: function(x, y){      
      let w = this.data.width;
      let d = this.data.depth;
      x = ((x % w) + w) % w;
      y = ((y % d) + d) % d;
      let w_div = this.data.width_divisions;
      let d_div = this.data.depth_divisions;
      let spacing_x = w / (w_div - 1);
      let spacing_y = d / (d_div - 1);

      let iy = (y / spacing_y) | 0;
      let ix = (x / spacing_x) | 0;

      //position x and y within local cell, normalised to range 0.0 to 1.0
      let fx = (x - (ix * spacing_x)) / spacing_x;
      let fy = (y - (iy * spacing_y)) / spacing_y;

      let vertex = (iy * w_div) + ix;

      //get heights of the four surrounding vertices and interpolate
      let h0 = this.heightMap[vertex];
      let h1 = this.heightMap[vertex + 1];
      let h2 = this.heightMap[vertex + d_div];
      let h3 = this.heightMap[vertex + d_div + 1];
      let h01 = h0 * (1 - fx) + (h1 * fx);
      let h23 = h2 * (1 - fx) + (h3 * fx);
      let h = h01 * (1 - fy) + (h23 * fy);

      return h;
    },

    // helper function - generates perlin noise based heightmap and stores it
    // as an array for use in getting height later and as a canvas context to
    //be used as a texture
    generateHeightMap: function(){
      let perlin_gen = new PerlinNoiseGenerator();      
      this.heightMap = perlin_gen.generate2(this.data.width_divisions, this.data.depth_divisions, [128, 64, 32, 16, 8], [1, 0.5, 0.25, 0.125, 0.125/2]);      
      
      let mapDim = {
        x: this.data.width_divisions,
        y: this.data.depth_divisions,
      }
      
      this.heightMapCanvas = document.getElementById("heightcanvas");
      let ctx = this.heightMapCanvas.getContext("2d");

      let imgData = ctx.createImageData(mapDim.x, mapDim.y);
            
      for (let i = 0; i < imgData.data.length; i += 4) {          
          let px = (i/4) % mapDim.x;
          let py = ((i/4) / mapDim.x) | 0;
          let p = this.heightMap[i / 4];
          let rgb = (p * 255) | 0;
          //our canvas and therefore the texture is upside down relative to the 
          //orientation we store the height values in so we calculate a new img
          //index that flips the heightmap vertically.
          let img_index = (mapDim.x * ((mapDim.y - 1) - py)) + px;
          img_index *= 4;
                    
          imgData.data[img_index+0] = rgb;
          imgData.data[img_index+1] = rgb;
          imgData.data[img_index+2] = rgb;
          imgData.data[img_index+3] = 255;                    
      }

      for(let i = 0;i < this.heightMap.length; i++){
        this.heightMap[i] *= this.data.max_height;            
      }
      
      ctx.putImageData(imgData, 0, 0);   
    },

    generateNormalMap: function(){
      let vertexSpacing = {
        x: this.data.width / (this.data.width_divisions - 1),
        z: this.data.depth / (this.data.depth_divisions - 1),
      }
      let mapDim = {
        x: this.data.width_divisions,
        y: this.data.depth_divisions,
      }

      let scene = this.el.sceneEl;     
      this.normalMapCanvas = document.getElementById("normcanvas");
      let ctx = this.normalMapCanvas.getContext("2d");
      let imgData = ctx.createImageData(this.data.width_divisions, this.data.depth_divisions);      
      for (let i = 0; i < imgData.data.length; i += 4) {
          let v_index = i / 4; //current vertex index                     
          let ix = v_index % mapDim.x;
          let iy = (v_index / mapDim.x) | 0;
          
          let img_index = (mapDim.x * ((mapDim.y - 1) - iy)) + ix;
          img_index *= 4;

          let curVertex = new THREE.Vector3(0,0,0);
          curVertex.x = ix * vertexSpacing.x;
          curVertex.y = this.heightMap[ix + iy * mapDim.y];
          curVertex.z = iy * vertexSpacing.z;
          
          //build array of surrounding vertix indices (there are six)
          
          let vertex_indices = [];
          vertex_indices.push( {x: ix - 1, y : iy + 1} );
          vertex_indices.push( {x: ix    , y : iy + 1} );
          vertex_indices.push( {x: ix + 1, y : iy    } );
          vertex_indices.push( {x: ix + 1, y : iy - 1} );
          vertex_indices.push( {x: ix    , y : iy - 1} );
          vertex_indices.push( {x: ix - 1, y : iy    } );
                    
          //now fetch actual vertex x, y, z values
          let vertices = vertex_indices.map( (vi) => {
            let v = {x: 0, y: 0, z: 0};
            v.x = vi.x * vertexSpacing.x;
            v.z = vi.y * vertexSpacing.z;

            v.y = this.heightMap[((vi.x + mapDim.x) % mapDim.x)+ ((vi.y + mapDim.y) % mapDim.y) * mapDim.x];
            return new THREE.Vector3(v.x, v.y, v.z);
          });  

          let normal = new THREE.Vector3(0,0,0);
          let v1 = new THREE.Vector3(0,0,0);
          let v2 = new THREE.Vector3(0,0,0);
          let n = new THREE.Vector3(0,0,0);
          let next_f;
          //iterate through 6 surrounding faces
          for(let f = 0; f < 6; f++){
            next_f = (f + 1) % 6;            
            v1.subVectors(vertices[f], curVertex);
            v2.subVectors(vertices[next_f], curVertex);
            n.crossVectors(v1, v2);
            normal.add(n);
          }
          normal.normalize();

          imgData.data[img_index+0] = (normal.x * 255) | 0;
          imgData.data[img_index+1] = (normal.y * 255) | 0;
          imgData.data[img_index+2] = (normal.z * 255) | 0;
          imgData.data[img_index+3] = 255;                    
      }
      
      ctx.putImageData(imgData, 0, 0);   

    },

    init: function () {        
      //sets up this.heightMap and this.heightMapCanvas
      this.generateHeightMap();
      this.generateNormalMap();
      let texture = new THREE.TextureLoader().load( "assets/grass.jpg");
      texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
      let rock_texture = new THREE.TextureLoader().load( "assets/rock.jpg");
      rock_texture.wrapT = rock_texture.wrapS = THREE.RepeatWrapping;
      let sand_texture = new THREE.TextureLoader().load( "assets/sand.jpg");
      sand_texture.wrapT = sand_texture.wrapS = THREE.RepeatWrapping;
      let heightmap = new THREE.CanvasTexture(this.heightMapCanvas);
      heightmap.wrapT = heightmap.wrapS = THREE.RepeatWrapping;
      let normalmap = new THREE.CanvasTexture(this.normalMapCanvas);
      normalmap.wrapT = normalmap.wrapS = THREE.RepeatWrapping;
      
      let uniforms = {     
        texture: { type: "t", value: null },
        rock_texture: { type: "t", value: null },
        sand_texture: { type: "t", value: null },
        heightmap: { type: "t", value: null},
        normalmap: { type: "t", value: null},
        max_height: { type: "f", value: this.data.max_height}, 
        width_divisions: {type: 'f', value: this.data.width_divisions},
        depth_divisions: {type: 'f', value: this.data.depth_divisions},
        width: {type: 'f', value: this.data.width},
        depth: {type: 'f', value: this.data.depth},       
      };
      uniforms = THREE.UniformsUtils.merge( [
        THREE.UniformsLib[ "lights" ],
        uniforms
      ] );
      //textures get removed during the uniform merge so I set these here rather than above
      uniforms.texture.value = texture;
      uniforms.rock_texture.value = rock_texture;
      uniforms.sand_texture.value = sand_texture;
      uniforms.heightmap.value = heightmap;
      uniforms.normalmap.value = normalmap;
      //console.dir(uniforms);
          
      this.material  = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader,
        fragmentShader,
        lights:true
      });

      let geo;
      let mesh; 
      //n chunks must be > chunk size
      let n_chunks_x = this.data.width_divisions / 16;
      let n_chunks_y = this.data.depth_divisions / 16;
      for(let j = 0; j < n_chunks_y + 1; j++){
        for(let i = 0; i < n_chunks_x + 1; i++){
          //console.log("Generating terrain chunk...");
          //console.log('j=', j);
          geo = this.generateChunk((i* n_chunks_x) - i, (j * n_chunks_y) - j, n_chunks_x, n_chunks_y);          
          mesh = new THREE.Mesh(geo, this.material);
          mesh.position.x = i * this.data.width / (n_chunks_x + 1);                                                     
          mesh.position.y = 0;
          mesh.position.z = j * this.data.depth/ (n_chunks_y + 1);
          mesh.frustumCulled=true;
          //mesh.position.x*=1.1;
          //mesh.position.z*=1.1;
          
          this.el.object3D.add(mesh);
          
         // if(i > 1)break;
        }   
       // if(j>1)break;  
      }     
    
      //find and record the sea element
      this.seaEl = this.el.sceneEl.querySelector('#sea');
      
      
    },

    update: function(){
      
    },

    tick: function(){
      
      
      

      this.do_tick();
    },

    

    do_tick: (function () {
      let h = 0;
      this.cameraEl = null;
      
      return function () {  
        if(this.cameraEl == null){
          this.cameraEl = document.querySelector("#camera");
          return;
        }
          
        this.el.object3D.position.x = this.cameraEl.object3D.position.x - (this.data.width / 2);
        this.el.object3D.position.z = this.cameraEl.object3D.position.z - (this.data.depth / 2);  
        this.seaEl.object3D.position.x = this.cameraEl.object3D.position.x;
        this.seaEl.object3D.position.z = this.cameraEl.object3D.position.z;
         


        h = Math.max(
          this.getHeight(this.cameraEl.object3D.position.x, this.cameraEl.object3D.position.z) + 10, 
          this.seaEl.object3D.position.y + 10
        );
        if(this.cameraEl.object3D.position.y < h){
          this.cameraEl.object3D.position.set(this.cameraEl.object3D.position.x, h, this.cameraEl.object3D.position.z);
        }
      };
    })(),


    
  });