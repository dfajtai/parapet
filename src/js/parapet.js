class Parapet {

    static initialized = false;
    static number_of_patients = 1;
    static work_start = moment("07:00","HH:mm").format("HH:mm");
    static work_end = moment("17:00","HH:mm").format("HH:mm");
    static default_time = this.work_start;

    static main_container = null;
    
    static parapet_menu_container = null;
    static parapet_config_container = null;
    static parapet_schedule_container = null;
    static schedule_plot = null;

    static patients_container = null;
    static patients = [];
    static colors = generateDistinctColors(10);

    static indicator_container = null;

    static _autosave = false;

    static encrypt = true;

    static get autosave(){
        return Parapet._autosave;
    }
    static set autosave(value){
        Parapet._autosave = value;
        $(document).find("#autosave_switch").prop("checked",value);
    }



    static set_params({number_of_patients, work_start, work_end}){
        this.number_of_patients = number_of_patients;
        this.work_start = work_start;
        this.work_end = work_end;
        this.default_time = this.work_start;

        Parapet.updateParapetConfigGUI()
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
        Parapet.update_schedule_plot();

        if(Parapet.autosave) Parapet.toLocalStorage();
    }

    static updateParapetConfigGUI(){
        var param_keys = Object.keys(Parapet);
        param_keys.forEach(key => {
            $(Parapet.parapet_config_container).find(`input[param="${key}"]`).val(Parapet[key]);
        });
    }


    static #create_menu(){
        if(!Parapet.parapet_menu_container) return;
        var container = Parapet.parapet_menu_container;

        $(container).empty();

        var modal_container = $("<div/>");
        $(container).append(modal_container);

        var menu_content = $("<ul/>").addClass("nav nav-pills d-flex flex-column h-100 mb-auto text-center py-2 px-1 justify-content-start");

        var reset_block = $("<li/>").addClass("nav-item");
        var save_block = $("<li/>").addClass("nav-item");
        var export_block = $("<li/>").addClass("nav-item");
        var import_block = $("<li/>").addClass("nav-item");
        var print_block = $("<li/>").addClass("nav-item");

        menu_content.append(reset_block);
        menu_content.append(save_block);
        menu_content.append(export_block);
        menu_content.append(import_block);
        menu_content.append(print_block);


        var reset_btn = $("<a/>").addClass("nav-link link-dark py-3 my-1");
        reset_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        reset_btn.attr("title","Reset");
        reset_btn.append($("<i/>").addClass("fa fa-trash-arrow-up fa-solid"));
        reset_block.append(reset_btn);

        var save_btn = $("<a/>").addClass("nav-link link-dark py-3 my-1");
        save_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        save_btn.attr("title","Save");
        save_btn.append($("<i/>").addClass("fa fa-floppy-disk fa-solid"));
        save_block.append(save_btn);

        var export_btn = $("<a/>").addClass("nav-link link-dark py-3 my-1");
        export_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        export_btn.attr("title","Export");
        export_btn.append($("<i/>").addClass("fa fa-file-export fa-solid"));
        export_block.append(export_btn);

        
        var import_btn = $("<a/>").addClass("nav-link link-dark py-3 my-1");
        import_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        import_btn.attr("title","Import");
        import_btn.append($("<i/>").addClass("fa fa-file-import fa-solid"));
        import_block.append(import_btn);

        var print_btn = $("<a/>").addClass("nav-link link-dark py-3 my-1");
        print_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        print_btn.attr("title","Print");
        print_btn.append($("<i/>").addClass("fa fa-print fa-solid"));
        print_block.append(print_btn);

        $(container).append(menu_content);

        reset_btn.on("click",function(){
            create_modal_confirm(modal_container,"reset_modal","Reset confrimation","Do you really want to reset the content?",Parapet.reset);
            $(modal_container).find("#reset_modal").modal('show');
        })


        save_btn.on("click",function(){
            Parapet.toLocalStorage();
        })

        export_btn.on("click",function(){
            var export_content = $("<div/>").addClass("p-2 m-2");
            var textarea = $("<textarea/>").addClass("form-control").attr("readonly",true).attr("rows",10);
            $(textarea).val(Parapet.encrypt_json(Parapet.serializeParapetContent()));
            export_content.append(textarea);
            

            create_modal_window(modal_container,"export_modal","Export",export_content,"lg");
            $(modal_container).find("#export_modal").modal('show');
        })

        import_btn.on("click",function(){
            var import_content = $("<div/>").addClass("p-2 m-2");
            var textarea = $("<textarea/>").addClass("form-control").attr("rows",10);
            import_content.append(textarea);
            import_content.append($("<p/>").addClass("m-2").html("Do you really want to import the inserted content?"));

            create_modal_confirm(modal_container,"import_modal","Import",import_content,function(){
                try {
                    var text = $(textarea).val();
                    var new_content = JSON.parse(Parapet.decrypt_json(text) || "null");
                    if(new_content!=null){
                        Parapet.initParapetFormSerializedContent(new_content);
                    }
                } catch (error) {
                    alert(error);
                }
            });
            $(modal_container).find("#import_modal").modal('show');
        })

        print_btn.on("click",function(){
            var print_content = $("<div/>").addClass("p-2 m-2");
            var textarea = $("<textarea/>").addClass("form-control").attr("readonly",true).attr("rows",10);
            $(textarea).val(Parapet.encrypt_json(Parapet.serializeParapetContent()));
            print_content.append(textarea);
            

            create_modal_window(modal_container,"print_modal","Print",print_content,"fullscreen");
            $(modal_container).find("#print_modal").modal('show');
        })

    }

    static initialize(container){
        container.empty();

        Parapet.#create_menu();
    
        var config_container = $("<div/>").attr("id","parapet_config").addClass("row parapet-card");
        this.parapet_config_container = config_container;
        container.append(config_container);

        var schedule_container = $("<div/>").attr("id","parapet_schedule").addClass("row d-none");
        this.parapet_schedule_container = schedule_container;
        container.append(schedule_container);
        
        
        var number_of_patients_block = $("<div/>").addClass("col-md-4 d-flex ");
        
        dynamicRangeInput(
          number_of_patients_block,
          "number_of_patients",
          "Num. of patients",
          Parapet.number_of_patients,
          { min: 1, max: 10, step: 1 },
          function (val) {
            if(Parapet.initialized) Parapet.updatePatientCount(parseInt(val));
          },
          true
        );
        number_of_patients_block.find("input").attr("param","number_of_patients");

        config_container.append(number_of_patients_block);


        var work_start_block = $("<div/>").addClass("col-md-3 d-flex");
        
        simple_dynamic_input_time(
          work_start_block,
          "work_start",
          "Work start",
          30,
          "06:00",
          "18:00",
          moment(Parapet.work_start, "HH:mm").format("HH:mm"),
          function (val) {
            if(Parapet.initialized){
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

          }
        );
        work_start_block.find("input").attr("param","work_start");

        config_container.append(work_start_block);

        var work_end_block = $("<div/>").addClass("col-md-3 d-flex");
        simple_dynamic_input_time(
          work_end_block,
          "work_end",
          "Work end",
          30,
          "06:00",
          "18:00",
          moment(Parapet.work_end, "HH:mm").format("HH:mm"),
          function (val) {
            if(Parapet.initialized){
            if(val=="") val = Parapet.work_end;
            if(moment(val,"HH:mm").diff(moment(Parapet.work_start,"HH:mm"),"minutes")<=0){
                alert("Work end can not be smaller than work start");
                work_end_block.find("input").val(moment(Parapet.work_end,"HH:mm").format("HH:mm"));
            }
            else{
                Parapet.work_end = moment(val, "HH:mm").format("HH:mm");
                Parapet.updateWorkHours();
            }}
          }
        );
        work_end_block.find("input").attr("param","work_end");

        config_container.append(work_end_block);

        var autosave_block = $("<div/>").attr("id","autosave_block").addClass("col-md-2 d-flex justify-content-end");
        var autosave_div = $("<div/>").addClass("form-check form-switch pt-2");
        var autosave_switch = $("<input/>").addClass("form-check-input").attr("type","checkbox").attr("id","autosave_switch");
        autosave_div.append(autosave_switch);
        autosave_div.append($("<label/>").addClass("form-check-label").attr("for","autosave_switch").html("Auto-save"));
        autosave_switch.on("change",function(){
            Parapet.autosave = autosave_switch.prop("checked");
        })

        var save_indicator = $("<div/>").addClass("pt-2 me-4");
        save_indicator.append($("<span/>").attr("id","save-indicator").html("Saving content...").css("color","lightgreen").addClass("d-none"));
        autosave_block.append(save_indicator);
        autosave_block.append(autosave_div);


        config_container.append(autosave_block)


        
        if(PETPatient.presets==null){
            PETPatient.create_presets();
        }

        Parapet.init_schedule_plot();

        Parapet.fromLocalStorage();
        Parapet.autosave = true;

        Parapet.initialized= true;
        
        number_of_patients_block.find('[name]').trigger('change');
        
    }

    static encrypt_json(json_text){
        if(!json_text) return json_text;
        if(Parapet.encrypt){
            const fixedKey = '$2a$10$eFDU7VkWCGD9Y0sInpcKDO';
            return CryptoJS.AES.encrypt(json_text, fixedKey).toString(); 
        }
        else{
            return json_text
        }



    }

    static decrypt_json(encrypted_json_text){
        if(!encrypted_json_text) return encrypted_json_text;
        if(Parapet.encrypt){
            const fixedKey = '$2a$10$eFDU7VkWCGD9Y0sInpcKDO';
            const bytes = CryptoJS.AES.decrypt(encrypted_json_text, fixedKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        }
        else{
            return encrypted_json_text
        }

    }

    static serializeParapetContent(){
        var serialized_object = {number_of_patients: this.number_of_patients,
                                work_start: this.work_start,
                                work_end : this.work_end};
        var serialized_parients = []
        for (let index = 0; index < this.patients.length; index++) {
            const patient = this.patients[index];
            if(patient instanceof PETPatient){
            serialized_parients.push(patient.serializePatient())
            }
            
        }
        serialized_object["patients"] = serialized_parients;
        
        return JSON.stringify(serialized_object);
    }

    static initParapetFormSerializedContent(serialized_content){
        Parapet.patients = [];
        Parapet.number_of_patients = 0;
        $(Parapet.patients_container).empty();

        if(isObject(serialized_content)){
            Parapet.set_params(serialized_content);
            var patients_params = serialized_content.patients;
            var number_of_patients = serialized_content.number_of_patients;
            
            if(isArray(patients_params) && number_of_patients){
                for (let index = 0; index < patients_params.length; index++) {
                    const patient_params = patients_params[index];
                    var patient = PETPatient.from_params(patient_params);
                    patient.pushToPatients();
                    patient.set_visibility(patient_params.visible)

                    
                }
            }
        }
        Parapet.createUpdatePatientsGUI();
        Parapet.update_schedule_plot();
    }

    static reset(){
        Parapet.patients = [];
        Parapet.number_of_patients = 0;
        $(Parapet.patients_container).empty();
        Parapet.set_params({number_of_patients:1,work_start:moment("07:00","HH:mm").format("HH:mm"),work_end:moment("17:00","HH:mm").format("HH:mm")});
        Parapet.updatePatientCount(Parapet.number_of_patients);
        Parapet.init_schedule_plot();
        Parapet.update_schedule_plot();
    }
    
    static toLocalStorage(){
        if(Parapet.parapet_config_container){
            $(Parapet.parapet_config_container.find("#save-indicator").removeClass("d-none"))
            setTimeout(function(){
                localStorage.setItem("parapet_content",Parapet.encrypt_json(Parapet.serializeParapetContent()));
                $(Parapet.parapet_config_container.find("#save-indicator").addClass("d-none"))
            },100)
            
        }
        else{
            localStorage.setItem("parapet_content",Parapet.encrypt_json(Parapet.serializeParapetContent()));
        }
    }

    static fromLocalStorage(){
        var stored_content = JSON.parse(Parapet.decrypt_json(localStorage.getItem("parapet_content")) || "null");
        if(stored_content!=null){
            Parapet.initParapetFormSerializedContent(stored_content);
        }

    }

    static updateWorkHours(){
        $.each(Parapet.patients,function (patient_index, patient) { 
            if(patient instanceof PETPatient){
                patient.sanitize();
                if(patient.container)  patient.create_GUI(patient.container);
                // console.log("updated");
            }
        })
        Parapet.init_schedule_plot();
        Parapet.update_schedule_plot();
    }

    static createUpdatePatientsGUI(container = null){
        if(container!== null) this.patients_container = $(container);

        this.patients_container.addClass("d-flex flex-column").css({"overflow":"auto","max-height":632});


        for (let index = 0; index < this.patients.length; index++) {
            const patient = this.patients[index];
            var patient_container = $("<div/>").attr("id",`patient_${index+1}`).addClass("d-flex flex-column parapet-card");

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

    static init_schedule_plot(container = null){
        if(! container){
            container = Parapet.parapet_schedule_container;
        }
        $(container).empty();
        Parapet.parapet_schedule_container = container;
        $(container).removeClass("d-none");
        $(container).addClass("parapet-card")
        $(container).css("height","125px");


        const config = {
            type: "line", // Use line chart
            data: {
              datasets: [],
            },
            options: {
              animations:{colors:false},
              scales: {
                x: {
                  type: "time",
                  position: "bottom",
                  time: {
                    minUnit: "hour",
                    displayFormats: {
                      hour: "HH:mm",
                    },
                  },
                  suggestedMin:moment(Parapet.work_start,"HH:mm"),
                  suggestedMax:moment(Parapet.work_end,"HH:mm"),
                },
                y: {
                  display: false, // Hide the y-axis
                },
              },
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      display: false,
                  }
              },
              
              layout: {
                  padding: {
                      left: 20, right:20, top:5, bottom:30
                  }
              }
              
            },
          };

        var chart_div = $("<canvas/>").attr("id","schedule_chart");
        $(container).append($("<div/>").append(chart_div).css("height","100pt").addClass("m-2"));
        
        var chart_element = document.getElementById("schedule_chart").getContext('2d');
        Parapet.schedule_plot = new Chart(chart_element, config);

    }
    static update_schedule_plot(alpha = 0.6){
        // reformat data
        var dataset = [];

        var baseline = 0;
        var jitter_step = 0.1;
        

        for (let patient_index = 0; patient_index < Parapet.number_of_patients; patient_index++) {
            const patient = Parapet.patients[patient_index];
            if(patient instanceof PETPatient){
                
                for (let scan_index = 0; scan_index < patient.number_of_scans; scan_index++) {
                    const scan = patient.scans[scan_index];
                    if(scan instanceof PETScan){
                        var data = [{ x: scan.scan_start, y:baseline}, { x: scan.scan_end, y:baseline}];

                        var _dataset = {
                            label:`Patient Nr.${patient_index+1}, Scan ${scan_index+1}`,
                            backgroundColor: patient.color.alpha(alpha),
                            borderColor:patient.color.alpha(alpha/2),
                            pointBackgroundColor:patient.color.alpha(alpha),
                            
                            pointBorderColor: patient.color.alpha(1),
                            pointHoverBackgroundColor:  patient.color.alpha(1), 
                            pointHoverBorderColor: patient.color.alpha(1),
                            pointHoverRadius: 5,
                            pointBorderWidth:1,
                            borderWidth: 4,
                            pointRadius:5,
                            data: data,
                            start: scan.scan_start,
                            end: scan.scan_end
                        }
                        dataset.push(_dataset);
                    }
                }
            }
        }

        // sort dataset
        dataset.sort((a, b) => a.start - b.start);
        // console.log(dataset);

        // jitter overlapping data

    
        function assignOverlapLevels(intervals) {
            // Sort intervals by start time
            intervals.sort((a, b) => a.start - b.start);
        
            // Initialize an array to store the level of each interval
            const levels = Array(intervals.length).fill(0);
        
            // Iterate through each interval and compare with others
            for (let i = 0; i < intervals.length; i++) {
                for (let j = i + 1; j < intervals.length; j++) {
                    // Check for overlap
                    if (intervals[i].end > intervals[j].start && intervals[i].start < intervals[j].end) {
                        // If there's an overlap, increase the level of the current interval
                        levels[j]++;
                    }
                }
            }

            return levels;
        }

        var levels = assignOverlapLevels(dataset);
        // console.log(levels);

        var sign = 1;
        var max_level = 0;

        for (let index = 0; index < levels.length; index++) {
            const level = levels[index];
            if(level>0){
                max_level+=1;

                var displacement = Math.ceil(max_level/2)*jitter_step;
                
    
                dataset[index].data[0].y+=displacement*sign;
                dataset[index].data[1].y+=displacement*sign;

                sign = sign*-1;
            }
            else{
                max_level = 0;
                sign = 1;
            }
            // console.log(dataset[index].data[0].y);
        }


        // draw plot

        if(!Parapet.schedule_plot){
            Parapet.init_schedule_plot();
        }

        // remove old data
        Parapet.schedule_plot.data.labels.pop();
        Parapet.schedule_plot.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });
        
        // add new data
        Parapet.schedule_plot.data.datasets = dataset;

        Parapet.schedule_plot.update();

    }

}

