function UploadAli(file, opts, callback) {
	var OSS = window.OSS;
	var urllib = OSS.urllib;
	var Buffer = OSS.Buffer;
	var OSS = OSS.Wrapper;
	var STS = OSS.STS;

	function applyTokenDo(file, opts, callback, func) {
	  return urllib.request(opts.multi_parmas.appServer, {
	    method: 'GET'
	  }).then(function (result) {
	    var creds = JSON.parse(result.data);
	    var client = new OSS({
	      region: opts.multi_parmas.region,
	      accessKeyId: creds.AccessKeyId,
	      accessKeySecret: creds.AccessKeySecret,
	      stsToken: creds.SecurityToken,
	      bucket: opts.multi_parmas.bucket
	    });
	    return func(client, file, opts, callback);
	  });
	};
	
	function uploadFile(client, file, options, callback) {
		  var filename = file.name;
		  return client.multipartUpload(filename, file, {
		    progress: function(pecent){
		    	return function(done){
		    		callback.onProgress(Math.floor(pecent * 100), 100);
		    		done();
		    	}
		    }
		  }).then(function (res) {
		  	 var result = client.signatureUrl(filename, {
			    response: {
			      'content-disposition': 'attachment; filename="' + filename + '"'
			    }
			  });
		  	res.downloadUrl = result;
		  	res.file = file;
		    callback.onCompleted(res);
		});
	}


	if (typeof file == 'object') {
		applyTokenDo(file, opts, callback, uploadFile);
	}else{
		// TODO send base64
	}
}
window.uploadProcess = UploadAli;
