function dynamicRangeInput(container, name, label, default_value, arg = null, on_change = null){
    var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for",name+"Input").html(label);

    var group_container = $("<div/>").addClass("input-group");
    
    var _input = $("<input/>").addClass("form-control form-range w-50 mt-2 me-2");
    _input.attr("type","range").attr("id",name+"Input").attr("name",name).attr("data-name",name).attr("data-label",label);
    $(_input).attr("data-value","");

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

    $(_input).val(default_value).trigger("change");

    container.append(_label);
    container.append($("<div/>").addClass("col-md-9").append(group_container));
}


function dynamicTimeInput(container,name,label, on_change = null){
    var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for",name+"Input").html(label);

    var group_container = $("<div/>").addClass("d-flex flex-xl-row flex-column justify-content-evenly");

    var part_1 = $("<div/>").addClass("input-group d-flex flex-fill mb-xl-0 mb-1 me-xl-2");
    var part_2 = $("<div/>").addClass("input-group d-flex flex-fill");

    group_container.append(part_1);
    group_container.append(part_2);

    var current = $("<span/>").addClass("input-group-text flex-grow-1").attr("id","currentTime");
    part_1.append(current);

    var fa_span =$("<span/>").addClass("fa fa-arrow-right update-date pt-1");
    part_1.append($("<i/>").addClass("btn-outline-dark btn update-date").append(fa_span));
    var _input = $("<input/>").addClass("form-control flex-grow-1").attr("type","time").attr("id",name+"Input").attr("name",name).attr("data-name",name).attr("data-label",label).attr("step","0");
    
    // _input.val(moment().format("HH:mm"));
    _input.on("change",function(){
        if(on_change instanceof Function){
            on_change($(this).val());
        }
    })

    part_2.append(_input);

    var clear_span =$("<span/>").addClass("fa fa-x clear-datetime pt-1");
    part_2.append($("<i/>").addClass("btn-outline-dark btn clear-datetime").append(clear_span));

    current.html(moment().format("HH:mm"));
    setInterval(function(){current.html(moment().format("HH:mm"));},1000);

    group_container.find(".update-date").on("click", function (){
        $(_input).val(current.html());
    });

    group_container.find(".clear-datetime").on("click", function (){
        $(_input).val(null);
    });

    container.append(_label);
    container.append($("<div/>").addClass("col-md-9").append(group_container));
}



function simple_dynamic_input_time(container, name, label, interval = 5, min_time = null, max_time = null, default_time = null, on_change = null){
    container.empty();

    if(min_time === null) min_time = moment(Parapet.work_start,"HH:mm").format("HH:mm");
    if(max_time === null) max_time = moment(Parapet.work_end,"HH:mm").format("HH:mm");
    if(default_time === null) default_time = moment(Parapet.default_time,"HH:mm").format("HH:mm");
    
    var _time_label = $("<label/>").addClass("col-md-3 col-form-label").attr("for","pet_start").html(label);
    var _time_input = $("<input/>").addClass("form-control").attr("id",name+"_input").attr("name",name);

    container.append(_time_label);
    container.append($("<div/>").append(_time_input).addClass("col-md-9"));
    

    _time_input.timepicker({
        timeFormat: 'HH:mm',
        interval: interval,
        minTime: moment(min_time,"HH:mm").format("HH:mm"),
        maxTime: moment(max_time,"HH:mm").format("HH:mm"),
        defaultTime: moment(default_time,"HH:mm").format("HH:mm"),
        startTime: moment(min_time,"HH:mm").format("HH:mm"),
        dynamic: false,
        dropdown: true,
        scrollbar: true
        });
    _time_input.on("click",function(){
        $(this).val("");
    })
    _time_input.on("change",function(){
        if(on_change instanceof Function){
            on_change($(this).val());
        }
    })

}



class Parapet {
    static number_of_patients = 1;
    static work_start = moment("08:00","HH:mm");
    static work_end = moment("16:00","HH:mm");
    static default_time = this.work_start;

    static main_container = null;
    
    static parapet_config_container = null;


    static patients_container = null;
    static patients = [];

    static indicator_container = null;

    static set_params(number_of_patients, work_start, work_end){
        this.number_of_patients = number_of_patients;
        this.work_start = work_start;
        this.work_end = work_end;
        this.default_time = this.work_start;
    }

    static updatePatientCount(new_count){
        
        if(Parapet.patients.length>new_count){
            for (let index = Parapet.patients.length; index > new_count; index--) {
                Parapet.patients[index-1].set_visibility(false);
            }
        }
        else if(Parapet.patients.length<new_count){
            for (let index = Parapet.patients.length; index < new_count; index++) {
                var new_patient = new PETPatient(Parapet.default_time);
            }
        }
        for (let index = 0; index < new_count; index++) {
            Parapet.patients[index].set_visibility(true);
        }


        Parapet.number_of_patients = new_count;

        Parapet.createUpdatePatientsGUI();

    }

