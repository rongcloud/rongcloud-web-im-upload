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

	win.UploadFile = {
		init: init,
		dataType: dataType
	};
})(window);