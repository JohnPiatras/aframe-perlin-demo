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
      console.log("width=" + data.width);
      var spacing_x = data.width / data.width_divisions;
      var spacing_y = data.depth / data.depth_divisions;

      var perlin_gen = new PerlinNoiseGenerator();
      var perlinData =perlin_gen.generate(data.width_divisions, data.depth_divisions, 128, 5, 1.5);
      
      for(var y = 0; y < data.depth_divisions; y++){
        for(var x = 0; x < data.width_divisions; x++){
          geometry.vertices.push(new THREE.Vector3(x * spacing_x, data.max_height * perlinData[x + (y * data.depth_divisions)] , y * spacing_y));
        }
      }
      
      geometry.computeBoundingBox();
      
      for(var y = 0; y < data.depth_divisions - 1; y++){
        for(var x = 0; x < data.width_divisions - 1; x++){
          var i = (y *data.depth_divisions) + x;          
          geometry.faces.push(new THREE.Face3(i + data.depth_divisions, i + 1, i ));
          geometry.faces.push(new THREE.Face3(i + data.depth_divisions, i + data.depth_divisions + 1, i + 1));
        }
      }
      
      geometry.mergeVertices();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      this.geometry = geometry;      
    }
  });