

class Parapet {
    static number_of_patients = 2;
    static work_start = moment("08:00","HH:mm");
    static work_end = moment("16:00","HH:mm");

    static main_container = null;
    
    static parapet_config_container = null;

    static sliders = [];

    static indicator_container = null;

    static set_params(number_of_patients, work_start, work_end){
        this.number_of_patients = number_of_patients;
        this.work_start = work_start;
        this.work_end = work_end;
    }

    static createGUI(container){
        if(this.main_container){
            $(this.main_container).empty();
        }

        this.main_container = $(container);
        this.main_container.addClass("d-flex");


        for (let slider_index = 0; slider_index < this.sliders.length; slider_index++) {
            const slider = this.sliders[slider_index];
            var slider_container = $("<div/>").attr("id",`flancy_slider_${slider_index+1}`);
            if( slider instanceof FancySlider ){
                slider.create_GUI(slider_container);
            }
        }
    }

}


class FancySlider {
    constructor (start, number_of_fovs, fov_duration, number_of_measurements = 2,  timings = null, start_dealy = 2, end_delay = 2 ){
        this.start = start;
        this.number_of_fovs = number_of_fovs;
        this.fov_duration = fov_duration;

        this.number_of_measurements = number_of_measurements;

        if(timings === null){
            this.timings = new Array(number_of_measurements-1).fill(0);
        }
        else{
            this.timings = timings;
        }
        

        
        if(this.number_of_measurements-1 != this.timings.length){
            throw new RangeError("A timing is required for every subsequent measurement.");
        }

        this.start_dealy = start_dealy;
        this.end_delay = end_delay;

        this.container = null;

        Parapet.sliders.push(this);
    }

    #create_slider_gui(container){
        $(container).empty();

    }

    #dynamicRangeInput(container, name, label, default_value, arg = null, on_change = null){
        var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for",name+"Input").html(label);
    
        var group_container = $("<div/>").addClass("input-group");
        
        var _input = $("<input/>").addClass("form-control form-range w-50 mt-2 me-2");
        _input.attr("type","range").attr("id",name+"Input").attr("name",name).attr("data-name",name).attr("data-label",label);
        $(_input).attr("data-value","");

        $(_input).val(default_value);

        if(arg.hasOwnProperty("step")) _input.attr("step",arg.step);
        if(arg.hasOwnProperty("min")) _input.attr("min",arg.min);
        if(arg.hasOwnProperty("max")) _input.attr("max",arg.max);
    
        group_container.append(_input)
    
        var current =$("<input/>").addClass("form-control").attr("type","numeric").attr("id","currentValue");

        $(current).val(default_value);
        if(arg.hasOwnProperty("step")) current.attr("step",arg.step);
        
        group_container.append(current);
    
        $(_input).on("change",function(){
            $(current).val($(this).val());
            $(this).prop("data-value",$(this).val());
            if(on_change instanceof Function){
                on_change($(this).val());
            }
        })
    
        $(current).on("change",function(){
            $(_input).val($(this).val());
            $(_input).prop("data-value",$(this).val());
        })
    
        $(_input).on("input",function(){
            $(current).val($(this).val());
            $(this).prop("data-value",$(this).val());
        })
    
        if(arg.hasOwnProperty("unit")){
            var unit = $("<span/>").addClass("input-group-text w-25");  
            unit.html(arg.unit);
            group_container.append(unit);
        }
    
        container.append(_label);
        container.append($("<div/>").addClass("col-md-9").append(group_container));
    }

    #create_parameter_gui(container){

        $(container).empty();

        $(container).addClass("d-flex flex-column");

        var number_of_measurements_block = $("<div/>").attr("id","number_of_measurements_block").addClass("row mb-2");
        var timing_block = $("<div/>").attr("id","timing_block").addClass("row  mb-2 d-flex");

        this.#dynamicRangeInput(number_of_measurements_block,
            "number_of_measurements",
            "Number of measurements",
            this.number_of_measurements,
            {"min":1,"max":3,"step":1},
            function(val){
                this.number_of_measurements = parseInt(val);
            }.bind(this))

        for (let index = 0; index < this.timings.length; index++) {
            const orig_timing = this.timings[index];
            var timing_label = `Timing of the ${index+2}. measurement`;
            var _timing_input = $("<input/>").addClass("form-control").attr("name","timing").attr("type","numeric").attr("step",1).prop("timing-index",index);
            _timing_input.attr("data-bs-toggel","tooltip").attr("data-bs-placement","top").attr("title",timing_label);
            _timing_input.val(orig_timing);
            timing_block.append(_timing_input);
            
        }
        

        var start_delay_block = $("<div/>").attr("id","start_delay_block").addClass("row mb-2");
        var end_delay_block  = $("<div/>").attr("id","end_delay_block").addClass("row mb-2");


        this.#dynamicRangeInput(start_delay_block,
            "start_delay",
            "Measurement start delay",
            this.start_dealy,
            {"min":0,"max":10,"step":1},
            function(val){
                this.start_delay = parseInt(val);
            }.bind(this))
        
        this.#dynamicRangeInput(end_delay_block,
            "end_delay",
            "Measurement end delay",
            this.end_delay,
            {"min":0,"max":10,"step":1},
            function(val){
                this.end_delay = parseInt(val);
            }.bind(this))

        

        var start_time_block = $("<div/>").attr("id","start_time_block").addClass("row mb-2");

            

        var number_of_fovs_block = $("<div/>").attr("id","number_of_fovs_block").addClass("row mb-2");
        var fov_duration_block = $("<div/>").attr("id","fov_duration_block").addClass("row mb-2");
        
        
        this.#dynamicRangeInput(number_of_fovs_block,
            "number_of_fovs",
            "Number of FOVs",
            this.number_of_fovs,
            {"min":1,"max":8,"step":1},
            function(val){
                this.number_of_fovs = parseInt(val);
            }.bind(this))

        this.#dynamicRangeInput(fov_duration_block,
            "fov_duration",
            "FOV duration",
            this.fov_duration,
            {"min":0,"max":15,"step":1},
            function(val){
                this.fov_duration = parseInt(val);
            }.bind(this))       

        
        
        container.append(number_of_measurements_block);
        container.append(timing_block);

        container.append(end_delay_block);
        container.append(start_time_block);

        container.append(start_delay_block);

        container.append(number_of_fovs_block);
        container.append(fov_duration_block);
        



    }



    create_GUI(container){
        if(this.container){
            this.container.empty();
        }
        this.container = $(container);

        var slider_div = $("<div/>").attr("id","slider_div");


        var parameter_div = $("<div/>").attr("id","param_div");

        this.#create_slider_gui(slider_div);
        this.#create_parameter_gui(parameter_div);

        this.container.append(slider_div);

        this.container.append(parameter_div);
    }
}