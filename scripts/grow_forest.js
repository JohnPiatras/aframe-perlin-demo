AFRAME.registerComponent('grow-forest', {
    schema: {
        treecount: {default: 1000, min: 0},          
      },
    init: function () {        
        //Rewrote the tree place to use a getHeight method that I've built into the 
        //terrain component as the raycaster was too slow to place thousands of trees.
        var scene = this.el.sceneEl;//document.querySelector("a-scene");        
        var terrain = scene.querySelector("#terrain");

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
        var trees = document.createDocumentFragment();
        for(var i = 0; i < tree_pos.length; i++){ 
            var tree = document.createElement('a-entity');
            tree.setAttribute('tree','');
           // tree.setAttribute('obj-model','obj:#tree1; mtl:#tree1-mtl');
            tree.setAttribute('position', {x:tree_pos[i].x, y:tree_pos[i].y, z:tree_pos[i].z});        
            //tree.setAttribute('color', "red");
            //tree.setAttribute('material', "color:red;");
            trees.appendChild(tree);
            
        }
        scene.appendChild(trees);
    }
  });