//resources
// https://gpfault.net/posts/perlin-noise.txt.html
// http://eastfarthing.com/blog/2015-04-21-noise/
// https://flafla2.github.io/2014/08/09/perlinnoise.html
// https://www.shadertoy.com/view/4tGSzW


// Hash lookup table as defined by Ken Perlin.  This is a randomly
// arranged array of all numbers from 0-255 inclusive.
var permutation = [ 151,160,137,91,90,15,                
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,    
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
    129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];



function generate_lookup_table(){
    var a = [];
    for(var i = 0; i < 256; i++){
        a.push(i);        
    }

    var table = [];
    
    while(a.length > 0){
        var i = (Math.random() * a.length)  | 0; 
        table.push(a.splice(i, 1)[0]);
    }
    return table;
}

//var t = permutation;//generate_lookup_table();
var t = generate_lookup_table();
var p = [];
for(var i = 0; i < 512; i++){
    p.push(t[i%256]);
}

//fade function is 6t^5 - 15t^4 + 10t^3
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

// Gradient vectors
// 1, 0
// 0, -1
// -1, 0
// 0, 1
function grad(hash, x, y) {   
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
function lerp(a, b, x) {
    //return (1 - x) * a + (x * b);
    return a + x * (b - a);
}

var perlin_debug = [];
function perlin_values(x, xi, xf, u, v, result){
    this.x = x;
    this.xi = xi;
    this.xf = xf;
    this.u = u;
    this.v = v;
    this.result = result;
}

function perlin(x, y) {

    //find the unit square
    var xi = (x | 0) & 255; //performing bitwise ops on a float converts it to an integer
    var yi = (y | 0) & 255;

    var xf = x - xi;
    var yf = y - yi;

    //console.log("x = ", + x + ", y = " + y);
    //console.log("xi = ", + xi + ", yi = " + yi);
    //console.log("xf = ", + xf + ", yf = " + yf);

    var u = fade(xf);
    var v = fade(yf);
    //console.log(x + ", " + xi + ", " + xf + ", " + u + ", " + v);
    
    //perlin hash
    var aa = p[p[     xi ]+    yi    ];
    var ab = p[p[ 1 + xi ]+    yi    ];
    var ba = p[p[     xi ]+    yi + 1];
    var bb = p[p[ 1 + xi ]+    yi + 1];

    var x1 = lerp( grad(aa, xf, yf), grad(ab, xf-1, yf), u);
    var x2 = lerp( grad(ba, xf, yf - 1), grad(bb, xf-1, yf -1), u);
    var result = (lerp( x1, x2, v) + 1) / 2;
    //perlin_debug.push(new perlin_values(x, xi, xf, u, v, result));
    return result;
}


function generatePerlinMap(w, h, initial_freq, steps, amplitude_divider){
    var map = [];
    
    console.log("Generating " + w + "x" + h + " perlin map");
    for(var j = 0; j < h; j++){
        for(var i = 0; i < w; i++){
            var amplitude = 1.0;
            var maxValue = 0;
            var total = 0;
            var freq = initial_freq;
            for(var k=0;k < steps;k++) {        
                total += perlin(i / freq, j / freq) * amplitude;        
                maxValue += amplitude;        
                amplitude /= amplitude_divider;
                freq /= 2;
            }            
            map.push( total / maxValue);
        }
    }
    
    return map;
}

/*var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var imgData = ctx.createImageData(512, 512);
perlinData = generatePerlinMap(512, 512, 64, 1, 2);
var i;
for (i = 0; i < imgData.data.length; i += 4) {
    var p = perlinData[i / 4];
    var rgb = (p * 255) | 0;
    imgData.data[i+0] = rgb;
    imgData.data[i+1] = rgb;
    imgData.data[i+2] = rgb;
    imgData.data[i+3] = 255;
}

ctx.putImageData(imgData, 10, 10);

console.table(perlin_debug);*/




        
        
        