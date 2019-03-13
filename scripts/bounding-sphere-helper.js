AFRAME.registerComponent('bs', {
    schema: {
    },

    init: function () {         
        if(this.spherelist == null){
          this.spherelist = [];
        }
        this.el.addEventListener('object3dset', this.init.bind(this));
        this.el.object3D.children.forEach( (c) => {
          //console.log("Checking " + c.type + " with uuid" + c.uuid);
          if(c.type == 'Mesh' & !this.spherelist.includes(c.uuid)){
            //console.log('Adding bounding sphere visual for mesh ' + c.uuid)
            this.spherelist.push(c.uuid);
            var e = document.createElement('a-entity');
            e.setAttribute('geometry', `primitive: sphere; radius: ${c.geometry.boundingSphere.radius}`);
            var center = {x: c.geometry.boundingSphere.center.x, y: c.geometry.boundingSphere.center.y, z: c.geometry.boundingSphere.center.z};
            center.x += c.position.x;
            center.y += c.position.y;
            center.z += c.position.z;

            e.setAttribute('position', `${center.x} ${center.y} ${center.z}`);
            e.setAttribute('material', 'wireframe: true');
            this.el.sceneEl.appendChild(e);
            
          }
        });
        

    },

    
  });