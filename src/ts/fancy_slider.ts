import * as noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';
import $ from 'jquery';

export var fancy_slider_index_pool = [];
export var fancy_slider_index = 1;


export class FancySlider{
    index: number;

    number_of_blocks: number; // number of measurement blocks in the protocol
    start_delay: number; // patient handling, positioning, planning in minutes
    end_delay:number; // patient handling, data export in minutes

    number_of_fovs:number; // number of pet FOVs
    fov_duration:number; // sindle PET FOV duration in minutes

    parts: []

    id: string;
    dom: Object;


    constructor(start_delay:number, end_delay:number, number_of_fovs:number, fov_duration:number){
        this.number_of_blocks = 2;
        this.start_delay = start_delay;
        this.end_delay = end_delay;
        this.number_of_fovs = number_of_fovs;
        this.fov_duration = fov_duration;

        this.index = fancy_slider_index;
        fancy_slider_index+=1;
        fancy_slider_index_pool.push(this);

        this.id = "slider_"+this.index;

    }

    create_slider_dom(container){
        this.dom = $("<div/>").addClass("slider-box-handle slider-styled slider-hide").attr("id",this.id);
        $(container).append(this.dom);
    }


}