class Parapet {
    static number_of_patients = 3;
    static work_start = moment("08:00","HH:mm");
    static work_end = moment("16:00","HH:mm");
    static default_time = this.work_start;

    static main_container = null;
    
    static parapet_config_container = null;


    static patients_container = null;
    static patients = [];
    static colors = generateDistinctColors(10);

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
                new_patient.pushToPatients();
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

        
        
        var number_of_patients_block = $("<div/>").addClass("col-md-4 d-flex ");
        
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


        var work_start_block = $("<div/>").addClass("col-md-4 d-flex");
        
        simple_dynamic_input_time(
          work_start_block,
          "work_start",
          "Work start",
          30,
          "06:00",
          "18:00",
          moment(Parapet.work_start, "HH:mm").format("HH:mm"),
          function (val) {
                if(val=="") val = Parapet.work_start;
                if(moment(Parapet.work_end,"HH:mm").diff(moment(val,"HH:mm"),"minutes")<=0){
                    alert("Work start can not be greater than work end");
                    work_start_block.find("input").val(moment(Parapet.work_start,"HH:mm").format("HH:mm"));
                }
                else{
                    Parapet.work_start = moment(val, "HH:mm").format("HH:mm");
                    Parapet.updateWorkHours();
                }
          }
        );

        config_container.append(work_start_block);

        var work_end_block = $("<div/>").addClass("col-md-4 d-flex");
        simple_dynamic_input_time(
          work_end_block,
          "work_end",
          "Work end",
          30,
          "06:00",
          "18:00",
          moment(Parapet.work_end, "HH:mm").format("HH:mm"),
          function (val) {
            if(val=="") val = Parapet.work_end;
            if(moment(val,"HH:mm").diff(moment(Parapet.work_start,"HH:mm"),"minutes")<=0){
                alert("Work end can not be smaller than work start");
                work_end_block.find("input").val(moment(Parapet.work_end,"HH:mm").format("HH:mm"));
            }
            else{
                Parapet.work_end = moment(val, "HH:mm").format("HH:mm");
                Parapet.updateWorkHours();
            }
          }
        );

        config_container.append(work_end_block);


