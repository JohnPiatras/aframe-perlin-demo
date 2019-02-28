AFRAME.registerComponent('terrain', {
    schema: {
      width_divisions: {default: 128, min: 8},
      depth_divisions: {default: 128, min: 8},
      depth: {default: 100, min: 1},
      width: {default: 100, min: 1},
      max_height: {default: 10, min: 1},
    },

  
    init: function () {
      var geometry = new THREE.Geometry();      
      var spacing_x = this.data.width / (this.data.width_divisions-1);
      var spacing_y = this.data.depth / (this.data.depth_divisions-1);

      var perlin_gen = new PerlinNoiseGenerator();
      //var perlinData =perlin_gen.generate(this.data.width_divisions, this.data.depth_divisions, 128, 5, 1.4);
      var perlinData =perlin_gen.generate2(this.data.width_divisions, this.data.depth_divisions, [128, 64, 32, 16], [1, 0.5, 0.25, 0.125]);      
      var vc = 0;
      for(var y = 0; y < this.data.depth_divisions; y++){
        for(var x = 0; x < this.data.width_divisions; x++){
          var height = this.data.max_height * perlinData[x + (y * this.data.depth_divisions)];          
          geometry.vertices.push(new THREE.Vector3(x * spacing_x, height , y * spacing_y));
          perlinData[x + (y * this.data.depth_divisions)] = height; //update the height here
          vc++;
        }
      }      
      console.log("vertices = " + vc);
      var iu = 0;
      var iv = 0;
      var u = 0.0;
      var v = 0.0;
      var pu = 0.0;
      var pv = 0.0;
      var uv_div = 10.0;

      for(var y = 0; y < this.data.depth_divisions - 1; y++){
        pv = iv / uv_div;
        v = (iv + 1) / uv_div;          
        for(var x = 0; x < this.data.width_divisions - 1; x++){
          pu = iu / uv_div;
          u = (iu + 1) / uv_div;
         // if(x===y)console.dir("u = " + u);
          
          var i = (y *this.data.depth_divisions) + x;          
          geometry.faces.push(new THREE.Face3(i + this.data.depth_divisions, i + 1, i ));          
          geometry.faces.push(new THREE.Face3(i + this.data.depth_divisions, i + this.data.depth_divisions + 1, i + 1));
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
      this.geometry = geometry;
      // Create material.
      this.material = new THREE.MeshStandardMaterial({color: this.data.color});


      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.el.setObject3D('mesh', this.mesh);
      this.heightMap = perlinData;
      //console.dir(this);
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
    }
  });