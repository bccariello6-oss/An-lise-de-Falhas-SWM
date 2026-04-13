// (function($){

function aysPbvalidatePhoneNumber(input) {
    var phoneno = /^[+ 0-9-]+$/;
    if ( typeof input != "undefined" && input.length > 0 && input.value.match(phoneno)) {
        return true;
    } else {
        return false;
    }
}

//})(jQuery);
