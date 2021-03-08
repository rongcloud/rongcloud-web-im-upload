(function(win) {
	var uploadFile, uploadOptions, isStreamUpload;
	var uploadOrderObject = {
		'qiniu': uploadQiniu,
		'baidu': uploadBos,
		'aliyun': uploadAliyun,
		's3': uploadS3,
		'stc': uploadStc
	};
	var uploadOrderList = [];
	var Conf = {
		BOS_CHUNCK_SIZE: 5 * 1024 * 1024 * 1024, // 上传超过5GB大小的文件
	}
	var PROTOCOL_HTTP = 'http://', PROTOCOL_HTTPS = 'https://';
	function forEach(m, callback) {
		for (var key in m) {
			callback(key, m[key]);
		}
	}
	function getProtocol() {
		var protocol = PROTOCOL_HTTPS;
		if(location.protocol == 'http:' || location.protocol == 'file:'){
			protocol = PROTOCOL_HTTP;
		}
		return protocol;
	}
	function buildUrl(url, items) {
		var query = '';
		forEach(items, function(name, value) {
			if (name != 'token') {
				query += (query ? '&' : '') + encodeURIComponent(name) + '=' + encodeURIComponent(value);
			}
		});

		if (query) {
			url += (url.indexOf('?') > 0 ? '&' : '?') + query;
		}

		return url;
	}
    //判断是否为图片
	function isPictrue(fileName){
		if(!fileName) return false;
		let imgPatterns=['bmp','jpg','png','tif','gif','pcx','tga','exif','fpx','svg','psd','cdr','pcd','dxf','ufo','eps','ai','raw','wmf','jpeg'];
		let index=fileName.lastIndexOf(".");
		if(!index) return false;
		let suffix=fileName.substr(index+1);
		if(imgPatterns.includes(suffix)) return true;
		else return false;
	}
	function encode2UTF8(argString) {
		if (argString === null || typeof argString === 'undefined') {
			return '';
		}
		var string = (argString + ''); // .replace(/\r\n/g, '\n').replace(/\r/g, '\n');
		var utftext = '',
			start, end, stringl = 0;
		start = end = 0;
		stringl = string.length;
		for (var n = 0; n < stringl; n++) {
			var c1 = string.charCodeAt(n);
			var enc = null;

			if (c1 < 128) {
				end++;
			} else if (c1 > 127 && c1 < 2048) {
				enc = String.fromCharCode(
					(c1 >> 6) | 192, (c1 & 63) | 128
				);
			} else if (c1 & 0xF800 ^ 0xD800 > 0) {
				enc = String.fromCharCode(
					(c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
				);
			} else { // surrogate pairs
				if (c1 & 0xFC00 ^ 0xD800 > 0) {
					throw new RangeError('Unmatched trail surrogate at ' + n);
				}
				var c2 = string.charCodeAt(++n);
				if (c2 & 0xFC00 ^ 0xDC00 > 0) {
					throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
				}
				c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
				enc = String.fromCharCode(
					(c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
				);
			}
			if (enc !== null) {
				if (end > start) {
					utftext += string.slice(start, end);
				}
				utftext += enc;
				start = end = n + 1;
			}
		}

		if (end > start) {
			utftext += string.slice(start, stringl);
		}

		return utftext;
	}
	// Copy 七牛 SDK 方法
	function encode2Base64(data) {
		var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
			ac = 0,
			enc = '',
			tmp_arr = [];

		if (!data) {
			return data;
		}

		data = encode2UTF8(data + '');

		do { // pack three octets into four hexets
			o1 = data.charCodeAt(i++);
			o2 = data.charCodeAt(i++);
			o3 = data.charCodeAt(i++);

			bits = o1 << 16 | o2 << 8 | o3;

			h1 = bits >> 18 & 0x3f;
			h2 = bits >> 12 & 0x3f;
			h3 = bits >> 6 & 0x3f;
			h4 = bits & 0x3f;

			// use hexets to index into b64, and append result to encoded string
			tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
		} while (i < data.length);

		enc = tmp_arr.join('');

		switch (data.length % 3) {
			case 1:
				enc = enc.slice(0, -2) + '==';
				break;
			case 2:
				enc = enc.slice(0, -1) + '=';
				break;
		}
		return enc;
	}
	// Copy 七牛 SDK 方法
	function URLSafeBase64Encode(v) {
		v = encode2Base64(v);
		return v.replace(/\//g, '_').replace(/\+/g, '-');
	}

	function chunkLastStep(data, opts, callback) {
		// 七牛 URL 规定
		var key = '/key/' + URLSafeBase64Encode(data.filename);
		var fname = '/fname/' + URLSafeBase64Encode(data.filename);
		var url = opts.domain + '/mkfile/' + data.size + key + fname;
		var options = {
			domain: url,
			method: 'POST',
			headers: {
				'Content-Type': 'application/octet-stream'
			},
			multi_parmas: opts.multi_parmas,
			support_options: true,
      stream: true,
      uploadHost: opts.uploadHost
		};
		uploadQiniu(data.ctx, options, {
			onCompleted: function(res) {
				res.filename = data.filename;
				res.name = data.name;
				callback.onCompleted(res);
			},
			onError: function() {
				throw new Error('qiniu uploadChunk error');
			},
			onProgress: function(chunkLoaded, total) {},
			onOpen: function(xhr) {
				callback.onOpen(xhr);
			}
		}, uploadFile);
	}

	var offset = 0,
		ctxStore = {};

	function uploadNextChunk(blob, opts, callback) {
		var chunk = Math.ceil(offset / opts.chunk_size),
			chunks = Math.ceil(blob.size / opts.chunk_size),
			curChunkSize = Math.min(opts.chunk_size, blob.size - offset),
			chunkBlob = blob.slice(offset, offset + curChunkSize),
			chunkInfo = {
				chunk: chunk,
				chunks: chunks,
				name: blob.uniqueName
			};
		forEach(chunkInfo, function(key, value) {
			opts.multi_parmas[key] = value;
		});
		opts.filesize = blob.size;
		opts.headers = {
			'Content-Type': 'application/octet-stream'
		};
		opts.isChunk = true;
		uploadQiniu(chunkBlob, opts, {
			onCompleted: function(chunkRes, isBosUploadSuccess) {
				if(isBosUploadSuccess){
					callback.onCompleted(chunkRes);
					return;
				}
				offset += curChunkSize;
				// callback.onProgress(Math.floor((chunk + 1) / chunks * blob.size), blob.size);
				ctxStore[blob.uniqueName] = ctxStore[blob.uniqueName] || [];
				ctxStore[blob.uniqueName].push(chunkRes.ctx);
				if (offset < blob.size) {
					if (chunkRes.ctx) {
						uploadNextChunk(blob, opts, callback);
					}else{
						offset = 0;
						delete ctxStore[blob.uniqueName]
					}
				} else {
					offset = 0;
					delete opts.isChunk;
					delete opts.headers['Content-Type'];
					forEach(chunkInfo, function(key, value) {
						delete opts.multi_parmas[key];
					});
					var ctx = ctxStore[blob.uniqueName].join(',');
					var data = {
						ctx: ctx,
						name: blob.name,
						size: blob.size,
						filename: blob.uniqueName
					};
					chunkLastStep(data, opts, callback);
				}
			},
			onError: function() {
				throw new Error('qiniu uploadChunk error');
			},
			onProgress: function(chunkLoaded, total, isBosProcess) {
				var loaded = chunkLoaded + offset;
				callback.onProgress(loaded, opts.filesize, isBosProcess);
			},
			onOpen: function(xhr) {
				callback.onOpen(xhr);
			}
		}, uploadFile);
	}

	function uploadBos(data, options, callback, file) {
		console.log(file, options)
		if (file.size > Conf.BOS_CHUNCK_SIZE) {
			throw('the file size is over 5GB!')
		}
		var params = options || {};
		var options = options || uploadOptions;
		var xhr = new XMLHttpRequest();
		var protocol = getProtocol();
		if (!params.uploadHost.bos && !params.bosUploadPath) {
			return
		}
		var url = protocol + uploadOrderList[0][1] + params.bosUploadPath;
		uploadOrderList.shift()
		var bosHeader = params.bosHeader || {};
		var resData = {
			filename: options.unique_value || file.uniqueName,
			name: file.name,
			downloadUrl: url,
			isBosRes: true
		};
		if (xhr.upload && options.support_options) {
			xhr.upload.onprogress = function(event) {
				callback.onProgress(event.loaded, event.total, true);
			};
		}
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var result = xhr.responseText || "{}";
				result = JSON.parse(result);
				result.filename = options.unique_value;
				if(xhr.status === 200) {
					var isBosUploadSuccess = true;
					callback.onCompleted(resData, isBosUploadSuccess);
				} else if (uploadOrderList.length) {
					uploadOrderObject[uploadOrderList[0][0]](data, options, callback, file)
				} else {
					callback.onError('upload fail')
				}
			}
		};
		xhr.open(options.method, url, true);
		xhr.setRequestHeader('authorization', bosHeader.bosToken);
		xhr.setRequestHeader('x-bce-date', bosHeader.bosDate);
		xhr.send(file);
	}

	function uploadQiniu(data, options, callback, file) {
		var issuedQnUploadHost = PROTOCOL_HTTPS + options.uploadHost.qiniu;
		if (isStreamUpload) {
			var url =  getProtocol() + options.domain
		} else {
			var url = getProtocol() + uploadOrderList[0][1] || issuedQnUploadHost;
		}
		
		if (!isStreamUpload) {
			uploadOrderList.shift()
		}
		var xhr = new XMLHttpRequest();
		if (xhr.upload && options.support_options) {
			xhr.upload.onprogress = function(event) {
				callback.onProgress(event.loaded, event.total);
			};
		}

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var result = xhr.responseText || "{}";
				result = JSON.parse(result);
				result.filename = options.unique_value;
				result.uploadMethod = RongIMLib.UploadMethod ? RongIMLib.UploadMethod.QINIU :''
				if(xhr.status === 200){
					callback.onCompleted(result);
				} else if (uploadOrderList.length) {
					uploadOrderObject[uploadOrderList[0][0]](data, options, callback, file)
				} else {
					callback.onError('upload fail')
				}
			}
		};
		
		if (options.isChunk) {
			url += '/mkblk/' + data.size;
			url = buildUrl(url, options.multi_parmas);
		}
		xhr.open(options.method, url, true);

		callback.onOpen(xhr);

		if (options.stream) {
			xhr.setRequestHeader('authorization', 'UpToken ' + options.multi_parmas.token);
		}

		forEach(options.headers, function(key, value) {
			xhr.setRequestHeader(key, value);
		});
		xhr.send(data);
	}

	function uploadAliyun(data, options, callback, file) {
		if (file.size > Conf.BOS_CHUNCK_SIZE) {
			throw('the file size is over 5GB!')
		}
		const cloneData = new FormData();
		cloneData.set('file', data.get('file'));
		cloneData.set('key', data.get('key'));
		cloneData.set('token', data.get('token'));
		const aliHost = uploadOrderList[0][1]
		uploadOrderList.shift()
		var options = options || {};
		var data = data || uploadFile;
		var options = options || uploadOptions;
		var xhr = new XMLHttpRequest();
		var protocol = getProtocol();
		var url = protocol + options.ossBucketName + '.' + aliHost;
		if (xhr.upload && options.support_options) {
			xhr.upload.onprogress = function(event) {
				callback.onProgress(event.loaded, event.total);
			};
		}

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var result = xhr.responseText || "{}";
				result = JSON.parse(result);
				result.name = options.unique_value;
				result.filename = options.uploadFileName; // 上传文件名
				result.uploadMethod = RongIMLib.UploadMethod ? RongIMLib.UploadMethod.ALI : '';
				if(xhr.status === 200){
					callback.onCompleted(result);
				} else if (uploadOrderList.length) {
					uploadOrderObject[uploadOrderList[0][0]](cloneData,  options, callback, file)
				} else {
					callback.onError('upload fail')
				}
			}
		};
		xhr.open(options.method, url, true);
		console.log("ali:url",url)
		var aliHeader = options.aliHeader || {};
		data.set('OSSAccessKeyId', aliHeader.osskeyId)
		data.set('policy', aliHeader.ossPolicy)
		data.set('Signature', aliHeader.ossSign)
		data.set('success_action_status', 200)
		data.delete('key')
		data.append('key', options.uploadFileName) // 阿里上传时传的文件名必须和获取认证时传的 key 一致
		data.delete('file');
		data.append('file', file);
		xhr.send(data);
	}


	
    //aws3上传方法
	function uploadS3(data, options, callback, file) {
		var fromData=new FormData();
		var xhr = new XMLHttpRequest();
		var protocol = getProtocol();

		//获取aws3上传地址对象
	    const awsHost = uploadOrderList[0][1]
		//获取上传地址
		var url = protocol + options.s3BucketName + '.' +awsHost;
		console.log("uploadS3:url",url);
		uploadOrderList.shift();
		//声明进度回调
		if (xhr.upload && options.support_options) {
			xhr.upload.onprogress = function(event) {
				callback.onProgress(event.loaded, event.total);
			};
		}

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var result = xhr.responseText || "{}";
				result = JSON.parse(result);
				result.name = options.unique_value;
				result.filename = options.uploadFileName; // 上传文件名
				result.uploadMethod = RongIMLib.UploadMethod ? RongIMLib.UploadMethod.AWS : '';
				//204 成功但是没有返回数据
				if(xhr.status === 200||xhr.status === 204){
					callback.onCompleted(result);
				} else if (uploadOrderList.length) {
					const cloneData = new FormData();
					cloneData.set('file', data.get('file'));
					cloneData.set('key', data.get('key'));
					cloneData.set('token', data.get('token'));
					uploadOrderObject[uploadOrderList[0][0]](cloneData,  options, callback, file)
				} else {
					callback.onError('upload fail')
				}
			}
		};
		//初始化异步请求
		xhr.open(options.method, url, true);
		var s3Header=options?options.s3Header:{};
		//若为图片，需要设置如下表单项
		var type=file&&file.type;
		//console.log("file:type",file.type);
		//if(isPictrue(file&&file.name)) type="image/jpeg";
		fromData.set("Content-Type",type);
		fromData.set("Content-Disposition","inline;filename="+options.uploadFileName);
		fromData.set("x-amz-credential",s3Header.s3Credential);
		fromData.set("x-amz-algorithm",s3Header.s3Algorithm);
		fromData.set("x-amz-date",s3Header.s3Date);
		fromData.set("policy",s3Header.s3Policy);
		fromData.set("x-amz-signature",s3Header.s3Signature);
		fromData.set('key', options.uploadFileName);
		fromData.set('file', file);
		xhr.send(fromData);
	}

	//stc上传方法
	function uploadStc(data, options, callback, file) {
		var fromData=new FormData();
		var xhr = new XMLHttpRequest();
		var protocol = getProtocol();

		//获取aws3上传地址对象
	    const host = uploadOrderList[0][1]
		//获取上传地址
		var url = protocol + host +'/' + options.stcBucketName+'/' + options.uploadFileName;
		uploadOrderList.shift();
		//声明进度回调
		if (xhr.upload && options.support_options) {
			xhr.upload.onprogress = function(event) {
				callback.onProgress(event.loaded, event.total);
			};
		}

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var result = xhr.responseText || "{}";
				result = JSON.parse(result);
				result.name = options.unique_value;
				result.filename = options.uploadFileName; // 上传文件名
				result.uploadMethod = RongIMLib.UploadMethod ? RongIMLib.UploadMethod.STC : '';
				//204 成功但是没有返回数据
				if(xhr.status === 200||xhr.status === 204){
					callback.onCompleted(result);
				} else if (uploadOrderList.length) {
					const cloneData = new FormData();
					cloneData.set('file', data.get('file'));
					cloneData.set('key', data.get('key'));
					cloneData.set('token', data.get('token'));
					uploadOrderObject[uploadOrderList[0][0]](cloneData,  options, callback, file)
				} else {
					callback.onError('upload fail')
				}
			}
		};
		//初始化异步请求
		xhr.open("PUT", url, true);
		var stcHeader=options?options.stcHeader:{};
		//若为图片，需要设置如下表单项
		if(isPictrue(file&&file.name)){
			xhr.setRequestHeader("Content-Type","image/jpeg")
			xhr.setRequestHeader("Content-Disposition","inline;");
		}
		xhr.setRequestHeader("Authorization",stcHeader.stcAuthorization);
		xhr.setRequestHeader("x-amz-content-sha256",stcHeader.stcContentSha256)
		xhr.setRequestHeader("x-amz-date",stcHeader.stcDate)
		xhr.send(file);
	}


	
	  
	function uploadData(file, opts, callback) {
		uploadFile = file, uploadOptions = opts;
		//把之前的数据清空
		uploadOrderList=[];
		if (opts.ossConfig) { // 配置 oss，需按权重降级上传
			const ossConfig = JSON.parse(opts.ossConfig);
			let aliyunUrl = '';
			let s3Url;
			let stcUrl;
			let tempArr = [];
			ossConfig.forEach((item) => {
				const index = Number(item.p) - 1;
				for (const key in item) {
					if (key === 'aliyun') {
						aliyunUrl = item[key];
					}
					if(key==='s3') s3Url=item[key];
					if(key==='stc') stcUrl=item[key];
					if (key != 'p') {
						tempArr[index] = [key, item[key]]
					}
				}
			});
			tempArr.forEach(function(item) { // 过滤权重值不从 1 开始的情况
				item ? uploadOrderList.push(item) : '';
			})
			if (ossConfig.length != uploadOrderList.length) { // 权重无值或相同，无法比较的情况
				
				uploadOrderList = [['qiniu', opts.domain], ['baidu', opts.uploadHost.bos], ['aliyun', aliyunUrl],['s3',s3Url],["stc",stcUrl] ];
			}
		} else { // 走之前的逻辑，先七牛后百度
			uploadOrderList = [['qiniu', opts.domain], ['baidu', opts.uploadHost.bos]];
		}

		
		if(file.size && opts.chunk_size < file.size){
			isStreamUpload = true;
			var uniqueName = opts['genUId'](file);
			var suffix = file.name.substr(file.name.lastIndexOf('.'));
			uniqueName = uniqueName + suffix;
			file.uniqueName = uniqueName;
			opts.stream = true;
			uploadNextChunk(file, opts, callback);
		} else {
			var data = opts['data'](file, opts); // 取 formData
			//uploadOrderObject[uploadOrderList[0][0]](data, opts, callback, file)
			uploadStc(data, opts, callback, file)
		}
	}
	win.uploadProcess = uploadData;
})(window);