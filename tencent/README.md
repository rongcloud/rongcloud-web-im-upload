# 上传插件使用说明 - 腾讯云

## 1. 引入

```html
<script src = "./swfobject.js"></script>
<script src = "./tencent.js"></script>
<script src = "../uploader.js"></script>

<input id="file-id" type="file">
```

## 2. 初始化

```js
// 默认配置
var config = {
    domain: '', // 必须设置文件服务器地址
    refreshSign: function(callabck) {},
    file_data_name: 'file', // 文件对象的 key 
    base64_size: 10, // 单位 MB 
    chunk_size: 10, // 单位 MB 
    headers: {
        Content - Type: 'multipart/form-data'
        // 按需扩展
    },
    multi_parmas: {}, // 扩展上传属性                           
    query: {}, // 扩展 url 参数 e.g. http://rongcloud.cn?name=zhangsan 
    support_options: true, // 文件服务器不支持 OPTIONS 请求需设置为 false
    data: UploadClient.dataType.form // 提供：form、json、data 三种数据直传方式
};
var fileUpload = UploadFile.init(config);
```

使用腾讯云必须实现 `refreshSign` 方法，否则将上传失败。
```js
refreshSign: function(callabck) { // 使用腾讯云必须实现此方法，否则将上传失败
    // 获取签名和完整的 URL。
    // 将url 和 sign 传入回调函数 cb 。
    cb({path:'上传完整地址', sign:'签名'});
}
```

## 3. 上传文件

上传文件必须设置回调函数，用以接收上传信息。

`fileUpload.upload(data, callback);`  data 值可以是 base64 或 file 对象。

```js
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

var file = document.getElementById("file-id");
file.onchange = function() {
    fileUpload.upload(this.files[0], callback);
};
```
