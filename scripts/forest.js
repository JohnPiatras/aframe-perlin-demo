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

    
    //we're not using index vertices becuase we need to set normals per vertex per face
    //rather than sharing normals where we share vertices
    addTree: function(x, y, z, w, h){
        // setup temporary storage, once
        if(this.temp == null){
            this.temp = {
                n: [
                    new THREE.Vector3( 0, 1, 0).normalize(),
                    new THREE.Vector3( 0, 1, 0).normalize(),
                    new THREE.Vector3( 0, 1, 0).normalize(),
                    new THREE.Vector3( 0, 1, 0).normalize(),
                ],
                vertices: [],
                normals: [],
                uvs: [],
            };
        }

        /*vertices are
        0: -w + x,  y    , z     
        1:  w + x , y    , z     
        2:  w + x , y + h, z
        3: -w + x,  y + h, z     
              
        4: x     , y    , w + z     
        5: x     , y    ,-w + z     
        6: x     , y + h,-w + z
        7: x     , y + h, w + z 
        face indices are
        0, 1, 2
        2, 3, 0
        4, 5, 6
        6, 7, 4

        2, 1, 0
        0, 3, 2
        6, 5, 4
        4, 7, 6
        */
        this.temp.vertices.push(
            //x plane, front faces
            -w + x, y    , z,
             w + x, y    , z,
             w + x, y + h, z,

             w + x, y + h, z,             
            -w + x, y + h, z,
            -w + x, y    , z,
            //z plane front faces
             x    , y    ,  w + z,    
             x    , y    , -w + z,
             x    , y + h, -w + z,
            
             x    , y + h, -w + z,
             x     , y + h, w + z,
             x     , y    , w + z,

             //x plane back faces
             w + x , y + h, z,
             w + x , y    , z, 
            -w + x,  y    , z,

            -w + x,  y    , z,
            -w + x,  y + h, z,
             w + x , y + h, z,
            //z plane back faces
             x     , y + h,-w + z,
             x     , y    ,-w + z,
             x     , y    , w + z,

             x     , y    , w + z,
             x     , y + h, w + z,
             x     , y + h,-w + z
        );

        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 6; j++){
                this.temp.normals.push(this.temp.n[i].x, this.temp.n[i].y, this.temp.n[i].z);
            }
        }

       
        this.temp.uvs.push(
            0, 0,
            1, 0,
            1, 1,

            1, 1,
            0, 1, 
            0, 0,

            0, 0,
            1, 0,
            1, 1,

            1, 1,
            0, 1,
            0, 0,

            1, 1,
            1, 0,
            0, 0,

            0, 0,
            0, 1,
            1, 1,

            1, 1,
            1, 0,
            0, 0,

            0, 0,
            0, 1,
            1, 1,
        );        
    },

    init: function () {        
        
        let scene = this.el.sceneEl;//document.querySelector("a-scene");        
        let terrain = scene.querySelector("#" + this.data.terrain_id);
                       
        console.log("Planting " + this.data.treecount + " trees...");      
               
        let n_trees_planted = 0;
        let terrain_w = terrain.components.terrain.getWidth();
        let terrain_h = terrain.components.terrain.getDepth();
        while(n_trees_planted < this.data.treecount){            
            let tx = Math.random() * terrain_w;
            let tz = Math.random() * terrain_h;
            let ty = terrain.components.terrain.getHeight(tx, tz);
            if(ty > 360 && ty < 620){
                n_trees_planted++;
                //tree_pos.push({x: tx, y:h, z:ty});
                let tree_height = this.data.height + (this.data.height_variation * (Math.random() - 0.5));
                let tree_width = this.data.width * (tree_height / this.data.height); //scale width proportionatly
                this.addTree(tx, ty, tz, tree_width, tree_height);
            }           
        }
        console.log("Tree planting done.");

        //by here we have filled our vertex, normal and uv arrays - now create geometry
        this.geometry = new THREE.BufferGeometry();        
        this.geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( this.temp.vertices, 3 ).onUpload( () => {this.temp.vertices = null} ) );
		this.geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( this.temp.normals, 3 ).onUpload( () => {this.temp.normals = null} ) );
		this.geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( this.temp.uvs, 2 ).onUpload( () => {this.temp.uvs = null} ) );

        this.material = new THREE.MeshLambertMaterial();                
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.el.setObject3D('mesh', this.mesh); 

        //helper = new THREE.FaceNormalsHelper( geometry, 2, 0x00ff00, 1 );
        //this.el.sceneEl.object3D.add(helper);
    }
  });