AFRAME.registerGeometry('grid', {
    schema: {
      width_divisions: {default: 128, min: 8},
      depth_divisions: {default: 128, min: 8},
      depth: {default: 100, min: 1},
      width: {default: 100, min: 1},
      max_height: {default: 10, min: 1},
    },

    init: function (data) {
      var geometry = new THREE.Geometry();      
      var spacing_x = data.width / data.width_divisions;
      var spacing_y = data.depth / data.depth_divisions;

      var perlin_gen = new PerlinNoiseGenerator();
      //var perlinData =perlin_gen.generate(data.width_divisions, data.depth_divisions, 128, 5, 1.4);
      var perlinData =perlin_gen.generate2(data.width_divisions, data.depth_divisions, [128, 64, 32, 16], [1, 0.5, 0.25, 0.125]);      
      var vc = 0;
      for(var y = 0; y < data.depth_divisions; y++){
        for(var x = 0; x < data.width_divisions; x++){
          var height = data.max_height * perlinData[x + (y * data.depth_divisions)];          
          geometry.vertices.push(new THREE.Vector3(x * spacing_x, height , y * spacing_y));
          perlinData[x + (y * data.depth_divisions)] = height; //update the height here
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

      for(var y = 0; y < data.depth_divisions - 1; y++){
        pv = iv / uv_div;
        v = (iv + 1) / uv_div;          
        for(var x = 0; x < data.width_divisions - 1; x++){
          pu = iu / uv_div;
          u = (iu + 1) / uv_div;
         // if(x===y)console.dir("u = " + u);
          
          var i = (y *data.depth_divisions) + x;          
          geometry.faces.push(new THREE.Face3(i + data.depth_divisions, i + 1, i ));          
          geometry.faces.push(new THREE.Face3(i + data.depth_divisions, i + data.depth_divisions + 1, i + 1));
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
      this.heightMap = perlinData;
      console.dir(this);
    }
  });