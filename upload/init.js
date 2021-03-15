(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
      typeof define === 'function' && define.amd ? define(factory) : (global.UploadClient = factory());
}(this, function() {
  

  var calcPosition = function(width, height, opts) {
      var isheight = width < height;
      var scale = isheight ? height / width : width / height;
      var zoom, x = 0,
          y = 0,
          w, h;

      var gtScale = function() {
          if (isheight) {
              zoom = width / 100;
              w = 100;
              h = height / zoom;
              y = (h - opts.maxHeight) / 2;
          } else {
              zoom = height / 100;
              h = 100;
              w = width / zoom;
              x = (w - opts.maxWidth) / 2;
          }
          return {
              w: w,
              h: h,
              x: -x,
              y: -y
          };
      };
      
      var ltScale = function() {
          if (isheight) {
              zoom = height / opts.maxHeight;
              h = opts.maxHeight;
              w = width / zoom;
          } else {
              zoom = width / opts.maxWidth;
              w = opts.maxWidth;
              h = height / zoom;
          }
          return {
              w: w,
              h: h,
              x: -x,
              y: -y
          };
      };
      return scale > opts.scale ? gtScale() : ltScale();
  };

  var getBlobUrl = function(file) {
      var URL = window.URL || window.webkitURL;
      return URL ? URL.createObjectURL(file) : "";
  };

  var getThumbnail = function(file, opts, callback) {
      var canvas = document.createElement("canvas"),
          context = canvas.getContext('2d');
      var img = new Image();
      img.onload = function() {
          var pos = calcPosition(img.width, img.height, opts);
          canvas.width = pos.w > opts.maxWidth ? opts.maxWidth : pos.w;
          canvas.height = pos.h > opts.maxHeight ? opts.maxHeight : pos.h;
          context.drawImage(img, pos.x, pos.y, pos.w, pos.h);
          try {
              var base64 = canvas.toDataURL(file.type, opts.quality);
              var reg = new RegExp('^data:image/[^;]+;base64,');
              base64 = base64.replace(reg, '');
              callback(base64);
          } catch (e) {
              throw new Error(e);
          }
      };
      img.src = typeof file == 'string' ? 'data:image/jpg;base64,' + file : getBlobUrl(file);
  };

  var _compress = function(data, callback) {
      var file = data.file;
      var opts = data.compress;
      getThumbnail(file, opts, callback);
  };

  _init = function(config, callback) {
      if (config.getToken) {
          config.getToken(function(token, data) {
              data = data || {}
              config.multi_parmas || (config.multi_parmas = {});
              config.multi_parmas.token = token;
              config.uploadHost || (config.uploadHost = {});
              config.uploadHost['bos'] = data.bos;

              config.ossConfig = data.ossConfig

              config.bosHeader || (config.bosHeader = {})
              config.bosHeader['bosDate'] = data.bosDate;
              config.bosHeader['bosToken'] = data.bosToken;
              config.bosUploadPath = data.path;

              config.aliHeader = {}
              config.aliHeader['osskeyId'] = data.osskeyId;
              config.aliHeader['ossPolicy'] = data.ossPolicy;
              config.aliHeader['ossSign'] = data.ossSign;
              config['ossBucketName'] = data.ossBucketName;
              config['uploadFileName'] = data.fileName;

              config.s3Header = {}
              config.s3Header['s3Credential'] = data.s3Credential;
              config.s3Header['s3Algorithm'] = data.s3Algorithm;
              config.s3Header['s3Date'] = data.s3Date;
              config.s3Header['s3Policy'] = data.s3Policy;
              config.s3Header['s3Signature'] = data.s3Signature;
              config['s3BucketName'] = data.s3BucketName;

              //console.log("init:",data);
              config.stcHeader = {}
              config.stcHeader['stcAuthorization'] = data.stcAuthorization;
              config.stcHeader['stcContentSha256'] = data.stcContentSha256;
              config.stcHeader['stcDate'] = data.stcDate;
              config['stcBucketName'] = data.stcBucketName;

              config.headers || (config.headers = {});
              if (config.base64) {
                  config.headers['Content-type'] = 'application/octet-stream';
                  config.headers['Authorization'] = 'UpToken ' + token;
              }
              console.log("data",data);
              var instance = UploadFile.init(config);
              callback(instance);
          });
      } else {
          config.headers || (config.headers = {});
          if (config.base64) {
              config.headers['Content-type'] = 'application/octet-stream';
          }
          var instance = UploadFile.init(config);
          callback(instance);
      }
  };

  var _upload = function(data, instance, callback) {
      instance.upload(data.file, {
          onError: function(errorCode) {
              callback.onError(errorCode);
          },
          onProgress: function(loaded, total) {
              callback.onProgress(loaded, total);
          },
          onCompleted: function(result) {
              result.filename || (result.filename = result.hash);
              var compress = data.compressThumbnail || _compress;
              if (data.compress) {
                  compress(data, function(thumbnail) {
                      result.thumbnail = thumbnail;
                      callback.onCompleted(result);
                  });
              } else {
                  callback.onCompleted(result);
              }
          }
      });
  };

  
 var File = function(instance) {
      var me = this;
      this.instance = instance
      this.upload = function(file, callback) {
          var data = {
              file: file
          };
          _upload(data, me.instance, callback);
      };
      this.cancel = function() {
          me.instance.cancel();
      };
  };

  var initFile = function(config, callback) {
      _init(config, function(instance) {
          var uploadFile = new File(instance);
          callback(uploadFile);
      });
  };

  var Img = function(instance, cfg) {
      var me = this;
      this.cfg = cfg;
      this.instance = instance;
      this.upload = function(file, callback) {
          var data = {
              file: file,
              compress: me.cfg
          };
          _upload(data, me.instance, callback);
      };

      this.cancel = function() {
          me.instance.cancel();
      };
  };

  var initImage = function(config, callback) {
      _init(config, function(instance) {
          var compress = {
              maxHeight: config.height || 160,
              maxWidth: config.width || 160,
              quality: config.quality || 0.5,
              scale: config.scale || 2.4
          };
          var uploadImage = new Img(instance, compress);
          callback(uploadImage);
      });
  };

  var ImgBase64 = function(config) {
      config.base64 = true;
      Img.call(this, config);
  };

  var initImgBase64 = function(config, callback) {
      config.base64 = true;
      initImage.call(this, config, callback);
  };

  return {
      initFile: initFile,
      initImage: initImage,
      initImgBase64: initImgBase64,
      dataType: UploadFile.dataType
  };
}));