class PETScan {
    constructor(timing = null, number_of_fovs =1 , fov_duration = 10,
        start_delay = 0, end_delay = 0){
            this.timing = timing;
            this.number_of_fovs = number_of_fovs;
            this.fov_duration = fov_duration;
            this.start_delay = start_delay;
            this.end_delay = end_delay;

            this.visible = false;
            this.scan_index = null;
            
            this.param_keys = Object.keys(this);

            this.container = null;

            this.patient = null;
    }
    
    static from_params({timing,number_of_fovs,fov_duration,start_delay,end_delay, visible}){
        var scan =  new PETScan(timing=timing,number_of_fovs=number_of_fovs,fov_duration=fov_duration,start_delay=start_delay,end_delay=end_delay);
        scan.set_visibility(visible);
        return scan;
    }

    copy_params(scan_preset){
        if(scan_preset instanceof PETScan){
            $.each(scan_preset.param_keys,
                function(index,key){
                    this[key] = scan_preset[key];
                }.bind(this));
        }
    }
    
    bound_patient(patient){
        if(patient instanceof PETPatient){
            this.patient = patient;
        }
    }

    serialize_scan(){
        var serialized_object = {}
        $.each(this.param_keys,
            function(index,key){
                serialized_object[key] = this[key];
            }.bind(this));
        
        return serialized_object;

    }

