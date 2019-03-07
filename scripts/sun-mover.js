AFRAME.registerComponent('sun-mover', {
    schema: {
    },

    init: function () {         
        var scene = this.el.sceneEl;//document.querySelector("a-scene");        
        this.light = scene.querySelector("#sun");
        console.log("being the sun...");
    },
    
    tick: function(){
      this.do_tick();
    },

    do_tick: (function () {
        var rotationMatrix = new THREE.Matrix4(); 
        var position = {x: 0,y: 0,z: 0};
        var angle = 2 * Math.PI / 500;
        var axis = new THREE.Vector3( 0, 0, 1 ).normalize();
        var rot_axis = rotationMatrix.makeRotationAxis( axis, angle );
        //rotationMatrix.makeRotationAxis( axis, angle ).multiplyVector3( position );

        //this.light.object3D.position.set(position.x, position.y, position.z);

        return function () {          
          position = this.light.object3D.position;
          rot_axis.multiplyVector3( position );
          this.light.object3D.position.set(position.x, position.y, position.z);
          if(position.y < 0)
            this.light.intensity = 0;
          else  
            this.light.intensity = 0.1;
        };
      })(),

      
      //var rot = this.light.object3D.rotation;
      //rot.z += Math.PI / 100;
      //this.light.object3D.rotation.set(rot);
    
  });