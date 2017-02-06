# 上传插件使用说明 - 阿里云

### 初始化

`UploadFile.init(config);`

根据需要自定义 `config` 对象中的属性，其中 `domain` 为必传参数。

使用阿里云必须传入 `multi_params` 对象中的参数，否则将上传失败。

`appServer`: 阿里云 appServer 地址（可在阿里云官网获取）。

`bucket`: bucket 名称（可在阿里云控制获取）。

`region`: 区域标识（可在阿里云控制获取）。

`OSSUrl`: 阿里 SDK 上传插件（可在阿里云开发者中心获取）。

```
 var config = {
	 	domain			: '',											// default : '' ,必须设置文件服务器地址。
	  	file_data_name	: 'file',										// default : file , 文件对象的 key 。
	 	base64_size		: 10,											// default : 10 单位 MB 。
		chunk_size		: 10,											// default : 10 单位 MB 。
		headers			: { Content-Type : 'multipart/form-data'},		// default : { Content-Type : 'multipart/form-data'} ,增加 requestHeader 需扩展。 
	  	multi_parmas	: { },											// default : {} 扩展上传属性 。
	  	query			: { },											// default : {}	扩展 url 参数 e.g. http://rongcloud.cn?name=zhangsan 。
	  	support_options : true,											// default : true, 文件服务器不支持 OPTIONS 请求需设置为 false。
		data 			: dataType.form 								// default : dataType.form 默认提供：form、json、data 数据直传三种方式。

  	};
```

### 上传文件

上传文件必须设置回调函数，用以接收上传信息。

`fileUpload.upload(data, callback);`  data 值可以是 base64 或 file 对象。

```
var config = {
		domain: 'http://martin0035.oss-cn-shanghai.aliyuncs.com',
	 	multi_parmas : {
	 		appServer : "http://localhost:3000",
	 		bucket : 'bucketName',
	 		region : 'oss-cn-shanghai',
	 		OSSUrl : './aliyun-oss-sdk.min.js'
	 	}
};

var callback = {
		onError	: function () { 
			// 上传失败。
		},
		onProgress : function (loaded, total) {
			// 处理进度条。
		},
		onCompleted : function (data) { 
			// data : 上传成功，文件服务器响应值。
		} 
 };

var fileUpload = UploadFile.init(config);
var file = document.getElementById("file-Id");
file.onchange = function(){
	fileUpload.upload(this.files[0], callback);
};

```