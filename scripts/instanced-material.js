AFRAME.registerComponent('instanced-material', {
    schema: {
      texture: {default: ""}, 
      alpha: {default: ""}       
    },

    getTextureList: (function () {
      var tex_list = {};
      return function () {
        return tex_list;
      };
    })(),

    loadMaterial: function(texture_name, alpha_name){
        var tex_list = this.getTextureList();
        var k = texture_name + alpha_name;
        var material = null;
        if(tex_list[k] == null){
            console.log("Loading and caching " + texture_name + " and " + alpha_name);
            var texture = new THREE.TextureLoader().load( texture_name );
            var alpha =  new THREE.TextureLoader().load( alpha_name );
            material = new THREE.MeshStandardMaterial({side:THREE.DoubleSide, map:texture, alphaMap:alpha, transparent:true,alphaTest:0.5});  
            tex_list[k] = material;            
        }else{
            material = tex_list[k];            
            //console.log("Found material at key " + k);
        }

        
        return material;
    },

    init: function () {
        //this trick was courtesy of
        //https://github.com/aframevr/aframe/issues/2464
        const mesh = this.el.getObject3D('mesh');
        if(!mesh){
            this.el.addEventListener('object3dset', this.init.bind(this));
        } else {
        
            mesh.material = this.loadMaterial(this.data.texture, this.data.alpha);
        }

        

      },
  });