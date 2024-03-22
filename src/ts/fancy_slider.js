"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FancySlider = exports.fancy_slider_index = exports.fancy_slider_index_pool = void 0;
require("nouislider/dist/nouislider.css");
var jquery_1 = require("jquery");
exports.fancy_slider_index_pool = [];
exports.fancy_slider_index = 1;
var FancySlider = /** @class */ (function () {
    function FancySlider(start_delay, end_delay, number_of_fovs, fov_duration) {
        this.number_of_blocks = 2;
        this.start_delay = start_delay;
        this.end_delay = end_delay;
        this.number_of_fovs = number_of_fovs;
        this.fov_duration = fov_duration;
        this.index = exports.fancy_slider_index;
        exports.fancy_slider_index += 1;
        exports.fancy_slider_index_pool.push(this);
        this.id = "slider_" + this.index;
    }
    FancySlider.prototype.create_slider_dom = function (container) {
        this.dom = (0, jquery_1.default)("<div/>").addClass("slider-box-handle slider-styled slider-hide").attr("id", this.id);
        (0, jquery_1.default)(container).append(this.dom);
    };
    return FancySlider;
}());
exports.FancySlider = FancySlider;
