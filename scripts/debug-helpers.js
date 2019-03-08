AFRAME.registerComponent('debug-helpers', {
    schema: {
    },

    init: function () {         
        var scene = this.el.sceneEl;//document.querySelector("a-scene");        
        
        //add helper axes to scene
        var origin_h = scene.querySelector("#terrain").components.terrain.getHeight(0,0) + 10;
        var axes = `
        <!-- Axes and boundary markers for use during development-->
        <a-box color="yellow" width="10" depth="10" height="1200" position="-2400 0 -2400"></a-box>
        <a-box color="yellow" width="10" depth="10" height="1200" position="2400 0 -2400"></a-box>
        <a-box color="yellow" width="10" depth="10" height="1200" position="-2400 0 2400"></a-box>
        <a-box color="yellow" width="10" depth="10" height="1200" position="2400 0 2400"></a-box>
        <a-box color="red"  width="10" depth="10" height="200" position="0 0 100" rotation="90 0 0"></a-box>
        <a-box color="green"  width="10" depth="10" height="200" position="100 0 0" rotation="0 0 -90"></a-box>
        <a-box color="white" width="10" depth="10" height="200" position="0 100 0" shadow></a-box>

        <a-plane width="200" height="200" position="0 0 0" rotation="-90 0 0" shadow></a-plane>
        `;
        var axes_entity = document.createElement("a-entity");
        axes_entity.setAttribute('position', `0 ${origin_h} 0`);
        axes_entity.innerHTML = axes;        
        this.el.appendChild(axes_entity);

    },
    
    tick: function(){
      this.do_tick();
    },

    do_tick: (function () {
        

        return function () {       
          
        };
      })(),
    
  });