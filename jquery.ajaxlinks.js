/* Ajaxlinks jQuery plugin */
/* Home page and demo: http://sternoru.github.com/ajaxlinks/ */
(function($) {
    $.fn.ajaxlinks = function(newConfig) {
    	var defaultConfig = {
    		load_to: '#content',
			load_from: null,
			loader: '<span>Loading...</span>',
			callback: null,
			use_sammy: false,
			prefix: '',
			smooth_height: true
    	};    	
    	var config = $.extend(defaultConfig, newConfig);
    	config.links = this;    	
		var prevURL = '';
		var loadCall = function(href) {
		    var params = {};
		    if(typeof($.sammy) == 'function' && config.use_sammy == true) {
		    	var splitPath = href.split('|');			
				for(var i = 0, ln = splitPath.length; i < ln; i++) {
					var temp = splitPath[i].split('=');
					params[temp[0]] = temp[1];
				}	
		    }
		    else {
		    	params.path = href;
		    }
			var ajaxCallback = function() {
				// unfix container's height to adjust it to newly loaded content.
				// I placed it before the callback in case user is overriding the height.
				if (config.smooth_height)
				{
					$load_to.height('auto');
				}
				if(!config.callback) {
					return;
				}
				var content = $(this).html();
				var link = config.links.filter('[href*="'+href+'"]');
	            config.callback(content, link, params);
	        };			            
			if(prevURL != params.path) {
				prevURL = params.path;
				var path = config.load_from ? [params.path, config.load_from, ' *'].join(' ') : params.path,
					$load_to = $(config.load_to);
				// fix container's height to avoid the glitch
				if (config.smooth_height)
				{
					$load_to.height($load_to.height());
				}
				$load_to.html($(config.loader)).load(path, ajaxCallback);
			}
			else {
				ajaxCallback();
			}
        };
		
        if(typeof($.sammy) == 'function' && config.use_sammy == true) {
            if($.sammy.apps == undefined) {
				var app = $.sammy(function(){
					this.get(/\#!(.*)/, function(context){
						loadCall(window.location.href.split('#!')[1]);
					});
				});
                
				$(function() {
	                app.run();
	            });
			}
            			
            this.each(function(i, item) {
                var linkHref = $(item).attr('href');
                
                if(linkHref != undefined && linkHref.indexOf('#!') == -1) {
                    $(item).attr('href', [
                        config.prefix,
                        '#!path=',
                        linkHref
                    ].join(''));
                }
            });
        }
        else {
            this.each(function(i, item) {
                $(item).bind('click', function() {
            		loadCall($(this).attr('href'));
            		return false;
            	});
        	});
    	}
    };
})(jQuery);