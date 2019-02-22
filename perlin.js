//resources
// https://gpfault.net/posts/perlin-noise.txt.html
// http://eastfarthing.com/blog/2015-04-21-noise/
// https://flafla2.github.io/2014/08/09/perlinnoise.html
// https://www.shadertoy.com/view/4tGSzW

var PerlinNoiseGenerator = function(){
    // Hash lookup table for picking gradient vectors as defined by Ken Perlin.  This is a randomly
    // arranged array of all numbers from 0-255 inclusive.

    this.grad_lookup_table = this.generate_lookup_table();
}

PerlinNoiseGenerator.prototype.generate_lookup_table = function(){
    var a = [];
    for(var i = 0; i < 256; i++){
        a.push(i);        
    }

    var table = [];
    while(a.length > 0){
        var i = (Math.random() * a.length)  | 0; 
        table.push(a.splice(i, 1)[0]);
    }
    //repeat the table
    for(var i = 0; i < 256; i++){
        table.push(table[i]);
    }
    return table;
}


//fade function is 6t^5 - 15t^4 + 10t^3
PerlinNoiseGenerator.prototype.fade = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

// Gradient vectors
// 1, 0
// 0, -1
// -1, 0
// 0, 1
PerlinNoiseGenerator.prototype.grad = function(hash, x, y) {   
    switch(hash & 0x7){
        case 0x0:
            return x;
        break;
        case 0x1:
            return -y;
        break;
        case 0x2:
            return -x;
        break;
        case 0x3:
            return y;
        break;
        case 0x4:
            return x;
        break;
        case 0x5:
            return -y;
        break;
        case 0x6:
            return -x;
        break;
        case 0x7:
            return y;
        break;
    }
}

// linear interpolation
// f(a, b, x) = (1 - x) * a + (x * b)
PerlinNoiseGenerator.prototype.lerp = function(a, b, x) {    
    return a + x * (b - a);
}

PerlinNoiseGenerator.prototype.perlin = function(x, y) {
    //find the unit square
    var xi = (x | 0) & 255; //performing bitwise ops on a float converts it to an integer
    var yi = (y | 0) & 255;

    var xf = x - xi;
    var yf = y - yi;

    var u = this.fade(xf);
    var v = this.fade(yf);
    
    //perlin hash, picks a number from the lookup table generated when the PerlinNoiseGenerator was instantiated
    var aa = this.grad_lookup_table[this.grad_lookup_table[     xi ]+    yi    ];
    var ab = this.grad_lookup_table[this.grad_lookup_table[ 1 + xi ]+    yi    ];
    var ba = this.grad_lookup_table[this.grad_lookup_table[     xi ]+    yi + 1];
    var bb = this.grad_lookup_table[this.grad_lookup_table[ 1 + xi ]+    yi + 1];

    var x1 = this.lerp( this.grad(aa, xf, yf), this.grad(ab, xf-1, yf), u);
    var x2 = this.lerp( this.grad(ba, xf, yf - 1), this.grad(bb, xf-1, yf -1), u);
    var result = (this.lerp( x1, x2, v) + 1) / 2;    
    return result;
}

/* Generates a  w x h perlin noise map 
 * Note the values are stored in a 1d array row by row
 * Parameters
 *   w - width
 *   h - height
 *   initial_freq - determines the noisiness, the larger the number the less noisey
 *   steps - for values >1 multiple perlin maps will be generated and summed,
 *     each half the frequency of the last
 *   amplitude_divider - factor by which the amplitude of each step will be reduced
*/
PerlinNoiseGenerator.prototype.generate = function(w, h, initial_freq, steps, amplitude_divider){
    var map = [];
    
    console.log("Generating " + w + "x" + h + " perlin map");
    for(var j = 0; j < h; j++){
        for(var i = 0; i < w; i++){
            var amplitude = 1.0;
            var maxValue = 0;
            var total = 0;
            var freq = initial_freq;
            for(var k=0;k < steps;k++) {        
                total += this.perlin(i / freq, j / freq) * amplitude;        
                maxValue += amplitude;        
                amplitude /= amplitude_divider;
                freq /= 2;
            }            
            map.push( total / maxValue);
        }
    }
    
    return map;
}






        
        
        