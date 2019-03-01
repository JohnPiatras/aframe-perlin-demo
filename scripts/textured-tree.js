AFRAME.registerComponent('textured-tree', {
    schema: {
      height: {default: 20, min: 1},
      width: {default:7, min: 1},  
      color: {type: 'color', default: '#0a0'},    
    },

    getMaterial: (function () {
      var texture = new THREE.TextureLoader().load( "assets/tree2.jpg" );
      var alpha =  new THREE.TextureLoader().load( "assets/tree2_alpha.jpg" );
      var material = new THREE.MeshStandardMaterial({side:THREE.DoubleSide, map:texture, alphaMap:alpha, transparent:true,alphaTest:0.5});
  
      return function () {
        return material;
      };
    })(),

    getGeometry: (function () {
      var geometry = new THREE.Geometry();      
      //var h = this.data.height + (0.5 * this.data.height * (Math.random() - 0.5)) ;
      var h = 15;
      var w = h / 3;

      geometry.vertices.push(new THREE.Vector3(-w, 0.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(w, 0.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(w, h, 0.0));
      geometry.vertices.push(new THREE.Vector3(-w, h, 0.0));     
            
      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, -w));     
      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, w));     
      geometry.vertices.push(new THREE.Vector3(0.0, h, w));
      geometry.vertices.push(new THREE.Vector3(0.0, h, -w));     

      geometry.faces.push(new THREE.Face3(0, 1, 2));
      geometry.faces.push(new THREE.Face3(2, 3, 0));
      geometry.faces.push(new THREE.Face3(4, 5, 6));
      geometry.faces.push(new THREE.Face3(6, 7, 4));

      geometry.faceVertexUvs[0].push( [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1,1)] );  
      geometry.faceVertexUvs[0].push( [new THREE.Vector2(1,1), new THREE.Vector2(0,1), new THREE.Vector2(0, 0)] );    
      geometry.faceVertexUvs[0].push( [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1,1)] );  
      geometry.faceVertexUvs[0].push( [new THREE.Vector2(1,1), new THREE.Vector2(0,1), new THREE.Vector2(0, 0)] );                               
      
      geometry.mergeVertices();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      return function () {
        return geometry;
      };
    })(),

    init: function () {
      var geometry = new THREE.Geometry();      
      var h = this.data.height + (0.5 * this.data.height * (Math.random() - 0.5)) ;
      //var h = 15;
      var w = this.data.width;

      geometry.vertices.push(new THREE.Vector3(-w, 0.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(w, 0.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(w, h, 0.0));
      geometry.vertices.push(new THREE.Vector3(-w, h, 0.0));     
            
      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, -w));     
      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, w));     
      geometry.vertices.push(new THREE.Vector3(0.0, h, w));
      geometry.vertices.push(new THREE.Vector3(0.0, h, -w));     

      geometry.faces.push(new THREE.Face3(0, 1, 2));
      geometry.faces.push(new THREE.Face3(2, 3, 0));
      geometry.faces.push(new THREE.Face3(4, 5, 6));
      geometry.faces.push(new THREE.Face3(6, 7, 4));

      geometry.faceVertexUvs[0].push( [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1,1)] );  
      geometry.faceVertexUvs[0].push( [new THREE.Vector2(1,1), new THREE.Vector2(0,1), new THREE.Vector2(0, 0)] );    
      geometry.faceVertexUvs[0].push( [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1,1)] );  
      geometry.faceVertexUvs[0].push( [new THREE.Vector2(1,1), new THREE.Vector2(0,1), new THREE.Vector2(0, 0)] );                               
      
      geometry.mergeVertices();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      
      this.geometry = geometry;//this.getGeometry();
      this.material = new THREE.MeshLambertMaterial();
            
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.el.setObject3D('mesh', this.mesh); 
          
    }
  });