    get scan_start(){
        var time =  moment(this.pet_start,"HH:mm").subtract(this.start_delay,"minutes");
        return moment(time.format("HH:mm"),"HH:mm");
    }

    get scan_end(){
        var time =  moment(this.pet_start,"HH:mm").add(this.number_of_fovs * this.fov_duration + this.end_delay,"minutes");
        return moment(time.format("HH:mm"),"HH:mm");
    }

    get pet_start(){
        var time =  moment(this.inj_time,"HH:mm").add(this.timing,"minutes");
        return moment(time.format("HH:mm"),"HH:mm");
    }

    get pet_end(){
        var time =  moment(this.pet_start,"HH:mm").add(this.number_of_fovs * this.fov_duration,"minutes");
        return moment(time.format("HH:mm"),"HH:mm");
    }

    get inj_time(){
        if(this.patient instanceof PETPatient){
            var time =  moment(this.patient.inj_time,"HH:mm");
            return moment(time.format("HH:mm"),"HH:mm");
        }
        
    }

    calculate_scale_params(sanitize = true){
        var scale_params = [];

        let scale_start_time = moment(Parapet.work_start,"HH:mm");        
              
        var start_point = this.scan_start.diff(scale_start_time,"minutes");
        var end_point = this.scan_end.diff(scale_start_time,"minutes");

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
        var fdg = new PETPatient(1);
        fdg.add_scan(new PETScan(90,3,5,5,5));
        var fdg_wb = new PETPatient(1);
        fdg_wb.add_scan(new PETScan(90,7,5,5,5));

        var dopa = new PETPatient(1);
        dopa.add_scan(new PETScan(60,3,5,5,5));
        var dopa_wb = new PETPatient(1);
        dopa_wb.add_scan(new PETScan(60,7,5,5,5));

        var choline = new PETPatient(2);        
        choline.add_scan(new PETScan(10,3,5,5,5));
        choline.add_scan(new PETScan(60,3,5,5,5));
        var choline_prostate = new PETPatient(2);
        choline_prostate.add_scan(new PETScan(2,3,5,5,5));
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


    constructor (number_of_scans = 1, inj_time = null,patient_name = "", visible = false ){
        this._number_of_scans = number_of_scans;

        if(inj_time === null) inj_time = Parapet.work_start;
        this._inj_time = moment(inj_time,"HH:mm").format("HH:mm");
        this.patient_name = patient_name;
        this.scans = [];
        this.visible = visible;

    }

    get number_of_scans(){
        return this._number_of_scans;
    }

    set number_of_scans(value){
        if(value>=0){
            this._number_of_scans = value
            Parapet.update_schedule_plot();
            if(Parapet.autosave) Parapet.toLocalStorage();
        }

    }

    get inj_time(){
        return moment(this._inj_time,"HH:mm").format("HH:mm");
    }

    set inj_time(value){
        if(value){
            this._inj_time = moment(value,"HH:mm");
            if(this.container){
                Parapet.update_schedule_plot();
                if(Parapet.autosave) Parapet.toLocalStorage();
            }
        }
    }

    static from_params({number_of_scans,inj_time,patient_name,scans, visible}){
        var patient =  new PETPatient(number_of_scans=number_of_scans,inj_time=inj_time,patient_name = patient_name, visible = visible);
        if(isArray(scans)){
            for (let index = 0; index < scans.length; index++) {
                const scan_params = scans[index];
                var scan = PETScan.from_params(scan_params);
                patient.add_scan(scan);
                if(index<number_of_scans){
                    scan.set_visibility(true);
                }
                
            }
        }
        return patient
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
            const scan = this.scans[this.scans.length-1];
            if(scan instanceof PETScan){
                if(scan.scan_end==null) scan.calculate_scale_params();
                return moment(scan.scan_end,"HH:mm").format("HH:mm");
            }
        }
        return moment(this.inj_time,"HH:mm").format("HH:mm");
    }


