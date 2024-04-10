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
    static parapet_dosage_container = null;
    
    static t0_time = null;
    static t0_dose = null;

    static dosage_plot = null;

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

    static set dosage_visibility(value){
        if(Parapet.initialized){
            if(! Parapet.dosage_plot){
                Parapet.init_dosage_plot();
            }
            if(value) $(Parapet.parapet_dosage_container).removeClass("d-none");
            else $(Parapet.parapet_dosage_container).addClass("d-none");
        }
    }

    static get dosage_visibility(){
        if(Parapet.initialized && Parapet.dosage_plot){
            return ! $(Parapet.parapet_dosage_container).hasClass("d-none");
        }
        return false;
    
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

        Parapet.number_of_patients = new_count;

        for (let index = 0; index < new_count; index++) {
            Parapet.patients[index].set_visibility(true);
            Parapet.patients[index].update_params_gui();
        }

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

    static get_selected_indices(){
        var selected_indices = [];
        for (let index = 0; index < Parapet.number_of_patients; index++) {
            const patient = Parapet.patients[index];
            if(patient instanceof PETPatient){
                if(patient.visible && patient.selected){
                    selected_indices.push(patient.index);
                }
            }
            
        }
        return selected_indices;
    }


    static #create_menu(){
        if(!Parapet.parapet_menu_container) return;
        var container = Parapet.parapet_menu_container;

        $(container).empty();

        var modal_container = $("<div/>");
        $(container).append(modal_container);

        var menu_content = $("<ul/>").addClass("nav nav-pills d-flex flex-column h-100 mb-auto text-center py-2 px-2 justify-content-start");



        var reset_block = $("<li/>").addClass("nav-item parapet-menu");
        var save_block = $("<li/>").addClass("nav-item parapet-menu");
        var export_block = $("<li/>").addClass("nav-item parapet-menu");
        var import_block = $("<li/>").addClass("nav-item parapet-menu");
        var print_block = $("<li/>").addClass("nav-item parapet-menu");
        var dose_block = $("<li/>").addClass("nav-item parapet-menu");
        var swap_block = $("<li/>").addClass("nav-item parapet-menu mt-5");

        
        menu_content.append(reset_block);
        menu_content.append(save_block);
        menu_content.append(export_block);
        menu_content.append(import_block);
        menu_content.append(print_block);
        menu_content.append(dose_block);
        menu_content.append(swap_block);
        

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


        var dose_btn = $("<a/>").addClass("nav-link link-dark py-3 my-1");
        dose_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        dose_btn.attr("title","Dose planning");
        dose_btn.append($("<i/>").addClass("fa fa-circle-radiation fa-solid"));
        dose_block.append(dose_btn);

        var swap_btn = $("<a/>").addClass("nav-link link-dark py-3 my-1 d-none");
        swap_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        swap_btn.attr("title","Swap").attr("id","swap_btn");
        swap_btn.append($("<i/>").addClass("fa fa-shuffle"));
        swap_block.append(swap_btn);

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
            var import_content = $("<div/>");
            var textarea = $("<textarea/>").addClass("form-control").attr("rows",10);
            import_content.append($("<div/>").addClass("p-2 m-2").append(textarea));
            import_content.append($("<div/>").addClass("m-2").append($("<p/>").html("Do you really want to import the inserted content?")));

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
            },"lg");
            $(modal_container).find("#import_modal").modal('show');
        })

        print_btn.on("click",function(){
            var print_content = $("<div/>").addClass("d-flex  flex-column");
            var schedule_container = $("<div/>").css({"overflow":"auto","max-height":300});
            print_content.append(schedule_container);
            var btn_save_schedule = $("<button/>").addClass("btn btn-outline-dark w-100").html("Save schedule to pdf ...");
            print_content.append($("<div/>").addClass("my-2 w-100").append(btn_save_schedule));
            Parapet.create_schedule_table(schedule_container);

            btn_save_schedule.on("click",function(){
                const doc = new jspdf.jsPDF('p', 'mm', [297, 210]);

                doc.autoTable({
                    html: "#schedule_table",
                    theme:"grid",
                    styles: { cellPadding: 0, fontSize: 10, overflow: 'linebreak', minCellHeight : 8, valign:"middle", halign:"center",},
                    pageBreak: 'auto',
                    rowPageBreak: 'avoid',
                    headStyles:{valign: 'middle',  halign : 'center',  padding:2, minCellHeight:10},
                    
                })
                doc.save("schedule.pdf");
            })

            var timing_container = $("<div/>").css({"overflow":"auto","max-height":300});
            print_content.append(timing_container);
            var btn_save_timing = $("<button/>").addClass("btn btn-outline-dark w-100").html("Save timing to pdf ...");
            print_content.append($("<div/>").addClass("my-2 w-100").append(btn_save_timing));
            Parapet.create_timing_table(timing_container);

            btn_save_timing.on("click",function(){
                const doc = new jspdf.jsPDF('l', 'mm', [297, 210]);

                doc.autoTable({
                    html: "#timing_table",
                    theme:"grid",
                    styles: { cellPadding: 0, fontSize: 10, overflow: 'linebreak', minCellHeight : 8, valign:"middle", halign:"center",},
                    pageBreak: 'auto',
                    rowPageBreak: 'avoid',
                    headStyles:{valign: 'middle', fontSize: 8, halign : 'center', padding:2, minCellHeight:10},
                    
                })
                doc.save("timing.pdf");
            })
            

            create_modal_window(modal_container,"print_modal","Print",print_content,"fullscreen");
            $(modal_container).find("#print_modal").modal('show');
        })


        dose_btn.on("click",function(){
            Parapet.dosage_visibility = !Parapet.dosage_visibility;
        })

        swap_btn.on("click",function(){
            var indices = Parapet.get_selected_indices();
            if(indices.length==2) Parapet.swap_patients(indices[0],indices[1]);
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

        var dosage_container = $("<div/>").attr("id","parapet_dosage").addClass("row d-none");
        this.parapet_dosage_container = dosage_container;
        container.append(dosage_container);
        
        
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
                    patient.set_visibility(patient_params.visible);
                    patient.update_params_gui();

                    
                }
            }
        }
        Parapet.createUpdatePatientsGUI();
        Parapet.update_schedule_plot();
    }

    static create_timing_table(container){
        $(container).empty();
        var timing = [];
        
        for (let index = 0; index < Parapet.number_of_patients; index++) {
            const patient = Parapet.patients[index];
            if(patient instanceof PETPatient){
                var patient_timing = {};
                patient_timing["Patient Index"] = index+1;
                patient_timing["Patient Name"] = patient.patient_name;
                patient_timing["Injection Time"] = patient.inj_time;
                for (let scan_index = 0; scan_index < 3; scan_index++) {
                    const scan = patient.scans[scan_index];
                    if(scan instanceof PETScan){
                        if(scan.visible){
                            patient_timing[`Scan Nr.${scan_index+1} timing`] = scan.timing;
                            patient_timing[`Scan Nr.${scan_index+1} start`] = moment(scan.scan_start,"HH:mm").format("HH:mm");
                            patient_timing[`Scan Nr.${scan_index+1} pet start`] = moment(scan.pet_start,"HH:mm").format("HH:mm");
                            patient_timing[`Scan Nr.${scan_index+1} end`] = moment(scan.scan_end,"HH:mm").format("HH:mm");
                            continue;
                        }
                    }
                    patient_timing[`Scan Nr.${scan_index+1} timing`] = null;
                    patient_timing[`Scan Nr.${scan_index+1} start`] = null;
                    patient_timing[`Scan Nr.${scan_index+1} pet start`] =null;
                    patient_timing[`Scan Nr.${scan_index+1} end`] = null;
                }
                timing.push(patient_timing);
            }
            
        }


        if(timing.length>0){
            var keys = Object.keys(timing[0]);

            // filter out null columns
            timing = dropNullCols(timing,keys);
            keys = Object.keys(timing[0]);

            var table = $("<table/>").addClass("w-100 table table-bordered align-middle").attr("id","timing_table");
            var header_row = $("<tr/>");
            $.each(keys,function(_,key){
                header_row.append($("<th/>").html(key).attr("scope","col").addClass("text-center"));
            })
            table.append($("<thead/>").addClass("table-light").append(header_row));

            var table_body = $("<tbody/>");

            $.each(timing,function(row_index,row){
                var row_dom = $("<tr/>");
                $.each(keys,function(key_index,key){
                    row_dom.append($("<td/>").html(row[key] == null ? "-":row[key]).addClass("border"));
                })
                table_body.append(row_dom);
        
            })
        
            table.append(table_body);

            $(container).append($("<div/>").addClass("table-responsive text-nowrap").append(table));

        }
        

    }

    static create_schedule_table(container){
        $(container).empty();
        var events = [];

        for (let index = 0; index < Parapet.number_of_patients; index++) {
            const patient = Parapet.patients[index];
            if(patient instanceof PETPatient){
                events.push({Time:patient.inj_time,"Patient Index":index+1,"Patient Name":patient.patient_name, "Event":"Injection"});
                for (let scan_index = 0; scan_index < 3; scan_index++) {
                    const scan = patient.scans[scan_index];
                    if(scan instanceof PETScan){
                        if(scan.visible){
                            events.push({Time:moment(scan.scan_start,"HH:mm").format("HH:mm"),"Patient Index":index+1,"Patient Name":patient.patient_name, "Event":`Scan Nr.${scan_index+1} - start`});
                            events.push({Time:moment(scan.pet_start,"HH:mm").format("HH:mm"),"Patient Index":index+1,"Patient Name":patient.patient_name, "Event":`Scan Nr.${scan_index+1} - pet start`});
                            events.push({Time:moment(scan.scan_end,"HH:mm").format("HH:mm"),"Patient Index":index+1,"Patient Name":patient.patient_name, "Event":`Scan Nr.${scan_index+1} - end`});
                            continue;
                        }
                        break;
                    }
                    break;
                }
            
            }
        }
        events.sort((a, b) => moment(a.Time,"HH:mm") - moment(b.Time,"HH:mm"));

        if(events.length>0){
            var keys = Object.keys(events[0]);

            var table = $("<table/>").addClass("w-100 table table-bordered align-middle").attr("id","schedule_table");
            var header_row = $("<tr/>");
            $.each(keys,function(_,key){
                header_row.append($("<th/>").html(key).attr("scope","col").addClass("text-center"));
            })
            table.append($("<thead/>").addClass("table-light").append(header_row));

            var table_body = $("<tbody/>");

            $.each(events,function(row_index,row){
                var row_dom = $("<tr/>");
                $.each(keys,function(key_index,key){
                    row_dom.append($("<td/>").html(row[key] == null ? "-":row[key]).addClass("border"));
                })
                table_body.append(row_dom);
        
            })
        
            table.append(table_body);

            $(container).append($("<div/>").addClass("table-responsive text-nowrap").append(table));
        }
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

    static swap_patients(p1, p2){
        if(p1>=0 && p1<Parapet.patients.length && p2>=0 && p2<Parapet.patients.length){
            if(! Parapet.patients[p1] instanceof PETPatient) return;
            if(! Parapet.patients[p2] instanceof PETPatient) return;
            
            const patient_1_container = $(Parapet.patients[p1].container);
            const patient_2_container = $(Parapet.patients[p2].container);

            $(patient_1_container).empty();
            $(patient_2_container).empty();

            const patient_1_params = Parapet.patients[p1].serializePatient();
            const patient_2_params = Parapet.patients[p2].serializePatient();

            var new_p_1 = PETPatient.from_params(patient_2_params);
            var new_p_2 = PETPatient.from_params(patient_1_params);
            new_p_1.pushToPatients(p1);
            new_p_2.pushToPatients(p2);

            Parapet.patients[p1].create_GUI(patient_1_container);
            Parapet.patients[p2].create_GUI(patient_2_container);


            Parapet.toLocalStorage();
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

    static init_dosage_plot(container = null){
        if(! container){
            container = Parapet.parapet_dosage_container;
        }
        $(container).empty();

        Parapet.parapet_dosage_container = container;

        $(container).addClass("parapet-card");



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
                  display: true, // Hide the y-axis
                  title:{
                    display:true,
                    text: "Dose [MBq]"
                  }
                },
              },
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      display: false,
                  }
              },
              

              
            },
          };

        var params_div = $("<div/>").addClass("row").attr("id","dosage_chart_params");

        var t0_time_block = $("<div/>").attr("id","t0_time").addClass("row mb-1");
        var t0_dose_block = $("<div/>").attr("id","t0_dose_block").addClass("row mb-1");
      

        params_div.append($("<div/>").addClass("col-6").append(t0_time_block));
        params_div.append($("<div/>").addClass("col-6").append(t0_dose_block));
        $(container).append(params_div);


        // t0 dose
        var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for","t0_dose").html(`t0 dose`);

        var group_container = $("<div/>").addClass("input-group");

        var _input = $("<input/>").addClass("form-control ").attr("type","text").attr("id","t0_dose").attr("name","t0_dose");
        
        _input.attr("placeholder","t0 dose in MBq");
        if(Parapet.t0_dose) _input.val(Parapet.t0_dose);

        group_container.append(_input)

        var unit = $("<span/>").addClass("input-group-text w-25");  
        unit.html("MBq");
        group_container.append(unit);


        _input.on("change",function(event){
            const val = event.target.value;
            Parapet.t0_dose = parseFloat(val);
        })
        t0_dose_block.append(_label).append($("<div/>").addClass("col-md-9").append(group_container));
    
        // t0 time

        simple_dynamic_input_time(
            t0_time_block,
            "t0_time",
            "t0 time",
            5,
            moment("03:00","HH:mm"),
            Parapet.work_end,
            Parapet.t0_time ? moment(Parapet.t0_time,"HH:mm").format("HH:mm") : null,
            function (val) {
                if(this.initialized){
                    if(val==""){
                        val = moment(Parapet.work_start, "HH:mm").format("HH:mm");
                        $(t0_time_block).find("input").val(val);
                    }
    
                    Parapet.t0_time = moment(val, "HH:mm").format("HH:mm");
                }
                
            }.bind(this)
        );




        var chart_div = $("<canvas/>").attr("id","dosage_chart").css("height","125px");
        $(container).append($("<div/>").append(chart_div).css("height","100pt").addClass("m-2"));
        
        var chart_element = document.getElementById("dosage_chart").getContext('2d');
        Parapet.dosage_plot = new Chart(chart_element, config);


        $(params_div).find("input:not(:checkbox)").on("change",function(){
            if(Parapet.initialized) Parapet.update_dose_plot();
        })


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
        
        if(Parapet.dosage_visibility) Parapet.update_dose_plot();

    }

    static update_dose_plot(){
        var data = [];
        const t0 = moment(Parapet.t0_time,"HH:mm");
        const t0_dose = Parapet.t0_dose;

        const half_time = 109.771*60.0;
        const decay_const = Math.log(2) / half_time;

        var moving_t0 = t0;
        var moving_t0_dose = t0_dose;


        var inj_events = [];
        for (let index = 0; index < Parapet.number_of_patients; index++) {
            const patient = Parapet.patients[index];
            if(patient instanceof PETPatient){
                if(patient.inj_dose){
                    inj_events.push({time:moment(patient.inj_time,"HH:mm"),dose:patient.inj_dose});
                }
            }
        }
        inj_events = inj_events.sort((a,b)=> a.time-b.time);

        
        var time_step = moment.duration(1,'minutes');
        var current_time = moment(t0,"HH:mm");

        var event_index = 0;
        while(true){
            var current_dose = moving_t0_dose * Math.exp(-decay_const*(current_time.diff(moving_t0,"seconds")));

            if(event_index<inj_events.length){
                var event_time = inj_events[event_index].time;
                if(event_time<=current_time){
                    moving_t0 = event_time;
                    
                    current_dose -=inj_events[event_index].dose;
                    moving_t0_dose = current_dose;

                    event_index+=1;
                }
            }
            data.push({x:moment(current_time,"HH:mm"),y:current_dose});

            current_time = current_time.add(time_step);
            if(current_time>moment(Parapet.work_end,"HH.mm")) break;
        }

        var dataset = {
            label:`Current dose @`,
            pointHoverRadius: 0,
            pointBorderWidth:0,
            borderWidth: 2,
            pointRadius:0,
            data: data
        }

        if(!Parapet.dosage_plot){
            Parapet.init_dosage_plot();
        }

        // remove old data
        Parapet.dosage_plot.data.labels.pop();
        Parapet.dosage_plot.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });
        
        // add new data
        Parapet.dosage_plot.data.datasets = [dataset];

        Parapet.dosage_plot.update();


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
            {"min":0,"max":30,"step":0.5},
            function(val){
                this.fov_duration = parseFloat(val);
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
        fdg.add_scan(new PETScan(60,1,20,5,5));

        var fdg_wb = new PETPatient(1);
        fdg_wb.add_scan(new PETScan(60,8,3,5,5));

        var fdg_wb_leg = new PETPatient(2);
        fdg_wb_leg.add_scan(new PETScan(60,8,3,5,0));
        fdg_wb_leg.add_scan(new PETScan(null,8,1.5,0,10));

        var fdg_leg_wb = new PETPatient(2);
        fdg_leg_wb.add_scan(new PETScan(40,8,1.5,5,0));
        fdg_leg_wb.add_scan(new PETScan(60,8,3,0,10));


        var dopa = new PETPatient(1);
        dopa.add_scan(new PETScan(10,1,20,5,5));
        
        var dopa_wb = new PETPatient(2);
        dopa_wb.add_scan(new PETScan(10,10,3,5,5));
        dopa_wb.add_scan(new PETScan(60,10,3,5,5));



        var choline_parathyorid = new PETPatient(2);        
        choline_parathyorid.add_scan(new PETScan(10,3,5,5,5));
        choline_parathyorid.add_scan(new PETScan(60,3,5,5,5));

        var choline_prostate = new PETPatient(2);
        choline_prostate.add_scan(new PETScan(2,2,3,5,5));
        choline_prostate.add_scan(new PETScan(60,10,3,5,5));

        PETPatient.presets = {
            "FDG - brain":fdg,
            "FDG - WB":fdg_wb,
            "FDG - WB & Leg":fdg_wb_leg,            
            "FDG - Leg & WB":fdg_leg_wb,

            "DOPA - brain":dopa,
            "DOPA - WB":dopa_wb,

            "Choline - parathyroid":choline_parathyorid,
            "Choline - prostate":choline_prostate
        }

        // console.log(PETPatient.presets);
    }


    constructor (number_of_scans = 1, inj_dose = null, inj_time = null,  patient_name = "", visible = false ){
        this._number_of_scans = number_of_scans;

        if(inj_time === null) inj_time = Parapet.work_start;
        this._inj_time = moment(inj_time,"HH:mm").format("HH:mm");
        this.inj_dose = parseFloat(inj_dose);
        this.patient_name = patient_name;
        this.scans = [];
        this.visible = visible;
        this.preset = null;

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
            if(moment(value,"HH:mm") < moment(Parapet.work_start,"HH:mm")){
                this._inj_time = moment(Parapet.work_start,"HH:mm");
                if(this.container){
                    this.update_params_gui();
                    this.paramsToSlider();
                    Parapet.update_schedule_plot();
                    if(Parapet.autosave) Parapet.toLocalStorage();
                }
            }
            else{
                this._inj_time = moment(value,"HH:mm");
                if(this.container){
                    Parapet.update_schedule_plot();
                    if(Parapet.autosave) Parapet.toLocalStorage();
                }
            }


        }
    }

    static from_params({number_of_scans, inj_dose, inj_time,  patient_name,scans, visible, preset}){
        var patient =  new PETPatient(number_of_scans=number_of_scans, inj_dose = inj_dose,  inj_time=inj_time, patient_name = patient_name, visible = visible, preset = preset);
        if(isArray(scans)){
            for (let index = 0; index < scans.length; index++) {
                const scan_params = scans[index];
                var scan = PETScan.from_params(scan_params);
                patient.add_scan(scan);
                if(index<number_of_scans){
                    scan.set_visibility(true);

                }
                patient.preset = preset;
                
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


    pushToPatients(index = null){
        this.container = null;

        this.slider = null;

        this.slider_div = null;
        this.params_div = null;

        this.details_div = null;
        this.scan_details_div = null;

        this.visible = true;    
        this._selected = false;

        this.slider_dragged = false;
        this.slider_pre_drag_starts = null;
        this.slider_lock = false;


        this.initialized = false;

        if(index === null){
            this.index =  Parapet.patients.length;
            this.slider_name = `patient_${this.index}_slider`;
            this.color = Parapet.colors[this.index];
            this.patient_details_name = `patient_${this.index}_details`;
            Parapet.patients.push(this);

        }
        else{
            this.index =  index;
            this.slider_name = `patient_${index}_slider`;
            this.color = Parapet.colors[index];
            this.patient_details_name = `patient_${index}_details`;
            Parapet.patients[index] = this;
        }

    }

    set index(value){
        this._index = value;

        if(value == 0)
            $(this.container).find(`#move_up`).prop("disabled",true);
        else
            $(this.container).find(`#move_up`).prop("disabled",false);

        if(value == Parapet.number_of_patients-1)
            $(this.container).find(`#move_down`).prop("disabled",true);
        else
            $(this.container).find(`#move_down`).prop("disabled",false);
    }

    get index(){
        return this._index;
    }

    set selected(value){
        this._selected = value;
        $(this.container).find(`#is_selected`).prop("checked",value);
        var indices = Parapet.get_selected_indices();
        if(indices.length==2){
            $(Parapet.parapet_menu_container).find("#swap_btn").removeClass("d-none");
        }
        else{
            $(Parapet.parapet_menu_container).find("#swap_btn").addClass("d-none");
        }
    }

    get selected(){
        return this._selected;
    }

    initFromPreset(preset_name){
        if(preset_name in PETPatient.presets){
            var preset = PETPatient.presets[preset_name];
            if(preset instanceof PETPatient){
                this.number_of_scans = preset.number_of_scans;
                this.inj_dose = preset.inj_dose;
                this.scans = [];
                this.preset = preset_name;
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
                                 number_of_scans : this.number_of_scans, inj_dose : this.inj_dose,
                                 inj_time: this.inj_time, visible: this.visible, preset: this.preset
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

            if(this.preset){
                this.params_div.find(`#preset_select`).val(this.preset);
            }

            let inj_dose_div = this.details_div.find(`[name="inj_dose"]`);
            if(this.inj_dose) inj_dose_div.val(this.inj_dose);


        }
        this.index = this.index;
    }

    #show_presets_block(container,label = "Preset"){
        if(PETPatient.presets==null){
            PETPatient.create_presets();
        }

        var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for","preset").html(label);
        var _select_dropdow = $("<select/>").addClass("form-select").attr("type","text").attr("id","preset_select").attr("name","preset");
        _select_dropdow.append($("<option/>").html("Choose preset...").prop('selected',true).attr("value","").attr("disabled",true));
        $.each(PETPatient.presets, function (preset_name, preset_patient) { 
            _select_dropdow.append($("<option/>").html(preset_name).attr("value",preset_name));
        });
        
        if(this.preset) _select_dropdow.val(this.preset);

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

    #show_inj_dose_block(container){
        var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for","inj_dose").html(`Planned injected dose`);

        var group_container = $("<div/>").addClass("input-group");

        var _input = $("<input/>").addClass("form-control ").attr("type","text").attr("id","inj_dose").attr("name","inj_dose");
        
        _input.attr("placeholder","Planned injected dose in MBq");
        if(this.inj_dose) _input.val(this.inj_dose);

        group_container.append(_input)

        var unit = $("<span/>").addClass("input-group-text w-25");  
        unit.html("MBq");
        group_container.append(unit);


        _input.on("change",function(event){
            const val = event.target.value;
            this.inj_dose = parseFloat(val);
        }.bind(this))

        container.empty();
        container.append(_label).append($("<div/>").addClass("col-md-9").append(group_container));
    }

    #show_name_block(container){
        var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for","patient_name").html(`Nr.${this.index+1}`);
        var _input = $("<input/>").addClass("form-control ").attr("type","text").attr("id","patient_name").attr("name","patient_name");
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

    #create_operate_block(container){
        var operate_content = $("<ul/>").addClass("nav d-flex flex-column h-100 mb-auto text-center justify-content-evenly");

        var up_block = $("<li/>").addClass("nav-item parapet-operate");
        var select_block = $("<li/>").addClass("nav-item parapet-operate");
        var down_block = $("<li/>").addClass("nav-item parapet-operate");

        operate_content.append(up_block);
        operate_content.append(select_block);
        operate_content.append(down_block);

        var up_btn = $("<button/>").addClass("btn btn-light rounded-pill");
        up_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        up_btn.attr("title","Move up").attr("id","move_up");
        up_btn.append($("<i/>").addClass("fa fa-arrow-up fa-solid"));
        up_block.append(up_btn);

        var select_btn = $("<input/>").attr("type","checkbox").attr("id","is_selected");
        select_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        select_btn.attr("title","Select patient");
        select_block.append(select_btn);

        select_btn.on("change",function(){
            this.selected = $(select_btn).prop("checked");
        }.bind(this))

        var down_btn = $("<button/>").addClass("btn btn-light rounded-pill");
        down_btn.attr("data-bs-toggle","tooltip").attr("data-bs-placement","right");
        down_btn.attr("title","Move down").attr("id","move_down");
        down_btn.append($("<i/>").addClass("fa fa-arrow-down fa-solid"));
        down_block.append(down_btn);

        up_btn.on("click",function(){
            Parapet.swap_patients(this.index,this.index-1);
        }.bind(this))

        down_btn.on("click",function(){
            Parapet.swap_patients(this.index,this.index+1);
        }.bind(this))


        $(container).empty().append(operate_content)
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

        $(params_container).addClass("d-flex");

        var operate_container = $("<div/>").addClass("d-flex flex-column h-100");
        var params_block = $("<div/>").addClass("d-flex flex-column");

        $(params_container).append($("<div/>").append(operate_container).addClass("pe-4"));
        $(params_container).append($("<div/>").append(params_block));

        this.#create_operate_block(operate_container);
        this.selected = false;

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
        
        $(params_block).append(main_props);

        var number_of_scans_block = $("<div/>").attr("id","number_of_scans_block").addClass("row mb-1");
        var inj_dose_block = $("<div/>").attr("id","inj_dose_block").addClass("row mb-1");
      

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
        details_first_row.append($("<div/>").addClass("col-6").append(inj_dose_block));
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
            
        this.#show_inj_dose_block(inj_dose_block);
                

        $(params_container).find("input:not(:checkbox)").on("change",function(){
            if(this.initialized) this.paramsToSlider();

        }.bind(this))

        $(details_first_row).find("input:not(:checkbox)").on("change",function(){
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
                // double firing...
                if(this.slider_lock == false){
                    this.slider_lock = true;
                    var vals = slider.noUiSlider.get(true);
                    var diff = vals[0] - this.slider_pre_drag_starts[0];
                    if(this.selected){
                        var indices = Parapet.get_selected_indices();
                        for (let _index = 0; _index < indices.length; _index++) {
                            const index = indices[_index];
                            if(index==this.index) continue;
                            const patient = Parapet.patients[index];
                            if(patient instanceof PETPatient){
                                patient.inj_time = moment(patient.inj_time,"HH:mm").add(Math.floor(diff),"minutes");
                                patient.update_params_gui();
                                patient.paramsToSlider();
                            }
                            
                        }
                    }
                    // console.log(this.slider_pre_drag_starts[0]);
                    // console.log(vals[0]);
                    // console.log(diff);
    
                    var start_min = Math.floor(vals[0])+this.first_scan_start_delay;
                    var pet_start = moment(Parapet.work_start,"HH:mm").add(start_min,"minutes");
                    this.inj_time = pet_start.subtract(this.first_scan_timing,"minutes").format("HH:mm");
                    this.update_params_gui();
                    setTimeout(function(){this.slider_lock = false}.bind(this),100)
                }
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
        this.index = this.index;

    }
}