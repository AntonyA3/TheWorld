const AxisAngle = {
    toQuarternion: function(axis, angle){
        let s = Math.sin(angle * 0.5);
        let c = Math.cos(angle * 0.5);
        return[c, axis[0] * s, axis[1] * s, axis[2] * s]
    }
}

const Vector3 ={
    scale(v, s){
        return [v[0] * s, v[1] * s, v[2] * s];
    },
    add(v0, v1){
        return [v0[0] + v1[0], v0[1] + v1[1], v0[2] + v1[2]];
    },
    normalize(v){
        let div = 1 / Vector3.length(v);
        return Vector3.scale(v, div)
    },
    length(v){
        return Math.sqrt(Vector3.lengthSquared(v))
    },
    lengthSquared(v){
        return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    },
    dot(v0, v1){
        return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
    },
    subtract(v0, v1){
        return[
            v0[0] - v1[0],
            v0[1] - v1[1],
            v0[2] - v1[2]
        ]
    }
    
}
const Quarternion = {
    inverse: function (q){
        return Quarternion.scale([q[0],-q[1],-q[2],-q[3]], 1 / Quarternion.magnitude(q));

    },
    scale:function(q, s){
        return [q[0] * s, q[1] * s, q[2] * s, q[3] * s]
    },
    magnitudeSquared: function(q){
        return q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];

    },
    magnitude: function(q){
        return Math.sqrt(Quarternion.magnitudeSquared(q));

    },
    transform(vec, quart){
        let inverse = Quarternion.inverse(quart);
        let p = [1.0,vec[0], vec[1], vec[2]];
        let p2 = Quarternion.multiply(inverse,Quarternion.multiply(p, quart));
        return [p2[1],p2[2],p2[3]];
    },
    rotate(q0, q1){
        let inverse = Quarternion.inverse(q1)
        return  Quarternion.multiply(q1,q0);
    },
    multiply(p, q){
        return[
            p[0] * q[0] - p[1] * q[1] - p[2] * q[2] - p[3] * q[3],
            p[0] * q[1] + p[1] * q[0] + p[2] * q[3] - p[3] * q[2],
            p[0] * q[2] - p[1] * q[3] + p[2] * q[0] + p[3] * q[1],
            p[0] * q[3] + p[1] * q[2] - p[2] * q[1] + p[3] * q[0]
        ]
    }
}


const Matrix = {
    identity: function(){
        return[
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ]
    },
    scale: function(scale){
        return[
            scale[0],0,0,0,
            0,scale[1],0,0,
            0,0,scale[2],0,
            0,0,0,1
        ]
    },
    translation: function(translation){
        return[
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            translation[0],translation[1],translation[2],1
        ]
    }, 
    xVector: function(m){
        return [m[0], m[4], m[8]];
    },
    yVector: function(m){
        return [m[1], m[5], m[9]];
    },
    zVector: function(m){
        return [m[2], m[6], m[10]];
    },
    transform: function(m, v){
        let x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
        let y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
        let z = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];
        return[x,y,z]

    },
    
    multiply: function(mat1, mat2){
        let m = [
            0,0,0,0,
            0,0,0,0,
            0,0,0,0,
            0,0,0,0
            ]

        for(var i = 0; i < 4; i++){
            for(var j = 0; j < 4; j++){
                let index = j * 4 + i;
                
                let m0 = mat2[0 + (j * 4)];
                let m1 = mat2[1 + (j * 4) ];
                let m2 = mat2[2 + (j * 4)];
                let m3 = mat2[3 + (j * 4)];

                let n0 = mat1[0 + i];
                let n1 = mat1[4 + i];
                let n2 = mat1[8 + i];
                let n3 = mat1[12 + i]
                
                m[index] =  m0 * n0 + m1 * n1 + m2 * n2 + m3 * n3;
            }
        }
        return m;
    },
    perspective(near, far, aspectRatio, fov){
        let p = 1 / Math.tan(fov * 0.5);
        return[
            p * (1/aspectRatio),0,0,0,
            0,p,0,0,
            0,0,(-near-far) / (near - far), (2 * far * near) / (near - far),
            0,0,1,0 
        ]
    },
    rotationY(rotation){
        let c = Math.cos(rotation);
        let s = Math.sin(rotation);
        return[
            c,0,s,0,
            0,1,0,0,
            -s,0,c,0,
            0,0,0,1
        ]
    },



    fromQuarternion(q){
        let m = [
            0,0,0,0,
            0,0,0,0,
            0,0,0,0,
            0,0,0,0
        ]
        m[0] =  2 * (q[0] * q[0] + q[1] * q[1]) -1;
        m[1] = 2 *(q[1] * q[2] + q[0] * q[3]);
        m[2] = 2 * (q[1] * q[3] - q[0] * q[2]);
        m[3] = 0;
        m[4] = 2 *(q[1] * q[2] - q[0] * q[3]) ;
        m[5] = 2 * (q[0] * q[0] + q[2] * q[2]) - 1;
        m[6] = 2 * (q[2] * q[3] + q[0] * q[1]);
        m[7] = 0;
        m[8] = 2 * (q[1] * q[3] + q[0] * q[2]);
        m[9] = 2 * (q[2] * q[3] - q[0] * q[1]);
        m[10] =  2 * (q[0] * q[0] + q[3] * q[3]) - 1;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] =1; 
        return m;


    }

}