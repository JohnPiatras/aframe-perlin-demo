AFRAME.registerComponent('grow-forest', {
    schema: {
        treecount: {default: 1000, min: 0},
        height: {default: 20, min:1},
        width: {default: 7, min:1},
        height_variation: {default: 5, min:0},
        texture: {},
        terrain_id: {},        
        alpha: {}          
      },
    init: function () {        
        //Rewrote the tree place to use a getHeight method that I've built into the 
        //terrain component as the raycaster was too slow to place thousands of trees.
        var scene = this.el.sceneEl;//document.querySelector("a-scene");        
        var terrain = scene.querySelector("#" + this.data.terrain_id);
        
        //var origin = new THREE.Vector3(800, 500, 800);
        //var direction = new THREE.Vector3(0, -1, 0);      
        //var raycaster = new THREE.Raycaster(origin, direction, 0.0, 2000.0 );
        //raycaster.objects = [terrain.object3D];
        //raycaster.recursive = false;
        console.log("Searching for " + this.data.treecount + " tree locations...");      
        var tree_pos = [];
        //var ray_result = [];
        var n_trees_planted = 0;
        //for(var i = 0;i < this.data.treecount; i++){        
        while(n_trees_planted < this.data.treecount){
            //origin.set(Math.random() * 1600, 500, Math.random() * 1600);
            //origin.set(800,500,800);
            //raycaster.set(origin, direction);
            //raycaster.intersectObject(terrain.object3D, true, ray_result);
            var tx = Math.random() * 1600;
            var ty = Math.random() * 1600;
            var h = terrain.components.terrain.getHeight(tx, ty);
            if(h > 120 && h < 195){
                n_trees_planted++;
                tree_pos.push({x: tx, y:h, z:ty});
            }
            /*if(ray_result.length > 0){
            if(ray_result[0].point.y > 120 && ray_result[0].point.y < 195){
                tree_pos.push({x: ray_result[0].point.x, y: ray_result[0].point.y, z: ray_result[0].point.z});
            }*/
            
            //console.dir(ray_result)
            //ray_result = [];
        }
        console.log("Planting " + tree_pos.length + " trees");        
        var trees = document.createElement('a-entity');
        trees.setAttribute("geometry-merger", "preserveOriginal:false");
        trees.setAttribute('instanced-material',`texture:${this.data.texture};alpha:${this.data.alpha};`);            
        for(var i = 0; i < tree_pos.length; i++){ 
            var tree = document.createElement('a-entity');
            var tree_height = this.data.height + (this.data.height_variation * (Math.random() - 0.5));
            var tree_width = this.data.width * (tree_height / this.data.height); //scale width proportionatly
            tree.setAttribute('textured-tree','height:' + tree_height + ';width:' + tree_width);
            //tree.addEventListener('model-loaded', function (e) { e.detail.model.traverse(function (node) { if ( node.isMesh ) node.material.alphaTest = 0.5; }); });
            //tree.setAttribute('obj-model','obj:#tree1; mtl:#tree1mtl');
            tree.setAttribute('position', {x:tree_pos[i].x, y:tree_pos[i].y, z:tree_pos[i].z});
            //tree.setAttribute('instanced-material',`texture:${this.data.texture};alpha:${this.data.alpha};`);            
            trees.appendChild(tree);            
        }

        scene.appendChild(trees);
    }
  });