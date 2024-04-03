function isObject(value) {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}


function isArray(val){
    return Array.isArray(val);
}



function create_modal_confirm(container, modal_id, title, content = null, callback = null){
    $(container).empty();
    var modal_root = $("<div/>").addClass("modal fade").attr("id",modal_id).attr("tabindex","-1");
    var modal_dialog = $("<div/>").addClass("modal-dialog modal-md");
    var modal_content = $("<div/>").addClass("modal-content");

    var modal_header= $("<div/>").addClass("modal-header");
    modal_header.append($("<h5/>").addClass("modal-title display-3 fs-3").html(title));
    modal_header.append($("<button/>").addClass("btn-close").attr("data-bs-dismiss","modal").attr("aria-label","Close"));

    var modal_body = $("<div/>").addClass("modal-body d-flex flex-column");

    modal_body.append(content);

    var confirm_div = $("<div/>").addClass("form-check");

    var confirm_div = $("<div/>").addClass("form-check p-3");
    var confirm_switch = $("<input/>").addClass("form-check-input ms-2 me-1").attr("type","checkbox").attr("id","confirm_switch");
    confirm_div.append(confirm_switch);
    confirm_div.append($("<label/>").addClass("form-check-label").attr("for","confirm_switch").html("Check to confirm"));
    modal_body.append(confirm_div);

    var modal_footer= $("<div/>").addClass("modal-footer");
    modal_footer.append($("<button/>").addClass("btn btn-secondary").attr("data-bs-dismiss","modal").attr("aria-label","Close").html("Close"));
    var confirm_btn = $("<button/>").addClass("btn btn-primary d-none").attr("aria-label","Confirm").html("Confirm").attr("id","confirm-btn")
    modal_footer.append(confirm_btn);

    modal_content.append(modal_header);
    modal_content.append(modal_body);
    modal_content.append(modal_footer);

    modal_dialog.html(modal_content);
    modal_root.html(modal_dialog);

    confirm_switch.on("change",function(){
        if($(this).prop('checked')){
            $(confirm_btn).removeClass("d-none");
        }
        else{
            $(confirm_btn).addClass("d-none");
        }

    })
    $(modal_footer).find("#confirm-btn").on("click",function(){
        if( typeof callback == 'function'){
            callback();
            $(modal_root).modal('hide');
        }
    })

    container.append(modal_root);
}

function create_modal_window(container, modal_id, title, content = null, size = "md"){
    $(container).empty();
    var modal_root = $("<div/>").addClass("modal fade").attr("id",modal_id).attr("tabindex","-1");
    var modal_dialog = $("<div/>").addClass(`modal-dialog modal-${size}`);
    var modal_content = $("<div/>").addClass("modal-content");

    var modal_header= $("<div/>").addClass("modal-header");
    modal_header.append($("<h5/>").addClass("modal-title display-3 fs-3").html(title));
    modal_header.append($("<button/>").addClass("btn-close").attr("data-bs-dismiss","modal").attr("aria-label","Close"));

    var modal_body = $("<div/>").addClass("modal-body d-flex flex-column");

    modal_body.append(content);

    var modal_footer= $("<div/>").addClass("modal-footer");
    modal_footer.append($("<button/>").addClass("btn btn-secondary").attr("data-bs-dismiss","modal").attr("aria-label","Close").html("Close"));


    modal_content.append(modal_header);
    modal_content.append(modal_body);
    modal_content.append(modal_footer);

    modal_dialog.html(modal_content);
    modal_root.html(modal_dialog);


    container.append(modal_root);
}