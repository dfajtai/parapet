function dynamicRangeInput(container, name, label, default_value, arg = null, on_change = null){
    var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for",name+"Input").html(label);
    // var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for",name+"Input").html(`<small>${label}</small>`);

    var group_container = $("<div/>").addClass("input-group");
    
    var _input = $("<input/>").addClass("form-range w-50 mt-1 me-2 custom-bs-slider mt-2");
    _input.attr("type","range").attr("id",name+"Input").attr("name",name).attr("data-name",name).attr("data-label",label);
    $(_input).attr("data-value","");

    if(arg.hasOwnProperty("step")) _input.attr("step",arg.step);
    if(arg.hasOwnProperty("min")) _input.attr("min",arg.min);
    if(arg.hasOwnProperty("max")) _input.attr("max",arg.max);

    group_container.append(_input)

    var current =$("<input/>").addClass("form-control ").attr("type","numeric").attr("id","currentValue");

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
    var _input = $("<input/>").addClass("form-control  flex-grow-1").attr("type","time").attr("id",name+"Input").attr("name",name).attr("data-name",name).attr("data-label",label).attr("step","0");
    
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
    
    var _time_label = $("<small/>").addClass("col-md-3 col-form-label").attr("for","pet_start").html(label);
    var _time_input = $("<input/>").addClass("form-control ").attr("id",name+"_input").attr("name",name);

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
        scrollbar: true,
        change:function(){
            // console.log("asd");
            if(on_change instanceof Function){
                on_change($(this).val());
            }
        }
        });
    // _time_input.on("click",function(){
    //     $(this).val("");
    // })


}
