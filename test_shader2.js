const vertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;


const fragmentShader = `
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
varying vec3 vNormal; 

void main() {

    vec3 light = vec3(0.5, 0.2, 1.0);
    light = normalize(light);
    float dProd = max(0.0, dot(vNormal, light));

    vec2 st = gl_FragCoord.xy/u_resolution;
    gl_FragColor = vec4(dProd * st.x,dProd * st.y,0.0,1.0);
    //gl_FragColor = vec4(abs(sin(u_time)),0.0,0.0,1.0);
}
`;

AFRAME.registerComponent('test-shader', {
  schema: {
      color: {type: 'color'},
      xres: {type: 'number'},
      yres: {type: 'number'}
  },

  /**
   * Creates a new THREE.ShaderMaterial using the two shaders defined
   * in vertex.glsl and fragment.glsl.
   */
  init: function () {
    const data = this.data;
  
    this.material  = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
        u_color: { value: new THREE.Color(data.color) },
        u_resolution: { value: new THREE.Vector2(data.xres, data.yres)},
        u_mouse: {value: new THREE.Vector2(0.0, 0.0)}        
      },
      vertexShader,
      fragmentShader
    });
    console.dir(this.material.uniforms.u_resolution);
    this.applyToMesh();
    this.el.addEventListener('model-loaded', () => this.applyToMesh());
  },


  /**
   * Update the ShaderMaterial when component data changes.
   */
  update: function () {
    this.material.uniforms.u_color.value.set(this.data.color);
    //this.material.uniforms.u_resolution.value.set(new THREE.Vector2(this.data.xres, this.data.yres));
  },
    
  /**
   * Apply the material to the current entity.
   */
  applyToMesh: function() {
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material = this.material;
    }
  },

  /**
   * On each frame, update the 'time' uniform in the shaders.
   */
  tick: function (t) {
    this.material.uniforms.u_time.value = t / 1000;
  }
  
})
