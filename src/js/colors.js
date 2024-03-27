function generateDistinctColors(count) {
    var colors = [];
    for (var i = 0; i < count; i++) {
        var color = $.Color({ hue: i * (360 / count), saturation: 0.75, lightness: 0.6 });
        colors.push(color);
    }
    return colors;
}

