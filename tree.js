AFRAME.registerComponent('tree', {
    schema: {
      height: {default: 3, min: 1},  
      color: {type: 'color', default: '#0a0'},    
    },

    init: function () {
      var geometry = new THREE.Geometry();      
          
      geometry.vertices.push(new THREE.Vector3(-3.0, 0.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(3.0, 0.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(0.0, 15.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, 3.0));
      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, -3.0));            
         
      geometry.faces.push(new THREE.Face3(0, 1, 2));          
      geometry.faces.push(new THREE.Face3(2, 1, 0));
      geometry.faces.push(new THREE.Face3(2, 3, 4));
      geometry.faces.push(new THREE.Face3(4, 3, 2));

      //geometry.faceVertexUvs[0].push( [new THREE.Vector2(pu, v), new THREE.Vector2(u, pv), new THREE.Vector2(pu,pv)] );  
      //geometry.faceVertexUvs[0].push( [new THREE.Vector2(pu,v), new THREE.Vector2(u,v), new THREE.Vector2(u, pv)] );                                
      
      geometry.mergeVertices();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      this.geometry = geometry;
      // Create material.      
      this.material = new THREE.MeshPhongMaterial({color: this.data.color});
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.el.setObject3D('mesh', this.mesh);     
    }
  });