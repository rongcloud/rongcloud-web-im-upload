(function(win){
		function uploadTencent(file, opts, callback) { 
		if (file.size && opts.chunk_size < file.size) {
			uploadNextChunk(file, opts, callback);
		}else{
			var data = opts['data'](file, opts);
			if (typeof data == 'object') {
				opts.refreshSign(function(item){
		           	opts.query['sign'] = item.sign;
					opts.domain = item.path;        
					opts.domain += "/" + encodeURIComponent(file.name);
					opts.filesize = file.size;
					uploadData(data, opts, callback);
		        });
			}else{
				uploadData(data, opts, callback);
			}
			
		}
	}

	function uploadData(data, options, callback) {
		// TODO 兼容
		var xhr = new XMLHttpRequest(),interval = 0;
		if (xhr.upload && options.support_options && !options.slice) {
			xhr.upload.onprogress = function (event) {
				callback.onProgress(event.loaded, event.total, Math.floor(event.loaded / event.total * 100) );
			};
		}else{
			var loaded = 0;
			interval = setInterval(function(){
				if (loaded < 95) {
					callback.onProgress(loaded * options.filesize / 100, options.filesize);
					loaded++;
				}else{
					clearInterval(interval);
				}
			},1000);
		}
		
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4) {
	            if (xhr.status == 200) {
	           	 	if (xhr.responseText) {
	           	 		callback.onCompleted(xhr.responseText);
	           	 		if(interval){
	           	 			clearInterval(interval);
	           	 			callback.onProgress(options.filesize, options.filesize);
	           	 		}
	           	 	}else{
	           	 		callback.onError('error');
	           	 		clearInterval(interval);
	           	 	}
	            }
	       }
		};

		var url = options.domain;
		mEach(options.query, function(key, value){
			if (url.indexOf('?') == -1){
				 url += '?' + key + '=' + encodeURIComponent(value);
			} else {
				 url += '&' + key + '=' + encodeURIComponent(value)
			}
		});
		xhr.open(options.method, url, true);
		mEach(options.headers, function(key, value){
			xhr.setRequestHeader(key, value);
		});
		xhr.send(data);
	}

	function mEach(m, callback){
		for(var key in m){
			callback(key, m[key]);
		}
	}

	function uploadNextChunk(file, opts, callback){
		var reader = new FileReader();
		reader.onload = function(e){
	        if(e.target.result != null) {
	            g_totalSize += e.target.result.length;
	            if (e.target.result.length != 0) {
	            	if(!Qh){
	            		Qh = swfobject.getObjectById("qs");
	            	}
	                Qh.ftn_sign_update_dataurl(e.target.result);
	            }
	        }
	        g_currentChunk += 1;
	        if (g_currentChunk <= g_chunks ) {
	            if (g_iDelayReadData > 0) clearTimeout(g_iDelayReadData);
	            if (g_LoadFileDelayTime > 0){
	                g_iDelayReadData = setTimeout(nextSlice, g_LoadFileDelayTime);
	            }else{
	                g_iDelayReadData = 0;
	                nextSlice();
	            }
	        }else {
	            g_running = false;
	            var sha1 = Qh.ftn_sha1_result();
	            //result.path, result.sign
	            opts.refreshSign(function(result){
	            	var session = '';
	            	var sliceSize = 0;
	            	var offset = 0;

					var url = result.path + "/" + encodeURIComponent(file.name) + "?sign=" + encodeURIComponent(result.sign);
					var formData = new FormData();
					formData.append('op', 'upload_slice');
					formData.append('sha', sha1);
					formData.append('filesize', file.size);
					formData.append("slice_size", opts.chunk_size);
					
					if(opts.multi_parmas.insertOnly === 0){
						formData.append('insertOnly', opts.multi_parmas.insertOnly);
					}
					var getSessionSuccess = function(result){
						var jsonResult = JSON.parse(result);
						if(jsonResult.data.access_url){
							callback.onProgress(Math.floor(file.size/2), file.size);
							callback.onProgress(file.size, file.size);
							callback.onCompleted(result);
							return;
						}
						session = jsonResult.data.session;
						sliceSize = jsonResult.data.slice_size;
						offset = jsonResult.data.offset
						sliceUpload();
					};
					var sliceUpload = function(){
						opts.refreshSign(function(result){
							var url =  result.path + "/" + encodeURIComponent(file.name) + "?sign=" + encodeURIComponent(result.sign);
							var formData = new FormData();
							formData.append('op', 'upload_slice');
							formData.append('session', session);
							formData.append('offset', offset);
							formData.append('fileContent', file.slice(offset, offset + sliceSize));
							uploadData(formData, {
								support_options : opts.support_options,
								headers : {},
								query: {},
								method : 'POST',
								domain : url,
								slice : true
							}, {
								onProgress:function(){},
								onCompleted:sliceUploadSuccess,
								onError:function(){
									console.log('slice error.');
								}
							});
						});
					};
					var sliceUploadSuccess = function(result){
						var jsonResult = JSON.parse(result);
						if(jsonResult.data.offset != undefined){
							callback.onProgress(offset, file.size);
							offset = jsonResult.data.offset + sliceSize;
							sliceUpload();
						}
						else{
							callback.onProgress(file.size, file.size);
							callback.onCompleted(result);
							return;
						}
					};

					uploadData(formData, {
						support_options : opts.support_options,
						headers : {},
						query: {},
						method : 'POST',
						domain : url,
						slice:true
					}, {
						onProgress:function(){},
						onCompleted:getSessionSuccess,
						onError:function(){
							console.log('slice error.');
						}
					});
				});
	        }
		};

		reader.onerror = callback.onError();
		var Qh = swfobject.getObjectById("qs");
	    var g_LoadFileBlockSize = 2 * 1024 * 1024;
	    var g_LoadFileDelayTime = 0;
	    var g_chunkId = null;
	    var g_totalSize = 0;
	    var g_uniqueId = "chunk_" + (new Date().getTime());
	    var g_chunks = Math.ceil(file.size / g_LoadFileBlockSize);
	    var g_currentChunk = 0;
	    var g_running = true;
	    var g_startTime = new Date().getTime();
	    var g_iDelayReadData = 0;

	  	var nextSlice = function(i, sliceCount){
		    var start = 0;
		    var end = 0;
		    start = g_currentChunk * g_LoadFileBlockSize;
		    if(file != null) {
		        end = ((start + g_LoadFileBlockSize) >= file.size) ? file.size : start + g_LoadFileBlockSize;
		        reader.readAsDataURL(file.slice(start, end));
		    }
	    };
	    nextSlice();
	}
	win.uploadProcess = uploadTencent;
})(window)