# 上传插件使用说明 - 阿里云

## 1. 引入

```html
<script src = "./aliyun-oss-sdk.min.js"></script>
<script src = "./ali.js"></script>
<script src = "../uploader.js"></script>

<input id="file-id" type="file">
```

## 2. 初始化

根据需要自定义 `config` 对象中的属性，其中 `domain` 为必传参数

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
    data: UploadClient.dataType.form // 提供：form、json、data 三种数据直传方式
};
var fileUpload = UploadFile.init(config);
```

使用阿里云必须传入`multi_params`对象中的参数，否则将上传失败

- `appServer`: 阿里云 appServer 地址（可在阿里云官网获取）
- `bucket`: bucket 名称（可在阿里云控制获取）
- `region`: 区域标识（可在阿里云控制获取）
- `OSSUrl`: 阿里 SDK 上传插件（可在阿里云开发者中心获取）

## 3. 上传文件

上传文件必须设置回调函数，用以接收上传信息

`fileUpload.upload(data, callback);`  data 值可以是 base64 或 file 对象

```js
var callback = {
    onError: function () { 
        // 上传失败
    },
    onProgress: function (loaded, total) {
        // 上传进度
    },
    onCompleted: function (data) { 
        // 上传完成
    } 
};

var file = document.getElementById("file-id");
file.onchange = function(){
    fileUpload.upload(this.files[0], callback);
};
```
