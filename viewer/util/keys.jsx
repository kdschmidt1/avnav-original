/**
 * Created by andreas on 27.07.19.
 */

const K=999; //the real value does not matter

//the global definition of all used store keys
//every leaf entry having the value "K" will be replaced with its path as a string
let keys={
    nav:{
        gps:{
            lat:K,
            lon:K,
            position: K,
            course: K,
            speed: K,
            rtime: K,
            raw: K,
            valid: K,
            windAngle: K,
            windSpeed: K,
            windReference: K,
            positionAverageOn:K,
            speedAverageOn: K,
            courseAverageOn: K,
            sequence: K, //will be incremented as last operation on each receive
        }
    }
};

//replace all "K" values with their path as string
function update_keys(base,name){
    for (let k in base){
        let cname=name?(name+"."+k):k;
        if (base[k] === K){
            base[k]=cname;
        }
        if (typeof (base[k]) === 'object'){
            update_keys(base[k],cname);
        }
    }
}

update_keys(keys);

module.exports=keys;
