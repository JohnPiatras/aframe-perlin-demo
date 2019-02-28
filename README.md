# A Simple Procedural Landscape In A-Frame
by John Burns

This demo uses perlin noise to generate a landscape which is then texture using a shader which blends sand, grass and rock textures depending on altitude.

Trees (component defined in tree.js) are added within the grassy altitude range by the component defined in grow_forest.js.

# References
I referred to the following articles extensively when writing this.

## A Frame Documentation
https://aframe.io/docs/0.9.0/introduction/

### On Components
https://aframe.io/docs/0.9.0/introduction/writing-a-component.html#sidebar

## Perlin Noise 
https://gpfault.net/posts/perlin-noise.txt.html
http://eastfarthing.com/blog/2015-04-21-noise/
https://flafla2.github.io/2014/08/09/perlinnoise.html
https://www.shadertoy.com/view/4tGSzW

## Shaders
[A-Frame documentation on materials](https://github.com/aframevr/aframe/blob/master/docs/components/material.md)
[The Book Of Shaders](https://thebookofshaders.com) is a good start but is currently incomplete and does not get as far as using textures.
Here is an [example](https://glitch.com/edit/#!/aframe-displacement-shader) shader in A-Frame.
[A height blending shader](http://untitledgam.es/2017/01/height-blending-shader/)

## ThreeJS
https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene

### Raycaster
Initially used to find landscape altitude for tree placement but this turned out to be too slow.
https://threejs.org/docs/#api/en/core/Raycaster