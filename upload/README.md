### 上传插件使用说明

>从 **2020-12-10** 起，原插件中 `qiniu.js` 更名为 `send-data.js`，引入时需注意，`sdk v2 2.6.0` 以下的版本，获取文件下载地址时，不需要传 `uploadMethod`


1、文档请参考: [http://doc.rongcloud.cn/im/Web/4.X/guide/private/msgmanage/msgsend/web#%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0](http://doc.rongcloud.cn/im/Web/4.X/guide/private/msgmanage/msgsend/web#%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0)

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

3、`new-sdk-v2.html` 包含从融云 IM 获取上传 token, 可填入您的 appkey、token 进行测试，`sdk v2`可参考

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

4. `sdk v3/v4` 可参考 `new-sdk-v4.html`