    static createParapetConfigGUI(container){
        container.empty();

        var config_container = $("<div/>").attr("id","parapet_config").addClass("row");
        this.parapet_config_container = config_container;

        
        
        var number_of_patients_block = $("<div/>").addClass("col-md-4 row ");
        
        dynamicRangeInput(
          number_of_patients_block,
          "number_of_patients",
          "Num. of patients",
          Parapet.number_of_patients,
          { min: 1, max: 10, step: 1 },
          function (val) {
            Parapet.updatePatientCount(parseInt(val));
          }
        );


        config_container.append(number_of_patients_block);


        var work_start_block = $("<div/>").add("col-md-4");


        var work_end_block = $("<div/>").add("col-md-4");


        container.append(config_container);

    }

    static createUpdatePatientsGUI(container = null){
        if(container!== null) this.patients_container = $(container);

        this.patients_container.addClass("d-flex");


        for (let index = 0; index < this.patients.length; index++) {
            const patient = this.patients[index];
            var patient_container = $("<div/>").attr("id",`patient_${index+1}`);

            if(this.patients_container.find(`#patient_${index+1}`).length == 0){
                this.patients_container.append(patient_container);
            }

            if( patient instanceof PETPatient ){
                if(patient.container === null){
                    patient.create_GUI(patient_container);
                }
            }

        }
    }

}


class PETPatient {
    constructor (pet_start = null, number_of_fovs =1 , fov_duration = 10, inj_delay = 10,
                 number_of_measurements = 1,  timings = [], start_delay = 2, end_delay = 2 ){

        if(pet_start === null) pet_start = Parapet.default_time;
        this.pet_start = pet_start;

        this.inj_delay = inj_delay;

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

        this.start_delay = start_delay;
        this.end_delay = end_delay;

        this.container = null;
        this.index =  Parapet.patients.length;
        this.slider_name = `slider_${this.index}`;

        this.slider_div = null;
        this.slider = null;
        this.params_div = null;

        this.visible = true;

        Parapet.patients.push(this);
        
    }

    set_visibility(new_visibility_val){
        this.visible = new_visibility_val;
        if(this.visible){
            if(this.container){
                this.container.removeClass("d-none");
            }
        }
        else{
            if(this.container){
                this.container.addClass("d-none");
            }
        }
    }

    #create_slider_gui(container){
        $(container).empty();
        var slider_element = $("<div/>").addClass("slider-box-handle slider-styled slider-hide  w-100").attr("id",this.slider_name);
        container.append($("<div/>").append(slider_element).css("height","100pt"));
        this.container.append(container);

        
        var slider = document.getElementById(this.slider_name);
        this.slider = slider;

        function filterPips(value, type) {
            var minute = value %30;
            switch(minute){
                case 15:
                    return 2
                break;
                case 0:
                    return 1;
                break;
                default:
                    return 0;
            }
        }

        noUiSlider.create(slider,{
            start: [100, 130, 200,230],
            connect: [false,true,false,true,false],
            behaviour: 'drag-all',
            range: {
                'min': 0,
                'max': 600
            },
            step:5,
            pips: {
                mode: 'steps',
                density: 5,
                filter: filterPips,
                format: wNumb({
                    decimals: 0,
                    edit: function(value){
                        //console.log(value);
                        return moment("07:30","HH:mm").add(value,"minutes").format("HH:mm");
                    }
                    
                })
            },
            tooltips:true
        });

        //mergeTooltips(slider, 5, ' - ');


        var activePips = [null, null];
        
