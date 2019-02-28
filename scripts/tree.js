AFRAME.registerComponent('tree', {
    schema: {
      height: {default: 15, min: 1},  
      color: {type: 'color', default: '#0a0'},    
    },

    init: function () {
      var geometry = new THREE.Geometry();      
      var h = this.data.height + (0.5 * this.data.height * (Math.random() - 0.5)) ;
      var w = h / 3;

      geometry.vertices.push(new THREE.Vector3(-w/8, 0.0, 0.0));     
      geometry.vertices.push(new THREE.Vector3(w/8, 0.0, 0.0));
      geometry.vertices.push(new THREE.Vector3(w/8, h/5.0, 0.0));
      geometry.vertices.push(new THREE.Vector3(-w/8, h/5.0, 0.0));

      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, -w/8));     
      geometry.vertices.push(new THREE.Vector3(0.0, 0.0, w/8));
      geometry.vertices.push(new THREE.Vector3(0.0, h/5.0, w/8));
      geometry.vertices.push(new THREE.Vector3(0.0, h/5.0, -w/8));

      geometry.vertices.push(new THREE.Vector3(-w, h/5, 0.0));     
      geometry.vertices.push(new THREE.Vector3(w, h/5, 0.0));     
      geometry.vertices.push(new THREE.Vector3(0.0, h + h/5, 0.0));     
      geometry.vertices.push(new THREE.Vector3(0.0, h/5, w));
      geometry.vertices.push(new THREE.Vector3(0.0, h/5, -w));  
      
      //geometry.faces.push(new THREE.Face3(0, 1, 2));          
      //geometry.faces.push(new THREE.Face3(2, 3, 0));
      geometry.faces.push(new THREE.Face3(2, 1, 0));
      geometry.faces.push(new THREE.Face3(0, 3, 2));

      //geometry.faces.push(new THREE.Face3(4, 5, 7));          
      //geometry.faces.push(new THREE.Face3(6, 7, 4));
      geometry.faces.push(new THREE.Face3(6, 5, 4));
      geometry.faces.push(new THREE.Face3(4, 7, 6));
         
      //geometry.faces.push(new THREE.Face3(8, 9, 10));          
      geometry.faces.push(new THREE.Face3(10, 9, 8));
      //geometry.faces.push(new THREE.Face3(10, 11, 12));
      geometry.faces.push(new THREE.Face3(12, 11, 10));

      //geometry.faceVertexUvs[0].push( [new THREE.Vector2(pu, v), new THREE.Vector2(u, pv), new THREE.Vector2(pu,pv)] );  
      //geometry.faceVertexUvs[0].push( [new THREE.Vector2(pu,v), new THREE.Vector2(u,v), new THREE.Vector2(u, pv)] );                                
      
      geometry.mergeVertices();
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      this.geometry = geometry;
      // Create material.      
      this.material = new THREE.MeshLambertMaterial({color: this.data.color, side:THREE.DoubleSide});
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.el.setObject3D('mesh', this.mesh); 
          
    }
  });