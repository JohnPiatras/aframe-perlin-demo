//resources
// https://gpfault.net/posts/perlin-noise.txt.html
// http://eastfarthing.com/blog/2015-04-21-noise/
// https://flafla2.github.io/2014/08/09/perlinnoise.html
// https://www.shadertoy.com/view/4tGSzW

var test_table = [ 21, 57, 99, 196, 74, 241, 209, 79, 155, 47, 4, 144, 81, 68, 44, 13, 48, 46, 208, 198, 210, 132, 177, 113, 58, 222, 16, 192, 2, 166, 176, 62, 102, 253, 72, 232, 240, 85, 126, 15, 175, 154, 179, 247, 248, 237, 148, 139, 77, 206, 117, 103, 55, 11, 125, 96, 187, 29, 60, 89, 112, 152, 190, 127, 172, 3, 186, 82, 133, 14, 35, 221, 7, 53, 165, 140, 22, 114, 169, 200, 69, 189, 83, 159, 33, 97, 202, 109, 218, 30, 32, 118, 174, 236, 43, 34, 71, 199, 191, 91, 252, 153, 226, 230, 52, 110, 194, 223, 25, 228, 76, 61, 24, 163, 67, 239, 158, 255, 214, 220, 90, 73, 235, 164, 115, 122, 178, 107, 80, 123, 104, 10, 37, 94, 124, 116, 216, 217, 1, 167, 56, 119, 45, 162, 225, 92, 215, 84, 203, 250, 138, 98, 87, 70, 39, 161, 254, 193, 5, 86, 135, 171, 233, 49, 129, 180, 211, 173, 51, 151, 23, 64, 168, 59, 219, 17, 142, 121, 195, 182, 108, 137, 36, 101, 183, 145, 234, 212, 26, 54, 40, 6, 181, 160, 88, 143, 197, 231, 12, 136, 205, 0, 188, 246, 20, 66, 149, 42, 207, 150, 65, 128, 147, 213, 157, 146, 251, 100, 27, 93, 131, 50, 111, 242, 106, 63, 134, 249, 130, 185, 204, 78, 75, 31, 184, 243, 19, 201, 38, 141, 41, 229, 156, 170, 120, 18, 244, 28, 9, 227, 238, 95, 105, 8, 245, 224, 21, 57, 99, 196, 74, 241, 209, 79, 155, 47, 4, 144, 81, 68, 44, 13, 48, 46, 208, 198, 210, 132, 177, 113, 58, 222, 16, 192, 2, 166, 176, 62, 102, 253, 72, 232, 240, 85, 126, 15, 175, 154, 179, 247, 248, 237, 148, 139, 77, 206, 117, 103, 55, 11, 125, 96, 187, 29, 60, 89, 112, 152, 190, 127, 172, 3, 186, 82, 133, 14, 35, 221, 7, 53, 165, 140, 22, 114, 169, 200, 69, 189, 83, 159, 33, 97, 202, 109, 218, 30, 32, 118, 174, 236, 43, 34, 71, 199, 191, 91, 252, 153, 226, 230, 52, 110, 194, 223, 25, 228, 76, 61, 24, 163, 67, 239, 158, 255, 214, 220, 90, 73, 235, 164, 115, 122, 178, 107, 80, 123, 104, 10, 37, 94, 124, 116, 216, 217, 1, 167, 56, 119, 45, 162, 225, 92, 215, 84, 203, 250, 138, 98, 87, 70, 39, 161, 254, 193, 5, 86, 135, 171, 233, 49, 129, 180, 211, 173, 51, 151, 23, 64, 168, 59, 219, 17, 142, 121, 195, 182, 108, 137, 36, 101, 183, 145, 234, 212, 26, 54, 40, 6, 181, 160, 88, 143, 197, 231, 12, 136, 205, 0, 188, 246, 20, 66, 149, 42, 207, 150, 65, 128, 147, 213, 157, 146, 251, 100, 27, 93, 131, 50, 111, 242, 106, 63, 134, 249, 130, 185, 204, 78, 75, 31, 184, 243, 19, 201, 38, 141, 41, 229, 156, 170, 120, 18, 244, 28, 9, 227, 238, 95, 105, 8, 245, 224  ];

var PerlinNoiseGenerator = function(){
    // Hash lookup table for picking gradient vectors as defined by Ken Perlin.  This is a randomly
    // arranged array of all numbers from 0-255 inclusive.

    this.grad_lookup_table = this.generate_lookup_table();
    //this.grad_lookup_table = test_table;
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
            return x + y;
        break;
        case 0x5:
            return x - y;
        break;
        case 0x6:
            return -x + y;
        break;
        case 0x7:
            return -x - y;
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

    //Here we stretch our map height wise to use the whole range from 0.0 to 1.0
    var min_h = map[0];
    var max_h = 0;
    for(var i = 0; i < map.length; i++){
        if(map[i] > max_h){
            max_h = map[i];
        }else if (map[i] < min_h){
            min_h = map[i];
        }
    }
    //rescale
    var f = 1.0 / (max_h - min_h);
    for(var i = 0; i < map.length; i++){
        map[i] = f * (map[i] - min_h);
    }

    return map;
}




PerlinNoiseGenerator.prototype.generate2 = function(w, h, freqs, amplitudes){
    var map = [];
    
    console.log("Generating " + w + "x" + h + " perlin map");
    for(var j = 0; j < h; j++){
        for(var i = 0; i < w; i++){            
            var maxValue = 0;
            var total = 0;
            
            for(var k=0;k < freqs.length;k++) {        
                total += this.perlin(i / freqs[k], j / freqs[k]) * amplitudes[k];        
                maxValue += amplitudes[k];        
                
            }            
            map.push( total / maxValue);
        }
    }

    //Here we stretch our map height wise to use the whole range from 0.0 to 1.0
    var min_h = map[0];
    var max_h = 0;
    for(var i = 0; i < map.length; i++){
        if(map[i] > max_h){
            max_h = map[i];
        }else if (map[i] < min_h){
            min_h = map[i];
        }
    }
    //rescale
    var f = 1.0 / (max_h - min_h);
    for(var i = 0; i < map.length; i++){
        map[i] = f * (map[i] - min_h);
    }

    return map;
}

        
        
        