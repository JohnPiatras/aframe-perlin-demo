/* global AFRAME, THREE */

// shader-grid-glitch.js

AFRAME.registerShader('grid-glitch', {
    schema: {
      color: {type: 'color', is: 'uniform'},
      timeMsec: {type: 'time', is: 'uniform'}
    },
  
    vertexShader: `
  varying vec2 vUv;
  varying vec3 v;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    v = position;
  }
  `,
    fragmentShader: `
  varying vec2 vUv;
  varying vec3 v;
  uniform vec3 color;
  uniform float timeMsec; // A-Frame time in milliseconds.
  
  void main() {
    float time = timeMsec / 1000.0; // Convert from A-Frame milliseconds to typical time in seconds.
    // Use sin(time), which curves between 0 and 1 over time,
    // to determine the mix of two colors:
    //    (a) Dynamic color where 'R' and 'B' channels come
    //        from a modulus of the UV coordinates.
    //    (b) Base color.
    // 
    // The color itself is a vec4 containing RGBA values 0-1.
    //gl_FragColor = mix(
    //  vec4(mod(vUv , 0.05) * 20.0, 1.0, 1.0),
    //  vec4(color, 1.0),
    //  sin(time)
    //);
    float snow_pct = v.y - 24.0;
    if(snow_pct < 0.0)
        snow_pct = 0.0;
    else if(snow_pct > 1.0)
        snow_pct = 1.0;
    snow_pct = snow_pct / 1.0;
    gl_FragColor = mix(   
        vec4(color, 1.0),     
        vec4( 1.0, 1.0, 1.0, 1.0), 
        snow_pct
    );

  }
  `
  });