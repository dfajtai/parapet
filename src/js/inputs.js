function dynamicRangeInput(container, name, label, default_value, arg = null, on_change = null, trigger_change = false){
    var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for",name+"Input").html(label);
    // var _label =  $("<label/>").addClass("col-md-3 col-form-label").attr("for",name+"Input").html(`<small>${label}</small>`);

    var group_container = $("<div/>").addClass("input-group");
    
    var _input = $("<input/>").addClass("form-range w-75 mt-1 me-2 custom-bs-slider mt-2");
    _input.attr("type","range").attr("id",name+"Input").attr("name",name).attr("data-name",name).attr("data-label",label);
    $(_input).attr("data-value","");

    if(arg.hasOwnProperty("step")) _input.attr("step",parseFloat(arg.step));
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
        var val = $(this).val();
        if(arg.hasOwnProperty("step")){
            var step = parseFloat(arg.step)
            val = Math.floor(val/step)*step;
        }
                    
        $(_input).val(val).trigger("change");
        $(_input).prop("data-value",val);


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

    if(trigger_change) $(_input).val(default_value).trigger("change");
    else  $(_input).val(default_value);


    container.append(_label);
    container.append($("<div/>").addClass("col-md-9").append(group_container));
}


function simple_dynamic_input_time(container, name, label, interval = 5, min_time = null, max_time = null, default_time = null, on_change = null){
    container.empty();

    if(min_time === null) min_time = moment(Parapet.work_start,"HH:mm").format("HH:mm");
    if(max_time === null) max_time = moment(Parapet.work_end,"HH:mm").format("HH:mm");
    if(default_time === null) default_time = moment(Parapet.default_time,"HH:mm").format("HH:mm");
    
    var _time_label = $("<small/>").addClass("col-md-4 col-form-label").attr("for","pet_start").html(label);
    var _time_input = $("<input/>").addClass("form-control ").attr("id",name+"_input").attr("name",name);

    container.append(_time_label);
    container.append($("<div/>").append(_time_input).addClass("col-md-8"));
    

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
