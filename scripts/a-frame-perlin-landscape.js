const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
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
}
`;



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
      //console.log("start y = " + start_y);
      for(var y = start_y; y < chunk_depth + start_y; y++){        
        for(var x = start_x; x < chunk_width + start_x; x++){          
          var height = this.heightMap[x + (y * this.data.depth_divisions)];
          //console.log(x+", "+y)          
          geometry.vertices.push(new THREE.Vector3((x - start_x) * spacing_x, height , (y - start_y) * spacing_y));          
        }
      }  

      var iu = 0;
      var iv = 0;
      var u = 0.0;                
      var v = 0.0;
      var pu = 0.0;
      var pv = 0.0;
      var uv_div = 10.0;

      for(var y = 0; y < chunk_depth - 1; y++){
        pv = iv / uv_div;
        v = (iv + 1) / uv_div;          
        for(var x = 0; x < chunk_width - 1; x++){
          pu = iu / uv_div;
          u = (iu + 1) / uv_div;
         // if(x===y)console.dir("u = " + u);
          
          var i = (y * chunk_depth) + x;  
          
          geometry.faces.push(new THREE.Face3(i + chunk_depth, i + 1, i ));          
          geometry.faces.push(new THREE.Face3(i + chunk_depth, i + chunk_depth + 1, i + 1));
          geometry.faceVertexUvs[0].push( [new THREE.Vector2(pu, v), new THREE.Vector2(u, pv), new THREE.Vector2(pu,pv)] );  
          geometry.faceVertexUvs[0].push( [new THREE.Vector2(pu,v), new THREE.Vector2(u,v), new THREE.Vector2(u, pv)] );                                
          iu++;
          if(iu > 9)iu = 0;          
        }
        iv ++;
        if(iv > 9) iv = 0;
        iu = 0;
      }      
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
      this.heightMap = perlin_gen.generate2(this.data.width_divisions, this.data.depth_divisions, [128, 64, 32, 16], [1, 0.5, 0.25, 0.125]);      
      //fix the height map
      for(var i = 0;i < this.heightMap.length; i++){
        this.heightMap[i] *= this.data.max_height;
        //this.heightMap[i] = 0;
      }      
      //this.material = new THREE.MeshStandardMaterial({color: this.data.color});
      

      this.material  = new THREE.ShaderMaterial({
        uniforms: {          
          texture: { type: "t", value: new THREE.TextureLoader().load( "assets/grass.jpg" ) },
          rock_texture: { type: "t", value: new THREE.TextureLoader().load( "assets/rock.jpg" ) },
          sand_texture: { type: "t", value: new THREE.TextureLoader().load( "assets/sand.jpg" ) }
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
          this.el.object3D.add(mesh);

        }

      }

      

    },

    
  });