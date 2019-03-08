AFRAME.registerComponent('sun-mover', {
    schema: {
    },

    init: function () {         
        var scene = this.el.sceneEl;//document.querySelector("a-scene");        
        this.light = scene.querySelector("#sun");
        console.log("being the sun...");

        this.pause = false;
        self = this;
        window.addEventListener("keydown", function(e){
          if(e.keyCode === 32) { // e.g. v key
            self.pause = !self.pause;
            console.log("Sun motion paused = " + self.pause);
          }
        });

    },
    
    tick: function(){
      this.do_tick();
    },

    do_tick: (function () {        
        var rotationMatrix = new THREE.Matrix4(); 
        var position = {x: 0,y: 0,z: 0};
        var angle = 2 * Math.PI / 500;
        
        var axis = new THREE.Vector3( 0, 1, 0 ).normalize();

        //spring in scotland - sun peaks at ~34deg from horizon
        //rot axis is -56deg from vertical around x-axis?
        rotationMatrix.makeRotationAxis(new THREE.Vector3(1, 0, 0), THREE.Math.degToRad(-56));
        rotationMatrix.multiplyVector3(axis);
        console.log("Sun axis = " + axis);
        rotationMatrix.makeRotationAxis(axis, angle);        
        var sun_normalized_pos ;
        return function () {       
          if(this.pause == false){
            position = this.light.object3D.position;
            //rotationMatrix.multiplyVector3( position );
            position.applyMatrix4(rotationMatrix);
            this.light.object3D.position.set(position.x, position.y, position.z);
            sun_normalized_pos = position;
            sun_normalized_pos.normalize();
            this.el.sceneEl.object3D.background = new THREE.Color( 0xccddff ).multiplyScalar(Math.max(sun_normalized_pos.y, 0));
          }
        };
      })(),

      
      //var rot = this.light.object3D.rotation;
      //rot.z += Math.PI / 100;
      //this.light.object3D.rotation.set(rot);
    
  });