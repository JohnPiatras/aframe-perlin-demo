//Simple terrain shader
// John Burns
const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;


const fragmentShader = `

uniform sampler2D texture;
uniform sampler2D rock_texture;
uniform sampler2D sand_texture;
varying vec3 vNormal; 
varying vec3 vPosition;
varying vec2 vUv;

vec3 heightblend(vec3 color1, vec3 color2, float vertexHeight, float transitionHeight, float blendDistance)
{    
    
    float level2 = clamp((vertexHeight - (transitionHeight - blendDistance)) / (transitionHeight - (transitionHeight - blendDistance)), 0.0, 1.0);    
    float level1 = 1.0 - level2;
    return (color1 * level1) + (color2 * level2);
}

void main() {
    vec3 light = vec3(0.5, 0.5, 1.0);
    light = normalize(light);

    float dProd = 0.5 + 0.5 * max(0.0, dot(vNormal, light));

    vec3 blend0 = heightblend( texture2D(sand_texture, vUv).rgb, texture2D(texture, vUv).rgb , vPosition.y, 120.0, 10.0);
    vec3 blend1 = heightblend( blend0, texture2D(rock_texture, vUv).rgb , vPosition.y, 225.0, 30.0);
    vec3 blend2 = heightblend( blend1, vec3(1.0, 1.0, 1.0) , vPosition.y, 275.0, 15.0);
    gl_FragColor = vec4(dProd * blend2, 1.0);
}
`;

AFRAME.registerComponent('terrain-shader', {
  schema: {
      color: {type: 'color'},
  },

  /**
   * Creates a new THREE.ShaderMaterial using the two shaders defined
   * in vertex.glsl and fragment.glsl.
   */
  init: function () {
    const data = this.data;
  
    this.material  = new THREE.ShaderMaterial({
      uniforms: {
        u_color: { value: new THREE.Color(data.color) },
        texture: { type: "t", value: new THREE.TextureLoader().load( "assets/grass.jpg" ) },
        rock_texture: { type: "t", value: new THREE.TextureLoader().load( "assets/rock.jpg" ) },
        sand_texture: { type: "t", value: new THREE.TextureLoader().load( "assets/sand.jpg" ) }
      },
      vertexShader,
      fragmentShader
    });
    
    this.applyToMesh();
    this.el.addEventListener('model-loaded', () => this.applyToMesh());
  },


  /**
   * Update the ShaderMaterial when component data changes.
   */
  update: function () {
    this.material.uniforms.u_color.value.set(this.data.color);   
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
    //this.material.uniforms.u_time.value = t / 1000;
  }
  
})