        slider.noUiSlider.on('update', function (values, handle) {
            // Remove the active class from the current pip
            if (activePips[handle]) {
                activePips[handle].classList.remove('active-pip');
                
            }

            // Match the formatting for the pip
            var dataValue = Math.round(values[handle]);

            // Find the pip matching the value
            activePips[handle] = slider.querySelector('.noUi-value[data-value="' + dataValue + '"]');

            // Add the active class
            if (activePips[handle]) {
                activePips[handle].classList.add('active-pip');
            }
        });

    }

    draw_timig_block(container){
        if(this.timings.length == 0){
            $(container).addClass("d-none");
            return;
        }
        else{
            $(container).removeClass("d-none");
        }

        var _timing_block = $(container).find("#timing_block");
        if(_timing_block.length==0){
            var _label = $("<label/>").html("Timing(s) [min]").addClass("col-form-label me-2").css('border','').attr("for","timing_block");
            container.append($("<div/>").addClass("col-md-3").append(_label));

            var _timing_block = $("<div/>").attr("id","timing_block").addClass("d-flex");
            container.append($("<div/>").addClass("col-md-9").append(_timing_block));

        }
        else{
            _timing_block = _timing_block.first();
        }

        _timing_block.empty();

        for (let index = 0; index < this.timings.length; index++) {
            const orig_timing = this.timings[index];
            var timing_label = `Timing of the ${index+2}. measurement`;
            var _timing_input = $("<input/>").addClass("form-control flex-fill").attr("name","timing").attr("type","numeric").attr("step",1).prop("timing-index",index);
            _timing_input.attr("data-bs-toggel","tooltip").attr("data-bs-placement","top").attr("title",timing_label);
            if(index>0){
                _timing_input.addClass("ms-1")
            }
            _timing_input.val(orig_timing);
            _timing_block.append(_timing_input);
            
        }

    }

    #create_parameter_gui(container){

        $(container).empty();

        $(container).addClass("d-flex flex-column");

        var number_of_measurements_block = $("<div/>").attr("id","number_of_measurements_block").addClass("row mb-1");
        var timing_block = $("<div/>").addClass("row mb-1 d-flex");
        var inj_delay_block = $("<div/>").attr("id","inj_delay_block").addClass("row mb-1");

        var start_time_block = $("<div/>").attr("id","start_time_block").addClass("row mb-1");

        var number_of_fovs_block = $("<div/>").attr("id","number_of_fovs_block").addClass("row mb-1");
        var fov_duration_block = $("<div/>").attr("id","fov_duration_block").addClass("row mb-1");

        var start_delay_block = $("<div/>").attr("id","start_delay_block").addClass("row mb-1");
        var end_delay_block  = $("<div/>").attr("id","end_delay_block").addClass("row mb-1");

        container.append(number_of_measurements_block);
        container.append(timing_block);
        container.append(inj_delay_block);
        
        container.append(start_time_block);

        container.append(number_of_fovs_block);
        container.append(fov_duration_block);
        
        container.append(start_delay_block);
        container.append(end_delay_block);

        this.container.append(container);
        

        dynamicRangeInput(number_of_measurements_block,
            "number_of_measurements",
            "Number of measurements",
            this.number_of_measurements,
            {"min":1,"max":3,"step":1},
            function(val){
                this.number_of_measurements = parseInt(val);

                if(this.number_of_measurements-1 > this.timings.length){
                    for (let index = this.timings.length; index < this.number_of_measurements-1; index++) {
                        this.timings.push(0);
                    }
                }
                else if(this.number_of_measurements-1 < this.timings.length)
                {
                    for (let index = this.number_of_measurements-1; index <this.timings.length; index++) {
                        this.timings.pop();
                    }
                }
                this.draw_timig_block(timing_block);
            }.bind(this))
        



        
        // this.#dynamicTimeInput(start_time_block,
        //     "start",
        //     "PET start time [HH:mm]",
        //     function(val){
        //         this.pet_start = monent(val);
        //     }.bind(this))
        simple_dynamic_input_time(
          start_time_block,
          "pet_start",
          "PET start time [HH:mm]",
          5,
          null,
          null,
          null,
          function (val) {
            console.log(val);
            this.pet_start = moment(val, "HH:mm");
          }.bind(this)
        );
        
        dynamicRangeInput(inj_delay_block,
            "start_delay",
            "Inj. delay [min]",
            this.inj_delay,
            {"min":0,"max":90,"step":1},
            function(val){
                this.inj_delay = parseInt(val);
            }.bind(this))                   
        
        dynamicRangeInput(number_of_fovs_block,
            "number_of_fovs",
            "Number of FOVs",
            this.number_of_fovs,
            {"min":1,"max":8,"step":1},
            function(val){
                this.number_of_fovs = parseInt(val);
            }.bind(this))

        dynamicRangeInput(fov_duration_block,
            "fov_duration",
            "FOV duration [min]",
            this.fov_duration,
            {"min":0,"max":15,"step":1},
            function(val){
                this.fov_duration = parseInt(val);
            }.bind(this))       
        

        dynamicRangeInput(start_delay_block,
            "start_delay",
            "Start delay [min]",
            this.start_delay,
            {"min":0,"max":15,"step":1},
            function(val){
                this.start_delay = parseInt(val);
            }.bind(this))
        
        dynamicRangeInput(end_delay_block,
            "end_delay",
            "End delay [min]",
            this.end_delay,
            {"min":0,"max":15,"step":1},
            function(val){
                this.end_delay = parseInt(val);
            }.bind(this))     
        
        

    }



    create_GUI(container){
        if(this.container){
            this.container.empty();
        }
        this.container = $(container);

        var slider_div = $("<div/>").attr("id","slider_div");
        this.slider_div = slider_div;


        var parameter_div = $("<div/>").attr("id","param_div");
        this.params_div = parameter_div;

        // this.#create_slider_gui(slider_div);
        this.#create_parameter_gui(parameter_div);


    }
}