/* global AFRAME, THREE */

// shader-grid-glitch.js

AFRAME.registerShader('grid-glitch', {
    schema: {      
      u_resolution: {type: 'vec2', is: 'uniform'},
      u_time: {type: 'time', is: 'uniform'}
    },
  
    vertexShader: `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
  `,
    fragmentShader: `
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;

    void main() {
	    vec2 st = gl_FragCoord.xy/u_resolution;
	    gl_FragColor = vec4(st.x,st.y,0.0,1.0);
    }
  `
  });