    sanitize(){
        if(moment(this.inj_time,"HH:mm")<moment(Parapet.work_start,"HH:mm") || moment(this.inj_time,"HH:mm")>moment(Parapet.work_end,"HH:mm"))
        this.inj_time = moment(Parapet.work_start,"HH:mm");
    }

    add_scan(scan=null){
        var best_timing = moment(this.last_scan_end,"HH:mm").diff(moment(this.inj_time,"HH:mm"),"minutes");

        if(scan instanceof PETScan){
            best_timing +=scan.start_delay;
            if(scan.timing==null){
                scan.timing =best_timing;
            }
            scan.scan_index =this.scans.length;
            scan.bound_patient(this);
            this.scans.push(scan);
             
        }
        else{
            var new_scan = new PETScan(best_timing);
            new_scan.scan_index =this.scans.length;
            new_scan.bound_patient(this);
            this.scans.push(new_scan);
        }
    }


    pushToPatients(){
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

        this.initialized = false;

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
            Parapet.update_schedule_plot();
            if(this.details_div){
                let nuber_of_scans_div = $(this.details_div).find(`[name="number_of_scans"]`);
                nuber_of_scans_div.val(this.number_of_scans).trigger("change");
            }
            
        }
    }

    serializePatient(){
        var serialized_object = {patient_name : this.patient_name,
                                 number_of_scans : this.number_of_scans,
                                 inj_time: this.inj_time, visible: this.visible
        }
        var serialized_scans = []
        for (let index = 0; index < this.scans.length; index++) {
            const scan = this.scans[index];
            if(scan instanceof PETScan){
                serialized_scans.push(scan.serialize_scan())
            }
            
        }
        serialized_object["scans"] =serialized_scans;
        
        return serialized_object;
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
                if(this.initialized){
                    this.initFromPreset(val);
                    this.update_params_gui();
                }
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
                var new_scans_container = $("<div/>").addClass("d-flex w-100 p-1 flex-column");
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
        var details_btn = $("<button/>").addClass("btn btn-outline-dark btn-filled w-100").html("Details");
        details_btn.attr("data-bs-toggle","collapse").attr("data-bs-target",`#${this.patient_details_name}`);

        second_row.append($("<div/>").addClass("col-md-6").append(details_btn));


        main_props.append(second_row);
        
        $(params_container).append(main_props);

        var number_of_scans_block = $("<div/>").attr("id","number_of_scans_block").addClass("row mb-1");
        // var inj_delay_block = $("<div/>").attr("id","inj_delay_block").addClass("row mb-1");
      

        $(details_container).addClass("collapse").attr("id",this.patient_details_name);
        var details_content = $("<div/>").addClass("card card-body");

        $(details_container).on("show.bs.collapse",function(){
            details_btn.removeClass("btn-outline-dark btn-filled").addClass("btn-dark");
        })

        $(details_container).on("hide.bs.collapse",function(){
            details_btn.addClass("btn-outline-dark btn-filled").removeClass("btn-dark");
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
            moment(this.inj_time,"HH:mm").format("HH:mm"),
            function (val) {
                if(this.initialized){
                    if(val==""){
                        val = moment(this.inj_time, "HH:mm").format("HH:mm");
                        $(start_time_block).find("input").val(val);
                    }
    
                    this.inj_time = moment(val, "HH:mm").format("HH:mm");
                    this.paramsToSlider();
                }
                
            }.bind(this)
        );

        dynamicRangeInput(number_of_scans_block,
            "number_of_scans",
            "Number of scans",
            this.number_of_scans,
            {"min":1,"max":3,"step":1},
            function(val){
                if(this.initialized){
                    var new_num_of_scans = parseInt(val);
                    this.create_show_hide_scan_details(new_num_of_scans);
                    this.create_slider_gui(this.slider_div);
                }
                
            }.bind(this))
        
                

        $(params_container).find("input").on("change",function(){
            if(this.initialized) this.paramsToSlider();
        }.bind(this))

        $(details_first_row).find("input").on("change",function(){
            if(this.initialized) this.paramsToSlider();

        }.bind(this))

    }

    paramsToSliderParams(sanitize = true){
        var start = [];
        var connect = [false];

        for (let index = 0; index < this.number_of_scans; index++) {
            connect.push(true,false);
                        
            let scan = this.scans[index]
            if(scan instanceof PETScan){
                var scan_params = scan.calculate_scale_params(sanitize = sanitize);


                start.push.apply(start,scan_params);
            }
        }

        return {start:start,connect:connect}
    }

    paramsToSlider(){
        var params = this.paramsToSliderParams();
        if(this.slider){
            this.slider.noUiSlider.set(params.start);
            Parapet.update_schedule_plot();
            if(Parapet.autosave) Parapet.toLocalStorage();
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
                this.inj_time = pet_start.subtract(this.first_scan_timing,"minutes").format("HH:mm");
                this.update_params_gui();
            }
        }.bind(this));




    }


    create_GUI(container){
        this.initialized = false;

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
        
        this.initialized = true;

    }
}