(function(win) {

	var dataType = {
		form: getFormData,
		json: getJsonData,
		data: getData
	};

	function genUId() {
		var date = new Date().getTime();
		var uuid = 'xxxxxx4xxxyxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (date + Math.random() * 16) % 16 | 0;
			date = Math.floor(date / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid;
	};

	function mergeOption(opts) {
		var options = {
			domain: '',
			method: 'POST',
			file_data_name: 'file',
			unique_key: 'key',
			base64_size: 4 * 1024 * 1024,
			chunk_size: 4 * 1024 * 1024,
			headers: {},
			multi_parmas: {},
			query: {},
			support_options: true,
			data: dataType.form,
			genUId: genUId
		};
		if (!opts || !opts.domain) {
			throw new Error('domain is null');
		}
		for (var key in opts) {
			options[key] = opts[key];
		}
		return options;
	}

	function mEach(m, callback) {
		for (var key in m) {
			callback(key, m[key]);
		}
	}

	function getFormData(file, opts) {
		var form = new FormData();
		if (opts.unique_key) {
			var suffix = file.name.substr(file.name.lastIndexOf('.'));
			var unique_value = genUId() + suffix;
			form.append(opts.unique_key, unique_value);
			opts.unique_value = unique_value;
		}
		form.append(opts.file_data_name, file);
		mEach(opts.multi_parmas, function(key, value) {
			form.append(key, value);
		});
		return form;
	}

	function getJsonData(file, opts) {
		var data = {};
		if (opts.unique_key) {
			var suffix = file.name.substr(file.name.lastIndexOf('.'));
			var unique_value = genUId() + suffix;
			data[opts.unique_key] = unique_value;
			opts.unique_value = unique_value;
		}
		data[opts.file_data_name] = file;
		mEach(opts.multi_parmas, function(key, value) {
			data[key] = value;
		});
		return JSON.stringify(data);
	}

	function getData(file, opts) {
		return file;
	}

	function Upload(options) {
		this.options = mergeOption(options);

		this.setOptions = function(opts) {
			var me = this;
			mEach(opts, function(key, value) {
				me.options[key] = value;
			});
		};

		this.upload = function(file, callback) {
			if (!file) {
				callback.onError('upload file is null.');
				return;
			}
			var me = this;
			uploadProcess(file, this.options, {
				onProgress: function(loaded, total) {
					callback.onProgress(loaded, total);
				},
				onCompleted: function(data) {
					callback.onCompleted(data);
				},
				onError: function(errorCode) {
					callback.onError(errorCode);
				},
				onOpen: function(xhr) {
					me.xhr = xhr;
				}
			});
		};

		this.cancel = function() {
			this.xhr && this.xhr.abort();
		};
	}

	function init(options) {
		return new Upload(options);
	}

	function getResizeRatio(imageInfo,config){
		//hasOwnProperty?

		var ratio = 1;

		var oWidth = imageInfo.width;
		var maxWidth = config.maxWidth || 0;
		if(maxWidth > 0 &&  oWidth > maxWidth){
			ratio = maxWidth/oWidth;
		}

		var oHeight = imageInfo.height;
		var maxHeight = config.maxHeight || 0;
		if(maxHeight > 0 && oHeight > maxHeight){
			var ratioHeight = maxHeight/oHeight;
			ratio = Math.min(ratio,ratioHeight);
		}


		var maxSize = config.maxSize || 0;
		var oSize = Math.ceil(imageInfo.size/1000); //K，Math.ceil(0.3) = 1;
		if(oSize > maxSize){
			ratioSize = maxSize/oSize;
			ratio = Math.min(ratio,ratioSize);
		}

		return ratio;
	}

	function resize(file, config, callback){
		//file对象没有高宽
		config = config || {};
		config.originType = file.type; //image format;

		var reader = new FileReader();

    	reader.readAsDataURL(file);
		reader.onload = function(evt){
			var imageData = evt.target.result;
			config._total = evt.total; //获取图片体积
			resizeBase64(imageData, config, callback);
		}
	}

	function resizeBase64(imageData, config, callback){
		/*
		imageData format = "data:image/jpeg;base64,/9j/………………………………"
		*/ 
		config = config || {};
		config.originType = imageData.split(";")[0].split("data:")[1]; //image format;

		config._total = imageData.length*0.75  //base64体积用字符串长度期待，貌似有问题

		compress(imageData, config, callback);
	}

	//所有的压缩裁剪，都不过是绘制和导出，只是尺寸和坐标不同
	function compress(imageData, config, callback){
		var img = new Image();
		img.src  = imageData;

		//通过加载渲染获取高宽
		img.onload = function(){
			var width = img.width;
			var height = img.height;
			var imageInfo = {
				width : width,
				height : height,
				size : config._total
			}

			//获取压缩比例
			var ratio = getResizeRatio(imageInfo,config);
			if(ratio >= 1){
				callback(imageData);
				return;
			}

			width = width*ratio;
			height = height*ratio;
			var canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;

			var context = canvas.getContext('2d');
				context.drawImage(img, 0, 0, width, height);

			/*
			If the height or width of the canvas is 0, the string "data:," is returned.
			If the requested type is not image/png, but the returned value starts with data:image/png, then the requested type is not supported.
			Chrome also supports the image/webp type.
			*/ 

			var supportTypes = {
				"image/jpeg" : true,
				"image/png" : true,
				"image/webp" : supportWebP()
			};
			var exportType = config.type || config.originType;
			if(!supportTypes[exportType]){
				exportType = "image/png";
			} 
			var newImageData = canvas.toDataURL(exportType);
			callback(newImageData);
		}
	}

	function supportWebP(){
		try{
    		return (canvas.toDataURL('image/webp').indexOf('data:image/webp') == 0);
		}catch(err) {
	        return  false;
	    }
	}

	win.UploadFile = {
		init: init,
		dataType: dataType,
		resize : resize,
		resizeBase64 : resizeBase64
	};
})(window);