# 上传插件使用说明 - 七牛云

## 引入

参考 index.html 引用方法，把以下三个文件拷贝到项目下。

```html
<script src = "./qiniu.js"></script>
<script src = "../upload.js"></script>
<script src="./init.js"></script>
```

## 接口

### 参数

1、配置项

```js
// 默认配置
var config = {
    domain: '', // 必须设置文件服务器地址
    file_data_name: 'file', // 文件对象的 key 
    base64_size: 10, // 单位 MB 
    chunk_size: 10, // 单位 MB 
    headers: {
        Content - Type: 'multipart/form-data'
        // 按需扩展 
    },
    multi_parmas: {},
    query: {}, // 扩展 url 参数 e.g. http://rongcloud.cn?name=zhangsan 
    support_options: true, // 文件服务器不支持 OPTIONS 请求需设置为 false
    data: UploadClient.dataType.form, // 提供：form、json、data 三种数据直传方式
    getToken: function(callback) {}
};
```

2、上传回调

```js
var callback = {
    onError: function () { 
        // 上传失败
    },
    onProgress : function (loaded, total) {
        // 上传进度
    },
    onCompleted : function (data) { 
        // data : 上传完成
    } 
};
```

## 上传文件

```html
<input type="file" id="fileId" value="UploadFile" />

<script>
// 配置项
var config = {
    domain: 'http://upload.qiniu.com',
    getToken: function(callback) {
        var token = "livk5rb3__JZjCtEiMxX";
        callback(token);
    }
};

// 回调
var callback = {
    onError: function() {
        // 上传失败
    },
    onProgress: function(loaded, total) {
        // 上传进度
    },
    onCompleted: function(data) {
        // 上传完成
    }
};

var file = document.getElementById("fileId");

file.onchange = function() {
    var _file = this.files[0];
    UploadClient.initFile(config, function(uploadFile) {
        uploadFile.upload(_file, callback);
    });
};
</script>
```

## 上传图片

```html
<input type="file" id="fileId" value="UploadImage" />

<script>
// 配置项
var config = {
    domain: 'http://upload.qiniu.com',
    getToken: function(callback) {
        var token = "livk5rb3__JZjCtEiMxX";
        callback(token);
    }
};

// 回调
var callback = {
    onError: function() {
        // 上传失败
    },
    onProgress: function(loaded, total) {
        // 上传进度
    },
    onCompleted: function(data) {
        // 上传完成
    }
};

var file = document.getElementById("fileId");

file.onchange = function() {
    var _file = this.files[0];
    UploadClient.initImage(config, function(uploadImage) {
        uploadImage.upload(_file, callback);
    });
};
</script>
```

## 上传 Base64 图片

```html
<input type="button" id="fileId" value="开始上传" />

<script>
// 配置项
var config = {
    domain: 'http://upload.qiniu.com',
    getToken: function(callback) {
        var token = "livk5rb3__JZjCtEiMxX";
        callback(token);
    }
};

// 回调
var callback = {
    onError: function() {
        // 上传失败
    },
    onProgress: function(loaded, total) {
        // 上传进度
    },
    onCompleted: function(data) {
        // 上传完成
    }
};

// base64 格式的图片
var base64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAADwCAYAAAD...";
var file = document.getElementById("fileId");
file.onclick = function() {
    UploadClient.initImgBase64(config, function(uploadBase64) {
        uploadBase64.upload(base64, callback);
    });
};
</script>
```
