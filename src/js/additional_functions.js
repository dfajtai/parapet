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