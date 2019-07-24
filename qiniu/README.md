### 上传插件使用说明 - 七牛云

1、文档请参考: [https://docs.rongcloud.cn/im/imlib/web/plugin/upload](https://docs.rongcloud.cn/im/imlib/web/plugin/upload)

2、`index.html` 为上传文件/图片 Demo, 需配置上传 token

```js
var config = { 
  domain: 'http://upload.qiniu.com',
  getToken: function(callback){
    var token = "Qiniu Token"
    callback(token);
  }
};
```

3、`message.html` 包含从融云 IM 获取上传 token, 可填入您的 appkey、token 进行测试

```js
var appkey = '8luwapkvucoil';
RongIMLib.RongIMClient.init(appkey);

RongIMClient.setConnectionStatusListener({
  onChanged: function (status) {
    // TODO IM 状态改变处理
  }
});
RongIMClient.setOnReceiveMessageListener({
  onReceived: function (message) {
    // TODO IM 消息处理    
  }
});

var token = '183RX8CR4UcXlV3cANZXnbrkPG6U/xPk3zvPIWf9le0qIwLgOI54+IqjxPVY5a9jZgJ+5WjBf5egVjidhq2Rfg==';

RongIMClient.connect(token, {
  onSuccess: function(userId) {
    // 链接成功
  },
  onTokenIncorrect: function() {
    // token 无效
  },
  onError: function(errorCode){
    // 链接失败, 错误码为 errorCode
  }
});
```