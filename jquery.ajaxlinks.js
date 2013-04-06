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
			smooth_height: true,
			goto_top: false,
			fix_forms: true,
			add_scripts: false,
			ajaxify_content: false,
			base_url: '/',
			ignore: '.no-al',
			ignore_paths: ''
    	};
    	var config = $.extend(defaultConfig, newConfig);
		// Removing the links that should be ignored
		if(config.ignore != '') {
			if(typeof(config.ignore) == "string") {
				config.ignore = [config.ignore, ' a, a', config.ignore].join('');
			}
			else {
				var tmp = '';
				for(i = 0, ln = config.ignore.length; i < ln; i++) {
					tmp = [tmp, i > 0 ? ', ' : '', config.ignore[i], ' a, a', config.ignore[i]].join('');
				};
				config.ignore = tmp;
			}
		}
		// Removing the links having paths that should be ignored
		var createFilter = function(path) {
			var tmp = 'a[href';
			if(path.substr(0, 1) == '*') {
				if(path.substr(path.length - 1, 1) == '*') {
					tmp = [tmp, '*='].join('');
				}
				else {
					tmp = [tmp, '$='].join('');
				}
			}
			else if(path.substr(path.length - 1, 1) == '*') {
				tmp = [tmp, '^='].join('');
			}
			else {
				tmp = [tmp, '='].join('');
			}
			return [tmp, path.replace(/\*/g, '').replace(/[#;&,.+~':"!^$[\]()=>|\/]/g, '\\$&'), ']'].join('');
		};
		if(config.ignore_paths != null && config.ignore_paths != '') {
			if(typeof(config.ignore_paths) == "string") {
				config.ignore_paths = createFilter(config.ignore_paths);
			}
			else {
				var tmp = '';
				for(i = 0, ln = config.ignore_paths.length; i < ln; i++) {
					tmp = [tmp, i > 0 ? ', ' : '', createFilter(config.ignore_paths[i])].join('');
				};
				config.ignore_paths = tmp;
			}
		}
		config.links = $(this).filter(":not('" + config.ignore + ', ' + config.ignore_paths + "')");
		var prevURL = '';
		var loadCall = function(href) {
		    if(config.goto_top) {
				window.scrollTo(0, 0);
			}
			var params = {};
		    if(typeof($.sammy) == 'function' && config.use_sammy == true) {
		    	var splitPath = href.split('|');			
				for(var i = 0, ln = splitPath.length; i < ln; i++) {
					var temp = splitPath[i].split('=');
					if(temp.length > 2) {
						var temp2 = temp[1];
						for(i = 2; i < temp.length; i++) {
							var temp2 = [temp2, '=', temp[i]].join('');
						}
						params[temp[0]] = temp2;
					}
					else {
						params[temp[0]] = temp[1];
					}
				}	
		    }
		    else {
		    	params.path = href;
		    }
			var parseScript = function(strcode) {
				var scripts = new Array();         // Array which will store the script's code
				
				// Strip out tags
				while(strcode.indexOf("<script") > -1 || strcode.indexOf("</script") > -1) {
					var s = strcode.indexOf("<script");
					var s_e = strcode.indexOf(">", s);
					var e = strcode.indexOf("</script", s);
					var e_e = strcode.indexOf(">", e);

					// Add to scripts array
					scripts.push(strcode.substring(s_e+1, e));
					// Strip from strcode
					strcode = strcode.substring(0, s) + strcode.substring(e_e+1);
				}
				
				return scripts;
			};
			var ajaxCallback = function(response, status, xhr) {
				$(config.load_to).addClass('ajax-loaded');
				// unfix container's height to adjust it to newly loaded content.
				// I placed it before the callback in case user is overriding the height.
				if (config.smooth_height)
				{
					$load_to.height('auto');
				}
				var content = $(this).html();
				if(config.load_from && response) {
					if($(this).find(config.load_from).length > 0) { // load inner html instead of container
						content = $(this).find(config.load_from).html();
						$load_to.html(content);				
					}
					else { // load the whole response if load_from selector not found
						content = response;
						$load_to.html(content);
					}
				}
				if(config.fix_forms) {
					$('[action="."]').attr('action', href.replace('path=', ''));
				}
				if(config.add_scripts) {
					// Get the scripts src and callbacks
					var scripts = new Array(),
						tmp = response,
						callCB = function(cb) {
							setTimeout([cb, '();'].join(''), 100);
						},
						compare = function(x, y) {
							if(x === y) { // For reference types : returns true if x and y points to same object
								return true;
							}
							if(x.length != y.length) {
								return false;
							}
							for(key in x) {
								if(x[key] !== y[key]) { // !== So that the the values are not converted while comparison
									return false;
								}
							}
							return true;
						},
						uniqueArr = function(a) {
							temp = new Array();
							for(i = 0; i < a.length; i++) {
								if(!contains(temp, a[i])) {
									temp.length += 1;
									temp[temp.length - 1] = a[i];
								}
							}
							return temp;
						},
						contains = function(a, e) {
							for(j = 0; j < a.length; j++) {
								if(compare(a[j], e)) {
									return true;
								}
							}
							return false;
						};
					
					while(tmp.indexOf('<script ') > -1 && tmp.indexOf('></script>') > -1) {
						var s = tmp.indexOf('<script ');
						var e = tmp.indexOf('</script>', s);
						
						// Add to scripts array
						if(tmp.substring(s, e).indexOf('src=') > -1) {
							var src_s = tmp.indexOf('src=', s) + 5;
							var sep = tmp.substring((src_s - 1), src_s);
							var src_e = tmp.indexOf(sep, src_s);
							var script = tmp.substring(src_s, src_e);
							
							if(tmp.substring(s, e).indexOf('data-callback=') > -1) {
								var cb_s = tmp.indexOf('data-callback=', s) + 15;
								var sep = tmp.substring((cb_s - 1), cb_s);
								var cb_e = tmp.indexOf(sep, cb_s);
								var script = [script, tmp.substring(cb_s, cb_e)];
							}
							
							scripts.push(script);
						}
						// Strip from tmp
						tmp = tmp.substring(0, s) + tmp.substring(e + 9);
					}
					
					// Remove the duplicated scripts
					uniqueArr(scripts);
					
					// Load the files that aren't already loaded and call the callbacks of those that are if any
					for(var i = 0, ln = scripts.length; i < ln; i++) {
						if(typeof(scripts[i]) != "string") {
							var src = scripts[i][0];
							var cb = scripts[i][1];
						}
						else {
							var src = scripts[i];
							var cb = false;
						}
						
						if($(['head script[src*="', src, '"]'].join('')).length == 0) {
							$.ajax({
								url: src,
								dataType: 'script',
								cache: true,
								async: false
							});
						}
						else if(cb) {
							callCB(cb);
						}
					}
				}
				if(config.ajaxify_content) {
					manageLinks($(config.load_to).find('a').filter(":not('" + config.ignore + ', ' + config.ignore_paths + "')"));
				}
				if(config.callback) {
					var link = config.links.filter('[href*="'+href+'"]');
					var scripts = parseScript(response);
					config.callback(content, link, params, scripts);
				}
	        };			            
			prevURL = params.path;
			var path = config.load_from ? [params.path, config.load_from].join(' ') : params.path,
				$load_to = $(config.load_to);
			// fix container's height to avoid the glitch
			if(config.smooth_height)
			{
				$load_to.height($load_to.height());
			}
			$load_to.html($(config.loader)).load(path, ajaxCallback);				
        };
		
		var manageLinks = function(links) {
			var isExternal = function(url) {
				return !(url.indexOf(location.href.replace('http://', '').replace('https://', '').split('/')[0]) > -1);
			};
			
			if(config.use_sammy) {
				links.each(function(i, item) {
					var linkHref = $(item).attr('href');
					
					if(linkHref != undefined && linkHref.indexOf('#!') == -1 && !isExternal($(item)[0].href)) {
						$(item).attr('href', [
							config.base_url,
							config.prefix,
							'#!path=',
							linkHref
						].join(''));
					}
				});
			}
			else {
				links.each(function(i, item) {
					if(!isExternal($(item)[0].href)) {
						$(item).data('al', 'true');
						$(item).bind('click', function() {
							loadCall($(this).attr('href'));
							return false;
						});
					}
				});
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
            
			manageLinks(config.links);
        }
        else {
            manageLinks(config.links);
    	}
    };
})(jQuery);