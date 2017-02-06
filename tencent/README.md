# 上传插件使用说明 - 腾讯云

## 初始化

使用腾讯云必须实现 `refreshSign` 方法，否则将上传失败。

```
 var config = {
	 	domain			: '',											// default : '' ,文件服务器地址,必传参数。
	 	refreshSign		: function(callabck){} 							// default : function(callback){},实现逻辑请参考下面示例，必传参数。
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

## 上传文件

上传文件必须设置回调函数，用以接收上传信息。

`fileUpload.upload(data, callback);`  data 值可以是 base64 或 file 对象。

```
var config = { 
	domain: 'http://web.file.myqcloud.com/files/v1/10011010',
 	multi_parmas : {op: 'upload', insertOnly:0},
 	file_data_name : 'fileContent',
 	support_options:false,
 	chunk_size:1048576,
 	refreshSign:function(cb){
		// 获取签名和完整的 URL。
		// 将url 和 sign 传入回调函数 cb 。
		cb({path:'上传完整地址', sign:'签名'});
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