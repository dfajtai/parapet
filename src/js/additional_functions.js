function isObject(value) {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}


function isArray(val){
    return Array.isArray(val);
}


function getCol(objlist, col){
    var vals = [];
    $.each(objlist,function(index,entry){
        if(entry.hasOwnProperty(col))  vals.push(entry[col]);
    })

    return vals;
}


function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

function getColUnique(objlist, col){
    var vals = getCol(objlist,col);
    var unique = vals.filter(onlyUnique);

    return unique;
}

function parse_val(val, dummy = false){
    if(dummy) return val;

    if(val==null) return null;
    if(val==="") return null;
    var num_val = parseInt(val);

    if(String(val)!=String(num_val)){
        var _num_val = parseFloat(val);
        if(String(val)!=String(_num_val)){
            return val;
        };
        return _num_val;
    };
    return num_val;
}

function nullify_obj(obj, parse = false){
    // {'key':null, 'key2':null , ...} -> null
    if(!isObject(obj)) return obj;

    var keys = Object.keys(obj);
    var non_null_count = 0;

    var res = {};
    $.each(keys,function(index,key){
        let val = parse_val(obj[key],parse);
        if(val!=null){
            non_null_count+=1;
            res[key]=val;
        }
    })
    if(non_null_count == 0) return null;

    return res;
}

function nullify_array(array, parse = false){
    if(!Array.isArray(array)) return array;

    var non_null_count = 0;
    var res = [];
    $.each(array,function(index,entry){
        let val = parse_val(entry,parse);
        if(entry!=null){
            non_null_count+=1;
            res.push(val);
        }
    })
    if(non_null_count == 0) return null;

    return res;
}

function dropNullCols(objlist,cols){
    var cols_to_drop = [];
    for (let index = 0; index < cols.length; index++) {
        const col = cols[index];

        var col_values = getColUnique(objlist,col);
        if(nullify_array(col_values)===null) cols_to_drop.push(col);
    }

    for (let index = 0; index < objlist.length; index++) {
        for (let _index = 0; _index < cols_to_drop.length; _index++) {
            const col = cols_to_drop[_index];
            delete(objlist[index][col]);
            
        }
        
    }

    return objlist;
}