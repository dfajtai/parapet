class Parapet {
    static number_of_patients = 1;
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
                var new_patient = new PETPatient();
                new_patient.add_scan();
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
          },
          true
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
        
        if(PETPatient.presets==null){
            PETPatient.create_presets();
        }

        container.append(config_container);

    }

    static updateWorkHours(){
        $.each(Parapet.patients,function (patient_index, patient) { 
            if(patient instanceof PETPatient){
                if(patient.container)  patient.create_GUI(patient.container);
                // console.log("updated");
            }
        })
    }

    static createUpdatePatientsGUI(container = null){
        if(container!== null) this.patients_container = $(container);

        this.patients_container.addClass("d-flex flex-column");


        for (let index = 0; index < this.patients.length; index++) {
            const patient = this.patients[index];
            var patient_container = $("<div/>").attr("id",`patient_${index+1}`).addClass("d-flex flex-column p-2 m-1 shadow-sm");
            patient_container.css("border","#ced4da 0.5px solid");
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

class PETScan {
    constructor(timing = 0, number_of_fovs =1 , fov_duration = 10,
        start_delay = 2, end_delay = 2){
            this.timing = timing;
            this.number_of_fovs = number_of_fovs;
            this.fov_duration = fov_duration;
            this.start_delay = start_delay;
            this.end_delay = end_delay;

            this.visible = false;
            this.scan_index = null;
            this.patient_index = null;

            this.param_keys = Object.keys(this);

            this.container = null;

            this.scan_start = null;
            this.scan_end = null;
            this.pet_start = null;
    }
    
    copy_params(scan_preset){
        if(scan_preset instanceof PETScan){
            $.each(scan_preset.param_keys,
                function(index,key){
                    this[key] = scan_preset[key];
                }.bind(this));
        }
    }
    
    calculate_scale_params(start, sanitize = true){
        let start_time = moment(start,"HH:mm");
        let scale_start_time = moment(Parapet.work_start,"HH:mm");

        var scale_params = [];

        start_time = moment(start_time).add(this.timing,"minutes");

        var scan_start = moment(start_time).subtract(this.start_delay,"minutes");
        var scan_end = moment(start_time).add(this.number_of_fovs * this.fov_duration + this.end_delay,"minutes");
        
        this.scan_start = moment(scan_start,"HH:mm").format("HH:mm");
        this.scan_end = moment(scan_end,"HH:mm").format("HH:mm");
        this.pet_start = moment(start_time,"HH:mm").format("HH:mm");
        

        var start_point = scan_start.diff(scale_start_time,"minutes");
        var end_point = scan_end.diff(scale_start_time,"minutes");

        if(sanitize & start_point<0){
            end_point +=-start_point;
            start_point = 0;
        }

        scale_params.push(start_point,end_point);
        return scale_params;
    }

    create_param_gui(container){
        this.container = container;

        $(container).addClass("d-flex flex-column");

        $(container).css("border","#ced4da 0.5px solid");
        $(container).append($("<span/>").html(`Scan Nr.${this.scan_index+1}`).addClass("text-white bg-dark p-2 mb-1 w-100"))
        
        var scans_params_container = $("<div/>").addClass("d-flex flex-column w-100 p-3");
        // scans_params_container.attr("id",`patient_${this.index}_scan_${this.scan_index}`);
        $(container).append(scans_params_container);


        var timing_block = $("<div/>").attr("id","timing_block").addClass("row mb-1 d-flex");
        var number_of_fovs_block = $("<div/>").attr("id","number_of_fovs_block").addClass("row mb-1");
        var fov_duration_block = $("<div/>").attr("id","fov_duration_block").addClass("row mb-1");

        var start_delay_block = $("<div/>").attr("id","start_delay_block").addClass("row mb-1");
        var end_delay_block  = $("<div/>").attr("id","end_delay_block").addClass("row mb-1");

        
        $(scans_params_container).append(timing_block);
        $(scans_params_container).append(number_of_fovs_block);
        $(scans_params_container).append(fov_duration_block);
        $(scans_params_container).append(start_delay_block);
        $(scans_params_container).append(end_delay_block);

        this.visible = true;

        dynamicRangeInput(timing_block,
            "timing",
            "Timing [min]",
            this.timing,
            {"min":0,"max":180,"step":1},
            function(val){
                this.timing = parseInt(val);
            }.bind(this))
        
        dynamicRangeInput(number_of_fovs_block,
            "number_of_fovs",
            "Number of FOVs",
            this.number_of_fovs,
            {"min":1,"max":12,"step":1},
            function(val){
                this.number_of_fovs = parseInt(val);
            }.bind(this))

        dynamicRangeInput(fov_duration_block,
            "fov_duration",
            "FOV dur. [min]",
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
            {"min":0,"max":20,"step":1},
            function(val){
                this.end_delay = parseInt(val);
            }.bind(this))   
        
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
}



class PETPatient {
    static presets = null;

    static create_presets(){
        var fdg = new PETPatient(1,null,90);
        fdg.add_scan(new PETScan(null,3,5,5,5));
        var fdg_wb = new PETPatient(1,null,90);
        fdg_wb.add_scan(new PETScan(null,7,5,5,5));

        var dopa = new PETPatient(1,null,90);
        dopa.add_scan(new PETScan(null,3,5,5,5));
        var dopa_wb = new PETPatient(1,null,90);
        dopa_wb.add_scan(new PETScan(null,7,5,5,5));

        var choline = new PETPatient(2,null,10);        
        choline.add_scan(new PETScan(null,3,5,5,5));
        choline.add_scan(new PETScan(60,3,5,5,5));

        var choline_prostate = new PETPatient(2,null,2);
        choline_prostate.add_scan(new PETScan(null,3,5,5,5));
        choline_prostate.add_scan(new PETScan(60,3,5,5,5));

        PETPatient.presets = {
            fgd:fdg,
            fdg_wb:fdg_wb,
            dopa:dopa,
            dopa_wb:dopa_wb,
            choline:choline,
            choline_prostate:choline_prostate
        }

        // console.log(PETPatient.presets);
    }


    constructor (number_of_scans = 1, inj_time = null){
        this.number_of_scans = number_of_scans;

        if(inj_time === null) inj_time = Parapet.default_time;
        this.inj_time = moment(inj_time,"HH:mm").format("HH:mm");
       
        this.scans = [];    
    }


    get first_scan_timing(){
        if(this.scans.length>0){
            const scan = this.scans[0];
            if(scan instanceof PETScan){
                return scan.timing;
            }
        }
    }

    get first_scan_start_delay(){
        if(this.scans.length>0){
            const scan = this.scans[0];
            if(scan instanceof PETScan){
                return scan.start_delay;
            }
        }
    }

    get pet_start(){
        if(this.scans.length>0){
            const scan = this.scans[0];
            if(scan instanceof PETScan){
                scan.calculate_scale_params();
                return moment(scan.pet_start,"HH:mm").format("HH:mm");
            }
        }
    }

    get last_scan_end(){
        if(this.scans.length>0){
            const scan = this.scans[this.number_of_scans-1];
            if(scan instanceof PETScan){
                return moment(scan.scan_end,"HH:mm").format("HH:mm");
            }
        }
        return moment(this.inj_time,"HH:mm").format("HH:mm");
    }


    add_scan(scan=null){
        var best_timing = moment(this.last_scan_end,"HH:mm").diff(moment(this.inj_time,"HH:mm"),"minutes");

        if(scan instanceof PETScan){
            if(scan.timing==null){
                scan.timing =best_timing;
            }
            scan.scan_index =this.scans.length;
            this.scans.push(scan);
             
        }
        else{
            var new_scan = new PETScan(best_timing);
            new_scan.scan_index =this.scans.length;
            this.scans.push(new_scan);
        }
    }


    pushToPatients(){
        this.patient_name = "";

        this.container = null;
        this.index =  Parapet.patients.length;
        this.slider_name = `patient_${this.index}_slider`;

        this.slider = null;

        this.slider_div = null;
        this.params_div = null;

        this.details_div = null;
        this.scan_details_div = null;

        this.visible = true;    

        this.color = Parapet.colors[this.index];

        this.patient_details_name = `patient_${this.index+1}_details`;


        this.slider_dragged = false;
        this.slider_pre_drag_starts = null;

        Parapet.patients.push(this);

        
    }


    initFromPreset(preset_name){
        if(preset_name in PETPatient.presets){
            var preset = PETPatient.presets[preset_name];
            if(preset instanceof PETPatient){
                this.number_of_scans = preset.number_of_scans;
                this.scans = [];

                if(this.scan_details_div){
                    $(this.scan_details_div).empty();
                }

                $.each(preset.scans,function (scan_index,scan_preset) { 
                    var new_scan = new PETScan();
                    new_scan.copy_params(scan_preset);
                    this.add_scan(new_scan);
                    this.#create_scan_detail_block(new_scan);

                }.bind(this));
            }
            this.create_slider_gui(this.slider_div);

            if(this.details_div){
                let nuber_of_scans_div = $(this.details_div).find(`[name="number_of_scans"]`);
                nuber_of_scans_div.val(this.number_of_scans);
            }
            
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
            let inj_time_div = this.params_div.find(`[name="inj_time"]`);
            inj_time_div.val(moment(this.inj_time,"HH:mm").format("HH:mm"));


        }
    }

    #show_presets_block(container,label = "Preset"){
        if(PETPatient.presets==null){
            PETPatient.create_presets();
        }

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

    #create_scan_detail_block(scan){
        if(scan instanceof PETScan){
            if(this.scan_details_div){
                var new_scans_container = $("<div/>").addClass("d-flex w-100 m-1 flex-column");
                $(this.scan_details_div).append(new_scans_container);
            
                scan.create_param_gui(new_scans_container);

                new_scans_container.find("input").on("change",function(){
                    this.paramsToSlider();
                }.bind(this))
            }  
        }
    }

    create_show_hide_scan_details(new_num_of_scans){                 
        if(new_num_of_scans>this.scans.length){
            for (let index = this.scans.length; index < new_num_of_scans; index++) {
                var new_scan = new PETScan();
                this.add_scan(new_scan);
                this.#create_scan_detail_block(new_scan);
            }
        }
        else{
            if(new_num_of_scans<this.number_of_scans){
                for (let index = this.number_of_scans; index > new_num_of_scans; index--) {
                    let scan = this.scans[index-1];
                    if(scan instanceof PETScan){
                        scan.set_visibility(false);
                    }
                    
                }
            }
            else{
                for (let index = this.number_of_scans; index <= new_num_of_scans; index++) {
                    let scan = this.scans[index-1];
                    if(scan instanceof PETScan){
                        scan.set_visibility(true);
                    }
                }
            }
        }
        this.number_of_scans = new_num_of_scans;
    }

    create_parameter_gui(params_container, details_container){
        $(params_container).empty();
        $(details_container).empty();

        $(params_container).addClass("d-flex flex-column");

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
        
        $(params_container).append(main_props);

        var number_of_scans_block = $("<div/>").attr("id","number_of_scans_block").addClass("row mb-1");
        // var inj_delay_block = $("<div/>").attr("id","inj_delay_block").addClass("row mb-1");
      

        $(details_container).addClass("collapse").attr("id",this.patient_details_name);
        var details_content = $("<div/>").addClass("card card-body");

        $(details_container).on("show.bs.collapse",function(){
            details_btn.removeClass("btn-outline-dark").addClass("btn-dark");
        })

        $(details_container).on("hide.bs.collapse",function(){
            details_btn.addClass("btn-outline-dark").removeClass("btn-dark");
        })

        var details_first_row = $("<div/>").addClass("row");
        details_first_row.append($("<div/>").addClass("col-6").append(number_of_scans_block));
        // details_first_row.append($("<div/>").addClass("col-6").append(inj_delay_block));
        details_content.append(details_first_row);

        this.scan_details_div = $("<div/>").addClass("d-flex w-100");
        details_content.append(this.scan_details_div);
        

        $(details_container).append(details_content);

        this.#show_name_block(name_block);
        this.#show_presets_block(preset_block);
        for (let index = 0; index < this.scans.length; index++) {
            const scan = this.scans[index];
            if(scan instanceof PETScan){
                this.#create_scan_detail_block(scan);
            }
            
        }
        
        simple_dynamic_input_time(
            start_time_block,
            "inj_time",
            "Inj. time",
            5,
            null,
            null,
            moment(Parapet.work_start,"HH:mm").format("HH:mm"),
            function (val) {
                if(val==""){
                    val = moment(this.inj_time, "HH:mm").format("HH:mm");
                    $(start_time_block).find("input").val(val);
                }

                this.inj_time = moment(val, "HH:mm").format("HH:mm");
                this.paramsToSlider();
            }.bind(this)
        );

        dynamicRangeInput(number_of_scans_block,
            "number_of_scans",
            "Number of scans",
            this.number_of_scans,
            {"min":1,"max":3,"step":1},
            function(val){
                var new_num_of_scans = parseInt(val);
                this.create_show_hide_scan_details(new_num_of_scans);
                this.create_slider_gui(this.slider_div);
                
            }.bind(this))
        
        
        // dynamicRangeInput(inj_delay_block,
        //     "inj_delay",
        //     "Inj. delay [min]",
        //     this.inj_delay,
        //     {"min":0,"max":90,"step":1},
        //     function(val){
        //         this.inj_delay = parseInt(val);
        //     }.bind(this))   
  
        

        $(params_container).find("input").on("change",function(){
            this.paramsToSlider();
        }.bind(this))

        $(details_first_row).find("input").on("change",function(){
            this.paramsToSlider();
        }.bind(this))
    }

    paramsToSliderParams(sanitize = true){
        var start = [];
        var connect = [false];

        for (let index = 0; index < this.number_of_scans; index++) {
            connect.push(true,false);
                        
            let scan = this.scans[index]
            if(scan instanceof PETScan){
                var scan_params = scan.calculate_scale_params(this.inj_time, sanitize = sanitize);


                start.push.apply(start,scan_params);
            }
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
        var slider_element = $("<div/>").addClass("slider-box-handle slider-styled slider-hide").attr("id",this.slider_name);
        container.append($("<div/>").append(slider_element).css("height","65pt"));
        
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
            // console.log(this.slider_pre_drag_starts);
        }.bind(this));

        slider.noUiSlider.on('drag', function () { 
            this.slider_dragged = true;
            // console.log("drag");
        }.bind(this));

        slider.noUiSlider.on('end', function () { 
            if(!this.slider_dragged)  
                slider.noUiSlider.set(this.slider_pre_drag_starts);
            else{
                var vals = slider.noUiSlider.get(true);
                var start_min = vals[0]+this.first_scan_start_delay;
                var pet_start = moment(Parapet.work_start,"HH:mm").add(start_min,"minutes");
                this.inj_time = pet_start.subtract(this.first_scan_timing).format("HH:mm");
                this.update_params_gui();
            }
        }.bind(this));




    }


    create_GUI(container){
        if(this.container){
            this.container.empty();
        }
        this.container = $(container);

        var fix_row = $("<div/>").addClass("row px-2");
        this.params_div = $("<div/>").addClass("ps-3 p-1 col-4");
        this.slider_div = $("<div/>").addClass("px-3 py-1 col-8");
        this.details_div = $("<div/>").addClass("col-12 w-100");
        
        fix_row.append(this.params_div);
        fix_row.append(this.slider_div);
        container.append(fix_row);
        container.append(this.details_div);

        
        this.create_parameter_gui(this.params_div,this.details_div);
        this.create_slider_gui(this.slider_div);
        


    }
}