        container.append(config_container);

    }

    static updateWorkHours(){
        $.each(Parapet.patients,function (patient_index, patient) { 
            if(patient instanceof PETPatient){
                if(patient.container)  patient.create_GUI(patient.container);
                console.log("updated");
            }
        })
    }

    static createUpdatePatientsGUI(container = null){
        if(container!== null) this.patients_container = $(container);

        this.patients_container.addClass("d-flex flex-column");


        for (let index = 0; index < this.patients.length; index++) {
            const patient = this.patients[index];
            var patient_container = $("<div/>").attr("id",`patient_${index+1}`).addClass("row p-2 m-1 shadow-sm").css("border","#ced4da 0.5px solid");
            patient_container.css("background","#f8f9fa");;

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

    static presets = {
        fdg: new PETPatient(null, 3, 5, 90, 1, [], 5, 15),
        fdg_wb: new PETPatient(null, 7, 5, 90, 1, [], 5, 15),
        dopa: new PETPatient(null, 3, 5, 90, 1, [], 5, 15),
        dopa_wb: new PETPatient(null, 7, 5, 90, 1, [], 5, 15),
        choline: new PETPatient(null, 3, 5, 10, 2, [60], 5, 5),
        choline_prostata: new PETPatient(null, 3, 5, 2, 2, [60], 5, 5),
        // test: new PETPatient(null, 3, 5, 2, 3, [30,60], 5, 5),
    };



    constructor (pet_start = null, number_of_fovs =1 , fov_duration = 10, inj_delay = 10,
                 number_of_scans = 1,  timings = [], start_delay = 2, end_delay = 2 ){

        if(pet_start === null) pet_start = Parapet.default_time;
        this.pet_start = moment(pet_start,"HH:mm").format("HH:mm");

        this.inj_delay = inj_delay;

        this.number_of_fovs = number_of_fovs;
        this.fov_duration = fov_duration;

        this.number_of_scans = number_of_scans;

        if(timings === null){
            this.timings = new Array(number_of_scans-1).fill(0);
        }
        else{
            this.timings = timings;
        }
        

        
        if(this.number_of_scans-1 != this.timings.length){
            throw new RangeError("A timing is required for every subsequent measurement.");
        }

        this.start_delay = start_delay;
        this.end_delay = end_delay;


        this.param_keys = Object.keys(this);
    
    }

    pushToPatients(){
        this.patient_name = "";

        this.container = null;
        this.index =  Parapet.patients.length;
        this.slider_name = `patient_${this.index}_slider`;

        this.slider_div = null;
        this.slider = null;
        this.params_div = null;

        this.visible = true;    

        this.color = Parapet.colors[this.index];

        this.patient_details_name = `patient_${this.index+1}_details`;

        this.slider_dragged = false;
        this.slider_pre_drag_starts = null;

        Parapet.patients.push(this);


    }

    initFromPreset(preset_name){
        if(preset_name in PETPatient.presets){
            $.each(PETPatient.presets[preset_name].param_keys,
                function(index,key){
                    if(key!="pet_start") this[key] = PETPatient.presets[preset_name][key];
                }.bind(this))
        }
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

    update_params_gui(){
        if(this.params_div){
            // console.log(this.params_div)
            $.each(this.param_keys,function(index, key){     
                // console.log(key);          
                var param_div = this.params_div.find(`[name="${key}"]`);
                // console.log(param_div);

                switch (param_div.length) {
                    case 0:
                        break;
                    
                    case 1:
                        param_div.first().val(this[key]).trigger("change");
                        break;
                    
                    default:
                        // $.each(param_div,function(_index, element){
                        //     $(element).val(this[key][parseInt($(element).attr("index"))]).trigger("change");
                        // }.bind(this))
                        break;
                }
            }.bind(this))
        }
    }

    #show_presets_block(container,label = "Preset"){
        var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for","presets").html(label);
        var _select_dropdow = $("<select/>").addClass("form-select").attr("type","text").attr("id","presets_select").attr("name","presets");
        _select_dropdow.append($("<option/>").html("Choose preset...").prop('selected',true).attr("value","").attr("disabled",true));
        $.each(PETPatient.presets, function (preset_name, preset_patient) { 
            _select_dropdow.append($("<option/>").html(preset_name).attr("value",preset_name));
        });
        
        _select_dropdow.on("change",function(event){
            const val = event.target.value;
            if(val!=""){
                this.initFromPreset(val);
                this.update_params_gui();
            }
        }.bind(this))

        container.empty();
        container.append(_label).append($("<div/>").addClass("col-md-9").append(_select_dropdow));

    }

    #show_name_block(container){
        var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for","patient_name").html(`Nr.${this.index+1}`);
        var _input = $("<input/>").addClass("form-control ").attr("type","text").attr("id","presets_select").attr("name","patient_name");
        _input.attr("placeholder","Patient Name (GDPR!)")
        _input.val(this.patient_name);
        
        _input.on("change",function(event){
            const val = event.target.value;
            this.patient_name = val;
        }.bind(this))

        container.empty();
        container.append(_label).append($("<div/>").addClass("col-md-9").append(_input));

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
            var _timing_input = $("<input/>").addClass("form-control  flex-fill").attr("name","timings").attr("type","numeric").attr("step",1).attr("index",index);
            _timing_input.attr("data-bs-toggel","tooltip").attr("data-bs-placement","top").attr("title",timing_label);
            if(index>0){
                _timing_input.addClass("ms-1")
            }
            _timing_input.val(orig_timing);
            _timing_block.append(_timing_input);


            $(_timing_input).on("change",function(event){
                let val = event.target.value;
                if(val==""){
                    $(_timing_input).val(0);
                    val = 0;
                }
                let number_value = parseInt(val);
                if(isNaN(number_value)){
                    alert("invalid timing");
                    $(_timing_input).val(0);
                }
                else{
                    $(_timing_input).val(number_value);
                    this.timings[index] = number_value;
                    this.paramsToSlider();
                }
            }.bind(this))
        }



    }

    create_parameter_gui(container){

        $(container).empty();

        $(container).addClass("d-flex flex-column");

        var name_block = $("<div/>").attr("id","name_block").addClass("d-flex");
        var preset_block = $("<div/>").attr("id","preset_block").addClass("d-flex");
        var start_time_block = $("<div/>").attr("id","start_time_block").addClass("d-flex");
    
        
        var main_props = $("<div/>");
        var first_row = $("<div/>").addClass("row mb-2");

        first_row.append(name_block.addClass("col-md-6"));
        first_row.append(start_time_block.addClass("col-md-6"));
        main_props.append(first_row);
        

        var second_row = $("<div/>").addClass("row mb-2");
        second_row.append(preset_block.addClass("col-md-6"));
        var details_btn = $("<button/>").addClass("btn btn-outline-dark w-100").html("Details");
        details_btn.attr("data-bs-toggle","collapse").attr("data-bs-target",`#${this.patient_details_name}`);
        second_row.append($("<div/>").addClass("col-md-6").append(details_btn));


        main_props.append(second_row);
        
        $(container).append(main_props);

        var number_of_scans_block = $("<div/>").attr("id","number_of_scans_block").addClass("row mb-1");
        var timing_block = $("<div/>").addClass("row mb-1 d-flex");
        var inj_delay_block = $("<div/>").attr("id","inj_delay_block").addClass("row mb-1");


        var number_of_fovs_block = $("<div/>").attr("id","number_of_fovs_block").addClass("row mb-1");
        var fov_duration_block = $("<div/>").attr("id","fov_duration_block").addClass("row mb-1");

        var start_delay_block = $("<div/>").attr("id","start_delay_block").addClass("row mb-1");
        var end_delay_block  = $("<div/>").attr("id","end_delay_block").addClass("row mb-1");

        var details_container = $("<div/>").addClass("collapse").attr("id",this.patient_details_name);
        var details_content = $("<div/>").addClass("card card-body");

        details_content.append(number_of_scans_block);
        details_content.append(timing_block);
        details_content.append(inj_delay_block);
        details_content.append(number_of_fovs_block);
        details_content.append(fov_duration_block);
        details_content.append(start_delay_block);
        details_content.append(end_delay_block);

        details_container.append(details_content);
        $(container).append(details_container);

        this.#show_name_block(name_block);
        this.#show_presets_block(preset_block);
        
        
        simple_dynamic_input_time(
            start_time_block,
            "pet_start",
            "PET start",
            5,
            null,
            null,
            moment(Parapet.work_start,"HH:mm").format("HH:mm"),
            function (val) {
                if(val==""){
                    val = moment(this.pet_start, "HH:mm").format("HH:mm");
                    $(start_time_block).find("input").val(val);
                }

                this.pet_start = moment(val, "HH:mm").format("HH:mm");
                this.paramsToSlider();
            }.bind(this)
        );

        dynamicRangeInput(number_of_scans_block,
            "number_of_scans",
            "Number of scans",
            this.number_of_scans,
            {"min":1,"max":3,"step":1},
            function(val){
                this.number_of_scans = parseInt(val);

                if(this.number_of_scans-1 > this.timings.length){
                    for (let index = this.timings.length; index < this.number_of_scans-1; index++) {
                        this.timings.push(0);
                    }
                }
                else if(this.number_of_scans-1 < this.timings.length)
                {
                    for (let index = this.number_of_scans-1; index <this.timings.length; index++) {
                        this.timings.pop();
                    }
                }
                this.draw_timig_block(timing_block);
                if(this.slider_div){
                    this.create_slider_gui(this.slider_div);
                    // this.paramsToSlider();
                }
                
            }.bind(this))
        
        
        dynamicRangeInput(inj_delay_block,
            "inj_delay",
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
        

        $(container).find("input").on("change",function(){
            this.paramsToSlider();
        }.bind(this))
    }

    paramsToSliderParams(sanitize = true){
        var start = [];
        var pet_start = moment(this.pet_start,"HH:mm");

        var connect = [false];

        for (let index = 0; index < this.number_of_scans; index++) {
            connect.push(true,false);
                        
            var measurement_start = moment(pet_start).subtract(this.start_delay,"minutes");
            var measurement_end = moment(pet_start).add(this.number_of_fovs * this.fov_duration + this.end_delay,"minutes");

            if(index>0){
                var timing_delay = this.timings[index-1];
                measurement_start = measurement_start.add(timing_delay,"minutes");
                measurement_end = measurement_end.add(timing_delay,"minutes");
            }
            
            var start_point = measurement_start.diff(moment(Parapet.work_start,"HH:mm"),"minutes");
            var end_point = measurement_end.diff(moment(Parapet.work_start,"HH:mm"),"minutes");

            if(sanitize & start_point<0){
                end_point +=-start_point;
                start_point = 0;
            }

            start.push(start_point,end_point);
        }

        return {start:start,connect:connect}
    }

    paramsToSlider(){
        var params = this.paramsToSliderParams();
        if(this.slider){
            this.slider.noUiSlider.set(params.start);
        }
    }

    sliderToTimes(){
        if(this.slider){
            const slider_vals = this.slider.noUiSlider.get(true);
            console.log(slider_vals);

        }
        

    }


    create_slider_gui(container){
        $(container).empty();
        var slider_element = $("<div/>").addClass("slider-box-handle slider-styled slider-hide  w-100").attr("id",this.slider_name);
        container.append($("<div/>").append(slider_element).css("height","65pt").addClass("w-100"));
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
                    if(minute%5==0) return 2;
                    return -1;
            }
        }

        var options = this.paramsToSliderParams();


        noUiSlider.create(slider,{
            start: options.start,
            connect: options.connect,
            behaviour: 'drag-all',
            range: {
                'min': 0,
                'max': moment(Parapet.work_end,"HH:mm").diff(moment(Parapet.work_start,"HH:mm"),"minutes")
            },
            step:1,

            pips: {
                mode: 'steps',
                density: 5,
                filter: filterPips,
                format: wNumb({
                    decimals: 0,
                    edit: function(value){
                        //console.log(value);
                        return moment(Parapet.work_start,"HH:mm").add(value,"minutes").format("HH:mm");
                    }})},
            tooltips:false
        });

        $(slider).find(".noUi-connect").css("background",this.color);
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

        slider.noUiSlider.on('start', function () { 
            this.slider_dragged = false;
            this.slider_pre_drag_starts = slider.noUiSlider.get(true);
            console.log(this.slider_pre_drag_starts);
        }.bind(this));

        slider.noUiSlider.on('drag', function () { 
            this.slider_dragged = true;
            console.log("drag");
        }.bind(this));

        slider.noUiSlider.on('end', function () { 
            if(!this.slider_dragged)  
                slider.noUiSlider.set(this.slider_pre_drag_starts);
            else{
                var vals = slider.noUiSlider.get(true);
                var start_min = vals[0]+this.start_delay;
                this.pet_start = moment(Parapet.work_start,"HH:mm").add(start_min,"minutes").format("HH:mm");
                this.update_params_gui();
            }
        }.bind(this));




    }


    create_GUI(container){
        if(this.container){
            this.container.empty();
        }
        this.container = $(container);

        this.params_div = $("<div/>").addClass("ps-3 p-1 col-4");
        this.slider_div = $("<div/>").addClass("px-3 py-1 col-8");
        
        
        container.append(this.params_div);
        container.append(this.slider_div);
        

        
        this.create_parameter_gui(this.params_div);
        this.create_slider_gui(this.slider_div);
        


    }
}