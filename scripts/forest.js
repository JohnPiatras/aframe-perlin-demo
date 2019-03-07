AFRAME.registerComponent('forest', {
    schema: {
        treecount: {default: 1000, min: 0},
        height: {default: 20, min:1},
        width: {default: 7, min:1},
        height_variation: {default: 5, min:0},
        texture: {},
        terrain_id: {},        
        alpha: {}          
      },

    addTree: function(geometry, x, y, z, w, h){
        
        var start_vertex = geometry.vertices.length;
        geometry.vertices.push(new THREE.Vector3(-w + x,  y    , z));     
        geometry.vertices.push(new THREE.Vector3(w + x ,  y    , z));     
        geometry.vertices.push(new THREE.Vector3(w + x ,  y + h, z));
        geometry.vertices.push(new THREE.Vector3(-w + x,  y + h, z));     
              
        geometry.vertices.push(new THREE.Vector3(x, y    , -w + z));     
        geometry.vertices.push(new THREE.Vector3(x, y    ,  w + z));     
        geometry.vertices.push(new THREE.Vector3(x, y + h,  w + z));
        geometry.vertices.push(new THREE.Vector3(x, y + h, -w + z)); 
        geometry.vertices.push(new THREE.Vector3(x-w, y + h, z - w));     
        geometry.vertices.push(new THREE.Vector3(x+w, y + h,  z - w));     
        geometry.vertices.push(new THREE.Vector3(x+w, y + h,  z + w));
        geometry.vertices.push(new THREE.Vector3(x-w, y + h,  z + w)); 
        
        geometry.faces.push(new THREE.Face3(start_vertex + 0, start_vertex + 1, start_vertex + 2));
        geometry.faces.push(new THREE.Face3(start_vertex + 2, start_vertex + 3, start_vertex + 0));
        geometry.faces.push(new THREE.Face3(start_vertex + 4, start_vertex + 5, start_vertex + 6));
        geometry.faces.push(new THREE.Face3(start_vertex + 6, start_vertex + 7, start_vertex + 4));
  
        geometry.faceVertexUvs[0].push( [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1,1)] );  
        geometry.faceVertexUvs[0].push( [new THREE.Vector2(1,1), new THREE.Vector2(0,1), new THREE.Vector2(0, 0)] );    
        geometry.faceVertexUvs[0].push( [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1,1)] );  
        geometry.faceVertexUvs[0].push( [new THREE.Vector2(1,1), new THREE.Vector2(0,1), new THREE.Vector2(0, 0)] );      

        
    },

    init: function () {        
        
        var scene = this.el.sceneEl;//document.querySelector("a-scene");        
        var terrain = scene.querySelector("#" + this.data.terrain_id);
        
        var geometry = new THREE.Geometry();
        

        console.log("Planting " + this.data.treecount + " trees...");      
               
        var n_trees_planted = 0;
        var terrain_w = terrain.components.terrain.getWidth();
        var terrain_h = terrain.components.terrain.getDepth();
        while(n_trees_planted < this.data.treecount){            
            var tx = Math.random() * terrain_w;
            var tz = Math.random() * terrain_h;
            var ty = terrain.components.terrain.getHeight(tx, tz);
            if(ty > 120 && ty < 320){
                n_trees_planted++;
                //tree_pos.push({x: tx, y:h, z:ty});
                var tree_height = this.data.height + (this.data.height_variation * (Math.random() - 0.5));
                var tree_width = this.data.width * (tree_height / this.data.height); //scale width proportionatly
                this.addTree(geometry, tx, ty, tz, tree_width, tree_height);
            }           
        }
        console.log("Tree planting done.");
        geometry.mergeVertices();
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        this.geometry = geometry;                
        this.material = new THREE.MeshLambertMaterial();
                
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.el.setObject3D('mesh', this.mesh); 
    }
  });