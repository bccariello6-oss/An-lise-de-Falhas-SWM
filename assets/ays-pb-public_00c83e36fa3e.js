(function( $ ) {
	'use strict';
    $.fn.serializeFormJSON = function () {
        var o = {},
            a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
	/**
	 * All of the code for your public-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */
	$(document).ready(function () {
		
		var emailValivatePattern = /^[a-zA-Z0-9\._-]+@[a-zA-Z0-9\._-]+\.\w{2,}$/;
		var urlValivatePattern = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
		$(document).on('input', '.ays_pb_subscription_live input[name="ays_pb_subs_email"]', function(){
            if ($(this).attr('type') !== 'hidden') {
                $(this).removeClass('ays_pb_red_border');
                $(this).removeClass('ays_pb_green_border');
                if($(this).val() != ''){
                    if (!(emailValivatePattern.test($(this).val()))) {
                        $(this).addClass('ays_pb_red_border');
                    }else{
                        $(this).addClass('ays_pb_green_border');
                    }
                }
            }
        });

		$(document).find('.ays_pb_sub_button, .ays_pb_contact_form_live_btn, .ays_pb_send_file_type_btn').on('click', function(e) {
            var _this = $(this);
            var parent = _this.parents('form.ays-pb-form');

            var required_inputs = parent.find('input[required]');

            if (required_inputs.length !== 0) {
                var empty_inputs = 0;

                parent.find('.ays_pb_red_border').removeClass('ays_pb_red_border');
                parent.find('.ays_pb_green_border').removeClass('ays_pb_green_border');

                for (var i = 0; i < required_inputs.length; i++) {
                    var currentInput = required_inputs.eq(i);

                    switch (currentInput.attr('type')) {
                        case 'checkbox':
                            if (currentInput.prop('checked') === false) {
                                currentInput.addClass('ays_pb_red_border');
                                currentInput.addClass('shake');
                                empty_inputs++;
                            } else {
                                currentInput.addClass('ays_pb_green_border');
                            }
                            break;
                        case 'email':
                            if ( !(emailValivatePattern.test(currentInput.val())) ) {
                                currentInput.addClass('ays_pb_red_border');
                                currentInput.addClass('shake');
                                empty_inputs++;
                            } else {
                                currentInput.addClass('ays_pb_green_border');
                            }
                            break;
                        case 'tel':
                            if ( !aysPbvalidatePhoneNumber(currentInput.get(0)) ) {
                                currentInput.addClass('ays_pb_red_border');
                                currentInput.addClass('shake');
                                empty_inputs++;
                            } else {
                                currentInput.addClass('ays_pb_green_border');
                            }
                            break;
                        default:
                            if (currentInput.val().trim() === '' && currentInput.attr('type') !== 'hidden') {
                                currentInput.addClass('ays_pb_red_border');
                                currentInput.addClass('shake');
                                empty_inputs++;
                            } else {
                                currentInput.addClass('ays_pb_green_border');
                            }
                            break;
                    }
                }

                var required_textareas = parent.find('textarea[required]');

                var empty_inputs2 = 0;
                if (required_textareas.length !== 0) {
                    for (var i = 0; i < required_textareas.length; i++) {
                        var currentTextarea = required_textareas.eq(i);

                        if (currentTextarea.val().trim() === '' && currentTextarea.attr('type') !== 'hidden') {
                            currentTextarea.addClass('ays_pb_red_border');
                            currentTextarea.addClass('shake');
                            empty_inputs2++;
                        } else {
                            currentTextarea.addClass('ays_pb_green_border');
                        }
                    }
                }

                var emailInput = parent.find('input[name*="ays_pb_form_email"]');
                var selectAttr = parent.find('select.ays_pb_form_input[required]');
                var urlInput = parent.find('input[type="url"]');

                if (emailInput.val() != '') {
                    emailInput.removeClass('ays_pb_red_border');
                    emailInput.removeClass('ays_pb_green_border');
                    if ( !(emailValivatePattern.test(emailInput.val())) ) {
                        if (emailInput.attr('type') !== 'hidden') {
                            emailInput.addClass('ays_pb_red_border');
                            emailInput.addClass('shake');
                            empty_inputs++;
                        }
                    } else {
                        emailInput.addClass('ays_pb_green_border');
                    }
                }

                if (urlInput.length > 0 && urlInput.val() != '') {
                    urlInput.removeClass('ays_pb_red_border');
                    urlInput.removeClass('ays_pb_green_border');

                    if ( !(urlValivatePattern.test(urlInput.val())) ) {
                        urlInput.addClass('ays_pb_red_border');
                        urlInput.addClass('shake');
                        empty_inputs++;
                    } else {
                        urlInput.addClass('ays_pb_green_border');
                    }
                }

                for (var i = 0; i < selectAttr.length; i++) {
                    if (selectAttr.eq(i).val() == '') {
                        selectAttr.eq(i).removeClass('ays_pb_red_border');
                        selectAttr.eq(i).removeClass('ays_pb_green_border');

                        selectAttr.eq(i).addClass('ays_pb_red_border');
                        selectAttr.eq(i).addClass('shake');
                        empty_inputs++;
                    } else {
                        selectAttr.eq(i).removeClass('ays_pb_red_border');
                    }
                }

                if (parent.hasClass('ays-pb-recaptcha-enabled')) {
                    var formCaptchaValidation = parent.attr('data-recaptcha-validate') && parent.attr('data-recaptcha-validate') == 'true' ? true : false;
                    if (formCaptchaValidation === false) {
                        var err = parent.find('.ays-pb-g-recaptcha-hidden-error');
                        err.show();
                        empty_inputs++;
                    }
                }

                var errorFields = parent.find('.ays_pb_red_border');

                if (empty_inputs2 !== 0 || empty_inputs !== 0) {
                    e.preventDefault();

                    setTimeout(function() {
                        errorFields.each(function() {
                            $(this).removeClass('shake');
                        });
                    }, 500);

                    setTimeout(function() {
                        required_inputs.each(function() {
                            $(this).removeClass('shake');
                        });
                    }, 500);

                    return false;
                } else if ((e.target.className).match('ays_pb_send_file_type_btn')) {
                    ays_pb_send_file_type_fn();
                } else if ((e.target.className).match('ays_pb_sub_button')) {
                    ays_pb_subscription_type_fn(e);
                } else {
                    parent.submit();
                }
            }
        });

        function ays_pb_send_file_type_fn() {
            $(document).on('click', '.ays_pb_send_file_type_btn', function(e) {
                var form = $(this).parents('.ays_pb_send_file_container').parents('form#ays_pb_send_file_form');
                var thisDataConfirm = form.data('confirm');

                var curentSubPb = $(this).parents('*[class*=ays-pb-modal_]');
                var curentSubPbClass = curentSubPb.attr('class').split(' ')[1];
                var curentSubPbClassId = curentSubPbClass.split('_')[1];

                var confirm;

                if (thisDataConfirm && thisDataConfirm != '') {
                    confirm = window.confirm(pb_public.ays_pb_confirm);

                    if (!confirm && typeof confirm != undefined) {
                        return false;
                    }
                }

                var data = form.serializeFormJSON();
                data.action = 'ays_pb_subscribe_get_file';
                $.ajax({
                    url: pb_public.ajax,
                    dataType: 'json',
                    data: data,
                    method: 'POST',
                    beforeSend: function() {
                        $(document).find('div.ays-pb-preloader').css('display', 'flex');
                    },
                    success: function (status, xhr) {
                        if (xhr === 'success') {
                            var status_unicode = '&#10003;';
                            var messageSuccess = pb_public.subscription_success_message;

                            curentSubPb.html('<div class="send_file_info_popup">' + status_unicode + messageSuccess + '</div>' + '<div class="ays_pb_send_file_popup_close_btn ays-pb-modal-close_' + curentSubPbClassId + '"><img src="' + pb_public.ays_pb_admin_url + '/images/icons/times-2x.svg"></div>');
                            curentSubPb.find('.ays_pb_send_file_popup_close_btn').on('click', function(event) {
                                curentSubPb.hide();
                                $(document).find('#ays-pb-screen-shade_' + +curentSubPbClassId).hide();
                                $(document).find('.av_pop_modals_' + +curentSubPbClassId).hide();
                            });

                            var redirectURL = e.target.hasAttribute('data-redirect') && e.target.getAttribute('data-redirect') !== '' ? e.target.getAttribute('data-redirect') : null;
                            if (redirectURL) {
                                window.location.href = redirectURL;
                            }
                        }
                    },
                    complete:function() {
                        $(document).find('div.ays-pb-preloader').delay(700)
                        .queue( function(next) {
                            $(this).hide();
                            next();
                        });
                    },
                    error: function() {
                        var status_unicode = '&#x26A0;';
                        var messageFail = 'Error occurred during the subscription. Please, try again';

                        curentSubPb.html("<div class='send_file_info_popup'>" + status_unicode + messageFail + "</div>" + "<div class='ays_pb_send_file_popup_close_btn ays-pb-modal-close_" + curentSubPbClassId + "'><img src='" + pb_public.ays_pb_admin_url + "/images/icons/times-2x.svg'</div>");
                        curentSubPb.find('.ays_pb_send_file_popup_close_btn').on('click', function(event) {
                            curentSubPb.hide();
                            $(document).find('#ays-pb-screen-shade_' + +curentSubPbClassId).hide();
                            $(document).find('.av_pop_modals_' + +curentSubPbClassId).hide();
                        });
                    }
                });
            });
        }

        function ays_pb_subscription_type_fn(e) {
            e.preventDefault();

            var form = $(e.target).parents('form.ays-pb-form.ays-pb-subscription-form');

            var curentSubPb = form.parents('div[class*=ays-pb-modal_]');            
            var classes = curentSubPb.attr('class').split(/\s+/);
            var idClass = classes.find(function(cls) {
                return cls.startsWith('ays-pb-modal_');
            });
            var id = null;
            if (idClass) {
                id = idClass.split('_')[1]
            }

            var data = form.serializeFormJSON();
            data.action = 'ays_pb_subscribtion';

            $.ajax({
                url: pb_public.ajax,
                dataType: 'json',
                data: data,
                method: 'POST',
                beforeSend: function() {
                    $(document).find('div.ays-pb-preloader').css('display', 'flex');
                },
                success: function (response, status, xhr) {
                    if (status === 'success') {
                        var messageSuccess = '';
                        
                        var data = response.data;
                        if (data && data.display_post_subscription_message && data.message_after_subscription) {
                            messageSuccess = response.data.message_after_subscription;
                        }

                        if (!messageSuccess) {
                            var closeBtn = curentSubPb.find('div[class*="ays-pb-modal-close_"]');
                            closeBtn.trigger('click');
                            return;
                        }

                        curentSubPb.html('<div class="subscription_info_popup">' + messageSuccess + '</div>' + '<div class="ays_pb_subscription_popup_close_btn ays-pb-modal-close_' + id + '"><img src="' + pb_public.ays_pb_admin_url + '/images/icons/times-2x.svg"></div>');
                        curentSubPb.find('.ays_pb_subscription_popup_close_btn').on('click', function(event) {
                            curentSubPb.hide();
                            $(document).find('#ays-pb-screen-shade_' + +id).hide();
                            $(document).find('.av_pop_modals_' + +id).remove();
                        });
                    }
                },
                complete:function() {
                    $(document).find('div.ays-pb-preloader').delay(700)
                    .queue( function(next) {
                        $(this).hide();
                        next();
                    });
                },
                error: function() {
                    var status_unicode = '&#x26A0;';
                    var messageFail = 'Error occurred during the subscription. Please, try again';

                    curentSubPb.html("<div class='subscription_info_popup'>" + status_unicode + messageFail + "</div>" + "<div class='ays_pb_subscription_popup_close_btn ays-pb-modal-close_" + id + "'><img src='" + pb_public.ays_pb_admin_url + "/images/icons/times-2x.svg'</div>");
                    curentSubPb.find('.ays_pb_subscription_popup_close_btn').on('click', function(event) {
                        curentSubPb.hide();
                        $(document).find('#ays-pb-screen-shade_' + +id).hide();
                        $(document).find('.av_pop_modals_' + +id).hide();
                    });
                }
            });
        }

        $(document).find('.ays-pb-accept-all-cookies').on( 'click', function(){
            var expTime = $(this).parent().parent().find('input.ays-pb-accept-cookie-expire-time').data('expire');
            var id = $(this).parent().parent().find('input.ays-pb-accept-cookie-expire-time').data('id');
                if(expTime != ''){
                    set_cookies('ays_pb_accept_cookie_'+id, 'ays_pb_accept_cookie_'+id, parseInt(expTime));
                }else{
                    set_cookies('ays_pb_accept_cookie_'+id, 'ays_pb_accept_cookie_'+id, 10*365*24*60*60*1000);
                }
                $(document).find('.ays-pb-modal-close_'+id).trigger('click');
        });

        $(document).on('click', '#ays_pb_dismiss_ad', function(){
            var expTime = $(this).parent().data('dismiss');
            var id = $(this).parent().data('id');
    
            if(expTime != ''){
                set_cookies('ays_pb_dismiss_ad_'+id, 'ays_pb_dismiss_ad_'+id, parseInt(expTime));
            }else{
                var expiryDate = new Date();
                  expiryDate.setMonth(expiryDate.getMonth() + 1);
                set_cookies('ays_pb_dismiss_ad_'+id, 'ays_pb_dismiss_ad_'+id, expiryDate);
            }
            $(document).find('.ays-pb-modal-close_'+id).trigger('click');
        });

        $(document).on('click', '.asypb-cta', function(){
			let popupContainer = $(this).closest('.ays-pb-modals');
			if (!popupContainer) return;

			// Check if conversion already updated
			if (typeof popupContainer.attr('data-updated-conversion') != 'undefined') return

			var classValue = popupContainer.attr('class');
			var id = classValue.match(/av_pop_modals_(\d+)/)[1];
			updatePopupConversions(id);

			popupContainer.attr('data-updated-conversion', true);
		});

        var isMobileDevice = false;
        if (window.innerWidth < 768) {
            isMobileDevice = true;
        }
    
        $('div.ays-pb-modals').each(function() {
            var classValue = $(this).attr('class');
            var id = classValue.match(/av_pop_modals_(\d+)/)[1];
            var popup = JSON.parse(atob(window.aysPopupOptions[id])).popupbox;
            var popupOptions = JSON.parse(popup.options);

            var actionType = popup.action_button_type;
			var openDelay = popup.delay
			var scrollTop = popup.scroll_top

            var template = popup.view_type;
            var height = popup.height ? parseInt(popup.height) : 500;
            var minHeight = popupOptions.pb_min_height ? parseInt(popupOptions.pb_min_height) : height;
            var borderSize = (typeof popup.bordersize != 'undefined') ? popup.bordersize : 0;
            var enableborderSizeMobile = (typeof popupOptions != 'undefined' && typeof popupOptions.enable_bordersize_mobile != 'undefined' && popupOptions.enable_bordersize_mobile == 'on') ? true : false;
            if (typeof popupOptions != 'undefined' && typeof popupOptions.bordersize_mobile != 'undefined') {
				var borderSizeMobile = popupOptions.bordersize_mobile;
			} else {
				var borderSizeMobile = borderSize;
			}

			if (!enableborderSizeMobile) {
				borderSizeMobile = borderSize;
			}

            var enableFullScreen = popupOptions.enable_pb_fullscreen == 'on' ? true : false;

            var closeButtonPosition = popupOptions.close_button_position;
            var closeButtonText = popupOptions.close_button_text;
			var closeButtonImage = popupOptions.close_button_image;

			var enableOpenDelayMobile = popupOptions.enable_open_delay_mobile == 'on' ? true : false ;
			var enableScrollTopMobile = popupOptions.enable_scroll_top_mobile == 'on' ? true : false ;
            var enableCloseButtonPositionMobile = popupOptions.enable_close_button_position_mobile == 'on' ? true : false ;
            var enableCloseButtonTextMobile = popupOptions.enable_close_button_text_mobile == 'on' ? true : false ;

			$(document).find('.ays-pb-modal-close_'+id).on('click', function() {
				$(document).find('input#ays-pb-modal-checkbox_' + id).trigger('change');
			})
    
            if (enableFullScreen) {
                height = window.innerHeight;
            }

            var formattedBorderSize = borderSize;
            if (isMobileDevice) {
                if (enableCloseButtonPositionMobile) {
                    closeButtonPosition = popupOptions.close_button_position_mobile;
                }
                if (enableCloseButtonTextMobile) {
					closeButtonText = popupOptions.close_button_text_mobile;
				}
				if (enableOpenDelayMobile) {
					openDelay = popupOptions.open_delay_mobile
				}
				if (enableScrollTopMobile) {
					scrollTop = popupOptions.scroll_top_mobile
				}
                if (enableborderSizeMobile) {
					formattedBorderSize = borderSizeMobile;
				}
                height = popupOptions.mobile_height ? popupOptions.mobile_height : height;
            }

            if (actionType == 'both' || actionType == 'pageLoaded') {
				if (openDelay == 0 && scrollTop == 0) {
					$(document).find('input#ays-pb-modal-checkbox_' + id).prop('checked', true);
				}
			}
            setCloseButtonPosition(template, id, height, minHeight, formattedBorderSize, enableFullScreen, closeButtonPosition, closeButtonImage);
            setCloseButtonText(closeButtonText, closeButtonImage, id, template);
        });
    
        function setCloseButtonPosition(template, id, height, minHeight, borderSize, enableFullScreen, closeButtonPosition, closeButtonImage) {
            if (template !== 'default' && template !== 'lil' && template !== 'image' && template !== 'template' && template !== 'video' && template !== 'minimal' && template !== 'image_type_img_theme'
                && template !== 'forest' && template !== 'food' && template !== 'book' && template !== 'frozen' && template !== 'holiday'&& template == 'yellowish' && template == 'peachy' && template == 'coral' && template !== 'facebook' && template !== 'notification') {
                return false;
            }

            var heightForPosition = height;
			if (minHeight > height) {
				heightForPosition = minHeight;
			}

            var closeButtonPositionValue = {};
    
            if (template == 'default' || template == 'image_type_img_theme' || template == 'facebook') {
                var aysConteiner       = parseInt(heightForPosition);
                var h2Height           = $(document).find('.ays-pb-modal_' + id + ' h2').outerHeight(true);
                var hrHeight           = $(document).find('.ays-pb-modal_' + id + ' hr').outerHeight(true);
                var descriptionHeight  = $(document).find('.ays-pb-modal_' + id + ' .ays_pb_description').outerHeight(true);
                var timerHeight        = $(document).find('.ays-pb-modal_' + id + ' .ays_pb_timer_' + id).outerHeight(true);
                var customHtml         = $(document).find('.ays-pb-modal_' + id + ' .ays_content_box').outerHeight(true);
    
                if(h2Height == undefined){
                    h2Height = 0;
                }
                if(hrHeight == undefined){
                    hrHeight = 0;
                }
                if(descriptionHeight == undefined){
                    descriptionHeight = 0;
                }
                if(timerHeight == undefined){
                    timerHeight = 0;
                }
                if(customHtml == undefined){
                    customHtml = 0;
                }
                var aysConteinerHeight = (h2Height + descriptionHeight + timerHeight + customHtml + hrHeight);
                if(aysConteinerHeight < aysConteiner){
                    if(enableFullScreen){
                        aysConteinerHeight =  (aysConteiner - 75) + 'px';
                    }else{
                        aysConteinerHeight =  (aysConteiner - 55) + 'px';
                    }
                }
                switch(closeButtonPosition) {
                    case 'left-top':
                        closeButtonPositionValue = {top: '10px', left: '10px'};
                        break;
                    case 'left-bottom':
                        closeButtonPositionValue = {top: aysConteinerHeight, left: '10px'};
                        break;
                    case 'right-bottom':
                        closeButtonPositionValue = {top: aysConteinerHeight, right: '10px'};		
                        break;
                    default:
                        closeButtonPositionValue = {top: '10px', right: '4%'};
                        break;
                }
            } else if (template == 'lil' || template == 'coral' || template == 'yellowish' || template == 'peachy') {
                var closeButtonTop;
                if (template == 'coral' || template == 'yellowish') {
                    closeButtonTop = heightForPosition - 38 + (2 * borderSize);
                } else {
                    closeButtonTop = heightForPosition - 48 - (2 * borderSize);
                }

                switch(closeButtonPosition) {
                    case 'left-top':
                        closeButtonPositionValue = { top: '10px', left: '10px' };
                        break;
                    case 'left-bottom':
                            closeButtonPositionValue = { top: closeButtonTop + 'px', left: '10px' };
                        break;
                    case 'right-bottom':
                        if (template == 'lil') {
                            closeButtonPositionValue = { top: closeButtonTop + 'px', right: '40px', bottom: 'auto', left: 'auto' };
                        } else {
                            closeButtonPositionValue = { top: closeButtonTop + 'px', right: '10px', bottom: '10px', left: 'auto' };
                        }
                        break;
                    default:
                        if (template == 'lil') {
                            closeButtonPositionValue = { top: '10px', right: '40px' };
                        } else if(template == 'yellowish') {
                            closeButtonPositionValue = { top: '10px', right: '10px' };
                        } else {
                            closeButtonPositionValue = { top: '10px', right: '5%' };
                        }
                        break;
                }
            } else if (template == 'template') {
                var closeBttnImageExist = closeButtonImage != '';
                switch(closeButtonPosition) {
                    case 'left-top':
                        var sidePostion = closeBttnImageExist ? 30 + 'px' : 20 + 'px';
						closeButtonPositionValue = { top: '14px', left: sidePostion };
                        break;
                    case 'left-bottom':
                        var sidePostion = closeBttnImageExist ? 30 + 'px' : 16 + 'px';
						closeButtonPositionValue = { bottom: '25px', left: sidePostion };
                        break;
                    case 'right-bottom':
                        var sidePostion = closeBttnImageExist ? 30 + 'px' : 16 + 'px';
						closeButtonPositionValue = { bottom: '25px', right: sidePostion };
                        break;
                    default:
                        var sidePostion = closeBttnImageExist ? 30 + 'px' : 20 + 'px';
						closeButtonPositionValue = { top: '14px', right: sidePostion };
                        break;
                }
            } else if (template == 'book' || template == 'food' || template == 'forest' || template == 'frozen' || template == 'holiday' || template == 'video') {
                switch( closeButtonPosition ) {
                    case 'left-top':
                        closeButtonPositionValue = { top: '14px', left: '14px' };
                        break;
                    case 'left-bottom':
                        closeButtonPositionValue = { bottom: '0', left: '14px' };
                        break;
                    case 'right-bottom':
                        closeButtonPositionValue = { bottom: '0', right: '14px' };
                        break;
                    default:
                        closeButtonPositionValue = { top: '14px', right: '14px' };
                        break;
                }
            } else if (template == 'image' || template == 'minimal') {
                switch(closeButtonPosition) {
                    case 'left-top':
                        if (enableFullScreen) {
                            closeButtonPositionValue = { right: '97% !important' };
                        } else {
                            var topDistance = -borderSize;
                            closeButtonPositionValue = {
                                top: topDistance + 'px',
                                left: -borderSize + 'px'
                            };
                        }
                        break;
                    case 'left-bottom':
                        if (enableFullScreen) {
                            closeButtonPositionValue = { top: '97%', right: '95%' };
                        } else {
                            var close_btn_pos = -35 - borderSize;
                            closeButtonPositionValue = {
                                bottom: close_btn_pos + 'px',
                                left: (-borderSize) + 'px'
                            };
                        }
                        break;
                    case 'right-bottom':
                        if (enableFullScreen) {
                        closeButtonPositionValue = { top: '97%', left: '95%' };
                        } else {
                            var close_btn_pos = -35 - borderSize;
                            closeButtonPositionValue = {
                                bottom: close_btn_pos + 'px',
                                right: (-borderSize) + 'px'
                            };
                        }
                        break;
                    default:
                        var sideDistance = 25 - borderSize;
                        closeButtonPositionValue = {
                            top: -borderSize + 'px',
                            right: sideDistance + 'px'
                        };
                        break;
                }
            } else if (template == 'notification') {
				switch(closeButtonPosition) {
					case 'left-top':
						closeButtonPositionValue = {top: '2px', left: '5px'};
						break;
					case 'left-bottom':
						closeButtonPositionValue = {bottom: '2px', left: '5px'};
						break;
					case 'right-bottom':
						closeButtonPositionValue = {bottom: '2px', right: '5px'};		
						break;
					default:
						closeButtonPositionValue = {top: '2px', right: '5px'};
						break;
				}
            }
            closeButtonPositionValue.position = 'absolute';
            if (template == 'coral') {
                $(document).find('.ays-pb-modal_' + id + ' .ays_coral_btn_close').css(closeButtonPositionValue);
            } else if (template == 'lil') {
                $(document).find('.ays-pb-modal_' + id + ' .ays_lil_btn-close .close-lil-btn').css(closeButtonPositionValue);
            } else if (template == 'yellowish') {
                $(document).find('.ays-pb-modal_' + id + ' .ays_yellowish_btn_close').css(closeButtonPositionValue);
            } else {
                $(document).find('.ays-pb-modal_' + id + ' .ays-pb-modal-close_' + id).css(closeButtonPositionValue);
            }
        }

        function setCloseButtonText(closeButtonText, closeButtonImage, id, template) {
			var currentCloseBttnContainer = $(document).find('div.ays-pb-modal-close_' + id );
			var defaultCloseIcon = '<svg class="ays_pb_material_close_icon" xmlns="https://www.w3.org/2000/svg" height="36px" viewBox="0 0 24 24" width="36px" fill="#000000" alt="Pop-up Close"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
			var timesCloseIcon = '<svg class="ays_pb_material_close_circle_icon" width="25px" height="25px" viewBox="0 -8 72 72" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><title>times</title><path d="M43.74,28,59,12.75a3.29,3.29,0,0,0,0-4.66L55.9,5a3.32,3.32,0,0,0-4.67,0L36,20.26,20.77,5.07a3.32,3.32,0,0,0-4.67,0L13,8.18a3.3,3.3,0,0,0,0,4.67L28.18,28,13,43.21a3.31,3.31,0,0,0,0,4.66L16.11,51a3.32,3.32,0,0,0,4.67,0L36,35.82,51.16,51a3.32,3.32,0,0,0,4.67,0l3.11-3.12a3.29,3.29,0,0,0,0-4.66Z"/></svg>';
			var yellowishCloseIcon = '<svg fill="#000" width="25px" height="25px" viewBox="0 -8 72 72" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><title>times</title><path d="M43.74,28,59,12.75a3.29,3.29,0,0,0,0-4.66L55.9,5a3.32,3.32,0,0,0-4.67,0L36,20.26,20.77,5.07a3.32,3.32,0,0,0-4.67,0L13,8.18a3.3,3.3,0,0,0,0,4.67L28.18,28,13,43.21a3.31,3.31,0,0,0,0,4.66L16.11,51a3.32,3.32,0,0,0,4.67,0L36,35.82,51.16,51a3.32,3.32,0,0,0,4.67,0l3.11-3.12a3.29,3.29,0,0,0,0-4.66Z"/></svg>';
            var minimalCloseIcon = '<svg class="ays_pb_material_close_circle_icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" alt="Pop-up Close"><path d="M0 0h24v24H0V0z" fill="none" opacity=".87"></path><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"></path></svg>';
            var lilCloseIcon = '    <svg width="20px" height="20px" class="svg-inline--fa fa-times fa-w-11 fa-2x lil_close_btn_x_font ays-pb-close-btn-color" aria-hidden="true" data-prefix="fa" data-icon="times" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" data-fa-i2svg=""><path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>';
			var text = '';
			var closeBttnContainerClass = '';

			switch(template) {
				case 'default':
				case 'image_type_img_theme':
                case 'facebook':
                case 'notification':
					if(closeButtonImage != ""){
						text = "<img class='close_btn_img' src='" + closeButtonImage + "' width='30' height='30'>";
					}else{
						if(closeButtonText === '✕'){
							text = defaultCloseIcon;
						}else{
							text = closeButtonText;
						}
					}
					currentCloseBttnContainer.html(text);
					break;
				case 'win98':
					text = closeButtonText;
                    if(closeButtonText === '✕'){
                        text = 'x';
                    } else {
                        text = closeButtonText;
                    }
					currentCloseBttnContainer.find('span').html(text);
					break;
				case 'lil':
					if(closeButtonImage != ""){
						text = "<img class='close_btn_img' src='" + closeButtonImage + "' width='50' height='50'>";
					}else{
						text = lilCloseIcon;
						if(closeButtonText != '✕'){
							closeBttnContainerClass = 'close-lil-btn-text';
						}
					}
					currentCloseBttnContainer.find('a').addClass(closeBttnContainerClass);
					currentCloseBttnContainer.find('a').html(text);
					break;
				case 'image':
				case 'template':
				case 'minimal':
				case 'video':
				case 'forest':
				case 'food':
				case 'book':
				case 'frozen':
				case 'holiday':
					if(closeButtonImage != ""){
						text = "<img class='close_btn_img' src='" + closeButtonImage + "' width='30' height='30'>";
					}else{
                        if (template == 'minimal' && closeButtonText == '✕') {
                            text = minimalCloseIcon;
                        } else {
                            text = closeButtonText;
                        }
					}
                    if (template == 'video') {
					currentCloseBttnContainer.html(text);
                    } else {
                        currentCloseBttnContainer.find('div').html(text);
                    }
					break
				case 'yellowish':
				case 'coral':
				case 'peachy':
					if(closeButtonImage != ""){
						text = "<img class='close_btn_img' src='" + closeButtonImage + "' width='30' height='30'>";
					} else {
                        if (closeButtonText == '✕') {
                            if (template == 'yellowish') {
                                text = yellowishCloseIcon;
                            } else {
                                text = timesCloseIcon;
                            }
                        } else {
                            text = closeButtonText;
                        }
                    }
                    currentCloseBttnContainer.find('a').html(text);
					break
			}
		}

	});

    function updatePopupConversions(id) {
        $.ajax({
            url: pb_public.ajax,
            method: 'POST',
            dataType: 'text',
            data: {
                id: id,
                action: 'ays_increment_pb_conversions',
            },
        });
    }
})( jQuery );

function set_cookies( cname, cvalue, exdays ) {
    var expires = 'expires=' +  (new Date(Date.now() + exdays)).toUTCString();  
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

window.onload = function(){
	var classList = document.body.classList;
	document.ontouchmove = function(e){
    	for( var i = 0; i < classList.length; i++ ){
    		if( classList[i].startsWith('pb_disable_scroll_') ){
    			if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                    e.preventDefault(); 
    			}
    			break;
    		}
    	}
	}
}