function generateDistinctColors(count, saturation= 0.80, lightness = 0.65, alpha = 1) {
    var colors = [];
    for (var i = 0; i < count; i++) {
        var color = $.Color({ hue: i * (360 / count), saturation: saturation, lightness: lightness});
        colors.push(color.alpha(alpha));
    }
    return colors;
}

