/*
 * RCEngine - v4.3.0-alpha.8
 * CommitId - 9f87d45771f61e92544a8fcad04f40f669ffbf01
 * Fri Mar 05 2021 19:45:22 GMT+0800 (中国标准时间)
 * ©2020 RongCloud, Inc. All rights reserved.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.RCEngine = {}));
}(this, (function (exports) { 'use strict';

    var ReceivedStatus;
    (function (ReceivedStatus) {
        /**
         * 已读
        */
        ReceivedStatus[ReceivedStatus["READ"] = 1] = "READ";
        /**
         * 已听
        */
        ReceivedStatus[ReceivedStatus["LISTENED"] = 2] = "LISTENED";
        /**
         * 已下载
        */
        ReceivedStatus[ReceivedStatus["DOWNLOADED"] = 4] = "DOWNLOADED";
        /**
         * 该消息已经被其他登录的多端收取过。( 即该消息已经被其他端收取过后。当前端才登录，并重新拉取了这条消息。客户可以通过这个状态更新 UI，比如不再提示 )
        */
        ReceivedStatus[ReceivedStatus["RETRIEVED"] = 8] = "RETRIEVED";
        /**
         * 未读
        */
        ReceivedStatus[ReceivedStatus["UNREAD"] = 0] = "UNREAD";
    })(ReceivedStatus || (ReceivedStatus = {}));
    var ReceivedStatus$1 = ReceivedStatus;

    /**
     * Navi 缓存数据有效时长，单位毫秒
     */
    const NAVI_CACHE_DURATION = 2 * 60 * 60 * 1000;
    /**
     * 单个 Navi 请求的超时时间，单位毫秒
     */
    const NAVI_REQ_TIMEOUT = 10 * 1000;
    /**
     * /ping?r= 请求的超时时间，单位毫秒
     */
    const PING_REQ_TIMEOUT = 5 * 1000;
    /**
     * WebSocket 建立连接超时时间，单位毫秒
     */
    const WEB_SOCKET_TIMEOUT = 5 * 1000;
    /**
     * 公有云 Navi 请求地址
     */
    const PUBLIC_CLOUD_NAVI_URIS = ['https://nav.cn.ronghub.com', 'https://nav2-cn.ronghub.com'];
    /**
     * 小程序 websocket 连接地址
     */
    const MINI_SOCKET_CONNECT_URIS = ['wsproxy.cn.ronghub.com', 'wsap-cn.ronghub.com'];
    /**
     * 小程序 长轮询 连接地址
     */
    const MINI_COMET_CONNECT_URIS = ['cometproxy-cn.ronghub.com', 'mini-cn.ronghub.com'];
    /**
     * IM 接口超时时间，单位毫秒
     */
    const IM_SIGNAL_TIMEOUT = 30 * 1000;
    /**
     * IM Ping 间隔时间，单位毫秒
     */
    const IM_PING_INTERVAL_TIME = 30 * 1000;
    /**
     * IM Ping 最大超时时间，单位毫秒
     */
    const IM_PING_MAX_TIMEOUT = 6 * 1000;
    /**
     * IM Ping 最小超时时间，单位毫秒
     */
    const IM_PING_MIN_TIMEOUT = 2 * 1000;
    /**
     * 消息 content 内容尺寸限制：128 KB
     */
    const MAX_MESSAGE_CONTENT_BYTES = 128 * 1024;
    /**
     * IM Comet 发送 pullmsg(嗅探 + 等待信令) 超时时间 45s
     */
    const IM_COMET_PULLMSG_TIMEOUT = 45000;
    /**
     * storage key 使用的前缀
    */
    const STORAGE_ROOT_KEY = 'RCV4-';
    /*
     * 内置消息的配置项. 发消息时, objectName 匹配到以下项时, 将覆盖用户传入值
     * 内置消息文档: https://docs.rongcloud.cn/im/introduction/message_structure/#inherent
     * 'RC:DizNtf' 为讨论组消息通知类型，讨论组已废弃
    */
    const SEND_MESSAGE_TYPE_OPTION = {
        // 存储且计数
        'RC:TxtMsg': { isCounted: true, isPersited: true },
        'RC:ImgMsg': { isCounted: true, isPersited: true },
        'RC:VcMsg': { isCounted: true, isPersited: true },
        'RC:ImgTextMsg': { isCounted: true, isPersited: true },
        'RC:FileMsg': { isCounted: true, isPersited: true },
        'RC:HQVCMsg': { isCounted: true, isPersited: true },
        'RC:LBSMsg': { isCounted: true, isPersited: true },
        'RC:PSImgTxtMsg': { isCounted: true, isPersited: true },
        'RC:PSMultiImgTxtMsg': { isCounted: true, isPersited: true },
        'RCJrmf:RpMsg': { isCounted: true, isPersited: true },
        'RCJrmf:RpOpendMsg': { isCounted: true, isPersited: true },
        'RC:CombineMsg': { isCounted: true, isPersited: true },
        'RC:ReferenceMsg': { isCounted: true, isPersited: true },
        'RC:SightMsg': { isCounted: true, isPersited: true },
        // 只存储 不计数
        'RC:InfoNtf': { isCounted: false, isPersited: true },
        'RC:ContactNtf': { isCounted: false, isPersited: true },
        'RC:ProfileNtf': { isCounted: false, isPersited: true },
        'RC:CmdNtf': { isCounted: false, isPersited: true },
        'RC:GrpNtf': { isCounted: false, isPersited: true },
        'RC:RcCmd': { isCounted: false, isPersited: true },
        // 不存储 只计数 - 目前无
        // 不存储 不计数
        'RC:CmdMsg': { isCounted: false, isPersited: false },
        'RC:TypSts': { isCounted: false, isPersited: false },
        'RC:PSCmd': { isCounted: false, isPersited: false },
        'RC:SRSMsg': { isCounted: false, isPersited: false },
        'RC:RRReqMsg': { isCounted: false, isPersited: false },
        'RC:RRRspMsg': { isCounted: false, isPersited: false },
        'RC:CsChaR': { isCounted: false, isPersited: false },
        'RC:CSCha': { isCounted: false, isPersited: false },
        'RC:CsEva': { isCounted: false, isPersited: false },
        'RC:CsContact': { isCounted: false, isPersited: false },
        'RC:CsHs': { isCounted: false, isPersited: false },
        'RC:CsHsR': { isCounted: false, isPersited: false },
        'RC:CsSp': { isCounted: false, isPersited: false },
        'RC:CsEnd': { isCounted: false, isPersited: false },
        'RC:CsUpdate': { isCounted: false, isPersited: false },
        'RC:ReadNtf': { isCounted: false, isPersited: false },
        'RC:chrmKVNotiMsg': { isCounted: false, isPersited: false },
        'RC:VCAccept': { isCounted: false, isPersited: false },
        'RC:VCRinging': { isCounted: false, isPersited: false },
        'RC:VCSummary': { isCounted: false, isPersited: false },
        'RC:VCHangup': { isCounted: false, isPersited: false },
        'RC:VCInvite': { isCounted: false, isPersited: false },
        'RC:VCModifyMedia': { isCounted: false, isPersited: false },
        'RC:VCModifyMem': { isCounted: false, isPersited: false },
        'RC:MsgExMsg': { isCounted: false, isPersited: false }
    };
    /**
     * 协议栈内置消息类型
     * TODO: 需确认是否添加到 Web 中
    */
    const CPP_PROTOCAL_MSGTYPE_OPTION = {
        // 讨论组通知
        'RC:DizNtf': { isCounted: false, isPersited: false }
    };

    let rootStorage;
    const createRootStorage = (runtime) => {
        if (!rootStorage) {
            rootStorage = {
                set: (key, val) => {
                    runtime.localStorage.setItem(key, JSON.stringify(val));
                },
                get: (key) => {
                    let val;
                    try {
                        val = JSON.parse(runtime.localStorage.getItem(key));
                    }
                    catch (e) {
                        val = null;
                    }
                    return val;
                },
                remove: (key) => {
                    return runtime.localStorage.removeItem(key);
                },
                getKeys: () => {
                    const keys = [];
                    for (const key in runtime.localStorage) {
                        keys.push(key);
                    }
                    return keys;
                }
            };
        }
        return rootStorage;
    };
    class AppCache {
        constructor(value) {
            this._caches = {};
            if (value) {
                this._caches = value;
            }
        }
        set(key, value) {
            this._caches[key] = value;
        }
        remove(key) {
            const val = this.get(key);
            delete this._caches[key];
            return val;
        }
        get(key) {
            return this._caches[key];
        }
        getKeys() {
            const keys = [];
            for (const key in this._caches) {
                keys.push(key);
            }
            return keys;
        }
    }
    class AppStorage {
        constructor(runtime, suffix) {
            const key = suffix ? `${STORAGE_ROOT_KEY}${suffix}` : STORAGE_ROOT_KEY;
            this._rootStorage = createRootStorage(runtime);
            const localCache = this._rootStorage.get(key) || {};
            this._cache = new AppCache({
                [key]: localCache
            });
            this._storageKey = key;
        }
        _get() {
            const key = this._storageKey;
            return this._cache.get(key) || {};
        }
        _set(cache) {
            const key = this._storageKey;
            cache = cache || {};
            this._cache.set(key, cache);
            this._rootStorage.set(key, cache);
        }
        set(key, value) {
            const localValue = this._get();
            localValue[key] = value;
            this._set(localValue);
        }
        remove(key) {
            const localValue = this._get();
            delete localValue[key];
            this._set(localValue);
        }
        clear() {
            const key = this._storageKey;
            this._rootStorage.remove(key);
            this._cache.remove(key);
        }
        get(key) {
            const localValue = this._get();
            return localValue[key];
        }
        getKeys() {
            const localValue = this._get();
            const keyList = [];
            for (const key in localValue) {
                keyList.push(key);
            }
            return keyList;
        }
        getValues() {
            return this._get() || {};
        }
    }

    class Todo extends Error {
        constructor(message) {
            super(`TODO => ${message}`);
        }
    }
    const todo = (message) => new Todo(message);

    /**
     * 字符串转为大写形式并返回
     * @todo 违反单一性原则，后续需分拆，以及需要评估是否过渡封装
     * @param str
     * @param startIndex 开始位置
     * @param endIndex 结束位置
    */
    const toUpperCase = (str, startIndex, endIndex) => {
        if (startIndex === undefined || endIndex === undefined) {
            return str.toUpperCase();
        }
        const sliceStr = str.slice(startIndex, endIndex);
        str = str.replace(sliceStr, (text) => {
            return text.toUpperCase();
        });
        return str;
    };
    const getByteLength = (str, charset = 'utf-8') => {
        let total = 0;
        let chatCode;
        if (charset === 'utf-16') {
            for (let i = 0, max = str.length; i < max; i++) {
                chatCode = str.charCodeAt(i);
                if (chatCode <= 0xffff) {
                    total += 2;
                }
                else {
                    total += 4;
                }
            }
        }
        else {
            for (let i = 0, max = str.length; i < max; i++) {
                chatCode = str.charCodeAt(i);
                if (chatCode < 0x007f) {
                    total += 1;
                }
                else if (chatCode <= 0x07ff) {
                    total += 2;
                }
                else if (chatCode <= 0xffff) {
                    total += 3;
                }
                else {
                    total += 4;
                }
            }
        }
        return total;
    };
    const appendUrl = (url, query) => {
        url = url.replace(/\?$/, '');
        if (!query) {
            return url;
        }
        const searchArr = Object.keys(query).map(key => `${key}=${query[key]}`).filter(item => !!item);
        if (searchArr.length) {
            return [url, searchArr.join('&')].join('?');
        }
        return url;
    };
    /**
     * 建立连接时，apiVersion 需符合 `/\d+(\.\d+){2}/` 规则，对于预发布版本号如 `3.1.0-alpha.1`，需解析定为 `3.1.0`
     * @param apiVersion
     */
    const matchVersion = (apiVersion) => {
        const matches = apiVersion.match(/\d+(\.\d+){2}/);
        return matches[0];
    };

    exports.LogLevel = void 0;
    (function (LogLevel) {
        /**
         * 等同于 `LogLevel.DEBUG`
         */
        LogLevel[LogLevel["LOG"] = 0] = "LOG";
        LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
        LogLevel[LogLevel["INFO"] = 1] = "INFO";
        LogLevel[LogLevel["WARN"] = 2] = "WARN";
        LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
        LogLevel[LogLevel["NONE"] = 1000] = "NONE";
    })(exports.LogLevel || (exports.LogLevel = {}));

    const methods = {
        [exports.LogLevel.DEBUG]: console.debug.bind(console),
        [exports.LogLevel.INFO]: console.info.bind(console),
        [exports.LogLevel.WARN]: console.warn.bind(console),
        [exports.LogLevel.ERROR]: console.error.bind(console)
    };
    class Logger {
        constructor(tag) {
            this.tag = tag;
            /**
             * 输出等级
             */
            this._outLevel = exports.LogLevel.WARN;
            /**
             * 输出函数
             */
            this._stdout = this._defaultStdout;
            this.log = this._out;
            this.debug = this._out.bind(this, exports.LogLevel.DEBUG);
            this.info = this._out.bind(this, exports.LogLevel.INFO);
            this.warn = this._out.bind(this, exports.LogLevel.WARN);
            this.error = this._out.bind(this, exports.LogLevel.ERROR);
        }
        /**
         * 默认输出函数
         * @param level
         * @param args
         */
        _defaultStdout(level, ...args) {
            methods[level](`[${this.tag}](${new Date().toUTCString()}):`, ...args);
        }
        _out(level, ...args) {
            level >= this._outLevel && this._stdout(level, ...args);
        }
        /**
         * 设置默认输出等级及输出函数
         * @param outLevel
         * @param stdout
         */
        set(outLevel, stdout) {
            this._outLevel = outLevel !== undefined ? outLevel : exports.LogLevel.WARN;
            this._stdout = stdout || this._defaultStdout;
        }
    }
    const logger = new Logger('RCLog');
    logger.set(exports.LogLevel.DEBUG );

    /**
     * 会话类型
     */
    var ConversationType;
    (function (ConversationType) {
        /**
         * 无类型
         */
        ConversationType[ConversationType["NONE"] = 0] = "NONE";
        /**
         * 单聊
         */
        ConversationType[ConversationType["PRIVATE"] = 1] = "PRIVATE";
        /**
         * 讨论组
         */
        ConversationType[ConversationType["DISCUSSION"] = 2] = "DISCUSSION";
        /**
         * 群组聊天
         */
        ConversationType[ConversationType["GROUP"] = 3] = "GROUP";
        /**
         * 聊天室会话
         */
        ConversationType[ConversationType["CHATROOM"] = 4] = "CHATROOM";
        /**
         * 客服会话
         */
        ConversationType[ConversationType["CUSTOMER_SERVICE"] = 5] = "CUSTOMER_SERVICE";
        /**
         * 系统消息
         */
        ConversationType[ConversationType["SYSTEM"] = 6] = "SYSTEM";
        /**
         * 默认关注的公众号会话类型（MC)
         */
        ConversationType[ConversationType["APP_PUBLIC_SERVICE"] = 7] = "APP_PUBLIC_SERVICE";
        /**
         * 需手动关注的公众号会话类型（MP)
         */
        ConversationType[ConversationType["PUBLIC_SERVICE"] = 8] = "PUBLIC_SERVICE";
        /**
         * RTCLib 特有的会话类型
         */
        ConversationType[ConversationType["RTC_ROOM"] = 12] = "RTC_ROOM";
    })(ConversationType || (ConversationType = {}));
    var ConversationType$1 = ConversationType;

    /**
     * 文件类型
     */
    var FileType;
    (function (FileType) {
        /**
         * 图片文件
         */
        FileType[FileType["IMAGE"] = 1] = "IMAGE";
        /**
         * 声音文件
         */
        FileType[FileType["AUDIO"] = 2] = "AUDIO";
        /**
         * 视频文件
         */
        FileType[FileType["VIDEO"] = 3] = "VIDEO";
        /**
         * 非媒体文件
         */
        FileType[FileType["FILE"] = 4] = "FILE";
        /**
         * 小视频类型
        */
        FileType[FileType["SIGHT"] = 5] = "SIGHT";
        /**
         * 合并转发
        */
        FileType[FileType["COMBINE_HTML"] = 6] = "COMBINE_HTML";
    })(FileType || (FileType = {}));
    var FileType$1 = FileType;

    /**
     * 检查参数是否为字符串
     * 只做类型检查，不做长度检查，故当字符串长度为 0，结果依然为 true
     * @param str
     */
    const isString = (value) => typeof value === 'string';
    /**
     * 检查参数是否为 number 数据
     * @param value
     */
    const isNumber = (value) => typeof value === 'number' && !isNaN(value);
    /**
     * 检查参数是否为数组
     * 只做类型检查，不做长度检查
     * 如 UnitArray、BufferArray 等也属于数组
     * @param arr
     */
    const isArray = (arr) => Object.prototype.toString.call(arr).indexOf('Array') !== -1;
    /**
     * 检查参数是否为 ArrayBuffer
     * @param arr
     */
    const isArrayBuffer = (arr) => Object.prototype.toString.call(arr) === '[object ArrayBuffer]';
    /**
     * 检查参数是否为长度非 0 的字符串
     * @param str
     */
    const notEmptyString = (str) => isString(str) && str.length > 0;
    /**
     * 检查参数是否为长度非 0 的数组
     * @param str
     */
    const notEmptyArray = (arr) => isArray(arr) && arr.length > 0;
    /**
     * 检查参数是否为对象
     * @param val
     */
    const isObject = (val) => {
        return Object.prototype.toString.call(val) === '[object Object]';
    };
    /**
     * 检查参数是否为函数
     * @param val
     */
    const isFunction = (val) => {
        return Object.prototype.toString.call(val) === '[object Function]';
    };
    /**
     * 检查参数是否为undefined
     * @param val
     */
    const isUndefined = (val) => {
        // IE 下 undefined 为 Object
        return val === undefined || Object.prototype.toString.call(val) === '[object Undefined]';
    };
    /**
     * 检查参数是否为 null
    */
    const isNull = (val) => {
        return Object.prototype.toString.call(val) === '[object Null]';
    };
    /**
     * 检查参数是否为有效 http(s) 协议 url
     * @param value
     */
    const isHttpUrl = (value) => isString(value) && /https?:\/\//.test(value);
    /**
     * 检查对象不为空
     * @param val
    */
    const notEmptyObject = (val) => {
        // eslint-disable-next-line no-unreachable-loop
        for (const key in val) {
            return true;
        }
        return false;
    };
    const isValidConversationType = (conversation) => {
        return isNumber(conversation) && Object.prototype.hasOwnProperty.call(ConversationType$1, conversation);
    };
    /**
     * 判断是否是一个有效的文件类型
     */
    const isValidFileType = (fileType) => {
        return isNumber(fileType) && Object.prototype.hasOwnProperty.call(FileType$1, fileType);
    };

    class EventEmitter {
        constructor() {
            this._map = {};
        }
        /**
         * 添加事件监听器
         * @param eventType
         * @param listener
         */
        on(eventType, listener) {
            const arr = this._map[eventType] || (this._map[eventType] = []);
            if (arr.includes(listener)) {
                return;
            }
            arr.push(listener);
        }
        /**
         * 移除事件监听器
         * @param eventType
         * @param listener
         */
        off(eventType, listener) {
            const arr = this._map[eventType];
            if (!arr) {
                return;
            }
            const len = arr.length;
            for (let i = len - 1; i >= 0; i -= 1) {
                if (arr[i] === listener) {
                    arr.splice(i, 1);
                    if (len === 1) {
                        delete this._map[eventType];
                    }
                    break;
                }
            }
        }
        /**
         * 事件派发
         * @param eventType
         * @param data
         */
        emit(eventType, data) {
            const arr = this._map[eventType];
            if (!arr) {
                return;
            }
            arr.forEach(item => item(data));
        }
        /**
         * 清空所有指定类型的事件监听器
         * @param eventType
         */
        removeAll(eventType) {
            delete this._map[eventType];
        }
        /**
         * 无差别清空所有事件监听器
         */
        clear() {
            Object.keys(this._map).forEach(this.removeAll, this);
        }
    }

    /**
     * 预定义的验证规则，只包含`值类型`数据验证
     * 引用类型数据需使用自定义 validator 校验函数进行校验
     */
    exports.AssertRules = void 0;
    (function (AssertRules) {
        /**
         * 类型为字符串，且长度大于 0
         */
        AssertRules[AssertRules["STRING"] = 0] = "STRING";
        /**
         * 类型仅为 String
        */
        AssertRules[AssertRules["ONLY_STRING"] = 1] = "ONLY_STRING";
        /**
         * 类型为数字
         */
        AssertRules[AssertRules["NUMBER"] = 2] = "NUMBER";
        /**
         * 类型为布尔值
         */
        AssertRules[AssertRules["BOOLEAN"] = 3] = "BOOLEAN";
        /**
         * 类型为对象
        */
        AssertRules[AssertRules["OBJECT"] = 4] = "OBJECT";
        /**
         * 类型为数组
        */
        AssertRules[AssertRules["ARRAY"] = 5] = "ARRAY";
        /**
         * 类型为 callback 回调对象，包含 callback.onSuccess、callback.onError
        */
        AssertRules[AssertRules["CALLBACK"] = 6] = "CALLBACK";
    })(exports.AssertRules || (exports.AssertRules = {}));
    const validators = {
        [exports.AssertRules.STRING]: notEmptyString,
        [exports.AssertRules.ONLY_STRING]: isString,
        [exports.AssertRules.NUMBER]: isNumber,
        [exports.AssertRules.BOOLEAN]: (value) => typeof value === 'boolean',
        [exports.AssertRules.OBJECT]: isObject,
        [exports.AssertRules.ARRAY]: isArray,
        [exports.AssertRules.CALLBACK]: (callback) => {
            let flag = true;
            if (!isObject(callback)) {
                flag = false;
            }
            callback = callback || {};
            if (callback.onSuccess && !isFunction(callback.onSuccess)) {
                flag = false;
            }
            if (callback.onError && !isFunction(callback.onError)) {
                flag = false;
            }
            return flag;
        }
    };
    class RCAssertError extends Error {
        constructor(message) {
            super(message);
            this.name = 'RCAssertError';
        }
    }
    /**
     * 参数校验，该方法用于对业务层入参数据检查，及时抛出异常通知业务层进行修改
     * @description
     * 1. 必填参数，value 需符合 validator 验证规，否则抛出异常
     * 2. 非必填参数，value 可为 undefined | null 或符合 validator 规则
     * @param key 字段名，仅用于验证失败时给出提示信息
     * @param value 待验证的值
     * @param validator 期望类型或校验规则函数，若使用规则函数
     * @param required 是否为必填参数，默认为 `false`
     */
    const assert = (key, value, validator, required = false) => {
        if (!validate(key, value, validator, required)) {
            throw new RCAssertError(`'${key}' is invalid: ${JSON.stringify(value)}`);
        }
    };
    /**
     * 参数校验，该方法用于对业务层入参数据检查，与 `assert` 函数不同的是其返回 boolean 值而非直接抛出异常
     * @description
     * 1. 必填参数，value 需符合 validator 验证规，否则抛出异常
     * 2. 非必填参数，value 可为 undefined | null 或符合 validator 规则
     * @param key 字段名，仅用于验证失败时给出提示信息
     * @param value 待验证的值
     * @param validator 期望类型或校验规则函数，若使用规则函数
     * @param required 是否为必填参数，默认为 `false`
     */
    const validate = (key, value, validator, required = false) => {
        validator = validators[validator] || validator;
        const invalid = 
        // 必填参数校验
        (required && !validator(value)) ||
            // 非必填参数校验
            (!required && !(isUndefined(value) || value === null || validator(value)));
        if (invalid) {
            // 打印无效参数到控制台便于定位问题
            logger.error(`'${key}' is invalid: ${JSON.stringify(value)}`);
        }
        return !invalid;
    };

    const randomNum = (min, max) => {
        return min + Math.floor(Math.random() * (max - min));
    };
    const getUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    var ErrorCode;
    (function (ErrorCode) {
        /** 超时 */
        ErrorCode[ErrorCode["TIMEOUT"] = -1] = "TIMEOUT";
        /**
         * 未知原因失败。
         */
        ErrorCode[ErrorCode["UNKNOWN"] = -2] = "UNKNOWN";
        /** 参数错误 */
        ErrorCode[ErrorCode["PARAMETER_ERROR"] = -3] = "PARAMETER_ERROR";
        /** 未实现的方法定义，在应用层调用 callExtra 传入无法识别的方法名时抛出 */
        ErrorCode[ErrorCode["EXTRA_METHOD_UNDEFINED"] = -4] = "EXTRA_METHOD_UNDEFINED";
        /** 主进程内方法错误 */
        ErrorCode[ErrorCode["MAIN_PROCESS_ERROR"] = -5] = "MAIN_PROCESS_ERROR";
        /**
         * 成功
         */
        ErrorCode[ErrorCode["SUCCESS"] = 0] = "SUCCESS";
        ErrorCode[ErrorCode["RC_MSG_UNAUTHORIZED"] = 20406] = "RC_MSG_UNAUTHORIZED";
        /**
         * 群组 Id 无效
         */
        ErrorCode[ErrorCode["RC_DISCUSSION_GROUP_ID_INVALID"] = 20407] = "RC_DISCUSSION_GROUP_ID_INVALID";
        /**
         * 发送频率过快
         */
        ErrorCode[ErrorCode["SEND_FREQUENCY_TOO_FAST"] = 20604] = "SEND_FREQUENCY_TOO_FAST";
        /**
         * 不在讨论组。
         */
        ErrorCode[ErrorCode["NOT_IN_DISCUSSION"] = 21406] = "NOT_IN_DISCUSSION";
        /**
         * 群组被禁言
         */
        ErrorCode[ErrorCode["FORBIDDEN_IN_GROUP"] = 22408] = "FORBIDDEN_IN_GROUP";
        ErrorCode[ErrorCode["RECALL_MESSAGE"] = 25101] = "RECALL_MESSAGE";
        /**
         * 不在群组。
         */
        ErrorCode[ErrorCode["NOT_IN_GROUP"] = 22406] = "NOT_IN_GROUP";
        /**
         * 不在聊天室。
         */
        ErrorCode[ErrorCode["NOT_IN_CHATROOM"] = 23406] = "NOT_IN_CHATROOM";
        /**
         *聊天室被禁言
         */
        ErrorCode[ErrorCode["FORBIDDEN_IN_CHATROOM"] = 23408] = "FORBIDDEN_IN_CHATROOM";
        /**
         * 聊天室中成员被踢出
         */
        ErrorCode[ErrorCode["RC_CHATROOM_USER_KICKED"] = 23409] = "RC_CHATROOM_USER_KICKED";
        /**
         * 聊天室不存在
         */
        ErrorCode[ErrorCode["RC_CHATROOM_NOT_EXIST"] = 23410] = "RC_CHATROOM_NOT_EXIST";
        /**
         * 聊天室成员已满
         */
        ErrorCode[ErrorCode["RC_CHATROOM_IS_FULL"] = 23411] = "RC_CHATROOM_IS_FULL";
        /**
         * 获取聊天室信息参数无效
         */
        ErrorCode[ErrorCode["RC_CHATROOM_PATAMETER_INVALID"] = 23412] = "RC_CHATROOM_PATAMETER_INVALID";
        /**
         * 聊天室异常
         */
        ErrorCode[ErrorCode["CHATROOM_GET_HISTORYMSG_ERROR"] = 23413] = "CHATROOM_GET_HISTORYMSG_ERROR";
        /**
         * 没有打开聊天室消息存储
         */
        ErrorCode[ErrorCode["CHATROOM_NOT_OPEN_HISTORYMSG_STORE"] = 23414] = "CHATROOM_NOT_OPEN_HISTORYMSG_STORE";
        /**
         * 聊天室 KV 设置超出最大值(已满, 默认最多设置 100 个)
         */
        ErrorCode[ErrorCode["CHATROOM_KV_EXCEED"] = 23423] = "CHATROOM_KV_EXCEED";
        /**
         * 聊天室 KV 设置失败(kv 已存在, 需覆盖设置)
         */
        ErrorCode[ErrorCode["CHATROOM_KV_OVERWRITE_INVALID"] = 23424] = "CHATROOM_KV_OVERWRITE_INVALID";
        /**
         * 聊天室 KV 存储功能没有开通
         */
        ErrorCode[ErrorCode["CHATROOM_KV_STORE_NOT_OPEN"] = 23426] = "CHATROOM_KV_STORE_NOT_OPEN";
        /**
         * 聊天室Key不存在
         */
        ErrorCode[ErrorCode["CHATROOM_KEY_NOT_EXIST"] = 23427] = "CHATROOM_KEY_NOT_EXIST";
        /**
         * 敏感词屏蔽
         */
        ErrorCode[ErrorCode["SENSITIVE_SHIELD"] = 21501] = "SENSITIVE_SHIELD";
        ErrorCode[ErrorCode["SENSITIVE_REPLACE"] = 21502] = "SENSITIVE_REPLACE";
        /**
         * 加入讨论失败
         */
        ErrorCode[ErrorCode["JOIN_IN_DISCUSSION"] = 21407] = "JOIN_IN_DISCUSSION";
        /**
         * 创建讨论组失败
         */
        ErrorCode[ErrorCode["CREATE_DISCUSSION"] = 21408] = "CREATE_DISCUSSION";
        /**
         * 设置讨论组邀请状态失败
         */
        ErrorCode[ErrorCode["INVITE_DICUSSION"] = 21409] = "INVITE_DICUSSION";
        /**
         *获取用户失败
         */
        ErrorCode[ErrorCode["GET_USERINFO_ERROR"] = 23407] = "GET_USERINFO_ERROR";
        /**
         * 在黑名单中。
         */
        ErrorCode[ErrorCode["REJECTED_BY_BLACKLIST"] = 405] = "REJECTED_BY_BLACKLIST";
        /**
         * 通信过程中，当前 Socket 不存在。
         */
        ErrorCode[ErrorCode["RC_NET_CHANNEL_INVALID"] = 30001] = "RC_NET_CHANNEL_INVALID";
        /**
         * Socket 连接不可用。
         */
        ErrorCode[ErrorCode["RC_NET_UNAVAILABLE"] = 30002] = "RC_NET_UNAVAILABLE";
        /**
         * 通信超时。
         */
        ErrorCode[ErrorCode["RC_MSG_RESP_TIMEOUT"] = 30003] = "RC_MSG_RESP_TIMEOUT";
        /**
         * 导航操作时，Http 请求失败。
         */
        ErrorCode[ErrorCode["RC_HTTP_SEND_FAIL"] = 30004] = "RC_HTTP_SEND_FAIL";
        /**
         * HTTP 请求失败。
         */
        ErrorCode[ErrorCode["RC_HTTP_REQ_TIMEOUT"] = 30005] = "RC_HTTP_REQ_TIMEOUT";
        /**
         * HTTP 接收失败。
         */
        ErrorCode[ErrorCode["RC_HTTP_RECV_FAIL"] = 30006] = "RC_HTTP_RECV_FAIL";
        /**
         * 导航操作的 HTTP 请求，返回不是200。
         */
        ErrorCode[ErrorCode["RC_NAVI_RESOURCE_ERROR"] = 30007] = "RC_NAVI_RESOURCE_ERROR";
        /**
         * 导航数据解析后，其中不存在有效数据。
         */
        ErrorCode[ErrorCode["RC_NODE_NOT_FOUND"] = 30008] = "RC_NODE_NOT_FOUND";
        /**
         * 导航数据解析后，其中不存在有效 IP 地址。
         */
        ErrorCode[ErrorCode["RC_DOMAIN_NOT_RESOLVE"] = 30009] = "RC_DOMAIN_NOT_RESOLVE";
        /**
         * 创建 Socket 失败。
         */
        ErrorCode[ErrorCode["RC_SOCKET_NOT_CREATED"] = 30010] = "RC_SOCKET_NOT_CREATED";
        /**
         * Socket 被断开。
         */
        ErrorCode[ErrorCode["RC_SOCKET_DISCONNECTED"] = 30011] = "RC_SOCKET_DISCONNECTED";
        /**
         * PING 操作失败。
         */
        ErrorCode[ErrorCode["RC_PING_SEND_FAIL"] = 30012] = "RC_PING_SEND_FAIL";
        /**
         * PING 超时。
         */
        ErrorCode[ErrorCode["RC_PONG_RECV_FAIL"] = 30013] = "RC_PONG_RECV_FAIL";
        /**
         * 消息发送失败。
         */
        ErrorCode[ErrorCode["RC_MSG_SEND_FAIL"] = 30014] = "RC_MSG_SEND_FAIL";
        /**
         * JSON 后的消息体超限, 目前最大 128kb
         */
        ErrorCode[ErrorCode["RC_MSG_CONTENT_EXCEED_LIMIT"] = 30016] = "RC_MSG_CONTENT_EXCEED_LIMIT";
        /**
         * 做 connect 连接时，收到的 ACK 超时。
         */
        ErrorCode[ErrorCode["RC_CONN_ACK_TIMEOUT"] = 31000] = "RC_CONN_ACK_TIMEOUT";
        /**
         * 参数错误。
         */
        ErrorCode[ErrorCode["RC_CONN_PROTO_VERSION_ERROR"] = 31001] = "RC_CONN_PROTO_VERSION_ERROR";
        /**
         * 参数错误，App Id 错误。
         */
        ErrorCode[ErrorCode["RC_CONN_ID_REJECT"] = 31002] = "RC_CONN_ID_REJECT";
        /**
         * 服务器不可用。
         */
        ErrorCode[ErrorCode["RC_CONN_SERVER_UNAVAILABLE"] = 31003] = "RC_CONN_SERVER_UNAVAILABLE";
        /**
         * Token 错误。
         */
        ErrorCode[ErrorCode["RC_CONN_USER_OR_PASSWD_ERROR"] = 31004] = "RC_CONN_USER_OR_PASSWD_ERROR";
        /**
         * websocket 鉴权失败，通常为连接后未及时发送 Ping 或接收到 Pong
         */
        ErrorCode[ErrorCode["RC_CONN_NOT_AUTHRORIZED"] = 31005] = "RC_CONN_NOT_AUTHRORIZED";
        /**
         * 重定向，地址错误。
         */
        ErrorCode[ErrorCode["RC_CONN_REDIRECTED"] = 31006] = "RC_CONN_REDIRECTED";
        /**
         * NAME 与后台注册信息不一致。
         */
        ErrorCode[ErrorCode["RC_CONN_PACKAGE_NAME_INVALID"] = 31007] = "RC_CONN_PACKAGE_NAME_INVALID";
        /**
         * APP 被屏蔽、删除或不存在。
         */
        ErrorCode[ErrorCode["RC_CONN_APP_BLOCKED_OR_DELETED"] = 31008] = "RC_CONN_APP_BLOCKED_OR_DELETED";
        /**
         * 用户被屏蔽。
         */
        ErrorCode[ErrorCode["RC_CONN_USER_BLOCKED"] = 31009] = "RC_CONN_USER_BLOCKED";
        /**
         * Disconnect，由服务器返回，比如用户互踢。
         */
        ErrorCode[ErrorCode["RC_DISCONN_KICK"] = 31010] = "RC_DISCONN_KICK";
        /**
         * Disconnect，由服务器返回，比如用户互踢。
         */
        ErrorCode[ErrorCode["RC_DISCONN_EXCEPTION"] = 31011] = "RC_DISCONN_EXCEPTION";
        /**
         * 协议层内部错误。query，上传下载过程中数据错误。
         */
        ErrorCode[ErrorCode["RC_QUERY_ACK_NO_DATA"] = 32001] = "RC_QUERY_ACK_NO_DATA";
        /**
         * 协议层内部错误。
         */
        ErrorCode[ErrorCode["RC_MSG_DATA_INCOMPLETE"] = 32002] = "RC_MSG_DATA_INCOMPLETE";
        /**
         * 未调用 init 初始化函数。
         */
        ErrorCode[ErrorCode["BIZ_ERROR_CLIENT_NOT_INIT"] = 33001] = "BIZ_ERROR_CLIENT_NOT_INIT";
        /**
         * 数据库初始化失败。
         */
        ErrorCode[ErrorCode["BIZ_ERROR_DATABASE_ERROR"] = 33002] = "BIZ_ERROR_DATABASE_ERROR";
        /**
         * 传入参数无效。
         */
        ErrorCode[ErrorCode["BIZ_ERROR_INVALID_PARAMETER"] = 33003] = "BIZ_ERROR_INVALID_PARAMETER";
        /**
         * 通道无效。
         */
        ErrorCode[ErrorCode["BIZ_ERROR_NO_CHANNEL"] = 33004] = "BIZ_ERROR_NO_CHANNEL";
        /**
         * 重新连接成功。
         */
        ErrorCode[ErrorCode["BIZ_ERROR_RECONNECT_SUCCESS"] = 33005] = "BIZ_ERROR_RECONNECT_SUCCESS";
        /**
         * 连接中，再调用 connect 被拒绝。
         */
        ErrorCode[ErrorCode["BIZ_ERROR_CONNECTING"] = 33006] = "BIZ_ERROR_CONNECTING";
        /**
         * 消息漫游服务未开通
         */
        ErrorCode[ErrorCode["MSG_ROAMING_SERVICE_UNAVAILABLE"] = 33007] = "MSG_ROAMING_SERVICE_UNAVAILABLE";
        ErrorCode[ErrorCode["MSG_INSERT_ERROR"] = 33008] = "MSG_INSERT_ERROR";
        ErrorCode[ErrorCode["MSG_DEL_ERROR"] = 33009] = "MSG_DEL_ERROR";
        /**
         * 标签不存在
         */
        ErrorCode[ErrorCode["TAG_NOT_EXIST"] = 33101] = "TAG_NOT_EXIST";
        /**
         * 会话中不存在此标签
         */
        ErrorCode[ErrorCode["NO_TAG_IN_CONVER"] = 33102] = "NO_TAG_IN_CONVER";
        /**
         * 删除会话失败
         */
        ErrorCode[ErrorCode["CONVER_REMOVE_ERROR"] = 34001] = "CONVER_REMOVE_ERROR";
        /**
         *拉取历史消息
         */
        ErrorCode[ErrorCode["CONVER_GETLIST_ERROR"] = 34002] = "CONVER_GETLIST_ERROR";
        /**
         * 会话指定异常
         */
        ErrorCode[ErrorCode["CONVER_SETOP_ERROR"] = 34003] = "CONVER_SETOP_ERROR";
        /**
         * 获取会话未读消息总数失败
         */
        ErrorCode[ErrorCode["CONVER_TOTAL_UNREAD_ERROR"] = 34004] = "CONVER_TOTAL_UNREAD_ERROR";
        /**
         * 获取指定会话类型未读消息数异常
         */
        ErrorCode[ErrorCode["CONVER_TYPE_UNREAD_ERROR"] = 34005] = "CONVER_TYPE_UNREAD_ERROR";
        /**
         * 获取指定用户ID&会话类型未读消息数异常
         */
        ErrorCode[ErrorCode["CONVER_ID_TYPE_UNREAD_ERROR"] = 34006] = "CONVER_ID_TYPE_UNREAD_ERROR";
        ErrorCode[ErrorCode["CONVER_CLEAR_ERROR"] = 34007] = "CONVER_CLEAR_ERROR";
        /**
         * 扩展存储 key value 超出限制 (错误码与移动端对齐)
        */
        ErrorCode[ErrorCode["EXPANSION_LIMIT_EXCEET"] = 34010] = "EXPANSION_LIMIT_EXCEET";
        /**
         * 消息不支持扩展 (错误码与移动端对齐)
        */
        ErrorCode[ErrorCode["MESSAGE_KV_NOT_SUPPORT"] = 34008] = "MESSAGE_KV_NOT_SUPPORT";
        ErrorCode[ErrorCode["CLEAR_HIS_TIME_ERROR"] = 34011] = "CLEAR_HIS_TIME_ERROR";
        /**
         * 会话数量超出上限
         */
        ErrorCode[ErrorCode["CONVER_OUT_LIMIT_ERROR"] = 34013] = "CONVER_OUT_LIMIT_ERROR";
        ErrorCode[ErrorCode["CONVER_GET_ERROR"] = 34009] = "CONVER_GET_ERROR";
        /**
         * 群组信息异常
         */
        ErrorCode[ErrorCode["GROUP_SYNC_ERROR"] = 35001] = "GROUP_SYNC_ERROR";
        /**
         * 匹配群信息异常
         */
        ErrorCode[ErrorCode["GROUP_MATCH_ERROR"] = 35002] = "GROUP_MATCH_ERROR";
        // 聊天室异常
        /**
         * 加入聊天室Id为空
         */
        ErrorCode[ErrorCode["CHATROOM_ID_ISNULL"] = 36001] = "CHATROOM_ID_ISNULL";
        /**
         * 加入聊天室失败
         */
        ErrorCode[ErrorCode["CHARTOOM_JOIN_ERROR"] = 36002] = "CHARTOOM_JOIN_ERROR";
        /**
         * 拉取聊天室历史消息失败
         */
        ErrorCode[ErrorCode["CHATROOM_HISMESSAGE_ERROR"] = 36003] = "CHATROOM_HISMESSAGE_ERROR";
        /**
         * 聊天室 kv 未找到
         */
        ErrorCode[ErrorCode["CHATROOM_KV_NOT_FOUND"] = 36004] = "CHATROOM_KV_NOT_FOUND";
        // 黑名单异常
        /**
         * 加入黑名单异常
         */
        ErrorCode[ErrorCode["BLACK_ADD_ERROR"] = 37001] = "BLACK_ADD_ERROR";
        /**
         * 获得指定人员再黑名单中的状态异常
         */
        ErrorCode[ErrorCode["BLACK_GETSTATUS_ERROR"] = 37002] = "BLACK_GETSTATUS_ERROR";
        /**
         * 移除黑名单异常
         */
        ErrorCode[ErrorCode["BLACK_REMOVE_ERROR"] = 37003] = "BLACK_REMOVE_ERROR";
        /**
         * 获取草稿失败
         */
        ErrorCode[ErrorCode["DRAF_GET_ERROR"] = 38001] = "DRAF_GET_ERROR";
        /**
         * 保存草稿失败
         */
        ErrorCode[ErrorCode["DRAF_SAVE_ERROR"] = 38002] = "DRAF_SAVE_ERROR";
        /**
         * 删除草稿失败
         */
        ErrorCode[ErrorCode["DRAF_REMOVE_ERROR"] = 38003] = "DRAF_REMOVE_ERROR";
        /**
         * 关注公众号失败
         */
        ErrorCode[ErrorCode["SUBSCRIBE_ERROR"] = 39001] = "SUBSCRIBE_ERROR";
        /**
         * 方法未支持
         */
        ErrorCode[ErrorCode["NOT_SUPPORT"] = 39002] = "NOT_SUPPORT";
        /**
         * 关注公众号失败
         */
        ErrorCode[ErrorCode["QNTKN_FILETYPE_ERROR"] = 41001] = "QNTKN_FILETYPE_ERROR";
        /**
         * 获取七牛token失败
         */
        ErrorCode[ErrorCode["QNTKN_GET_ERROR"] = 41002] = "QNTKN_GET_ERROR";
        /**
         * cookie被禁用
         */
        ErrorCode[ErrorCode["COOKIE_ENABLE"] = 51001] = "COOKIE_ENABLE";
        ErrorCode[ErrorCode["GET_MESSAGE_BY_ID_ERROR"] = 61001] = "GET_MESSAGE_BY_ID_ERROR";
        // 没有注册DeviveId 也就是用户没有登陆
        ErrorCode[ErrorCode["HAVNODEVICEID"] = 24001] = "HAVNODEVICEID";
        // 已经存在
        ErrorCode[ErrorCode["DEVICEIDISHAVE"] = 24002] = "DEVICEIDISHAVE";
        // 没有对应的用户或token
        ErrorCode[ErrorCode["FEILD"] = 24009] = "FEILD";
        // voip为空
        ErrorCode[ErrorCode["VOIPISNULL"] = 24013] = "VOIPISNULL";
        // 不支持的Voip引擎
        ErrorCode[ErrorCode["NOENGINETYPE"] = 24010] = "NOENGINETYPE";
        // channleName 是空
        ErrorCode[ErrorCode["NULLCHANNELNAME"] = 24011] = "NULLCHANNELNAME";
        // 生成Voipkey失败
        ErrorCode[ErrorCode["VOIPDYANMICERROR"] = 24012] = "VOIPDYANMICERROR";
        // 没有配置voip
        ErrorCode[ErrorCode["NOVOIP"] = 24014] = "NOVOIP";
        // 服务器内部错误
        ErrorCode[ErrorCode["INTERNALERRROR"] = 24015] = "INTERNALERRROR";
        // VOIP close
        ErrorCode[ErrorCode["VOIPCLOSE"] = 24016] = "VOIPCLOSE";
        ErrorCode[ErrorCode["CLOSE_BEFORE_OPEN"] = 51001] = "CLOSE_BEFORE_OPEN";
        ErrorCode[ErrorCode["ALREADY_IN_USE"] = 51002] = "ALREADY_IN_USE";
        ErrorCode[ErrorCode["INVALID_CHANNEL_NAME"] = 51003] = "INVALID_CHANNEL_NAME";
        ErrorCode[ErrorCode["VIDEO_CONTAINER_IS_NULL"] = 51004] = "VIDEO_CONTAINER_IS_NULL";
        /**
         * 删除消息数组长度为 0 .
         */
        ErrorCode[ErrorCode["DELETE_MESSAGE_ID_IS_NULL"] = 61001] = "DELETE_MESSAGE_ID_IS_NULL";
        /**
         * 己方取消已发出的通话请求
         */
        ErrorCode[ErrorCode["CANCEL"] = 1] = "CANCEL";
        /**
         * 己方拒绝收到的通话请求
         */
        ErrorCode[ErrorCode["REJECT"] = 2] = "REJECT";
        /**
         * 己方挂断
         */
        ErrorCode[ErrorCode["HANGUP"] = 3] = "HANGUP";
        /**
         * 己方忙碌
         */
        ErrorCode[ErrorCode["BUSYLINE"] = 4] = "BUSYLINE";
        /**
         * 己方未接听
         */
        ErrorCode[ErrorCode["NO_RESPONSE"] = 5] = "NO_RESPONSE";
        /**
         * 己方不支持当前引擎
         */
        ErrorCode[ErrorCode["ENGINE_UN_SUPPORTED"] = 6] = "ENGINE_UN_SUPPORTED";
        /**
         * 己方网络出错
         */
        ErrorCode[ErrorCode["NETWORK_ERROR"] = 7] = "NETWORK_ERROR";
        /**
         * 对方取消已发出的通话请求
         */
        ErrorCode[ErrorCode["REMOTE_CANCEL"] = 11] = "REMOTE_CANCEL";
        /**
         * 对方拒绝收到的通话请求
         */
        ErrorCode[ErrorCode["REMOTE_REJECT"] = 12] = "REMOTE_REJECT";
        /**
         * 通话过程对方挂断
         */
        ErrorCode[ErrorCode["REMOTE_HANGUP"] = 13] = "REMOTE_HANGUP";
        /**
         * 对方忙碌
         */
        ErrorCode[ErrorCode["REMOTE_BUSYLINE"] = 14] = "REMOTE_BUSYLINE";
        /**
         * 对方未接听
         */
        ErrorCode[ErrorCode["REMOTE_NO_RESPONSE"] = 15] = "REMOTE_NO_RESPONSE";
        /**
         * 对方网络错误
         */
        ErrorCode[ErrorCode["REMOTE_ENGINE_UN_SUPPORTED"] = 16] = "REMOTE_ENGINE_UN_SUPPORTED";
        /**
         * 对方网络错误
         */
        ErrorCode[ErrorCode["REMOTE_NETWORK_ERROR"] = 17] = "REMOTE_NETWORK_ERROR";
        /**
         * VoIP 不可用
         */
        ErrorCode[ErrorCode["VOIP_NOT_AVALIABLE"] = 18] = "VOIP_NOT_AVALIABLE";
    })(ErrorCode || (ErrorCode = {}));
    var ErrorCode$1 = ErrorCode;

    const timerSetTimeout = (fun, itv) => {
        return setTimeout(fun, itv);
    };
    const int64ToTimestamp = (obj) => {
        if (!isObject(obj) || obj.low === undefined || obj.high === undefined) {
            return obj;
        }
        let low = obj.low;
        if (low < 0) {
            low += 0xffffffff + 1;
        }
        low = low.toString(16);
        const timestamp = parseInt(obj.high.toString(16) + '00000000'.replace(new RegExp('0{' + low.length + '}$'), low), 16);
        return timestamp;
    };
    const batchInt64ToTimestamp = (data) => {
        for (const key in data) {
            if (isObject(data[key])) {
                data[key] = int64ToTimestamp(data[key]);
            }
        }
        return data;
    };
    const formatDate = (seperator) => {
        seperator = seperator || '-';
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}${seperator}${month}${seperator}${day}`;
    };

    /**
     * engine 层业务相关工具方法
    */
    /**
     * 通过文件类型生成上传唯一文件名
    */
    const getUploadFileName = (type, fileName) => {
        const random = Math.floor((Math.random() * 1000) % 10000);
        const uuid = getUUID();
        const date = formatDate();
        const timestamp = new Date().getTime();
        let extension = '';
        if (fileName) {
            const fileNameArr = fileName.split('.');
            extension = '.' + fileNameArr[fileNameArr.length - 1];
        }
        return `${type}__RC-${date}_${random}_${timestamp}${uuid}${extension}`;
    };
    /**
     * 通过 fileType 获取 MIME
    */
    const getMimeKey = (fileType) => {
        let mimeKey = 'application/octet-stream';
        switch (fileType) {
            case FileType$1.IMAGE:
                mimeKey = 'image/jpeg';
                break;
            case FileType$1.AUDIO:
                mimeKey = 'audio/amr';
                break;
            case FileType$1.VIDEO:
                mimeKey = 'video/3gpp';
                break;
            case FileType$1.SIGHT:
                mimeKey = 'video/mpeg4';
                break;
            case FileType$1.COMBINE_HTML:
                mimeKey = 'text/html';
                break;
        }
        return mimeKey;
    };
    /**
     * 生成 pushConfigs JSON
     * @description
     * 与 Server 约定一致， threadId、apnsCollapseId、channelIdMi、channelIdHW、channelIdOPPO、typeVivo 无值时可传空字符串
    */
    const pushConfigsToJSON = (iOSConfig = {}, androidConfig = {}) => {
        const { threadId, apnsCollapseId } = iOSConfig;
        const { channelIdMi, channelIdHW, channelIdOPPO, typeVivo } = androidConfig;
        const APNS = {};
        APNS['thread-id'] = threadId || '';
        APNS['apns-collapse-id'] = apnsCollapseId || '';
        const pushCongfigs = [
            {
                HW: {
                    channelId: channelIdHW || ''
                }
            }, {
                MI: {
                    channelId: channelIdMi || ''
                }
            }, {
                OPPO: {
                    channelId: channelIdOPPO || ''
                }
            }, {
                VIVO: {
                    classification: typeVivo || ''
                }
            }, {
                APNS: APNS
            }
        ];
        return JSON.stringify(pushCongfigs);
    };
    const isValidChrmEntryKey = (key) => {
        const isValid = /^[A-Za-z0-9_=+-]+$/.test(key); // 大小写英文字母、数字、+、=、-、_
        const keyLen = key.length;
        const isLimit = keyLen <= 128 && keyLen >= 1;
        return isValid && isLimit;
    };
    const isValidChrmEntryValue = (value) => {
        const length = value.length;
        return length <= 4096 && length >= 1;
    };

    /**
     * @todo 后期禁用此方法，容易滥用，且会丢失上下文的数据类型跟踪
     * @deprecated
     * @param source
     * @param event
     * @param options
     */
    const forEach = (source, event, options) => {
        options = options || {};
        event = event || function () { };
        const { isReverse } = options;
        const loopObj = () => {
            for (const key in source) {
                event(source[key], key, source);
            }
        };
        const loopArr = () => {
            if (isReverse) {
                for (let i = source.length - 1; i >= 0; i--) {
                    event(source[i], i);
                }
            }
            else {
                for (let j = 0, len = source.length; j < len; j++) {
                    event(source[j], j);
                }
            }
        };
        if (isObject(source)) {
            loopObj();
        }
        if (isArray(source) || isString(source)) {
            loopArr();
        }
    };
    /**
     * @deprecated
     * @param source
     * @param event
     */
    const map = (source, event) => {
        forEach(source, (item, index) => {
            source[index] = event(item, index);
        });
        return source;
    };
    const indexOf = (source, searchVal) => {
        // 注: 字符串的 indexof 兼容至 IE3
        if (source.indexOf) {
            return source.indexOf(searchVal);
        }
        let index = -1;
        forEach(source, (sub, i) => {
            if (searchVal === sub) {
                index = i;
            }
        });
        return index;
    };
    const isInclude = (source, searchVal) => {
        const index = indexOf(source, searchVal);
        return index !== -1;
    };
    /**
     * 判断对象里是否有某个值
    */
    const isInObject = (source, searchVal) => {
        const arr = [];
        forEach(source, (val) => {
            arr.push(val);
        });
        const index = indexOf(arr, searchVal);
        return index !== -1;
    };
    /**
     * 通过 JSON 拷贝
    */
    const cloneByJSON = (sourceObj) => {
        return JSON.parse(JSON.stringify(sourceObj));
    };
    /**
     * 判断当前是否运行在 electron 环境且搭配 c++ 协议栈使用
     */
    const usingCppEngine = () => {
        return typeof RCCppEngine !== 'undefined';
    };

    /**
     *  聊天室 kv 存储操作类型. 对方操作, 己方收到消息(RC:chrmKVNotiMsg)中会带入此值. 根据此值判断是删除还是更新
    */
    var ChatroomEntryType;
    (function (ChatroomEntryType) {
        ChatroomEntryType[ChatroomEntryType["UPDATE"] = 1] = "UPDATE";
        ChatroomEntryType[ChatroomEntryType["DELETE"] = 2] = "DELETE";
    })(ChatroomEntryType || (ChatroomEntryType = {}));
    var ChatroomEntryType$1 = ChatroomEntryType;

    /**
     * 通过 status 计算接收到的消息的部分属性值
     * @description
     * status 转为二进制, 二进制的比特位存储消息的部分属性值
     * 属性所占比特位:
     * 0000-0010 该消息是否曾被该用户拉取过(其他端)
     * 0001-0000 isPersited
     * 0010-0000 isCounted
     * 0100-0000 isMentioned
     * 0010-0000-0000 disableNotification
     * 0100-0000-0000 canIncludeExpansion
    */
    const getMessageOptionByStatus = (status) => {
        let isPersited = true;
        let isCounted = true;
        let isMentioned = false;
        let disableNotification = false;
        let receivedStatus = ReceivedStatus$1.READ;
        let isReceivedByOtherClient = false;
        let canIncludeExpansion = false;
        isPersited = !!(status & 0x10);
        isCounted = !!(status & 0x20);
        isMentioned = !!(status & 0x40);
        disableNotification = !!(status & 0x200);
        isReceivedByOtherClient = !!(status & 0x02);
        receivedStatus = isReceivedByOtherClient ? ReceivedStatus$1.RETRIEVED : receivedStatus;
        canIncludeExpansion = !!(status & 0x400);
        return {
            isPersited,
            isCounted,
            isMentioned,
            disableNotification,
            receivedStatus,
            canIncludeExpansion
        };
    };
    /**
     * 通过 sessionId 计算发送消息成功后，发送消息的部分属性
     * @description
     * sessionId 转为二进制, 二进制的比特位存储消息的部分属性值
     * 属性所占比特位:
     * 0000-0001 isPersited
     * 0000-0010 isCounted
     * 0000-0100 isMentioned
     * 0010-0000 disableNotification
     * 0100-0000 canIncludeExpansion
    */
    const getUpMessageOptionBySessionId = (sessionId) => {
        let isPersited = false;
        let isCounted = false;
        let disableNotification = false;
        let canIncludeExpansion = false;
        isPersited = !!(sessionId & 0x01);
        isCounted = !!(sessionId & 0x02);
        disableNotification = !!(sessionId & 0x10);
        canIncludeExpansion = !!(sessionId & 0x40);
        return {
            isPersited,
            isCounted,
            disableNotification,
            canIncludeExpansion
        };
    };
    const formatExtraContent = (extraContent) => {
        const expansion = {}; // 扩展为用户任意设置的键值对
        const parseExtraContent = JSON.parse(extraContent);
        forEach(parseExtraContent, (value, key) => {
            expansion[key] = value.v;
        });
        return expansion;
    };
    /**
     * TODO: 确定对外暴露的必要性
     * @deprecated
     */
    const DelayTimer = {
        _delayTime: 0,
        /**
         * 方法并未引用，getTimer 实际返回值始终为 Date.now()
         * @deprecated
         */
        setTime: (time) => {
            const currentTime = new Date().getTime();
            DelayTimer._delayTime = currentTime - time;
        },
        getTime: () => {
            const delayTime = DelayTimer._delayTime;
            const currentTime = new Date().getTime();
            return currentTime - delayTime;
        }
    };
    const getChatRoomKVByStatus = (status) => {
        const isDeleteOpt = !!(status & 0x0004);
        return {
            isAutoDelete: !!(status & 0x0001),
            isOverwrite: !!(status & 0x0002),
            type: isDeleteOpt ? ChatroomEntryType$1.DELETE : ChatroomEntryType$1.UPDATE
        };
    };
    const getChatRoomKVOptStatus = (entity, action) => {
        let status = 0;
        // 是否自动清理
        if (entity.isAutoDelete) {
            status = status | 0x0001;
        }
        // 是否覆盖
        if (entity.isOverwrite) {
            status = status | 0x0002;
        }
        // 操作类型
        if (action === 2) {
            status = status | 0x0004;
        }
        return status;
    };
    const getSessionId = (option) => {
        const { isStatusMessage } = option;
        let { isPersited, isCounted, isMentioned, disableNotification, canIncludeExpansion } = option;
        if (isStatusMessage) {
            isPersited = isCounted = false;
        }
        let sessionId = 0;
        if (isPersited) {
            sessionId = sessionId | 0x01;
        }
        if (isCounted) {
            sessionId = sessionId | 0x02;
        }
        if (isMentioned) {
            sessionId = sessionId | 0x04;
        }
        if (disableNotification) {
            sessionId = sessionId | 0x20;
        }
        if (canIncludeExpansion) {
            sessionId = sessionId | 0x40;
        }
        return sessionId;
    };

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    /**
     * 通信协议中 fixHeader 第一个字节中的 Qos 数据标识
     * ```
     * fixHeader：command(4 bit) | dup(1 bit) | Qos(2 bit) | retain(1 bit)
     * ```
     */
    var QOS;
    (function (QOS) {
        QOS[QOS["AT_MOST_ONCE"] = 0] = "AT_MOST_ONCE";
        QOS[QOS["AT_LEAST_ONCE"] = 1] = "AT_LEAST_ONCE";
        QOS[QOS["EXACTLY_ONCE"] = 2] = "EXACTLY_ONCE";
        QOS[QOS["DEFAULT"] = 3] = "DEFAULT";
    })(QOS || (QOS = {}));
    /**
     * 通信协议中 fixHeader 第一个字节中的 command 数据标识，用于判断操作类型
     * ```
     * fixHeader：command(4 bit) | dup(1 bit) | Qos(2 bit) | retain(1 bit)
     * ```
     */
    var OperationType;
    (function (OperationType) {
        /** 私有云专用，解密协商指令 */
        OperationType[OperationType["SYMMETRIC"] = 0] = "SYMMETRIC";
        /** 连接请求 */
        OperationType[OperationType["CONNECT"] = 1] = "CONNECT";
        /** 连接应答 */
        OperationType[OperationType["CONN_ACK"] = 2] = "CONN_ACK";
        /** 上行发送消息 */
        OperationType[OperationType["PUBLISH"] = 3] = "PUBLISH";
        /** 上行发送消息的应答 */
        OperationType[OperationType["PUB_ACK"] = 4] = "PUB_ACK";
        /** 上行拉消息 */
        OperationType[OperationType["QUERY"] = 5] = "QUERY";
        /** 上行拉消息的应答 */
        OperationType[OperationType["QUERY_ACK"] = 6] = "QUERY_ACK";
        /** QueryConfirm */
        OperationType[OperationType["QUERY_CONFIRM"] = 7] = "QUERY_CONFIRM";
        OperationType[OperationType["SUBSCRIBE"] = 8] = "SUBSCRIBE";
        OperationType[OperationType["SUB_ACK"] = 9] = "SUB_ACK";
        OperationType[OperationType["UNSUBSCRIBE"] = 10] = "UNSUBSCRIBE";
        OperationType[OperationType["UNSUB_ACK"] = 11] = "UNSUB_ACK";
        OperationType[OperationType["PING_REQ"] = 12] = "PING_REQ";
        OperationType[OperationType["PING_RESP"] = 13] = "PING_RESP";
        /** 连接挂断 */
        OperationType[OperationType["DISCONNECT"] = 14] = "DISCONNECT";
        OperationType[OperationType["RESERVER2"] = 15] = "RESERVER2";
    })(OperationType || (OperationType = {}));
    var MessageName;
    (function (MessageName) {
        MessageName["CONN_ACK"] = "ConnAckMessage";
        MessageName["DISCONNECT"] = "DisconnectMessage";
        MessageName["PING_REQ"] = "PingReqMessage";
        MessageName["PING_RESP"] = "PingRespMessage";
        MessageName["PUBLISH"] = "PublishMessage";
        MessageName["PUB_ACK"] = "PubAckMessage";
        MessageName["QUERY"] = "QueryMessage";
        MessageName["QUERY_CON"] = "QueryConMessage";
        MessageName["QUERY_ACK"] = "QueryAckMessage";
    })(MessageName || (MessageName = {}));
    var IDENTIFIER;
    (function (IDENTIFIER) {
        IDENTIFIER["PUB"] = "pub";
        IDENTIFIER["QUERY"] = "qry";
    })(IDENTIFIER || (IDENTIFIER = {}));

    /**
     * @todo 注释补全
     * @description
     * Header 处理
    */
    class Header {
        constructor(type, retain = false, qos = QOS.AT_LEAST_ONCE, dup = false) {
            this._retain = false;
            this.qos = QOS.AT_LEAST_ONCE;
            this._dup = false;
            this.syncMsg = false;
            const isPlusType = type > 0; // 是否为正数
            if (type && isPlusType && arguments.length === 1) {
                this._retain = (type & 1) > 0;
                this.qos = (type & 6) >> 1; // (_type & 0b110) >> 1
                this._dup = (type & 8) > 0; // (_type & 0b1000) > 0
                this.type = (type >> 4) & 15; // (_type >> 0b100) & 0b1111
                this.syncMsg = (type & 8) === 8; // (_type & 0b1000) === 0b1000;
            }
            else {
                this.type = type;
                this._retain = retain;
                this.qos = qos;
                this._dup = dup;
            }
        }
        encode() {
            // const validQosList = [QOS.AT_MOST_ONCE, QOS.AT_LEAST_ONCE, QOS.EXACTLY_ONCE, QOS.DEFAULT]
            // // 如果 qos 为字符串, 此处转为数字
            // for (let i = 0; i < validQosList.length; i++) {
            //   if (this.qos === validQosList[i]) {
            //     this.qos = validQosList[i]
            //   }
            // }
            let byte = (this.type << 4); // 4 -> 100
            byte |= this._retain ? 1 : 0;
            byte |= this.qos << 1;
            byte |= this._dup ? 8 : 0; // 8 -> 1000
            return byte;
        }
    }
    /**
     * @description
     * 二进制处理
    */
    class BinaryHelper {
        /**
         * @description
         * 将字符串转化为 utf8 编码组成的数组
         * @param {string} str 待转化的字符串
         * @param {boolean} isGetBytes 是否向前插入字符长度
         */
        static writeUTF(str, isGetBytes) {
            const back = [];
            let byteSize = 0;
            if (isString(str)) {
                for (let i = 0, len = str.length; i < len; i++) {
                    const code = str.charCodeAt(i);
                    if (code >= 0 && code <= 127) {
                        byteSize += 1;
                        back.push(code);
                    }
                    else if (code >= 128 && code <= 2047) {
                        byteSize += 2;
                        back.push((192 | (31 & (code >> 6))));
                        back.push((128 | (63 & code)));
                    }
                    else if (code >= 2048 && code <= 65535) {
                        byteSize += 3;
                        back.push((224 | (15 & (code >> 12))));
                        back.push((128 | (63 & (code >> 6))));
                        back.push((128 | (63 & code)));
                    }
                }
            }
            for (let i = 0, len = back.length; i < len; i++) {
                if (back[i] > 255) {
                    back[i] &= 255;
                }
            }
            if (isGetBytes) {
                return back;
            }
            if (byteSize <= 255) {
                return [0, byteSize].concat(back);
            }
            else {
                return [byteSize >> 8, byteSize & 255].concat(back);
            }
        }
        /**
         * @description
         * 获取二进制字节流的 utf8 编码结果
         * @param {Array<number>} arr 二进制数据
         */
        static readUTF(arr) {
            const MAX_SIZE = 0x4000;
            const codeUnits = [];
            let highSurrogate;
            let lowSurrogate;
            let index = -1;
            const strBytes = arr;
            let result = '';
            while (++index < strBytes.length) {
                let codePoint = Number(strBytes[index]);
                if (codePoint === (codePoint & 0x7F)) ;
                else if ((codePoint & 0xF0) === 0xF0) {
                    codePoint ^= 0xF0;
                    codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                    codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                    codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                }
                else if ((codePoint & 0xE0) === 0xE0) {
                    codePoint ^= 0xE0;
                    codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                    codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                }
                else if ((codePoint & 0xC0) === 0xC0) {
                    codePoint ^= 0xC0;
                    codePoint = (codePoint << 6) | (strBytes[++index] ^ 0x80);
                }
                if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || Math.floor(codePoint) !== codePoint) {
                    throw RangeError('Invalid code point: ' + codePoint);
                }
                if (codePoint <= 0xFFFF) {
                    codeUnits.push(codePoint);
                }
                else {
                    codePoint -= 0x10000;
                    highSurrogate = (codePoint >> 10) | 0xD800;
                    lowSurrogate = (codePoint % 0x400) | 0xDC00;
                    codeUnits.push(highSurrogate, lowSurrogate);
                }
                if (index + 1 === strBytes.length || codeUnits.length > MAX_SIZE) {
                    result += String.fromCharCode.apply(null, codeUnits);
                    codeUnits.length = 0;
                }
            }
            return result;
        }
    }
    /**
     * @description
     * 融云读取二进制数据
    */
    class RongStreamReader {
        constructor(arr) {
            // 当前流已截取到的位置
            this._position = 0;
            // 待处理数据的总长度
            this._poolLen = 0;
            this._pool = arr;
            this._poolLen = arr.length;
        }
        check() {
            return this._position >= this._pool.length;
        }
        /**
         * 读 4 位
         */
        readInt() {
            const self = this;
            if (self.check()) {
                return -1;
            }
            let end = '';
            for (let i = 0; i < 4; i++) {
                let t = self._pool[self._position++].toString(16);
                if (t.length === 1) {
                    t = '0' + t;
                }
                end += t.toString();
            }
            return parseInt(end, 16);
        }
        /**
         * 读 8 位
         */
        readLong() {
            const self = this;
            if (self.check()) {
                return -1;
            }
            let end = '';
            for (let i = 0; i < 8; i++) {
                let t = self._pool[self._position++].toString(16);
                if (t.length === 1) {
                    t = '0' + t;
                }
                end += t;
            }
            return parseInt(end, 16);
        }
        /**
         * 读 1 位
         */
        readByte() {
            if (this.check()) {
                return -1;
            }
            let val = this._pool[this._position++];
            if (val > 255) {
                val &= 255;
            }
            return val;
        }
        /**
         * 获取数据
         */
        readUTF() {
            if (this.check()) {
                return '';
            }
            const big = (this.readByte() << 8) | this.readByte();
            const pool = this._pool.subarray(this._position, this._position += big);
            return BinaryHelper.readUTF(pool);
        }
        /**
         * 读剩余的所有值
         */
        readAll() {
            return this._pool.subarray(this._position, this._poolLen);
        }
    }
    /**
     * @description
     * 融云写入二进制数据
    */
    class RongStreamWriter {
        constructor() {
            // 待处理的数据, 由 server 直接抛出的数据
            this._pool = [];
            // 当前流已截取到的位置
            this._position = 0;
            // 当前流写入的多少字节
            this._writen = 0;
        }
        /**
         * 写入缓存区, writen 值往后移
         */
        write(byte) {
            // todo
            if (Object.prototype.toString.call(byte).indexOf('Array') !== -1) {
                this._pool = this._pool.concat(byte);
            }
            else if (byte >= 0) {
                if (byte > 255) {
                    byte &= 255;
                }
                this._pool.push(byte);
                this._writen++;
            }
            return byte;
        }
        writeArr(byte) {
            this._pool = this._pool.concat(byte);
            return byte;
        }
        // PENDING. 用于 ConnectMessage, 暂未知此消息用途
        // writeChat(v: number) {
        //   if (+v != v) {
        //     throw new Error("writeChar:arguments type is error");
        //   }
        //   this.write(v >> 8 & 255);
        //   this.write(v & 255);
        //   this.writen += 2;
        // }
        writeUTF(str) {
            const val = BinaryHelper.writeUTF(str);
            this._pool = this._pool.concat(val);
            this._writen += val.length;
        }
        // PENDING. 暂仅知道 write 时使用, 此时 this.poolLen 为 0, 调用无意义
        // toComplements(): any {
        //   var _tPool = this.pool;
        //   for (var i = 0; i < this.poolLen; i++) {
        //     if (_tPool[i] > 128) {
        //       _tPool[i] -= 256;
        //     }
        //   }
        //   return _tPool;
        // }
        getBytesArray() {
            return this._pool;
        }
    }

    var PBName = {
        UpStreamMessage: 'UpStreamMessage',
        PushExtra: 'PushExtra',
        DownStreamMessage: 'DownStreamMessage',
        DownStreamMessages: 'DownStreamMessages',
        SessionsAttQryInput: 'SessionsAttQryInput',
        SessionsAttOutput: 'SessionsAttOutput',
        SyncRequestMsg: 'SyncRequestMsg',
        ChrmPullMsg: 'ChrmPullMsg',
        NotifyMsg: 'NotifyMsg',
        HistoryMsgInput: 'HistoryMsgInput',
        HistoryMsgOuput: 'HistoryMsgOuput',
        RelationQryInput: 'RelationQryInput',
        RelationsOutput: 'RelationsOutput',
        DeleteSessionsInput: 'DeleteSessionsInput',
        SessionInfo: 'SessionInfo',
        DeleteSessionsOutput: 'DeleteSessionsOutput',
        RelationsInput: 'RelationsInput',
        DeleteMsgInput: 'DeleteMsgInput',
        CleanHisMsgInput: 'CleanHisMsgInput',
        SessionMsgReadInput: 'SessionMsgReadInput',
        ChrmInput: 'ChrmInput',
        QueryChatRoomInfoInput: 'QueryChatRoomInfoInput',
        QueryChatRoomInfoOutput: 'QueryChatRoomInfoOutput',
        RtcInput: 'RtcInput',
        RtcUserListOutput: 'RtcUserListOutput',
        SetUserStatusInput: 'SetUserStatusInput',
        RtcSetDataInput: 'RtcSetDataInput',
        RtcUserSetDataInput: 'RtcUserSetDataInput',
        RtcDataInput: 'RtcDataInput',
        RtcSetOutDataInput: 'RtcSetOutDataInput',
        MCFollowInput: 'MCFollowInput',
        RtcTokenOutput: 'RtcTokenOutput',
        RtcQryOutput: 'RtcQryOutput',
        RtcQryUserOutDataInput: 'RtcQryUserOutDataInput',
        RtcUserOutDataOutput: 'RtcUserOutDataOutput',
        RtcQueryListInput: 'RtcQueryListInput',
        RtcRoomInfoOutput: 'RtcRoomInfoOutput',
        RtcValueInfo: 'RtcValueInfo',
        RtcKeyDeleteInput: 'RtcKeyDeleteInput',
        GetQNupTokenInput: 'GetQNupTokenInput',
        GetQNupTokenOutput: 'GetQNupTokenOutput',
        GetQNdownloadUrlInput: 'GetQNdownloadUrlInput',
        GetDownloadUrlInput: 'GetDownloadUrlInput',
        GetQNdownloadUrlOutput: 'GetQNdownloadUrlOutput',
        GetDownloadUrlOutput: 'GetDownloadUrlOutput',
        SetChrmKV: 'SetChrmKV',
        ChrmKVOutput: 'ChrmKVOutput',
        QueryChrmKV: 'QueryChrmKV',
        SetUserSettingInput: 'SetUserSettingInput',
        SetUserSettingOutput: 'SetUserSettingOutput',
        PullUserSettingInput: 'PullUserSettingInput',
        PullUserSettingOutput: 'PullUserSettingOutput',
        UserSettingNotification: 'UserSettingNotification',
        SessionReq: 'SessionReq',
        SessionStates: 'SessionStates',
        SessionState: 'SessionState',
        SessionStateItem: 'SessionStateItem',
        SessionStateModifyReq: 'SessionStateModifyReq',
        SessionStateModifyResp: 'SessionStateModifyResp',
        SessionTagAddInput: 'SessionTagAddInput',
        SessionTagItem: 'SessionTagItem',
        SessionTagDelInput: 'SessionTagDelInput',
        SessionDisTagReq: 'SessionDisTagReq' // 解除会话标签关系
    };

    const SSMsg = {
        [PBName.UpStreamMessage]: ['sessionId', 'classname', 'content', 'pushText', 'userId', 'configFlag', 'appData', 'extraContent', 'pushExt'],
        [PBName.DownStreamMessages]: ['list', 'syncTime', 'finished'],
        [PBName.DownStreamMessage]: ['fromUserId', 'type', 'groupId', 'classname', 'content', 'dataTime', 'status', 'msgId', 'extraContent', 'pushContent', 'configFlag', 'pushExt'],
        [PBName.PushExtra]: ['title', 'templateIdNoUse', 'pushId', 'pushConfigs', 'templateId'],
        [PBName.SessionsAttQryInput]: ['nothing'],
        [PBName.SessionsAttOutput]: ['inboxTime', 'sendboxTime', 'totalUnreadCount'],
        [PBName.SyncRequestMsg]: ['syncTime', 'ispolling', 'isweb', 'isPullSend', 'isKeeping', 'sendBoxSyncTime'],
        [PBName.ChrmPullMsg]: ['syncTime', 'count'],
        [PBName.NotifyMsg]: ['type', 'time', 'chrmId'],
        [PBName.HistoryMsgInput]: ['targetId', 'time', 'count', 'order'],
        [PBName.HistoryMsgOuput]: ['list', 'syncTime', 'hasMsg'],
        [PBName.RelationQryInput]: ['type', 'count', 'startTime', 'order'],
        [PBName.RelationsOutput]: ['info'],
        [PBName.DeleteSessionsInput]: ['sessions'],
        [PBName.SessionInfo]: ['type', 'channelId'],
        [PBName.DeleteSessionsOutput]: ['nothing'],
        [PBName.RelationsInput]: ['type', 'msg', 'count', 'offset', 'startTime', 'endTime'],
        [PBName.DeleteMsgInput]: ['type', 'conversationId', 'msgs'],
        [PBName.CleanHisMsgInput]: ['targetId', 'dataTime', 'conversationType'],
        [PBName.SessionMsgReadInput]: ['type', 'msgTime', 'channelId'],
        [PBName.ChrmInput]: ['nothing'],
        [PBName.QueryChatRoomInfoInput]: ['count', 'order'],
        [PBName.QueryChatRoomInfoOutput]: ['userTotalNums', 'userInfos'],
        [PBName.GetQNupTokenInput]: ['type', 'key'],
        [PBName.GetQNdownloadUrlInput]: ['type', 'key', 'fileName'],
        [PBName.GetDownloadUrlInput]: ['type', 'key', 'fileName'],
        [PBName.GetQNupTokenOutput]: ['deadline', 'token', 'bosToken', 'bosDate', 'path', 'osskeyId', 'ossPolicy', 'ossSign', 'ossBucketName'],
        [PBName.GetQNdownloadUrlOutput]: ['downloadUrl'],
        [PBName.GetDownloadUrlOutput]: ['downloadUrl'],
        [PBName.SetChrmKV]: ['entry', 'bNotify', 'notification', 'type'],
        [PBName.ChrmKVOutput]: ['entries', 'bFullUpdate', 'syncTime'],
        [PBName.QueryChrmKV]: ['timestamp'],
        [PBName.SetUserSettingInput]: ['version', 'value'],
        [PBName.SetUserSettingOutput]: ['version', 'reserve'],
        [PBName.PullUserSettingInput]: ['version', 'reserve'],
        [PBName.PullUserSettingOutput]: ['items', 'version'],
        UserSettingItem: ['targetId', 'type', 'key', 'value', 'version', 'status', 'tags'],
        [PBName.SessionReq]: ['time'],
        [PBName.SessionStates]: ['version', 'state'],
        [PBName.SessionState]: ['type', 'channelId', 'time', 'stateItem'],
        [PBName.SessionStateItem]: ['sessionStateType', 'value', 'tags'],
        [PBName.SessionStateModifyReq]: ['version', 'state'],
        [PBName.SessionStateModifyResp]: ['version'],
        [PBName.SessionTagAddInput]: ['version', 'tags'],
        [PBName.SessionTagItem]: ['tagId', 'name', 'createdTime', 'isTop'],
        [PBName.SessionTagDelInput]: ['version', 'tags'],
        [PBName.SessionDisTagReq]: ['tagId'],
        [PBName.UserSettingNotification]: ['version', 'reserve']
    };

    const Codec = {};
    for (const key in SSMsg) {
        const paramsList = SSMsg[key];
        Codec[key] = () => {
            const data = {};
            const ins = {
                getArrayData() {
                    return data;
                }
            };
            for (let i = 0; i < paramsList.length; i++) {
                const param = paramsList[i];
                const setEventName = `set${toUpperCase(param, 0, 1)}`;
                ins[setEventName] = (item) => {
                    data[param] = item;
                };
            }
            return ins;
        };
        Codec[key].decode = function (data) {
            const decodeResult = {};
            if (isString(data)) {
                data = JSON.parse(data);
            }
            for (const key in data) {
                const getEventName = `get${toUpperCase(key, 0, 1)}`;
                decodeResult[key] = data[key];
                decodeResult[getEventName] = () => {
                    return data[key];
                };
            }
            return decodeResult;
        };
    }
    Codec.getModule = (pbName) => {
        return Codec[pbName]();
    };

    const SSMsg$1 = `
package Modules;
message probuf {
  message ${PBName.SetUserStatusInput}
  {
    optional int32 status=1;
  }

  message SetUserStatusOutput
  {
    optional int32 nothing=1;
  }

  message GetUserStatusInput
  {
    optional int32 nothing=1;
  }

  message GetUserStatusOutput
  {
    optional string status=1;
    optional string subUserId=2;
  }

  message SubUserStatusInput
  {
    repeated string userid =1;
  }

  message SubUserStatusOutput
  {
    optional int32 nothing=1;
  }
  message VoipDynamicInput
  {
    required int32  engineType = 1;
    required string channelName = 2;
    optional string channelExtra = 3;
  }

  message VoipDynamicOutput
  {
      required string dynamicKey=1;
  }
  message ${PBName.NotifyMsg} {
    required int32 type = 1;
    optional int64 time = 2;
    optional string chrmId=3;
  }
  message ${PBName.SyncRequestMsg} {
    required int64 syncTime = 1;
    required bool ispolling = 2;
    optional bool isweb=3;
    optional bool isPullSend=4;
    optional bool isKeeping=5;
    optional int64 sendBoxSyncTime=6;
  }
  message ${PBName.UpStreamMessage} {
    required int32 sessionId = 1;
    required string classname = 2;
    required bytes content = 3;
    optional string pushText = 4;
    optional string appData = 5;
    repeated string userId = 6;
    optional int64 delMsgTime = 7;
    optional string delMsgId = 8;
    optional int32 configFlag = 9;
    optional int64 clientUniqueId = 10;
    optional string extraContent = 11;
    optional PushExtra pushExt = 12;
  }
  message ${PBName.PushExtra} {
    optional string title = 1;
    optional int32  templateIdNoUse= 2;
    optional string pushId = 3;
    optional string pushConfigs = 4;
    optional string templateId = 5;
  }
  message ${PBName.DownStreamMessages} {
    repeated DownStreamMessage list = 1;
    required int64 syncTime = 2;
    optional bool finished = 3;
  }
  message ${PBName.DownStreamMessage} {
    required string fromUserId = 1;
    required ChannelType type = 2;
    optional string groupId = 3;
    required string classname = 4;
    required bytes content = 5;
    required int64 dataTime = 6;
    required int64 status = 7;
    optional int64 extra = 8;
    optional string msgId = 9;
    optional int32 direction = 10;
    optional int32 plantform =11;
    optional int32 isRemoved = 12;
    optional string source = 13;
    optional int64 clientUniqueId = 14;
    optional string extraContent = 15;
    optional string pushContent = 16;
    optional int32 configFlag = 17;
    optional PushExtra pushExt = 18;
  }
  enum ChannelType {
    PERSON = 1;
    PERSONS = 2;
    GROUP = 3;
    TEMPGROUP = 4;
    CUSTOMERSERVICE = 5;
    NOTIFY = 6;
    MC=7;
    MP=8;
  }
  message CreateDiscussionInput {
    optional string name = 1;
  }
  message CreateDiscussionOutput {
    required string id = 1;
  }
  message ChannelInvitationInput {
    repeated string users = 1;
  }
  message LeaveChannelInput {
    required int32 nothing = 1;
  }
  message ChannelEvictionInput {
    required string user = 1;
  }
  message RenameChannelInput {
    required string name = 1;
  }
  message ChannelInfoInput {
    required int32 nothing = 1;
  }
  message ChannelInfoOutput {
    required ChannelType type = 1;
    required string channelId = 2;
    required string channelName = 3;
    required string adminUserId = 4;
    repeated string firstTenUserIds = 5;
    required int32 openStatus = 6;
  }
  message ChannelInfosInput {
    required int32 page = 1;
    optional int32 number = 2;
  }
  message ChannelInfosOutput {
    repeated ChannelInfoOutput channels = 1;
    required int32 total = 2;
  }
  message MemberInfo {
    required string userId = 1;
    required string userName = 2;
    required string userPortrait = 3;
    required string extension = 4;
  }
  message GroupMembersInput {
    required int32 page = 1;
    optional int32 number = 2;
  }
  message GroupMembersOutput {
    repeated MemberInfo members = 1;
    required int32 total = 2;
  }
  message GetUserInfoInput {
    required int32 nothing = 1;
  }
  message GetUserInfoOutput {
    required string userId = 1;
    required string userName = 2;
    required string userPortrait = 3;
  }
  message GetSessionIdInput {
    required int32 nothing = 1;
  }
  message GetSessionIdOutput {
    required int32 sessionId = 1;
  }
  enum FileType {
    image = ${FileType$1.IMAGE};
    audio = ${FileType$1.AUDIO};
    video = ${FileType$1.VIDEO};
    file = ${FileType$1.FILE};
  }
  message ${PBName.GetQNupTokenInput} {
    required FileType type = 1;
    optional string key = 2;
    optional string httpMethod = 3;
    optional string queryString = 4;
  }
  message ${PBName.GetQNdownloadUrlInput} {
    required FileType type = 1;
    required string key = 2;
    optional string  fileName = 3;
  }
  message ${PBName.GetDownloadUrlInput} {
    required FileType type = 1;
    required string key = 2;
    optional string fileName = 3;
   }
  message ${PBName.GetQNupTokenOutput} {
    required int64 deadline = 1;
    required string token = 2;
    optional string bosToken = 3;
    optional string bosDate = 4;
    optional string path = 5;
    optional string osskeyId = 6;
    optional string ossPolicy = 7;
    optional string ossSign = 8;
    optional string ossBucketName = 9;
    optional string s3Credential = 10;
    optional string s3Algorithm = 11;
    optional string s3Date = 12;
    optional string s3Policy = 13;
    optional string s3Signature = 14;
    optional string s3BucketName = 15;
    optional string stcAuthorization = 16;
    optional string stcContentSha256 = 17;
    optional string stcDate = 18;
    optional string stcBucketName = 19;
  }
  message ${PBName.GetQNdownloadUrlOutput} {
    required string downloadUrl = 1;
  }
  message ${PBName.GetDownloadUrlOutput} {
    required string downloadUrl = 1;
  }
  message Add2BlackListInput {
    required string userId = 1;
  }
  message RemoveFromBlackListInput {
    required string userId = 1;
  }
  message QueryBlackListInput {
    required int32 nothing = 1;
  }
  message QueryBlackListOutput {
    repeated string userIds = 1;
  }
  message BlackListStatusInput {
    required string userId = 1;
  }
  message BlockPushInput {
    required string blockeeId = 1;
  }
  message ModifyPermissionInput {
    required int32 openStatus = 1;
  }
  message GroupInput {
    repeated GroupInfo groupInfo = 1;
  }
  message GroupOutput {
    required int32 nothing = 1;
  }
  message GroupInfo {
    required string id = 1;
    required string name = 2;
  }
  message GroupHashInput {
    required string userId = 1;
    required string groupHashCode = 2;
  }
  message GroupHashOutput {
    required GroupHashType result = 1;
  }
  enum GroupHashType {
    group_success = 0x00;
    group_failure = 0x01;
  }
  message ${PBName.ChrmInput} {
    required int32 nothing = 1;
  }
  message ChrmOutput {
    required int32 nothing = 1;
  }
  message ${PBName.ChrmPullMsg} {
    required int64 syncTime = 1;
    required int32 count = 2;
  }
  
  message ChrmPullMsgNew 
  {
    required int32 count = 1;
    required int64 syncTime = 2;
    optional string chrmId=3;
  }
  message ${PBName.RelationQryInput}
  {
    optional ChannelType type = 1;
    optional int32 count = 2;
    optional int64 startTime = 3;
    optional int32 order = 4;
  }
  message ${PBName.RelationsInput}
  {
    required ChannelType type = 1;
    optional DownStreamMessage msg =2;
    optional int32 count = 3;
    optional int32 offset = 4;
    optional int64 startTime = 5;
    optional int64 endTime = 6;
  }
  message ${PBName.RelationsOutput}
  {
    repeated RelationInfo info = 1;
  }
  message RelationInfo
  {
    required ChannelType type = 1;
    required string userId = 2;
    optional DownStreamMessage msg =3;
    optional int64 readMsgTime= 4;
    optional int64 unreadCount= 5;
  }
  message RelationInfoReadTime
  {
    required ChannelType type = 1;
    required int64 readMsgTime= 2;
    required string targetId = 3;
  }
  message ${PBName.CleanHisMsgInput}
  {
      required string targetId = 1;
      required int64 dataTime = 2;
      optional int32 conversationType= 3;
  }
  message HistoryMessageInput
  {
    required string targetId = 1;
    required int64 dataTime =2;
    required int32 size  = 3;
  }

  message HistoryMessagesOuput
  {
    repeated DownStreamMessage list = 1;
    required int64 syncTime = 2;
    required int32 hasMsg = 3;
  }
  message ${PBName.QueryChatRoomInfoInput}
  {
    required int32 count= 1;
    optional int32 order= 2;
  }

  message ${PBName.QueryChatRoomInfoOutput}
  {
    optional int32 userTotalNums = 1;
    repeated ChrmMember userInfos = 2;
  }
  message ChrmMember
  {
    required int64 time = 1;
    required string id = 2;
  }
  message MPFollowInput
  {
    required string id = 1;
  }

  message MPFollowOutput
  {
    required int32 nothing = 1;
    optional MpInfo info =2;
  }

  message ${PBName.MCFollowInput}
  {
    required string id = 1;
  }

  message MCFollowOutput
  {
    required int32 nothing = 1;
    optional MpInfo info =2;
  }

  message MpInfo  
  {
    required string mpid=1;
    required string name = 2;
    required string type = 3;
    required int64 time=4;
    optional string portraitUrl=5;
    optional string extra =6;
  }

  message SearchMpInput
  {
    required int32 type=1;
    required string id=2;
  }

  message SearchMpOutput
  {
    required int32 nothing=1;
    repeated MpInfo info = 2;
  }

  message PullMpInput
  {
    required int64 time=1;
    required string mpid=2;
  }

  message PullMpOutput
  {
    required int32 status=1;
    repeated MpInfo info = 2;
  }
  message ${PBName.HistoryMsgInput}
  {
    optional string targetId = 1;
    optional int64 time = 2;
    optional int32 count  = 3;
    optional int32 order = 4;
  }

  message ${PBName.HistoryMsgOuput}
  {
    repeated DownStreamMessage list=1;
    required int64 syncTime=2;
    required int32 hasMsg=3;
  }
  message ${PBName.RtcQueryListInput}{
    optional int32 order=1;
  }

  message ${PBName.RtcKeyDeleteInput}{
    repeated string key=1;
  }

  message ${PBName.RtcValueInfo}{
    required string key=1;
    required string value=2;
  }

  message RtcUserInfo{
    required string userId=1;
    repeated ${PBName.RtcValueInfo} userData=2;
  }

  message ${PBName.RtcUserListOutput}{
    repeated RtcUserInfo list=1;
    optional string token=2;
    optional string sessionId=3;
  }
  message RtcRoomInfoOutput{
    optional string roomId = 1;
    repeated ${PBName.RtcValueInfo} roomData = 2;
    optional int32 userCount = 3;
    repeated RtcUserInfo list=4;
  }
  message ${PBName.RtcInput}{
    required int32 roomType=1;
    optional int32 broadcastType=2;
  }
  message RtcQryInput{ 
    required bool isInterior=1;
    required targetType target=2;
    repeated string key=3;
  }
  message ${PBName.RtcQryOutput}{
    repeated ${PBName.RtcValueInfo} outInfo=1;
  }
  message RtcDelDataInput{
    repeated string key=1;
    required bool isInterior=2;
    required targetType target=3;
  }
  message ${PBName.RtcDataInput}{ 
    required bool interior=1;
    required targetType target=2;
    repeated string key=3;
    optional string objectName=4;
    optional string content=5;
  }
  message ${PBName.RtcSetDataInput}{
    required bool interior=1;
    required targetType target=2;
    required string key=3;
    required string value=4;
    optional string objectName=5;
    optional string content=6;
  }
  message ${PBName.RtcUserSetDataInput} {
    repeated ${PBName.RtcValueInfo} valueInfo = 1;
    required string objectName = 2;
    repeated ${PBName.RtcValueInfo} content = 3;
  }
  message RtcOutput
  {
    optional int32 nothing=1;
  }
  message ${PBName.RtcTokenOutput}{
    required string rtcToken=1;
  }
  enum targetType {
    ROOM =1 ;
    PERSON = 2;
  }
  message ${PBName.RtcSetOutDataInput}{
    required targetType target=1;
    repeated ${PBName.RtcValueInfo} valueInfo=2;
    optional string objectName=3;
    optional string content=4;
  }
  message ${PBName.RtcQryUserOutDataInput}{
    repeated string userId = 1;
  }
  message ${PBName.RtcUserOutDataOutput}{
    repeated RtcUserInfo user = 1;
  }
  message ${PBName.SessionsAttQryInput}{
    required int32 nothing = 1;
  }
  message ${PBName.SessionsAttOutput}{
    required int64 inboxTime = 1;
    required int64 sendboxTime = 2;
    required int64 totalUnreadCount = 3;
  }
  message ${PBName.SessionMsgReadInput}
  {
    required ChannelType type = 1;
    required int64 msgTime = 2;
    required string channelId = 3;
  }
  message SessionMsgReadOutput
  {
    optional int32 nothing=1;
  }
  message ${PBName.DeleteSessionsInput}
  {
    repeated SessionInfo sessions = 1;
  }
  message ${PBName.SessionInfo}
  {
    required ChannelType type = 1;
    required string channelId = 2;
  }
  message ${PBName.DeleteSessionsOutput}
  {
    optional int32 nothing=1;
  }
  message ${PBName.DeleteMsgInput}
  {
    optional ChannelType type = 1;
    optional string conversationId = 2;
    repeated DeleteMsg msgs = 3;
  }
  message DeleteMsg
  {
    optional string msgId = 1;
    optional int64 msgDataTime = 2;
    optional int32 direct = 3;
  }
  message ChrmKVEntity {
    required string key = 1;
    required string value = 2;
    optional int32 status = 3;
    optional int64 timestamp = 4;
    optional string uid = 5;
  }
  message ${PBName.SetChrmKV} {
    required ChrmKVEntity entry = 1;
    optional bool bNotify = 2;
    optional UpStreamMessage notification = 3;
    optional ChannelType type = 4;
  }
  message ${PBName.ChrmKVOutput} {
    repeated ChrmKVEntity entries = 1;
    optional bool bFullUpdate = 2;
    optional int64 syncTime = 3;
  }
  message ${PBName.QueryChrmKV} {
    required int64 timestamp = 1;
  }
  message ${PBName.SetUserSettingInput} {
    required int64 version=1;
    required string value=2;
  }
  message ${PBName.SetUserSettingOutput} {
    required int64 version=1;
    required bool reserve=2;
  }
  message ${PBName.PullUserSettingInput} {
    required int64 version=1;
    optional bool reserve=2;
  }
  message ${PBName.PullUserSettingOutput} {
    repeated UserSettingItem items = 1;
    required int64 version=2;
  }
  message UserSettingItem {
    required string targetId= 1;
    required ChannelType type = 2;
    required string key = 4;
    required bytes value = 5;
    required int64 version=6;
    required int32 status=7;
    repeated SessionTagItem tags= 8;
  }
  message ${PBName.SessionReq} {
    required int64 time = 1;
  }
  message ${PBName.SessionStates} {
    required int64 version=1;
    repeated SessionState state= 2;
  }
  message ${PBName.SessionState} {
    required ChannelType type = 1;
    required string channelId = 2;
    optional int64 time = 3;
    repeated SessionStateItem stateItem = 4;
  }
  message ${PBName.SessionStateItem} {
    required SessionStateType sessionStateType = 1;
    required string value = 2;
    repeated SessionTagItem tags = 3;
  }
  enum SessionStateType {
    IsSilent = 1;
    IsTop = 2;
    Tags = 3;
  }
  message ${PBName.SessionStateModifyReq} {
    required int64 version=1;
    repeated SessionState state= 2;
  }
  message ${PBName.SessionStateModifyResp} {
    required int64 version=1;
  }
  message ${PBName.SessionTagAddInput} {
    required int64 version=1;
    repeated SessionTagItem tags=2;
  }
  message ${PBName.SessionTagItem} {
    required string tagId=1;
    optional string name=2;
    optional int64 createdTime=3;
    optional bool isTop=4;
  }
  message ${PBName.SessionTagDelInput} {
    required int64 version=1;
    repeated SessionTagItem tags=2;
  }
  message ${PBName.SessionDisTagReq} {
    repeated string tagId=1;
  }
  message ${PBName.UserSettingNotification} {
    required int64 version=1;
    required bool reserve=2;
  }
}
`;

    function protobuf (a) {
     var c = (function () { function a (a, b, c) { this.low = 0 | a, this.high = 0 | b, this.unsigned = !!c; } function b (a) { return (a && a.__isLong__) === !0 } function e (a, b) { var e, f, h; return b ? (a >>>= 0, (h = a >= 0 && a < 256) && (f = d[a]) ? f : (e = g(a, (0 | a) < 0 ? -1 : 0, !0), h && (d[a] = e), e)) : (a |= 0, (h = a >= -128 && a < 128) && (f = c[a]) ? f : (e = g(a, a < 0 ? -1 : 0, !1), h && (c[a] = e), e)) } function f (a, b) { if (isNaN(a) || !isFinite(a)) return b ? r : q; if (b) { if (a < 0) return r; if (a >= n) return w } else { if (-o >= a) return x; if (a + 1 >= o) return v } return a < 0 ? f(-a, b).neg() : g(0 | a % m, 0 | a / m, b) } function g (b, c, d) { return new a(b, c, d) } function i (a, b, c) { var d, e, g, j, k, l, m; if (a.length === 0) throw Error('empty string'); if (a === 'NaN' || a === 'Infinity' || a === '+Infinity' || a === '-Infinity') return q; if (typeof b === 'number' ? (c = b, b = !1) : b = !!b, c = c || 10, c < 2 || c > 36) throw RangeError('radix'); if ((d = a.indexOf('-')) > 0) throw Error('interior hyphen'); if (d === 0) return i(a.substring(1), b, c).neg(); for (e = f(h(c, 8)), g = q, j = 0; j < a.length; j += 8)k = Math.min(8, a.length - j), l = parseInt(a.substring(j, j + k), c), k < 8 ? (m = f(h(c, k)), g = g.mul(m).add(f(l))) : (g = g.mul(e), g = g.add(f(l))); return g.unsigned = b, g } function j (b) { return b instanceof a ? b : typeof b === 'number' ? f(b) : typeof b === 'string' ? i(b) : g(b.low, b.high, b.unsigned) } var c, d, h, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y; return a.prototype.__isLong__, Object.defineProperty(a.prototype, '__isLong__', { value: !0, enumerable: !1, configurable: !1 }), a.isLong = b, c = {}, d = {}, a.fromInt = e, a.fromNumber = f, a.fromBits = g, h = Math.pow, a.fromString = i, a.fromValue = j, k = 65536, l = 1 << 24, m = k * k, n = m * m, o = n / 2, p = e(l), q = e(0), a.ZERO = q, r = e(0, !0), a.UZERO = r, s = e(1), a.ONE = s, t = e(1, !0), a.UONE = t, u = e(-1), a.NEG_ONE = u, v = g(-1, 2147483647, !1), a.MAX_VALUE = v, w = g(-1, -1, !0), a.MAX_UNSIGNED_VALUE = w, x = g(0, -2147483648, !1), a.MIN_VALUE = x, y = a.prototype, y.toInt = function () { return this.unsigned ? this.low >>> 0 : this.low }, y.toNumber = function () { return this.unsigned ? (this.high >>> 0) * m + (this.low >>> 0) : this.high * m + (this.low >>> 0) }, y.toString = function (a) { var b, c, d, e, g, i, j, k, l; if (a = a || 10, a < 2 || a > 36) throw RangeError('radix'); if (this.isZero()) return '0'; if (this.isNegative()) return this.eq(x) ? (b = f(a), c = this.div(b), d = c.mul(b).sub(this), c.toString(a) + d.toInt().toString(a)) : '-' + this.neg().toString(a); for (e = f(h(a, 6), this.unsigned), g = this, i = ''; ;) { if (j = g.div(e), k = g.sub(j.mul(e)).toInt() >>> 0, l = k.toString(a), g = j, g.isZero()) return l + i; for (;l.length < 6;)l = '0' + l; i = '' + l + i; } }, y.getHighBits = function () { return this.high }, y.getHighBitsUnsigned = function () { return this.high >>> 0 }, y.getLowBits = function () { return this.low }, y.getLowBitsUnsigned = function () { return this.low >>> 0 }, y.getNumBitsAbs = function () { var a, b; if (this.isNegative()) return this.eq(x) ? 64 : this.neg().getNumBitsAbs(); for (a = this.high != 0 ? this.high : this.low, b = 31; b > 0 && (a & 1 << b) == 0; b--);return this.high != 0 ? b + 33 : b + 1 }, y.isZero = function () { return this.high === 0 && this.low === 0 }, y.isNegative = function () { return !this.unsigned && this.high < 0 }, y.isPositive = function () { return this.unsigned || this.high >= 0 }, y.isOdd = function () { return (1 & this.low) === 1 }, y.isEven = function () { return (1 & this.low) === 0 }, y.equals = function (a) { return b(a) || (a = j(a)), this.unsigned !== a.unsigned && this.high >>> 31 === 1 && a.high >>> 31 === 1 ? !1 : this.high === a.high && this.low === a.low }, y.eq = y.equals, y.notEquals = function (a) { return !this.eq(a) }, y.neq = y.notEquals, y.lessThan = function (a) { return this.comp(a) < 0 }, y.lt = y.lessThan, y.lessThanOrEqual = function (a) { return this.comp(a) <= 0 }, y.lte = y.lessThanOrEqual, y.greaterThan = function (a) { return this.comp(a) > 0 }, y.gt = y.greaterThan, y.greaterThanOrEqual = function (a) { return this.comp(a) >= 0 }, y.gte = y.greaterThanOrEqual, y.compare = function (a) { if (b(a) || (a = j(a)), this.eq(a)) return 0; var c = this.isNegative(); var d = a.isNegative(); return c && !d ? -1 : !c && d ? 1 : this.unsigned ? a.high >>> 0 > this.high >>> 0 || a.high === this.high && a.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(a).isNegative() ? -1 : 1 }, y.comp = y.compare, y.negate = function () { return !this.unsigned && this.eq(x) ? x : this.not().add(s) }, y.neg = y.negate, y.add = function (a) { var c, d, e, f, h, i, k, l, m, n, o, p; return b(a) || (a = j(a)), c = this.high >>> 16, d = 65535 & this.high, e = this.low >>> 16, f = 65535 & this.low, h = a.high >>> 16, i = 65535 & a.high, k = a.low >>> 16, l = 65535 & a.low, m = 0, n = 0, o = 0, p = 0, p += f + l, o += p >>> 16, p &= 65535, o += e + k, n += o >>> 16, o &= 65535, n += d + i, m += n >>> 16, n &= 65535, m += c + h, m &= 65535, g(o << 16 | p, m << 16 | n, this.unsigned) }, y.subtract = function (a) { return b(a) || (a = j(a)), this.add(a.neg()) }, y.sub = y.subtract, y.multiply = function (a) { var c, d, e, h, i, k, l, m, n, o, r, s; return this.isZero() ? q : (b(a) || (a = j(a)), a.isZero() ? q : this.eq(x) ? a.isOdd() ? x : q : a.eq(x) ? this.isOdd() ? x : q : this.isNegative() ? a.isNegative() ? this.neg().mul(a.neg()) : this.neg().mul(a).neg() : a.isNegative() ? this.mul(a.neg()).neg() : this.lt(p) && a.lt(p) ? f(this.toNumber() * a.toNumber(), this.unsigned) : (c = this.high >>> 16, d = 65535 & this.high, e = this.low >>> 16, h = 65535 & this.low, i = a.high >>> 16, k = 65535 & a.high, l = a.low >>> 16, m = 65535 & a.low, n = 0, o = 0, r = 0, s = 0, s += h * m, r += s >>> 16, s &= 65535, r += e * m, o += r >>> 16, r &= 65535, r += h * l, o += r >>> 16, r &= 65535, o += d * m, n += o >>> 16, o &= 65535, o += e * l, n += o >>> 16, o &= 65535, o += h * k, n += o >>> 16, o &= 65535, n += c * m + d * l + e * k + h * i, n &= 65535, g(r << 16 | s, n << 16 | o, this.unsigned))) }, y.mul = y.multiply, y.divide = function (a) { var c, d, e, g, i, k, l, m; if (b(a) || (a = j(a)), a.isZero()) throw Error('division by zero'); if (this.isZero()) return this.unsigned ? r : q; if (this.unsigned) { if (a.unsigned || (a = a.toUnsigned()), a.gt(this)) return r; if (a.gt(this.shru(1))) return t; e = r; } else { if (this.eq(x)) return a.eq(s) || a.eq(u) ? x : a.eq(x) ? s : (g = this.shr(1), c = g.div(a).shl(1), c.eq(q) ? a.isNegative() ? s : u : (d = this.sub(a.mul(c)), e = c.add(d.div(a)))); if (a.eq(x)) return this.unsigned ? r : q; if (this.isNegative()) return a.isNegative() ? this.neg().div(a.neg()) : this.neg().div(a).neg(); if (a.isNegative()) return this.div(a.neg()).neg(); e = q; } for (d = this; d.gte(a);) { for (c = Math.max(1, Math.floor(d.toNumber() / a.toNumber())), i = Math.ceil(Math.log(c) / Math.LN2), k = i <= 48 ? 1 : h(2, i - 48), l = f(c), m = l.mul(a); m.isNegative() || m.gt(d);)c -= k, l = f(c, this.unsigned), m = l.mul(a); l.isZero() && (l = s), e = e.add(l), d = d.sub(m); } return e }, y.div = y.divide, y.modulo = function (a) { return b(a) || (a = j(a)), this.sub(this.div(a).mul(a)) }, y.mod = y.modulo, y.not = function () { return g(~this.low, ~this.high, this.unsigned) }, y.and = function (a) { return b(a) || (a = j(a)), g(this.low & a.low, this.high & a.high, this.unsigned) }, y.or = function (a) { return b(a) || (a = j(a)), g(this.low | a.low, this.high | a.high, this.unsigned) }, y.xor = function (a) { return b(a) || (a = j(a)), g(this.low ^ a.low, this.high ^ a.high, this.unsigned) }, y.shiftLeft = function (a) { return b(a) && (a = a.toInt()), (a &= 63) === 0 ? this : a < 32 ? g(this.low << a, this.high << a | this.low >>> 32 - a, this.unsigned) : g(0, this.low << a - 32, this.unsigned) }, y.shl = y.shiftLeft, y.shiftRight = function (a) { return b(a) && (a = a.toInt()), (a &= 63) === 0 ? this : a < 32 ? g(this.low >>> a | this.high << 32 - a, this.high >> a, this.unsigned) : g(this.high >> a - 32, this.high >= 0 ? 0 : -1, this.unsigned) }, y.shr = y.shiftRight, y.shiftRightUnsigned = function (a) { var c, d; return b(a) && (a = a.toInt()), a &= 63, a === 0 ? this : (c = this.high, a < 32 ? (d = this.low, g(d >>> a | c << 32 - a, c >>> a, this.unsigned)) : a === 32 ? g(c, 0, this.unsigned) : g(c >>> a - 32, 0, this.unsigned)) }, y.shru = y.shiftRightUnsigned, y.toSigned = function () { return this.unsigned ? g(this.low, this.high, !1) : this }, y.toUnsigned = function () { return this.unsigned ? this : g(this.low, this.high, !0) }, y.toBytes = function (a) { return a ? this.toBytesLE() : this.toBytesBE() }, y.toBytesLE = function () { var a = this.high; var b = this.low; return [255 & b, 255 & b >>> 8, 255 & b >>> 16, 255 & b >>> 24, 255 & a, 255 & a >>> 8, 255 & a >>> 16, 255 & a >>> 24] }, y.toBytesBE = function () { var a = this.high; var b = this.low; return [255 & a >>> 24, 255 & a >>> 16, 255 & a >>> 8, 255 & a, 255 & b >>> 24, 255 & b >>> 16, 255 & b >>> 8, 255 & b] }, a }()); var d = (function (a) {
        function f (a) { var b = 0; return function () { return b < a.length ? a.charCodeAt(b++) : null } } function g () { var a = []; var b = []; return function () { return arguments.length === 0 ? b.join('') + e.apply(String, a) : (a.length + arguments.length > 1024 && (b.push(e.apply(String, a)), a.length = 0), Array.prototype.push.apply(a, arguments), void 0) } } function h (a, b, c, d, e) { var f; var g; var h = 8 * e - d - 1; var i = (1 << h) - 1; var j = i >> 1; var k = -7; var l = c ? e - 1 : 0; var m = c ? -1 : 1; var n = a[b + l]; for (l += m, f = n & (1 << -k) - 1, n >>= -k, k += h; k > 0; f = 256 * f + a[b + l], l += m, k -= 8);for (g = f & (1 << -k) - 1, f >>= -k, k += d; k > 0; g = 256 * g + a[b + l], l += m, k -= 8);if (f === 0)f = 1 - j; else { if (f === i) return g ? 0 / 0 : 1 / 0 * (n ? -1 : 1); g += Math.pow(2, d), f -= j; } return (n ? -1 : 1) * g * Math.pow(2, f - d) } function i (a, b, c, d, e, f) { var g; var h; var i; var j = 8 * f - e - 1; var k = (1 << j) - 1; var l = k >> 1; var m = e === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0; var n = d ? 0 : f - 1; var o = d ? 1 : -1; var p = b < 0 || b === 0 && 1 / b < 0 ? 1 : 0; for (b = Math.abs(b), isNaN(b) || 1 / 0 === b ? (h = isNaN(b) ? 1 : 0, g = k) : (g = Math.floor(Math.log(b) / Math.LN2), b * (i = Math.pow(2, -g)) < 1 && (g--, i *= 2), b += g + l >= 1 ? m / i : m * Math.pow(2, 1 - l), b * i >= 2 && (g++, i /= 2), g + l >= k ? (h = 0, g = k) : g + l >= 1 ? (h = (b * i - 1) * Math.pow(2, e), g += l) : (h = b * Math.pow(2, l - 1) * Math.pow(2, e), g = 0)); e >= 8; a[c + n] = 255 & h, n += o, h /= 256, e -= 8);for (g = g << e | h, j += e; j > 0; a[c + n] = 255 & g, n += o, g /= 256, j -= 8);a[c + n - o] |= 128 * p; } var c; var d; var e; var j; var k; var b = function (a, c, e) { if (typeof a === 'undefined' && (a = b.DEFAULT_CAPACITY), typeof c === 'undefined' && (c = b.DEFAULT_ENDIAN), typeof e === 'undefined' && (e = b.DEFAULT_NOASSERT), !e) { if (a = 0 | a, a < 0) throw RangeError('Illegal capacity'); c = !!c, e = !!e; } this.buffer = a === 0 ? d : new ArrayBuffer(a), this.view = a === 0 ? null : new Uint8Array(this.buffer), this.offset = 0, this.markedOffset = -1, this.limit = a, this.littleEndian = c, this.noAssert = e; }; return b.VERSION = '5.0.1', b.LITTLE_ENDIAN = !0, b.BIG_ENDIAN = !1, b.DEFAULT_CAPACITY = 16, b.DEFAULT_ENDIAN = b.BIG_ENDIAN, b.DEFAULT_NOASSERT = !1, b.Long = a || null, c = b.prototype, c.__isByteBuffer__, Object.defineProperty(c, '__isByteBuffer__', { value: !0, enumerable: !1, configurable: !1 }), d = new ArrayBuffer(0), e = String.fromCharCode, b.accessor = function () { return Uint8Array }, b.allocate = function (a, c, d) { return new b(a, c, d) }, b.concat = function (a, c, d, e) { var f, i, g, h, k, j; for ((typeof c === 'boolean' || typeof c !== 'string') && (e = d, d = c, c = void 0), f = 0, g = 0, h = a.length; h > g; ++g)b.isByteBuffer(a[g]) || (a[g] = b.wrap(a[g], c)), i = a[g].limit - a[g].offset, i > 0 && (f += i); if (f === 0) return new b(0, d, e); for (j = new b(f, d, e), g = 0; h > g;)k = a[g++], i = k.limit - k.offset, i <= 0 || (j.view.set(k.view.subarray(k.offset, k.limit), j.offset), j.offset += i); return j.limit = j.offset, j.offset = 0, j }, b.isByteBuffer = function (a) { return (a && a.__isByteBuffer__) === !0 }, b.type = function () { return ArrayBuffer }, b.wrap = function (a, d, e, f) { var g, h; if (typeof d !== 'string' && (f = e, e = d, d = void 0), typeof a === 'string') switch (typeof d === 'undefined' && (d = 'utf8'), d) { case 'base64':return b.fromBase64(a, e); case 'hex':return b.fromHex(a, e); case 'binary':return b.fromBinary(a, e); case 'utf8':return b.fromUTF8(a, e); case 'debug':return b.fromDebug(a, e); default:throw Error('Unsupported encoding: ' + d) } if (a === null || typeof a !== 'object') throw TypeError('Illegal buffer'); if (b.isByteBuffer(a)) return g = c.clone.call(a), g.markedOffset = -1, g; if (a instanceof Uint8Array)g = new b(0, e, f), a.length > 0 && (g.buffer = a.buffer, g.offset = a.byteOffset, g.limit = a.byteOffset + a.byteLength, g.view = new Uint8Array(a.buffer)); else if (a instanceof ArrayBuffer)g = new b(0, e, f), a.byteLength > 0 && (g.buffer = a, g.offset = 0, g.limit = a.byteLength, g.view = a.byteLength > 0 ? new Uint8Array(a) : null); else { if (Object.prototype.toString.call(a) !== '[object Array]') throw TypeError('Illegal buffer'); for (g = new b(a.length, e, f), g.limit = a.length, h = 0; h < a.length; ++h)g.view[h] = a[h]; } return g }, c.writeBitSet = function (a, b) { var h; var d; var e; var f; var g; var i; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (!(a instanceof Array)) throw TypeError('Illegal BitSet: Not an array'); if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } for (d = b, e = a.length, f = e >> 3, g = 0, b += this.writeVarint32(e, b); f--;)h = 1 & !!a[g++] | (1 & !!a[g++]) << 1 | (1 & !!a[g++]) << 2 | (1 & !!a[g++]) << 3 | (1 & !!a[g++]) << 4 | (1 & !!a[g++]) << 5 | (1 & !!a[g++]) << 6 | (1 & !!a[g++]) << 7, this.writeByte(h, b++); if (e > g) { for (i = 0, h = 0; e > g;)h |= (1 & !!a[g++]) << i++; this.writeByte(h, b++); } return c ? (this.offset = b, this) : b - d }, c.readBitSet = function (a) { var h; var c; var d; var e; var f; var g; var i; var b = typeof a === 'undefined'; for (b && (a = this.offset), c = this.readVarint32(a), d = c.value, e = d >> 3, f = 0, g = [], a += c.length; e--;)h = this.readByte(a++), g[f++] = !!(1 & h), g[f++] = !!(2 & h), g[f++] = !!(4 & h), g[f++] = !!(8 & h), g[f++] = !!(16 & h), g[f++] = !!(32 & h), g[f++] = !!(64 & h), g[f++] = !!(128 & h); if (d > f) for (i = 0, h = this.readByte(a++); d > f;)g[f++] = !!(1 & h >> i++); return b && (this.offset = a), g }, c.readBytes = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + a > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + a + ') <= ' + this.buffer.byteLength) } return d = this.slice(b, b + a), c && (this.offset += a), d }, c.writeBytes = c.append, c.writeInt8 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a |= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 1, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 1, this.view[b] = a, c && (this.offset += 1), this }, c.writeByte = c.writeInt8, c.readInt8 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 1 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 1 + ') <= ' + this.buffer.byteLength) } return c = this.view[a], (128 & c) === 128 && (c = -(255 - c + 1)), b && (this.offset += 1), c }, c.readByte = c.readInt8, c.writeUint8 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 1, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 1, this.view[b] = a, c && (this.offset += 1), this }, c.writeUInt8 = c.writeUint8, c.readUint8 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 1 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 1 + ') <= ' + this.buffer.byteLength) } return c = this.view[a], b && (this.offset += 1), c }, c.readUInt8 = c.readUint8, c.writeInt16 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a |= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 2, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 2, this.littleEndian ? (this.view[b + 1] = (65280 & a) >>> 8, this.view[b] = 255 & a) : (this.view[b] = (65280 & a) >>> 8, this.view[b + 1] = 255 & a), c && (this.offset += 2), this }, c.writeShort = c.writeInt16, c.readInt16 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 2 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 2 + ') <= ' + this.buffer.byteLength) } return c = 0, this.littleEndian ? (c = this.view[a], c |= this.view[a + 1] << 8) : (c = this.view[a] << 8, c |= this.view[a + 1]), (32768 & c) === 32768 && (c = -(65535 - c + 1)), b && (this.offset += 2), c }, c.readShort = c.readInt16, c.writeUint16 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 2, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 2, this.littleEndian ? (this.view[b + 1] = (65280 & a) >>> 8, this.view[b] = 255 & a) : (this.view[b] = (65280 & a) >>> 8, this.view[b + 1] = 255 & a), c && (this.offset += 2), this }, c.writeUInt16 = c.writeUint16, c.readUint16 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 2 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 2 + ') <= ' + this.buffer.byteLength) } return c = 0, this.littleEndian ? (c = this.view[a], c |= this.view[a + 1] << 8) : (c = this.view[a] << 8, c |= this.view[a + 1]), b && (this.offset += 2), c }, c.readUInt16 = c.readUint16, c.writeInt32 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a |= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 4, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 4, this.littleEndian ? (this.view[b + 3] = 255 & a >>> 24, this.view[b + 2] = 255 & a >>> 16, this.view[b + 1] = 255 & a >>> 8, this.view[b] = 255 & a) : (this.view[b] = 255 & a >>> 24, this.view[b + 1] = 255 & a >>> 16, this.view[b + 2] = 255 & a >>> 8, this.view[b + 3] = 255 & a), c && (this.offset += 4), this }, c.writeInt = c.writeInt32, c.readInt32 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 4 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 4 + ') <= ' + this.buffer.byteLength) } return c = 0, this.littleEndian ? (c = this.view[a + 2] << 16, c |= this.view[a + 1] << 8, c |= this.view[a], c += this.view[a + 3] << 24 >>> 0) : (c = this.view[a + 1] << 16, c |= this.view[a + 2] << 8, c |= this.view[a + 3], c += this.view[a] << 24 >>> 0), c |= 0, b && (this.offset += 4), c }, c.readInt = c.readInt32, c.writeUint32 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 4, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 4, this.littleEndian ? (this.view[b + 3] = 255 & a >>> 24, this.view[b + 2] = 255 & a >>> 16, this.view[b + 1] = 255 & a >>> 8, this.view[b] = 255 & a) : (this.view[b] = 255 & a >>> 24, this.view[b + 1] = 255 & a >>> 16, this.view[b + 2] = 255 & a >>> 8, this.view[b + 3] = 255 & a), c && (this.offset += 4), this }, c.writeUInt32 = c.writeUint32, c.readUint32 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 4 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 4 + ') <= ' + this.buffer.byteLength) } return c = 0, this.littleEndian ? (c = this.view[a + 2] << 16, c |= this.view[a + 1] << 8, c |= this.view[a], c += this.view[a + 3] << 24 >>> 0) : (c = this.view[a + 1] << 16, c |= this.view[a + 2] << 8, c |= this.view[a + 3], c += this.view[a] << 24 >>> 0), b && (this.offset += 4), c }, c.readUInt32 = c.readUint32, a && (c.writeInt64 = function (b, c) { var e; var f; var g; var d = typeof c === 'undefined'; if (d && (c = this.offset), !this.noAssert) { if (typeof b === 'number')b = a.fromNumber(b); else if (typeof b === 'string')b = a.fromString(b); else if (!(b && b instanceof a)) throw TypeError('Illegal value: ' + b + ' (not an integer or Long)'); if (typeof c !== 'number' || c % 1 !== 0) throw TypeError('Illegal offset: ' + c + ' (not an integer)'); if (c >>>= 0, c < 0 || c + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + c + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return typeof b === 'number' ? b = a.fromNumber(b) : typeof b === 'string' && (b = a.fromString(b)), c += 8, e = this.buffer.byteLength, c > e && this.resize((e *= 2) > c ? e : c), c -= 8, f = b.low, g = b.high, this.littleEndian ? (this.view[c + 3] = 255 & f >>> 24, this.view[c + 2] = 255 & f >>> 16, this.view[c + 1] = 255 & f >>> 8, this.view[c] = 255 & f, c += 4, this.view[c + 3] = 255 & g >>> 24, this.view[c + 2] = 255 & g >>> 16, this.view[c + 1] = 255 & g >>> 8, this.view[c] = 255 & g) : (this.view[c] = 255 & g >>> 24, this.view[c + 1] = 255 & g >>> 16, this.view[c + 2] = 255 & g >>> 8, this.view[c + 3] = 255 & g, c += 4, this.view[c] = 255 & f >>> 24, this.view[c + 1] = 255 & f >>> 16, this.view[c + 2] = 255 & f >>> 8, this.view[c + 3] = 255 & f), d && (this.offset += 8), this }, c.writeLong = c.writeInt64, c.readInt64 = function (b) { var d; var e; var f; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 8 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 8 + ') <= ' + this.buffer.byteLength) } return d = 0, e = 0, this.littleEndian ? (d = this.view[b + 2] << 16, d |= this.view[b + 1] << 8, d |= this.view[b], d += this.view[b + 3] << 24 >>> 0, b += 4, e = this.view[b + 2] << 16, e |= this.view[b + 1] << 8, e |= this.view[b], e += this.view[b + 3] << 24 >>> 0) : (e = this.view[b + 1] << 16, e |= this.view[b + 2] << 8, e |= this.view[b + 3], e += this.view[b] << 24 >>> 0, b += 4, d = this.view[b + 1] << 16, d |= this.view[b + 2] << 8, d |= this.view[b + 3], d += this.view[b] << 24 >>> 0), f = new a(d, e, !1), c && (this.offset += 8), f }, c.readLong = c.readInt64, c.writeUint64 = function (b, c) { var e; var f; var g; var d = typeof c === 'undefined'; if (d && (c = this.offset), !this.noAssert) { if (typeof b === 'number')b = a.fromNumber(b); else if (typeof b === 'string')b = a.fromString(b); else if (!(b && b instanceof a)) throw TypeError('Illegal value: ' + b + ' (not an integer or Long)'); if (typeof c !== 'number' || c % 1 !== 0) throw TypeError('Illegal offset: ' + c + ' (not an integer)'); if (c >>>= 0, c < 0 || c + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + c + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return typeof b === 'number' ? b = a.fromNumber(b) : typeof b === 'string' && (b = a.fromString(b)), c += 8, e = this.buffer.byteLength, c > e && this.resize((e *= 2) > c ? e : c), c -= 8, f = b.low, g = b.high, this.littleEndian ? (this.view[c + 3] = 255 & f >>> 24, this.view[c + 2] = 255 & f >>> 16, this.view[c + 1] = 255 & f >>> 8, this.view[c] = 255 & f, c += 4, this.view[c + 3] = 255 & g >>> 24, this.view[c + 2] = 255 & g >>> 16, this.view[c + 1] = 255 & g >>> 8, this.view[c] = 255 & g) : (this.view[c] = 255 & g >>> 24, this.view[c + 1] = 255 & g >>> 16, this.view[c + 2] = 255 & g >>> 8, this.view[c + 3] = 255 & g, c += 4, this.view[c] = 255 & f >>> 24, this.view[c + 1] = 255 & f >>> 16, this.view[c + 2] = 255 & f >>> 8, this.view[c + 3] = 255 & f), d && (this.offset += 8), this }, c.writeUInt64 = c.writeUint64, c.readUint64 = function (b) { var d; var e; var f; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 8 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 8 + ') <= ' + this.buffer.byteLength) } return d = 0, e = 0, this.littleEndian ? (d = this.view[b + 2] << 16, d |= this.view[b + 1] << 8, d |= this.view[b], d += this.view[b + 3] << 24 >>> 0, b += 4, e = this.view[b + 2] << 16, e |= this.view[b + 1] << 8, e |= this.view[b], e += this.view[b + 3] << 24 >>> 0) : (e = this.view[b + 1] << 16, e |= this.view[b + 2] << 8, e |= this.view[b + 3], e += this.view[b] << 24 >>> 0, b += 4, d = this.view[b + 1] << 16, d |= this.view[b + 2] << 8, d |= this.view[b + 3], d += this.view[b] << 24 >>> 0), f = new a(d, e, !0), c && (this.offset += 8), f }, c.readUInt64 = c.readUint64), c.writeFloat32 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number') throw TypeError('Illegal value: ' + a + ' (not a number)'); if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 4, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 4, i(this.view, a, b, this.littleEndian, 23, 4), c && (this.offset += 4), this }, c.writeFloat = c.writeFloat32, c.readFloat32 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 4 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 4 + ') <= ' + this.buffer.byteLength) } return c = h(this.view, a, this.littleEndian, 23, 4), b && (this.offset += 4), c }, c.readFloat = c.readFloat32, c.writeFloat64 = function (a, b) { var d; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'number') throw TypeError('Illegal value: ' + a + ' (not a number)'); if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return b += 8, d = this.buffer.byteLength, b > d && this.resize((d *= 2) > b ? d : b), b -= 8, i(this.view, a, b, this.littleEndian, 52, 8), c && (this.offset += 8), this }, c.writeDouble = c.writeFloat64, c.readFloat64 = function (a) { var c; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 8 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 8 + ') <= ' + this.buffer.byteLength) } return c = h(this.view, a, this.littleEndian, 52, 8), b && (this.offset += 8), c }, c.readDouble = c.readFloat64, b.MAX_VARINT32_BYTES = 5, b.calculateVarint32 = function (a) { return a >>>= 0, a < 128 ? 1 : a < 16384 ? 2 : 1 << 21 > a ? 3 : 1 << 28 > a ? 4 : 5 }, b.zigZagEncode32 = function (a) { return ((a |= 0) << 1 ^ a >> 31) >>> 0 }, b.zigZagDecode32 = function (a) { return 0 | a >>> 1 ^ -(1 & a) }, c.writeVarint32 = function (a, c) { var f; var e; var g; var d = typeof c === 'undefined'; if (d && (c = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a |= 0, typeof c !== 'number' || c % 1 !== 0) throw TypeError('Illegal offset: ' + c + ' (not an integer)'); if (c >>>= 0, c < 0 || c + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + c + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } for (e = b.calculateVarint32(a), c += e, g = this.buffer.byteLength, c > g && this.resize((g *= 2) > c ? g : c), c -= e, a >>>= 0; a >= 128;)f = 128 | 127 & a, this.view[c++] = f, a >>>= 7; return this.view[c++] = a, d ? (this.offset = c, this) : e }, c.writeVarint32ZigZag = function (a, c) { return this.writeVarint32(b.zigZagEncode32(a), c) }, c.readVarint32 = function (a) { var e; var c; var d; var f; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 1 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 1 + ') <= ' + this.buffer.byteLength) }c = 0, d = 0; do { if (!this.noAssert && a > this.limit) throw f = Error('Truncated'), f.truncated = !0, f; e = this.view[a++], c < 5 && (d |= (127 & e) << 7 * c), ++c; } while ((128 & e) !== 0); return d |= 0, b ? (this.offset = a, d) : { value: d, length: c } }, c.readVarint32ZigZag = function (a) { var c = this.readVarint32(a); return typeof c === 'object' ? c.value = b.zigZagDecode32(c.value) : c = b.zigZagDecode32(c), c }, a && (b.MAX_VARINT64_BYTES = 10, b.calculateVarint64 = function (b) { typeof b === 'number' ? b = a.fromNumber(b) : typeof b === 'string' && (b = a.fromString(b)); var c = b.toInt() >>> 0; var d = b.shiftRightUnsigned(28).toInt() >>> 0; var e = b.shiftRightUnsigned(56).toInt() >>> 0; return e == 0 ? d == 0 ? c < 16384 ? c < 128 ? 1 : 2 : 1 << 21 > c ? 3 : 4 : d < 16384 ? d < 128 ? 5 : 6 : 1 << 21 > d ? 7 : 8 : e < 128 ? 9 : 10 }, b.zigZagEncode64 = function (b) { return typeof b === 'number' ? b = a.fromNumber(b, !1) : typeof b === 'string' ? b = a.fromString(b, !1) : b.unsigned !== !1 && (b = b.toSigned()), b.shiftLeft(1).xor(b.shiftRight(63)).toUnsigned() }, b.zigZagDecode64 = function (b) { return typeof b === 'number' ? b = a.fromNumber(b, !1) : typeof b === 'string' ? b = a.fromString(b, !1) : b.unsigned !== !1 && (b = b.toSigned()), b.shiftRightUnsigned(1).xor(b.and(a.ONE).toSigned().negate()).toSigned() }, c.writeVarint64 = function (c, d) { var f; var g; var h; var i; var j; var e = typeof d === 'undefined'; if (e && (d = this.offset), !this.noAssert) { if (typeof c === 'number')c = a.fromNumber(c); else if (typeof c === 'string')c = a.fromString(c); else if (!(c && c instanceof a)) throw TypeError('Illegal value: ' + c + ' (not an integer or Long)'); if (typeof d !== 'number' || d % 1 !== 0) throw TypeError('Illegal offset: ' + d + ' (not an integer)'); if (d >>>= 0, d < 0 || d + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + d + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } switch (typeof c === 'number' ? c = a.fromNumber(c, !1) : typeof c === 'string' ? c = a.fromString(c, !1) : c.unsigned !== !1 && (c = c.toSigned()), f = b.calculateVarint64(c), g = c.toInt() >>> 0, h = c.shiftRightUnsigned(28).toInt() >>> 0, i = c.shiftRightUnsigned(56).toInt() >>> 0, d += f, j = this.buffer.byteLength, d > j && this.resize((j *= 2) > d ? j : d), d -= f, f) { case 10:this.view[d + 9] = 1 & i >>> 7; case 9:this.view[d + 8] = f !== 9 ? 128 | i : 127 & i; case 8:this.view[d + 7] = f !== 8 ? 128 | h >>> 21 : 127 & h >>> 21; case 7:this.view[d + 6] = f !== 7 ? 128 | h >>> 14 : 127 & h >>> 14; case 6:this.view[d + 5] = f !== 6 ? 128 | h >>> 7 : 127 & h >>> 7; case 5:this.view[d + 4] = f !== 5 ? 128 | h : 127 & h; case 4:this.view[d + 3] = f !== 4 ? 128 | g >>> 21 : 127 & g >>> 21; case 3:this.view[d + 2] = f !== 3 ? 128 | g >>> 14 : 127 & g >>> 14; case 2:this.view[d + 1] = f !== 2 ? 128 | g >>> 7 : 127 & g >>> 7; case 1:this.view[d] = f !== 1 ? 128 | g : 127 & g; } return e ? (this.offset += f, this) : f }, c.writeVarint64ZigZag = function (a, c) { return this.writeVarint64(b.zigZagEncode64(a), c) }, c.readVarint64 = function (b) { var d; var e; var f; var g; var h; var i; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 1 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 1 + ') <= ' + this.buffer.byteLength) } if (d = b, e = 0, f = 0, g = 0, h = 0, h = this.view[b++], e = 127 & h, 128 & h && (h = this.view[b++], e |= (127 & h) << 7, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], e |= (127 & h) << 14, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], e |= (127 & h) << 21, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], f = 127 & h, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], f |= (127 & h) << 7, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], f |= (127 & h) << 14, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], f |= (127 & h) << 21, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], g = 127 & h, (128 & h || this.noAssert && typeof h === 'undefined') && (h = this.view[b++], g |= (127 & h) << 7, 128 & h || this.noAssert && typeof h === 'undefined')))))))))) throw Error('Buffer overrun'); return i = a.fromBits(e | f << 28, f >>> 4 | g << 24, !1), c ? (this.offset = b, i) : { value: i, length: b - d } }, c.readVarint64ZigZag = function (c) { var d = this.readVarint64(c); return d && d.value instanceof a ? d.value = b.zigZagDecode64(d.value) : d = b.zigZagDecode64(d), d }), c.writeCString = function (a, b) { var d; var e; var g; var c = typeof b === 'undefined'; if (c && (b = this.offset), e = a.length, !this.noAssert) { if (typeof a !== 'string') throw TypeError('Illegal str: Not a string'); for (d = 0; e > d; ++d) if (a.charCodeAt(d) === 0) throw RangeError('Illegal str: Contains NULL-characters'); if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return e = k.calculateUTF16asUTF8(f(a))[1], b += e + 1, g = this.buffer.byteLength, b > g && this.resize((g *= 2) > b ? g : b), b -= e + 1, k.encodeUTF16toUTF8(f(a), function (a) { this.view[b++] = a; }.bind(this)), this.view[b++] = 0, c ? (this.offset = b, this) : e }, c.readCString = function (a) { var c; var e; var f; var b = typeof a === 'undefined'; if (b && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 1 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 1 + ') <= ' + this.buffer.byteLength) } return c = a, f = -1, k.decodeUTF8toUTF16(function () { if (f === 0) return null; if (a >= this.limit) throw RangeError('Illegal range: Truncated data, ' + a + ' < ' + this.limit); return f = this.view[a++], f === 0 ? null : f }.bind(this), e = g(), !0), b ? (this.offset = a, e()) : { string: e(), length: a - c } }, c.writeIString = function (a, b) { var e; var d; var g; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof a !== 'string') throw TypeError('Illegal str: Not a string'); if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } if (d = b, e = k.calculateUTF16asUTF8(f(a), this.noAssert)[1], b += 4 + e, g = this.buffer.byteLength, b > g && this.resize((g *= 2) > b ? g : b), b -= 4 + e, this.littleEndian ? (this.view[b + 3] = 255 & e >>> 24, this.view[b + 2] = 255 & e >>> 16, this.view[b + 1] = 255 & e >>> 8, this.view[b] = 255 & e) : (this.view[b] = 255 & e >>> 24, this.view[b + 1] = 255 & e >>> 16, this.view[b + 2] = 255 & e >>> 8, this.view[b + 3] = 255 & e), b += 4, k.encodeUTF16toUTF8(f(a), function (a) { this.view[b++] = a; }.bind(this)), b !== d + 4 + e) throw RangeError('Illegal range: Truncated data, ' + b + ' == ' + (b + 4 + e)); return c ? (this.offset = b, this) : b - d }, c.readIString = function (a) {
          var d; var e; var f; var c = typeof a === 'undefined';
          if (c && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 4 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 4 + ') <= ' + this.buffer.byteLength) } return d = a, e = this.readUint32(a), f = this.readUTF8String(e, b.METRICS_BYTES, a += 4), a += f.length, c ? (this.offset = a, f.string) : { string: f.string, length: a - d }
        }, b.METRICS_CHARS = 'c', b.METRICS_BYTES = 'b', c.writeUTF8String = function (a, b) { var d; var e; var g; var c = typeof b === 'undefined'; if (c && (b = this.offset), !this.noAssert) { if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: ' + b + ' (not an integer)'); if (b >>>= 0, b < 0 || b + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + b + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return e = b, d = k.calculateUTF16asUTF8(f(a))[1], b += d, g = this.buffer.byteLength, b > g && this.resize((g *= 2) > b ? g : b), b -= d, k.encodeUTF16toUTF8(f(a), function (a) { this.view[b++] = a; }.bind(this)), c ? (this.offset = b, this) : b - e }, c.writeString = c.writeUTF8String, b.calculateUTF8Chars = function (a) { return k.calculateUTF16asUTF8(f(a))[0] }, b.calculateUTF8Bytes = function (a) { return k.calculateUTF16asUTF8(f(a))[1] }, b.calculateString = b.calculateUTF8Bytes, c.readUTF8String = function (a, c, d) { var e, i, f, h, j; if (typeof c === 'number' && (d = c, c = void 0), e = typeof d === 'undefined', e && (d = this.offset), typeof c === 'undefined' && (c = b.METRICS_CHARS), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal length: ' + a + ' (not an integer)'); if (a |= 0, typeof d !== 'number' || d % 1 !== 0) throw TypeError('Illegal offset: ' + d + ' (not an integer)'); if (d >>>= 0, d < 0 || d + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + d + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } if (f = 0, h = d, c === b.METRICS_CHARS) { if (i = g(), k.decodeUTF8(function () { return a > f && d < this.limit ? this.view[d++] : null }.bind(this), function (a) { ++f, k.UTF8toUTF16(a, i); }), f !== a) throw RangeError('Illegal range: Truncated data, ' + f + ' == ' + a); return e ? (this.offset = d, i()) : { string: i(), length: d - h } } if (c === b.METRICS_BYTES) { if (!this.noAssert) { if (typeof d !== 'number' || d % 1 !== 0) throw TypeError('Illegal offset: ' + d + ' (not an integer)'); if (d >>>= 0, d < 0 || d + a > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + d + ' (+' + a + ') <= ' + this.buffer.byteLength) } if (j = d + a, k.decodeUTF8toUTF16(function () { return j > d ? this.view[d++] : null }.bind(this), i = g(), this.noAssert), d !== j) throw RangeError('Illegal range: Truncated data, ' + d + ' == ' + j); return e ? (this.offset = d, i()) : { string: i(), length: d - h } } throw TypeError('Unsupported metrics: ' + c) }, c.readString = c.readUTF8String, c.writeVString = function (a, c) { var g; var h; var e; var i; var d = typeof c === 'undefined'; if (d && (c = this.offset), !this.noAssert) { if (typeof a !== 'string') throw TypeError('Illegal str: Not a string'); if (typeof c !== 'number' || c % 1 !== 0) throw TypeError('Illegal offset: ' + c + ' (not an integer)'); if (c >>>= 0, c < 0 || c + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + c + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } if (e = c, g = k.calculateUTF16asUTF8(f(a), this.noAssert)[1], h = b.calculateVarint32(g), c += h + g, i = this.buffer.byteLength, c > i && this.resize((i *= 2) > c ? i : c), c -= h + g, c += this.writeVarint32(g, c), k.encodeUTF16toUTF8(f(a), function (a) { this.view[c++] = a; }.bind(this)), c !== e + g + h) throw RangeError('Illegal range: Truncated data, ' + c + ' == ' + (c + g + h)); return d ? (this.offset = c, this) : c - e }, c.readVString = function (a) { var d; var e; var f; var c = typeof a === 'undefined'; if (c && (a = this.offset), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 1 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 1 + ') <= ' + this.buffer.byteLength) } return d = a, e = this.readVarint32(a), f = this.readUTF8String(e.value, b.METRICS_BYTES, a += e.length), a += f.length, c ? (this.offset = a, f.string) : { string: f.string, length: a - d } }, c.append = function (a, c, d) { var e, f, g; if ((typeof c === 'number' || typeof c !== 'string') && (d = c, c = void 0), e = typeof d === 'undefined', e && (d = this.offset), !this.noAssert) { if (typeof d !== 'number' || d % 1 !== 0) throw TypeError('Illegal offset: ' + d + ' (not an integer)'); if (d >>>= 0, d < 0 || d + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + d + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return a instanceof b || (a = b.wrap(a, c)), f = a.limit - a.offset, f <= 0 ? this : (d += f, g = this.buffer.byteLength, d > g && this.resize((g *= 2) > d ? g : d), d -= f, this.view.set(a.view.subarray(a.offset, a.limit), d), a.offset += f, e && (this.offset += f), this) }, c.appendTo = function (a, b) { return a.append(this, b), this }, c.assert = function (a) { return this.noAssert = !a, this }, c.capacity = function () { return this.buffer.byteLength }, c.clear = function () { return this.offset = 0, this.limit = this.buffer.byteLength, this.markedOffset = -1, this }, c.clone = function (a) { var c = new b(0, this.littleEndian, this.noAssert); return a ? (c.buffer = new ArrayBuffer(this.buffer.byteLength), c.view = new Uint8Array(c.buffer)) : (c.buffer = this.buffer, c.view = this.view), c.offset = this.offset, c.markedOffset = this.markedOffset, c.limit = this.limit, c }, c.compact = function (a, b) { var c, e, f; if (typeof a === 'undefined' && (a = this.offset), typeof b === 'undefined' && (b = this.limit), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal begin: Not an integer'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal end: Not an integer'); if (b >>>= 0, a < 0 || a > b || b > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + a + ' <= ' + b + ' <= ' + this.buffer.byteLength) } return a === 0 && b === this.buffer.byteLength ? this : (c = b - a, c === 0 ? (this.buffer = d, this.view = null, this.markedOffset >= 0 && (this.markedOffset -= a), this.offset = 0, this.limit = 0, this) : (e = new ArrayBuffer(c), f = new Uint8Array(e), f.set(this.view.subarray(a, b)), this.buffer = e, this.view = f, this.markedOffset >= 0 && (this.markedOffset -= a), this.offset = 0, this.limit = c, this)) }, c.copy = function (a, c) { if (typeof a === 'undefined' && (a = this.offset), typeof c === 'undefined' && (c = this.limit), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal begin: Not an integer'); if (a >>>= 0, typeof c !== 'number' || c % 1 !== 0) throw TypeError('Illegal end: Not an integer'); if (c >>>= 0, a < 0 || a > c || c > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + a + ' <= ' + c + ' <= ' + this.buffer.byteLength) } if (a === c) return new b(0, this.littleEndian, this.noAssert); var d = c - a; var e = new b(d, this.littleEndian, this.noAssert); return e.offset = 0, e.limit = d, e.markedOffset >= 0 && (e.markedOffset -= a), this.copyTo(e, 0, a, c), e }, c.copyTo = function (a, c, d, e) { var f, g, h; if (!this.noAssert && !b.isByteBuffer(a)) throw TypeError('Illegal target: Not a ByteBuffer'); if (c = (g = typeof c === 'undefined') ? a.offset : 0 | c, d = (f = typeof d === 'undefined') ? this.offset : 0 | d, e = typeof e === 'undefined' ? this.limit : 0 | e, c < 0 || c > a.buffer.byteLength) throw RangeError('Illegal target range: 0 <= ' + c + ' <= ' + a.buffer.byteLength); if (d < 0 || e > this.buffer.byteLength) throw RangeError('Illegal source range: 0 <= ' + d + ' <= ' + this.buffer.byteLength); return h = e - d, h === 0 ? a : (a.ensureCapacity(c + h), a.view.set(this.view.subarray(d, e), c), f && (this.offset += h), g && (a.offset += h), this) }, c.ensureCapacity = function (a) { var b = this.buffer.byteLength; return a > b ? this.resize((b *= 2) > a ? b : a) : this }, c.fill = function (a, b, c) { var d = typeof b === 'undefined'; if (d && (b = this.offset), typeof a === 'string' && a.length > 0 && (a = a.charCodeAt(0)), typeof b === 'undefined' && (b = this.offset), typeof c === 'undefined' && (c = this.limit), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal value: ' + a + ' (not an integer)'); if (a |= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal begin: Not an integer'); if (b >>>= 0, typeof c !== 'number' || c % 1 !== 0) throw TypeError('Illegal end: Not an integer'); if (c >>>= 0, b < 0 || b > c || c > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + b + ' <= ' + c + ' <= ' + this.buffer.byteLength) } if (b >= c) return this; for (;c > b;) this.view[b++] = a; return d && (this.offset = b), this }, c.flip = function () { return this.limit = this.offset, this.offset = 0, this }, c.mark = function (a) { if (a = typeof a === 'undefined' ? this.offset : a, !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal offset: ' + a + ' (not an integer)'); if (a >>>= 0, a < 0 || a + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + a + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return this.markedOffset = a, this }, c.order = function (a) { if (!this.noAssert && typeof a !== 'boolean') throw TypeError('Illegal littleEndian: Not a boolean'); return this.littleEndian = !!a, this }, c.LE = function (a) { return this.littleEndian = typeof a !== 'undefined' ? !!a : !0, this }, c.BE = function (a) { return this.littleEndian = typeof a !== 'undefined' ? !a : !1, this }, c.prepend = function (a, c, d) { var e, f, g, h, i; if ((typeof c === 'number' || typeof c !== 'string') && (d = c, c = void 0), e = typeof d === 'undefined', e && (d = this.offset), !this.noAssert) { if (typeof d !== 'number' || d % 1 !== 0) throw TypeError('Illegal offset: ' + d + ' (not an integer)'); if (d >>>= 0, d < 0 || d + 0 > this.buffer.byteLength) throw RangeError('Illegal offset: 0 <= ' + d + ' (+' + 0 + ') <= ' + this.buffer.byteLength) } return a instanceof b || (a = b.wrap(a, c)), f = a.limit - a.offset, f <= 0 ? this : (g = f - d, g > 0 ? (h = new ArrayBuffer(this.buffer.byteLength + g), i = new Uint8Array(h), i.set(this.view.subarray(d, this.buffer.byteLength), f), this.buffer = h, this.view = i, this.offset += g, this.markedOffset >= 0 && (this.markedOffset += g), this.limit += g, d += g) : new Uint8Array(this.buffer), this.view.set(a.view.subarray(a.offset, a.limit), d - f), a.offset = a.limit, e && (this.offset -= f), this) }, c.prependTo = function (a, b) { return a.prepend(this, b), this }, c.printDebug = function (a) { typeof a !== 'function' && (a = console.log.bind(console)), a(this.toString() + '\n-------------------------------------------------------------------\n' + this.toDebug(!0)); }, c.remaining = function () { return this.limit - this.offset }, c.reset = function () { return this.markedOffset >= 0 ? (this.offset = this.markedOffset, this.markedOffset = -1) : this.offset = 0, this }, c.resize = function (a) { var b, c; if (!this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal capacity: ' + a + ' (not an integer)'); if (a |= 0, a < 0) throw RangeError('Illegal capacity: 0 <= ' + a) } return this.buffer.byteLength < a && (b = new ArrayBuffer(a), c = new Uint8Array(b), c.set(this.view), this.buffer = b, this.view = c), this }, c.reverse = function (a, b) { if (typeof a === 'undefined' && (a = this.offset), typeof b === 'undefined' && (b = this.limit), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal begin: Not an integer'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal end: Not an integer'); if (b >>>= 0, a < 0 || a > b || b > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + a + ' <= ' + b + ' <= ' + this.buffer.byteLength) } return a === b ? this : (Array.prototype.reverse.call(this.view.subarray(a, b)), this) }, c.skip = function (a) { if (!this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal length: ' + a + ' (not an integer)'); a |= 0; } var b = this.offset + a; if (!this.noAssert && (b < 0 || b > this.buffer.byteLength)) throw RangeError('Illegal length: 0 <= ' + this.offset + ' + ' + a + ' <= ' + this.buffer.byteLength); return this.offset = b, this }, c.slice = function (a, b) { if (typeof a === 'undefined' && (a = this.offset), typeof b === 'undefined' && (b = this.limit), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal begin: Not an integer'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal end: Not an integer'); if (b >>>= 0, a < 0 || a > b || b > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + a + ' <= ' + b + ' <= ' + this.buffer.byteLength) } var c = this.clone(); return c.offset = a, c.limit = b, c }, c.toBuffer = function (a) { var e; var b = this.offset; var c = this.limit; if (!this.noAssert) { if (typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal offset: Not an integer'); if (b >>>= 0, typeof c !== 'number' || c % 1 !== 0) throw TypeError('Illegal limit: Not an integer'); if (c >>>= 0, b < 0 || b > c || c > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + b + ' <= ' + c + ' <= ' + this.buffer.byteLength) } return a || b !== 0 || c !== this.buffer.byteLength ? b === c ? d : (e = new ArrayBuffer(c - b), new Uint8Array(e).set(new Uint8Array(this.buffer).subarray(b, c), 0), e) : this.buffer }, c.toArrayBuffer = c.toBuffer, c.toString = function (a, b, c) { if (typeof a === 'undefined') return 'ByteBufferAB(offset=' + this.offset + ',markedOffset=' + this.markedOffset + ',limit=' + this.limit + ',capacity=' + this.capacity() + ')'; switch (typeof a === 'number' && (a = 'utf8', b = a, c = b), a) { case 'utf8':return this.toUTF8(b, c); case 'base64':return this.toBase64(b, c); case 'hex':return this.toHex(b, c); case 'binary':return this.toBinary(b, c); case 'debug':return this.toDebug(); case 'columns':return this.toColumns(); default:throw Error('Unsupported encoding: ' + a) } }, j = (function () { var d; var e; var a = {}; var b = [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47]; var c = []; for (d = 0, e = b.length; e > d; ++d)c[b[d]] = d; return a.encode = function (a, c) { for (var d, e; (d = a()) !== null;)c(b[63 & d >> 2]), e = (3 & d) << 4, (d = a()) !== null ? (e |= 15 & d >> 4, c(b[63 & (e | 15 & d >> 4)]), e = (15 & d) << 2, (d = a()) !== null ? (c(b[63 & (e | 3 & d >> 6)]), c(b[63 & d])) : (c(b[63 & e]), c(61))) : (c(b[63 & e]), c(61), c(61)); }, a.decode = function (a, b) { function g (a) { throw Error('Illegal character code: ' + a) } for (var d, e, f; (d = a()) !== null;) if (e = c[d], typeof e === 'undefined' && g(d), (d = a()) !== null && (f = c[d], typeof f === 'undefined' && g(d), b(e << 2 >>> 0 | (48 & f) >> 4), (d = a()) !== null)) { if (e = c[d], typeof e === 'undefined') { if (d === 61) break; g(d); } if (b((15 & f) << 4 >>> 0 | (60 & e) >> 2), (d = a()) !== null) { if (f = c[d], typeof f === 'undefined') { if (d === 61) break; g(d); }b((3 & e) << 6 >>> 0 | f); } } }, a.test = function (a) { return /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(a) }, a }()), c.toBase64 = function (a, b) { if (typeof a === 'undefined' && (a = this.offset), typeof b === 'undefined' && (b = this.limit), a = 0 | a, b = 0 | b, a < 0 || b > this.capacity || a > b) throw RangeError('begin, end'); var c; return j.encode(function () { return b > a ? this.view[a++] : null }.bind(this), c = g()), c() }, b.fromBase64 = function (a, c) { if (typeof a !== 'string') throw TypeError('str'); var d = new b(3 * (a.length / 4), c); var e = 0; return j.decode(f(a), function (a) { d.view[e++] = a; }), d.limit = e, d }, b.btoa = function (a) { return b.fromBinary(a).toBase64() }, b.atob = function (a) { return b.fromBase64(a).toBinary() }, c.toBinary = function (a, b) { if (typeof a === 'undefined' && (a = this.offset), typeof b === 'undefined' && (b = this.limit), a |= 0, b |= 0, a < 0 || b > this.capacity() || a > b) throw RangeError('begin, end'); if (a === b) return ''; for (var c = [], d = []; b > a;)c.push(this.view[a++]), c.length >= 1024 && (d.push(String.fromCharCode.apply(String, c)), c = []); return d.join('') + String.fromCharCode.apply(String, c) }, b.fromBinary = function (a, c) { if (typeof a !== 'string') throw TypeError('str'); for (var f, d = 0, e = a.length, g = new b(e, c); e > d;) { if (f = a.charCodeAt(d), f > 255) throw RangeError('illegal char code: ' + f); g.view[d++] = f; } return g.limit = e, g }, c.toDebug = function (a) { for (var d, b = -1, c = this.buffer.byteLength, e = '', f = '', g = ''; c > b;) { if (b !== -1 && (d = this.view[b], e += d < 16 ? '0' + d.toString(16).toUpperCase() : d.toString(16).toUpperCase(), a && (f += d > 32 && d < 127 ? String.fromCharCode(d) : '.')), ++b, a && b > 0 && b % 16 === 0 && b !== c) { for (;e.length < 51;)e += ' '; g += e + f + '\n', e = f = ''; }e += b === this.offset && b === this.limit ? b === this.markedOffset ? '!' : '|' : b === this.offset ? b === this.markedOffset ? '[' : '<' : b === this.limit ? b === this.markedOffset ? ']' : '>' : b === this.markedOffset ? "'" : a || b !== 0 && b !== c ? ' ' : ''; } if (a && e !== ' ') { for (;e.length < 51;)e += ' '; g += e + f + '\n'; } return a ? g : e }, b.fromDebug = function (a, c, d) { for (var i, j, e = a.length, f = new b(0 | (e + 1) / 3, c, d), g = 0, h = 0, k = !1, l = !1, m = !1, n = !1, o = !1; e > g;) { switch (i = a.charAt(g++)) { case '!':if (!d) { if (l || m || n) { o = !0; break }l = m = n = !0; }f.offset = f.markedOffset = f.limit = h, k = !1; break; case '|':if (!d) { if (l || n) { o = !0; break }l = n = !0; }f.offset = f.limit = h, k = !1; break; case '[':if (!d) { if (l || m) { o = !0; break }l = m = !0; }f.offset = f.markedOffset = h, k = !1; break; case '<':if (!d) { if (l) { o = !0; break }l = !0; }f.offset = h, k = !1; break; case ']':if (!d) { if (n || m) { o = !0; break }n = m = !0; }f.limit = f.markedOffset = h, k = !1; break; case '>':if (!d) { if (n) { o = !0; break }n = !0; }f.limit = h, k = !1; break; case "'":if (!d) { if (m) { o = !0; break }m = !0; }f.markedOffset = h, k = !1; break; case ' ':k = !1; break; default:if (!d && k) { o = !0; break } if (j = parseInt(i + a.charAt(g++), 16), !d && (isNaN(j) || j < 0 || j > 255)) throw TypeError('Illegal str: Not a debug encoded string'); f.view[h++] = j, k = !0; } if (o) throw TypeError('Illegal str: Invalid symbol at ' + g) } if (!d) { if (!l || !n) throw TypeError('Illegal str: Missing offset or limit'); if (h < f.buffer.byteLength) throw TypeError('Illegal str: Not a debug encoded string (is it hex?) ' + h + ' < ' + e) } return f }, c.toHex = function (a, b) { if (a = typeof a === 'undefined' ? this.offset : a, b = typeof b === 'undefined' ? this.limit : b, !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal begin: Not an integer'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal end: Not an integer'); if (b >>>= 0, a < 0 || a > b || b > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + a + ' <= ' + b + ' <= ' + this.buffer.byteLength) } for (var d, c = new Array(b - a); b > a;)d = this.view[a++], d < 16 ? c.push('0', d.toString(16)) : c.push(d.toString(16)); return c.join('') }, b.fromHex = function (a, c, d) { var g, e, f, h, i; if (!d) { if (typeof a !== 'string') throw TypeError('Illegal str: Not a string'); if (a.length % 2 !== 0) throw TypeError('Illegal str: Length not a multiple of 2') } for (e = a.length, f = new b(0 | e / 2, c), h = 0, i = 0; e > h; h += 2) { if (g = parseInt(a.substring(h, h + 2), 16), !d && (!isFinite(g) || g < 0 || g > 255)) throw TypeError('Illegal str: Contains non-hex characters'); f.view[i++] = g; } return f.limit = i, f }, k = (function () { var a = {}; return a.MAX_CODEPOINT = 1114111, a.encodeUTF8 = function (a, b) { var c = null; for (typeof a === 'number' && (c = a, a = function () { return null }); c !== null || (c = a()) !== null;)c < 128 ? b(127 & c) : c < 2048 ? (b(192 | 31 & c >> 6), b(128 | 63 & c)) : c < 65536 ? (b(224 | 15 & c >> 12), b(128 | 63 & c >> 6), b(128 | 63 & c)) : (b(240 | 7 & c >> 18), b(128 | 63 & c >> 12), b(128 | 63 & c >> 6), b(128 | 63 & c)), c = null; }, a.decodeUTF8 = function (a, b) { for (var c, d, e, f, g = function (a) { a = a.slice(0, a.indexOf(null)); var b = Error(a.toString()); throw b.name = 'TruncatedError', b.bytes = a, b }; (c = a()) !== null;) if ((128 & c) === 0)b(c); else if ((224 & c) === 192)(d = a()) === null && g([c, d]), b((31 & c) << 6 | 63 & d); else if ((240 & c) === 224)((d = a()) === null || (e = a()) === null) && g([c, d, e]), b((15 & c) << 12 | (63 & d) << 6 | 63 & e); else { if ((248 & c) !== 240) throw RangeError('Illegal starting byte: ' + c); ((d = a()) === null || (e = a()) === null || (f = a()) === null) && g([c, d, e, f]), b((7 & c) << 18 | (63 & d) << 12 | (63 & e) << 6 | 63 & f); } }, a.UTF16toUTF8 = function (a, b) { for (var c, d = null; ;) { if ((c = d !== null ? d : a()) === null) break; c >= 55296 && c <= 57343 && (d = a()) !== null && d >= 56320 && d <= 57343 ? (b(1024 * (c - 55296) + d - 56320 + 65536), d = null) : b(c); }d !== null && b(d); }, a.UTF8toUTF16 = function (a, b) { var c = null; for (typeof a === 'number' && (c = a, a = function () { return null }); c !== null || (c = a()) !== null;)c <= 65535 ? b(c) : (c -= 65536, b((c >> 10) + 55296), b(c % 1024 + 56320)), c = null; }, a.encodeUTF16toUTF8 = function (b, c) { a.UTF16toUTF8(b, function (b) { a.encodeUTF8(b, c); }); }, a.decodeUTF8toUTF16 = function (b, c) { a.decodeUTF8(b, function (b) { a.UTF8toUTF16(b, c); }); }, a.calculateCodePoint = function (a) { return a < 128 ? 1 : a < 2048 ? 2 : a < 65536 ? 3 : 4 }, a.calculateUTF8 = function (a) { for (var b, c = 0; (b = a()) !== null;)c += b < 128 ? 1 : b < 2048 ? 2 : b < 65536 ? 3 : 4; return c }, a.calculateUTF16asUTF8 = function (b) { var c = 0; var d = 0; return a.UTF16toUTF8(b, function (a) { ++c, d += a < 128 ? 1 : a < 2048 ? 2 : a < 65536 ? 3 : 4; }), [c, d] }, a }()), c.toUTF8 = function (a, b) { if (typeof a === 'undefined' && (a = this.offset), typeof b === 'undefined' && (b = this.limit), !this.noAssert) { if (typeof a !== 'number' || a % 1 !== 0) throw TypeError('Illegal begin: Not an integer'); if (a >>>= 0, typeof b !== 'number' || b % 1 !== 0) throw TypeError('Illegal end: Not an integer'); if (b >>>= 0, a < 0 || a > b || b > this.buffer.byteLength) throw RangeError('Illegal range: 0 <= ' + a + ' <= ' + b + ' <= ' + this.buffer.byteLength) } var c; try { k.decodeUTF8toUTF16(function () { return b > a ? this.view[a++] : null }.bind(this), c = g()); } catch (d) { if (a !== b) throw RangeError('Illegal range: Truncated data, ' + a + ' != ' + b) } return c() }, b.fromUTF8 = function (a, c, d) { if (!d && typeof a !== 'string') throw TypeError('Illegal str: Not a string'); var e = new b(k.calculateUTF16asUTF8(f(a), !0)[1], c, d); var g = 0; return k.encodeUTF16toUTF8(f(a), function (a) { e.view[g++] = a; }), e.limit = g, e }, b
      }(c)); var e = (function (b, c) {
        var f; var h; var e = {}; return e.ByteBuffer = b, e.c = b, f = b, e.Long = c || null, e.VERSION = '5.0.1', e.WIRE_TYPES = {}, e.WIRE_TYPES.VARINT = 0, e.WIRE_TYPES.BITS64 = 1, e.WIRE_TYPES.LDELIM = 2, e.WIRE_TYPES.STARTGROUP = 3, e.WIRE_TYPES.ENDGROUP = 4, e.WIRE_TYPES.BITS32 = 5, e.PACKABLE_WIRE_TYPES = [e.WIRE_TYPES.VARINT, e.WIRE_TYPES.BITS64, e.WIRE_TYPES.BITS32], e.TYPES = { int32: { name: 'int32', wireType: e.WIRE_TYPES.VARINT, defaultValue: 0 }, uint32: { name: 'uint32', wireType: e.WIRE_TYPES.VARINT, defaultValue: 0 }, sint32: { name: 'sint32', wireType: e.WIRE_TYPES.VARINT, defaultValue: 0 }, int64: { name: 'int64', wireType: e.WIRE_TYPES.VARINT, defaultValue: e.Long ? e.Long.ZERO : void 0 }, uint64: { name: 'uint64', wireType: e.WIRE_TYPES.VARINT, defaultValue: e.Long ? e.Long.UZERO : void 0 }, sint64: { name: 'sint64', wireType: e.WIRE_TYPES.VARINT, defaultValue: e.Long ? e.Long.ZERO : void 0 }, bool: { name: 'bool', wireType: e.WIRE_TYPES.VARINT, defaultValue: !1 }, double: { name: 'double', wireType: e.WIRE_TYPES.BITS64, defaultValue: 0 }, string: { name: 'string', wireType: e.WIRE_TYPES.LDELIM, defaultValue: '' }, bytes: { name: 'bytes', wireType: e.WIRE_TYPES.LDELIM, defaultValue: null }, fixed32: { name: 'fixed32', wireType: e.WIRE_TYPES.BITS32, defaultValue: 0 }, sfixed32: { name: 'sfixed32', wireType: e.WIRE_TYPES.BITS32, defaultValue: 0 }, fixed64: { name: 'fixed64', wireType: e.WIRE_TYPES.BITS64, defaultValue: e.Long ? e.Long.UZERO : void 0 }, sfixed64: { name: 'sfixed64', wireType: e.WIRE_TYPES.BITS64, defaultValue: e.Long ? e.Long.ZERO : void 0 }, float: { name: 'float', wireType: e.WIRE_TYPES.BITS32, defaultValue: 0 }, enum: { name: 'enum', wireType: e.WIRE_TYPES.VARINT, defaultValue: 0 }, message: { name: 'message', wireType: e.WIRE_TYPES.LDELIM, defaultValue: null }, group: { name: 'group', wireType: e.WIRE_TYPES.STARTGROUP, defaultValue: null } }, e.MAP_KEY_TYPES = [e.TYPES.int32, e.TYPES.sint32, e.TYPES.sfixed32, e.TYPES.uint32, e.TYPES.fixed32, e.TYPES.int64, e.TYPES.sint64, e.TYPES.sfixed64, e.TYPES.uint64, e.TYPES.fixed64, e.TYPES.bool, e.TYPES.string, e.TYPES.bytes], e.ID_MIN = 1, e.ID_MAX = 536870911, e.convertFieldsToCamelCase = !1, e.populateAccessors = !0, e.populateDefaults = !0, e.Util = (function () { var a = {}; return a.IS_NODE = !(typeof process !== 'object' || process + '' != '[object process]' || process.browser), a.XHR = function () { var c; var a = [function () { return new XMLHttpRequest() }, function () { return new ActiveXObject('Msxml2.XMLHTTP') }, function () { return new ActiveXObject('Msxml3.XMLHTTP') }, function () { return new ActiveXObject('Microsoft.XMLHTTP') }]; var b = null; for (c = 0; c < a.length; c++) { try { b = a[c](); } catch (d) { continue } break } if (!b) throw Error('XMLHttpRequest is not supported'); return b }, a.fetch = function (b, c) { if (c && typeof c !== 'function' && (c = null), a.IS_NODE) if (c)g.readFile(b, function (a, b) { a ? c(null) : c('' + b); }); else try { return g.readFileSync(b) } catch (d) { return null } else { var e = a.XHR(); if (e.open('GET', b, c ? !0 : !1), e.setRequestHeader('Accept', 'text/plain'), typeof e.overrideMimeType === 'function' && e.overrideMimeType('text/plain'), !c) return e.send(null), e.status == 200 || e.status == 0 && typeof e.responseText === 'string' ? e.responseText : null; if (e.onreadystatechange = function () { e.readyState == 4 && (e.status == 200 || e.status == 0 && typeof e.responseText === 'string' ? c(e.responseText) : c(null)); }, e.readyState == 4) return; e.send(null); } }, a.toCamelCase = function (a) { return a.replace(/_([a-zA-Z])/g, function (a, b) { return b.toUpperCase() }) }, a }()), e.Lang = { DELIM: /[\s\{\}=;:\[\],'"\(\)<>]/g, RULE: /^(?:required|optional|repeated|map)$/, TYPE: /^(?:double|float|int32|uint32|sint32|int64|uint64|sint64|fixed32|sfixed32|fixed64|sfixed64|bool|string|bytes)$/, NAME: /^[a-zA-Z_][a-zA-Z_0-9]*$/, TYPEDEF: /^[a-zA-Z][a-zA-Z_0-9]*$/, TYPEREF: /^(?:\.?[a-zA-Z_][a-zA-Z_0-9]*)+$/, FQTYPEREF: /^(?:\.[a-zA-Z][a-zA-Z_0-9]*)+$/, NUMBER: /^-?(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+|([0-9]*(\.[0-9]*)?([Ee][+-]?[0-9]+)?)|inf|nan)$/, NUMBER_DEC: /^(?:[1-9][0-9]*|0)$/, NUMBER_HEX: /^0[xX][0-9a-fA-F]+$/, NUMBER_OCT: /^0[0-7]+$/, NUMBER_FLT: /^([0-9]*(\.[0-9]*)?([Ee][+-]?[0-9]+)?|inf|nan)$/, BOOL: /^(?:true|false)$/i, ID: /^(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+)$/, NEGID: /^\-?(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+)$/, WHITESPACE: /\s/, STRING: /(?:"([^"\\]*(?:\\.[^"\\]*)*)")|(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g, STRING_DQ: /(?:"([^"\\]*(?:\\.[^"\\]*)*)")/g, STRING_SQ: /(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g }, e.DotProto = (function (a, b) {
          function h (a, c) { var d = -1; var e = 1; if (a.charAt(0) == '-' && (e = -1, a = a.substring(1)), b.NUMBER_DEC.test(a))d = parseInt(a); else if (b.NUMBER_HEX.test(a))d = parseInt(a.substring(2), 16); else { if (!b.NUMBER_OCT.test(a)) throw Error('illegal id value: ' + (e < 0 ? '-' : '') + a); d = parseInt(a.substring(1), 8); } if (d = 0 | e * d, !c && d < 0) throw Error('illegal id value: ' + (e < 0 ? '-' : '') + a); return d } function i (a) { var c = 1; if (a.charAt(0) == '-' && (c = -1, a = a.substring(1)), b.NUMBER_DEC.test(a)) return c * parseInt(a, 10); if (b.NUMBER_HEX.test(a)) return c * parseInt(a.substring(2), 16); if (b.NUMBER_OCT.test(a)) return c * parseInt(a.substring(1), 8); if (a === 'inf') return 1 / 0 * c; if (a === 'nan') return 0 / 0; if (b.NUMBER_FLT.test(a)) return c * parseFloat(a); throw Error('illegal number value: ' + (c < 0 ? '-' : '') + a) } function j (a, b, c) { typeof a[b] === 'undefined' ? a[b] = c : (Array.isArray(a[b]) || (a[b] = [a[b]]), a[b].push(c)); } var f; var g; var c = {}; var d = function (a) { this.source = a + '', this.index = 0, this.line = 1, this.stack = [], this._stringOpen = null; }; var e = d.prototype; return e._readString = function () { var c; var a = this._stringOpen === '"' ? b.STRING_DQ : b.STRING_SQ; if (a.lastIndex = this.index - 1, c = a.exec(this.source), !c) throw Error('unterminated string'); return this.index = a.lastIndex, this.stack.push(this._stringOpen), this._stringOpen = null, c[1] }, e.next = function () { var a, c, d, e, f, g; if (this.stack.length > 0) return this.stack.shift(); if (this.index >= this.source.length) return null; if (this._stringOpen !== null) return this._readString(); do { for (a = !1; b.WHITESPACE.test(d = this.source.charAt(this.index));) if (d === '\n' && ++this.line, ++this.index === this.source.length) return null; if (this.source.charAt(this.index) === '/') if (++this.index, this.source.charAt(this.index) === '/') { for (;this.source.charAt(++this.index) !== '\n';) if (this.index == this.source.length) return null; ++this.index, ++this.line, a = !0; } else { if ((d = this.source.charAt(this.index)) !== '*') return '/'; do { if (d === '\n' && ++this.line, ++this.index === this.source.length) return null; c = d, d = this.source.charAt(this.index); } while (c !== '*' || d !== '/'); ++this.index, a = !0; } } while (a); if (this.index === this.source.length) return null; if (e = this.index, b.DELIM.lastIndex = 0, f = b.DELIM.test(this.source.charAt(e++)), !f) for (;e < this.source.length && !b.DELIM.test(this.source.charAt(e));)++e; return g = this.source.substring(this.index, this.index = e), (g === '"' || g === "'") && (this._stringOpen = g), g }, e.peek = function () { if (this.stack.length === 0) { var a = this.next(); if (a === null) return null; this.stack.push(a); } return this.stack[0] }, e.skip = function (a) { var b = this.next(); if (b !== a) throw Error("illegal '" + b + "', '" + a + "' expected") }, e.omit = function (a) { return this.peek() === a ? (this.next(), !0) : !1 }, e.toString = function () { return 'Tokenizer (' + this.index + '/' + this.source.length + ' at line ' + this.line + ')' }, c.Tokenizer = d, f = function (a) { this.tn = new d(a), this.proto3 = !1; }, g = f.prototype, g.parse = function () { var c; var a = { name: '[ROOT]', package: null, messages: [], enums: [], imports: [], options: {}, services: [] }; var d = !0; try { for (;c = this.tn.next();) switch (c) { case 'package':if (!d || a.package !== null) throw Error("unexpected 'package'"); if (c = this.tn.next(), !b.TYPEREF.test(c)) throw Error('illegal package name: ' + c); this.tn.skip(';'), a.package = c; break; case 'import':if (!d) throw Error("unexpected 'import'"); c = this.tn.peek(), c === 'public' && this.tn.next(), c = this._readString(), this.tn.skip(';'), a.imports.push(c); break; case 'syntax':if (!d) throw Error("unexpected 'syntax'"); this.tn.skip('='), (a.syntax = this._readString()) === 'proto3' && (this.proto3 = !0), this.tn.skip(';'); break; case 'message':this._parseMessage(a, null), d = !1; break; case 'enum':this._parseEnum(a), d = !1; break; case 'option':this._parseOption(a); break; case 'service':this._parseService(a); break; case 'extend':this._parseExtend(a); break; default:throw Error("unexpected '" + c + "'") } } catch (e) { throw e.message = 'Parse error at line ' + this.tn.line + ': ' + e.message, e } return delete a.name, a }, f.parse = function (a) { return new f(a).parse() }, g._readString = function () { var b; var c; var a = ''; do { if (c = this.tn.next(), c !== "'" && c !== '"') throw Error('illegal string delimiter: ' + c); a += this.tn.next(), this.tn.skip(c), b = this.tn.peek(); } while (b === '"' || b === '"'); return a }, g._readValue = function (a) { var c = this.tn.peek(); if (c === '"' || c === "'") return this._readString(); if (this.tn.next(), b.NUMBER.test(c)) return i(c); if (b.BOOL.test(c)) return c.toLowerCase() === 'true'; if (a && b.TYPEREF.test(c)) return c; throw Error('illegal value: ' + c) }, g._parseOption = function (a, c) { var f; var d = this.tn.next(); var e = !1; if (d === '(' && (e = !0, d = this.tn.next()), !b.TYPEREF.test(d)) throw Error('illegal option name: ' + d); f = d, e && (this.tn.skip(')'), f = '(' + f + ')', d = this.tn.peek(), b.FQTYPEREF.test(d) && (f += d, this.tn.next())), this.tn.skip('='), this._parseOptionValue(a, f), c || this.tn.skip(';'); }, g._parseOptionValue = function (a, c) { var d = this.tn.peek(); if (d !== '{')j(a.options, c, this._readValue(!0)); else for (this.tn.skip('{'); (d = this.tn.next()) !== '}';) { if (!b.NAME.test(d)) throw Error('illegal option name: ' + c + '.' + d); this.tn.omit(':') ? j(a.options, c + '.' + d, this._readValue(!0)) : this._parseOptionValue(a, c + '.' + d); } }, g._parseService = function (a) { var d; var e; var c = this.tn.next(); if (!b.NAME.test(c)) throw Error('illegal service name at line ' + this.tn.line + ': ' + c); for (d = c, e = { name: d, rpc: {}, options: {} }, this.tn.skip('{'); (c = this.tn.next()) !== '}';) if (c === 'option') this._parseOption(e); else { if (c !== 'rpc') throw Error('illegal service token: ' + c); this._parseServiceRPC(e); } this.tn.omit(';'), a.services.push(e); }, g._parseServiceRPC = function (a) { var e; var f; var c = 'rpc'; var d = this.tn.next(); if (!b.NAME.test(d)) throw Error('illegal rpc service method name: ' + d); if (e = d, f = { request: null, response: null, request_stream: !1, response_stream: !1, options: {} }, this.tn.skip('('), d = this.tn.next(), d.toLowerCase() === 'stream' && (f.request_stream = !0, d = this.tn.next()), !b.TYPEREF.test(d)) throw Error('illegal rpc service request type: ' + d); if (f.request = d, this.tn.skip(')'), d = this.tn.next(), d.toLowerCase() !== 'returns') throw Error('illegal rpc service request type delimiter: ' + d); if (this.tn.skip('('), d = this.tn.next(), d.toLowerCase() === 'stream' && (f.response_stream = !0, d = this.tn.next()), f.response = d, this.tn.skip(')'), d = this.tn.peek(), d === '{') { for (this.tn.next(); (d = this.tn.next()) !== '}';) { if (d !== 'option') throw Error('illegal rpc service token: ' + d); this._parseOption(f); } this.tn.omit(';'); } else this.tn.skip(';'); typeof a[c] === 'undefined' && (a[c] = {}), a[c][e] = f; }, g._parseMessage = function (a, c) { var d = !!c; var e = this.tn.next(); var f = { name: '', fields: [], enums: [], messages: [], options: {}, services: [], oneofs: {} }; if (!b.NAME.test(e)) throw Error('illegal ' + (d ? 'group' : 'message') + ' name: ' + e); for (f.name = e, d && (this.tn.skip('='), c.id = h(this.tn.next()), f.isGroup = !0), e = this.tn.peek(), e === '[' && c && this._parseFieldOptions(c), this.tn.skip('{'); (e = this.tn.next()) !== '}';) if (b.RULE.test(e)) this._parseMessageField(f, e); else if (e === 'oneof') this._parseMessageOneOf(f); else if (e === 'enum') this._parseEnum(f); else if (e === 'message') this._parseMessage(f); else if (e === 'option') this._parseOption(f); else if (e === 'service') this._parseService(f); else if (e === 'extensions')f.extensions = this._parseExtensionRanges(); else if (e === 'reserved') this._parseIgnored(); else if (e === 'extend') this._parseExtend(f); else { if (!b.TYPEREF.test(e)) throw Error('illegal message token: ' + e); if (!this.proto3) throw Error('illegal field rule: ' + e); this._parseMessageField(f, 'optional', e); } return this.tn.omit(';'), a.messages.push(f), f }, g._parseIgnored = function () { for (;this.tn.peek() !== ';';) this.tn.next(); this.tn.skip(';'); }, g._parseMessageField = function (a, c, d) {
            var e, f, g; if (!b.RULE.test(c)) throw Error('illegal message field rule: ' + c); if (e = { rule: c, type: '', name: '', options: {}, id: 0 }, c === 'map') { if (d) throw Error('illegal type: ' + d); if (this.tn.skip('<'), f = this.tn.next(), !b.TYPE.test(f) && !b.TYPEREF.test(f)) throw Error('illegal message field type: ' + f); if (e.keytype = f, this.tn.skip(','), f = this.tn.next(), !b.TYPE.test(f) && !b.TYPEREF.test(f)) throw Error('illegal message field: ' + f); if (e.type = f, this.tn.skip('>'), f = this.tn.next(), !b.NAME.test(f)) throw Error('illegal message field name: ' + f); e.name = f, this.tn.skip('='), e.id = h(this.tn.next()), f = this.tn.peek(), f === '[' && this._parseFieldOptions(e), this.tn.skip(';'); } else if (d = typeof d !== 'undefined' ? d : this.tn.next(), d === 'group') { if (g = this._parseMessage(a, e), !/^[A-Z]/.test(g.name)) throw Error('illegal group name: ' + g.name); e.type = g.name, e.name = g.name.toLowerCase(), this.tn.omit(';'); } else {
              if (!b.TYPE.test(d) && !b.TYPEREF.test(d)) throw Error('illegal message field type: ' + d); if (e.type = d, f = this.tn.next(), !b.NAME.test(f)) throw Error('illegal message field name: ' + f)
              e.name = f, this.tn.skip('='), e.id = h(this.tn.next()), f = this.tn.peek(), f === '[' && this._parseFieldOptions(e), this.tn.skip(';');
            } return a.fields.push(e), e
          }, g._parseMessageOneOf = function (a) { var e; var d; var f; var c = this.tn.next(); if (!b.NAME.test(c)) throw Error('illegal oneof name: ' + c); for (d = c, f = [], this.tn.skip('{'); (c = this.tn.next()) !== '}';)e = this._parseMessageField(a, 'optional', c), e.oneof = d, f.push(e.id); this.tn.omit(';'), a.oneofs[d] = f; }, g._parseFieldOptions = function (a) { this.tn.skip('['); for (var c = !0; (this.tn.peek()) !== ']';)c || this.tn.skip(','), this._parseOption(a, !0), c = !1; this.tn.next(); }, g._parseEnum = function (a) { var e; var c = { name: '', values: [], options: {} }; var d = this.tn.next(); if (!b.NAME.test(d)) throw Error('illegal name: ' + d); for (c.name = d, this.tn.skip('{'); (d = this.tn.next()) !== '}';) if (d === 'option') this._parseOption(c); else { if (!b.NAME.test(d)) throw Error('illegal name: ' + d); this.tn.skip('='), e = { name: d, id: h(this.tn.next(), !0) }, d = this.tn.peek(), d === '[' && this._parseFieldOptions({ options: {} }), this.tn.skip(';'), c.values.push(e); } this.tn.omit(';'), a.enums.push(c); }, g._parseExtensionRanges = function () { var c; var d; var e; var b = []; do { for (d = []; ;) { switch (c = this.tn.next()) { case 'min':e = a.ID_MIN; break; case 'max':e = a.ID_MAX; break; default:e = i(c); } if (d.push(e), d.length === 2) break; if (this.tn.peek() !== 'to') { d.push(e); break } this.tn.next(); }b.push(d); } while (this.tn.omit(',')); return this.tn.skip(';'), b }, g._parseExtend = function (a) { var d; var c = this.tn.next(); if (!b.TYPEREF.test(c)) throw Error('illegal extend reference: ' + c); for (d = { ref: c, fields: [] }, this.tn.skip('{'); (c = this.tn.next()) !== '}';) if (b.RULE.test(c)) this._parseMessageField(d, c); else { if (!b.TYPEREF.test(c)) throw Error('illegal extend token: ' + c); if (!this.proto3) throw Error('illegal field rule: ' + c); this._parseMessageField(d, 'optional', c); } return this.tn.omit(';'), a.messages.push(d), d }, g.toString = function () { return 'Parser at line ' + this.tn.line }, c.Parser = f, c
        }(e, e.Lang)), e.Reflect = (function (a) { function k (b) { if (typeof b === 'string' && (b = a.TYPES[b]), typeof b.defaultValue === 'undefined') throw Error('default value for type ' + b.name + ' is not supported'); return b == a.TYPES.bytes ? new f(0) : b.defaultValue } function l (b, c) { if (b && typeof b.low === 'number' && typeof b.high === 'number' && typeof b.unsigned === 'boolean' && b.low === b.low && b.high === b.high) return new a.Long(b.low, b.high, typeof c === 'undefined' ? b.unsigned : c); if (typeof b === 'string') return a.Long.fromString(b, c || !1, 10); if (typeof b === 'number') return a.Long.fromNumber(b, c || !1); throw Error('not convertible to Long') } function o (b, c) { var d = c.readVarint32(); var e = 7 & d; var f = d >>> 3; switch (e) { case a.WIRE_TYPES.VARINT:do d = c.readUint8(); while ((128 & d) === 128); break; case a.WIRE_TYPES.BITS64:c.offset += 8; break; case a.WIRE_TYPES.LDELIM:d = c.readVarint32(), c.offset += d; break; case a.WIRE_TYPES.STARTGROUP:o(f, c); break; case a.WIRE_TYPES.ENDGROUP:if (f === b) return !1; throw Error('Illegal GROUPEND after unknown group: ' + f + ' (' + b + ' expected)'); case a.WIRE_TYPES.BITS32:c.offset += 4; break; default:throw Error('Illegal wire type in unknown group ' + b + ': ' + e) } return !0 } var g; var h; var i; var j; var m; var n; var p; var q; var r; var s; var t; var u; var v; var w; var x; var y; var z; var A; var B; var c = {}; var d = function (a, b, c) { this.builder = a, this.parent = b, this.name = c, this.className; }; var e = d.prototype; return e.fqn = function () { for (var a = this.name, b = this; ;) { if (b = b.parent, b == null) break; a = b.name + '.' + a; } return a }, e.toString = function (a) { return (a ? this.className + ' ' : '') + this.fqn() }, e.build = function () { throw Error(this.toString(!0) + ' cannot be built directly') }, c.T = d, g = function (a, b, c, e, f) { d.call(this, a, b, c), this.className = 'Namespace', this.children = [], this.options = e || {}, this.syntax = f || 'proto2'; }, h = g.prototype = Object.create(d.prototype), h.getChildren = function (a) { var b, c, d; if (a = a || null, a == null) return this.children.slice(); for (b = [], c = 0, d = this.children.length; d > c; ++c) this.children[c] instanceof a && b.push(this.children[c]); return b }, h.addChild = function (a) { var b; if (b = this.getChild(a.name)) if (b instanceof m.Field && b.name !== b.originalName && this.getChild(b.originalName) === null)b.name = b.originalName; else { if (!(a instanceof m.Field && a.name !== a.originalName && this.getChild(a.originalName) === null)) throw Error('Duplicate name in namespace ' + this.toString(!0) + ': ' + a.name); a.name = a.originalName; } this.children.push(a); }, h.getChild = function (a) { var c; var d; var b = typeof a === 'number' ? 'id' : 'name'; for (c = 0, d = this.children.length; d > c; ++c) if (this.children[c][b] === a) return this.children[c]; return null }, h.resolve = function (a, b) { var g; var d = typeof a === 'string' ? a.split('.') : a; var e = this; var f = 0; if (d[f] === '') { for (;e.parent !== null;)e = e.parent; f++; } do { do { if (!(e instanceof c.Namespace)) { e = null; break } if (g = e.getChild(d[f]), !(g && g instanceof c.T && (!b || g instanceof c.Namespace))) { e = null; break }e = g, f++; } while (f < d.length); if (e != null) break; if (this.parent !== null) return this.parent.resolve(a, b) } while (e != null); return e }, h.qn = function (a) { var e; var f; var b = []; var d = a; do b.unshift(d.name), d = d.parent; while (d !== null); for (e = 1; e <= b.length; e++) if (f = b.slice(b.length - e), a === this.resolve(f, a instanceof c.Namespace)) return f.join('.'); return a.fqn() }, h.build = function () { var e; var c; var d; var a = {}; var b = this.children; for (c = 0, d = b.length; d > c; ++c)e = b[c], e instanceof g && (a[e.name] = e.build()); return Object.defineProperty && Object.defineProperty(a, '$options', { value: this.buildOpt() }), a }, h.buildOpt = function () { var c; var d; var e; var f; var a = {}; var b = Object.keys(this.options); for (c = 0, d = b.length; d > c; ++c)e = b[c], f = this.options[b[c]], a[e] = f; return a }, h.getOption = function (a) { return typeof a === 'undefined' ? this.options : typeof this.options[a] !== 'undefined' ? this.options[a] : null }, c.Namespace = g, i = function (b, c, d, e) { if (this.type = b, this.resolvedType = c, this.isMapKey = d, this.syntax = e, d && a.MAP_KEY_TYPES.indexOf(b) < 0) throw Error('Invalid map key type: ' + b.name) }, j = i.prototype, i.defaultFieldValue = k, j.verifyValue = function (c) { var f; var g; var h; var d = function (a, b) { throw Error('Illegal value for ' + this.toString(!0) + ' of type ' + this.type.name + ': ' + a + ' (' + b + ')') }.bind(this); switch (this.type) { case a.TYPES.int32:case a.TYPES.sint32:case a.TYPES.sfixed32:return (typeof c !== 'number' || c === c && c % 1 !== 0) && d(typeof c, 'not an integer'), c > 4294967295 ? 0 | c : c; case a.TYPES.uint32:case a.TYPES.fixed32:return (typeof c !== 'number' || c === c && c % 1 !== 0) && d(typeof c, 'not an integer'), c < 0 ? c >>> 0 : c; case a.TYPES.int64:case a.TYPES.sint64:case a.TYPES.sfixed64:if (a.Long) try { return l(c, !1) } catch (e) { d(typeof c, e.message); } else d(typeof c, 'requires Long.js'); case a.TYPES.uint64:case a.TYPES.fixed64:if (a.Long) try { return l(c, !0) } catch (e) { d(typeof c, e.message); } else d(typeof c, 'requires Long.js'); case a.TYPES.bool:return typeof c !== 'boolean' && d(typeof c, 'not a boolean'), c; case a.TYPES.float:case a.TYPES.double:return typeof c !== 'number' && d(typeof c, 'not a number'), c; case a.TYPES.string:return typeof c === 'string' || c && c instanceof String || d(typeof c, 'not a string'), '' + c; case a.TYPES.bytes:return b.isByteBuffer(c) ? c : b.wrap(c); case a.TYPES.enum:for (f = this.resolvedType.getChildren(a.Reflect.Enum.Value), h = 0; h < f.length; h++) { if (f[h].name == c) return f[h].id; if (f[h].id == c) return f[h].id } if (this.syntax === 'proto3') return (typeof c !== 'number' || c === c && c % 1 !== 0) && d(typeof c, 'not an integer'), (c > 4294967295 || c < 0) && d(typeof c, 'not in range for uint32'), c; d(c, 'not a valid enum value'); case a.TYPES.group:case a.TYPES.message:if (c && typeof c === 'object' || d(typeof c, 'object expected'), c instanceof this.resolvedType.clazz) return c; if (c instanceof a.Builder.Message) { g = {}; for (h in c)c.hasOwnProperty(h) && (g[h] = c[h]); c = g; } return new this.resolvedType.clazz(c) } throw Error('[INTERNAL] Illegal value for ' + this.toString(!0) + ': ' + c + ' (undefined type ' + this.type + ')') }, j.calculateLength = function (b, c) { if (c === null) return 0; var d; switch (this.type) { case a.TYPES.int32:return c < 0 ? f.calculateVarint64(c) : f.calculateVarint32(c); case a.TYPES.uint32:return f.calculateVarint32(c); case a.TYPES.sint32:return f.calculateVarint32(f.zigZagEncode32(c)); case a.TYPES.fixed32:case a.TYPES.sfixed32:case a.TYPES.float:return 4; case a.TYPES.int64:case a.TYPES.uint64:return f.calculateVarint64(c); case a.TYPES.sint64:return f.calculateVarint64(f.zigZagEncode64(c)); case a.TYPES.fixed64:case a.TYPES.sfixed64:return 8; case a.TYPES.bool:return 1; case a.TYPES.enum:return f.calculateVarint32(c); case a.TYPES.double:return 8; case a.TYPES.string:return d = f.calculateUTF8Bytes(c), f.calculateVarint32(d) + d; case a.TYPES.bytes:if (c.remaining() < 0) throw Error('Illegal value for ' + this.toString(!0) + ': ' + c.remaining() + ' bytes remaining'); return f.calculateVarint32(c.remaining()) + c.remaining(); case a.TYPES.message:return d = this.resolvedType.calculate(c), f.calculateVarint32(d) + d; case a.TYPES.group:return d = this.resolvedType.calculate(c), d + f.calculateVarint32(b << 3 | a.WIRE_TYPES.ENDGROUP) } throw Error('[INTERNAL] Illegal value to encode in ' + this.toString(!0) + ': ' + c + ' (unknown type)') }, j.encodeValue = function (b, c, d) { var e, g; if (c === null) return d; switch (this.type) { case a.TYPES.int32:c < 0 ? d.writeVarint64(c) : d.writeVarint32(c); break; case a.TYPES.uint32:d.writeVarint32(c); break; case a.TYPES.sint32:d.writeVarint32ZigZag(c); break; case a.TYPES.fixed32:d.writeUint32(c); break; case a.TYPES.sfixed32:d.writeInt32(c); break; case a.TYPES.int64:case a.TYPES.uint64:d.writeVarint64(c); break; case a.TYPES.sint64:d.writeVarint64ZigZag(c); break; case a.TYPES.fixed64:d.writeUint64(c); break; case a.TYPES.sfixed64:d.writeInt64(c); break; case a.TYPES.bool:typeof c === 'string' ? d.writeVarint32(c.toLowerCase() === 'false' ? 0 : !!c) : d.writeVarint32(c ? 1 : 0); break; case a.TYPES.enum:d.writeVarint32(c); break; case a.TYPES.float:d.writeFloat32(c); break; case a.TYPES.double:d.writeFloat64(c); break; case a.TYPES.string:d.writeVString(c); break; case a.TYPES.bytes:if (c.remaining() < 0) throw Error('Illegal value for ' + this.toString(!0) + ': ' + c.remaining() + ' bytes remaining'); e = c.offset, d.writeVarint32(c.remaining()), d.append(c), c.offset = e; break; case a.TYPES.message:g = (new f()).LE(), this.resolvedType.encode(c, g), d.writeVarint32(g.offset), d.append(g.flip()); break; case a.TYPES.group:this.resolvedType.encode(c, d), d.writeVarint32(b << 3 | a.WIRE_TYPES.ENDGROUP); break; default:throw Error('[INTERNAL] Illegal value to encode in ' + this.toString(!0) + ': ' + c + ' (unknown type)') } return d }, j.decode = function (b, c, d) { if (c != this.type.wireType) throw Error('Unexpected wire type for element'); var e, f; switch (this.type) { case a.TYPES.int32:return 0 | b.readVarint32(); case a.TYPES.uint32:return b.readVarint32() >>> 0; case a.TYPES.sint32:return 0 | b.readVarint32ZigZag(); case a.TYPES.fixed32:return b.readUint32() >>> 0; case a.TYPES.sfixed32:return 0 | b.readInt32(); case a.TYPES.int64:return b.readVarint64(); case a.TYPES.uint64:return b.readVarint64().toUnsigned(); case a.TYPES.sint64:return b.readVarint64ZigZag(); case a.TYPES.fixed64:return b.readUint64(); case a.TYPES.sfixed64:return b.readInt64(); case a.TYPES.bool:return !!b.readVarint32(); case a.TYPES.enum:return b.readVarint32(); case a.TYPES.float:return b.readFloat(); case a.TYPES.double:return b.readDouble(); case a.TYPES.string:return b.readVString(); case a.TYPES.bytes:if (f = b.readVarint32(), b.remaining() < f) throw Error('Illegal number of bytes for ' + this.toString(!0) + ': ' + f + ' required but got only ' + b.remaining()); return e = b.clone(), e.limit = e.offset + f, b.offset += f, e; case a.TYPES.message:return f = b.readVarint32(), this.resolvedType.decode(b, f); case a.TYPES.group:return this.resolvedType.decode(b, -1, d) } throw Error('[INTERNAL] Illegal decode type') }, j.valueFromString = function (b) { if (!this.isMapKey) throw Error('valueFromString() called on non-map-key element'); switch (this.type) { case a.TYPES.int32:case a.TYPES.sint32:case a.TYPES.sfixed32:case a.TYPES.uint32:case a.TYPES.fixed32:return this.verifyValue(parseInt(b)); case a.TYPES.int64:case a.TYPES.sint64:case a.TYPES.sfixed64:case a.TYPES.uint64:case a.TYPES.fixed64:return this.verifyValue(b); case a.TYPES.bool:return b === 'true'; case a.TYPES.string:return this.verifyValue(b); case a.TYPES.bytes:return f.fromBinary(b) } }, j.valueToString = function (b) { if (!this.isMapKey) throw Error('valueToString() called on non-map-key element'); return this.type === a.TYPES.bytes ? b.toString('binary') : b.toString() }, c.Element = i, m = function (a, b, c, d, e, f) { g.call(this, a, b, c, d, f), this.className = 'Message', this.extensions = void 0, this.clazz = null, this.isGroup = !!e, this._fields = null, this._fieldsById = null, this._fieldsByName = null; }, n = m.prototype = Object.create(g.prototype), n.build = function (c) { var d, h, e, g; if (this.clazz && !c) return this.clazz; for (d = (function (a, c) { function k (b, c, d, e) { var g, h, i, j, l, m, n; if (b === null || typeof b !== 'object') return e && e instanceof a.Reflect.Enum && (g = a.Reflect.Enum.getName(e.object, b), g !== null) ? g : b; if (f.isByteBuffer(b)) return c ? b.toBase64() : b.toBuffer(); if (a.Long.isLong(b)) return d ? b.toString() : a.Long.fromValue(b); if (Array.isArray(b)) return h = [], b.forEach(function (a, b) { h[b] = k(a, c, d, e); }), h; if (h = {}, b instanceof a.Map) { for (i = b.entries(), j = i.next(); !j.done; j = i.next())h[b.keyElem.valueToString(j.value[0])] = k(j.value[1], c, d, b.valueElem.resolvedType); return h }l = b.$type, m = void 0; for (n in b)b.hasOwnProperty(n) && (h[n] = l && (m = l.getChild(n)) ? k(b[n], c, d, m.resolvedType) : k(b[n], c, d)); return h } var i; var j; var d = c.getChildren(a.Reflect.Message.Field); var e = c.getChildren(a.Reflect.Message.OneOf); var g = function (b) { var i, j, k, l; for (a.Builder.Message.call(this), i = 0, j = e.length; j > i; ++i) this[e[i].name] = null; for (i = 0, j = d.length; j > i; ++i)k = d[i], this[k.name] = k.repeated ? [] : k.map ? new a.Map(k) : null, !k.required && c.syntax !== 'proto3' || k.defaultValue === null || (this[k.name] = k.defaultValue); if (arguments.length > 0) if (arguments.length !== 1 || b === null || typeof b !== 'object' || !(typeof b.encode !== 'function' || b instanceof g) || Array.isArray(b) || b instanceof a.Map || f.isByteBuffer(b) || b instanceof ArrayBuffer || a.Long && b instanceof a.Long) for (i = 0, j = arguments.length; j > i; ++i) typeof (l = arguments[i]) !== 'undefined' && this.$set(d[i].name, l); else this.$set(b); }; var h = g.prototype = Object.create(a.Builder.Message.prototype); for (h.add = function (b, d, e) { var f = c._fieldsByName[b]; if (!e) { if (!f) throw Error(this + '#' + b + ' is undefined'); if (!(f instanceof a.Reflect.Message.Field)) throw Error(this + '#' + b + ' is not a field: ' + f.toString(!0)); if (!f.repeated) throw Error(this + '#' + b + ' is not a repeated field'); d = f.verifyValue(d, !0); } return this[b] === null && (this[b] = []), this[b].push(d), this }, h.$add = h.add, h.set = function (b, d, e) { var f, g, h; if (b && typeof b === 'object') { e = d; for (f in b)b.hasOwnProperty(f) && typeof (d = b[f]) !== 'undefined' && this.$set(f, d, e); return this } if (g = c._fieldsByName[b], e) this[b] = d; else { if (!g) throw Error(this + '#' + b + ' is not a field: undefined'); if (!(g instanceof a.Reflect.Message.Field)) throw Error(this + '#' + b + ' is not a field: ' + g.toString(!0)); this[g.name] = d = g.verifyValue(d); } return g && g.oneof && (h = this[g.oneof.name], d !== null ? (h !== null && h !== g.name && (this[h] = null), this[g.oneof.name] = g.name) : h === b && (this[g.oneof.name] = null)), this }, h.$set = h.set, h.get = function (b, d) { if (d) return this[b]; var e = c._fieldsByName[b]; if (!(e && e instanceof a.Reflect.Message.Field)) throw Error(this + '#' + b + ' is not a field: undefined'); if (!(e instanceof a.Reflect.Message.Field)) throw Error(this + '#' + b + ' is not a field: ' + e.toString(!0)); return this[e.name] }, h.$get = h.get, i = 0; i < d.length; i++)j = d[i], j instanceof a.Reflect.Message.ExtensionField || c.builder.options.populateAccessors && (function (a) { var d; var e; var f; var b = a.originalName.replace(/(_[a-zA-Z])/g, function (a) { return a.toUpperCase().replace('_', '') }); b = b.substring(0, 1).toUpperCase() + b.substring(1), d = a.originalName.replace(/([A-Z])/g, function (a) { return '_' + a }), e = function (b, c) { return this[a.name] = c ? b : a.verifyValue(b), this }, f = function () { return this[a.name] }, c.getChild('set' + b) === null && (h['set' + b] = e), c.getChild('set_' + d) === null && (h['set_' + d] = e), c.getChild('get' + b) === null && (h['get' + b] = f), c.getChild('get_' + d) === null && (h['get_' + d] = f); }(j)); return h.encode = function (a, d) { var e, f; typeof a === 'boolean' && (d = a, a = void 0), e = !1, a || (a = new b(), e = !0), f = a.littleEndian; try { return c.encode(this, a.LE(), d), (e ? a.flip() : a).LE(f) } catch (g) { throw a.LE(f), g } }, g.encode = function (a, b, c) { return new g(a).encode(b, c) }, h.calculate = function () { return c.calculate(this) }, h.encodeDelimited = function (a) { var d; var b = !1; return a || (a = new f(), b = !0), d = (new f()).LE(), c.encode(this, d).flip(), a.writeVarint32(d.remaining()), a.append(d), b ? a.flip() : a }, h.encodeAB = function () { try { return this.encode().toArrayBuffer() } catch (a) { throw a.encoded && (a.encoded = a.encoded.toArrayBuffer()), a } }, h.toArrayBuffer = h.encodeAB, h.encodeNB = function () { try { return this.encode().toBuffer() } catch (a) { throw a.encoded && (a.encoded = a.encoded.toBuffer()), a } }, h.toBuffer = h.encodeNB, h.encode64 = function () { try { return this.encode().toBase64() } catch (a) { throw a.encoded && (a.encoded = a.encoded.toBase64()), a } }, h.toBase64 = h.encode64, h.encodeHex = function () { try { return this.encode().toHex() } catch (a) { throw a.encoded && (a.encoded = a.encoded.toHex()), a } }, h.toHex = h.encodeHex, h.toRaw = function (a, b) { return k(this, !!a, !!b, this.$type) }, h.encodeJSON = function () { return JSON.stringify(k(this, !0, !0, this.$type)) }, g.decode = function (a, b) { var d, e; typeof a === 'string' && (a = f.wrap(a, b || 'base64')), a = f.isByteBuffer(a) ? a : f.wrap(a), d = a.littleEndian; try { return e = c.decode(a.LE()), a.LE(d), e } catch (g) { throw a.LE(d), g } }, g.decodeDelimited = function (a, b) { var d, e, g; if (typeof a === 'string' && (a = f.wrap(a, b || 'base64')), a = f.isByteBuffer(a) ? a : f.wrap(a), a.remaining() < 1) return null; if (d = a.offset, e = a.readVarint32(), a.remaining() < e) return a.offset = d, null; try { return g = c.decode(a.slice(a.offset, a.offset + e).LE()), a.offset += e, g } catch (h) { throw a.offset += e, h } }, g.decode64 = function (a) { return g.decode(a, 'base64') }, g.decodeHex = function (a) { return g.decode(a, 'hex') }, g.decodeJSON = function (a) { return new g(JSON.parse(a)) }, h.toString = function () { return c.toString() }, Object.defineProperty && (Object.defineProperty(g, '$options', { value: c.buildOpt() }), Object.defineProperty(h, '$options', { value: g.$options }), Object.defineProperty(g, '$type', { value: c }), Object.defineProperty(h, '$type', { value: c })), g }(a, this)), this._fields = [], this._fieldsById = {}, this._fieldsByName = {}, e = 0, g = this.children.length; g > e; e++) if (h = this.children[e], h instanceof t || h instanceof m || h instanceof x) { if (d.hasOwnProperty(h.name)) throw Error('Illegal reflect child of ' + this.toString(!0) + ': ' + h.toString(!0) + " cannot override static property '" + h.name + "'"); d[h.name] = h.build(); } else if (h instanceof m.Field)h.build(), this._fields.push(h), this._fieldsById[h.id] = h, this._fieldsByName[h.name] = h; else if (!(h instanceof m.OneOf || h instanceof w)) throw Error('Illegal reflect child of ' + this.toString(!0) + ': ' + this.children[e].toString(!0)); return this.clazz = d }, n.encode = function (a, b, c) { var e; var h; var f; var g; var i; var d = null; for (f = 0, g = this._fields.length; g > f; ++f)e = this._fields[f], h = a[e.name], e.required && h === null ? d === null && (d = e) : e.encode(c ? h : e.verifyValue(h), b, a); if (d !== null) throw i = Error('Missing at least one required field for ' + this.toString(!0) + ': ' + d), i.encoded = b, i; return b }, n.calculate = function (a) { for (var e, f, b = 0, c = 0, d = this._fields.length; d > c; ++c) { if (e = this._fields[c], f = a[e.name], e.required && f === null) throw Error('Missing at least one required field for ' + this.toString(!0) + ': ' + e); b += e.calculate(f, a); } return b }, n.decode = function (b, c, d) { var g, h, i, j, e, f, k, l, m, n, p, q; for (c = typeof c === 'number' ? c : -1, e = b.offset, f = new this.clazz(); b.offset < e + c || c === -1 && b.remaining() > 0;) { if (g = b.readVarint32(), h = 7 & g, i = g >>> 3, h === a.WIRE_TYPES.ENDGROUP) { if (i !== d) throw Error('Illegal group end indicator for ' + this.toString(!0) + ': ' + i + ' (' + (d ? d + ' expected' : 'not a group') + ')'); break } if (j = this._fieldsById[i])j.repeated && !j.options.packed ? f[j.name].push(j.decode(h, b)) : j.map ? (l = j.decode(h, b), f[j.name].set(l[0], l[1])) : (f[j.name] = j.decode(h, b), j.oneof && (m = f[j.oneof.name], m !== null && m !== j.name && (f[m] = null), f[j.oneof.name] = j.name)); else switch (h) { case a.WIRE_TYPES.VARINT:b.readVarint32(); break; case a.WIRE_TYPES.BITS32:b.offset += 4; break; case a.WIRE_TYPES.BITS64:b.offset += 8; break; case a.WIRE_TYPES.LDELIM:k = b.readVarint32(), b.offset += k; break; case a.WIRE_TYPES.STARTGROUP:for (;o(i, b););break; default:throw Error('Illegal wire type for unknown field ' + i + ' in ' + this.toString(!0) + '#decode: ' + h) } } for (n = 0, p = this._fields.length; p > n; ++n) if (j = this._fields[n], f[j.name] === null) if (this.syntax === 'proto3')f[j.name] = j.defaultValue; else { if (j.required) throw q = Error('Missing at least one required field for ' + this.toString(!0) + ': ' + j.name), q.decoded = f, q; a.populateDefaults && j.defaultValue !== null && (f[j.name] = j.defaultValue); } return f }, c.Message = m, p = function (b, c, e, f, g, h, i, j, k, l) { d.call(this, b, c, h), this.className = 'Message.Field', this.required = e === 'required', this.repeated = e === 'repeated', this.map = e === 'map', this.keyType = f || null, this.type = g, this.resolvedType = null, this.id = i, this.options = j || {}, this.defaultValue = null, this.oneof = k || null, this.syntax = l || 'proto2', this.originalName = this.name, this.element = null, this.keyElement = null, !this.builder.options.convertFieldsToCamelCase || this instanceof m.ExtensionField || (this.name = a.Util.toCamelCase(this.name)); }, q = p.prototype = Object.create(d.prototype), q.build = function () { this.element = new i(this.type, this.resolvedType, !1, this.syntax), this.map && (this.keyElement = new i(this.keyType, void 0, !0, this.syntax)), this.syntax !== 'proto3' || this.repeated || this.map ? typeof this.options.default !== 'undefined' && (this.defaultValue = this.verifyValue(this.options.default)) : this.defaultValue = i.defaultFieldValue(this.type); }, q.verifyValue = function (b, c) { var d, e, f; if (c = c || !1, d = function (a, b) { throw Error('Illegal value for ' + this.toString(!0) + ' of type ' + this.type.name + ': ' + a + ' (' + b + ')') }.bind(this), b === null) return this.required && d(typeof b, 'required'), this.syntax === 'proto3' && this.type !== a.TYPES.message && d(typeof b, 'proto3 field without field presence cannot be null'), null; if (this.repeated && !c) { for (Array.isArray(b) || (b = [b]), f = [], e = 0; e < b.length; e++)f.push(this.element.verifyValue(b[e])); return f } return this.map && !c ? b instanceof a.Map ? b : (b instanceof Object || d(typeof b, 'expected ProtoBuf.Map or raw object for map field'), new a.Map(this, b)) : (!this.repeated && Array.isArray(b) && d(typeof b, 'no array expected'), this.element.verifyValue(b)) }, q.hasWirePresence = function (b, c) { if (this.syntax !== 'proto3') return b !== null; if (this.oneof && c[this.oneof.name] === this.name) return !0; switch (this.type) { case a.TYPES.int32:case a.TYPES.sint32:case a.TYPES.sfixed32:case a.TYPES.uint32:case a.TYPES.fixed32:return b !== 0; case a.TYPES.int64:case a.TYPES.sint64:case a.TYPES.sfixed64:case a.TYPES.uint64:case a.TYPES.fixed64:return b.low !== 0 || b.high !== 0; case a.TYPES.bool:return b; case a.TYPES.float:case a.TYPES.double:return b !== 0; case a.TYPES.string:return b.length > 0; case a.TYPES.bytes:return b.remaining() > 0; case a.TYPES.enum:return b !== 0; case a.TYPES.message:return b !== null; default:return !0 } }, q.encode = function (b, c, d) { var e, g, h, i, j; if (this.type === null || typeof this.type !== 'object') throw Error('[INTERNAL] Unresolved type in ' + this.toString(!0) + ': ' + this.type); if (b === null || this.repeated && b.length == 0) return c; try { if (this.repeated) if (this.options.packed && a.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType) >= 0) { for (c.writeVarint32(this.id << 3 | a.WIRE_TYPES.LDELIM), c.ensureCapacity(c.offset += 1), g = c.offset, e = 0; e < b.length; e++) this.element.encodeValue(this.id, b[e], c); h = c.offset - g, i = f.calculateVarint32(h), i > 1 && (j = c.slice(g, c.offset), g += i - 1, c.offset = g, c.append(j)), c.writeVarint32(h, g - i); } else for (e = 0; e < b.length; e++)c.writeVarint32(this.id << 3 | this.type.wireType), this.element.encodeValue(this.id, b[e], c); else this.map ? b.forEach(function (b, d) { var g = f.calculateVarint32(8 | this.keyType.wireType) + this.keyElement.calculateLength(1, d) + f.calculateVarint32(16 | this.type.wireType) + this.element.calculateLength(2, b); c.writeVarint32(this.id << 3 | a.WIRE_TYPES.LDELIM), c.writeVarint32(g), c.writeVarint32(8 | this.keyType.wireType), this.keyElement.encodeValue(1, d, c), c.writeVarint32(16 | this.type.wireType), this.element.encodeValue(2, b, c); }, this) : this.hasWirePresence(b, d) && (c.writeVarint32(this.id << 3 | this.type.wireType), this.element.encodeValue(this.id, b, c)); } catch (k) { throw Error('Illegal value for ' + this.toString(!0) + ': ' + b + ' (' + k + ')') } return c }, q.calculate = function (b, c) { var d, e, g; if (b = this.verifyValue(b), this.type === null || typeof this.type !== 'object') throw Error('[INTERNAL] Unresolved type in ' + this.toString(!0) + ': ' + this.type); if (b === null || this.repeated && b.length == 0) return 0; d = 0; try { if (this.repeated) if (this.options.packed && a.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType) >= 0) { for (d += f.calculateVarint32(this.id << 3 | a.WIRE_TYPES.LDELIM), g = 0, e = 0; e < b.length; e++)g += this.element.calculateLength(this.id, b[e]); d += f.calculateVarint32(g), d += g; } else for (e = 0; e < b.length; e++)d += f.calculateVarint32(this.id << 3 | this.type.wireType), d += this.element.calculateLength(this.id, b[e]); else this.map ? b.forEach(function (b, c) { var g = f.calculateVarint32(8 | this.keyType.wireType) + this.keyElement.calculateLength(1, c) + f.calculateVarint32(16 | this.type.wireType) + this.element.calculateLength(2, b); d += f.calculateVarint32(this.id << 3 | a.WIRE_TYPES.LDELIM), d += f.calculateVarint32(g), d += g; }, this) : this.hasWirePresence(b, c) && (d += f.calculateVarint32(this.id << 3 | this.type.wireType), d += this.element.calculateLength(this.id, b)); } catch (h) { throw Error('Illegal value for ' + this.toString(!0) + ': ' + b + ' (' + h + ')') } return d }, q.decode = function (b, c, d) { var e; var f; var h; var j; var k; var l; var m; var g = !this.map && b == this.type.wireType || !d && this.repeated && this.options.packed && b == a.WIRE_TYPES.LDELIM || this.map && b == a.WIRE_TYPES.LDELIM; if (!g) throw Error('Illegal wire type for field ' + this.toString(!0) + ': ' + b + ' (' + this.type.wireType + ' expected)'); if (b == a.WIRE_TYPES.LDELIM && this.repeated && this.options.packed && a.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType) >= 0 && !d) { for (f = c.readVarint32(), f = c.offset + f, h = []; c.offset < f;)h.push(this.decode(this.type.wireType, c, !0)); return h } if (this.map) { if (j = i.defaultFieldValue(this.keyType), e = i.defaultFieldValue(this.type), f = c.readVarint32(), c.remaining() < f) throw Error('Illegal number of bytes for ' + this.toString(!0) + ': ' + f + ' required but got only ' + c.remaining()); for (k = c.clone(), k.limit = k.offset + f, c.offset += f; k.remaining() > 0;) if (l = k.readVarint32(), b = 7 & l, m = l >>> 3, m === 1)j = this.keyElement.decode(k, b, m); else { if (m !== 2) throw Error('Unexpected tag in map field key/value submessage'); e = this.element.decode(k, b, m); } return [j, e] } return this.element.decode(c, b, this.id) }, c.Message.Field = p, r = function (a, b, c, d, e, f, g) { p.call(this, a, b, c, null, d, e, f, g), this.extension; }, r.prototype = Object.create(p.prototype), c.Message.ExtensionField = r, s = function (a, b, c) { d.call(this, a, b, c), this.fields = []; }, c.Message.OneOf = s, t = function (a, b, c, d, e) { g.call(this, a, b, c, d, e), this.className = 'Enum', this.object = null; }, t.getName = function (a, b) { var e; var d; var c = Object.keys(a); for (d = 0; d < c.length; ++d) if (a[e = c[d]] === b) return e; return null }, u = t.prototype = Object.create(g.prototype), u.build = function (b) { var c, d, e, f; if (this.object && !b) return this.object; for (c = new a.Builder.Enum(), d = this.getChildren(t.Value), e = 0, f = d.length; f > e; ++e)c[d[e].name] = d[e].id; return Object.defineProperty && Object.defineProperty(c, '$options', { value: this.buildOpt(), enumerable: !1 }), this.object = c }, c.Enum = t, v = function (a, b, c, e) { d.call(this, a, b, c), this.className = 'Enum.Value', this.id = e; }, v.prototype = Object.create(d.prototype), c.Enum.Value = v, w = function (a, b, c, e) { d.call(this, a, b, c), this.field = e; }, w.prototype = Object.create(d.prototype), c.Extension = w, x = function (a, b, c, d) { g.call(this, a, b, c, d), this.className = 'Service', this.clazz = null; }, y = x.prototype = Object.create(g.prototype), y.build = function (b) { return this.clazz && !b ? this.clazz : this.clazz = (function (a, b) { var g; var c = function (b) { a.Builder.Service.call(this), this.rpcImpl = b || function (a, b, c) { setTimeout(c.bind(this, Error('Not implemented, see: https://github.com/dcodeIO/ProtoBuf.js/wiki/Services')), 0); }; }; var d = c.prototype = Object.create(a.Builder.Service.prototype); var e = b.getChildren(a.Reflect.Service.RPCMethod); for (g = 0; g < e.length; g++)!(function (a) { d[a.name] = function (c, d) { try { try { c = a.resolvedRequestType.clazz.decode(f.wrap(c)); } catch (e) { if (!(e instanceof TypeError)) throw e } if (c === null || typeof c !== 'object') throw Error('Illegal arguments'); c instanceof a.resolvedRequestType.clazz || (c = new a.resolvedRequestType.clazz(c)), this.rpcImpl(a.fqn(), c, function (c, e) { if (c) return d(c), void 0; try { e = a.resolvedResponseType.clazz.decode(e); } catch (f) {} return e && e instanceof a.resolvedResponseType.clazz ? (d(null, e), void 0) : (d(Error('Illegal response type received in service method ' + b.name + '#' + a.name)), void 0) }); } catch (e) { setTimeout(d.bind(this, e), 0); } }, c[a.name] = function (b, d, e) { new c(b)[a.name](d, e); }, Object.defineProperty && (Object.defineProperty(c[a.name], '$options', { value: a.buildOpt() }), Object.defineProperty(d[a.name], '$options', { value: c[a.name].$options })); }(e[g])); return Object.defineProperty && (Object.defineProperty(c, '$options', { value: b.buildOpt() }), Object.defineProperty(d, '$options', { value: c.$options }), Object.defineProperty(c, '$type', { value: b }), Object.defineProperty(d, '$type', { value: b })), c }(a, this)) }, c.Service = x, z = function (a, b, c, e) { d.call(this, a, b, c), this.className = 'Service.Method', this.options = e || {}; }, A = z.prototype = Object.create(d.prototype), A.buildOpt = h.buildOpt, c.Service.Method = z, B = function (a, b, c, d, e, f, g, h) { z.call(this, a, b, c, h), this.className = 'Service.RPCMethod', this.requestName = d, this.responseName = e, this.requestStream = f, this.responseStream = g, this.resolvedRequestType = null, this.resolvedResponseType = null; }, B.prototype = Object.create(z.prototype), c.Service.RPCMethod = B, c }(e)), e.Builder = (function (a, b, c) {
          function f (a) { a.messages && a.messages.forEach(function (b) { b.syntax = a.syntax, f(b); }), a.enums && a.enums.forEach(function (b) { b.syntax = a.syntax; }); } var d = function (a) { this.ns = new c.Namespace(this, null, ''), this.ptr = this.ns, this.resolved = !1, this.result = null, this.files = {}, this.importRoot = null, this.options = a || {}; }; var e = d.prototype; return d.isMessage = function (a) { return typeof a.name !== 'string' ? !1 : typeof a.values !== 'undefined' || typeof a.rpc !== 'undefined' ? !1 : !0 }, d.isMessageField = function (a) { return typeof a.rule !== 'string' || typeof a.name !== 'string' || typeof a.type !== 'string' || typeof a.id === 'undefined' ? !1 : !0 }, d.isEnum = function (a) { return typeof a.name !== 'string' ? !1 : typeof a.values !== 'undefined' && Array.isArray(a.values) && a.values.length !== 0 ? !0 : !1 }, d.isService = function (a) { return typeof a.name === 'string' && typeof a.rpc === 'object' && a.rpc ? !0 : !1 }, d.isExtend = function (a) { return typeof a.ref !== 'string' ? !1 : !0 }, e.reset = function () { return this.ptr = this.ns, this }, e.define = function (a) { if (typeof a !== 'string' || !b.TYPEREF.test(a)) throw Error('illegal namespace: ' + a); return a.split('.').forEach(function (a) { var b = this.ptr.getChild(a); b === null && this.ptr.addChild(b = new c.Namespace(this, this.ptr, a)), this.ptr = b; }, this), this }, e.create = function (b) {
            var e, f, g, h, i; if (!b) return this; if (Array.isArray(b)) { if (b.length === 0) return this; b = b.slice(); } else b = [b]; for (e = [b]; e.length > 0;) {
              if (b = e.pop(), !Array.isArray(b)) throw Error('not a valid namespace: ' + JSON.stringify(b)); for (;b.length > 0;) {
                if (f = b.shift(), d.isMessage(f)) { if (g = new c.Message(this, this.ptr, f.name, f.options, f.isGroup, f.syntax), h = {}, f.oneofs && Object.keys(f.oneofs).forEach(function (a) { g.addChild(h[a] = new c.Message.OneOf(this, g, a)); }, this), f.fields && f.fields.forEach(function (a) { if (g.getChild(0 | a.id) !== null) throw Error('duplicate or invalid field id in ' + g.name + ': ' + a.id); if (a.options && typeof a.options !== 'object') throw Error('illegal field options in ' + g.name + '#' + a.name); var b = null; if (typeof a.oneof === 'string' && !(b = h[a.oneof])) throw Error('illegal oneof in ' + g.name + '#' + a.name + ': ' + a.oneof); a = new c.Message.Field(this, g, a.rule, a.keytype, a.type, a.name, a.id, a.options, b, f.syntax), b && b.fields.push(a), g.addChild(a); }, this), i = [], f.enums && f.enums.forEach(function (a) { i.push(a); }), f.messages && f.messages.forEach(function (a) { i.push(a); }), f.services && f.services.forEach(function (a) { i.push(a); }), f.extensions && (g.extensions = typeof f.extensions[0] === 'number' ? [f.extensions] : f.extensions), this.ptr.addChild(g), i.length > 0) { e.push(b), b = i, i = null, this.ptr = g, g = null; continue }i = null; } else if (d.isEnum(f))g = new c.Enum(this, this.ptr, f.name, f.options, f.syntax), f.values.forEach(function (a) { g.addChild(new c.Enum.Value(this, g, a.name, a.id)); }, this), this.ptr.addChild(g); else if (d.isService(f))g = new c.Service(this, this.ptr, f.name, f.options), Object.keys(f.rpc).forEach(function (a) { var b = f.rpc[a]; g.addChild(new c.Service.RPCMethod(this, g, a, b.request, b.response, !!b.request_stream, !!b.response_stream, b.options)); }, this), this.ptr.addChild(g); else {
                  if (!d.isExtend(f)) throw Error('not a valid definition: ' + JSON.stringify(f)); if (g = this.ptr.resolve(f.ref, !0)) {
                    f.fields.forEach(function (b) {
                      var d, e, f, h; if (g.getChild(0 | b.id) !== null) throw Error('duplicate extended field id in ' + g.name + ': ' + b.id)
                      if (g.extensions && (d = !1, g.extensions.forEach(function (a) { b.id >= a[0] && b.id <= a[1] && (d = !0); }), !d)) throw Error('illegal extended field id in ' + g.name + ': ' + b.id + ' (not within valid ranges)'); e = b.name, this.options.convertFieldsToCamelCase && (e = a.Util.toCamelCase(e)), f = new c.Message.ExtensionField(this, g, b.rule, b.type, this.ptr.fqn() + '.' + e, b.id, b.options), h = new c.Extension(this, this.ptr, b.name, f), f.extension = h, this.ptr.addChild(h), g.addChild(f);
                    }, this);
                  } else if (!/\.?google\.protobuf\./.test(f.ref)) throw Error('extended message ' + f.ref + ' is not defined')
                }f = null, g = null;
              }b = null, this.ptr = this.ptr.parent;
            } return this.resolved = !1, this.result = null, this
          }, e.import = function (b, c) { var e; var g; var h; var i; var j; var k; var l; var m; var d = '/'; if (typeof c === 'string') { if (a.Util.IS_NODE, this.files[c] === !0) return this.reset(); this.files[c] = !0; } else if (typeof c === 'object') { if (e = c.root, a.Util.IS_NODE, (e.indexOf('\\') >= 0 || c.file.indexOf('\\') >= 0) && (d = '\\'), g = e + d + c.file, this.files[g] === !0) return this.reset(); this.files[g] = !0; } if (b.imports && b.imports.length > 0) { for (i = !1, typeof c === 'object' ? (this.importRoot = c.root, i = !0, h = this.importRoot, c = c.file, (h.indexOf('\\') >= 0 || c.indexOf('\\') >= 0) && (d = '\\')) : typeof c === 'string' ? this.importRoot ? h = this.importRoot : c.indexOf('/') >= 0 ? (h = c.replace(/\/[^\/]*$/, ''), h === '' && (h = '/')) : c.indexOf('\\') >= 0 ? (h = c.replace(/\\[^\\]*$/, ''), d = '\\') : h = '.' : h = null, j = 0; j < b.imports.length; j++) if (typeof b.imports[j] === 'string') { if (!h) throw Error('cannot determine import root'); if (k = b.imports[j], k === 'google/protobuf/descriptor.proto') continue; if (k = h + d + k, this.files[k] === !0) continue; if (/\.proto$/i.test(k) && !a.DotProto && (k = k.replace(/\.proto$/, '.json')), l = a.Util.fetch(k), l === null) throw Error("failed to import '" + k + "' in '" + c + "': file not found"); /\.json$/i.test(k) ? this.import(JSON.parse(l + ''), k) : this.import(a.DotProto.Parser.parse(l), k); } else c ? /\.(\w+)$/.test(c) ? this.import(b.imports[j], c.replace(/^(.+)\.(\w+)$/, function (a, b, c) { return b + '_import' + j + '.' + c })) : this.import(b.imports[j], c + '_import' + j) : this.import(b.imports[j]); i && (this.importRoot = null); } return b.package && this.define(b.package), b.syntax && f(b), m = this.ptr, b.options && Object.keys(b.options).forEach(function (a) { m.options[a] = b.options[a]; }), b.messages && (this.create(b.messages), this.ptr = m), b.enums && (this.create(b.enums), this.ptr = m), b.services && (this.create(b.services), this.ptr = m), b.extends && this.create(b.extends), this.reset() }, e.resolveAll = function () { var d; if (this.ptr == null || typeof this.ptr.type === 'object') return this; if (this.ptr instanceof c.Namespace) this.ptr.children.forEach(function (a) { this.ptr = a, this.resolveAll(); }, this); else if (this.ptr instanceof c.Message.Field) { if (b.TYPE.test(this.ptr.type)) this.ptr.type = a.TYPES[this.ptr.type]; else { if (!b.TYPEREF.test(this.ptr.type)) throw Error('illegal type reference in ' + this.ptr.toString(!0) + ': ' + this.ptr.type); if (d = (this.ptr instanceof c.Message.ExtensionField ? this.ptr.extension.parent : this.ptr.parent).resolve(this.ptr.type, !0), !d) throw Error('unresolvable type reference in ' + this.ptr.toString(!0) + ': ' + this.ptr.type); if (this.ptr.resolvedType = d, d instanceof c.Enum) { if (this.ptr.type = a.TYPES.enum, this.ptr.syntax === 'proto3' && d.syntax !== 'proto3') throw Error('proto3 message cannot reference proto2 enum') } else { if (!(d instanceof c.Message)) throw Error('illegal type reference in ' + this.ptr.toString(!0) + ': ' + this.ptr.type); this.ptr.type = d.isGroup ? a.TYPES.group : a.TYPES.message; } } if (this.ptr.map) { if (!b.TYPE.test(this.ptr.keyType)) throw Error('illegal key type for map field in ' + this.ptr.toString(!0) + ': ' + this.ptr.keyType); this.ptr.keyType = a.TYPES[this.ptr.keyType]; } } else if (this.ptr instanceof a.Reflect.Service.Method) { if (!(this.ptr instanceof a.Reflect.Service.RPCMethod)) throw Error('illegal service type in ' + this.ptr.toString(!0)); if (d = this.ptr.parent.resolve(this.ptr.requestName, !0), !(d && d instanceof a.Reflect.Message)) throw Error('Illegal type reference in ' + this.ptr.toString(!0) + ': ' + this.ptr.requestName); if (this.ptr.resolvedRequestType = d, d = this.ptr.parent.resolve(this.ptr.responseName, !0), !(d && d instanceof a.Reflect.Message)) throw Error('Illegal type reference in ' + this.ptr.toString(!0) + ': ' + this.ptr.responseName); this.ptr.resolvedResponseType = d; } else if (!(this.ptr instanceof a.Reflect.Message.OneOf || this.ptr instanceof a.Reflect.Extension || this.ptr instanceof a.Reflect.Enum.Value)) throw Error('illegal object in namespace: ' + typeof this.ptr + ': ' + this.ptr); return this.reset() }, e.build = function (a) { var b, c, d; if (this.reset(), this.resolved || (this.resolveAll(), this.resolved = !0, this.result = null), this.result === null && (this.result = this.ns.build()), !a) return this.result; for (b = typeof a === 'string' ? a.split('.') : a, c = this.result, d = 0; d < b.length; d++) { if (!c[b[d]]) { c = null; break }c = c[b[d]]; } return c }, e.lookup = function (a, b) { return a ? this.ns.resolve(a, b) : this.ns }, e.toString = function () { return 'Builder' }, d.Message = function () {}, d.Enum = function () {}, d.Service = function () {}, d
        }(e, e.Lang, e.Reflect)), e.Map = (function (a, b) { function e (a) { var b = 0; return { next: function () { return b < a.length ? { done: !1, value: a[b++] } : { done: !0 } } } } var c = function (a, c) { var d, e, f, g; if (!a.map) throw Error('field is not a map'); if (this.field = a, this.keyElem = new b.Element(a.keyType, null, !0, a.syntax), this.valueElem = new b.Element(a.type, a.resolvedType, !1, a.syntax), this.map = {}, Object.defineProperty(this, 'size', { get: function () { return Object.keys(this.map).length } }), c) for (d = Object.keys(c), e = 0; e < d.length; e++)f = this.keyElem.valueFromString(d[e]), g = this.valueElem.verifyValue(c[d[e]]), this.map[this.keyElem.valueToString(f)] = { key: f, value: g }; }; var d = c.prototype; return d.clear = function () { this.map = {}; }, d.delete = function (a) { var b = this.keyElem.valueToString(this.keyElem.verifyValue(a)); var c = b in this.map; return delete this.map[b], c }, d.entries = function () { var d; var c; var a = []; var b = Object.keys(this.map); for (c = 0; c < b.length; c++)a.push([(d = this.map[b[c]]).key, d.value]); return e(a) }, d.keys = function () { var c; var a = []; var b = Object.keys(this.map); for (c = 0; c < b.length; c++)a.push(this.map[b[c]].key); return e(a) }, d.values = function () { var c; var a = []; var b = Object.keys(this.map); for (c = 0; c < b.length; c++)a.push(this.map[b[c]].value); return e(a) }, d.forEach = function (a, b) { var e; var d; var c = Object.keys(this.map); for (d = 0; d < c.length; d++)a.call(b, (e = this.map[c[d]]).value, e.key, this); }, d.set = function (a, b) { var c = this.keyElem.verifyValue(a); var d = this.valueElem.verifyValue(b); return this.map[this.keyElem.valueToString(c)] = { key: c, value: d }, this }, d.get = function (a) { var b = this.keyElem.valueToString(this.keyElem.verifyValue(a)); return b in this.map ? this.map[b].value : void 0 }, d.has = function (a) { var b = this.keyElem.valueToString(this.keyElem.verifyValue(a)); return b in this.map }, c }(e, e.Reflect)), e.loadProto = function (a, b, c) { return (typeof b === 'string' || b && typeof b.file === 'string' && typeof b.root === 'string') && (c = b, b = void 0), e.loadJson(e.DotProto.Parser.parse(a), b, c) }, e.protoFromString = e.loadProto, e.loadProtoFile = function (a, b, c) { if (b && typeof b === 'object' ? (c = b, b = null) : b && typeof b === 'function' || (b = null), b) return e.Util.fetch(typeof a === 'string' ? a : a.root + '/' + a.file, function (d) { if (d === null) return b(Error('Failed to fetch file')), void 0; try { b(null, e.loadProto(d, c, a)); } catch (f) { b(f); } }); var d = e.Util.fetch(typeof a === 'object' ? a.root + '/' + a.file : a); return d === null ? null : e.loadProto(d, c, a) }, e.protoFromFile = e.loadProtoFile, e.newBuilder = function (a) { return a = a || {}, typeof a.convertFieldsToCamelCase === 'undefined' && (a.convertFieldsToCamelCase = e.convertFieldsToCamelCase), typeof a.populateAccessors === 'undefined' && (a.populateAccessors = e.populateAccessors), new e.Builder(a) }, e.loadJson = function (a, b, c) { return (typeof b === 'string' || b && typeof b.file === 'string' && typeof b.root === 'string') && (c = b, b = null), b && typeof b === 'object' || (b = e.newBuilder()), typeof a === 'string' && (a = JSON.parse(a)), b.import(a, c), b.resolveAll(), b }, e.loadJsonFile = function (a, b, c) { if (b && typeof b === 'object' ? (c = b, b = null) : b && typeof b === 'function' || (b = null), b) return e.Util.fetch(typeof a === 'string' ? a : a.root + '/' + a.file, function (d) { if (d === null) return b(Error('Failed to fetch file')), void 0; try { b(null, e.loadJson(JSON.parse(d), c, a)); } catch (f) { b(f); } }); var d = e.Util.fetch(typeof a === 'object' ? a.root + '/' + a.file : a); return d === null ? null : e.loadJson(JSON.parse(d), c, a) }, h = a, e.loadProto(h, void 0, '').build('Modules').probuf
      }(d, c)); return e
    }

    const Codec$1 = protobuf(SSMsg$1);
    Codec$1.getModule = (pbName) => {
        const modules = new Codec$1[pbName]();
        modules.getArrayData = () => {
            let data = modules.toArrayBuffer();
            data = isArrayBuffer(data) ? [].slice.call(new Int8Array(data)) : data;
            return data;
        };
        return modules;
    };

    /**
     * 群组 @ 类型
    */
    var MentionedType;
    (function (MentionedType) {
        /**
         * 所有人
        */
        MentionedType[MentionedType["ALL"] = 1] = "ALL";
        /**
         * 部分人
        */
        MentionedType[MentionedType["SINGAL"] = 2] = "SINGAL";
    })(MentionedType || (MentionedType = {}));
    var MentionedType$1 = MentionedType;

    /**
     * 内置消息类型
     */
    var MessageType;
    (function (MessageType) {
        /**
         * 文字消息
        */
        MessageType["TextMessage"] = "RC:TxtMsg";
        /**
         * 语音消息
        */
        MessageType["VOICE"] = "RC:VcMsg";
        /**
         * 高质量消息
        */
        MessageType["HQ_VOICE"] = "RC:HQVCMsg";
        /**
         * 图片消息
        */
        MessageType["IMAGE"] = "RC:ImgMsg";
        /**
         * GIF 消息
        */
        MessageType["GIF"] = "RC:GIFMsg";
        /**
         * 图文消息
        */
        MessageType["RICH_CONTENT"] = "RC:ImgTextMsg";
        /**
         * 位置消息
        */
        MessageType["LOCATION"] = "RC:LBSMsg";
        /**
         * 文件消息
        */
        MessageType["FILE"] = "RC:FileMsg";
        /**
         * 小视频消息
        */
        MessageType["SIGHT"] = "RC:SightMsg";
        /**
         * 合并转发消息
        */
        MessageType["COMBINE"] = "RC:CombineMsg";
        /**
         * 聊天室 KV 通知消息
        */
        MessageType["CHRM_KV_NOTIFY"] = "RC:chrmKVNotiMsg";
        /**
         * 日志通知消息
        */
        MessageType["LOG_COMMAND"] = "RC:LogCmdMsg";
        /**
         * 消息扩展
        */
        MessageType["EXPANSION_NOTIFY"] = "RC:MsgExMsg";
        /**
         * 引用消息
        */
        MessageType["REFERENCE"] = "RC:ReferenceMsg";
        /**
         * 撤回消息
        */
        MessageType["RECALL"] = "RC:RcCmd";
        /**
         * 已读同步状态消息
        */
        MessageType["READ_RECEIPT"] = "RC:ReadNtf";
        /**
         * 群已读请求回执消息
        */
        MessageType["READ_RECEIPT_REQUEST"] = "RC:RRReqMsg";
        /**
         * 群已读响应回执消息
        */
        MessageType["READ_RECEIPT_RESPONSE"] = "RC:RRRspMsg";
        /**
         * TODO
        */
        MessageType["SYNC_READ_STATUS"] = "RC:SRSMsg";
    })(MessageType || (MessageType = {}));
    var MessageType$1 = MessageType;

    var NotificationStatus;
    (function (NotificationStatus) {
        /**
         * 免打扰已开启
        */
        NotificationStatus[NotificationStatus["OPEN"] = 1] = "OPEN";
        /**
         * 免打扰已关闭
        */
        NotificationStatus[NotificationStatus["CLOSE"] = 2] = "CLOSE";
    })(NotificationStatus || (NotificationStatus = {}));
    var NotificationStatus$1 = NotificationStatus;

    const PublishTopic = {
        // 以下为发送消息操作, 本端发送、其他端同步都为以下值
        PRIVATE: 'ppMsgP',
        GROUP: 'pgMsgP',
        CHATROOM: 'chatMsg',
        CUSTOMER_SERVICE: 'pcMsgP',
        RECALL: 'recallMsg',
        // RTC 消息
        RTC_MSG: 'prMsgS',
        // 以下为服务端通知操作
        NOTIFY_PULL_MSG: 's_ntf',
        RECEIVE_MSG: 's_msg',
        SYNC_STATUS: 's_stat',
        SERVER_NOTIFY: 's_cmd',
        SETTING_NOTIFY: 's_us' // 服务端配置变更通知
    };
    // 状态消息
    const PublishStatusTopic = {
        PRIVATE: 'ppMsgS',
        GROUP: 'pgMsgS',
        CHATROOM: 'chatMsgS'
    };
    const QueryTopic = {
        GET_SYNC_TIME: 'qrySessionsAtt',
        PULL_MSG: 'pullMsg',
        GET_CONVERSATION_LIST: 'qrySessions',
        REMOVE_CONVERSATION_LIST: 'delSessions',
        DELETE_MESSAGES: 'delMsg',
        CLEAR_UNREAD_COUNT: 'updRRTime',
        PULL_USER_SETTING: 'pullUS',
        PULL_CHRM_MSG: 'chrmPull',
        JOIN_CHATROOM: 'joinChrm',
        JOIN_EXIST_CHATROOM: 'joinChrmR',
        QUIT_CHATROOM: 'exitChrm',
        GET_CHATROOM_INFO: 'queryChrmI',
        UPDATE_CHATROOM_KV: 'setKV',
        DELETE_CHATROOM_KV: 'delKV',
        PULL_CHATROOM_KV: 'pullKV',
        GET_OLD_CONVERSATION_LIST: 'qryRelationR',
        REMOVE_OLD_CONVERSATION: 'delRelation',
        GET_CONVERSATION_STATUS: 'pullSeAtts',
        SET_CONVERSATION_STATUS: 'setSeAtt',
        GET_UPLOAD_FILE_TOKEN: 'qnTkn',
        GET_UPLOAD_FILE_URL: 'qnUrl',
        CLEAR_MESSAGES: {
            PRIVATE: 'cleanPMsg',
            GROUP: 'cleanGMsg',
            CUSTOMER_SERVICE: 'cleanCMsg',
            SYSTEM: 'cleanSMsg'
        },
        // 以下为 RTC 操作
        JOIN_RTC_ROOM: 'rtcRJoin_data',
        QUIT_RTC_ROOM: 'rtcRExit',
        PING_RTC: 'rtcPing',
        SET_RTC_DATA: 'rtcSetData',
        USER_SET_RTC_DATA: 'userSetData',
        GET_RTC_DATA: 'rtcQryData',
        DEL_RTC_DATA: 'rtcDelData',
        SET_RTC_OUT_DATA: 'rtcSetOutData',
        GET_RTC_OUT_DATA: 'rtcQryUserOutData',
        GET_RTC_TOKEN: 'rtcToken',
        SET_RTC_STATE: 'rtcUserState',
        GET_RTC_ROOM_INFO: 'rtcRInfo',
        GET_RTC_USER_INFO_LIST: 'rtcUData',
        SET_RTC_USER_INFO: 'rtcUPut',
        DEL_RTC_USER_INFO: 'rtcUDel',
        GET_RTC_USER_LIST: 'rtcUList'
    };
    const QueryHistoryTopic = {
        PRIVATE: 'qryPMsg',
        GROUP: 'qryGMsg',
        CHATROOM: 'qryCHMsg',
        CUSTOMER_SERVICE: 'qryCMsg',
        SYSTEM: 'qrySMsg'
    };
    const PublishTopicToConversationType = {
        [PublishTopic.PRIVATE]: ConversationType$1.PRIVATE,
        [PublishTopic.GROUP]: ConversationType$1.GROUP,
        [PublishTopic.CHATROOM]: ConversationType$1.CHATROOM,
        [PublishTopic.CUSTOMER_SERVICE]: ConversationType$1.CUSTOMER_SERVICE
    };
    const ConversationTypeToQueryHistoryTopic = {
        [ConversationType$1.PRIVATE]: QueryHistoryTopic.PRIVATE,
        [ConversationType$1.GROUP]: QueryHistoryTopic.GROUP,
        [ConversationType$1.CHATROOM]: QueryHistoryTopic.CHATROOM,
        [ConversationType$1.CUSTOMER_SERVICE]: QueryHistoryTopic.CUSTOMER_SERVICE,
        [ConversationType$1.SYSTEM]: QueryHistoryTopic.SYSTEM
    };
    const ConversationTypeToClearMessageTopic = {
        [ConversationType$1.PRIVATE]: QueryTopic.CLEAR_MESSAGES.PRIVATE,
        [ConversationType$1.GROUP]: QueryTopic.CLEAR_MESSAGES.GROUP,
        [ConversationType$1.CUSTOMER_SERVICE]: QueryTopic.CLEAR_MESSAGES.CUSTOMER_SERVICE,
        [ConversationType$1.SYSTEM]: QueryTopic.CLEAR_MESSAGES.SYSTEM
    };
    const ConversationStatusConfig = {
        ENABLED: '1',
        DISABLED: '0'
    };
    const ConversationStatusType = {
        DO_NOT_DISTURB: 1,
        TOP: 2,
        TAGS: 3 // 标签列表
    };

    var MessageDirection;
    (function (MessageDirection) {
        /**
         * 己方发送消息
         */
        MessageDirection[MessageDirection["SEND"] = 1] = "SEND";
        /**
         * 己方接收消息
         */
        MessageDirection[MessageDirection["RECEIVE"] = 2] = "RECEIVE";
    })(MessageDirection || (MessageDirection = {}));
    var MessageDirection$1 = MessageDirection;

    /**
     * 序列化、反序列化数据通道
    */
    class DataCodec {
        constructor(connectType) {
            this._codec = connectType === 'websocket' ? Codec$1 : Codec;
            this._connectType = connectType;
        }
        /**
         * PB 数据 转为 rmtp 数据 反序列化 通用数据
         * 根据解析的 PBName 分配解码方法. 如果没有单独的解码方法定义. 直接返回 pb 解析后的结果
        */
        decodeByPBName(data, pbName, option) {
            const self = this;
            const formatEventMap = {
                [PBName.DownStreamMessages]: self._formatSyncMessages,
                [PBName.DownStreamMessage]: self._formatReceivedMessage,
                [PBName.UpStreamMessage]: self._formatSentMessage,
                [PBName.HistoryMsgOuput]: self._formatHistoryMessages,
                [PBName.RelationsOutput]: self._formatConversationList,
                [PBName.QueryChatRoomInfoOutput]: self._formatChatRoomInfos,
                [PBName.RtcUserListOutput]: self._formatRTCUserList,
                [PBName.RtcQryOutput]: self._formatRTCData,
                [PBName.ChrmKVOutput]: self._formatChatRoomKVList,
                [PBName.PullUserSettingOutput]: self._formatUserSetting,
                [PBName.SessionStates]: self._formatConversationStatus,
                [PBName.SetUserSettingOutput]: self._formatSetUserSettingOutput,
                [PBName.UserSettingNotification]: self._formatUserSettingNotification
            };
            let decodedData = data;
            const formatEvent = formatEventMap[pbName];
            try {
                const hasData = data.length > 0; // 判断是否有数据, 防止无数据 pb 解析报错
                decodedData = hasData && self._codec[pbName].decode(data); // pb 解析
                if (isObject(decodedData)) {
                    decodedData = batchInt64ToTimestamp(decodedData); // 时间转化
                }
                if (isFunction(formatEvent)) {
                    decodedData = formatEvent.call(this, decodedData, option); // 数据格式化
                }
            }
            catch (e) {
                logger.error('PB parse error\n', e);
            }
            return decodedData;
        }
        _readBytes(content) {
            const { offset, buffer, limit } = content;
            if (offset) {
                try {
                    const content = isArrayBuffer(buffer) ? new Uint8Array(buffer) : buffer;
                    // content = utils.ArrayBufferToUint8Array(buffer).subarray(offset, limit)
                    return BinaryHelper.readUTF(content.subarray(offset, limit));
                }
                catch (e) {
                    logger.info('readBytes error\n', e);
                }
            }
            return content;
        }
        /**
         * ====== 以下为 rmtp 数据 反序列化为 可用数据 ======
         */
        _formatBytes(content) {
            // 1. socket 下, content.buffer 为二进制 ArrayBuffer, 需调用 ArrayBufferToUint8Array 转换
            // 2. comet 下, content 为 JSON 字符串. socket、comet 解析后都需要 JSON to Object
            let formatRes = this._readBytes(content);
            try {
                formatRes = JSON.parse(formatRes);
            }
            catch (e) {
                logger.info('formatBytes error\n', e);
            }
            return formatRes || content;
        }
        /**
         * 格式化多端同步消息
        */
        _formatSyncMessages(data, option) {
            option = option || {};
            const self = this;
            const { list, syncTime, finished } = data;
            // Comet 与 聊天室没有 finished 字段定义，默认为 true
            if (isUndefined(finished) || finished === null) {
                data.finished = true;
            }
            data.syncTime = int64ToTimestamp(syncTime);
            data.list = map(list, (msgData) => {
                const message = self._formatReceivedMessage(msgData, option);
                return message;
            });
            return data;
        }
        /**
         * 格式化接收消息
        */
        _formatReceivedMessage(data, option) {
            // TODO: 需杜绝此类传参，参数在进入方法前进行类型值确认
            option = option || {};
            const self = this;
            const { currentUserId, connectedTime } = option;
            const { content, fromUserId, type, groupId, status, dataTime, classname: messageType, msgId: messageUId, extraContent, pushContent, pushExt, configFlag } = data;
            const direction = data.direction || MessageDirection$1.RECEIVE; // null || 0 都为收件箱
            const isSelfSend = direction === MessageDirection$1.SEND;
            const { isPersited, isCounted, isMentioned, disableNotification, receivedStatus, canIncludeExpansion } = getMessageOptionByStatus(status);
            const targetId = type === ConversationType$1.GROUP || type === ConversationType$1.CHATROOM ? groupId : fromUserId;
            const senderUserId = isSelfSend ? currentUserId : fromUserId;
            const sentTime = int64ToTimestamp(dataTime);
            const isOffLineMessage = sentTime < connectedTime;
            const isChatRoomMsg = type === ConversationType$1.CHATROOM;
            const utfContent = self._formatBytes(content);
            let messageDirection = isSelfSend ? MessageDirection$1.SEND : MessageDirection$1.RECEIVE;
            // 聊天室拉消息时, 自己发送的消息, direction 也为 null
            if (isChatRoomMsg && (fromUserId === currentUserId)) {
                messageDirection = MessageDirection$1.SEND;
            }
            let expansion;
            if (extraContent) {
                expansion = {};
                expansion = formatExtraContent(extraContent);
            }
            return {
                conversationType: type,
                targetId,
                senderUserId,
                messageType,
                messageUId,
                isPersited,
                isCounted,
                isMentioned,
                sentTime,
                isOffLineMessage,
                messageDirection,
                receivedTime: DelayTimer.getTime(),
                disableNotification,
                receivedStatus,
                canIncludeExpansion,
                content: utfContent,
                expansion,
                pushContent,
                pushExt,
                configFlag
            };
        }
        /**
         * 格式化发送消息
        */
        _formatSentMessage(data, option) {
            const self = this;
            const { content, classname: messageType, sessionId, msgId: messageUId, extraContent } = data;
            const { signal, currentUserId } = option;
            const { date, topic, targetId } = signal;
            const { isPersited, isCounted, disableNotification, canIncludeExpansion } = getUpMessageOptionBySessionId(sessionId);
            const type = PublishTopicToConversationType[topic] || ConversationType$1.PRIVATE;
            const isStatusMessage = isInObject(PublishStatusTopic, topic);
            let expansion;
            if (extraContent) {
                expansion = {};
                expansion = formatExtraContent(extraContent);
            }
            return {
                conversationType: type,
                targetId,
                messageType,
                messageUId,
                isPersited,
                isCounted,
                isStatusMessage,
                senderUserId: currentUserId,
                content: self._formatBytes(content),
                sentTime: date * 1000,
                receivedTime: DelayTimer.getTime(),
                messageDirection: MessageDirection$1.SEND,
                isOffLineMessage: false,
                disableNotification,
                canIncludeExpansion,
                expansion // 消息携带的 KV 字段
            };
        }
        /**
         * 格式化历史消息
        */
        _formatHistoryMessages(data, option) {
            const conversation = option.conversation || {};
            const { list: msgList, hasMsg } = data;
            const targetId = conversation.targetId;
            const syncTime = int64ToTimestamp(data.syncTime);
            const list = [];
            forEach(msgList, (msgData) => {
                const msg = this._formatReceivedMessage(msgData, option);
                msg.targetId = targetId;
                list.push(msg);
            }, {
                isReverse: true
            });
            return { syncTime, list, hasMore: !!hasMsg };
        }
        /**
         * 格式化会话列表
        */
        _formatConversationList(serverData, option) {
            const self = this;
            let { info: conversationList } = serverData;
            const afterDecode = option.afterDecode || function () { };
            conversationList = map(conversationList, (serverConversation) => {
                const { msg, userId, type, unreadCount } = serverConversation;
                const latestMessage = self._formatReceivedMessage(msg, option);
                latestMessage.targetId = userId;
                const conversation = {
                    targetId: userId,
                    conversationType: type,
                    unreadMessageCount: unreadCount,
                    latestMessage
                };
                return afterDecode(conversation) || conversation;
            });
            return conversationList || [];
        }
        /**
         * 格式化用户设置
        */
        _formatSetUserSettingOutput(serverData) {
            return serverData;
        }
        /**
         * 格式化聊天室信息
        */
        _formatChatRoomInfos(data) {
            const { userTotalNums, userInfos } = data;
            const chrmInfos = map(userInfos, (user) => {
                const { id, time } = user;
                const timestamp = int64ToTimestamp(time);
                return { id, time: timestamp };
            });
            return {
                userCount: userTotalNums,
                userInfos: chrmInfos
            };
        }
        /**
         * 格式化 聊天室 KV 列表
        */
        _formatChatRoomKVList(data) {
            let { entries: kvEntries, bFullUpdate: isFullUpdate, syncTime } = data;
            kvEntries = kvEntries || [];
            kvEntries = map(kvEntries, (kv) => {
                const { key, value, status, timestamp, uid } = kv;
                const { isAutoDelete, isOverwrite, type } = getChatRoomKVByStatus(status);
                return {
                    key,
                    value,
                    isAutoDelete,
                    isOverwrite,
                    type,
                    userId: uid,
                    timestamp: int64ToTimestamp(timestamp)
                };
            });
            return {
                kvEntries, isFullUpdate, syncTime
            };
        }
        /**
         * 格式化 用户设置
        */
        _formatUserSetting(data) {
            const { items, version } = data;
            const settings = {};
            forEach(items || [], (setting) => {
                const { key, version, value } = setting;
                setting.version = int64ToTimestamp(version);
                setting.value = this._readBytes(value);
                if (key === 'Tag') {
                    setting.tags.forEach((tag) => {
                        tag.createdTime = int64ToTimestamp(tag.createdTime);
                        tag.tagName = tag.name;
                    });
                }
                settings[key] = setting;
            });
            return { settings, version };
        }
        /**
         * 格式化 会话状态 置顶、免打扰）
        */
        _formatConversationStatus(data) {
            const { state: stateList } = data;
            const statusList = [];
            forEach(stateList, (session) => {
                const { type, channelId: targetId, time: updatedTime, stateItem } = session;
                let notificationStatus = NotificationStatus$1.CLOSE;
                let isTop = false;
                let tags = [];
                forEach(stateItem, (item) => {
                    const { sessionStateType, value, tags: _tags } = item;
                    switch (sessionStateType) {
                        case ConversationStatusType.DO_NOT_DISTURB:
                            notificationStatus = value === ConversationStatusConfig.ENABLED ? NotificationStatus$1.OPEN : NotificationStatus$1.CLOSE;
                            break;
                        case ConversationStatusType.TOP:
                            isTop = value === ConversationStatusConfig.ENABLED;
                            break;
                        case ConversationStatusType.TAGS:
                            tags = _tags;
                            break;
                    }
                });
                statusList.push({
                    type,
                    targetId,
                    notificationStatus,
                    isTop,
                    updatedTime: int64ToTimestamp(updatedTime),
                    tags
                });
            });
            return statusList;
        }
        /**
         * 格式化 RTC 用户列表
        */
        _formatRTCUserList(rtcInfos) {
            const { list, token, sessionId } = rtcInfos;
            const users = {};
            forEach(list, (item) => {
                const { userId, userData } = item;
                const tmpData = {};
                forEach(userData, (data) => {
                    const { key, value } = data;
                    tmpData[key] = value;
                });
                users[userId] = tmpData;
            });
            return { users, token, sessionId };
        }
        /**
          * 格式化 RTC 数据
        */
        _formatRTCData(data) {
            const { outInfo: list } = data;
            const props = {};
            forEach(list, (item) => {
                props[item.key] = item.value;
            });
            return props;
        }
        /**
          * 格式化 RTC 房间信息
        */
        _formatRTCRoomInfo(data) {
            const { roomId: id, userCount: total, roomData } = data;
            const room = {
                id, total
            };
            forEach(roomData, (data) => {
                room[data.key] = data.value;
            });
            return room;
        }
        /**
         * 格式化用户配置通知
         */
        _formatUserSettingNotification(data) {
            return data;
        }
        /**
         * ===== 以下为通用数据 序列化为 PB 数据 =====
         * Engine Index 调用处理数据
        */
        /**
         * ? 待补全注释
        */
        encodeServerConfParams() {
            const modules = this._codec.getModule(PBName.SessionsAttQryInput);
            modules.setNothing(1);
            return modules.getArrayData();
        }
        /**
         * 上行消息基础配置
        */
        _getUpMsgModule(conversation, option) {
            const isComet = this._connectType === 'comet';
            const { type } = conversation;
            const { messageType, isMentioned, mentionedType, mentionedUserIdList, content, pushContent, directionalUserIdList, isFilerWhiteBlacklist, isVoipPush, canIncludeExpansion, expansion, pushConfig } = option;
            const isGroupType = type === ConversationType$1.GROUP;
            const modules = this._codec.getModule(PBName.UpStreamMessage);
            const sessionId = getSessionId(option);
            const { pushTitle, pushData, iOSConfig, androidConfig, templateId, disablePushTitle, forceShowDetailContent } = pushConfig || {};
            let flag = 0;
            modules.setSessionId(sessionId);
            if (isGroupType && isMentioned && content) {
                content.mentionedInfo = {
                    userIdList: mentionedUserIdList,
                    type: mentionedType || MentionedType$1.ALL
                };
            }
            pushContent && modules.setPushText(pushContent); // 设置 pushContent
            pushData && modules.setAppData(pushData); // 设置 pushData
            directionalUserIdList && modules.setUserId(directionalUserIdList); // 设置群定向消息人员
            // 设置 flag. 涉及业务: 1、iOS VoipPush  2、过滤黑/白名单
            flag |= (isVoipPush ? 0x01 : 0);
            flag |= (isFilerWhiteBlacklist ? 0x02 : 0);
            flag |= (disablePushTitle ? 0x04 : 0);
            flag |= (forceShowDetailContent ? 0x08 : 0);
            modules.setConfigFlag(flag);
            modules.setClassname(messageType); // 设置 objectName
            modules.setContent(JSON.stringify(content));
            if (canIncludeExpansion && expansion) {
                const extraContent = {};
                forEach(expansion, (val, key) => {
                    extraContent[key] = { v: val };
                });
                modules.setExtraContent(JSON.stringify(extraContent)); // 设置消息扩展内容
            }
            // 设置推送扩展
            if (pushConfig) {
                const pushExtraModule = this._codec.getModule(PBName.PushExtra);
                pushTitle && pushExtraModule.setTitle(pushTitle);
                if (iOSConfig && androidConfig) {
                    const pushConfigStr = pushConfigsToJSON(iOSConfig, androidConfig);
                    pushExtraModule.setPushConfigs(pushConfigStr);
                }
                (androidConfig === null || androidConfig === void 0 ? void 0 : androidConfig.notificationId) && pushExtraModule.setPushId(androidConfig === null || androidConfig === void 0 ? void 0 : androidConfig.notificationId);
                pushExtraModule.setTemplateId(templateId || '');
                modules.setPushExt(isComet ? pushExtraModule.getArrayData() : pushExtraModule);
            }
            return modules;
        }
        /**
         * 序列化上行消息
        */
        encodeUpMsg(conversation, option) {
            const modules = this._getUpMsgModule(conversation, option);
            return modules.getArrayData();
        }
        /**
         * 序列化拉取多端消息
        */
        encodeSyncMsg(syncMsgArgs) {
            const { sendboxTime, inboxTime } = syncMsgArgs;
            const modules = this._codec.getModule(PBName.SyncRequestMsg);
            modules.setIspolling(false);
            modules.setIsPullSend(true);
            modules.setSendBoxSyncTime(sendboxTime);
            modules.setSyncTime(inboxTime);
            return modules.getArrayData();
        }
        /**
         * 序列化拉取聊天室消息
        */
        encodeChrmSyncMsg(time, count) {
            time = time || 0;
            count = count || 0;
            const modules = this._codec.getModule(PBName.ChrmPullMsg);
            modules.setCount(count);
            modules.setSyncTime(time);
            return modules.getArrayData();
        }
        /**
         * 序列化历史消息
        */
        encodeGetHistoryMsg(targetId, option) {
            const { count, order, timestamp } = option;
            const modules = this._codec.getModule(PBName.HistoryMsgInput);
            modules.setTargetId(targetId);
            modules.setTime(timestamp);
            modules.setCount(count);
            modules.setOrder(order);
            return modules.getArrayData();
        }
        /**
         * 序列化会话列表
        */
        encodeGetConversationList(option) {
            option = option || {};
            const { count, startTime } = option;
            const modules = this._codec.getModule(PBName.RelationQryInput);
            // 默认值已在 modules 暴露层赋值. 传入此处, 必有值
            modules.setType(1); // type 可传任意值
            modules.setCount(count);
            modules.setStartTime(startTime);
            return modules.getArrayData();
        }
        /**
         * 旧会话列表. 获取、删除都调用此方法
        */
        encodeOldConversationList(option) {
            option = option || {};
            let { count, type, startTime, order } = option;
            count = count || 0; // 删除会话列表 count 传 0 , setCount 形参 count 为必填参数
            startTime = startTime || 0;
            order = order || 0;
            const modules = this._codec.getModule(PBName.RelationQryInput);
            modules.setType(type);
            modules.setCount(count);
            modules.setStartTime(startTime);
            modules.setOrder(order);
            return modules.getArrayData();
        }
        /**
         * 旧会话列表删除
        */
        encodeRemoveConversationList(conversationList) {
            const modules = this._codec.getModule(PBName.DeleteSessionsInput);
            const sessions = [];
            forEach(conversationList, (conversation) => {
                const { type, targetId } = conversation;
                const session = this._codec.getModule(PBName.SessionInfo);
                session.setType(type);
                session.setChannelId(targetId);
                sessions.push(session);
            });
            modules.setSessions(sessions);
            return modules.getArrayData();
        }
        /**
         * 批量删除消息通过消息 ID
        */
        encodeDeleteMessages(conversationType, targetId, list) {
            const modules = this._codec.getModule(PBName.DeleteMsgInput);
            const encodeMsgs = [];
            forEach(list, (message) => {
                encodeMsgs.push({
                    msgId: message.messageUId,
                    msgDataTime: message.sentTime,
                    direct: message.messageDirection
                });
            });
            modules.setType(conversationType);
            modules.setConversationId(targetId);
            modules.setMsgs(encodeMsgs);
            return modules.getArrayData();
        }
        /**
         * 批量删除消息通过时间
        */
        encodeClearMessages(targetId, timestamp) {
            const modules = this._codec.getModule(PBName.CleanHisMsgInput);
            timestamp = timestamp || new Date().getTime(); // 默认当前时间
            modules.setDataTime(timestamp);
            modules.setTargetId(targetId);
            return modules.getArrayData();
        }
        /**
         * 未读数清除
        */
        encodeClearUnreadCount(conversation, option) {
            const { type, targetId } = conversation;
            let { timestamp } = option;
            const modules = this._codec.getModule(PBName.SessionMsgReadInput);
            timestamp = timestamp || +new Date();
            modules.setType(type);
            modules.setChannelId(targetId);
            modules.setMsgTime(timestamp);
            return modules.getArrayData();
        }
        /**
         * 加入退出聊天室
        */
        encodeJoinOrQuitChatRoom() {
            const modules = this._codec.getModule(PBName.ChrmInput);
            modules.setNothing(1);
            return modules.getArrayData();
        }
        /**
         * 获取聊天室信息
         * @param count 获取人数
         * @param order 排序方式
        */
        encodeGetChatRoomInfo(count, order) {
            const modules = this._codec.getModule(PBName.QueryChatRoomInfoInput);
            modules.setCount(count);
            modules.setOrder(order);
            return modules.getArrayData();
        }
        /**
         * 上传文件认证信息获取
        */
        encodeGetFileToken(fileType, fileName) {
            const modules = this._codec.getModule(PBName.GetQNupTokenInput);
            modules.setType(fileType);
            modules.setKey(fileName);
            return modules.getArrayData();
        }
        /**
          * 获取七牛上传url
        */
        encodeGetFileUrl(inputPBName, fileType, fileName, originName) {
            const modules = this._codec.getModule(inputPBName);
            modules.setType(fileType);
            modules.setKey(fileName);
            if (originName) {
                modules.setFileName(originName);
            }
            return modules.getArrayData();
        }
        /**
          * 聊天室 KV 存储
        */
        encodeModifyChatRoomKV(chrmId, entry, currentUserId) {
            const isComet = this._connectType === 'comet';
            const modules = this._codec.getModule(PBName.SetChrmKV);
            const { key, value, notificationExtra: extra, isSendNotification, type } = entry;
            const action = type || ChatroomEntryType$1.UPDATE;
            const status = getChatRoomKVOptStatus(entry, action);
            const serverEntry = {
                key,
                value: value || '',
                uid: currentUserId
            };
            // 若 status 传空, server 会出问题
            if (!isUndefined(status)) {
                serverEntry.status = status;
            }
            modules.setEntry(serverEntry);
            if (isSendNotification) { // 如果需要发送通知, 设置通知消息
                const conversation = {
                    type: ConversationType$1.CHATROOM,
                    targetId: chrmId
                };
                const msgContent = { key, value, extra, type: action };
                // 通知消息内置, 由 Server 自动发送
                const msgModule = this._getUpMsgModule(conversation, {
                    messageType: MessageType$1.CHRM_KV_NOTIFY,
                    content: msgContent,
                    isPersited: false,
                    isCounted: false
                });
                isComet ? modules.setNotification(msgModule.getArrayData()) : modules.setNotification(msgModule);
                modules.setBNotify(true);
                modules.setType(ConversationType$1.CHATROOM);
            }
            return modules.getArrayData();
        }
        /**
          * KV 存储拉取
        */
        encodePullChatRoomKV(time) {
            const modules = this._codec.getModule(PBName.QueryChrmKV);
            modules.setTimestamp(time);
            return modules.getArrayData();
        }
        /**
          * 用户实时配置更新
        */
        encodePullUserSetting(version) {
            const modules = this._codec.getModule(PBName.PullUserSettingInput);
            modules.setVersion(version);
            return modules.getArrayData();
        }
        /**
          * 获取会话状态 (置顶、免打扰)
        */
        encodeGetConversationStatus(time) {
            const modules = this._codec.getModule(PBName.SessionReq);
            modules.setTime(time);
            return modules.getArrayData();
        }
        /**
          * 设置会话状态 (置顶、免打扰)
        */
        encodeSetConversationStatus(statusList) {
            const isComet = this._connectType === 'comet';
            const modules = this._codec.getModule(PBName.SessionStateModifyReq);
            const currentTime = DelayTimer.getTime();
            const stateModuleList = [];
            forEach(statusList, (status) => {
                const stateModules = this._codec.getModule(PBName.SessionState);
                const { conversationType: type, targetId, notificationStatus, isTop } = status;
                const stateItemModuleList = [];
                stateModules.setType(type);
                stateModules.setChannelId(targetId);
                stateModules.setTime(currentTime);
                const isNotDisturb = notificationStatus === NotificationStatus$1.OPEN;
                const TypeToVal = {};
                if (!isUndefined(notificationStatus)) {
                    TypeToVal[ConversationStatusType.DO_NOT_DISTURB] = isNotDisturb;
                }
                if (!isUndefined(isTop)) {
                    TypeToVal[ConversationStatusType.TOP] = isTop;
                }
                forEach(TypeToVal, (val, type) => {
                    if (!isUndefined(val)) {
                        const stateItemModules = this._codec.getModule(PBName.SessionStateItem);
                        val = val ? ConversationStatusConfig.ENABLED : ConversationStatusConfig.DISABLED;
                        stateItemModules.setSessionStateType(Number(type)); // TODO 暂时写死
                        stateItemModules.setValue(val);
                        const stateItemModulesData = isComet ? stateItemModules.getArrayData() : stateItemModules;
                        stateItemModuleList.push(stateItemModulesData);
                    }
                });
                stateModules.setStateItem(stateItemModuleList);
                const stateModulesData = isComet ? stateModules.getArrayData() : stateModules;
                stateModuleList.push(stateModulesData);
            });
            modules.setVersion(currentTime);
            modules.setState(stateModuleList);
            return modules.getArrayData();
        }
        /**
         * 序列化创建tag消息
         */
        encodeCreateTag(tags) {
            const isComet = this._connectType === 'comet';
            const modules = this._codec.getModule(PBName.SessionTagAddInput);
            const itemListModules = [];
            tags.forEach((tag) => {
                const itemModule = this._codec.getModule(PBName.SessionTagItem);
                itemModule.setTagId(tag.tagId);
                itemModule.setName(tag.tagName);
                itemListModules.push(isComet ? itemModule.getArrayData() : itemModule);
            });
            modules.setTags(itemListModules);
            modules.setVersion(Date.now());
            return modules.getArrayData();
        }
        /**
         * 序列化删除tag消息
         */
        encodeRemoveTag(tagIds) {
            const isComet = this._connectType === 'comet';
            const modules = this._codec.getModule(PBName.SessionTagDelInput);
            const itemListModules = [];
            tagIds.forEach((tagId) => {
                const itemModule = this._codec.getModule(PBName.SessionTagItem);
                itemModule.setTagId(tagId);
                itemListModules.push(isComet ? itemModule.getArrayData() : itemModule);
            });
            modules.setTags(itemListModules);
            modules.setVersion(Date.now());
            return modules.getArrayData();
        }
        /**
         * 解除会话标签关系
         */
        encodeDisConversationTag(tagIds) {
            const modules = this._codec.getModule(PBName.SessionDisTagReq);
            modules.setTagId(tagIds);
            return modules.getArrayData();
        }
        /**
         * 序列化更新会话标签
         */
        encodeUpdateConversationTag(tags, conversations) {
            const isComet = this._connectType === 'comet';
            const modules = this._codec.getModule(PBName.SessionStateModifyReq);
            const sessionStateModule = [];
            conversations.forEach((_conversation) => {
                const SessionState = this._codec.getModule(PBName.SessionState);
                const SessionStateItem = this._codec.getModule(PBName.SessionStateItem);
                const SessionTagItemModules = [];
                tags.forEach((tag) => {
                    const SessionTagItem = this._codec.getModule(PBName.SessionTagItem);
                    SessionTagItem.setTagId(tag.tagId);
                    if (!isUndefined(tag.isTop)) {
                        SessionTagItem.setIsTop(tag.isTop);
                    }
                    SessionTagItemModules.push(isComet ? SessionTagItem.getArrayData() : SessionTagItem);
                });
                SessionStateItem.setSessionStateType(ConversationStatusType.TAGS);
                SessionStateItem.setValue(JSON.stringify(SessionTagItemModules));
                SessionStateItem.setTags(SessionTagItemModules);
                SessionState.setType(_conversation.type);
                SessionState.setChannelId(_conversation.targetId);
                SessionState.setTime(Date.now());
                SessionState.setStateItem([isComet ? SessionStateItem.getArrayData() : SessionStateItem]);
                sessionStateModule.push(isComet ? SessionState.getArrayData() : SessionState);
            });
            modules.setState(sessionStateModule);
            modules.setVersion(Date.now());
            return modules.getArrayData();
        }
        /**
         * ============ 以下为 RTC 相关 ============
         */
        /**
         * 加入 RTC 房间
         */
        encodeJoinRTCRoom(mode, broadcastType) {
            const modules = this._codec.getModule(PBName.RtcInput);
            mode = mode || 0;
            modules.setRoomType(mode);
            isUndefined(broadcastType) || modules.setBroadcastType(broadcastType);
            return modules.getArrayData();
        }
        /**
         * 退出 RTC 房间
        */
        encodeQuitRTCRoom() {
            return this._codec.getModule(PBName.SetUserStatusInput).getArrayData();
        }
        /**
         * 房间数据
        */
        encodeSetRTCData(key, value, isInner, apiType, message) {
            const modules = this._codec.getModule(PBName.RtcSetDataInput);
            modules.setInterior(isInner);
            modules.setTarget(apiType);
            modules.setKey(key);
            modules.setValue(value);
            if (message) {
                message.name && modules.setObjectName(message.name);
                let content = message.content;
                if (content) {
                    if (isObject(content)) {
                        content = JSON.stringify(content);
                    }
                    modules.setContent(content);
                }
            }
            return modules.getArrayData();
        }
        /**
         * 全量 URI
        */
        encodeUserSetRTCData(message, valueInfo, objectName) {
            const modules = this._codec.getModule(PBName.RtcUserSetDataInput);
            // 全量 URI 新增
            // 全量发布中
            // valueInfo: key 为 uris，值为 全量的订阅信息
            // content: key 为增量数据消息 RCRTC:ModifyResource，value 为增量订阅信息
            modules.setObjectName(objectName);
            // content
            let val = this._codec.getModule(PBName.RtcValueInfo);
            val.setKey(message.name);
            val.setValue(message.content);
            modules.setContent(val);
            // valueInfo
            val = this._codec.getModule(PBName.RtcValueInfo);
            val.setKey('uris');
            val.setValue(valueInfo);
            modules.setValueInfo(val);
            return modules.getArrayData();
        }
        /**
         * 待完善注释
        */
        encodeGetRTCData(keys, isInner, apiType) {
            const modules = this._codec.getModule(PBName.RtcDataInput);
            modules.setInterior(isInner);
            modules.setTarget(apiType);
            modules.setKey(keys);
            return modules.getArrayData();
        }
        /**
         * 待完善注释
        */
        encodeRemoveRTCData(keys, isInner, apiType, message) {
            const modules = this._codec.getModule(PBName.RtcDataInput);
            modules.setInterior(isInner);
            modules.setTarget(apiType);
            modules.setKey(keys);
            message = message || {};
            let { name, content } = message;
            !isUndefined(name) && modules.setObjectName(name);
            if (!isUndefined(content)) {
                if (isObject(content)) {
                    content = JSON.stringify(content);
                }
                modules.setContent(content);
            }
            return modules.getArrayData();
        }
        /**
         * 待完善注释
        */
        encodeSetRTCOutData(data, type, message) {
            const modules = this._codec.getModule(PBName.RtcSetOutDataInput);
            modules.setTarget(type);
            if (!isArray(data)) {
                data = [data];
            }
            forEach(data, (item, index) => {
                item.key = item.key ? item.key.toString() : item.key;
                item.value = item.value ? item.value.toString() : item.value;
                data[index] = item;
            });
            modules.setValueInfo(data);
            message = message || {};
            let { name, content } = message;
            !isUndefined(name) && modules.setObjectName(name);
            if (!isUndefined(content)) {
                if (isObject(content)) {
                    content = JSON.stringify(content);
                }
                modules.setContent(content);
            }
            return modules.getArrayData();
        }
        /**
         * 待完善注释
        */
        ecnodeGetRTCOutData(userIds) {
            const modules = this._codec.getModule(PBName.RtcQryUserOutDataInput);
            modules.setUserId(userIds);
            return modules.getArrayData();
        }
        encodeSetRTCState(report) {
            const modules = this._codec.getModule(PBName.MCFollowInput);
            modules.setId(report);
            return modules.getArrayData();
        }
        /**
         * 待完善注释
        */
        encodeGetRTCRoomInfo() {
            const modules = this._codec.getModule(PBName.RtcQueryListInput);
            modules.setOrder(2);
            return modules.getArrayData();
        }
        /**
         * 待完善注释
        */
        encodeSetRTCUserInfo(key, value) {
            const modules = this._codec.getModule(PBName.RtcValueInfo);
            modules.setKey(key);
            modules.setValue(value);
            return modules.getArrayData();
        }
        /**
         * 待完善注释
        */
        encodeRemoveRTCUserInfo(keys) {
            const modules = this._codec.getModule(PBName.RtcKeyDeleteInput);
            modules.setKey(keys);
            return modules.getArrayData();
        }
    }

    /**
     * 数据通道接口，为 long-polling 与 websocket 提供公共抽象
     */
    class ADataChannel {
        constructor(type, _watcher) {
            this._watcher = _watcher;
            this.codec = new DataCodec(type);
        }
    }

    const getIdentifier = (messageId, identifier) => {
        if (messageId && identifier) {
            return identifier + '_' + messageId;
        }
        else if (messageId) {
            return messageId;
        }
        else {
            return Date.now(); // 若无 messageId、identifer, 直接返回时间戳, 避免返回空造成唯一标识重复
        }
    };
    /**
     * @description
     * 与 Server 交互的信令封装
    */
    /**
     * @description
     * 读数据处理基类
    */
    class BaseReader {
        constructor(header) {
            this.header = header;
            this._name = null;
            this.lengthSize = 0;
            this.messageId = 0;
            this.timestamp = 0;
            this.syncMsg = false;
            this.identifier = ''; // string + messageId 作为唯一标识, 目前用处: 方便 Pub、Query 回执定位对应 Promise, 且增加前缀避免 Pub、Query 回执错乱
        }
        getIdentifier() {
            const { messageId, identifier } = this;
            return getIdentifier(messageId, identifier);
        }
        read(stream, length) {
            this.readMessage(stream, length);
            // return { stream, length }
        }
        readMessage(stream, length) {
            return {
                stream,
                length
            };
        }
    }
    /**
     * @description
     * 写数据处理基类
     */
    class BaseWriter {
        constructor(headerType) {
            this.lengthSize = 0;
            this.messageId = 0;
            this.topic = '';
            this.targetId = '';
            this.identifier = '';
            this._header = new Header(headerType, false, QOS.AT_MOST_ONCE, false);
        }
        getIdentifier() {
            const { messageId, identifier } = this;
            return getIdentifier(messageId, identifier);
        }
        write(stream) {
            const headerCode = this.getHeaderFlag();
            stream.write(headerCode); // 写入 Header
            this.writeMessage(stream);
        }
        setHeaderQos(qos) {
            this._header.qos = qos;
        }
        getHeaderFlag() {
            return this._header.encode();
        }
        getLengthSize() {
            return this.lengthSize;
        }
        getBufferData() {
            const stream = new RongStreamWriter();
            this.write(stream);
            const val = stream.getBytesArray();
            const binary = new Int8Array(val);
            return binary;
        }
        getCometData() {
            const data = this.data || {};
            return JSON.stringify(data);
        }
    }
    /**
     * @description
     * 连接成功后服务端的回执
     */
    class ConnAckReader extends BaseReader {
        constructor() {
            super(...arguments);
            this._name = MessageName.CONN_ACK;
            this.status = null; // 链接状态
            this.userId = null; // 用户 id
            // sessionId: string;
            this.timestamp = 0;
        }
        readMessage(stream, length) {
            stream.readByte(); // 去除 Header
            this.status = +stream.readByte();
            if (length > ConnAckReader.MESSAGE_LENGTH) {
                this.userId = stream.readUTF();
                stream.readUTF(); // 此处为取 sessionId, ws 未用到此值, 但也需执行, 否则读取后面数值时会不准
                this.timestamp = stream.readLong();
            }
            return {
                stream,
                length
            };
        }
    }
    ConnAckReader.MESSAGE_LENGTH = 2;
    /**
     * @description
     * 服务端断开链接. 比如: 被踢
     */
    class DisconnectReader extends BaseReader {
        constructor() {
            super(...arguments);
            this._name = MessageName.DISCONNECT;
            this.status = 0;
        }
        readMessage(stream, length) {
            stream.readByte();
            // (1)、此处未转换为链接状态码  (2)、2.0 代码限制了 status 为 0 - 5, 不在范围内则报错. 此处去掉此判断
            this.status = +stream.readByte();
            return {
                stream,
                length
            };
        }
    }
    DisconnectReader.MESSAGE_LENGTH = 2;
    /**
     * @description
     * ping 请求
     */
    class PingReqWriter extends BaseWriter {
        constructor() {
            super(OperationType.PING_REQ);
            this._name = MessageName.PING_REQ;
        }
        writeMessage(stream) { }
    }
    /**
     * @description
     * ping 响应
     */
    class PingRespReader extends BaseReader {
        constructor(header) {
            super(header);
            this._name = MessageName.PING_RESP;
        }
    }
    class RetryableReader extends BaseReader {
        constructor() {
            super(...arguments);
            this.messageId = 0;
        }
        readMessage(stream, length) {
            const msgId = stream.readByte() * 256 + stream.readByte();
            this.messageId = parseInt(msgId.toString(), 10);
            return {
                stream,
                length
            };
        }
    }
    class RetryableWriter extends BaseWriter {
        constructor() {
            super(...arguments);
            this.messageId = 0;
        }
        writeMessage(stream) {
            const id = this.messageId;
            const lsb = id & 255;
            const msb = (id & 65280) >> 8; // 65280 -> 1111111100000000
            stream.write(msb);
            stream.write(lsb);
        }
    }
    class PublishReader extends RetryableReader {
        constructor() {
            super(...arguments);
            this._name = MessageName.PUBLISH;
            this.topic = '';
            this.targetId = '';
            this.syncMsg = false;
            this.identifier = IDENTIFIER.PUB;
        }
        readMessage(stream, length) {
            // let pos = 6;
            this.date = stream.readInt();
            this.topic = stream.readUTF();
            // pos += BinaryHelper.writeUTF(this.topic).length;
            this.targetId = stream.readUTF();
            // pos += BinaryHelper.writeUTF(this.targetId).length;
            // RetryableReader.prototype.readMessage.apply(this, arguments)
            super.readMessage(stream, length);
            // this.data = new Array(msgLength - pos);
            this.data = stream.readAll();
            return {
                stream,
                length
            };
        }
    }
    /**
     * @description
     * 发消息使用
     */
    class PublishWriter extends RetryableWriter {
        constructor(topic, data, targetId) {
            super(OperationType.PUBLISH);
            this._name = MessageName.PUBLISH;
            this.syncMsg = false;
            this.identifier = IDENTIFIER.PUB;
            this.topic = topic;
            this.data = isString(data) ? BinaryHelper.writeUTF(data) : data;
            this.targetId = targetId;
        }
        writeMessage(stream) {
            stream.writeUTF(this.topic);
            stream.writeUTF(this.targetId);
            super.writeMessage(stream);
            stream.write(this.data);
        }
    }
    /**
     * @description
     * 发消息, Server 给的 Ack 回执
     */
    class PubAckReader extends RetryableReader {
        constructor() {
            super(...arguments);
            this._name = MessageName.PUB_ACK;
            this.status = 0;
            this.date = 0;
            this.millisecond = 0;
            this.messageUId = '';
            this.timestamp = 0;
            this.identifier = IDENTIFIER.PUB;
            this.topic = '';
            this.targetId = '';
        }
        readMessage(stream, length) {
            super.readMessage(stream, length);
            this.date = stream.readInt();
            this.status = stream.readByte() * 256 + stream.readByte();
            this.millisecond = stream.readByte() * 256 + stream.readByte();
            this.timestamp = this.date * 1000 + this.millisecond;
            this.messageUId = stream.readUTF();
            return {
                stream,
                length
            };
        }
    }
    /**
     * @description
     * Server 下发 Pub, Web 给 Server 发送回执
     */
    class PubAckWriter extends RetryableWriter {
        constructor(messageId) {
            super(OperationType.PUB_ACK);
            this._name = MessageName.PUB_ACK;
            this.status = 0;
            this.date = 0;
            this.millisecond = 0;
            this.messageUId = '';
            this.timestamp = 0;
            this.messageId = messageId;
        }
        writeMessage(stream) {
            super.writeMessage(stream);
        }
    }
    /**
     * @description
     * Web 主动查询
     */
    class QueryWriter extends RetryableWriter {
        constructor(topic, data, targetId) {
            super(OperationType.QUERY);
            this.name = MessageName.QUERY;
            this.identifier = IDENTIFIER.QUERY;
            this.topic = topic;
            this.data = isString(data) ? BinaryHelper.writeUTF(data) : data;
            this.targetId = targetId;
        }
        writeMessage(stream) {
            stream.writeUTF(this.topic);
            stream.writeUTF(this.targetId);
            // RetryableWriter.prototype.writeMessage.call(this, stream)
            super.writeMessage(stream);
            stream.write(this.data);
        }
    }
    /**
     * @description
     * Server 发送 Query, Web 给 Server 的回执
     */
    class QueryConWriter extends RetryableWriter {
        constructor(messageId) {
            super(OperationType.QUERY_CONFIRM);
            this._name = MessageName.QUERY_CON;
            this.messageId = messageId;
        }
    }
    /**
     * @description
     * Server 对 Web 查询操作的回执
     */
    class QueryAckReader extends RetryableReader {
        constructor() {
            super(...arguments);
            this._name = MessageName.QUERY_ACK;
            this.status = 0;
            this.identifier = IDENTIFIER.QUERY;
            this.topic = '';
            this.targetId = '';
        }
        readMessage(stream, length) {
            // RetryableReader.prototype.readMessage.call(this, stream)
            super.readMessage(stream, length);
            this.date = stream.readInt();
            this.status = stream.readByte() * 256 + stream.readByte();
            this.data = stream.readAll();
            // if (msgLength > 0) {
            //   this.data = new Array(msgLength - 8);
            //   this.data = stream.readAll();
            // }
            return {
                stream,
                length
            };
        }
    }
    const getReaderByHeader = (header) => {
        const type = header.type;
        let msg;
        switch (type) {
            case OperationType.CONN_ACK:
                msg = new ConnAckReader(header);
                break;
            case OperationType.PUBLISH:
                msg = new PublishReader(header);
                msg.syncMsg = header.syncMsg;
                break;
            case OperationType.PUB_ACK:
                msg = new PubAckReader(header);
                break;
            case OperationType.QUERY_ACK:
                msg = new QueryAckReader(header);
                break;
            case OperationType.SUB_ACK:
            case OperationType.UNSUB_ACK:
            case OperationType.PING_RESP:
                msg = new PingRespReader(header);
                break;
            case OperationType.DISCONNECT:
                msg = new DisconnectReader(header);
                break;
            default:
                msg = new BaseReader(header);
                logger.error('No support for deserializing ' + type + ' messages');
        }
        return msg;
    };
    /**
     * 解析 websocket 收到的数据 ArrayBuffer 数据
     * @param {ArrayBuffer} data server 通过 webscoekt 传送的所有数据
     */
    const readWSBuffer = (data) => {
        const arr = new Uint8Array(data);
        const stream = new RongStreamReader(arr);
        const flags = stream.readByte();
        const header = new Header(flags);
        const msg = getReaderByHeader(header);
        msg.read(stream, arr.length - 1);
        return msg;
    };
    const readCometData = (data) => {
        const flags = data.headerCode;
        const header = new Header(flags);
        const msg = getReaderByHeader(header);
        // utils.forEach(data, (item: any, key: string) => {
        //   if (key in msg) {
        //     msg[key] = item;
        //   }
        // });
        for (const key in data) {
            // if (key in msg) {
            msg[key] = data[key];
            // }
        }
        return msg;
    };

    /**
     * CMP/Comet 服务连接应答码
     */
    const ConnectResultCode = {
        /**
         * 连接成功
         */
        ACCEPTED: 0,
        /**
         * 协议版本不匹配
         * @description 暂未使用
         */
        UNACCEPTABLE_PROTOCOL_VERSION: 1,
        /**
         * 客户端（移动端 TCP 连接建立时）`info` 字段格式错误
         * @description 格式：`{平台类型}-{设备信息}-{sdk版本}`。
         * 其中设备信息为：{手机类型}{手机型号}{网络类型，4G/WIFI}{运营商标识, 移动/电信/联通}
         */
        IDENTIFIER_REJECTED: 2,
        /**
         * 不支持的平台类型，一般小程序或 PC 未开通
         */
        SERVER_UNAVAILABLE: 3,
        /**
         * Token无法解析，或Token已过期
         */
        TOKEN_INCORRECT: 4,
        /**
         * 防黑产规则相关应答
         */
        NOT_AUTHORIZED: 5,
        /**
         * 服务重定向，一般服务扩缩容时，落点已经改变，此时 userId 链接到旧的节点时，会触发该错误。
         * 客户端收到该应答后须重新访问导航，重新获取 CMP 地址
         */
        REDIRECT: 6,
        /**
         * 暂未使用
         */
        PACKAGE_ERROR: 7,
        /**
         * 该 AppKey 已经封禁或删除
         */
        APP_BLOCK_OR_DELETE: 8,
        /**
         * 该用户 ID 已经被封禁
         */
        BLOCK: 9,
        /**
         * Token 已过期，暂未使用
         */
        TOKEN_EXPIRE: 10,
        /**
         * Token 中携带 deviceId 时，检测 Token 中 deviceId 与链接设备 deviceId 不一致
         */
        DEVICE_ERROR: 11,
        /**
         * Web 端设置安全域名后，连接端域名不在安全域名范围内
         */
        HOSTNAME_ERROR: 12,
        /**
         * 开启`禁止把已在线客户端踢下线`开关后，该错误码标识已有同类型端在线，禁止链接
         */
        HASOHTERSAMECLIENTONLINE: 13
    };

    /**
     * 连接状态
     */
    var ConnectionStatus;
    (function (ConnectionStatus) {
        /**
         * 连接成功。
         */
        ConnectionStatus[ConnectionStatus["CONNECTED"] = 0] = "CONNECTED";
        /**
         * 连接中。
         */
        ConnectionStatus[ConnectionStatus["CONNECTING"] = 1] = "CONNECTING";
        /**
         * 正常断开连接。
         */
        ConnectionStatus[ConnectionStatus["DISCONNECTED"] = 2] = "DISCONNECTED";
        /**
         * 网络不可用。
         */
        ConnectionStatus[ConnectionStatus["NETWORK_UNAVAILABLE"] = 3] = "NETWORK_UNAVAILABLE";
        /**
         * 连接关闭。
         */
        ConnectionStatus[ConnectionStatus["CONNECTION_CLOSED"] = 4] = "CONNECTION_CLOSED";
        /**
         * 用户账户在其他设备登录，本机会被踢掉线。
         */
        ConnectionStatus[ConnectionStatus["KICKED_OFFLINE_BY_OTHER_CLIENT"] = 6] = "KICKED_OFFLINE_BY_OTHER_CLIENT";
        /**
         * websocket 连接失败
         */
        ConnectionStatus[ConnectionStatus["WEBSOCKET_UNAVAILABLE"] = 7] = "WEBSOCKET_UNAVAILABLE";
        /**
         * websocket 报错
         */
        ConnectionStatus[ConnectionStatus["WEBSOCKET_ERROR"] = 8] = "WEBSOCKET_ERROR";
        /**
         * 用户被封禁
         */
        ConnectionStatus[ConnectionStatus["BLOCKED"] = 9] = "BLOCKED";
        /**
         * 域名错误
         */
        ConnectionStatus[ConnectionStatus["DOMAIN_INCORRECT"] = 12] = "DOMAIN_INCORRECT";
        /**
         * 服务器主动断开
         */
        ConnectionStatus[ConnectionStatus["DISCONNECT_BY_SERVER"] = 13] = "DISCONNECT_BY_SERVER";
        /**
         * 重定向
         */
        ConnectionStatus[ConnectionStatus["REDIRECT"] = 14] = "REDIRECT";
        /**
         * appkey 不正确
         */
        ConnectionStatus[ConnectionStatus["APPKEY_IS_FAKE"] = 20] = "APPKEY_IS_FAKE";
        /**
         * 互踢次数过多（`count > 5`），此时可能出现：在其它他设备登陆有 reconnect 逻辑
         */
        ConnectionStatus[ConnectionStatus["ULTRALIMIT"] = 1101] = "ULTRALIMIT";
        /**
         * 开始请求导航
         */
        ConnectionStatus[ConnectionStatus["REQUEST_NAVI"] = 201] = "REQUEST_NAVI";
        /**
         * 请求导航结束
         */
        ConnectionStatus[ConnectionStatus["RESPONSE_NAVI"] = 202] = "RESPONSE_NAVI";
        /**
         *  请求导航失败
         */
        ConnectionStatus[ConnectionStatus["RESPONSE_NAVI_ERROR"] = 203] = "RESPONSE_NAVI_ERROR";
        /**
         *  请求导航超时
         */
        ConnectionStatus[ConnectionStatus["RESPONSE_NAVI_TIMEOUT"] = 204] = "RESPONSE_NAVI_TIMEOUT";
    })(ConnectionStatus || (ConnectionStatus = {}));
    var ConnectionStatus$1 = ConnectionStatus;

    /* eslint-disable camelcase */
    /**
     * 信令名
     */
    var Topic;
    (function (Topic) {
        /** 发送消息进入离线消息存储，接收者不在线时，可转推送 */
        Topic[Topic["ppMsgP"] = 1] = "ppMsgP";
        /** 发送消息进入离线消息存储，接收者不在线时，不转推送 */
        Topic[Topic["ppMsgN"] = 2] = "ppMsgN";
        /** 发送消息不进入离线存储，用户在线时直发到接收者，不在线时消息丢弃，不转推送 */
        Topic[Topic["ppMsgS"] = 3] = "ppMsgS";
        Topic[Topic["pgMsgP"] = 4] = "pgMsgP";
        Topic[Topic["chatMsg"] = 5] = "chatMsg";
        Topic[Topic["pcMsgP"] = 6] = "pcMsgP";
        Topic[Topic["qryPMsg"] = 7] = "qryPMsg";
        Topic[Topic["qryGMsg"] = 8] = "qryGMsg";
        Topic[Topic["qryCHMsg"] = 9] = "qryCHMsg";
        Topic[Topic["qryCMsg"] = 10] = "qryCMsg";
        Topic[Topic["qrySMsg"] = 11] = "qrySMsg";
        Topic[Topic["recallMsg"] = 12] = "recallMsg";
        Topic[Topic["prMsgS"] = 13] = "prMsgS";
        /** 消息通知拉取 */
        Topic[Topic["s_ntf"] = 14] = "s_ntf";
        /** 服务直发消息 */
        Topic[Topic["s_msg"] = 15] = "s_msg";
        /**
         * 状态同步
         * @todo 需确定同步哪些状态
         */
        Topic[Topic["s_stat"] = 16] = "s_stat";
        /** 服务端通知：聊天室 kv 、会话状态 */
        Topic[Topic["s_cmd"] = 17] = "s_cmd";
        /** 实时配置变更通知 */
        Topic[Topic["s_us"] = 18] = "s_us";
        /** 拉取实时配置 */
        Topic[Topic["pullUS"] = 19] = "pullUS";
        Topic[Topic["pgMsgS"] = 20] = "pgMsgS";
        Topic[Topic["chatMsgS"] = 21] = "chatMsgS";
        Topic[Topic["qrySessionsAtt"] = 22] = "qrySessionsAtt";
        Topic[Topic["pullMsg"] = 23] = "pullMsg";
        Topic[Topic["qrySessions"] = 24] = "qrySessions";
        Topic[Topic["delSessions"] = 25] = "delSessions";
        Topic[Topic["delMsg"] = 26] = "delMsg";
        Topic[Topic["updRRTime"] = 27] = "updRRTime";
        /** 拉取聊天室消息 */
        Topic[Topic["chrmPull"] = 28] = "chrmPull";
        Topic[Topic["joinChrm"] = 29] = "joinChrm";
        Topic[Topic["joinChrmR"] = 30] = "joinChrmR";
        Topic[Topic["exitChrm"] = 31] = "exitChrm";
        Topic[Topic["queryChrmI"] = 32] = "queryChrmI";
        Topic[Topic["setKV"] = 33] = "setKV";
        Topic[Topic["delKV"] = 34] = "delKV";
        /** 拉取聊天室 KV 存储 */
        Topic[Topic["pullKV"] = 35] = "pullKV";
        Topic[Topic["qryRelation"] = 36] = "qryRelation";
        Topic[Topic["delRelation"] = 37] = "delRelation";
        Topic[Topic["pullSeAtts"] = 38] = "pullSeAtts";
        Topic[Topic["setSeAtt"] = 39] = "setSeAtt";
        Topic[Topic["qnTkn"] = 40] = "qnTkn";
        Topic[Topic["qnUrl"] = 41] = "qnUrl";
        Topic[Topic["aliUrl"] = 42] = "aliUrl";
        Topic[Topic["s3Url"] = 43] = "s3Url";
        Topic[Topic["stcUrl"] = 44] = "stcUrl";
        Topic[Topic["cleanPMsg"] = 45] = "cleanPMsg";
        Topic[Topic["cleanGMsg"] = 46] = "cleanGMsg";
        Topic[Topic["cleanCMsg"] = 47] = "cleanCMsg";
        Topic[Topic["cleanSMsg"] = 48] = "cleanSMsg";
        Topic[Topic["rtcRJoin_data"] = 49] = "rtcRJoin_data";
        Topic[Topic["rtcRExit"] = 50] = "rtcRExit";
        Topic[Topic["rtcPing"] = 51] = "rtcPing";
        Topic[Topic["rtcSetData"] = 52] = "rtcSetData";
        /** 全量 URI 资源变更 */
        Topic[Topic["userSetData"] = 53] = "userSetData";
        Topic[Topic["rtcQryData"] = 54] = "rtcQryData";
        Topic[Topic["rtcDelData"] = 55] = "rtcDelData";
        Topic[Topic["rtcSetOutData"] = 56] = "rtcSetOutData";
        Topic[Topic["rtcQryUserOutData"] = 57] = "rtcQryUserOutData";
        Topic[Topic["rtcToken"] = 58] = "rtcToken";
        Topic[Topic["rtcUserState"] = 59] = "rtcUserState";
        Topic[Topic["rtcRInfo"] = 60] = "rtcRInfo";
        Topic[Topic["rtcUData"] = 61] = "rtcUData";
        Topic[Topic["rtcUPut"] = 62] = "rtcUPut";
        Topic[Topic["rtcUDel"] = 63] = "rtcUDel";
        Topic[Topic["rtcUList"] = 64] = "rtcUList";
        Topic[Topic["addSeTag"] = 65] = "addSeTag";
        Topic[Topic["delSeTag"] = 66] = "delSeTag";
        Topic[Topic["addTag"] = 67] = "addTag";
        Topic[Topic["delTag"] = 68] = "delTag";
        Topic[Topic["disTag"] = 69] = "disTag"; // 解除会话标签关系
    })(Topic || (Topic = {}));
    var Topic$1 = Topic;

    /**
     * 通过 /ping 接口确定目标导航是否可用，并根据响应速度排序
     * @todo 需确认该嗅探的必要性，并确定是否需要删除
     * @param hosts
     * @param protocol
     * @param runtime
     */
    const getValidHosts = (hosts, protocol, runtime) => __awaiter(void 0, void 0, void 0, function* () {
        // 根据 /ping?r=<random> 的响应速度对 hosts 进行排序响应速度排序
        let pingRes = yield Promise.all(hosts.map((host) => __awaiter(void 0, void 0, void 0, function* () {
            const now = Date.now();
            const url = `${protocol}://${host}/ping?r=${randomNum(1000, 9999)}`;
            const res = yield runtime.httpReq({
                url,
                timeout: PING_REQ_TIMEOUT
            });
            return { status: res.status, host, cost: Date.now() - now };
        })));
        // 清理无效地址
        pingRes = pingRes.filter(item => item.status === 200);
        // 按响应时间排序
        if (pingRes.length > 1) {
            pingRes = pingRes.sort((a, b) => a.cost - b.cost);
        }
        return pingRes.map(item => item.host);
    });
    const formatWSUrl = (protocol, host, appkey, token, runtime, apiVersion, pid) => {
        return `${protocol}://${host}/websocket?appId=${appkey}&token=${encodeURIComponent(token)}&sdkVer=${apiVersion}&pid=${pid}&apiVer=${runtime.isFromUniapp ? 'uniapp' : 'normal'}${runtime.connectPlatform ? '&platform=' + runtime.connectPlatform : ''}`;
    };
    const formatResolveKey = (messageId, identifier) => [messageId, identifier].join('-');
    const isStatusMessage = (topic) => {
        return [Topic$1.ppMsgS, Topic$1.pgMsgS, Topic$1.chatMsgS].map(item => Topic$1[item]).indexOf(topic) >= 0;
    };

    /**
     * 服务器推送的 DisconnectAck 信令状态码
     */
    var DisconnectReason;
    (function (DisconnectReason) {
        /**
         * 重定向（兼容老版本）
         */
        DisconnectReason[DisconnectReason["REDIRECT"] = 0] = "REDIRECT";
        /**
         * 其他端登录
         */
        DisconnectReason[DisconnectReason["OTHER_DEVICE_LOGIN"] = 1] = "OTHER_DEVICE_LOGIN";
        /**
         * 用户被封禁（兼容老版本）
         */
        DisconnectReason[DisconnectReason["BLOCK"] = 2] = "BLOCK";
        /**
         * 服务器端关闭连接，收到时直接 SDK 内部重连
         */
        DisconnectReason[DisconnectReason["REMOTE_CLOSE"] = 3] = "REMOTE_CLOSE";
        /**
         * 注销登录，web 不涉及无需处理
         */
        DisconnectReason[DisconnectReason["LOGOUT"] = 4] = "LOGOUT";
        /**
         * 用户被封禁
         */
        DisconnectReason[DisconnectReason["BLOCK_NEW"] = 5] = "BLOCK_NEW";
        /**
         * 重定向，SDK 需重新取导航进行重连尝试
         */
        DisconnectReason[DisconnectReason["REDIRECT_NEW"] = 6] = "REDIRECT_NEW";
    })(DisconnectReason || (DisconnectReason = {}));

    const sendWSData = (writer, socket) => {
        if (!(writer instanceof PingReqWriter)) {
            logger.debug('Websocket ==>', writer);
        }
        const binary = writer.getBufferData();
        socket.send(binary.buffer);
    };
    /**
     * @todo 迁移中的 DataCodec 模块导致数据通道不够独立，与 xhr-polling 通信可能会有耦合，后续需解耦
     * @description
     * 1. 基于 WebSocket 协议建立数据通道，实现数据收发
     * 2. 基于 Protobuf 进行数据编解码
     */
    class WebSocketChannel extends ADataChannel {
        // 为避免 Circular dependency，此处 runtime 通过参数传入而非全局获取
        constructor(_runtime, watcher) {
            super('websocket', watcher);
            this._runtime = _runtime;
            this._socket = null;
            /**
             * 本端发送消息时等待接收 PubAck 的 Promise.resolve 函数
             */
            this._messageIds = {};
            /**
             * 接收多端同步消息时，等待 PubAck 的 Promise.resolve 函数
             */
            this._syncMessageIds = {};
            /**
             * 当前累计心跳超时次数
             */
            this._failedCount = 0;
            /**
             * 允许连续 PING 超时次数，次数内不主动关闭连接
             */
            this.ALLOW_FAILED_TIMES = 4;
            /**
             * 有效值 0 - 65535，超出 65535 位数超长溢出
             */
            this._idCount = 0;
            this._generateMessageId = () => {
                if (this._idCount >= 65535) {
                    this._idCount = 0;
                }
                return ++this._idCount;
            };
        }
        /**
         * 建立 websocket 连接
         * @param appkey
         * @param token
         * @param hosts
         * @param protocol
         * @param apiVersion - apiVersion 需符合 `/\d+(\.\d+){2}/` 规则
         */
        connect(appkey, token, hosts, protocol, apiVersion) {
            return __awaiter(this, void 0, void 0, function* () {
                // 祛除预发布包中的预发布标签，取真实版本号
                apiVersion = matchVersion(apiVersion);
                // 通知连接中
                this._watcher.status(ConnectionStatus$1.CONNECTING);
                // 检索有效地址
                const validHosts = yield getValidHosts(hosts, protocol, this._runtime);
                if (validHosts.length === 0) {
                    logger.error('No valid websocket server hosts!');
                    return ErrorCode$1.RC_SOCKET_NOT_CREATED;
                }
                // 确定连接协议：http -> ws, https -> wss
                const wsProtocol = protocol.replace('http', 'ws');
                // 逐个尝试建立 websocket 连接
                for (let i = 0, len = validHosts.length; i < len; i += 1) {
                    const url = formatWSUrl(wsProtocol, validHosts[i], appkey, token, this._runtime, apiVersion);
                    // 创建 socket，若超时一定时间未收到 ConnAck 确认，则视为连接超时
                    const socket = this._runtime.createWebSocket(url);
                    // 服务连接非主动断开，尝试重连
                    const disconnected = (code) => {
                        if (this._socket === socket) {
                            this._socket = null;
                            this._watcher.status(code);
                        }
                    };
                    // 等待连接结果
                    const code = yield new Promise((resolve) => {
                        socket.onMessage((data) => {
                            if (Object.prototype.toString.call(data) !== '[object ArrayBuffer]') {
                                logger.error('Socket received invalid data:', data);
                                return;
                            }
                            const signal = readWSBuffer(data);
                            // Ping 响应
                            if (signal instanceof PingRespReader && this._pingResolve) {
                                this._pingResolve(ErrorCode$1.SUCCESS);
                                this._pingResolve = undefined;
                                return;
                            }
                            logger.debug('Websocket <==', signal);
                            // 连接回执
                            if (signal instanceof ConnAckReader) {
                                if (signal.status !== ConnectResultCode.ACCEPTED) {
                                    logger.error('Websocket connAck status:', signal.status);
                                    resolve(signal.status);
                                    return;
                                }
                                this.connectedTime = signal.timestamp;
                                this.userId = signal.userId || '';
                                resolve(ErrorCode$1.SUCCESS);
                                return;
                            }
                            // 服务器主动断开
                            if (signal instanceof DisconnectReader) {
                                const { status } = signal;
                                switch (status) {
                                    case DisconnectReason.BLOCK:
                                        this._watcher.status(ConnectionStatus$1.BLOCKED);
                                        break;
                                    case DisconnectReason.OTHER_DEVICE_LOGIN:
                                        this._watcher.status(ConnectionStatus$1.KICKED_OFFLINE_BY_OTHER_CLIENT);
                                        break;
                                    case DisconnectReason.REDIRECT_NEW:
                                        this._watcher.status(ConnectionStatus$1.REDIRECT);
                                        break;
                                    default:
                                        this._watcher.status(ConnectionStatus$1.DISCONNECT_BY_SERVER);
                                        break;
                                }
                                return;
                            }
                            // 非连接信令处理
                            this._onReceiveSignal(signal);
                        });
                        socket.onClose((code, reason) => {
                            logger.warn('websocket closed! code:', code, 'reason:', reason);
                            disconnected(ConnectionStatus$1.CONNECTION_CLOSED);
                            resolve(code);
                        });
                        socket.onError((error) => {
                            logger.error('websocket error!', error);
                            disconnected(ConnectionStatus$1.WEBSOCKET_ERROR);
                            resolve(ErrorCode$1.NETWORK_ERROR);
                        });
                        socket.onOpen(() => logger.debug('websocket open =>', url));
                        // ConnAck 超时
                        timerSetTimeout(() => {
                            resolve(ErrorCode$1.TIMEOUT);
                        }, WEB_SOCKET_TIMEOUT);
                    });
                    if (code === ErrorCode$1.SUCCESS) {
                        this._socket = socket;
                        // 启动定时心跳
                        this._checkAlive();
                        // 通知上层连接成功
                        this._watcher.status(ConnectionStatus$1.CONNECTED);
                        return code;
                    }
                    socket.close();
                }
                return ErrorCode$1.RC_NET_UNAVAILABLE;
            });
        }
        _checkAlive() {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._socket) {
                    // 连接已中断，停止发 Ping
                    return;
                }
                this.sendOnly(new PingReqWriter());
                // 等待响应
                const code = yield new Promise((resolve) => {
                    this._pingResolve = resolve;
                    setTimeout(() => {
                        this._pingResolve = undefined;
                        resolve(ErrorCode$1.TIMEOUT);
                    }, IM_SIGNAL_TIMEOUT);
                });
                // 响应超时，尝试关闭连接
                if (code !== ErrorCode$1.SUCCESS && ++this._failedCount >= this.ALLOW_FAILED_TIMES) {
                    (_a = this._socket) === null || _a === void 0 ? void 0 : _a.close();
                    return;
                }
                this._failedCount = 0;
                // 重新定时任务
                setTimeout(() => this._checkAlive(), IM_PING_INTERVAL_TIME);
            });
        }
        _onReceiveSignal(signal) {
            return __awaiter(this, void 0, void 0, function* () {
                const { messageId, identifier } = signal;
                // 检查是否为 Ack, 如果是, 则处理回执
                const isQosNeedAck = signal.header && signal.header.qos !== QOS.AT_MOST_ONCE;
                if (isQosNeedAck) {
                    // Pub 回执
                    if (signal instanceof PublishReader && !signal.syncMsg) {
                        this.sendOnly(new PubAckWriter(messageId));
                    }
                    // qry 回执
                    if (signal instanceof QueryAckReader) {
                        this.sendOnly(new QueryConWriter(messageId));
                    }
                }
                const key = formatResolveKey(messageId, identifier);
                // 处理 pubAck、queryAck 回执
                if (messageId > 0) {
                    const resolve = this._messageIds[key];
                    resolve && resolve(signal);
                    // 多端同步消息的 pubAck
                    this._syncMessageIds[key] && this._syncMessageIds[key](signal);
                }
                // PublishReader 处理
                if (signal instanceof PublishReader) {
                    const { syncMsg, topic } = signal;
                    // 非同步消息或者是状态消息（ppMsgS，pgMsgS，chatMsgS），则直接抛出到上层
                    if (!syncMsg || isStatusMessage(topic)) {
                        this._watcher.signal(signal);
                        return;
                    }
                    // 多端同步消息息需等待 CMP 发送的 PubAck（Comet 不发）
                    const ack = yield new Promise(resolve => {
                        this._syncMessageIds[key] = resolve;
                    });
                    delete this._syncMessageIds[key];
                    this._watcher.signal(signal, ack);
                }
            });
        }
        sendOnly(writer) {
            if (this._socket) {
                sendWSData(writer, this._socket);
            }
        }
        send(writer, respPBName, option, timeout = IM_SIGNAL_TIMEOUT) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._socket) {
                    const messageId = this._generateMessageId();
                    writer.messageId = messageId;
                    const identifier = writer.identifier;
                    sendWSData(writer, this._socket);
                    // 等待响应结果
                    const respSignal = yield new Promise((resolve) => {
                        const key = formatResolveKey(messageId, identifier);
                        this._messageIds[key] = resolve;
                        setTimeout(() => {
                            delete this._messageIds[key];
                            resolve(); // 无值认为 timeout 超时
                        }, timeout);
                    });
                    if (!respSignal) {
                        return { code: ErrorCode$1.TIMEOUT };
                    }
                    if (respSignal.status !== 0) {
                        return { code: respSignal.status };
                    }
                    const data = respPBName ? this.codec.decodeByPBName(respSignal.data, respPBName, option) : respSignal;
                    return { code: ErrorCode$1.SUCCESS, data };
                }
                return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
            });
        }
        close() {
            if (this._socket) {
                this._socket.close();
                this._socket = null;
                this._watcher.status(ConnectionStatus$1.DISCONNECTED);
            }
        }
    }

    exports.HttpMethod = void 0;
    (function (HttpMethod) {
        HttpMethod["GET"] = "GET";
        HttpMethod["POST"] = "POST";
    })(exports.HttpMethod || (exports.HttpMethod = {}));

    const isValidJSON = (jsonStr) => {
        if (isObject(jsonStr)) {
            return true;
        }
        let isValid = false;
        try {
            const obj = JSON.parse(jsonStr);
            const str = JSON.stringify(obj);
            isValid = str === jsonStr;
        }
        catch (e) {
            isValid = false;
        }
        return isValid;
    };
    class CometChannel extends ADataChannel {
        constructor(_runtime, watcher) {
            super('comet', watcher);
            this._runtime = _runtime;
            this._messageIds = {};
            this._syncMessageIds = {};
            this._idCount = 0;
            this._generateMessageId = () => {
                return ++this._idCount;
            };
            this._pid = encodeURIComponent(new Date().getTime() + Math.random() + '');
        }
        /**
         * 长轮询结果处理
         * @param data
         */
        handleCometRes(res) {
            if (res.status !== 200 && res.status !== 202) {
                return false;
            }
            const data = isString(res.data) ? JSON.parse(res.data) : res.data;
            if (!data) {
                logger.error('received data is not a validJson', data);
                return false;
            }
            if (!isArray(data)) {
                return true;
            }
            forEach(data, (item) => __awaiter(this, void 0, void 0, function* () {
                const { sessionid } = item;
                if (sessionid) {
                    this._sessionid = sessionid;
                }
                const signal = readCometData(item);
                const { messageId, _header, status, identifier } = signal;
                const isQosNeedAck = _header && _header.qos !== QOS.AT_MOST_ONCE;
                const key = formatResolveKey(messageId, identifier);
                // 处理 pubAck、queryAck 回执
                if (messageId && signal.getIdentifier) {
                    const resolve = this._messageIds[key];
                    resolve && resolve(signal);
                    // 多端同步消息的 pubAck
                    this._syncMessageIds[key] && this._syncMessageIds[key](signal);
                }
                // 是否需要发回执
                if (isQosNeedAck) {
                    if (signal instanceof PublishReader && !signal.syncMsg) {
                        const writer = new PubAckWriter(messageId);
                        this.sendOnly(writer);
                    }
                    if (signal instanceof QueryAckReader) {
                        const writer = new QueryConWriter(messageId);
                        this.sendOnly(writer);
                    }
                }
                // 连接状态断开
                if (signal instanceof DisconnectReader) {
                    const connStatus = status === 1
                        ? ConnectionStatus$1.KICKED_OFFLINE_BY_OTHER_CLIENT
                        : (status === 2 ? ConnectionStatus$1.BLOCKED : status);
                    this._watcher.status(connStatus);
                }
                // 处理 publish
                if (signal instanceof PublishReader) {
                    const { syncMsg, topic } = signal;
                    // 非同步消息或者是状态消息（ppMsgS，pgMsgS，chatMsgS），则直接抛出到上层
                    if (!syncMsg || isStatusMessage(topic)) {
                        this._watcher.signal(signal);
                        return false;
                    }
                    // 多端同步消息需等待 CMP 发送的 PubAck
                    const ack = yield new Promise(resolve => {
                        this._syncMessageIds[key] = resolve;
                    });
                    delete this._syncMessageIds[key];
                    this._watcher.signal(signal, ack);
                }
            }));
            return true;
        }
        /**
         * 长轮询心跳
         */
        _startPullSignal(protocol) {
            return __awaiter(this, void 0, void 0, function* () {
                const timestamp = new Date().getTime();
                const url = `${protocol}://${this._domain}/pullmsg.js?sessionid=${this._sessionid}&timestrap=${timestamp}&pid=${this._pid}`;
                const res = yield this._runtime.httpReq({
                    url,
                    body: { pid: this._pid },
                    timeout: IM_COMET_PULLMSG_TIMEOUT
                });
                const isSuccess = this.handleCometRes(res);
                if (!this._isDisconnected) {
                    if (isSuccess) {
                        this._startPullSignal(protocol);
                    }
                    else {
                        this._watcher.status(ConnectionStatus$1.NETWORK_UNAVAILABLE);
                        this.close();
                    }
                }
            });
        }
        connect(appkey, token, hosts, protocol, apiVersion) {
            return __awaiter(this, void 0, void 0, function* () {
                // 祛除预发布包中的预发布标签，取真实版本号
                apiVersion = matchVersion(apiVersion);
                this._protocol = protocol;
                this._isDisconnected = false;
                this._watcher.status(ConnectionStatus$1.CONNECTING);
                const validHosts = yield getValidHosts(hosts, protocol, this._runtime);
                if (validHosts.length === 0) {
                    logger.error('No valid comet server hosts!');
                    return ErrorCode$1.RC_SOCKET_NOT_CREATED;
                }
                /**
                 * 连接结果处理
                 */
                const handleConnectRes = (res) => {
                    if (res.status !== 200 && res.status !== 202) {
                        return false;
                    }
                    if (res.data) {
                        if (!isValidJSON(res.data)) {
                            logger.error('received data is not a validJson', res.data);
                            return false;
                        }
                        return isObject(res.data) ? res.data : JSON.parse(res.data);
                    }
                    return false;
                };
                for (let i = 0, len = validHosts.length; i < len; i += 1) {
                    const url = formatWSUrl(protocol, validHosts[i], appkey, token, this._runtime, apiVersion, this._pid);
                    const res = yield this._runtime.httpReq({
                        url,
                        body: {
                            pid: this._pid
                        },
                        timeout: WEB_SOCKET_TIMEOUT
                    });
                    const response = handleConnectRes(res);
                    this._domain = validHosts[i];
                    if (response && response.status === 0) {
                        this._watcher.status(ConnectionStatus$1.CONNECTED);
                        this._sessionid = response.sessionid;
                        this._startPullSignal(protocol);
                        this.userId = response.userId;
                        this.connectedTime = response.timestamp;
                        return response.status;
                    }
                }
                return ErrorCode$1.RC_NET_UNAVAILABLE;
            });
        }
        sendCometData(writer, timeout = IM_SIGNAL_TIMEOUT) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _domain, _sessionid, _pid } = this;
                const { messageId, topic, targetId, identifier } = writer;
                const headerCode = writer.getHeaderFlag();
                let url;
                if (topic) {
                    url = `${this._protocol}://${_domain}/websocket?messageid=${messageId}&header=${headerCode}&sessionid=${_sessionid}&topic=${topic}&targetid=${targetId}&pid=${_pid}`;
                }
                else {
                    url = `${this._protocol}://${_domain}/websocket?messageid=${messageId}&header=${headerCode}&sessionid=${_sessionid}&pid=${_pid}`;
                }
                const res = yield this._runtime.httpReq({
                    url,
                    method: exports.HttpMethod.POST,
                    body: writer.getCometData()
                });
                this.handleCometRes(res);
            });
        }
        sendOnly(writer) {
            this.sendCometData(writer);
        }
        send(writer, respPBName, option, timeout = IM_SIGNAL_TIMEOUT) {
            return __awaiter(this, void 0, void 0, function* () {
                const messageId = this._generateMessageId();
                writer.messageId = messageId;
                this.sendCometData(writer);
                const { identifier } = writer;
                const respSignal = yield new Promise((resolve) => {
                    const key = formatResolveKey(messageId, identifier);
                    this._messageIds[key] = resolve;
                    setTimeout(() => {
                        delete this._messageIds[key];
                        resolve(); // 无值认为 timeout 超时
                    }, timeout);
                });
                if (!respSignal) {
                    return { code: ErrorCode$1.TIMEOUT };
                }
                if (respSignal.status !== 0) {
                    return { code: respSignal.status };
                }
                const data = respPBName ? this.codec.decodeByPBName(respSignal.data, respPBName, option) : respSignal;
                return { code: ErrorCode$1.SUCCESS, data };
            });
        }
        close() {
            this._isDisconnected = true;
            this._watcher.status(ConnectionStatus$1.DISCONNECTED);
        }
    }

    /**
     * 引擎定义
     */
    class AEngine {
        /**
         * 引擎初始化
         * @param _appkey
         */
        constructor(runtime, _watcher, _options) {
            this.runtime = runtime;
            this._watcher = _watcher;
            this._options = _options;
            /**
             * 当前用户 Id
             */
            this.currentUserId = '';
            this._appkey = this._options.appkey;
            this._apiVer = this._options.apiVersion;
            this.navi = this._createNavi();
        }
    }

    const getKey = (appkey, token) => {
        return ['navi', appkey, token].join('_');
    };
    const getNaviInfoFromCache = (appkey, token, storage) => {
        const key = getKey(appkey, token);
        const jsonStr = storage.getItem(key);
        if (!jsonStr) {
            return null;
        }
        let data;
        try {
            data = JSON.parse(jsonStr);
        }
        catch (err) {
            // 缓存数据被篡改，清空缓存
            storage.removeItem(key);
            return null;
        }
        // 缓存超时
        if (Date.now() - data.timestamp >= NAVI_CACHE_DURATION) {
            storage.removeItem(key);
            return null;
        }
        return data.naviInfo;
    };
    const setNaviInfo2Cache = (appkey, token, naviInfo, storage) => {
        const key = getKey(appkey, token);
        const data = {
            naviInfo,
            timestamp: Date.now()
        };
        storage.setItem(key, JSON.stringify(data));
    };
    const clearCache = (appkey, token, storage) => {
        storage.removeItem(getKey(appkey, token));
    };
    class ANavi {
        constructor(_runtime, _options) {
            this._runtime = _runtime;
            this._options = _options;
            this._appkey = this._options.appkey;
            this._apiVersion = matchVersion(this._options.apiVersion);
        }
        /**
         * 获取导航数据
         * @param token
         * @param dynamicUris token 携带的动态导航地址
         * @param force 是否强制重新获取并清空缓存数据
         */
        getInfo(token, dynamicUris, force) {
            return __awaiter(this, void 0, void 0, function* () {
                // 判断是否需要重新获取导航数据，是则清空缓存数据
                if (force) {
                    this._clear(token);
                }
                // 判断是否有有效缓存数据
                let naviInfo = getNaviInfoFromCache(this._appkey, token, this._runtime.localStorage);
                if (naviInfo) {
                    return naviInfo;
                }
                const uris = this._options.navigators.slice();
                dynamicUris.length && dynamicUris.forEach(uri => {
                    uris.indexOf(uri) < 0 && uris.unshift(uri);
                });
                // 串行请求，直到获取到导航数据或所有请求结束
                // TODO: 考虑是否可改为并行请求，串行请求时间过长
                naviInfo = yield this._reqNavi(uris, this._appkey, token);
                if (naviInfo) {
                    this.setNaviInfo2Cache(token, naviInfo);
                    return naviInfo;
                }
                // TODO: 所有请求已失败，公有云需要内置导航数据
                return naviInfo;
            });
        }
        setNaviInfo2Cache(token, naviInfo) {
            setNaviInfo2Cache(this._appkey, token, naviInfo, this._runtime.localStorage);
        }
        getInfoFromCache(token) {
            return getNaviInfoFromCache(this._appkey, token, this._runtime.localStorage);
        }
        /**
         * 清空导航数据：内存数据、缓存数据
         */
        _clear(token) {
            clearCache(this._appkey, token, this._runtime.localStorage);
        }
    }

    const OUTBOX_KEY = 'outbox';
    const INBOX_KEY = 'inbox';
    const generateKey = (prefix, appkey, userId) => {
        return [prefix, appkey, userId].join('_');
    };
    /**
     * 用于维护用户的收件箱、发件箱时间
     */
    class Letterbox {
        constructor(_runtime, _appkey) {
            this._runtime = _runtime;
            this._appkey = _appkey;
            // 需要在内存维护一份时间戳数据，以避免同浏览器多标签页下多端拉取消息时共享时间戳
            this._inboxTime = 0;
            this._outboxTime = 0;
        }
        /**
         * 更新收件箱时间
         * @param timestamp
         * @param userId
         */
        setInboxTime(timestamp, userId) {
            if (this._inboxTime > timestamp) {
                return;
            }
            this._inboxTime = timestamp;
            const key = generateKey(INBOX_KEY, this._appkey, userId);
            this._runtime.localStorage.setItem(key, timestamp.toString());
        }
        /**
         * 获取收件箱时间
         * @param userId
         */
        getInboxTime(userId) {
            if (this._inboxTime === 0) {
                const key = generateKey(INBOX_KEY, this._appkey, userId);
                this._inboxTime = parseInt(this._runtime.localStorage.getItem(key)) || 0;
            }
            return this._inboxTime;
        }
        /**
         * 更新发件箱时间
         * @param timestamp
         * @param userId
         */
        setOutboxTime(timestamp, userId) {
            if (this._outboxTime > timestamp) {
                return;
            }
            this._outboxTime = timestamp;
            const key = generateKey(OUTBOX_KEY, this._appkey, userId);
            this._runtime.localStorage.setItem(key, timestamp.toString());
        }
        /**
         * 获取发件箱时间
         * @param userId
         */
        getOutboxTime(userId) {
            if (this._outboxTime === 0) {
                const key = generateKey(OUTBOX_KEY, this._appkey, userId);
                this._outboxTime = parseInt(this._runtime.localStorage.getItem(key)) || 0;
            }
            return this._outboxTime;
        }
    }

    const PullTimeCache = {
        _caches: {},
        set(chrmId, time) {
            this._caches[chrmId] = time;
        },
        get(chrmId) {
            return this._caches[chrmId] || 0;
        },
        clear(chrmId) {
            this._caches[chrmId] = 0;
        }
    };
    class KVStore {
        constructor(chatroomId, currentUserId) {
            this._kvCaches = {};
            this._chatroomId = chatroomId;
            this._currentUserId = currentUserId;
        }
        _add(kv) {
            const { key } = kv;
            kv.isDeleted = false;
            this._kvCaches[key] = kv;
        }
        _remove(kv) {
            const { key } = kv;
            const cacheKV = this._kvCaches[key];
            cacheKV.isDeleted = true;
            this._kvCaches[key] = cacheKV;
        }
        _setEntry(data, isFullUpdate) {
            const { key, type, isOverwrite, userId } = data;
            const latestUserId = this._getSetUserId(key);
            const isDeleteOpt = type === ChatroomEntryType$1.DELETE;
            const isSameAtLastSetUser = latestUserId === userId;
            const isKeyNotExist = !this._isExisted(key);
            const event = isDeleteOpt ? this._remove : this._add;
            if (isFullUpdate) {
                event.call(this, data);
            }
            else if (isOverwrite || isSameAtLastSetUser || isKeyNotExist) {
                event.call(this, data);
            }
            else ;
        }
        getValue(key) {
            const kv = this._kvCaches[key] || {};
            const { isDeleted } = kv;
            return isDeleted ? null : kv.value;
        }
        getAllValue() {
            const entries = {};
            for (const key in this._kvCaches) {
                if (!this._kvCaches[key].isDeleted) {
                    entries[key] = this._kvCaches[key].value;
                }
            }
            return entries;
        }
        _getSetUserId(key) {
            const cache = this._kvCaches[key] || {};
            return cache.userId;
        }
        _isExisted(key) {
            const cache = this._kvCaches[key] || {};
            const { value, isDeleted } = cache;
            return (value && !isDeleted);
        }
        setEntries(data) {
            let { kvEntries, isFullUpdate } = data;
            kvEntries = kvEntries || [];
            isFullUpdate = isFullUpdate || false;
            isFullUpdate && this.clear();
            kvEntries.forEach((kv) => {
                this._setEntry(kv, isFullUpdate);
            });
        }
        clear() {
            this._kvCaches = {};
        }
    }
    class ChrmEntryHandler {
        constructor(engine) {
            this._pullQueue = [];
            this._isPulling = false;
            this._storeCaches = {}; // 所有聊天室的 Store 缓存
            this._engine = engine;
        }
        _startPull() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._isPulling || this._pullQueue.length === 0) {
                    return;
                }
                this._isPulling = true;
                const { chrmId, timestamp } = this._pullQueue.splice(0, 1)[0];
                const pulledUpTime = PullTimeCache.get(chrmId);
                if (pulledUpTime > timestamp) { // 已经拉取过，不再拉取
                    this._isPulling = false;
                    this._startPull();
                    return;
                }
                const { code, data } = yield this._engine.pullChatroomEntry(chrmId, pulledUpTime);
                if (code === ErrorCode$1.SUCCESS) {
                    this._isPulling = false;
                    PullTimeCache.set(chrmId, data.syncTime || 0);
                    this._startPull();
                }
                else {
                    this._startPull();
                }
            });
        }
        /**
         * 退出聊天室前清空 kv 缓存 和 拉取时间缓存，再次加入聊天室后重新拉取 kv 并更新本地
        */
        reset(chrmId) {
            // throw new Error('Method not implemented.')
            PullTimeCache.clear(chrmId);
            const kvStore = this._storeCaches[chrmId];
            kvStore && kvStore.clear();
        }
        /**
         * 向服务端拉取 kv
         * @description
         * 拉取时机: 1、加入聊天室成功后 2、收到 Server 拉取通知后
        */
        pullEntry(chrmId, timestamp) {
            this._pullQueue.push({ chrmId, timestamp });
            this._startPull();
        }
        /**
         * 向本地缓存己方设置或拉取到的 kv
        */
        setLocal(chrmId, data, userId) {
            // throw new Error('Method not implemented.')
            let kvStore = this._storeCaches[chrmId];
            if (!notEmptyObject(kvStore)) {
                kvStore = new KVStore(chrmId, userId);
            }
            kvStore.setEntries(data);
            this._storeCaches[chrmId] = kvStore;
        }
        /**
         * 获取聊天室 key 对应的 value
         * @param chrmId
         * @param key
        */
        getValue(chrmId, key) {
            // throw new Error('Method not implemented.')
            const kvStore = this._storeCaches[chrmId];
            return kvStore ? kvStore.getValue(key) : null;
        }
        /**
         * 获取聊天室所有 key value
         * @param chrmId
        */
        getAll(chrmId) {
            // throw new Error('Method not implemented.')
            const kvStore = this._storeCaches[chrmId];
            let entries = {};
            if (kvStore) {
                entries = kvStore.getAllValue();
            }
            return entries;
        }
    }
    class JoinedChrmManager {
        constructor(_runtime, _appkey, _userId, _canJoinMulipleChrm) {
            this._runtime = _runtime;
            this._appkey = _appkey;
            this._userId = _userId;
            this._canJoinMulipleChrm = _canJoinMulipleChrm;
            this._sessionKey = '';
            this._joinedChrmsInfo = {};
            this._sessionKey = `sync-chrm-${this._appkey}-${this._userId}`;
        }
        set(chrmId, count = 10) {
            !this._canJoinMulipleChrm && (this._joinedChrmsInfo = {});
            this._joinedChrmsInfo[chrmId] = count;
            this._runtime.sessionStorage.setItem(this._sessionKey, JSON.stringify(this._joinedChrmsInfo));
        }
        get() {
            let infos;
            try {
                const data = this._runtime.sessionStorage.getItem(this._sessionKey);
                infos = JSON.parse(data || '');
            }
            catch (err) {
                logger.error('parse rejoined chrm infos error', err);
                infos = {};
            }
            return infos;
        }
        remove(chrmId) {
            delete this._joinedChrmsInfo[chrmId];
            if (notEmptyObject(this._joinedChrmsInfo)) {
                this._runtime.sessionStorage.setItem(this._sessionKey, JSON.stringify(this._joinedChrmsInfo));
            }
            else {
                this.clear();
            }
        }
        clear() {
            this._joinedChrmsInfo = {};
            this._runtime.sessionStorage.removeItem(this._sessionKey);
        }
    }

    const EventName = {
        STATUS_CHANGED: 'converStatusChanged'
    };
    class ConversationStatus {
        constructor(engine, appkey, currentUserId) {
            this._eventEmitter = new EventEmitter();
            this._pullQueue = [];
            this._isPulling = false;
            this._storage = createRootStorage(engine.runtime);
            this._appkey = appkey;
            this._currentUserId = currentUserId;
            this._engine = engine;
            this._storagePullTimeKey = `con-s-${appkey}-${currentUserId}`;
        }
        /**
         * 向本地设置拉取的时间, 并通知上层会话状态的变更
        */
        _set(list) {
            // todo('ConversationStatus set')
            if (isUndefined(list)) {
                return;
            }
            let localTime = this._storage.get(this._storagePullTimeKey) || 0;
            const listCount = list.length;
            list.forEach((statusItem, index) => {
                const updatedTime = statusItem.updatedTime || 0;
                localTime = updatedTime > localTime ? updatedTime : localTime;
                statusItem.conversationType = statusItem.type;
                this._eventEmitter.emit(EventName.STATUS_CHANGED, {
                    statusItem,
                    isLastPull: index === listCount - 1
                });
            });
            this._storage.set(this._storagePullTimeKey, localTime);
        }
        /**
         * 拉取队列
        */
        _startPull() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._isPulling || this._pullQueue.length === 0) {
                    return;
                }
                this._isPulling = true;
                const time = this._pullQueue.splice(0, 1)[0];
                const { code, data } = yield this._engine.pullConversationStatus(time);
                if (code === ErrorCode$1.SUCCESS) {
                    this._isPulling = false;
                    this._set(data);
                    this._startPull();
                }
                else {
                    this._startPull();
                }
            });
        }
        /**
         * 从服务端拉取变更
        */
        pull(newPullTime) {
            const time = this._storage.get(this._storagePullTimeKey) || 0;
            if (newPullTime > time || newPullTime === 0) {
                // 拉取,并通知上层拉取到的数据
                this._pullQueue.push(time);
                this._startPull();
            }
        }
        /**
         * 注册会话状态变更事件
        */
        watch(event) {
            this._eventEmitter.on(EventName.STATUS_CHANGED, (data) => {
                event(data);
            });
        }
        /**
         * 断开连接的后，取消注册的会话状态变更时间，防止再次连接重复注册
        */
        unwatch() {
            this._eventEmitter.off(EventName.STATUS_CHANGED, (data) => { });
        }
    }

    const StorageKey2ConversationKey = {
        c: { keyName: 'unreadMessageCount', defaultVal: 0 },
        hm: { keyName: 'hasMentioned', defaultVal: false },
        m: { keyName: 'mentionedInfo', defaultVal: null },
        t: { keyName: 'lastUnreadTime', defaultVal: 0 },
        nc: { keyName: 'notificationStatus', defaultVal: 2 },
        to: { keyName: 'isTop', defaultVal: false },
        tg: { keyName: 'tags', defaultVal: {} }
    };
    const ConversationKey2StorageKey = {};
    for (const key in StorageKey2ConversationKey) {
        const keyName = StorageKey2ConversationKey[key].keyName;
        ConversationKey2StorageKey[keyName] = key;
    }
    /**
     * 存储再本地的 conversation 信息
     * 目前字段：
     *  未读数
     *  是否有 @  消息
     *  @ 内容
     *  免打扰状态
     *  置顶状态
     *  标签状态
     * 对应开发者字段
     *  unreadMessageCount
     *  hasMentioned
     *  mentionedInfo
     *  notificationStatus
     *  isTop
     *  tags
    */
    class ConversationStore {
        constructor(runtime, _appkey, _currentUserId) {
            this._appkey = _appkey;
            this._currentUserId = _currentUserId;
            const suffix = `con-${_appkey}-${_currentUserId}`;
            this.storage = new AppStorage(runtime, suffix);
        }
        _getStoreKey(type, targetId) {
            return `${type}_${targetId}`;
        }
        _getConOptionByKey(key) {
            key = key || '';
            const arr = key.split('_');
            if (arr.length >= 2) {
                return {
                    conversationType: arr[0],
                    targetId: key.match(/_.*/g)[0].substring(1)
                };
            }
            else {
                return {
                    conversationType: ConversationType$1.PRIVATE,
                    targetId: ''
                };
            }
        }
        /**
         * 更新 hasMentioned mentionedInfo 信息
        */
        updateMentionedData(message) {
            const { conversationType, targetId, messageType, isMentioned, content, senderUserId } = message;
            const key = this._getStoreKey(conversationType, targetId);
            const local = this.storage.get(key) || {};
            const storageMetionedInfoKey = ConversationKey2StorageKey.mentionedInfo;
            const storageHasMentionedKey = ConversationKey2StorageKey.hasMentioned;
            let updatedUserIdList = [];
            // let mentionedInfo = {}
            const localMentionedInfo = local[storageMetionedInfoKey] || {};
            const localUserIdList = localMentionedInfo.userIdList || [];
            let mentionedInfo = content.mentionedInfo;
            // 如果是 @ 消息, 且 @ 列表里有自己, 更新本地的 MentionInfo.userIdList
            if (isMentioned && conversationType === ConversationType$1.GROUP) {
                const receiveUserIdList = mentionedInfo.userIdList || [];
                receiveUserIdList.forEach(userId => {
                    if (userId === this._currentUserId && localUserIdList.indexOf(senderUserId) < 0) {
                        localUserIdList.push(senderUserId);
                    }
                });
                if (mentionedInfo.type === MentionedType$1.ALL && localUserIdList.indexOf(senderUserId) < 0) {
                    localUserIdList.push(senderUserId);
                }
                updatedUserIdList = localUserIdList;
            }
            // 如果是撤回 @ 消息, 更新本地 userIdList， userIdList 为空时更新 hasMentioned 为 false
            if (messageType === MessageType$1.RECALL && conversationType === ConversationType$1.GROUP) {
                const list = localUserIdList;
                localUserIdList.forEach((userId, index) => {
                    if (userId === senderUserId) {
                        list.splice(index, 1);
                    }
                });
                updatedUserIdList = list;
            }
            mentionedInfo = {
                userIdList: updatedUserIdList,
                type: mentionedInfo === null || mentionedInfo === void 0 ? void 0 : mentionedInfo.type
            };
            if (updatedUserIdList.length !== 0) {
                local[storageMetionedInfoKey] = mentionedInfo;
                local[storageHasMentionedKey] = true;
            }
            else {
                delete local[storageMetionedInfoKey];
                delete local[storageHasMentionedKey];
            }
            if (notEmptyObject(local)) {
                this.storage.set(key, local);
            }
            else {
                this.storage.remove(key);
            }
        }
        /**
         * 设置会话信息
        */
        set(type, targetId, conversation) {
            const key = this._getStoreKey(type, targetId);
            const local = this.storage.get(key) || {};
            for (const key in conversation) {
                const storageKey = ConversationKey2StorageKey[key];
                const val = conversation[key];
                if (isUndefined(storageKey) || isUndefined(val) || key === 'hasMentioned' || key === 'MentionedInfo') {
                    continue;
                }
                const defaultVal = StorageKey2ConversationKey[storageKey].defaultVal;
                if (val === defaultVal || (key === 'tags' && !notEmptyObject(val))) {
                    // 默认值不存储，避免占用存储空间。获取时未获取到的返回默认值
                    delete local[storageKey];
                }
                else if (key === 'tags') {
                    // 清空isTop:false的字段，减少占用空间
                    const _val = val;
                    for (const key in _val) {
                        if (!_val[key].isTop) {
                            delete _val[key].isTop;
                        }
                    }
                    local[storageKey] = val;
                }
                else {
                    local[storageKey] = val;
                }
                if (!local.c) {
                    // 清空未读数则清空最后操作未读时间，避免占用空间
                    delete local.t;
                }
            }
            if (notEmptyObject(local)) {
                this.storage.set(key, local);
            }
            else {
                this.storage.remove(key);
            }
        }
        /**
         * 获取单个会话本地存储信息
        */
        get(type, targetId) {
            const key = this._getStoreKey(type, targetId);
            const local = this.storage.get(key) || {};
            const conversation = {};
            for (const key in StorageKey2ConversationKey) {
                const { keyName, defaultVal } = StorageKey2ConversationKey[key];
                conversation[keyName] = local[key] || cloneByJSON(defaultVal);
            }
            return conversation;
        }
        /**
         * 获取所有会话信息
        */
        getValue(func) {
            const values = this.storage.getValues() || {};
            const storageConversationList = [];
            for (const key in values) {
                const { conversationType, targetId } = this._getConOptionByKey(key);
                let conversation = { conversationType, targetId };
                const store = values[key];
                for (const storeKey in store) {
                    const { keyName, defaultVal } = StorageKey2ConversationKey[storeKey];
                    conversation[keyName] = store[storeKey] || cloneByJSON(defaultVal);
                }
                conversation = func ? func(conversation) : conversation;
                storageConversationList.push(conversation);
            }
            return storageConversationList;
        }
        /**
         * 以标签为维度获取所有会话信息
        */
        getValueForTag() {
            const values = this.storage.getValues() || {};
            const tagObj = {};
            for (const key in values) {
                const { conversationType, targetId } = this._getConOptionByKey(key);
                const conversation = {};
                const store = values[key];
                for (const storeKey in store) {
                    const { keyName, defaultVal } = StorageKey2ConversationKey[storeKey];
                    conversation[keyName] = store[storeKey] || cloneByJSON(defaultVal);
                }
                // 以标签为维度重新组织
                for (const tagId in conversation.tags) {
                    if (isUndefined(tagObj[tagId])) {
                        tagObj[tagId] = [];
                    }
                    const _con = Object.assign({}, conversation, {
                        conversationType,
                        targetId
                    });
                    delete _con.tags;
                    tagObj[tagId].push(_con);
                }
            }
            return tagObj;
        }
    }

    const saveConversationType = [ConversationType$1.PRIVATE, ConversationType$1.GROUP, ConversationType$1.SYSTEM];
    const EventName$1 = {
        CHANGED: 'conversationChanged'
    };
    class ConversationManager {
        constructor(engine, appkey, userId, updatedConversationFunc) {
            this._updatedConversations = {};
            this._eventEmitter = new EventEmitter();
            this._draftMap = {};
            this._appkey = appkey;
            this._loginUserId = userId;
            this._store = new ConversationStore(engine.runtime, appkey, userId);
            this._statusManager = new ConversationStatus(engine, appkey, userId);
            this._statusManager.watch((data) => {
                const { statusItem, isLastPull } = data;
                this.addStatus(statusItem, isLastPull);
            });
            this._eventEmitter.on(EventName$1.CHANGED, (data) => {
                updatedConversationFunc(data);
            });
        }
        /**
         * 根据消息计算本地 localConversation 是否需要更新 和 更新的未读数
        */
        _calcUnreadCount(message, localConversation) {
            const { content, messageType, sentTime, isCounted, messageDirection, senderUserId } = message;
            const isSelfSend = messageDirection === MessageDirection$1.SEND && senderUserId === this._loginUserId;
            const isRecall = messageType === MessageType$1.RECALL;
            const hasContent = isObject(content);
            let hasChanged = false;
            const lastUnreadTime = localConversation.lastUnreadTime || 0;
            const unreadMessageCount = localConversation.unreadMessageCount || 0;
            const hasBeenAdded = lastUnreadTime > sentTime;
            // 自己发送的消息、已经计算过的消息 不更新本地存储
            if (hasBeenAdded || isSelfSend) {
                return { hasChanged, localConversation };
            }
            // 计数的消息，未读数 + 1
            if (isCounted) {
                localConversation.unreadMessageCount = unreadMessageCount + 1;
                localConversation.lastUnreadTime = sentTime;
                hasChanged = true;
            }
            // 测回的消息 且 符合撤回消息内容格式（ 撤回消息 content: {conversationType, targetId, messageUId, sentTime} ）
            if (isRecall && hasContent) {
                const isNotRead = lastUnreadTime >= content.sentTime;
                if (isNotRead && unreadMessageCount) {
                    localConversation.unreadMessageCount = unreadMessageCount - 1;
                    hasChanged = true;
                }
            }
            return { hasChanged, localConversation };
        }
        /**
         * 根据消息计算本地 localConversation 是否需要更新 和 更新的 mentionedInfo
        */
        _calcMentionedInfo(message, localConversation) {
            const { content, messageDirection, isMentioned } = message;
            messageDirection === MessageDirection$1.SEND;
            const hasContent = isObject(content);
            let hasChanged = false;
            if (isMentioned && hasContent && content.mentionedInfo) {
                localConversation.hasMentioned = true;
                // localConversation.mentionedInfo = (content.mentionedInfo as unknown as IMentionInfo)
                hasChanged = true;
            }
            return { hasChanged, localConversation };
        }
        /**
         * 更新内存中 updatedConversation 字段
        */
        _setUpdatedConversation(updatedConOptions) {
            if (isObject(updatedConOptions)) {
                const { conversationType, targetId } = updatedConOptions;
                const key = `${conversationType}_${targetId}`;
                const cacheConversation = this._store.get(conversationType, targetId) || {};
                this._updatedConversations[key] = Object.assign(cacheConversation, updatedConOptions);
            }
        }
        addStatus(statusItem, isLastPull) {
            const { conversationType, targetId, updatedTime, notificationStatus, isTop, tags } = statusItem;
            const tagValue = {};
            const updatedItems = {};
            if (!isUndefined(notificationStatus)) {
                updatedItems.notificationStatus = { time: updatedTime, val: notificationStatus };
            }
            if (!isUndefined(isTop)) {
                updatedItems.isTop = { time: updatedTime, val: isTop };
            }
            if (!isUndefined(tags)) {
                updatedItems.tags = { time: updatedTime, val: tags };
                tags === null || tags === void 0 ? void 0 : tags.forEach((tag) => {
                    tagValue[tag.tagId] = {
                        isTop: tag.isTop
                    };
                });
            }
            this._store.set(conversationType, targetId, {
                notificationStatus,
                isTop,
                tags: tagValue
            });
            this._setUpdatedConversation({
                conversationType,
                targetId,
                updatedItems
            });
            if (isLastPull) {
                this._notifyConversationChanged();
            }
        }
        /**
         * 通知会话更新
         * @description
         * 通知的条件: 会话状态变化、会话未读数变化（未读数增加、未读数清空）、会话 @ 信息（hasMentioned、mentionedInfo）、？会话最后一条消息
        */
        _notifyConversationChanged() {
            const list = [];
            for (const key in this._updatedConversations) {
                list.push(this._updatedConversations[key]);
            }
            this._eventEmitter.emit(EventName$1.CHANGED, list);
            this._updatedConversations = {};
        }
        /**
         * 根据消息向 localstorage 设置会话未读数、会话 @ 信息（ hasMentioned、MentionedInfo ）、会话状态（ 置顶、免打扰 ）
         * @description
         * 调用时机：1、收到消息后 2、发消息成功后 3、发送撤回消息成功后
        */
        setConversationCacheByMessage(message, isPullMessageFinished) {
            // 若不是存储会话的类型(比如: 聊天室类型), 则不作处理
            const { conversationType, isPersited, targetId } = message;
            const isSaveConversationType = saveConversationType.indexOf(conversationType) >= 0;
            if (!isSaveConversationType) {
                return;
            }
            let hasChanged = false;
            let storageConversation = this._store.get(conversationType, targetId);
            // 计算本地存储
            const CalcEvents = [this._calcUnreadCount, this._calcMentionedInfo];
            CalcEvents.forEach((func) => {
                const { hasChanged: hasCaclChanged, localConversation } = func.call(this, message, storageConversation);
                hasChanged = hasChanged || hasCaclChanged;
                storageConversation = cloneByJSON(localConversation);
            });
            if (hasChanged) {
                this._store.set(conversationType, targetId, storageConversation);
            }
            this._store.updateMentionedData(message);
            // 写入会话缓存中
            if (isPersited) {
                const conversation = this._store.get(conversationType, targetId);
                conversation.updatedItems = {
                    latestMessage: {
                        time: message.sentTime,
                        val: message
                    }
                };
                conversation.latestMessage = message;
                const updateConOptions = Object.assign(conversation, { conversationType, targetId });
                this._setUpdatedConversation(updateConOptions);
            }
            // 是否需要通知， 通知 API Context 本地会话变更
            if (isPullMessageFinished) {
                this._notifyConversationChanged();
            }
        }
        /**
         * 获取会话本地存储信息
        */
        get(conversationType, targetId) {
            return this._store.get(conversationType, targetId);
        }
        /**
         * 获取本地会话所有未读数
        */
        getAllUnreadCount(channelId, conversationTypes, includeMuted) {
            // TODO: 获取所有未读数需支持多组织、会话类型、免打扰过滤
            const conversationList = this._store.getValue();
            let totalCount = 0;
            conversationList.forEach(({ unreadMessageCount }) => {
                unreadMessageCount = unreadMessageCount || 0;
                totalCount += Number(unreadMessageCount);
            });
            return totalCount;
        }
        /**
         * 获取本地会话指定标签下的所有未读数
        */
        getUnreadCountByTag(tagId, containMuted) {
            const tagAll = this._store.getValueForTag();
            const conversationList = tagAll[tagId] || [];
            let totalCount = 0;
            conversationList.forEach(({ unreadMessageCount, notificationStatus }) => {
                // 包含免打扰
                if (containMuted || notificationStatus !== 1) {
                    unreadMessageCount = unreadMessageCount || 0;
                    totalCount += Number(unreadMessageCount);
                }
            });
            return totalCount;
        }
        /**
         * 获取本地指定会话未读数
        */
        getUnreadCount(conversationType, targetId) {
            const conversation = this._store.get(conversationType, targetId);
            return conversation.unreadMessageCount || 0;
        }
        /**
         * 清除本地指定会话未读数
        */
        clearUnreadCount(conversationType, targetId) {
            const conversation = this._store.get(conversationType, targetId);
            const { unreadMessageCount, hasMentioned } = conversation;
            if (unreadMessageCount || hasMentioned) {
                conversation.unreadMessageCount = 0;
                conversation.hasMentioned = false;
                // conversation.mentionedInfo = null
            }
            this._store.set(conversationType, targetId, conversation);
            const updateConOptions = Object.assign(conversation, { conversationType, targetId });
            this._setUpdatedConversation(updateConOptions);
            this._notifyConversationChanged();
        }
        startPullConversationStatus(time) {
            this._statusManager.pull(time);
        }
        /**
         * 设置会话消息草稿
        */
        setDraft(conversationType, targetId, draft) {
            const key = `${conversationType}_${targetId}`;
            this._draftMap[key] = draft;
        }
        /**
         * 获取会话消息草稿
        */
        getDraft(conversationType, targetId) {
            const key = `${conversationType}_${targetId}`;
            return this._draftMap[key];
        }
        /**
         * 删除会话消息草稿
        */
        clearDraft(conversationType, targetId) {
            const key = `${conversationType}_${targetId}`;
            delete this._draftMap[key];
        }
        /**
         * 向本地会话状态中添加标签, 更新标签状态
         * @param conversationType 会话类型
         * @param targetId 会话id
         * @param tags 标签状态
         */
        addTagStatus(conversationType, targetId, tags) {
            const conversation = this._store.get(conversationType, targetId);
            let { tags: _tags } = conversation;
            _tags = Object.assign(_tags, tags);
            this._store.set(conversationType, targetId, { tags: _tags });
        }
        /**
         * 删除会话上的指定标签
         */
        deleteTagStatus(conversationType, targetId, tagIds) {
            const { tags } = this._store.get(conversationType, targetId);
            tagIds.forEach((id) => {
                delete tags[id];
            });
            this._store.set(conversationType, targetId, { tags });
        }
        /**
         * 以标签为维度获取会话状态列表
         */
        getConversationListForTag() {
            return this._store.getValueForTag();
        }
    }

    var UploadMethod;
    (function (UploadMethod) {
        /**
         * 七牛上传
         */
        UploadMethod[UploadMethod["QINIU"] = 1] = "QINIU";
        /**
         * 阿里云上传
         */
        UploadMethod[UploadMethod["ALI"] = 2] = "ALI";
        /**
         * 亚马逊上传
         */
        UploadMethod[UploadMethod["AWS"] = 3] = "AWS";
        /**
         * stc上传
         */
        UploadMethod[UploadMethod["STC"] = 4] = "STC";
    })(UploadMethod || (UploadMethod = {}));
    var UploadMethod$1 = UploadMethod;

    /**
     * 本地标签信息管理
     */
    class TagManager {
        constructor(engine, appKey, currentUserId, tagWatcherFunc) {
            this._pullQueue = [];
            this._isPulling = false;
            this._storageKey = `tag-${appKey}-${currentUserId}`;
            this._storagePullTimeKey = `tag-s-${appKey}-${currentUserId}`;
            this._storage = createRootStorage(engine.runtime);
            this._engine = engine;
            this._tagWatcherFunc = tagWatcherFunc;
        }
        /**
         * 根据用户配置设置更新本地标签 并 通知业务层(pb中的status无效，都是全量返回)
         * @param tagsSetting 用户配置设置
         */
        _updateTag(tagsSetting) {
            const { tags } = tagsSetting;
            const localTags = {};
            tags.forEach((tag) => {
                localTags[tag.tagId] = {
                    tagName: tag.tagName,
                    createdTime: tag.createdTime
                };
            });
            this._storage.set(this._storageKey, localTags);
            this._tagWatcherFunc();
        }
        /**
         * 添加标签，如果本地存在则更新
         * @param tags 标签列表
         */
        addTag(tags) {
            const localTags = this._storage.get(this._storageKey) || {};
            tags.forEach((tag) => {
                var _a;
                const createdTime = ((_a = localTags[tag.tagId]) === null || _a === void 0 ? void 0 : _a.createdTime) || tag.createdTime || 0;
                localTags[tag.tagId] = {
                    tagName: tag.tagName,
                    createdTime: createdTime
                };
            });
            this._storage.set(this._storageKey, localTags);
        }
        /**
         * 删除本地标签
         * @param tagId 标签id
         */
        deleteTag(tagIds) {
            const localTags = this._storage.get(this._storageKey) || {};
            tagIds.forEach((tagId) => {
                delete localTags[tagId];
            });
            this._storage.set(this._storageKey, localTags);
        }
        /**
         * 获取本地存储标签信息
         */
        getTagsInfo() {
            return this._storage.get(this._storageKey) || {};
        }
        /**
         * 获取本地标签列表
         */
        getTags() {
            const localTags = this._storage.get(this._storageKey) || {};
            const list = [];
            for (const tagId in localTags) {
                list.push({
                    tagId: tagId,
                    tagName: localTags[tagId].tagName,
                    createdTime: localTags[tagId].createdTime,
                    conversationCount: 0 // 真实数据在jsEngine里赋值
                });
            }
            function compare(a, b) {
                return (a.createdTime || 0) - (b.createdTime || 0);
            }
            return list.sort(compare);
        }
        /**
         * 获取指定标签
         */
        getTagById(tagId) {
            const localTags = this._storage.get(this._storageKey) || {};
            return localTags[tagId] ? {
                tagId: tagId,
                tagName: localTags[tagId].tagName,
                createdTime: localTags[tagId].createdTime,
                conversationCount: 0
            } : null;
        }
        _startPull() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._isPulling || this._pullQueue.length === 0) {
                    return;
                }
                this._isPulling = true;
                const time = this._pullQueue.splice(0, 1)[0];
                const { code, data } = yield this._engine.pullUserSettings(time);
                if (code === ErrorCode$1.SUCCESS && !isUndefined(data)) {
                    const { settings, version } = data;
                    const tagsSetting = settings.Tag || { tags: [] };
                    this._updateTag(tagsSetting);
                    this._storage.set(this._storagePullTimeKey, version);
                    this._isPulling = false;
                    this._startPull();
                }
                else {
                    this._isPulling = false;
                    this._startPull();
                }
            });
        }
        /**
         * 拉取服务器标签列表
         * @param time
         */
        pullTags(newPullTime) {
            const time = this._storage.get(this._storagePullTimeKey) || 0;
            if (newPullTime > time || newPullTime === 0) {
                this._pullQueue.push(time);
                this._startPull();
            }
        }
    }

    class JsNavi extends ANavi {
        constructor(_runtime, _options) {
            super(_runtime, _options);
            this._connectType = _options.connectionType;
        }
        _formatJSONPUrl(url, token, appkey, jsonpFunc) {
            const path = this._runtime.isSupportSocket() && (this._connectType === 'websocket') ? 'navi' : 'cometnavi';
            const tmpUrl = `${url}/${path}.js?appId=${appkey}&token=${encodeURIComponent(token)}&callBack=${jsonpFunc}&v=${this._apiVersion}&r=${Date.now()}`;
            return tmpUrl;
        }
        getInfo(token, dynamicUris, force) {
            const _super = Object.create(null, {
                getInfo: { get: () => super.getInfo }
            });
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                // 微信小程序直接返值，不需请求导航
                if (!this._runtime.useNavi) {
                    let connectUrl;
                    if (this._runtime.isSupportSocket()) {
                        connectUrl = MINI_SOCKET_CONNECT_URIS.join(',');
                    }
                    else {
                        connectUrl = MINI_COMET_CONNECT_URIS.join(',');
                    }
                    const naviInfo = {
                        code: 200,
                        protocol: 'https',
                        server: '',
                        voipCallInfo: '',
                        kvStorage: 0,
                        openHttpDNS: false,
                        historyMsg: false,
                        chatroomMsg: false,
                        uploadServer: 'https://upload.qiniup.com',
                        bosAddr: 'https://gz.bcebos.com',
                        location: '',
                        monitor: 0,
                        joinMChrm: false,
                        openMp: 0,
                        openUS: 0,
                        grpMsgLimit: 0,
                        isFormatted: 0,
                        gifSize: 2048,
                        logSwitch: 0,
                        logPolicy: '',
                        compDays: 0,
                        msgAck: '',
                        activeServer: '',
                        qnAddr: '',
                        extkitSwitch: 0,
                        alone: false,
                        voipServer: '',
                        offlinelogserver: '',
                        backupServer: ((_a = this._options.miniCMPProxy) === null || _a === void 0 ? void 0 : _a.length) ? this._options.miniCMPProxy.join(',') : connectUrl
                    };
                    this.setNaviInfo2Cache(token, naviInfo);
                    return naviInfo;
                }
                return _super.getInfo.call(this, token, dynamicUris, force);
            });
        }
        _reqNavi(uris, appkey, token) {
            return __awaiter(this, void 0, void 0, function* () {
                const jsonpFunc = 'getServerEndpoint';
                for (let i = 0, len = uris.length; i < len; i += 1) {
                    const url = this._formatJSONPUrl(uris[i], token, appkey, jsonpFunc);
                    logger.debug(`req navi => ${url}`);
                    const res = yield this._runtime.httpReq({
                        url,
                        timeout: NAVI_REQ_TIMEOUT
                    });
                    if (res.status !== 200) {
                        continue;
                    }
                    try {
                        // 返回结果中，私有云无 ; 号，公有云有分号
                        // 解析 res 数据，解析成功则返回 naviInfo 数据
                        const jsonStr = res.data.replace(`${jsonpFunc}(`, '').replace(/\);?$/, '');
                        const naviInfo = JSON.parse(jsonStr);
                        // 补充导航数据请求使用的协议
                        const protocol = /^https/.test(url) ? 'https' : 'http';
                        naviInfo.protocol = protocol;
                        return naviInfo;
                    }
                    catch (err) {
                        logger.error('parse navi err =>', err);
                    }
                }
                return null;
            });
        }
    }

    const getPubTopic = (type) => {
        return {
            [ConversationType$1.PRIVATE]: Topic$1.ppMsgP,
            [ConversationType$1.GROUP]: Topic$1.pgMsgP,
            [ConversationType$1.CHATROOM]: Topic$1.chatMsg,
            [ConversationType$1.CUSTOMER_SERVICE]: Topic$1.pcMsgP,
            [ConversationType$1.RTC_ROOM]: Topic$1.prMsgS
        }[type];
    };
    const getStatPubTopic = (type) => {
        return {
            [ConversationType$1.PRIVATE]: Topic$1.ppMsgS,
            [ConversationType$1.GROUP]: Topic$1.pgMsgS
        }[type];
    };
    const transSentAttrs2IReceivedMessage = (conversationType, targetId, options, messageUId, sentTime, senderUserId) => {
        return {
            conversationType,
            targetId,
            senderUserId,
            messageDirection: MessageDirection$1.SEND,
            isCounted: !!options.isCounted,
            isMentioned: !!options.isMentioned,
            content: options.content,
            messageType: options.messageType,
            isOffLineMessage: false,
            isPersited: !!options.isPersited,
            messageUId,
            sentTime,
            receivedTime: 0,
            disableNotification: !!options.disableNotification,
            isStatusMessage: !!options.isStatusMessage,
            canIncludeExpansion: !!options.canIncludeExpansion,
            expansion: options.canIncludeExpansion ? options.expansion : null,
            receivedStatus: ReceivedStatus$1.UNREAD // 发送消息成功返回的 接收状态默认为 未读
        };
    };
    /**
     * @description
     * 处理群已读同步消息逻辑：即时用户传 directionalUserIdList 也强制修改为当前登录用户。群内其他人接收无意义
    */
    const handleInnerMsgOptions = (options, currentUserId) => {
        const { messageType } = options;
        if (messageType === 'RC:SRSMsg') {
            Object.assign(options, {
                directionalUserIdList: [currentUserId]
            });
        }
        return options;
    };
    class JSEngine extends AEngine {
        constructor(runtime, watcher, initOptions) {
            super(runtime, watcher, initOptions);
            this._customMessageType = {};
            this._connectedTime = 0;
            /**
             * 拉取离线消息标记
             */
            this._pullingMsg = false;
            /**
             * 收到的所有消息拉取通知事件戳队列
             */
            this._pullQueue = [];
            /**
             * 聊天室消息拉取通知队列
             */
            this._chrmsQueue = {};
            // 初始化信箱
            this._letterbox = new Letterbox(runtime, initOptions.appkey);
            // 初始化 Chrm KV 处理
            this._chrmEntryHandler = new ChrmEntryHandler(this);
        }
        _createNavi() {
            return new JsNavi(this.runtime, this._options);
        }
        getConnectedTime() {
            return this._connectedTime;
        }
        connect(token, naviInfo) {
            return __awaiter(this, void 0, void 0, function* () {
                const hosts = [];
                this._naviInfo = naviInfo;
                if (naviInfo.server) {
                    hosts.push(naviInfo.server);
                }
                else {
                    // 私有云无法保证客户环境 Navi 配置有效性
                    logger.warn('navi.server is invalid');
                }
                const backupServer = naviInfo.backupServer;
                // 备用服务有效性验证与排重
                backupServer && backupServer.split(',').forEach(host => {
                    if (hosts.indexOf(host) < 0) {
                        hosts.push(host);
                    }
                });
                if (hosts.length === 0) {
                    logger.error('navi invaild.', hosts);
                    return ErrorCode$1.UNKNOWN;
                }
                // 创建数据通道
                const channel = this.runtime.createDataChannel({
                    status: (status) => {
                        this._connectionStatusHandler(status, token, hosts, naviInfo.protocol);
                    },
                    signal: this._signalHandler.bind(this)
                }, this._options.connectionType);
                // 建立连接
                const code = yield channel.connect(this._appkey, token, hosts, naviInfo.protocol, this._apiVer);
                if (code === ErrorCode$1.SUCCESS) {
                    this._channel = channel;
                    this.currentUserId = channel.userId;
                    this._connectedTime = channel.connectedTime;
                    this._conversationManager = new ConversationManager(this, this._appkey, this.currentUserId, this._watcher.conversation);
                    this._conversationManager.startPullConversationStatus(0);
                    this._tagManager = new TagManager(this, this._appkey, this.currentUserId, this._watcher.tag);
                    this._tagManager.pullTags(0);
                    // 初始化加入 chrm 的信息
                    this._joinedChrmManager = new JoinedChrmManager(this.runtime, this._appkey, this.currentUserId, naviInfo.joinMChrm);
                    // 拉取离线消息
                    this._syncMsg();
                }
                else {
                    channel.close();
                }
                return code;
            });
        }
        _connectionStatusHandler(status, token, hosts, protocol) {
            logger.warn('connection status changed:', status);
            if (status === ConnectionStatus$1.CONNECTING || status === ConnectionStatus$1.CONNECTED) {
                this._watcher.status(status);
                return;
            }
            if (!this._channel || status === ConnectionStatus$1.DISCONNECTED) {
                // 用户主动断开连接，直接抛出连接状态
                this._watcher.status(status);
                return;
            }
            if (status === ConnectionStatus$1.BLOCKED ||
                status === ConnectionStatus$1.KICKED_OFFLINE_BY_OTHER_CLIENT ||
                status === ConnectionStatus$1.DISCONNECT_BY_SERVER) {
                // 用户被封禁，或多端被踢下线，或其他服务器原因通知断开
                this.disconnect();
                this._watcher.status(status);
                return;
            }
            if (status === ConnectionStatus$1.REDIRECT) {
                // TODO: 需重定向
                return;
            }
            // 异常断开，尝试重连
            this._try2Reconnect(token, hosts, protocol);
        }
        _try2Reconnect(token, hosts, protocol) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return;
                }
                const code = yield this._channel.connect(this._appkey, token, hosts, protocol, this._apiVer);
                if (code === ErrorCode$1.SUCCESS) {
                    this._rejoinChrm();
                    return;
                }
                this._watcher.status(ConnectionStatus$1.WEBSOCKET_UNAVAILABLE);
                // 等待 5s 后重新尝试
                setTimeout(() => {
                    this._try2Reconnect(token, hosts, protocol);
                }, 5000);
            });
        }
        _signalHandler(signal, ack) {
            const { syncMsg, topic } = signal;
            if (syncMsg) {
                // 此消息为本人其他端发出的消息，此处为多端消息同步
                this._receiveSyncMsg(signal, ack);
                return;
            }
            const tmpTopic = Topic$1[topic];
            if (!tmpTopic) {
                logger.error('unknown topic:', topic);
                return;
            }
            switch (tmpTopic) {
                case Topic$1.s_ntf:
                    this._pullMsg(signal); // 通知拉取
                    break;
                case Topic$1.s_msg:
                    this._receiveMsg(signal); // 接收直发消息
                    break;
                case Topic$1.s_cmd:
                    this._receiveStateNotify(signal);
                    break;
                case Topic$1.s_us:
                    this._receiveSettingNotify(signal);
                    break;
            }
        }
        /**
         * 接收聊天室 kv 通知与会话状态变更通知
         * @param signal
         */
        _receiveStateNotify(signal) {
            var _a;
            const { time, type, chrmId } = (_a = this._channel) === null || _a === void 0 ? void 0 : _a.codec.decodeByPBName(signal.data, PBName.NotifyMsg);
            switch (type) {
                case 2:
                    this._chrmEntryHandler.pullEntry(chrmId, time);
                    break;
                case 3:
                    this._conversationManager.startPullConversationStatus(time);
                    break;
            }
        }
        /**
         * 接收实时配置变更通知
         * @param signal
         */
        _receiveSettingNotify(signal) {
            var _a;
            // comet模式未加这个通知
            if (this._options.connectionType === 'comet')
                return;
            const { version } = (_a = this._channel) === null || _a === void 0 ? void 0 : _a.codec.decodeByPBName(signal.data, PBName.UserSettingNotification);
            this._tagManager.pullTags(version);
        }
        /**
         * 通知 API Content 扩展变更
        */
        _receiveMessageExpansion(message) {
            const { content } = message;
            const { put, del, mid } = content;
            if (put) {
                this._watcher.expansion({
                    updatedExpansion: {
                        messageUId: mid,
                        expansion: put
                    }
                });
            }
            if (del) {
                this._watcher.expansion({
                    deletedExpansion: {
                        messageUId: mid,
                        deletedKeys: del
                    }
                });
            }
        }
        /**
         * 接收多端同步消息
         * @param signal
         * @param ack 同步消息的 ack 信令数据，comet 连接无此数据
         */
        _receiveSyncMsg(signal, ack) {
            var _a;
            let msg = (_a = this._channel) === null || _a === void 0 ? void 0 : _a.codec.decodeByPBName(signal.data, PBName.UpStreamMessage, {
                currentUserId: this.currentUserId, signal
            });
            msg = this._handleMsgProperties(msg);
            // 更新消息并通知业务层
            msg.sentTime = ack.timestamp;
            msg.messageUId = ack.messageUId;
            // 当前正在拉取消息过程中，不需要同步直发消息到业务层，向拉取队列中重新添加一个时间戳等待当前拉取动作完成后递归拉取
            if (this._pullingMsg) {
                this._pullQueue.push(ack.timestamp);
                return;
            }
            // 更新发件箱时间
            this._letterbox.setOutboxTime(ack.timestamp, this.currentUserId);
            if (msg.messageType === MessageType$1.EXPANSION_NOTIFY) {
                this._receiveMessageExpansion(msg);
                return;
            }
            this._watcher.message(msg);
            this._conversationManager.setConversationCacheByMessage(msg, true);
        }
        /**
         * 拉取消息
         * @description 聊天室消息与普通消息都是通知拉取
         * @param signal
         */
        _pullMsg(signal) {
            if (!this._channel) {
                return;
            }
            const { type, chrmId, time } = this._channel.codec.decodeByPBName(signal.data, PBName.NotifyMsg);
            if (type === 2) {
                const info = this._chrmsQueue[chrmId];
                // 拉取通知可能是由于多端中其他端接收通知拉取
                if (!info) {
                    return;
                }
                info.queue.push(time);
                this._pullChrmMsg(chrmId);
            }
            else {
                // 记录消息拉取通知的时间戳
                this._pullQueue.push(time);
                this._syncMsg();
            }
        }
        /**
         * 拉取消息：离线 Or 通知拉取
         */
        _syncMsg() {
            return __awaiter(this, void 0, void 0, function* () {
                // 拉取中，队列等待
                if (this._pullingMsg) {
                    return;
                }
                if (!this._channel) {
                    // 连接中断，无需拉取离线消息
                    this._pullingMsg = false;
                    return;
                }
                this._pullingMsg = true;
                // 获取消息时间戳
                const outboxTime = this._letterbox.getOutboxTime(this.currentUserId);
                const inboxTime = this._letterbox.getInboxTime(this.currentUserId);
                logger.debug('outboxTime', outboxTime);
                logger.debug('inboxTime', inboxTime);
                const reqBody = this._channel.codec.encodeSyncMsg({ sendboxTime: outboxTime, inboxTime });
                const writer = new QueryWriter(Topic$1[Topic$1.pullMsg], reqBody, this.currentUserId);
                const { code, data } = yield this._channel.send(writer, PBName.DownStreamMessages, {
                    connectedTime: this._channel.connectedTime,
                    currentUserId: this.currentUserId
                });
                if (code !== ErrorCode$1.SUCCESS || !data) {
                    logger.warn('Pull msg failed, code:', code, ', data: ', data);
                    this._pullingMsg = false;
                    return;
                }
                const { list, finished, syncTime } = data;
                let newOutboxTime = 0;
                // let newInboxTime = 0
                // 派发消息
                list.forEach(item => {
                    if (item.messageDirection === MessageDirection$1.SEND) {
                        newOutboxTime = Math.max(item.sentTime, newOutboxTime);
                    }
                    // else {
                    //   newInboxTime = Math.max(item.sentTime, newInboxTime)
                    // }
                    if (item.messageType === MessageType$1.EXPANSION_NOTIFY) {
                        this._receiveMessageExpansion(item);
                        return;
                    }
                    this._watcher.message(item);
                    this._conversationManager.setConversationCacheByMessage(item, true);
                });
                // 更新收件箱时间
                // this.letterbox.setInboxTime(newInboxTime, this.currentUserId)
                this._letterbox.setInboxTime(syncTime, this.currentUserId);
                // 更新发件箱时间
                this._letterbox.setOutboxTime(newOutboxTime, this.currentUserId);
                this._pullingMsg = false;
                // 清除较 syncTime 更早的拉取通知时间戳
                const tmpPullQueue = this._pullQueue.filter(timestamp => timestamp > syncTime);
                this._pullQueue.length = 0;
                this._pullQueue.push(...tmpPullQueue);
                if (!finished || tmpPullQueue.length > 0) {
                    // 继续拉取
                    this._syncMsg();
                }
            });
        }
        /**
         * 接收直发消息
         * @description 直发消息只有单聊、群聊存在，其他会话类型均为通知拉取
         * @param signal
         */
        _receiveMsg(signal) {
            if (!this._channel) {
                return;
            }
            // 当在拉取单群聊离线过程中，直发消息可直接抛弃
            if (this._pullingMsg) {
                return;
            }
            let msg = this._channel.codec.decodeByPBName(signal.data, PBName.DownStreamMessage, {
                currentUserId: this.currentUserId, connectedTime: this._channel.connectedTime
            });
            msg = this._handleMsgProperties(msg);
            // 状态消息不更新收件箱时间
            if (!msg.isStatusMessage) {
                // 更新收件箱时间
                this._letterbox.setInboxTime(msg.sentTime, this.currentUserId);
            }
            if (msg.messageType === MessageType$1.EXPANSION_NOTIFY) {
                this._receiveMessageExpansion(msg);
                return;
            }
            this._watcher.message(msg);
            this._conversationManager.setConversationCacheByMessage(msg, true);
        }
        /**
         * 向 API Context 抛出消息时，处理消息的部分属性值
         * @description
         * 当前仅根据内置消息或自定义类型的消息处理消息的存储、计数属性
        */
        _handleMsgProperties(msgOptions, isSendMsg = false) {
            const { messageType, isCounted, isPersited, isStatusMessage } = msgOptions;
            let options;
            const inRCMessageType = messageType in SEND_MESSAGE_TYPE_OPTION;
            const inCustomMessageType = messageType in this._customMessageType;
            if (inRCMessageType) { // 内置消息
                options = SEND_MESSAGE_TYPE_OPTION[messageType];
            }
            else if (inCustomMessageType) { // 自定义消息
                options = this._customMessageType[messageType];
            }
            else { // 其他消息, 发消息已传参为准, 无参数默认 false. 收消息已服务端微赚
                options = {
                    isCounted: isNull(isCounted) ? false : isCounted,
                    isPersited: isNull(isPersited) ? false : isPersited
                };
            }
            Object.assign(msgOptions, {
                isCounted: options.isCounted,
                isPersited: options.isPersited,
                isStatusMessage: !(msgOptions.isCounted && msgOptions.isPersited)
            });
            isSendMsg && (msgOptions.isStatusMessage = isStatusMessage);
            return msgOptions;
        }
        getHistoryMessage(conversationType, targetId, timestamp, count, order) {
            return __awaiter(this, void 0, void 0, function* () {
                const { currentUserId, _channel: channel } = this;
                const hisTopic = ConversationTypeToQueryHistoryTopic[conversationType] || QueryHistoryTopic.PRIVATE;
                if (channel) {
                    const data = channel.codec.encodeGetHistoryMsg(targetId, { timestamp, count, order });
                    const resp = yield channel.send(new QueryWriter(hisTopic, data, currentUserId), PBName.HistoryMsgOuput, {
                        currentUserId, connectedTime: channel.connectedTime, conversation: { targetId }
                    });
                    const { code } = resp;
                    if (code !== ErrorCode$1.SUCCESS) {
                        return { code };
                    }
                    // 解析数据转换为业务层数据结构
                    const downstreamData = resp.data;
                    return {
                        code,
                        data: { list: downstreamData.list, hasMore: downstreamData.hasMore }
                    };
                }
                return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
            });
        }
        deleteRemoteMessage(conversationType, targetId, list) {
            return __awaiter(this, void 0, void 0, function* () {
                const { currentUserId, _channel: channel } = this;
                if (channel) {
                    const data = channel.codec.encodeDeleteMessages(conversationType, targetId, list);
                    const writer = new QueryWriter(QueryTopic.DELETE_MESSAGES, data, currentUserId);
                    const resp = yield channel.send(writer);
                    const { code } = resp;
                    if (code !== ErrorCode$1.SUCCESS) {
                        return code;
                    }
                    return code;
                }
                return ErrorCode$1.RC_NET_CHANNEL_INVALID;
            });
        }
        deleteRemoteMessageByTimestamp(conversationType, targetId, timestamp) {
            return __awaiter(this, void 0, void 0, function* () {
                const { currentUserId, _channel: channel } = this;
                if (channel) {
                    const data = channel.codec.encodeClearMessages(targetId, timestamp);
                    const topic = ConversationTypeToClearMessageTopic[conversationType];
                    const writer = new QueryWriter(topic, data, currentUserId);
                    const resp = yield channel.send(writer);
                    const { code } = resp;
                    if (code !== ErrorCode$1.SUCCESS) {
                        return code;
                    }
                    return code;
                }
                return ErrorCode$1.RC_NET_CHANNEL_INVALID;
            });
        }
        getConversationList(count = 300, conversationType, startTime, order) {
            return __awaiter(this, void 0, void 0, function* () {
                const { currentUserId, _channel: channel } = this;
                // conversationType 服务端未用到此字段，直接返回所有类型
                conversationType = conversationType || ConversationType$1.PRIVATE;
                if (channel) {
                    const buff = channel.codec.encodeOldConversationList({ count, type: conversationType, startTime, order });
                    const writer = new QueryWriter(QueryTopic.GET_OLD_CONVERSATION_LIST, buff, currentUserId);
                    const resp = yield channel.send(writer, PBName.RelationsOutput, {
                        currentUserId,
                        connectedTime: channel.connectedTime,
                        afterDecode: (conversation) => {
                            const { conversationType, targetId } = conversation;
                            const localConversation = this._conversationManager.get(conversationType, targetId);
                            // 将本地存储的会话属性和从 Server 获取到的会话属性进行合并
                            Object.assign(conversation, localConversation);
                            return conversation;
                        }
                    });
                    logger.info('GetConversationList =>', resp);
                    const { code, data } = resp;
                    if (code !== ErrorCode$1.SUCCESS) {
                        return { code };
                    }
                    return {
                        code,
                        data: data
                    };
                }
                return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
            });
        }
        removeConversation(conversationType, targetId) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel } = this;
                if (channel) {
                    const data = channel.codec.encodeOldConversationList({ type: conversationType });
                    const writer = new QueryWriter(QueryTopic.REMOVE_OLD_CONVERSATION, data, targetId);
                    const resp = yield channel.send(writer);
                    logger.info('RemoveConversation =>', resp);
                    const { code } = resp;
                    if (code !== ErrorCode$1.SUCCESS) {
                        return code;
                    }
                    return code;
                }
                return ErrorCode$1.RC_NET_CHANNEL_INVALID;
            });
        }
        getConversation(conversationType, targetId, tag) {
            throw new Error('Method not implemented.');
        }
        getAllConversationUnreadCount(channelId, conversationTypes, includeMuted) {
            const allUnreadCount = this._conversationManager.getAllUnreadCount(channelId, conversationTypes, includeMuted);
            return Promise.resolve({
                code: ErrorCode$1.SUCCESS,
                data: allUnreadCount
            });
        }
        getConversationUnreadCount(conversationType, targetId) {
            const unreadCount = this._conversationManager.getUnreadCount(conversationType, targetId);
            return Promise.resolve({
                code: ErrorCode$1.SUCCESS,
                data: unreadCount
            });
        }
        clearConversationUnreadCount(conversationType, targetId) {
            this._conversationManager.clearUnreadCount(conversationType, targetId);
            return Promise.resolve(ErrorCode$1.SUCCESS);
        }
        saveConversationMessageDraft(conversationType, targetId, draft) {
            this._conversationManager.setDraft(conversationType, targetId, draft);
            return Promise.resolve(ErrorCode$1.SUCCESS);
        }
        getConversationMessageDraft(conversationType, targetId) {
            const draft = this._conversationManager.getDraft(conversationType, targetId);
            return Promise.resolve({
                code: ErrorCode$1.SUCCESS,
                data: draft
            });
        }
        clearConversationMessageDraft(conversationType, targetId) {
            this._conversationManager.clearDraft(conversationType, targetId);
            return Promise.resolve(ErrorCode$1.SUCCESS);
        }
        pullConversationStatus(timestamp) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel, currentUserId } = this;
                if (channel) {
                    const buff = channel.codec.encodeGetConversationStatus(timestamp);
                    const writer = new QueryWriter(Topic$1[Topic$1.pullSeAtts], buff, currentUserId);
                    const resp = yield channel.send(writer, PBName.SessionStates);
                    const { code, data } = resp;
                    if (code !== ErrorCode$1.SUCCESS) {
                        return { code };
                    }
                    return { code, data: data };
                }
                return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
            });
        }
        batchSetConversationStatus(statusList) {
            return __awaiter(this, void 0, void 0, function* () {
                const { currentUserId, _channel: channel } = this;
                if (channel) {
                    const buff = channel.codec.encodeSetConversationStatus(statusList);
                    const writer = new QueryWriter(QueryTopic.SET_CONVERSATION_STATUS, buff, currentUserId);
                    const resp = yield channel.send(writer, PBName.SessionStateModifyResp);
                    const { code, data } = resp;
                    if (code === ErrorCode$1.SUCCESS) {
                        const versionData = data;
                        statusList.forEach((item) => {
                            this._conversationManager.addStatus(Object.assign(Object.assign({}, item), { updatedTime: versionData.version }), true);
                        });
                        return code;
                    }
                    return code;
                }
                return ErrorCode$1.RC_NET_CHANNEL_INVALID;
            });
        }
        _joinChrm(chrmId, count, isJoinExist) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel } = this;
                if (!channel)
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                const buff = channel.codec.encodeJoinOrQuitChatRoom();
                const topic = isJoinExist ? QueryTopic.JOIN_EXIST_CHATROOM : QueryTopic.JOIN_CHATROOM;
                const writer = new QueryWriter(topic, buff, chrmId);
                const { code, data } = yield channel.send(writer);
                // 加入聊天室成功后，需要拉取聊天室最近消息, 并抛给消息监听器
                if (code === ErrorCode$1.SUCCESS) {
                    const info = this._chrmsQueue[chrmId];
                    // 断线重连情况下，重复加房间不能重置消息拉取信息
                    if (!info) {
                        this._chrmsQueue[chrmId] = { pulling: false, queue: [], timestamp: 0 };
                    }
                    this._pullChrmMsg(chrmId, count);
                    // 如果开通聊天室 KV 存储服务, 加入成功后拉取聊天室 KV 存储
                    const { kvStorage: isOpenKVService } = this._naviInfo;
                    if (isOpenKVService) {
                        this._chrmEntryHandler.pullEntry(chrmId, 0);
                    }
                    // sessionStorage 存储加入房间的信息
                    this._joinedChrmManager.set(chrmId, count);
                }
                return code;
            });
        }
        /**
         * 断网重连成功后，从 sessionStorage 缓存中获取用户已加入的聊天室，然后重新加入已存在的聊天室，并拉取消息
        */
        _rejoinChrm() {
            return __awaiter(this, void 0, void 0, function* () {
                const joinedChrms = this._joinedChrmManager.get();
                for (const chrmId in joinedChrms) {
                    const code = yield this._joinChrm(chrmId, joinedChrms[chrmId], true);
                    if (code === ErrorCode$1.SUCCESS) {
                        this._watcher.chatroom({
                            rejoinedRoom: {
                                chatroomId: chrmId,
                                count: joinedChrms[chrmId]
                            }
                        });
                    }
                    else {
                        this._watcher.chatroom({
                            rejoinedRoom: {
                                chatroomId: chrmId,
                                errorCode: code
                            }
                        });
                    }
                }
            });
        }
        /**
         * 拉取聊天室消息
         * @param chrmId
         * @param count 默认拉取 10 条，最大一次拉取 50 条，只在加入房间时第一次拉取时有效
         */
        _pullChrmMsg(chrmId, count = 10) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return;
                }
                const chrmInfo = this._chrmsQueue[chrmId];
                const { pulling, timestamp } = chrmInfo;
                if (pulling) {
                    return;
                }
                chrmInfo.pulling = true;
                const reqBody = this._channel.codec.encodeChrmSyncMsg(timestamp, count);
                const signal = new QueryWriter(Topic$1[Topic$1.chrmPull], reqBody, chrmId);
                const { code, data } = yield this._channel.send(signal, PBName.DownStreamMessages, {
                    connectedTime: this._channel.connectedTime,
                    currentUserId: this.currentUserId
                });
                chrmInfo.pulling = false;
                if (code !== ErrorCode$1.SUCCESS || !data) {
                    logger.warn('pull chatroom msg failed, code:', code, ', data:', data);
                    return;
                }
                const { list, syncTime, finished } = data;
                chrmInfo.timestamp = syncTime;
                // 清除无效时间戳
                chrmInfo.queue = chrmInfo.queue.filter(item => item > syncTime);
                // 派发消息
                list.forEach(item => {
                    if (item.sentTime < timestamp) {
                        return;
                    }
                    this._watcher.message(item);
                });
                if (!finished || chrmInfo.queue.length > 0) {
                    this._pullChrmMsg(chrmId);
                }
            });
        }
        joinChatroom(chatroomId, count) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._joinChrm(chatroomId, count, false);
            });
        }
        joinExistChatroom(chatroomId, count) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._joinChrm(chatroomId, count, true);
            });
        }
        quitChatroom(chrmId) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel } = this;
                if (!channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const buff = channel.codec.encodeJoinOrQuitChatRoom();
                const writer = new QueryWriter(QueryTopic.QUIT_CHATROOM, buff, chrmId);
                const resp = yield channel.send(writer);
                const { code } = resp;
                if (code === ErrorCode$1.SUCCESS) {
                    delete this._chrmsQueue[chrmId];
                    this._chrmEntryHandler.reset(chrmId);
                    // 移除加入聊天室存储信息
                    this._joinedChrmManager.remove(chrmId);
                }
                return code;
            });
        }
        getChatroomInfo(chatroomId, count, order) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel } = this;
                if (!channel)
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                const buff = channel.codec.encodeGetChatRoomInfo(count, order);
                const writer = new QueryWriter(Topic$1[Topic$1.queryChrmI], buff, chatroomId);
                const resp = yield channel.send(writer, PBName.QueryChatRoomInfoOutput);
                const { code, data } = resp;
                if (code !== ErrorCode$1.SUCCESS)
                    return { code };
                return { code, data: data };
            });
        }
        getChatroomHistoryMessages(chatroomId, timestamp, count, order) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel } = this;
                if (!channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const buff = channel.codec.encodeGetHistoryMsg(chatroomId, { timestamp, count, order });
                const writer = new QueryWriter(QueryHistoryTopic.CHATROOM, buff, chatroomId);
                const resp = yield channel.send(writer, PBName.HistoryMsgOuput, {
                    conversation: { targetId: chatroomId }
                });
                const { code } = resp;
                const data = resp.data;
                if (code !== ErrorCode$1.SUCCESS)
                    return { code };
                return { code, data: { list: data.list, hasMore: data.hasMore } };
            });
        }
        _modifyChatroomKV(chatroomId, entry) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel, currentUserId } = this;
                if (!channel)
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                const buff = channel.codec.encodeModifyChatRoomKV(chatroomId, entry, currentUserId);
                const topic = entry.type === ChatroomEntryType$1.UPDATE ? QueryTopic.UPDATE_CHATROOM_KV : QueryTopic.DELETE_CHATROOM_KV;
                const writer = new QueryWriter(topic, buff, chatroomId);
                const resp = yield channel.send(writer);
                const { code } = resp;
                if (code === ErrorCode$1.SUCCESS) {
                    this._chrmEntryHandler.setLocal(chatroomId, {
                        kvEntries: [entry],
                        syncTime: new Date().getTime()
                    }, currentUserId);
                    return code;
                }
                return code;
            });
        }
        setChatroomEntry(chatroomId, entry) {
            return __awaiter(this, void 0, void 0, function* () {
                entry.type = ChatroomEntryType$1.UPDATE;
                return this._modifyChatroomKV(chatroomId, entry);
            });
        }
        forceSetChatroomEntry(chatroomId, entry) {
            return __awaiter(this, void 0, void 0, function* () {
                entry.type = ChatroomEntryType$1.UPDATE;
                entry.isOverwrite = true;
                return this._modifyChatroomKV(chatroomId, entry);
            });
        }
        removeChatroomEntry(chatroomId, entry) {
            return __awaiter(this, void 0, void 0, function* () {
                entry.type = ChatroomEntryType$1.DELETE;
                return this._modifyChatroomKV(chatroomId, entry);
            });
        }
        forceRemoveChatroomEntry(chatroomId, entry) {
            return __awaiter(this, void 0, void 0, function* () {
                entry.type = ChatroomEntryType$1.DELETE;
                entry.isOverwrite = true;
                return this._modifyChatroomKV(chatroomId, entry);
            });
        }
        getChatroomEntry(chatroomId, key) {
            // 1、判断用户是否在聊天室，不在抛出 不在聊天室 错误码 2、从本地获取 key value 属性
            const entry = this._chrmEntryHandler.getValue(chatroomId, key);
            if (entry) {
                return Promise.resolve({
                    code: ErrorCode$1.SUCCESS,
                    data: entry
                });
            }
            else {
                return Promise.resolve({
                    code: ErrorCode$1.CHATROOM_KEY_NOT_EXIST
                });
            }
        }
        getAllChatroomEntry(chatroomId) {
            // 1、判断用户是否在聊天室，不在抛出 不在聊天室 错误码 2、从本地获取 key value 属性
            const entries = this._chrmEntryHandler.getAll(chatroomId);
            return Promise.resolve({
                code: ErrorCode$1.SUCCESS,
                data: entries
            });
        }
        /**
         * 拉取聊天室 KV 存储
         * @param chatroomId
         * @param timestamp
        */
        pullChatroomEntry(chatroomId, timestamp) {
            return __awaiter(this, void 0, void 0, function* () {
                const { _channel: channel, currentUserId } = this;
                if (!channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const buff = channel.codec.encodePullChatRoomKV(timestamp);
                const writer = new QueryWriter(Topic$1[Topic$1.pullKV], buff, chatroomId);
                const resp = yield channel.send(writer, PBName.ChrmKVOutput);
                const { code, data } = resp;
                if (code === ErrorCode$1.SUCCESS) {
                    // 拉取完成后，向本地缓存 kv
                    this._chrmEntryHandler.setLocal(chatroomId, data, currentUserId);
                    // 拉取完成后, 如果有拉取到更新的 entry 通知聊天室 KV 监听器
                    const { kvEntries } = data;
                    const updatedEntries = [];
                    if (kvEntries.length > 0) {
                        kvEntries.forEach(entry => {
                            const { key, value, type, timestamp } = entry;
                            updatedEntries.push({
                                key,
                                value: value,
                                type: type,
                                timestamp: timestamp,
                                chatroomId
                            });
                        });
                        this._watcher.chatroom({ updatedEntries });
                    }
                    return {
                        code,
                        data: data
                    };
                }
                return { code };
            });
        }
        /**
         * 消息发送
         * @param conversationType
         * @param targetId
         * @param options
         */
        sendMessage(conversationType, targetId, options) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                options = handleInnerMsgOptions(options, this.currentUserId);
                options = this._handleMsgProperties(options, true);
                // 检查是否为状态消息，状态消息只在单聊、群聊类型会话中有效
                const isStatusMessage = [ConversationType$1.PRIVATE, ConversationType$1.GROUP].includes(conversationType)
                    ? options.isStatusMessage
                    : false;
                const topic = isStatusMessage ? getStatPubTopic(conversationType) : (getPubTopic(conversationType) || Topic$1.ppMsgP);
                if (isStatusMessage) {
                    options.isPersited = false;
                    options.isCounted = false;
                }
                options.pushContent = ((_a = options.pushConfig) === null || _a === void 0 ? void 0 : _a.pushContent) || options.pushContent || '';
                const data = this._channel.codec.encodeUpMsg({ type: conversationType, targetId }, options);
                const signal = new PublishWriter(Topic$1[topic], data, targetId);
                signal.setHeaderQos(QOS.AT_LEAST_ONCE);
                // 状态消息无 Ack 应答
                if (isStatusMessage) {
                    this._channel.sendOnly(signal);
                    return {
                        code: ErrorCode$1.SUCCESS,
                        data: transSentAttrs2IReceivedMessage(conversationType, targetId, Object.assign({}, options), '', 0, this.currentUserId)
                    };
                }
                const { code, data: resp } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                const pubAck = resp;
                // 更新发件箱时间
                this._letterbox.setOutboxTime(pubAck.timestamp, this.currentUserId);
                // 更新会话监听
                const receivedMessage = transSentAttrs2IReceivedMessage(conversationType, targetId, Object.assign({}, options), pubAck.messageUId, pubAck.timestamp, this.currentUserId);
                this._conversationManager.setConversationCacheByMessage(receivedMessage, true);
                return {
                    code: ErrorCode$1.SUCCESS,
                    data: receivedMessage
                };
            });
        }
        recallMsg(conversationType, targetId, messageUId, sentTime, recallMsgOptions) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const { user } = recallMsgOptions;
                // user 为发送撤回消息携带的用户信息
                const msg = {
                    content: { conversationType, targetId, messageUId, sentTime, user },
                    messageType: 'RC:RcCmd',
                    disableNotification: recallMsgOptions === null || recallMsgOptions === void 0 ? void 0 : recallMsgOptions.disableNotification,
                    pushConfig: recallMsgOptions === null || recallMsgOptions === void 0 ? void 0 : recallMsgOptions.pushConfig,
                    pushContent: ((_a = recallMsgOptions.pushConfig) === null || _a === void 0 ? void 0 : _a.pushContent) || recallMsgOptions.pushContent || ''
                };
                const topic = Topic$1[Topic$1.recallMsg];
                const data = this._channel.codec.encodeUpMsg({ type: conversationType, targetId }, msg);
                const signal = new PublishWriter(topic, data, this.currentUserId);
                signal.setHeaderQos(QOS.AT_LEAST_ONCE);
                const { code, data: resp } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                const pubAck = resp;
                return {
                    code: ErrorCode$1.SUCCESS,
                    data: transSentAttrs2IReceivedMessage(conversationType, targetId, Object.assign({}, msg), pubAck.messageUId, pubAck.timestamp, this.currentUserId)
                };
            });
        }
        /**
         * 拉取用户配置
         * @todo 需要确定 version 的作用是什么
         * @param version
         */
        pullUserSettings(version) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const buff = this._channel.codec.encodePullUserSetting(version);
                const writer = new QueryWriter(Topic$1[Topic$1.pullUS], buff, this.currentUserId);
                return this._channel.send(writer, PBName.PullUserSettingOutput);
            });
        }
        getFileToken(fileType, fileName) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                // 若不设置 fileName 百度上传的认证数据均返回 null
                const uploadFileName = getUploadFileName(fileType, fileName);
                const buff = this._channel.codec.encodeGetFileToken(fileType, uploadFileName);
                const writer = new QueryWriter(Topic$1[Topic$1.qnTkn], buff, this.currentUserId);
                let { code, data } = yield this._channel.send(writer, PBName.GetQNupTokenOutput);
                data = Object.assign(data, { fileName: uploadFileName });
                if (code === ErrorCode$1.SUCCESS) {
                    return {
                        code,
                        data: data
                    };
                }
                return { code };
            });
        }
        getFileUrl(fileType, uploadMethod, fileName, originName) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                let topic = '';
                let inputPBName = '';
                let outputPBName = '';
                if (uploadMethod === UploadMethod$1.QINIU) {
                    inputPBName = PBName.GetQNdownloadUrlInput;
                    outputPBName = PBName.GetQNdownloadUrlOutput;
                }
                else {
                    inputPBName = PBName.GetDownloadUrlInput;
                    outputPBName = PBName.GetDownloadUrlOutput;
                }
                if (uploadMethod === UploadMethod$1.QINIU) {
                    topic = Topic$1[Topic$1.qnUrl];
                }
                else if (uploadMethod === UploadMethod$1.AWS) {
                    topic = Topic$1[Topic$1.s3Url];
                }
                else if (uploadMethod === UploadMethod$1.STC) {
                    topic = Topic$1[Topic$1.stcUrl];
                }
                else {
                    topic = Topic$1[Topic$1.aliUrl];
                }
                const buff = this._channel.codec.encodeGetFileUrl(inputPBName, fileType, fileName, originName);
                const writer = new QueryWriter(topic, buff, this.currentUserId);
                const { code, data } = yield this._channel.send(writer, outputPBName);
                const resp = data;
                if (code === ErrorCode$1.SUCCESS) {
                    return {
                        code,
                        data: resp
                    };
                }
                return { code };
            });
        }
        disconnect() {
            if (this._channel) {
                this._channel.close();
                this._channel = undefined;
            }
        }
        destroy() {
            throw new Error('JSEngine\'s method not implemented.');
        }
        registerMessageType(objectName, isPersited, isCounted, searchProps) {
            // ✔️ 根据 objectName 将自定义消息属性内存态存储 [objectName]: {isPersited, isCounted}
            this._customMessageType[objectName] = { isPersited, isCounted };
            // 根据 messageName searchProps 生成构造消息（ V3 不实现 V2 API 层实现）
            // ✔️ SDK 发消息时，根据内置消息类型或自定义消息类型去处理 存储、计数属性
            // ✔️ SDK 收到消息后，内置消息类型的属性（存储、计数）去处理收到的消息、本地会话未读数存储
        }
        // ===================== 标签 相关接口 =====================
        /**
         * 创建标签
         * @param tag 标签
         */
        createTag(tag) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const buff = this._channel.codec.encodeCreateTag([tag]);
                const signal = new QueryWriter(Topic$1[Topic$1.addSeTag], buff, this.currentUserId);
                const { code, data } = yield this._channel.send(signal, PBName.SetUserSettingOutput);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                const { version } = data;
                this._tagManager.addTag([Object.assign(Object.assign({}, tag), { createdTime: version })]);
                return {
                    code: ErrorCode$1.SUCCESS,
                    data: data
                };
            });
        }
        /**
         * 删除标签
         * @param tagId 标签id
         */
        removeTag(tagId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const buff = this._channel.codec.encodeRemoveTag([tagId]);
                const signal = new QueryWriter(Topic$1[Topic$1.delSeTag], buff, this.currentUserId);
                const { code } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                this._tagManager.deleteTag([tagId]);
                return {
                    code: ErrorCode$1.SUCCESS
                };
            });
        }
        /**
         * 更新标签
         * @param tag 标签
         */
        updateTag(tag) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const buff = this._channel.codec.encodeCreateTag([tag]);
                const signal = new QueryWriter(Topic$1[Topic$1.addSeTag], buff, this.currentUserId);
                const { code, data } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                this._tagManager.addTag([tag]);
                return {
                    code: ErrorCode$1.SUCCESS,
                    data: data
                };
            });
        }
        /**
         * 获取标签列表
         * @param timestamp
         */
        getTagList() {
            return __awaiter(this, void 0, void 0, function* () {
                const list = this._tagManager.getTags();
                const conversationObj = this._conversationManager.getConversationListForTag();
                list.forEach((item) => {
                    item.conversationCount = conversationObj[item.tagId] ? conversationObj[item.tagId].length : 0;
                });
                return {
                    code: ErrorCode$1.SUCCESS,
                    data: list
                };
            });
        }
        addTagForConversations(tagId, conversations) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                // 校验是否存在此标签
                if (!this._tagManager.getTagById(tagId)) {
                    return { code: ErrorCode$1.TAG_NOT_EXIST };
                }
                const buff = this._channel.codec.encodeUpdateConversationTag([{ tagId }], conversations);
                const signal = new QueryWriter(Topic$1[Topic$1.addTag], buff, this.currentUserId);
                const { code } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                const tag = {};
                tag[tagId] = {};
                conversations.forEach((con) => {
                    this._conversationManager.addTagStatus(con.type, con.targetId, tag);
                });
                return {
                    code: ErrorCode$1.SUCCESS
                };
            });
        }
        removeTagForConversations(tagId, conversations) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const buff = this._channel.codec.encodeUpdateConversationTag([{ tagId }], conversations);
                const signal = new QueryWriter(Topic$1[Topic$1.delTag], buff, this.currentUserId);
                const { code } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                conversations.forEach((con) => {
                    this._conversationManager.deleteTagStatus(con.type, con.targetId, [tagId]);
                });
                return {
                    code: ErrorCode$1.SUCCESS
                };
            });
        }
        removeTagsForConversation(conversation, tagIds) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const { type, targetId } = conversation;
                const tags = tagIds.map((tagId) => {
                    return { tagId };
                });
                const buff = this._channel.codec.encodeUpdateConversationTag(tags, [conversation]);
                const signal = new QueryWriter(Topic$1[Topic$1.delTag], buff, this.currentUserId);
                const { code } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                this._conversationManager.deleteTagStatus(type, targetId, tagIds);
                return {
                    code: ErrorCode$1.SUCCESS
                };
            });
        }
        getConversationListByTag(tagId, startTime, count) {
            return __awaiter(this, void 0, void 0, function* () {
                const { currentUserId, _channel: channel } = this;
                if (!channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                // type 服务端未用到此字段，直接返回所有类型
                const buff = channel.codec.encodeOldConversationList({ count, type: ConversationType$1.PRIVATE, startTime });
                const writer = new QueryWriter(QueryTopic.GET_OLD_CONVERSATION_LIST, buff, currentUserId);
                const resp = yield channel.send(writer, PBName.RelationsOutput, {
                    currentUserId,
                    connectedTime: channel.connectedTime
                });
                logger.info('GetConversationList =>', resp);
                const { code, data } = resp;
                const list = this._conversationHasTagFilter(tagId, data);
                logger.info('GetConversationListByTag', list);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                return {
                    code,
                    data: list
                };
            });
        }
        /**
         * 筛选出拥有指定标签的会话并排序
         * @param tagId
         * @param list
         */
        _conversationHasTagFilter(tagId, list) {
            const isTopList = [];
            const commonList = [];
            // 拆分数组为置顶和非置顶两个数组
            list.forEach((item) => {
                const { conversationType, targetId } = item;
                const { hasMentioned, mentionedInfo, lastUnreadTime, notificationStatus, isTop, tags } = this._conversationManager.get(conversationType, targetId);
                const tagStatus = tags && tags[tagId];
                if (tagStatus) {
                    const con = Object.assign(Object.assign({}, item), { hasMentioned, mentionedInfo: mentionedInfo, lastUnreadTime: lastUnreadTime, notificationStatus: notificationStatus, isTop: isTop });
                    if (tagStatus.isTop) {
                        isTopList.push(Object.assign(Object.assign({}, con), { isTopInTag: true }));
                    }
                    else {
                        commonList.push(Object.assign(Object.assign({}, con), { isTopInTag: false }));
                    }
                }
            });
            function compare(a, b) {
                return a.latestMessage && b.latestMessage ? (a.latestMessage.sentTime - b.latestMessage.sentTime) : 0;
            }
            // 合并 并 排序
            const data = [...isTopList.sort(compare), ...commonList.sort(compare)];
            return data;
        }
        getUnreadCountByTag(tagId, containMuted) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const count = this._conversationManager.getUnreadCountByTag(tagId, containMuted);
                return {
                    code: ErrorCode$1.SUCCESS,
                    data: count
                };
            });
        }
        setConversationStatusInTag(tagId, conversation, status) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const { targetId, type } = conversation;
                const { isTop } = status;
                const tags = [{ tagId, isTop }];
                // 校验会话中是否存在标签
                const localConversation = this._conversationManager.get(type, targetId);
                if (!localConversation.tags || !Object.hasOwnProperty.call(localConversation.tags, tagId)) {
                    return { code: ErrorCode$1.NO_TAG_IN_CONVER };
                }
                const buff = this._channel.codec.encodeUpdateConversationTag(tags, [conversation]);
                const signal = new QueryWriter(Topic$1[Topic$1.addTag], buff, this.currentUserId);
                const { code } = yield this._channel.send(signal);
                if (code !== ErrorCode$1.SUCCESS) {
                    return { code };
                }
                const tagStatus = {};
                tagStatus[tagId] = {};
                if (isTop) {
                    tagStatus[tagId].isTop = true;
                }
                this._conversationManager.addTagStatus(type, targetId, tagStatus);
                return {
                    code: ErrorCode$1.SUCCESS
                };
            });
        }
        getTagsForConversation(conversation) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const con = this._conversationManager.get(conversation.type, conversation.targetId);
                const tags = this._tagManager.getTagsInfo();
                const tagList = [];
                if (con.tags) {
                    for (const tagId in con.tags) {
                        tagList.push({
                            tagId,
                            tagName: (_a = tags[tagId]) === null || _a === void 0 ? void 0 : _a.tagName
                        });
                    }
                }
                return {
                    code: ErrorCode$1.SUCCESS,
                    data: tagList
                };
            });
        }
        // ===================== 标签 相关接口 end =====================
        // ===================== RTC 相关接口 =====================
        joinRTCRoom(roomId, mode, broadcastType) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const reqBody = this._channel.codec.encodeJoinRTCRoom(mode, broadcastType);
                const writer = new QueryWriter(Topic$1[Topic$1.rtcRJoin_data], reqBody, roomId);
                return this._channel.send(writer, PBName.RtcUserListOutput);
            });
        }
        quitRTCRoom(roomId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeQuitRTCRoom();
                const writer = new QueryWriter(Topic$1[Topic$1.rtcRExit], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        rtcPing(roomId, mode, broadcastType) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeJoinRTCRoom(mode, broadcastType);
                const writer = new QueryWriter(Topic$1[Topic$1.rtcPing], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        getRTCRoomInfo(roomId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const reqBody = this._channel.codec.encodeGetRTCRoomInfo();
                const writer = new QueryWriter(Topic$1[Topic$1.rtcRInfo], reqBody, roomId);
                return this._channel.send(writer, PBName.RtcRoomInfoOutput);
            });
        }
        getRTCUserInfoList(roomId) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const reqBody = this._channel.codec.encodeGetRTCRoomInfo();
                const writer = new QueryWriter(Topic$1[Topic$1.rtcUData], reqBody, roomId);
                const { code, data } = yield this._channel.send(writer, PBName.RtcUserListOutput);
                return { code, data: data ? { users: data.users } : data };
            });
        }
        // TODO: 排查 rtcUPut 超时无响应问题
        setRTCUserInfo(roomId, key, value) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeSetRTCUserInfo(key, value);
                const writer = new QueryWriter(Topic$1[Topic$1.rtcUPut], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        removeRTCUserInfo(roomId, keys) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeRemoveRTCUserInfo(keys);
                const writer = new PublishWriter(Topic$1[Topic$1.rtcUDel], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        setRTCData(roomId, key, value, isInner, apiType, message) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeSetRTCData(key, value, isInner, apiType, message);
                const writer = new PublishWriter(Topic$1[Topic$1.rtcSetData], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        setRTCTotalRes(roomId, message, valueInfo, objectName) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeUserSetRTCData(message, valueInfo, objectName);
                const writer = new PublishWriter(Topic$1[Topic$1.userSetData], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        getRTCData(roomId, keys, isInner, apiType) {
            if (!this._channel) {
                return Promise.resolve({ code: ErrorCode$1.RC_NET_CHANNEL_INVALID });
            }
            const reqBody = this._channel.codec.encodeGetRTCData(keys, isInner, apiType);
            const writer = new QueryWriter(Topic$1[Topic$1.rtcQryData], reqBody, roomId);
            return this._channel.send(writer, PBName.RtcQryOutput);
        }
        removeRTCData(roomId, keys, isInner, apiType, message) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeRemoveRTCData(keys, isInner, apiType, message);
                const writer = new PublishWriter(Topic$1[Topic$1.rtcDelData], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        setRTCOutData(roomId, rtcData, type, message) {
            // const data = this._serverDataCodec.encodeSetRTCOutData(rtcData, type, message);
            // let writer = new PublishWriter(QUERY_TOPIC.SET_RTC_OUT_DATA, data, roomId);
            // return this._sendSignalForData(writer);
            throw new Error('JSEngine\'s method not implemented.');
        }
        getRTCOutData(roomId, userIds) {
            // const data = this._serverDataCodec.ecnodeGetRTCOutData(userIds);
            // let writer = new QueryWriter(QUERY_TOPIC.GET_RTC_OUT_DATA, data, roomId);
            // return this._sendSignalForData(writer, PBName.RtcUserOutDataOutput);
            throw new Error('JSEngine\'s method not implemented.');
        }
        getRTCToken(roomId, mode, broadcastType) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return { code: ErrorCode$1.RC_NET_CHANNEL_INVALID };
                }
                const reqBody = this._channel.codec.encodeJoinRTCRoom(mode, broadcastType);
                const writer = new QueryWriter(Topic$1[Topic$1.rtcToken], reqBody, roomId);
                return this._channel.send(writer, PBName.RtcTokenOutput);
            });
        }
        setRTCState(roomId, report) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._channel) {
                    return ErrorCode$1.RC_NET_CHANNEL_INVALID;
                }
                const reqBody = this._channel.codec.encodeSetRTCState(report);
                const writer = new QueryWriter(Topic$1[Topic$1.rtcUserState], reqBody, roomId);
                const { code } = yield this._channel.send(writer);
                return code;
            });
        }
        getRTCUserInfo(roomId) {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('Method not implemented.');
            });
        }
        getRTCUserList(roomId) {
            if (!this._channel) {
                return Promise.resolve({ code: ErrorCode$1.RC_NET_CHANNEL_INVALID });
            }
            const data = this._channel.codec.encodeGetRTCRoomInfo();
            const writer = new QueryWriter(Topic$1[Topic$1.rtcUList], data, roomId);
            return this._channel.send(writer, PBName.RtcUserListOutput);
        }
        /* ================ 非标准接口调用实现 ================== */
        /**
         * 调用非标准方法。所谓非标准方法，是为某些特定需求或产品添加，暂未作为标准接口添加至 API 层。
         * 对于未实现的方法，接口响应 Unsupport 错误码
         * @param method 方法名
         * @param args
         */
        callExtra(method, ...args) {
            return Promise.resolve({ code: ErrorCode$1.EXTRA_METHOD_UNDEFINED });
        }
        /* ================ 以下为 CPP 特有接口，JSEngine 无需实现 ================== */
        clearConversations() {
            throw new Error('Method not implemented.');
        }
        setUserStatusListener(config, listener) {
            throw new Error('Method not implemented.');
        }
        setUserStatus(status) {
            throw new Error('Method not implemented.');
        }
        subscribeUserStatus(userIds) {
            throw new Error('Method not implemented.');
        }
        getUserStatus(userId) {
            throw new Error('Method not implemented.');
        }
        addToBlacklist(userId) {
            throw new Error('Method not implemented.');
        }
        removeFromBlacklist(userId) {
            throw new Error('Method not implemented.');
        }
        getBlacklist() {
            throw new Error('Method not implemented.');
        }
        getBlacklistStatus(userId) {
            throw new Error('Method not implemented.');
        }
        insertMessage(conversationType, targetId, insertOptions) {
            throw new Error('Method not implemented.');
        }
        deleteMessages(timestamps) {
            throw new Error('Method not implemented.');
        }
        deleteMessagesByTimestamp(conversationType, targetId, timestamp, cleanSpace, channelId) {
            throw new Error('Method not implemented.');
        }
        clearMessages(conversationType, targetId, channelId) {
            throw new Error('Method not implemented.');
        }
        getMessage(messageId) {
            throw new Error('Method not implemented.');
        }
        setMessageContent(messageId, content, objectName) {
            throw new Error('Method not implemented.');
        }
        setMessageSearchField(messageId, content, searchFiles) {
            throw new Error('Method not implemented.');
        }
        searchConversationByContent(keyword, messageTypes, channelId, conversationTypes) {
            throw new Error('Method not implemented.');
        }
        searchMessageByContent(conversationType, targetId, keyword, timestamp, count, total) {
            throw new Error('Method not implemented.');
        }
        getUnreadMentionedMessages(conversationType, targetId) {
            throw new Error('Method not implemented.');
        }
        setMessageSentStatus(messageId, sentStatus) {
            throw new Error('Method not implemented.');
        }
        setMessageReceivedStatus(messageId, receivedStatus) {
            throw new Error('Method not implemented.');
        }
        clearUnreadCountByTimestamp(conversationType, targetId, timestamp, channelId) {
            throw new Error('Method not implemented.');
        }
        getConversationNotificationStatus(conversationType, targetId, channelId) {
            throw new Error('Method not implemented.');
        }
        getRemoteHistoryMessages(conversationType, targetId, timestamp, count, order, channelId) {
            throw new Error('Method not implemented.');
        }
    }

    /**
     * 音视频模式
     */
    exports.RTCMode = void 0;
    (function (RTCMode) {
        /**
         * 普通音视频模式
         */
        RTCMode[RTCMode["RTC"] = 0] = "RTC";
        /**
         * 直播模式
         */
        RTCMode[RTCMode["LIVE"] = 2] = "LIVE";
    })(exports.RTCMode || (exports.RTCMode = {}));
    /**
     * 直播类型
     */
    exports.LiveType = void 0;
    (function (LiveType) {
        /**
         * 音视频直播
         */
        LiveType[LiveType["AUDIO_AND_VIDEO"] = 0] = "AUDIO_AND_VIDEO";
        /**
         * 音频直播
         */
        LiveType[LiveType["AUDIO"] = 1] = "AUDIO";
    })(exports.LiveType || (exports.LiveType = {}));
    exports.LiveRole = void 0;
    (function (LiveRole) {
        /**
         * 主播身份
         */
        LiveRole[LiveRole["ANCHOR"] = 1] = "ANCHOR";
        /**
         * 观众身份
         */
        LiveRole[LiveRole["AUDIENCE"] = 2] = "AUDIENCE";
    })(exports.LiveRole || (exports.LiveRole = {}));
    /**
     * CallLib 流程消息
     */
    const CallLibMsgType = {
        'RC:VCAccept': 'RC:VCAccept',
        'RC:VCRinging': 'RC:VCRinging',
        'RC:VCSummary': 'RC:VCSummary',
        'RC:VCHangup': 'RC:VCHangup',
        'RC:VCInvite': 'RC:VCInvite',
        'RC:VCModifyMedia': 'RC:VCModifyMedia',
        'RC:VCModifyMem': 'RC:VCModifyMem'
    };
    exports.RTCApiType = void 0;
    (function (RTCApiType) {
        RTCApiType[RTCApiType["ROOM"] = 1] = "ROOM";
        RTCApiType[RTCApiType["PERSON"] = 2] = "PERSON";
    })(exports.RTCApiType || (exports.RTCApiType = {}));

    class PluginContext {
        constructor(_context) {
            this._context = _context;
        }
        /**
         * 获取 `@rongcloud/engine` 包版本
         */
        getCoreVersion() {
            return this._context.coreVersion;
        }
        /**
         * 获取当前运行中的 IMLib 版本号
         */
        getAPIVersion() {
            return this._context.apiVersion;
        }
        /**
         * 获取当前应用的 appkey
         */
        getAppkey() {
            return this._context.appkey;
        }
        /**
         * 获取当前已连接用户的 userId
         * 用户连接建立之前及 disconnect 之后，该方法返回 '' 值
         */
        getCurrentId() {
            return this._context.getCurrentUserId();
        }
        /**
         * 获取当前连接状态
         */
        getConnectionStatus() {
            return this._context.getConnectionStatus();
        }
        /**
         * 发送消息
         */
        sendMessage(conversationType, targetId, options) {
            return this._context.sendMessage(conversationType, targetId, options);
        }
        /**
         * 消息注册
         * @description 消息注册需在应用初始化完成前进行
         * @param objectName 消息类型，如：RC:TxtMsg
         * @param isPersited 是否存储
         * @param isCounted 是否技术
         * @param searchProps 搜索字段，只在搭配协议栈使用时有效
         */
        registerMessageType(objectName, isPersited, isCounted, searchProps = []) {
            this._context.registerMessageType(objectName, isPersited, isCounted, searchProps);
        }
    }

    class RTCPluginContext extends PluginContext {
        /**
         * 获取当前的导航数据
         */
        getNaviInfo() {
            return this._context.getInfoFromCache();
        }
        /**
         * 加入 RTC 房间
         * @todo 需确认 `broadcastType` 参数的作用与有效值
         * @param roomId
         * @param mode 房间模式：直播 or 会议
         * @param broadcastType
         */
        joinRTCRoom(roomId, mode, broadcastType) {
            return this._context.joinRTCRoom(roomId, mode, broadcastType);
        }
        quitRTCRoom(roomId) {
            return this._context.quitRTCRoom(roomId);
        }
        rtcPing(roomId, mode, broadcastType) {
            return this._context.rtcPing(roomId, mode, broadcastType);
        }
        getRTCRoomInfo(roomId) {
            return this._context.getRTCRoomInfo(roomId);
        }
        getRTCUserInfoList(roomId) {
            return this._context.getRTCUserInfoList(roomId);
        }
        getRTCUserInfo(roomId) {
            return this._context.getRTCUserInfo(roomId);
        }
        setRTCUserInfo(roomId, key, value) {
            return this._context.setRTCUserInfo(roomId, key, value);
        }
        removeRTCUserInfo(roomId, keys) {
            return this._context.removeRTCUserInfo(roomId, keys);
        }
        setRTCData(roomId, key, value, isInner, apiType, message) {
            return this._context.setRTCData(roomId, key, value, isInner, apiType, message);
        }
        /**
         * @param - roomId
         * @param - message 向前兼容的消息数据，以兼容旧版本 SDK，即增量数据，如：
         * ```
         * JSON.stringify({
         *  name: 'RCRTC:PublishResource',
         *  content: {
         *  }
         * })
         * ```
         * @param - valueInfo 全量资源数据
         * @param - 全量 URI 消息名，即 `RCRTC:TotalContentResources`
         */
        setRTCTotalRes(roomId, 
        /**
         * 向旧版本 RTCLib 兼容的消息数据
         */
        message, valueInfo, objectName) {
            return this._context.setRTCTotalRes(roomId, message, valueInfo, objectName);
        }
        getRTCData(roomId, keys, isInner, apiType) {
            return this._context.getRTCData(roomId, keys, isInner, apiType);
        }
        removeRTCData(roomId, keys, isInner, apiType, message) {
            return this._context.removeRTCData(roomId, keys, isInner, apiType, message);
        }
        setRTCOutData(roomId, rtcData, type, message) {
            return this._context.setRTCOutData(roomId, rtcData, type, message);
        }
        getRTCOutData(roomId, userIds) {
            return this._context.getRTCOutData(roomId, userIds);
        }
        getRTCToken(roomId, mode, broadcastType) {
            return this._context.getRTCToken(roomId, mode, broadcastType);
        }
        setRTCState(roomId, report) {
            return this._context.setRTCState(roomId, report);
        }
        getRTCUserList(roomId) {
            return this._context.getRTCUserList(roomId);
        }
    }

    function cloneMessage(message) {
        return Object.assign({}, message);
    }
    class APIContext {
        constructor(_runtime, options) {
            this._runtime = _runtime;
            this._token = '';
            /**
             * 插件队列，用于逐一派发消息与信令
             */
            this._pluginContextQueue = [];
            /**
             * 核心库版本号，后期与 4.0 IM SDK 版本号保持一致
             */
            this.coreVersion = "4.3.0-alpha.8";
            this._connectionStatus = ConnectionStatus$1.DISCONNECTED;
            /**
             * 业务层事件监听器挂载点
             */
            this._watcher = {
                message: undefined,
                conversationState: undefined,
                chatroomState: undefined,
                connectionState: undefined,
                rtcInnerWatcher: undefined,
                expansion: undefined,
                tag: undefined,
                conversationTagChanged: undefined
            };
            this._options = Object.assign({}, options);
            this.appkey = this._options.appkey;
            this.apiVersion = this._options.apiVersion;
            // 过滤无效地址
            this._options.navigators = this._options.navigators.filter(item => /^https?:\/\//.test(item));
            // 有自定义导航的状态下，不再使用内置导航地址
            if (this._options.navigators.length === 0) {
                this._options.navigators.push(...PUBLIC_CLOUD_NAVI_URIS);
            }
            // 初始化引擎监听器，监听连接状态变化、消息变化以及聊天室状态变化
            const engineWatcher = {
                status: this._connectionStatusListener.bind(this),
                message: this._messageReceiver.bind(this),
                chatroom: this._chatroomInfoListener.bind(this),
                conversation: this._conversationInfoListener.bind(this),
                expansion: this._expansionInfoListener.bind(this),
                tag: this._tagListener.bind(this),
                conversationTag: this._conversationTagListener.bind(this)
            };
            // 初始化引擎
            this._engine = usingCppEngine()
                ? new RCCppEngine(_runtime, engineWatcher, this._options)
                : new JSEngine(_runtime, engineWatcher, this._options);
        }
        static init(runtime, options) {
            if ([0, 1, 2, 3, 4].indexOf(options.logLevel) > -1) {
                logger.set(options.logLevel);
            }
            logger.debug('APIContext.init =>', options.appkey, options.navigators);
            if (this._context) {
                logger.error('Repeat initialize!');
                return this._context;
            }
            {
                logger.warn('VersionCode:', "9f87d45771f61e92544a8fcad04f40f669ffbf01");
            }
            this._context = new APIContext(runtime, options);
            return this._context;
        }
        static destroy() {
            if (this._context) {
                this._context._destroy();
                this._context = undefined;
            }
        }
        /**
         * 安装使用插件，并初始化插件实例
         * @param plugin
         * @param options
         */
        install(plugin, options) {
            const context = plugin.tag === 'RCRTC' ? new RTCPluginContext(this) : new PluginContext(this);
            let pluginClient = null;
            try {
                if (!plugin.verify(this._runtime)) {
                    return null;
                }
                pluginClient = plugin.setup(context, this._runtime, options);
            }
            catch (error) {
                logger.error('install plugin error!\n', error);
            }
            pluginClient && this._pluginContextQueue.push(context);
            return pluginClient;
        }
        /**
         * 连接状态变更回调
         * @param message
         */
        _connectionStatusListener(status) {
            var _a;
            this._connectionStatus = status;
            // 通知旧版本 RTCLib、CallLib
            ((_a = this._watcher.rtcInnerWatcher) === null || _a === void 0 ? void 0 : _a.status) && this._watcher.rtcInnerWatcher.status(status);
            // 通知插件连接状态变更
            this._pluginContextQueue.forEach(item => {
                item.onconnectionstatechange && item.onconnectionstatechange(status);
            });
            // 通知应用层连接状态变更
            this._watcher.connectionState && this._watcher.connectionState(status);
        }
        _messageReceiver(message) {
            /**
             * 为兼容非插件化的 RTCLib、CallLib，需预先将
             * conversationType === 12
             * 或
             * RCRTC:AcceptMsg... 等消息分别分发给 RTCLib\CallLib
             */
            if (message.conversationType === ConversationType$1.RTC_ROOM ||
                Object.prototype.hasOwnProperty.call(CallLibMsgType, message.messageType)) {
                /**
                 * 分发 RTCLib 或 CallLib 消息，如果未找到 RTCLib 或 CallLib 注册的消息监听，
                 * 说明未使用旧版本 RTCLib 或 CallLib，消息要分发到插件钩子
                 */
                if (this._watcher.rtcInnerWatcher && this._watcher.rtcInnerWatcher.message) {
                    this._watcher.rtcInnerWatcher.message(cloneMessage(message));
                    return;
                }
            }
            // 消息分发至插件，并根据插件响应结果确定是否继续向业务层派发
            if (this._pluginContextQueue.some((item) => {
                // 插件不接收消息
                if (!item.onmessage) {
                    return false;
                }
                try {
                    return item.onmessage(cloneMessage(message));
                }
                catch (err) {
                    logger.error('plugin error =>', err);
                    return false;
                }
            })) {
                return;
            }
            // 最终未被过滤的消息派发给应用层
            this._watcher.message && this._watcher.message(cloneMessage(message));
        }
        /**
         * 聊天室相关信息监听
        */
        _chatroomInfoListener(info) {
            this._watcher.chatroomState && this._watcher.chatroomState(info);
        }
        /**
         * 会话监听相关
        */
        _conversationInfoListener(info) {
            this._watcher.conversationState && this._watcher.conversationState(info);
        }
        /**
         * 消息扩展监听相关
        */
        _expansionInfoListener(info) {
            this._watcher.expansion && this._watcher.expansion(info);
        }
        /**
         * 标签增删改监听
         */
        _tagListener() {
            this._watcher.tag && this._watcher.tag();
        }
        /**
         * 会话标签状态监听
         */
        _conversationTagListener() {
            this._watcher.conversationTagChanged && this._watcher.conversationTagChanged();
        }
        /**
         * 添加事件监听
         * @param options
         */
        assignWatcher(watcher) {
            // 只取有效的四个 key，避免引用透传造成内存泄露
            Object.keys(this._watcher).forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(watcher, key)) {
                    const value = watcher[key];
                    this._watcher[key] = isFunction(value) || isObject(value) ? value : undefined;
                }
            });
        }
        getConnectedTime() {
            return this._engine.getConnectedTime();
        }
        getCurrentUserId() {
            return this._engine.currentUserId;
        }
        getConnectionStatus() {
            return this._connectionStatus;
        }
        /**
         * 建立连接，连接失败则抛出异常，连接成功后返回用户 userId，否则返回相应的错误码
         * @param token
         * @param refreshNavi 是否需要重新请求导航，当值为 `false` 时，优先使用有效缓存导航，若缓存失效则重新获取导航
         */
        connect(token, refreshNavi = false) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._connectionStatus === ConnectionStatus$1.CONNECTED) {
                    return { code: ErrorCode$1.SUCCESS, userId: this._engine.currentUserId };
                }
                if (this._connectionStatus === ConnectionStatus$1.CONNECTING) {
                    return { code: ErrorCode$1.BIZ_ERROR_CONNECTING };
                }
                if (typeof token !== 'string' || token.length === 0) {
                    return { code: ErrorCode$1.RC_CONN_USER_OR_PASSWD_ERROR };
                }
                this._token = token;
                // 根据 token 解析动态导航，优先从动态导航获取数据
                const [, tmpArr] = token.split('@');
                const dynamicUris = tmpArr
                    ? tmpArr.split(';').map(item => /^https?:/.test(item) ? item : `https://${item}`)
                    : [];
                // 获取导航数据
                const naviInfo = yield this._engine.navi.getInfo(this._getTokenWithoutNavi(), dynamicUris, refreshNavi);
                if (!naviInfo && !usingCppEngine()) {
                    return { code: ErrorCode$1.RC_NAVI_RESOURCE_ERROR };
                }
                // 开始连接，并监听链接状态变化，状态为 0 则连接成功
                const code = yield this._engine.connect(this._getTokenWithoutNavi(), naviInfo);
                if (code === ErrorCode$1.SUCCESS && !usingCppEngine()) { // TODO 限制 !isCppMode 防止报错，临时解决方案
                    // 拉取用户级配置
                    naviInfo.openUS === 1 && this._pullUserSettings();
                }
                return { code, userId: this._engine.currentUserId };
            });
        }
        /**
         * 拉取实时配置 web 端需更新 voipCall 字段
         */
        _pullUserSettings() {
            return __awaiter(this, void 0, void 0, function* () {
                // TODO: 持续迭代中，防止 comet 报错
                // const res = await this._engine.pullUserSettings(version)
                // logger.error('TODO：存储配置，需要使用时获取', res)
            });
        }
        disconnect() {
            this._engine.disconnect();
            this._pluginContextQueue.forEach(item => {
                if (!item.ondisconnect) {
                    return;
                }
                try {
                    item.ondisconnect();
                }
                catch (err) {
                    logger.error('plugin error =>', err);
                }
            });
            // 为照顾 API 层的 Promise 链式调用，故增加返回 Promise
            return Promise.resolve();
        }
        reconnect() {
            return this.connect(this._getTokenWithoutNavi());
        }
        // 获取 token 动态导航前的部分
        _getTokenWithoutNavi() {
            return this._token.replace(/@.+$/, '@');
        }
        /**
         * 获取当前缓存的导航数据
         */
        getInfoFromCache() {
            return this._engine.navi.getInfoFromCache(this._getTokenWithoutNavi());
        }
        /**
         * 消息注册
         * @description 消息注册需在应用初始化完成前进行
         * @param objectName 消息类型，如：RC:TxtMsg
         * @param isPersited 是否存储
         * @param isCounted 是否技术
         * @param searchProps 搜索字段，只在搭配协议栈使用时有效
         */
        registerMessageType(objectName, isPersited, isCounted, searchProps = []) {
            this._engine.registerMessageType(objectName, isPersited, isCounted, searchProps);
        }
        /**
         * 发送消息
         * @param conversationType
         * @param targetId
         * @param objectName
         * @param content
         * @param options
         */
        sendMessage(conversationType, targetId, options, onBefore) {
            // 端上不能发送系统消息，若会话类型传入 6 ，抛出参数错误，与移动端一致
            if (conversationType === ConversationType$1.SYSTEM) {
                return Promise.resolve({ code: ErrorCode$1.BIZ_ERROR_INVALID_PARAMETER });
            }
            // 消息 content 需小于 128 KB
            const contentJson = JSON.stringify(options.content);
            if (getByteLength(contentJson) > MAX_MESSAGE_CONTENT_BYTES) {
                return Promise.resolve({ code: ErrorCode$1.RC_MSG_CONTENT_EXCEED_LIMIT });
            }
            return this._engine.sendMessage(conversationType, targetId, options, onBefore);
        }
        /**
         * 发送扩展消息
         * @param messageUId 消息 Id
         * @param keys 需要删除的 key
         * @param expansion 设置的扩展
        */
        sendExpansionMessage(options) {
            return __awaiter(this, void 0, void 0, function* () {
                let { conversationType, targetId, messageUId, keys, expansion, originExpansion, removeAll, canIncludeExpansion } = options;
                // 校验消息是否支持扩展
                if (!canIncludeExpansion) {
                    return { code: ErrorCode$1.MESSAGE_KV_NOT_SUPPORT };
                }
                let isExceedLimit = false;
                let isIllgalEx = false;
                if (isObject(expansion)) {
                    // 验证扩展总数是否 大于 300
                    originExpansion = originExpansion || {};
                    const exKeysLength = Object.keys(expansion).length;
                    const totalExpansion = Object.assign(originExpansion, expansion);
                    const totalExKeysLength = Object.keys(totalExpansion).length;
                    isExceedLimit = totalExKeysLength > 300 || exKeysLength > 20;
                    // 验证 expansion key value 是否合法
                    for (const key in expansion) {
                        const val = expansion[key];
                        isExceedLimit = key.length > 32 || val.length > 64;
                        isIllgalEx = !/^[A-Za-z0-9_=+-]+$/.test(key);
                    }
                }
                if (isExceedLimit) {
                    return { code: ErrorCode$1.EXPANSION_LIMIT_EXCEET };
                }
                if (isIllgalEx) {
                    return { code: ErrorCode$1.BIZ_ERROR_INVALID_PARAMETER };
                }
                const content = {
                    mid: messageUId
                };
                expansion && (content.put = expansion);
                keys && (content.del = keys);
                removeAll && (content.removeAll = 1);
                // RC:MsgExMsg 类型消息需使用单群聊消息信令：ppMsgP、pgMsgP（ Server 端处理不存到历史消息云存储）
                const { code } = yield this._engine.sendMessage(conversationType, targetId, {
                    content,
                    messageType: MessageType$1.EXPANSION_NOTIFY
                });
                return { code };
            });
        }
        /**
         * 反初始化，清空所有监听及计时器
         */
        _destroy() {
            this._watcher = {};
            this._engine.disconnect();
            this._pluginContextQueue.forEach(item => {
                if (!item.ondestroy) {
                    return;
                }
                try {
                    item.ondestroy();
                }
                catch (err) {
                    logger.error('plugin error =>', err);
                }
            });
            this._pluginContextQueue.length = 0;
        }
        /**
         * @param conversationType
         * @param targetId 会话 Id
         * @param timestamp 拉取时间戳
         * @param count 拉取条数
         * @param order 1 正序拉取，0 为倒序拉取
         * @param channelId
         * @param objectName
         */
        getHistoryMessage(conversationType, targetId, timestamp = 0, count = 20, order = 0, channelId = '', objectName = '') {
            return this._engine.getHistoryMessage(conversationType, targetId, timestamp, count, order, channelId, objectName || '');
        }
        /**
         * 获取会话列表
         * @param count 指定获取数量, 不传则获取全部会话列表，默认 `300`
         */
        getConversationList(count = 300, conversationType, startTime, order, channelId = '') {
            return this._engine.getConversationList(count, conversationType, startTime, order, channelId);
        }
        /**
         * 删除会话
         */
        removeConversation(conversationType, targetId, channelId = '') {
            return this._engine.removeConversation(conversationType, targetId, channelId);
        }
        /**
         * 清除会话消息未读数
         */
        clearUnreadCount(conversationType, targetId, channelId = '') {
            return this._engine.clearConversationUnreadCount(conversationType, targetId, channelId);
        }
        /**
         * 获取指定会话消息未读数
         */
        getUnreadCount(conversationType, targetId, channelId = '') {
            return this._engine.getConversationUnreadCount(conversationType, targetId, channelId);
        }
        /**
         * 获取所有会话未读数
         * @param channelId 多组织 Id
         * @param conversationTypes
         * @param includeMuted 包含已设置免打扰的会话
         */
        getTotalUnreadCount(channelId, conversationTypes, includeMuted) {
            return this._engine.getAllConversationUnreadCount(channelId, conversationTypes && conversationTypes.length > 0 ? conversationTypes : [ConversationType$1.PRIVATE, ConversationType$1.GROUP, ConversationType$1.SYSTEM, ConversationType$1.PUBLIC_SERVICE], !!includeMuted);
        }
        setConversationStatus(conversationType, targetId, isTop, notificationStatus, channelId = '') {
            const statusList = [{ conversationType, targetId, isTop, notificationStatus, channelId }];
            return this._engine.batchSetConversationStatus(statusList);
        }
        saveConversationMessageDraft(conversationType, targetId, draft) {
            return this._engine.saveConversationMessageDraft(conversationType, targetId, draft);
        }
        getConversationMessageDraft(conversationType, targetId) {
            return this._engine.getConversationMessageDraft(conversationType, targetId);
        }
        clearConversationMessageDraft(conversationType, targetId) {
            return this._engine.clearConversationMessageDraft(conversationType, targetId);
        }
        recallMessage(conversationType, targetId, messageUId, sentTime, recallMsgOptions) {
            return this._engine.recallMsg(conversationType, targetId, messageUId, sentTime, recallMsgOptions);
        }
        /**
         * 删除远端消息
         * @param conversationType
         * @param targetId
         * @param list
         */
        deleteRemoteMessage(conversationType, targetId, list, channelId = '') {
            return this._engine.deleteRemoteMessage(conversationType, targetId, list, channelId);
        }
        /**
         * 根据时间戳删除指定时间之前的
         * @param conversationType
         * @param targetId
         * @param timestamp
         */
        deleteRemoteMessageByTimestamp(conversationType, targetId, timestamp, channelId = '') {
            return this._engine.deleteRemoteMessageByTimestamp(conversationType, targetId, timestamp, channelId);
        }
        /**
         * 加入聊天室，若聊天室不存在则创建聊天室
         * @param roomId 聊天室房间 Id
         * @param count 进入聊天室成功后，自动拉取的历史消息数量，默认值为 `10`，最大有效值为 `50`，`-1` 为不拉取
         */
        joinChatroom(roomId, count = 10) {
            return this._engine.joinChatroom(roomId, count);
        }
        /**
         * 加入聊天室，若聊天室不存在则抛出异常
         * @param roomId 聊天室房间 Id
         * @param count 进入聊天室成功后，自动拉取的历史消息数量，默认值为 `10`，最大有效值为 `50`，`-1` 为不拉取
         */
        joinExistChatroom(roomId, count = 10) {
            return this._engine.joinExistChatroom(roomId, count);
        }
        /**
         * 退出聊天室
         * @param roomId
         */
        quitChatroom(roomId) {
            return this._engine.quitChatroom(roomId);
        }
        /**
         * 获取聊天室房间数据
         * @description count 或 order 有一个为 0 时，只返回成员总数，不返回成员列表信息
         * @param roomId 聊天室 Id
         * @param count 获取房间人员列表数量，最大有效值 `20`，最小值未 `0`，默认为 0
         * @param order 人员排序方式，`1` 为正序，`2` 为倒序，默认为 0
         */
        getChatroomInfo(roomId, count = 0, order = 0) {
            return this._engine.getChatroomInfo(roomId, count, order);
        }
        /**
         * 在指定聊天室中设置自定义属性
         * @description 仅聊天室中不存在此属性或属性设置者为己方时可设置成功
         * @param roomId 聊天室房间 id
         * @param entry 属性信息
         */
        setChatroomEntry(roomId, entry) {
            const { key, value } = entry;
            if (!isValidChrmEntryKey(key) || !isValidChrmEntryValue(value)) {
                return Promise.resolve(ErrorCode$1.BIZ_ERROR_INVALID_PARAMETER);
            }
            return this._engine.setChatroomEntry(roomId, entry);
        }
        /**
         * 在指定聊天室中强制增加 / 修改任意聊天室属性
         * @description 仅聊天室中不存在此属性或属性设置者为己方时可设置成功
         * @param roomId 聊天室房间 id
         * @param entry 属性信息
         */
        forceSetChatroomEntry(roomId, entry) {
            const { key, value } = entry;
            if (!isValidChrmEntryKey(key) || !isValidChrmEntryValue(value)) {
                return Promise.resolve(ErrorCode$1.BIZ_ERROR_INVALID_PARAMETER);
            }
            return this._engine.forceSetChatroomEntry(roomId, entry);
        }
        /**
         * 删除聊天室属性
         * @description 该方法仅限于删除自己设置的聊天室属性
         * @param roomId 聊天室房间 id
         * @param entry 要移除的属性信息
         */
        removeChatroomEntry(roomId, entry) {
            const { key } = entry;
            if (!isValidChrmEntryKey(key)) {
                return Promise.resolve(ErrorCode$1.BIZ_ERROR_INVALID_PARAMETER);
            }
            return this._engine.removeChatroomEntry(roomId, entry);
        }
        /**
         * 强制删除任意聊天室属性
         * @description 该方法仅限于删除自己设置的聊天室属性
         * @param roomId 聊天室房间 id
         * @param entry 要移除的属性信息
         */
        forceRemoveChatroomEntry(roomId, entry) {
            const { key } = entry;
            if (!isValidChrmEntryKey(key)) {
                return Promise.resolve(ErrorCode$1.BIZ_ERROR_INVALID_PARAMETER);
            }
            return this._engine.forceRemoveChatroomEntry(roomId, entry);
        }
        /**
         * 获取聊天室中的指定属性
         * @param roomId 聊天室房间 id
         * @param key 属性键名
         */
        getChatroomEntry(roomId, key) {
            return this._engine.getChatroomEntry(roomId, key);
        }
        /**
         * 获取聊天室内的所有属性
         * @param roomId 聊天室房间 id
         */
        getAllChatroomEntries(roomId) {
            return this._engine.getAllChatroomEntry(roomId);
        }
        /**
         * 拉取聊天室内的历史消息
         * @param roomId
         * @param count 拉取消息条数, 有效值范围 `1 - 20`
         * @param order 获取顺序，默认值为 0。
         * * 0：降序，用于获取早于指定时间戳发送的消息
         * * 1：升序，用于获取晚于指定时间戳发送的消息
         * @param timestamp 指定拉取消息用到的时间戳。默认值为 `0`，表示按当前时间拉取
         */
        getChatRoomHistoryMessages(roomId, count = 20, order = 0, timestamp = 0) {
            return this._engine.getChatroomHistoryMessages(roomId, timestamp, count, order);
        }
        /**
         * 获取 七牛、百度上传认证信息
         * @param fileType 文件类型
         * @param fileName 文件名
        */
        getFileToken(fileType, fileName) {
            return __awaiter(this, void 0, void 0, function* () {
                const naviInfo = this.getInfoFromCache();
                const bos = (naviInfo === null || naviInfo === void 0 ? void 0 : naviInfo.bosAddr) || '';
                const qiniu = (naviInfo === null || naviInfo === void 0 ? void 0 : naviInfo.uploadServer) || '';
                const ossConfig = (naviInfo === null || naviInfo === void 0 ? void 0 : naviInfo.ossConfig) || '';
                const { code, data } = yield this._engine.getFileToken(fileType, fileName);
                if (code === ErrorCode$1.SUCCESS) {
                    return Promise.resolve(Object.assign(data, { bos, qiniu, ossConfig }));
                }
                return Promise.reject(code);
            });
        }
        /**
         * 获取 七牛、百度、阿里云 上传成功可下载的 URL
         * @param fileType 文件类型
         * @param uploadMethod 上传方式
         * @param fileName 文件名
         * @param originName 文件源名
         * @param uploadRes 插件上传返回的结果。降级百度上传后，用户传入返回结果，再把结果里的下载地址返回给用户，保证兼容之前结果获取
        */
        getFileUrl(fileType, fileName, originName, uploadRes, uploadMethod = UploadMethod$1.QINIU) {
            return __awaiter(this, void 0, void 0, function* () {
                if (uploadRes === null || uploadRes === void 0 ? void 0 : uploadRes.isBosRes) {
                    return Promise.resolve(uploadRes);
                }
                const { code, data } = yield this._engine.getFileUrl(fileType, uploadMethod, fileName, originName);
                if (code === ErrorCode$1.SUCCESS) {
                    return Promise.resolve(data);
                }
                return Promise.reject(code);
            });
        }
        /**
         * 创建标签
         * @param tag 标签
         */
        createTag(tag) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.createTag(tag);
            });
        }
        /**
         * 删除标签
         * @param tagId 标签id
         */
        removeTag(tagId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.removeTag(tagId);
            });
        }
        /**
         * 更新标签
         * @param tag 标签
         */
        updateTag(tag) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.updateTag(tag);
            });
        }
        /**
         * 获取标签列表
         */
        getTagList() {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getTagList();
            });
        }
        /**
         * 添加会话到标签（给多个会话增加标签）
         * @param tagId 标签id
         * @param conversations 要添加的会话列表
         */
        addTagForConversations(tagId, conversations) {
            return __awaiter(this, void 0, void 0, function* () {
                if (conversations.length > 1000) {
                    return Promise.reject(ErrorCode$1.CONVER_OUT_LIMIT_ERROR);
                }
                return this._engine.addTagForConversations(tagId, conversations);
            });
        }
        /**
         * 删除标签中的会话(从多个会话中批量删除指定标签)
         * @param tagId 标签id
         * @param conversations 要删除的会话列表
         */
        removeTagForConversations(tagId, conversations) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.removeTagForConversations(tagId, conversations);
            });
        }
        /**
         * 删除会话中的标签(从单一会话中批量删除标签)
         * @param conversationType 会话类型
         * @param targetId 会话id
         * @param tagIds 要删除的标签列表
         */
        removeTagsForConversation(conversation, tagIds) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.removeTagsForConversation(conversation, tagIds);
            });
        }
        /**
         * 获取标签下的会话列表
         * @param tagId 标签id
         */
        getConversationListByTag(tagId, startTime, count, channelId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getConversationListByTag(tagId, startTime, count, channelId);
            });
        }
        /**
         * 获取标签下的未读消息数
         * @param tagId 标签id
         * @param containMuted 是否包含免打扰会话
         */
        getUnreadCountByTag(tagId, containMuted) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getUnreadCountByTag(tagId, containMuted);
            });
        }
        /**
         * 设置标签中会话置顶
         * @param conversation 会话
         */
        setConversationStatusInTag(tagId, conversation, status) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.setConversationStatusInTag(tagId, conversation, status);
            });
        }
        /**
         * 获取会话里的标签
         * @param conversation
         */
        getTagsForConversation(conversation) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getTagsForConversation(conversation);
            });
        }
        /* ============================= 以下为 CPP 接口 ================================== */
        /**
         * 调用非标准方法。所谓非标准方法，是为某些特定需求或产品添加，暂未作为标准接口添加至 API 层。
         * 对于未实现的方法，接口响应 Unsupport 错误码
         * @param method 方法名
         * @param args
         */
        callExtra(method, ...args) {
            return this._engine.callExtra(method, ...args);
        }
        /* ============================= 以下为 CPP 接口 ================================== */
        /**
         * 删除所有会话
        */
        clearConversations(conversationTypes, tag) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this._engine.clearConversations(conversationTypes, tag);
            });
        }
        /**
         * 设置用户连接状态监听器
        */
        setUserStatusListener(config, listener) {
            return this._engine.setUserStatusListener(config, (data) => {
                try {
                    listener(data);
                }
                catch (error) {
                    logger.error(error);
                }
            });
        }
        /**
         * 添加用户黑名单
        */
        addToBlacklist(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.addToBlacklist(userId);
            });
        }
        /**
         * 将指定用户移除黑名单
        */
        removeFromBlacklist(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.removeFromBlacklist(userId);
            });
        }
        /**
         * 获取黑名单列表
        */
        getBlacklist() {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getBlacklist();
            });
        }
        /**
         * 获取指定人员在黑名单中的状态
        */
        getBlacklistStatus(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getBlacklistStatus(userId);
            });
        }
        /**
         * 向本地插入一条消息，不发送到服务器
        */
        insertMessage(conversationType, targetId, insertOptions) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.insertMessage(conversationType, targetId, insertOptions);
            });
        }
        /**
         * 删除本地消息
        */
        deleteMessages(timestamp) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.deleteMessages(timestamp);
            });
        }
        /**
         * 从本地消息数据库中删除某一会话指定时间之前的消息数据
        */
        deleteMessagesByTimestamp(conversationType, targetId, timestamp, cleanSpace, channelId = '') {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.deleteMessagesByTimestamp(conversationType, targetId, timestamp, cleanSpace, channelId);
            });
        }
        /**
         * 清空会话下历史消息
        */
        clearMessages(conversationType, targetId, channelId = '') {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.clearMessages(conversationType, targetId, channelId);
            });
        }
        /**
         * 获取本地消息
        */
        getMessage(messageId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getMessage(messageId);
            });
        }
        /**
         * 设置消息内容
        */
        setMessageContent(messageId, content, messageType) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.setMessageContent(messageId, content, messageType);
            });
        }
        /**
         * 设置消息搜索字段
        */
        setMessageSearchField(messageId, content, searchFiles) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.setMessageSearchField(messageId, content, searchFiles);
            });
        }
        /**
         * 设置消息发送状态
        */
        setMessageSentStatus(messageId, sentStatus) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.setMessageSentStatus(messageId, sentStatus);
            });
        }
        /**
        * 设置消息接收状态
        */
        setMessageReceivedStatus(messageId, receivedStatus) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.setMessageReceivedStatus(messageId, receivedStatus);
            });
        }
        /**
         * 设置当前用户在线状态
        */
        setUserStatus(status) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.setUserStatus(status);
            });
        }
        /**
         * 订阅用户在线状态
        */
        subscribeUserStatus(userIds) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.subscribeUserStatus(userIds);
            });
        }
        /**
         * 获取用户在线状态
        */
        getUserStatus(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.getUserStatus(userId);
            });
        }
        searchConversationByContent(keyword, customMessageTypes = [], channelId = '', conversationTypes) {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.searchConversationByContent(keyword, customMessageTypes, channelId, conversationTypes);
            });
        }
        searchMessageByContent(conversationType, targetId, keyword, timestamp, count, total, channelId = '') {
            return __awaiter(this, void 0, void 0, function* () {
                return this._engine.searchMessageByContent(conversationType, targetId, keyword, timestamp, count, total, channelId);
            });
        }
        getUnreadMentionedMessages(conversationType, targetId, channelId = '') {
            return this._engine.getUnreadMentionedMessages(conversationType, targetId, channelId);
        }
        clearUnreadCountByTimestamp(conversationType, targetId, timestamp, channelId = '') {
            return this._engine.clearUnreadCountByTimestamp(conversationType, targetId, timestamp, channelId);
        }
        /**
         * 获取会话免打扰状态
        */
        getConversationNotificationStatus(conversationType, targetId, channelId = '') {
            return this._engine.getConversationNotificationStatus(conversationType, targetId, channelId);
        }
        getRemoteHistoryMessages(conversationType, targetId, timestamp, count, order, channelId) {
            return this._engine.getRemoteHistoryMessages(conversationType, targetId, timestamp, count, order, channelId);
        }
        /* ============================= CPP 接口 END =================================== */
        /* ============================= 以下为 RTC 相关接口 ============================== */
        /**
         * 加入房间
         * @param roomId
         * @param mode 房间模式：直播 or 会议
         * @param mediaType 直播房间模式下的媒体资源类型
         */
        joinRTCRoom(roomId, mode, mediaType) {
            return this._engine.joinRTCRoom(roomId, mode, mediaType);
        }
        quitRTCRoom(roomId) {
            return this._engine.quitRTCRoom(roomId);
        }
        rtcPing(roomId, mode, mediaType) {
            return this._engine.rtcPing(roomId, mode, mediaType);
        }
        getRTCRoomInfo(roomId) {
            return this._engine.getRTCRoomInfo(roomId);
        }
        getRTCUserInfoList(roomId) {
            return this._engine.getRTCUserInfoList(roomId);
        }
        getRTCUserInfo(roomId) {
            return this._engine.getRTCUserInfo(roomId);
        }
        setRTCUserInfo(roomId, key, value) {
            return this._engine.setRTCUserInfo(roomId, key, value);
        }
        removeRTCUserInfo(roomId, keys) {
            return this._engine.removeRTCUserInfo(roomId, keys);
        }
        setRTCData(roomId, key, value, isInner, apiType, message) {
            return this._engine.setRTCData(roomId, key, value, isInner, apiType, message);
        }
        setRTCTotalRes(roomId, message, valueInfo, objectName) {
            return this._engine.setRTCTotalRes(roomId, message, valueInfo, objectName);
        }
        getRTCData(roomId, keys, isInner, apiType) {
            return this._engine.getRTCData(roomId, keys, isInner, apiType);
        }
        removeRTCData(roomId, keys, isInner, apiType, message) {
            return this._engine.removeRTCData(roomId, keys, isInner, apiType, message);
        }
        setRTCOutData(roomId, rtcData, type, message) {
            return this._engine.setRTCOutData(roomId, rtcData, type, message);
        }
        getRTCOutData(roomId, userIds) {
            return this._engine.getRTCOutData(roomId, userIds);
        }
        getRTCToken(roomId, mode, broadcastType) {
            return this._engine.getRTCToken(roomId, mode, broadcastType);
        }
        // RTC 北极星数据上报
        setRTCState(roomId, report) {
            return this._engine.setRTCState(roomId, report);
        }
        getRTCUserList(roomId) {
            return this._engine.getRTCUserList(roomId);
        }
    }

    /**
     * 标签相关接口
     */
    exports.TagChangeType = void 0;
    (function (TagChangeType) {
        TagChangeType[TagChangeType["add"] = 1] = "add";
        TagChangeType[TagChangeType["update"] = 2] = "update";
        TagChangeType[TagChangeType["delete"] = 3] = "delete";
    })(exports.TagChangeType || (exports.TagChangeType = {}));
    // export interface ITagChange {
    //   type: TagChangeType,
    //   list: ITagParam[]
    // }
    // export interface IReceivedTag {
    //   tagId: string
    //   name?: string
    //   createdTime?: number
    // }

    /**
     * engine 版本号
     */
    const version = "4.3.0-alpha.8";

    exports.AEngine = AEngine;
    exports.ANavi = ANavi;
    exports.APIContext = APIContext;
    exports.AppStorage = AppStorage;
    exports.CPP_PROTOCAL_MSGTYPE_OPTION = CPP_PROTOCAL_MSGTYPE_OPTION;
    exports.CallLibMsgType = CallLibMsgType;
    exports.CometChannel = CometChannel;
    exports.ConnectResultCode = ConnectResultCode;
    exports.ConnectionStatus = ConnectionStatus$1;
    exports.ConversationType = ConversationType$1;
    exports.DelayTimer = DelayTimer;
    exports.ErrorCode = ErrorCode$1;
    exports.EventEmitter = EventEmitter;
    exports.FileType = FileType$1;
    exports.IM_COMET_PULLMSG_TIMEOUT = IM_COMET_PULLMSG_TIMEOUT;
    exports.IM_PING_INTERVAL_TIME = IM_PING_INTERVAL_TIME;
    exports.IM_PING_MAX_TIMEOUT = IM_PING_MAX_TIMEOUT;
    exports.IM_PING_MIN_TIMEOUT = IM_PING_MIN_TIMEOUT;
    exports.IM_SIGNAL_TIMEOUT = IM_SIGNAL_TIMEOUT;
    exports.Logger = Logger;
    exports.MAX_MESSAGE_CONTENT_BYTES = MAX_MESSAGE_CONTENT_BYTES;
    exports.MINI_COMET_CONNECT_URIS = MINI_COMET_CONNECT_URIS;
    exports.MINI_SOCKET_CONNECT_URIS = MINI_SOCKET_CONNECT_URIS;
    exports.MentionedType = MentionedType$1;
    exports.MessageDirection = MessageDirection$1;
    exports.MessageType = MessageType$1;
    exports.NAVI_CACHE_DURATION = NAVI_CACHE_DURATION;
    exports.NAVI_REQ_TIMEOUT = NAVI_REQ_TIMEOUT;
    exports.NotificationStatus = NotificationStatus$1;
    exports.PING_REQ_TIMEOUT = PING_REQ_TIMEOUT;
    exports.PUBLIC_CLOUD_NAVI_URIS = PUBLIC_CLOUD_NAVI_URIS;
    exports.PluginContext = PluginContext;
    exports.RCAssertError = RCAssertError;
    exports.RTCPluginContext = RTCPluginContext;
    exports.ReceivedStatus = ReceivedStatus$1;
    exports.SEND_MESSAGE_TYPE_OPTION = SEND_MESSAGE_TYPE_OPTION;
    exports.STORAGE_ROOT_KEY = STORAGE_ROOT_KEY;
    exports.UploadMethod = UploadMethod$1;
    exports.WEB_SOCKET_TIMEOUT = WEB_SOCKET_TIMEOUT;
    exports.WebSocketChannel = WebSocketChannel;
    exports.appendUrl = appendUrl;
    exports.assert = assert;
    exports.cloneByJSON = cloneByJSON;
    exports.forEach = forEach;
    exports.getMimeKey = getMimeKey;
    exports.getUploadFileName = getUploadFileName;
    exports.indexOf = indexOf;
    exports.isArray = isArray;
    exports.isArrayBuffer = isArrayBuffer;
    exports.isFunction = isFunction;
    exports.isHttpUrl = isHttpUrl;
    exports.isInObject = isInObject;
    exports.isInclude = isInclude;
    exports.isNull = isNull;
    exports.isNumber = isNumber;
    exports.isObject = isObject;
    exports.isString = isString;
    exports.isUndefined = isUndefined;
    exports.isValidChrmEntryKey = isValidChrmEntryKey;
    exports.isValidChrmEntryValue = isValidChrmEntryValue;
    exports.isValidConversationType = isValidConversationType;
    exports.isValidFileType = isValidFileType;
    exports.map = map;
    exports.notEmptyArray = notEmptyArray;
    exports.notEmptyObject = notEmptyObject;
    exports.notEmptyString = notEmptyString;
    exports.pushConfigsToJSON = pushConfigsToJSON;
    exports.todo = todo;
    exports.usingCppEngine = usingCppEngine;
    exports.validate = validate;
    exports.version = version;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
/*
 * RongIMLib - v2.8.0-alpha.9
 * CommitId - 449779def82f3909634fa71fdc1ddd7147c56f11
 * Fri Mar 05 2021 19:45:50 GMT+0800 (中国标准时间)
 * ©2020 RongCloud, Inc. All rights reserved.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@rongcloud/engine')) :
    typeof define === 'function' && define.amd ? define(['exports', '@rongcloud/engine'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.RongIMLib = {}, global.RCEngine));
}(this, (function (exports, engine) { 'use strict';

    var SentStatus;
    (function (SentStatus) {
        /**
         * 发送中。
         */
        SentStatus[SentStatus["SENDING"] = 10] = "SENDING";
        /**
         * 发送失败。
         */
        SentStatus[SentStatus["FAILED"] = 20] = "FAILED";
        /**
         * 已发送。
         */
        SentStatus[SentStatus["SENT"] = 30] = "SENT";
        /**
         * 对方已接收。
         */
        SentStatus[SentStatus["RECEIVED"] = 40] = "RECEIVED";
        /**
         * 对方已读。
         */
        SentStatus[SentStatus["READ"] = 50] = "READ";
        /**
         * 对方已销毁。
         */
        SentStatus[SentStatus["DESTROYED"] = 60] = "DESTROYED";
    })(SentStatus || (SentStatus = {}));
    var SentStatus$1 = SentStatus;

    var GetChatRoomType;
    (function (GetChatRoomType) {
        GetChatRoomType[GetChatRoomType["NONE"] = 0] = "NONE";
        GetChatRoomType[GetChatRoomType["SQQUENCE"] = 1] = "SQQUENCE";
        GetChatRoomType[GetChatRoomType["REVERSE"] = 2] = "REVERSE";
    })(GetChatRoomType || (GetChatRoomType = {}));
    var GetChatRoomType$1 = GetChatRoomType;

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    const logger = new engine.Logger('RCIM');
    logger.set(engine.LogLevel.DEBUG );

    const hasMiniBaseEvent = (miniGlobal) => {
        const baseMiniEventNames = ['canIUse', 'getSystemInfo'];
        for (let i = 0, max = baseMiniEventNames.length; i < max; i++) {
            const baseEventName = baseMiniEventNames[i];
            if (!miniGlobal[baseEventName]) {
                return false;
            }
        }
        return true;
    };
    const isFromUniappEnv = () => {
        if (typeof uni !== 'undefined' && hasMiniBaseEvent(uni)) {
            return true;
        }
        return false;
    };

    const isFromUniapp$2 = isFromUniappEnv();
    const createXHR = () => {
        const hasCORS = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
        if (typeof XMLHttpRequest !== 'undefined' && hasCORS) {
            return new XMLHttpRequest();
        }
        else if (typeof XDomainRequest !== 'undefined') {
            return new XDomainRequest();
        }
        else {
            return new ActiveXObject('Microsoft.XMLHTTP');
        }
    };
    function httpReq(options) {
        const method = options.method || engine.HttpMethod.GET;
        const timeout = options.timeout || 60 * 1000;
        const { headers, query, body } = options;
        const url = engine.appendUrl(options.url, query);
        return new Promise((resolve) => {
            const xhr = createXHR();
            const isXDomainRequest = Object.prototype.toString.call(xhr) === '[object XDomainRequest]';
            xhr.open(method, url);
            if (headers && xhr.setRequestHeader) {
                for (const key in headers) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }
            if (isXDomainRequest) {
                xhr.timeout = timeout;
                xhr.onload = function () {
                    resolve({ data: xhr.responseText, status: xhr.status || 200 });
                };
                xhr.onerror = function () {
                    resolve({ status: xhr.status || 0 });
                };
                xhr.ontimeout = () => {
                    resolve({ status: xhr.status || 0 });
                };
                const reqBody = typeof body === 'object' ? JSON.stringify(body) : body;
                xhr.send(reqBody);
            }
            else {
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        resolve({ data: xhr.responseText, status: xhr.status });
                    }
                };
                xhr.onerror = function () {
                    resolve({ status: xhr.status || 0 });
                };
                setTimeout(() => resolve({ status: xhr.status || 0 }), timeout);
                xhr.send(body);
            }
        });
    }
    function createWebSocket(url, protocols) {
        const ws = new WebSocket(url, protocols);
        ws.binaryType = 'arraybuffer';
        return {
            onClose(callback) {
                ws.onclose = (evt) => {
                    const { code, reason } = evt;
                    callback(code, reason);
                };
            },
            onError(callback) {
                ws.onerror = callback;
            },
            onMessage(callback) {
                ws.onmessage = (evt) => {
                    callback(evt.data);
                };
            },
            onOpen(callback) {
                ws.onopen = callback;
            },
            send(data) {
                ws.send(data);
            },
            close(code, reason) {
                ws.close(code, reason);
            }
        };
    }
    const browser = {
        tag: "browser",
        httpReq,
        localStorage: window === null || window === void 0 ? void 0 : window.localStorage,
        sessionStorage: window === null || window === void 0 ? void 0 : window.sessionStorage,
        isSupportSocket() {
            const bool = typeof WebSocket !== 'undefined';
            bool || logger.warn('websocket not support');
            return bool;
        },
        useNavi: true,
        connectPlatform: '',
        isFromUniapp: isFromUniapp$2,
        createWebSocket,
        createDataChannel(watcher, connectType) {
            if (this.isSupportSocket() && connectType === 'websocket') {
                return new engine.WebSocketChannel(this, watcher);
            }
            else {
                return new engine.CometChannel(this, watcher);
            }
        }
    };

    const isFromUniapp$1 = isFromUniappEnv();
    const createFunc$2 = (method) => (...args) => {
        try {
            return wx[method](...args);
        }
        catch (err) {
            // 此 Bug 是由于微信小程序数据库文件可能会意外损坏导致，目前无解
            logger.error(err);
        }
    };
    const storage$2 = {
        setItem: createFunc$2('setStorageSync'),
        getItem: createFunc$2('getStorageSync'),
        removeItem: createFunc$2('removeStorageSync'),
        clear: createFunc$2('clearStorageSync')
    };
    /**
     * @todo
     */
    const wechat = {
        tag: "wechat",
        httpReq(options) {
            const method = options.method || engine.HttpMethod.GET;
            const timeout = options.timeout || 60 * 1000;
            const { headers, query, body } = options;
            const url = engine.appendUrl(options.url, query);
            return new Promise((resolve) => {
                wx.request({
                    url,
                    method,
                    headers,
                    timeout,
                    data: body,
                    success: (res) => {
                        resolve({ data: res.data, status: res.statusCode });
                    },
                    fail: () => {
                        resolve({ status: engine.ErrorCode.RC_HTTP_REQ_TIMEOUT });
                    }
                });
            });
        },
        localStorage: storage$2,
        sessionStorage: storage$2,
        isSupportSocket() {
            return true;
        },
        useNavi: false,
        connectPlatform: 'MiniProgram',
        isFromUniapp: isFromUniapp$1,
        createWebSocket(url, protocols) {
            const socketTask = wx.connectSocket({ url, protocols });
            return {
                onClose(callback) {
                    socketTask.onClose((res) => {
                        callback(res.code, res.reason);
                    });
                },
                onError(callback) {
                    socketTask.onError((res) => {
                        callback(res.errMsg);
                    });
                },
                onMessage(callback) {
                    socketTask.onMessage((res) => {
                        callback(res.data);
                    });
                },
                onOpen(callback) {
                    socketTask.onOpen(callback);
                },
                send(data) {
                    socketTask.send({ data });
                },
                close(code, reason) {
                    socketTask.close({ code, reason });
                }
            };
        },
        createDataChannel(watcher) {
            return new engine.WebSocketChannel(this, watcher);
        }
    };

    const isFromUniapp = isFromUniappEnv();
    const createFunc$1 = (method) => (...args) => {
        try {
            return my[method](...args);
        }
        catch (err) {
            logger.error(err);
        }
    };
    const storage$1 = {
        setItem: createFunc$1('setStorageSync'),
        getItem: createFunc$1('getStorageSync'),
        removeItem: createFunc$1('removeStorageSync'),
        clear: createFunc$1('clearStorageSync')
    };
    const alipay = {
        tag: "alipay",
        httpReq(options) {
            const method = options.method || engine.HttpMethod.GET;
            const timeout = options.timeout || 60 * 1000;
            const { headers, query, body } = options;
            const url = engine.appendUrl(options.url, query);
            return new Promise((resolve) => {
                my.request({
                    url,
                    method,
                    headers,
                    timeout,
                    data: body,
                    success: (res) => {
                        resolve({ data: res.data, status: res.status });
                    },
                    fail: () => {
                        resolve({ status: engine.ErrorCode.RC_HTTP_REQ_TIMEOUT });
                    }
                });
            });
        },
        localStorage: storage$1,
        sessionStorage: storage$1,
        isSupportSocket() {
            return false;
        },
        useNavi: false,
        connectPlatform: 'MiniProgram',
        isFromUniapp,
        createDataChannel(watcher) {
            return new engine.CometChannel(this, watcher);
        }
    };

    // TODO
    const createFunc = (method) => (...args) => {
        try {
            return uni[method](...args);
        }
        catch (err) {
            logger.error(err);
        }
    };
    const storage = {
        setItem: createFunc('setStorageSync'),
        getItem: createFunc('getStorageSync'),
        removeItem: createFunc('removeStorageSync'),
        clear: createFunc('clearStorageSync')
    };
    /**
     * @todo
     */
    const appPlus = {
        tag: "uniapp",
        httpReq(options) {
            const method = options.method || engine.HttpMethod.GET;
            const timeout = options.timeout || 60 * 1000;
            const { headers, query, body } = options;
            const url = engine.appendUrl(options.url, query);
            return new Promise((resolve) => {
                uni.request({
                    url,
                    method,
                    headers,
                    timeout,
                    data: body,
                    success: (res) => {
                        resolve({ data: res.data, status: res.statusCode });
                    },
                    fail: () => {
                        resolve({ status: engine.ErrorCode.RC_HTTP_REQ_TIMEOUT });
                    }
                });
            });
        },
        localStorage: storage,
        sessionStorage: storage,
        isSupportSocket() {
            return true;
        },
        useNavi: true,
        connectPlatform: '',
        isFromUniapp: true,
        createWebSocket(url, protocols) {
            const options = {
                complete: () => { },
                url,
                protocols
            };
            const socketTask = uni.connectSocket(options);
            return {
                onClose(callback) {
                    socketTask.onClose((res) => {
                        callback(res.code, res.reason);
                    });
                },
                onError(callback) {
                    socketTask.onError((res) => {
                        callback(res.errMsg);
                    });
                },
                onMessage(callback) {
                    socketTask.onMessage((res) => {
                        callback(res.data);
                    });
                },
                onOpen(callback) {
                    socketTask.onOpen(callback);
                },
                send(data) {
                    socketTask.send({ data });
                },
                close(code, reason) {
                    socketTask.close({ code, reason });
                }
            };
        },
        createDataChannel(watcher) {
            return new engine.WebSocketChannel(this, watcher);
        }
    };
    const uniapp = () => {
        const uniPlatform = process.env.VUE_APP_PLATFORM;
        switch (uniPlatform) {
            case 'app-plus':
                return appPlus;
            // case 'mp-baidu':
            //   return {}
            // case 'mp-toutiao':
            //   return {}
            case 'mp-alipay':
                return alipay;
            case 'mp-weixin':
                return wechat;
            case 'h5':
            default:
                return browser;
        }
    };

    const isMiniPrograme = (miniGlobal) => {
        return miniGlobal && miniGlobal.canIUse && miniGlobal.getSystemInfo;
    };
    const runtime = (() => {
        if (typeof uni !== 'undefined' && isMiniPrograme(uni)) {
            return uniapp();
        }
        if (typeof wx !== 'undefined' && isMiniPrograme(wx)) {
            return wechat;
        }
        if (typeof my !== 'undefined' && isMiniPrograme(my)) {
            return alipay;
        }
        return browser;
    })();

    const MsgTypeMapping = {
        'RC:TxtMsg': 'TextMessage',
        'RC:ImgMsg': 'ImageMessage',
        'RC:VcMsg': 'VoiceMessage',
        'RC:ImgTextMsg': 'RichContentMessage',
        'RC:ReferenceMsg': 'ReferenceMessage',
        'RC:FileMsg': 'FileMessage',
        'RC:HQVCMsg': 'HQVoiceMessage',
        'RC:GIFMsg': 'GIFMessage',
        'RC:SightMsg': 'SightMessage',
        'RC:LBSMsg': 'LocationMessage',
        'RC:InfoNtf': 'InformationNotificationMessage',
        'RC:ContactNtf': 'ContactNotificationMessage',
        'RC:ProfileNtf': 'ProfileNotificationMessage',
        'RC:CmdNtf': 'CommandNotificationMessage',
        'RC:DizNtf': 'DiscussionNotificationMessage',
        'RC:CmdMsg': 'CommandMessage',
        'RC:TypSts': 'TypingStatusMessage',
        'RC:CsChaR': 'ChangeModeResponseMessage',
        'RC:CsHsR': 'HandShakeResponseMessage',
        'RC:CsEnd': 'TerminateMessage',
        'RC:CsSp': 'SuspendMessage',
        'RC:CsUpdate': 'CustomerStatusUpdateMessage',
        'RC:ReadNtf': 'ReadReceiptMessage',
        'RC:VCAccept': 'AcceptMessage',
        'RC:VCRinging': 'RingingMessage',
        'RC:VCSummary': 'SummaryMessage',
        'RC:VCHangup': 'HungupMessage',
        'RC:VCInvite': 'InviteMessage',
        'RC:VCModifyMedia': 'MediaModifyMessage',
        'RC:VCModifyMem': 'MemberModifyMessage',
        'RC:CsContact': 'CustomerContact',
        'RC:PSImgTxtMsg': 'PublicServiceRichContentMessage',
        'RC:PSMultiImgTxtMsg': 'PublicServiceMultiRichContentMessage',
        'RC:GrpNtf': 'GroupNotificationMessage',
        'RC:PSCmd': 'PublicServiceCommandMessage',
        'RC:RcCmd': 'RecallCommandMessage',
        'RC:SRSMsg': 'SyncReadStatusMessage',
        'RC:RRReqMsg': 'ReadReceiptRequestMessage',
        'RC:RRRspMsg': 'ReadReceiptResponseMessage',
        'RCJrmf:RpMsg': 'JrmfRedPacketMessage',
        'RCJrmf:RpOpendMsg': 'JrmfRedPacketOpenedMessage',
        'RC:CombineMsg': 'RCCombineMessage',
        'RC:chrmKVNotiMsg': 'ChrmKVNotificationMessage',
        'RC:LogCmdMsg': 'LogCommandMessage',
        'RC:MsgExMsg': 'ExpansionCommandMessage'
    };

    const RegisterMessageTypeMapping = {};

    const v2Storage = new engine.AppStorage(runtime, 'API-V2');

    /**
     * 根据底层会话构建 V2 会话
    */
    function tranToV2Conversation(conversation) {
        const { channelId, conversationType, targetId, unreadMessageCount, latestMessage, isTop, notificationStatus } = conversation;
        const v2ReceicedMessage = latestMessage ? tranToV2Message(latestMessage) : null;
        const { messageType: objectName, sentTime, receivedStatus, messageId } = v2ReceicedMessage || {};
        return {
            channelId: channelId || '',
            conversationType,
            targetId,
            unreadMessageCount,
            latestMessage: v2ReceicedMessage,
            latestMessageId: messageId || null,
            objectName: objectName || null,
            sentTime: sentTime || null,
            isTop,
            notificationStatus,
            receivedStatus: receivedStatus || null
        };
    }
    /**
     * 根据底层会话构建 V2 会话
    */
    function tranToV2ConversationContainTag(conversation) {
        const { channelId, conversationType, targetId, unreadMessageCount, latestMessage, isTop, notificationStatus, isTopInTag } = conversation;
        const v2ReceicedMessage = latestMessage ? tranToV2Message(latestMessage) : null;
        const { messageType: objectName, sentTime, receivedStatus, messageId } = v2ReceicedMessage || {};
        return {
            channelId: channelId || '',
            conversationType,
            targetId,
            unreadMessageCount,
            latestMessage: v2ReceicedMessage,
            latestMessageId: messageId || null,
            objectName: objectName || null,
            sentTime: sentTime || null,
            isTop,
            notificationStatus,
            receivedStatus: receivedStatus || null,
            isTopInTag
        };
    }
    /**
     * 根据底层消息构建 V2 消息
    */
    function tranToV2Message(message) {
        let { conversationType, targetId, senderUserId, content, messageType, messageUId, messageDirection, isOffLineMessage: offLineMessage, sentTime, receivedStatus, receivedTime, canIncludeExpansion, disableNotification, expansion, messageId, sentStatus, channelId } = message;
        // TODO messageType 为消息类型映射的自定义文本，与注册消息同步实现
        let v2MessageType = '';
        if (messageType in MsgTypeMapping) {
            v2MessageType = MsgTypeMapping[messageType];
        }
        else if (messageType in RegisterMessageTypeMapping) {
            v2MessageType = RegisterMessageTypeMapping[messageType];
        }
        else {
            content = {
                message: {
                    content,
                    objectName: messageType
                },
                messageName: 'UnknownMessage'
            };
            v2MessageType = 'UnknownMessage';
        }
        if (!receivedStatus) {
            receivedStatus = engine.ReceivedStatus.UNREAD;
        }
        if (messageId === undefined) {
            messageId = ~~(Math.random() * 0xffffff);
        }
        return {
            channelId: channelId || '',
            conversationType,
            targetId,
            senderUserId,
            content,
            messageType: v2MessageType,
            messageUId,
            messageDirection,
            offLineMessage,
            sentTime,
            receivedStatus,
            receivedTime,
            objectName: messageType,
            messageId,
            sentStatus: sentStatus || SentStatus$1.SENT,
            disableNotification,
            canIncludeExpansion,
            expansion
        };
    }
    /**
     * 处理群回执请求消息本地存储
    */
    function handleRRReqMsg(message, currentUserId) {
        const day = new Date();
        const month = day.getMonth() + 1;
        const date = day.getFullYear() + '/' + (month.toString().length === 1 ? '0' + month : month) + '/' + day.getDate();
        // new Date(date).getTime() - message.sentTime < 1 逻辑判断 超过 1 天未收的 ReadReceiptRequestMessage 离线消息自动忽略。
        const dealtime = new Date(date).getTime() - message.sentTime < 0;
        const { messageType, messageDirection } = message;
        if (messageType === 'ReadReceiptRequestMessage' && dealtime && messageDirection === engine.MessageDirection.SEND) {
            const sentKey = `${currentUserId}${message.content.messageUId}SENT`;
            v2Storage.set(sentKey, { count: 0, dealtime: message.sentTime, userIds: {} });
        }
        else if (messageType === 'ReadReceiptRequestMessage' && dealtime) {
            const recKey = `${currentUserId}${message.conversationType}${message.targetId}RECEIVED`;
            const recData = v2Storage.get(recKey);
            if (recData) {
                if (message.senderUserId in recData) {
                    if (recData[message.senderUserId].uIds && recData[message.senderUserId].uIds.indexOf(message.content.messageUId) === -1) {
                        recData[message.senderUserId].uIds.push(message.content.messageUId);
                        recData[message.senderUserId].dealtime = message.sentTime;
                        recData[message.senderUserId].isResponse = false;
                        v2Storage.set(recKey, recData);
                    }
                }
                else {
                    const objSon = { uIds: [message.content.messageUId], dealtime: message.sentTime, isResponse: false };
                    recData[message.senderUserId] = objSon;
                    v2Storage.set(recKey, recData);
                }
            }
            else {
                const obj = {};
                obj[message.senderUserId] = {
                    uIds: [message.content.messageUId],
                    dealtime: message.sentTime,
                    isResponse: false
                };
                v2Storage.set(recKey, obj);
            }
        }
    }
    /**
     * 处理群回执响应消息本地存储
    */
    function handleRRResMsg(message, currentUserId) {
        const day = new Date();
        const month = day.getMonth() + 1;
        const date = day.getFullYear() + '/' + (month.toString().length === 1 ? '0' + month : month) + '/' + day.getDate();
        // new Date(date).getTime() - message.sentTime < 1 逻辑判断 超过 1 天未收的 ReadReceiptRequestMessage 离线消息自动忽略。
        const dealtime = new Date(date).getTime() - message.sentTime < 0;
        if (message.messageType !== 'ReadReceiptResponseMessage' || !dealtime) {
            return message;
        }
        let receiptResponseMsg = message.content;
        receiptResponseMsg = receiptResponseMsg || {};
        const receiptMessageDic = receiptResponseMsg.receiptMessageDic || {};
        const uIds = receiptMessageDic[currentUserId];
        let sentKey = '';
        let sentObj = {};
        message.receiptResponse || (message.receiptResponse = {});
        if (uIds) {
            const cbuIds = [];
            for (let i = 0; i < uIds.length; i++) {
                sentKey = `${currentUserId}${uIds[i]}SENT`;
                sentObj = v2Storage.get(sentKey);
                if (sentObj && !(message.senderUserId in sentObj.userIds)) {
                    cbuIds.push(uIds[i]);
                    sentObj.count += 1;
                    sentObj.userIds[message.senderUserId] = message.sentTime;
                    message.receiptResponse[uIds[i]] = sentObj.count;
                    v2Storage.set(sentKey, sentObj);
                }
            }
            receiptResponseMsg.receiptMessageDic[currentUserId] = cbuIds;
            message.content = receiptResponseMsg;
        }
        return message;
    }
    /**
     * 转换为 API Content 使用的发消息选项
     * {ISendOptionsV2} => {ISendMsgOptions}
    */
    function tranToSendOptions(options, isMentioned, msg) {
        const { userIds, isVoipPush, disableNotification, isFilerWhiteBlacklist, expansion, canIncludeExpansion, pushConfig } = options || {};
        let mentionedUserIdList = [];
        let mentionedType;
        if (isMentioned) {
            const { content: { mentionedInfo: { userIdList, type } } } = msg || {};
            mentionedUserIdList = userIdList;
            mentionedType = type;
        }
        return {
            mentionedType,
            mentionedUserIdList,
            directionalUserIdList: userIds,
            isVoipPush,
            disableNotification,
            isFilerWhiteBlacklist,
            expansion,
            canIncludeExpansion,
            pushConfig
        };
    }
    /**
     * API 接口成功回调钩子，用于捕获应用层 callback.onSuccess 报错
    */
    function onSuccessHook(onSuccess, arg1, arg2) {
        try {
            onSuccess(arg1, arg2);
        }
        catch (error) {
            logger.error(error);
        }
    }
    /**
     * API 接口失败回调钩子，用于捕获应用层 callback.onError 报错
    */
    function onErrorHook(onError, code, data) {
        try {
            onError(code, data);
        }
        catch (error) {
            logger.error(error);
        }
    }

    /**
     * @todo 非直接对用户暴露的数据类
     * 基础消息数据类
     */
    class BaseMessage {
        constructor(messageType, objectName, content, isPersited = true, isCounted = true) {
            this.messageType = messageType;
            this.objectName = objectName;
            this.content = content;
            this.isPersited = isPersited;
            this.isCounted = isCounted;
        }
    }
    /**
     * 注册消息类型，并获取消息类型 class 定义
     * @param messageType v2 中定义的消息类型
     * @param objectName 与移动端对齐的 ObjectName
     * @param isPersited 是否存储，默认为 true
     * @param isCounted 是否计数，默认为 true
     */
    function regMessage(messageType, objectName, isPersited = true, isCounted = true) {
        const define = function (content) {
            const baseMesage = new BaseMessage(messageType, objectName, content, isPersited, isCounted);
            return baseMesage;
        };
        define.MessageType = messageType;
        define.ObjectName = objectName;
        // class 写法编译为 js 后有非法内容
        // const define = messageMap[objectName] = class extends BaseMessage<T> {
        //       /**
        //        * 该类型消息的 MessageType
        //        */
        //       public static readonly MessageType: string = messageType;
        //       /**
        //        * 该类型消息的 ObjectName
        //        */
        //       public static readonly ObjectName: string = objectName;
        //       constructor (content: T) {
        //         super(messageType, objectName, content, isPersited, isCounted)
        //       }
        // }
        return define;
    }

    var ReadReceiptResponseMessage = regMessage('ReadReceiptResponseMessage', 'RC:RRRspMsg');

    class ChannelClient {
        constructor(_context, channelId, _isCPPMode) {
            this._context = _context;
            this.channelId = channelId;
            this._isCPPMode = _isCPPMode;
            this._storage = v2Storage;
            /**
             * 草稿数据
             */
            this._draftMap = {};
        }
        /**
         * 获取会话列表，相对于 2.0 的接口，该接口结果中不再展开会话中最后一条消息的数据
         * @param callback 结果回调
         * @param conversationTypes 会话类型，为 null 时，返回全部会话
         * @param count 获取数量，默认 300
         */
        getConversationList(callback, conversationTypes, count) {
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('conversationTypes', conversationTypes, engine.AssertRules.ARRAY);
            engine.assert('count', count, engine.AssertRules.NUMBER);
            this._context.getConversationList(count, undefined, 0, 0, this.channelId).then(({ code, data }) => {
                const conversationList = [];
                data = data || [];
                if (code === engine.ErrorCode.SUCCESS) {
                    if (conversationTypes) {
                        data.forEach((item) => {
                            if (conversationTypes.indexOf(item.conversationType) > -1) {
                                conversationList.push(tranToV2Conversation(item));
                            }
                        });
                    }
                    else {
                        data.forEach((item) => {
                            conversationList.push(tranToV2Conversation(item));
                        });
                    }
                    onSuccessHook(callback.onSuccess, conversationList);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 获取指定会话
         * @description 相较于 2.0 中从本地缓存获取会话，当前方法从服务器拉取
         * @param conversationType
         * @param targetId
         * @param callback
         */
        getConversation(conversationType, targetId, callback) {
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            this._context.getConversationList(1000, undefined, 0, 0, this.channelId).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    let conversation = null;
                    data = data || [];
                    data.forEach((item) => {
                        if (item.conversationType === conversationType && item.targetId === targetId && item.channelId === this.channelId) {
                            conversation = tranToV2Conversation(item);
                        }
                    });
                    onSuccessHook(callback.onSuccess, conversation);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 删除指定会话
         * @param conversationType 会话类型
         * @param targetId 会话 target_id
         * @param callback 删除回调
         */
        removeConversation(conversationType, targetId, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.removeConversation(conversationType, targetId, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 保存草稿
         * @description 草稿存储在内存中，如刷新或者关闭页面会导致草稿丢失。
         * 草稿功能并未在 v3 SDK 版本红实现，由 Bridge 模块实现
         * @param conversationType
         * @param targetId
         * @param draftText
         */
        saveTextMessageDraft(conversationType, targetId, draftText) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('draftText', draftText, engine.AssertRules.STRING, true);
            const userId = this._context.getCurrentUserId();
            if (!userId) {
                return false;
            }
            const drafts = this._draftMap[userId] = this._draftMap[userId] || {};
            drafts[`${conversationType}_${targetId}_${this.channelId}`] = draftText;
            return true;
        }
        /**
         * 获取草稿信息
         * @description 未登录或无草稿数据时将返回 undefined
         * @param conversationType
         * @param targetId
         */
        getTextMessageDraft(conversationType, targetId) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            const userId = this._context.getCurrentUserId();
            if (!userId) {
                return undefined;
            }
            const drafts = this._draftMap[userId] || {};
            return drafts[`${conversationType}_${targetId}_${this.channelId}`];
        }
        /**
         * 删除草稿
         * @param conversationType
         * @param targetId
         */
        clearTextMessageDraft(conversationType, targetId) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            const userId = this._context.getCurrentUserId();
            if (!userId) {
                return false;
            }
            const drafts = this._draftMap[userId] || {};
            return delete drafts[`${conversationType}_${targetId}_${this.channelId}`];
        }
        /**
         * 获取当前组织下的所有会话的消息未读数
         * @description
         * 1. 清除浏览器缓存会导致会话未读数不准确
         * 2. 会话消息未读数存储在 WebStorage 中, 若浏览器不支持或禁用 WebStorage，未读消息数将不会保存，浏览器页面刷新未读消息数将不会存在
         * @param callback
         * @param conversationTypes 要获取未读数的会话类型，若为空，则默认获取单聊、群聊及系统消息未读数
         * @param includeMuted 是否包含免打扰会话（web 暂未实现）
         */
        getTotalUnreadCount(callback, conversationTypes, includeMuted) {
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getTotalUnreadCount(this.channelId, conversationTypes, includeMuted).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, data);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 获取指定会话的消息未读数
         * @todo
         * @param conversationType
         * @param targetId
         * @param callback
         */
        getUnreadCount(conversationType, targetId, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getUnreadCount(conversationType, targetId, this.channelId).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, data);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 删除指定类型会话，该方法已弃用
         * @description
         * 仅可在协议栈连接下调用
         * @param callback
         * @param {ConversationType[]} ? types
         */
        clearConversations(callback, conversationTypes) {
            if (this._isCPPMode) {
                this._context.clearConversations(conversationTypes, this.channelId).then(code => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, true);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
                return;
            }
            logger.error('Method is only available in cppProtocol mode');
        }
        /**
         * 清除指定会话未读数
         * @param conversationType
         * @param targetId
         * @param callback
         */
        clearUnreadCount(conversationType, targetId, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.clearUnreadCount(conversationType, targetId, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, true);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 设置会话状态：是否置顶、是否免打扰
         * @param conversationType
         * @param targetId
         * @param status
         * @param callback
         */
        setConversationStatus(conversationType, targetId, status, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('status', status, engine.AssertRules.OBJECT, true);
            const { isTop, notificationStatus } = status;
            this._context.setConversationStatus(conversationType, targetId, isTop, notificationStatus, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 发送消息
         * @param conversationType 会话类型
         * @param targetId 接收方 id，当会话类型为单聊时，该值为单聊对象的 userId，为群聊时，该值应为群组 groupId
         * @param msg 消息体
         * @param callback 回调函数
         * @param isMentioned `是否为 @ 消息`
         * @param pushContent 移动端在接收到消息推送时用于显示的推送信息
         * @param pushData Push 通知时附加信息
         * @param methodType 1 : 多客服(客服后台使用);   2 : 消息撤回
         * @param options 其他设置项
         */
        sendMessage(conversationType, targetId, msg, callback, isMentioned, pushContent, pushData, options) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('msg', msg, engine.AssertRules.OBJECT, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('isMentioned', isMentioned, engine.AssertRules.BOOLEAN);
            engine.assert('pushContent', pushContent, engine.AssertRules.ONLY_STRING);
            engine.assert('pushData', pushData, engine.AssertRules.ONLY_STRING);
            engine.assert('options.userIds', options === null || options === void 0 ? void 0 : options.userIds, engine.AssertRules.ARRAY);
            engine.assert('options.isVoipPush', options === null || options === void 0 ? void 0 : options.isVoipPush, engine.AssertRules.BOOLEAN);
            engine.assert('options.disableNotification', options === null || options === void 0 ? void 0 : options.disableNotification, engine.AssertRules.BOOLEAN);
            engine.assert('options.canIncludeExpansion', options === null || options === void 0 ? void 0 : options.canIncludeExpansion, engine.AssertRules.BOOLEAN);
            engine.assert('options.expansion', options === null || options === void 0 ? void 0 : options.expansion, engine.AssertRules.OBJECT);
            engine.assert('options.pushConfig', options === null || options === void 0 ? void 0 : options.pushConfig, engine.AssertRules.OBJECT);
            const isStatusMessage = !!((options === null || options === void 0 ? void 0 : options.isStatusMessage) || (options === null || options === void 0 ? void 0 : options.isStatus) || false);
            const apiSendOptions = tranToSendOptions(options, isMentioned, msg);
            const sendOptions = Object.assign(msg, Object.assign(Object.assign({ isMentioned,
                pushContent,
                pushData }, apiSendOptions), { messageType: msg.objectName, channelId: this.channelId, isStatusMessage }));
            const userId = this._context.getCurrentUserId();
            this._context.sendMessage(conversationType, targetId, sendOptions, callback.onBefore).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    handleRRReqMsg(tranToV2Message(data), userId);
                    onSuccessHook(callback.onSuccess, tranToV2Message(data));
                }
                else {
                    onErrorHook(callback.onError, code, tranToV2Message({
                        isMentioned: !!sendOptions.isMentioned,
                        content: msg.content,
                        messageType: msg.messageType,
                        isPersited: msg.isPersited,
                        isCounted: msg.isCounted,
                        disableNotification: !!(options === null || options === void 0 ? void 0 : options.disableNotification),
                        canIncludeExpansion: !!(options === null || options === void 0 ? void 0 : options.canIncludeExpansion),
                        expansion: (options === null || options === void 0 ? void 0 : options.expansion) || null,
                        conversationType,
                        targetId,
                        senderUserId: userId,
                        messageUId: '',
                        messageDirection: engine.MessageDirection.SEND,
                        isOffLineMessage: false,
                        sentTime: 0,
                        receivedTime: 0,
                        isStatusMessage,
                        receivedStatus: engine.ReceivedStatus.UNREAD
                    }));
                }
            });
        }
        /**
         * 消息撤回
         * @param message
         */
        sendRecallMessage(message, callback, options) {
            engine.assert('message.conversationType', message.conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('message.targetId', message.targetId, engine.AssertRules.STRING, true);
            engine.assert('message.messageUId', message.messageUId, engine.AssertRules.STRING, true);
            engine.assert('message.sentTime', message.sentTime, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('options.disableNotification', options === null || options === void 0 ? void 0 : options.disableNotification, engine.AssertRules.BOOLEAN);
            engine.assert('options.pushConfig', options === null || options === void 0 ? void 0 : options.pushConfig, engine.AssertRules.OBJECT);
            const { conversationType, targetId, messageUId, sentTime, content } = message;
            const recallOptions = Object.assign({ channelId: this.channelId, oriContent: content }, options);
            this._context.recallMessage(conversationType, targetId, messageUId, sentTime, recallOptions).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, tranToV2Message(data));
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 发送正在输入状态消息
         * @description
         * 正在输入状态消息，不存储、不计数、不推送
         * @param conversationType 会话类型
         * @param targetId 会话 id
         * @param typingContentType 正在输入的消息 ObjectName，如 RC:TxtMsg
         * @param callback
         */
        sendTypingStatusMessage(conversationType, targetId, typingContentType, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('typingContentType', typingContentType, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            const sendOptions = {
                messageType: 'RC:TypSts',
                content: {
                    typingContentType
                },
                isStatusMessage: true
            };
            this._context.sendMessage(conversationType, targetId, sendOptions).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, tranToV2Message(data));
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 发送已读回执
         * @description
         * @param conversationType
         * @param targetId
         * @param callback
         */
        sendReceiptResponse(conversationType, targetId, callback) {
            const userId = this._context.getCurrentUserId();
            const respKey = `${userId}${conversationType}${targetId}RECEIVED`;
            const valObj = this._storage.get(respKey);
            if (valObj) {
                const vals = [];
                for (const key in valObj) {
                    const tmp = {};
                    tmp[key] = valObj[key].uIds;
                    valObj[key].isResponse || vals.push(tmp);
                }
                if (vals.length === 0) {
                    callback.onSuccess(null);
                    return;
                }
                const itvId = setInterval(() => {
                    if (vals.length === 1) {
                        clearInterval(itvId);
                    }
                    const receiptMessageDic = vals.splice(0, 1)[0];
                    const respMsg = new ReadReceiptResponseMessage({ receiptMessageDic });
                    this.sendMessage(conversationType, targetId, respMsg, {
                        onSuccess: (msg) => {
                            const senderUserId = Object.keys(receiptMessageDic)[0];
                            valObj[senderUserId].isResponse = true;
                            this._storage.set(respKey, valObj);
                            onSuccessHook(callback.onSuccess, msg);
                        },
                        onError: (code) => {
                            onErrorHook(callback.onError, code);
                        }
                    });
                }, 200);
            }
            else {
                callback.onSuccess(null);
            }
        }
        /**
         * 从服务端拉取指定会话的历史消息
         * @param conversationType 会话类型
         * @param targetId 会话 ID
         * @param timestamp 获取时间戳, 0 为从当前时间拉取
         * @param count 拉取条数，获取条数, 范围 1 - 20
         * @param order 获取顺序，默认为 0。0 为升序，获取消息发送时间比 timestamp 更早的消息；1 为降序。
         * @param objectname
         */
        getHistoryMessages(conversationType, targetId, timestamp, count, callback, objectName, order) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('timestamp', timestamp, engine.AssertRules.NUMBER, true);
            engine.assert('count', count, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK, true);
            engine.assert('order', order, engine.AssertRules.NUMBER);
            this._context.getHistoryMessage(conversationType, targetId, timestamp, count, order, this.channelId, objectName).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    if (data) {
                        const { list, hasMore } = data;
                        const messages = list.map((message) => {
                            return tranToV2Message(message);
                        });
                        onSuccessHook(callback.onSuccess, messages, hasMore);
                    }
                    else {
                        onSuccessHook(callback.onSuccess, [], false);
                    }
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 通过 messageUId 删除消息
         * @param conversationType 会话类型
         * @param targetId 会话 id
         * @param messages 要删除的消息 []
         * @param callback
         */
        deleteRemoteMessages(conversationType, targetId, messages, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('messages', messages, engine.AssertRules.ARRAY, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.deleteRemoteMessage(conversationType, targetId, messages, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 通过时间戳删除消息
         * @param param
         * @param callback
         */
        clearRemoteHistoryMessages(param, callback) {
            engine.assert('param.conversationType', param.conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('param.targetId', param.targetId, engine.AssertRules.STRING, true);
            engine.assert('param.timestamp', param.timestamp, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            const { conversationType, targetId, timestamp } = param;
            this._context.deleteRemoteMessageByTimestamp(conversationType, targetId, timestamp, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /* ====================== CPP 独有接口增加 ======================== */
        /**
         * 向本地插入一条消息，不发送到服务器
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param content 消息体
         * @param callback
        */
        insertMessage(conversationType, targetId, content, callback) {
            const { senderUserId, objectName, content: msgContent, messageDirection } = content;
            const inserOptions = {
                senderUserId,
                messageType: objectName,
                content: msgContent,
                messageDirection,
                channelId: this.channelId
            };
            this._context.insertMessage(conversationType, targetId, inserOptions).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, tranToV2Message(data));
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 从本地消息数据库中删除某一会话指定时间之前的消息数据
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param timestamp 指定删除该时间戳之前的消息
         * @param cleanSpace 指定删除该时间戳之前的消息。是否清理数据条目所使用的磁盘空间。清理磁盘空间会阻塞进程且耗时较长，不推荐使用。
         * 数据在被抹除的情况下，未清理的磁盘空间会在后续存储操作中复用，且对数据查询无影响
        */
        deleteLocalMessagesByTimestamp(conversationType, targetId, timestamp, cleanSpace, callback) {
            this._context.deleteMessagesByTimestamp(conversationType, targetId, timestamp, cleanSpace, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, true);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 协议栈获取远端历史消息
         * @param conversationType 会话类型
         * @param targetId 会话 ID
         * @param timestamp 获取时间戳, 0 为从当前时间拉取
         * @param count 拉取条数，获取条数, 范围 1 - 20
        */
        getRemoteHistoryMessages(conversationType, targetId, timestamp, count, callback, options) {
            const order = options.order || 0;
            this._context.getRemoteHistoryMessages(conversationType, targetId, timestamp, count, order, this.channelId).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    if (data) {
                        const { list, hasMore } = data;
                        const messages = list.map((message) => {
                            return tranToV2Message(message);
                        });
                        onSuccessHook(callback.onSuccess, messages, hasMore);
                    }
                    else {
                        onSuccessHook(callback.onSuccess, [], false);
                    }
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 清空会话下历史消息
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param callback
        */
        clearMessages(conversationType, targetId, callback) {
            this._context.clearMessages(conversationType, targetId, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, true);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 按内容搜索会话
         * @param keyword 关键字
         * @param conversationTypes 会话类型数组
        */
        searchConversationByContent(keyword, callback, conversationTypes, customMessageType) {
            this._context.searchConversationByContent(keyword, customMessageType, this.channelId, conversationTypes).then(({ code, data }) => {
                const conversationList = [];
                data = data || [];
                if (code === engine.ErrorCode.SUCCESS) {
                    data.forEach((item) => {
                        conversationList.push(tranToV2Conversation(item));
                    });
                    onSuccessHook(callback.onSuccess, conversationList);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 按内容搜索会话内容的消息
         * @param keyword 搜索内容
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param timestamp 搜索时间, 搜索该时间之前的消息
         * @param count 获取的数量
        */
        searchMessageByContent(conversationType, targetId, keyword, timestamp, count, total, callback) {
            this._context.searchMessageByContent(conversationType, targetId, keyword, timestamp, count, total, this.channelId).then(({ code, data }) => {
                const v2Messages = [];
                if (code === engine.ErrorCode.SUCCESS) {
                    data = data || {};
                    const { messages, count } = data;
                    messages.forEach((item) => {
                        v2Messages.push(tranToV2Message(item));
                    });
                    onSuccessHook(callback.onSuccess, v2Messages, count);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 获取会话下所有未读的 @ 消息
         * @param conversationType 会话类型
         * @param targetId 目标 ID
        */
        getUnreadMentionedMessages(conversationType, targetId) {
            const messages = this._context.getUnreadMentionedMessages(conversationType, targetId, this.channelId);
            const v2Msg = messages.map((item) => {
                return tranToV2Message(item);
            });
            return v2Msg;
        }
        /**
         * 清除时间戳前的未读数
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param timestamp 目标 ID
         * @param callback
        */
        clearUnreadCountByTimestamp(conversationType, targetId, timestamp, callback) {
            this._context.clearUnreadCountByTimestamp(conversationType, targetId, timestamp, this.channelId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, true);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 获取会话免打扰状态
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param callback
        */
        getConversationNotificationStatus(conversationType, targetId, callback) {
            this._context.getConversationNotificationStatus(conversationType, targetId, this.channelId).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, data);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
    }

    class IMClient {
        constructor(_context) {
            this._context = _context;
            this._channelClient = {};
            this._isCPPMode = engine.usingCppEngine();
            this._defaultChannelClient = new ChannelClient(_context, '', this._isCPPMode);
        }
        /**
         * 协议栈方法校验
         */
        assertCPPMode(method, methodName, callback) {
            if (!this._isCPPMode) {
                callback && callback.onError(engine.ErrorCode.NOT_SUPPORT);
                logger.error(`'${methodName}' is unusable!`);
                return;
            }
            method();
        }
        /**
         * 装载插件，并返回相应的插件实例
         * @param plugin
         * @param options
         */
        install(plugin, options) {
            return this._context.install(plugin, options);
        }
        /**
         * 获取 channel proxy 实例
         * @param channelId 会话标识 ID
        */
        getChannel(channelId) {
            if (!this._isCPPMode) {
                logger.error('getChannel method is only available in protocol stack mode');
                return null;
            }
            engine.assert('channelId', channelId, engine.AssertRules.STRING, true);
            if (channelId.length > 20) {
                logger.error('The channelId cannot exceed 20 characters');
                return null;
            }
            if (channelId in this._channelClient) {
                return this._channelClient[channelId];
            }
            if (Object.keys(this._channelClient).length > 1000) {
                logger.error('Only 1000 channels can be obtained');
                return null;
            }
            this._channelClient[channelId] = new ChannelClient(this._context, channelId, this._isCPPMode);
            return this._channelClient[channelId];
        }
        /**
         * 批量删除 channel proxy 实例
         * @param channelIds 会话标识 ID
        */
        deleteChannels(channelIds) {
            engine.assert('channelIds', channelIds, engine.AssertRules.ARRAY, true);
            this.assertCPPMode(() => {
                channelIds.forEach(id => {
                    delete this._channelClient[id];
                });
            }, 'deleteChannels');
        }
        /**
         * 获取导航新 RTC Lib 使用
        */
        getNavi() {
            return this._context.getInfoFromCache() || {};
        }
        /**
         * 获取 SDK 信息 RTC Lib 使用
        */
        getSDKInfo() {
            return {
                version: this._context.apiVersion
            };
        }
        /**
         * 获取 App 信息，RTC Lib 使用
        */
        getAppInfo() {
            return {
                appKey: this._context.appkey
            };
        }
        /**
         * 获取当前用户 ID
        */
        getCurrentUserId() {
            return this._context.getCurrentUserId();
        }
        /**
         * 断开当前连接
         * @description 相较于原 SDK 2.0 版本的 disconnect，此方法会返回一个 Promise 对象
         * @returns Promise<void>
         */
        disconnect() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this._context.disconnect();
            });
        }
        /**
         * 该方法等价于 disconnect
         */
        logout() {
            return this.disconnect();
        }
        /**
         * 清除内存或本地缓存数据
        */
        clearCache() {
            //
        }
        /**
         * 获取会话列表，相对于 2.0 的接口，该接口结果中不再展开会话中最后一条消息的数据
         * @param callback 结果回调
         * @param conversationTypes 会话类型，为 null 时，返回全部会话
         * @param count 获取数量，默认 300
         */
        getConversationList(callback, conversationTypes, count) {
            this._defaultChannelClient.getConversationList(callback, conversationTypes, count);
        }
        /**
         * 获取指定会话
         * @description 相较于 2.0 中从本地缓存获取会话，当前方法从服务器拉取
         * @param conversationType
         * @param targetId
         * @param callback
         */
        getConversation(conversationType, targetId, callback) {
            return this._defaultChannelClient.getConversation(conversationType, targetId, callback);
        }
        /**
         * 删除指定会话
         * @param conversationType 会话类型
         * @param targetId 会话 target_id
         * @param callback 删除回调
         */
        removeConversation(conversationType, targetId, callback) {
            return this._defaultChannelClient.removeConversation(conversationType, targetId, callback);
        }
        /**
         * 保存草稿
         * @description 草稿存储在内存中，如刷新或者关闭页面会导致草稿丢失。
         * 草稿功能并未在 v3 SDK 版本红实现，由 Bridge 模块实现
         * @param conversationType
         * @param targetId
         * @param draftText
         */
        saveTextMessageDraft(conversationType, targetId, draftText) {
            return this._defaultChannelClient.saveTextMessageDraft(conversationType, targetId, draftText);
        }
        /**
         * 获取草稿信息
         * @description 未登录或无草稿数据时将返回 undefined
         * @param conversationType
         * @param targetId
         */
        getTextMessageDraft(conversationType, targetId) {
            return this._defaultChannelClient.getTextMessageDraft(conversationType, targetId);
        }
        /**
         * 删除草稿
         * @param conversationType
         * @param targetId
         */
        clearTextMessageDraft(conversationType, targetId) {
            return this._defaultChannelClient.clearTextMessageDraft(conversationType, targetId);
        }
        /**
         * 获取所有会话的消息未读数
         * @description
         * 1. 清除浏览器缓存会导致会话未读数不准确
         * 2. 会话消息未读数存储在 WebStorage 中, 若浏览器不支持或禁用 WebStorage，未读消息数将不会保存，浏览器页面刷新未读消息数将不会存在
         * @param callback
         * @param conversationTypes 要获取未读数的会话类型，若为空，则默认获取单聊、群聊及系统消息未读数（web 暂未实现）
         * @param includeMuted 是否包含免打扰会话（web 暂未实现）
         */
        getTotalUnreadCount(callback, conversationTypes, includeMuted) {
            return this._defaultChannelClient.getTotalUnreadCount(callback, conversationTypes, includeMuted);
        }
        /**
         * 获取指定会话的消息未读数
         * @todo
         * @param conversationType
         * @param targetId
         * @param callback
         */
        getUnreadCount(conversationType, targetId, callback) {
            return this._defaultChannelClient.getUnreadCount(conversationType, targetId, callback);
        }
        /**
         * 按会话类型获取消息未读数，该方法已弃用
         * @deprecated
         * @param conversationType
         * @param callback
         */
        getConversationUnreadCount(conversationType, callback) {
            logger.error('Method is deprecated');
        }
        /**
         * 删除指定类型会话，该方法已弃用
         * @description
         * 仅可在协议栈连接下调用
         * @param callback
         * @param {ConversationType[]} ? types
         */
        clearConversations(callback, conversationTypes) {
            return this._defaultChannelClient.clearConversations(callback, conversationTypes);
        }
        /**
         * 清除指定会话未读数
         * @param conversationType
         * @param targetId
         * @param callback
         */
        clearUnreadCount(conversationType, targetId, callback) {
            this._defaultChannelClient.clearUnreadCount(conversationType, targetId, callback);
        }
        /**
         * 设置会话状态：是否置顶、是否免打扰
         * @param conversationType
         * @param targetId
         * @param status
         * @param callback
         */
        setConversationStatus(conversationType, targetId, status, callback) {
            return this._defaultChannelClient.setConversationStatus(conversationType, targetId, status, callback);
        }
        /**
         * 发送消息
         * @param conversationType 会话类型
         * @param targetId 接收方 id，当会话类型为单聊时，该值为单聊对象的 userId，为群聊时，该值应为群组 groupId
         * @param msg 消息体
         * @param callback 回调函数
         * @param isMentioned `是否为 @ 消息`
         * @param pushContent 移动端在接收到消息推送时用于显示的推送信息
         * @param pushData Push 通知时附加信息
         * @param methodType 该参数已废弃 ~~1 : 多客服(客服后台使用);   2 : 消息撤回~~
         * @param options 其他设置项
         */
        sendMessage(conversationType, targetId, msg, callback, isMentioned, pushContent, pushData, methodType, options) {
            return this._defaultChannelClient.sendMessage(conversationType, targetId, msg, callback, isMentioned, pushContent, pushData, options);
        }
        /**
         * 消息撤回
         * @param message
         */
        sendRecallMessage(message, callback, options) {
            return this._defaultChannelClient.sendRecallMessage(message, callback, options);
        }
        /**
         * 发送正在输入状态消息
         * @description
         * 正在输入状态消息，不存储、不计数、不推送
         * @param conversationType 会话类型
         * @param targetId 会话 id
         * @param typingContentType 正在输入的消息 ObjectName，如 RC:TxtMsg
         * @param callback
         */
        sendTypingStatusMessage(conversationType, targetId, typingContentType, callback) {
            return this._defaultChannelClient.sendTypingStatusMessage(conversationType, targetId, typingContentType, callback);
        }
        /**
         * 发送已读回执
         * @description
         * @param conversationType
         * @param targetId
         * @param callback
         */
        sendReceiptResponse(conversationType, targetId, callback) {
            return this._defaultChannelClient.sendReceiptResponse(conversationType, targetId, callback);
        }
        /**
         * 更新消息扩展
         * @param expansionDic 要更新的消息扩展信息键值对
         * @param message      要更新的原始消息体
        */
        updateMessageExpansion(expansionDic, message, callback) {
            engine.assert('expansion', expansionDic, engine.AssertRules.OBJECT, true);
            engine.assert('message', message, engine.AssertRules.OBJECT, true);
            const { conversationType, targetId, messageUId, canIncludeExpansion, expansion: originExpansion } = message;
            this._context.sendExpansionMessage({
                conversationType, targetId, messageUId, canIncludeExpansion, originExpansion, expansion: expansionDic
            }).then(({ code }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 删除消息扩展属性
        * @param keys 消息扩展信息中待删除的 key 的列表
        * @param message 要删除消息扩展的原始消息体
        */
        removeMessageExpansionForKey(keys, message, callback) {
            engine.assert('keys', keys, engine.AssertRules.ARRAY, true);
            engine.assert('message', message, engine.AssertRules.OBJECT, true);
            const { conversationType, targetId, messageUId, canIncludeExpansion } = message;
            this._context.sendExpansionMessage({
                conversationType, targetId, messageUId, canIncludeExpansion, keys
            }).then(({ code }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 从服务端拉取指定会话的历史消息
         * @param conversationType 会话类型
         * @param targetId 会话 ID
         * @param timestamp 获取时间戳, 0 为从当前时间拉取
         * @param count 拉取条数，获取条数, 范围 1 - 20
         * @param callback
         * @param objectName
         * @param order 获取顺序，默认为 0。0 为升序，获取消息发送时间比 timestamp 更早的消息；1 为降序。
         */
        getHistoryMessages(conversationType, targetId, timestamp, count, callback, objectName, order) {
            return this._defaultChannelClient.getHistoryMessages(conversationType, targetId, timestamp, count, callback, objectName, order);
        }
        /**
         * 加入聊天室
         * @param chatRoomId 聊天室 id
         * @param count 拉取聊天室消息数量
         * @param callback
         */
        joinChatRoom(chatRoomId, count, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('count', count, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.joinChatroom(chatRoomId, count).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 退出聊天室
         * @param chatRoomId 聊天室 id
         * @param callback
         */
        quitChatRoom(chatRoomId, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.quitChatroom(chatRoomId).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 获取聊天室信息
         * @param chatRoomId 聊天室 id
         * @param count 获取人数, 范围 0 - 20
         * 1. 传入 0 获取到的聊天室信息将或仅包含成员总数，不包含具体的成员列表
         * 2. 传入其他大于 0 的值返回聊天室信息，结果仅包含包含不多于 20 人的成员信息和当前成员总数。最大值为 20
         * @param order 排序方式，1 为正序，2 为倒序
         * @param callback
         */
        getChatRoomInfo(chatRoomId, count, order, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('count', count, engine.AssertRules.NUMBER, true);
            engine.assert('order', order, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getChatroomInfo(chatRoomId, count, order).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, {
                        userInfos: (data === null || data === void 0 ? void 0 : data.userInfos) || [],
                        userTotalNums: (data === null || data === void 0 ? void 0 : data.userCount) || 0
                    });
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 在指定聊天室中设置自定义属性
         * @description 仅聊天室中不存在此属性或属性设置者为己方时可设置成功
         * @param chatRoomId 聊天室房间 id
         * @param chatroomEntry 属性信息
         * @param callback
         */
        setChatroomEntry(chatRoomId, chatroomEntry, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('chatroomEntry', chatroomEntry, engine.AssertRules.OBJECT, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.setChatroomEntry(chatRoomId, chatroomEntry).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 在指定聊天室中强制增加 / 修改任意聊天室属性
         * @description 仅聊天室中不存在此属性或属性设置者为己方时可设置成功
         * @param chatRoomId 聊天室房间 id
         * @param chatroomEntry 属性信息
         * @param callback
         */
        forceSetChatroomEntry(chatRoomId, chatroomEntry, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('chatroomEntry', chatroomEntry, engine.AssertRules.OBJECT, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.forceSetChatroomEntry(chatRoomId, chatroomEntry).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 删除聊天室属性
         * @description 该方法仅限于删除自己设置的聊天室属性
         * @param chatRoomId 聊天室房间 id
         * @param chatroomEntry 要移除的属性信息
         * @param callback
         */
        removeChatroomEntry(chatRoomId, chatroomEntry, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('chatroomEntry', chatroomEntry, engine.AssertRules.OBJECT, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.removeChatroomEntry(chatRoomId, chatroomEntry).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 强制删除任意聊天室属性
         * @description 该方法仅限于删除自己设置的聊天室属性
         * @param chatRoomId 聊天室房间 id
         * @param chatroomEntry 要移除的属性信息
         * @param callback
         */
        forceRemoveChatroomEntry(chatRoomId, chatroomEntry, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('chatroomEntry', chatroomEntry, engine.AssertRules.OBJECT, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.forceRemoveChatroomEntry(chatRoomId, chatroomEntry).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 获取聊天室中的指定属性
         * @param chatRoomId 聊天室房间 id
         * @param key 属性键名
         * @param callback
         */
        getChatroomEntry(chatRoomId, key, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('key', key, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getChatroomEntry(chatRoomId, key).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, data || '');
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 获取聊天室内的所有属性
         * @param chatRoomId 聊天室房间 id
         * @param callback
         */
        getAllChatroomEntries(chatRoomId, callback) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getAllChatroomEntries(chatRoomId).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    onSuccessHook(callback.onSuccess, data);
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * 拉取聊天室内的历史消息
         * @param chatRoomId
         * @param count 拉取消息条数, 有效值范围 1 - 20
         * @param order 获取顺序，默认值为 0。
         * * 0：降序，用于获取早于指定时间戳发送的消息
         * * 1：升序，用于获取晚于指定时间戳发送的消息
         * @param callback
         * @param timestamp v3.0 版本中的新增参数，用于指定拉取消息用到的时间戳。默认值为0，表示按当前时间拉取
         */
        getChatRoomHistoryMessages(chatRoomId, count, order, callback, timestamp = 0) {
            engine.assert('chatRoomId', chatRoomId, engine.AssertRules.STRING, true);
            engine.assert('count', count, engine.AssertRules.NUMBER, true);
            engine.assert('order', order, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('timestamp', timestamp, engine.AssertRules.NUMBER);
            this._context.getChatRoomHistoryMessages(chatRoomId, count, order, timestamp).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    if (data) {
                        const { list, hasMore } = data;
                        const messages = list.map((message) => tranToV2Message(message));
                        onSuccessHook(callback.onSuccess, messages, hasMore);
                    }
                    else {
                        onSuccessHook(callback.onSuccess, [], false);
                    }
                }
                else {
                    onErrorHook(callback.onError, code);
                }
            });
        }
        /**
         * @deprecated
         */
        setDeviceInfo(option) { }
        /**
         * 获取当前 IM 连接状态
         */
        getCurrentConnectionStatus() {
            return this._context.getConnectionStatus();
        }
        /**
         * 通过 messageUId 删除消息
         * @param conversationType 会话类型
         * @param targetId 会话 id
         * @param messages 要删除的消息 []
         * @param callback
         */
        deleteRemoteMessages(conversationType, targetId, messages, callback) {
            return this._defaultChannelClient.deleteRemoteMessages(conversationType, targetId, messages, callback);
        }
        /**
         * 通过时间戳删除消息
         * @param conversationType 会话类型
         * @param targetId 会话 id
         * @param timestamp 清除时间点, 该时间之前的消息将被清除
         * @param callback
         */
        /**
         * 通过时间戳删除消息
         * @param param
         * @param callback
         */
        clearRemoteHistoryMessages(param, callback) {
            return this._defaultChannelClient.clearRemoteHistoryMessages(param, callback);
        }
        /**
         * 获取文件 token
         * @param fileType 上传类型
         * @param callback
         * @param fileName 原文件名
         */
        getFileToken(fileType, callback, fileName) {
            engine.assert('fileType', fileType, engine.AssertRules.NUMBER, true);
            engine.assert('fileName', fileName, engine.AssertRules.STRING);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getFileToken(fileType, fileName).then(callback.onSuccess).catch(callback.onError);
        }
        /**
         * 获取文件地址
         * @param fileType 上传类型
         * @param filename 上传后的文件名
         * @param oriname 原文件名
         * @param callback
         * @param uploadMethod 上传方式，阿里或七牛
         * @param data 上传插件返回的数据
         */
        getFileUrl(fileType, fileName, oriname, callback, uploadRes, uploadMethod) {
            engine.assert('fileType', fileType, engine.AssertRules.NUMBER, true);
            engine.assert('fileName', fileName, engine.AssertRules.STRING, true);
            engine.assert('oriname', oriname, engine.AssertRules.STRING);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('uploadMethod', uploadMethod, engine.AssertRules.NUMBER);
            engine.assert('data', uploadRes, engine.AssertRules.OBJECT);
            this._context.getFileUrl(fileType, fileName, oriname, uploadRes, uploadMethod).then(callback.onSuccess).catch(callback.onError);
        }
        /**
         * 创建标签
         * @param tag 标签信息
        */
        createTag(tag, callback) {
            engine.assert('tag.tagId', tag.tagId, engine.AssertRules.STRING, true);
            engine.assert('tag.tagId', tag.tagId, (val) => {
                return val.length <= 10;
            });
            engine.assert('tag.tagName', tag.tagName, (val) => {
                return val.length <= 15;
            });
            engine.assert('tag.tagName', tag.tagName, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.createTag(tag).then(({ code }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess() : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 删除标签
         * @param tagId 标签 ID
        */
        removeTag(tagId, callback) {
            engine.assert('tagId', tagId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.removeTag(tagId).then(({ code }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess() : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 编辑标签
         * @param tag 标签信息
        */
        updateTag(tag, callback) {
            engine.assert('tag.tagId', tag.tagId, engine.AssertRules.STRING, true);
            engine.assert('tag.tagName', tag.tagName, engine.AssertRules.STRING, true);
            engine.assert('tag.tagName', tag.tagName, (val) => {
                return val.length <= 15;
            });
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.updateTag(tag).then(({ code }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess() : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 获取标签列表
        */
        getTagList(callback) {
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getTagList().then(({ code, data }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess(data || []) : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 获取会话下的标签
         * @param conversation 会话信息
         */
        getTagsForConversation(conversation, callback) {
            engine.assert('conversationType', conversation.type, engine.AssertRules.NUMBER);
            engine.assert('targetId', conversation.targetId, engine.AssertRules.STRING);
            engine.assert('channelId', conversation.channelId, engine.AssertRules.ONLY_STRING);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getTagsForConversation(conversation).then(({ code, data }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess(data || []) : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 添加会话到指定标签
         * @param tagId 标签 ID
         * @param conversations 要添加的会话列表
        */
        addTagForConversations(tagId, conversations, callback) {
            engine.assert('tagId', tagId, engine.AssertRules.STRING, true);
            engine.assert('conversations', conversations, engine.AssertRules.ARRAY, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            conversations.forEach(item => {
                engine.assert('conversation.type', item.type, engine.AssertRules.NUMBER, true);
                engine.assert('conversation.targetId', item.targetId, engine.AssertRules.STRING, true);
                engine.assert('conversation.channelId', item.channelId, engine.AssertRules.ONLY_STRING);
            });
            this._context.addTagForConversations(tagId, conversations).then(({ code, data }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess() : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 删除指定标签中会话
         * @param tagId 标签 ID
         * @param conversations 要删除的会话列表
        */
        removeTagForConversations(tagId, conversations, callback) {
            engine.assert('tagId', tagId, engine.AssertRules.STRING, true);
            engine.assert('conversations', conversations, engine.AssertRules.ARRAY, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            conversations.forEach(item => {
                engine.assert('conversation.type', item.type, engine.AssertRules.NUMBER, true);
                engine.assert('conversation.targetId', item.targetId, engine.AssertRules.STRING, true);
                engine.assert('conversation.channelId', item.channelId, engine.AssertRules.ONLY_STRING);
            });
            this._context.removeTagForConversations(tagId, conversations).then(({ code, data }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess() : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 删除指定会话中标签
         * @param conversation 会话
         * @param tagIds 要删除的标签列表
        */
        removeTagsForConversation(conversation, tagIds, callback) {
            engine.assert('conversation.type', conversation.type, engine.AssertRules.NUMBER, true);
            engine.assert('conversation.targetId', conversation.targetId, engine.AssertRules.STRING, true);
            engine.assert('conversation.channelId', conversation.channelId, engine.AssertRules.ONLY_STRING);
            engine.assert('tagIds', tagIds, engine.AssertRules.ARRAY, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            tagIds.forEach(item => {
                engine.assert('tagId', item, engine.AssertRules.STRING, true);
            });
            this._context.removeTagsForConversation(conversation, tagIds).then(({ code, data }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess() : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 分页获取标签下会话列表
         * @param tagId 标签id
         * @param count 获取数量
         * @param timestamp 会话时间戳
        */
        getConversationListByTag(tagId, count, startTime, callback) {
            engine.assert('tagId', tagId, engine.AssertRules.STRING, true);
            engine.assert('count', count, engine.AssertRules.NUMBER, true);
            engine.assert('startTime', startTime, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK, true);
            this._context.getConversationListByTag(tagId, startTime, count).then(({ code, data }) => {
                const conversationList = [];
                if (code === engine.ErrorCode.SUCCESS) {
                    data = data || [];
                    data.forEach((item) => {
                        conversationList.push(tranToV2ConversationContainTag(item));
                    });
                    callback.onSuccess(conversationList);
                }
                else {
                    callback.onError(code);
                }
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 根据标签获取未读消息数
         * @param tagId 标签id
         * @param containMuted 是否包含免打扰
         */
        getUnreadCountByTag(tagId, containMuted, callback) {
            engine.assert('tagId', tagId, engine.AssertRules.STRING, true);
            engine.assert('containMuted', containMuted, engine.AssertRules.BOOLEAN, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.getUnreadCountByTag(tagId, containMuted).then(({ code, data }) => {
                logger.info(code, data);
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess(data || 0) : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 设置标签中会话置顶
         * @param tagId 标签id
         * @param conversation 会话
         * @param status 状态
         */
        setConversationStatusInTag(tagId, conversation, status, callback) {
            engine.assert('tagId', tagId, engine.AssertRules.STRING, true);
            engine.assert('conversation.targetId', conversation.targetId, engine.AssertRules.STRING, true);
            engine.assert('conversation.type', conversation.type, engine.AssertRules.NUMBER, true);
            engine.assert('conversation.channelId', conversation.channelId, engine.AssertRules.ONLY_STRING);
            engine.assert('status.isTop', status === null || status === void 0 ? void 0 : status.isTop, engine.AssertRules.BOOLEAN, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this._context.setConversationStatusInTag(tagId, conversation, status).then(({ code, data }) => {
                code === engine.ErrorCode.SUCCESS ? callback.onSuccess() : callback.onError(code);
            }).catch(reason => {
                callback.onError(reason);
            });
        }
        /**
         * 调用非标准接口 - 所谓非标准接口，是为某些特定需求或产品临时添加的，暂未采纳为标准接口的方法。
         * @param method 接口定义名称
         * @param callback 回调函数
         * @param args 参数列表
         */
        callExtra(method, callback, ...args) {
            this._context.callExtra(method, ...args).then((res) => {
                const { code, data } = res;
                if (code === engine.ErrorCode.SUCCESS) {
                    if (method === 'getConversationsByPage') {
                        data.forEach((item) => {
                            item.latestMessage = tranToV2Message(item.latestMessage);
                        });
                    }
                    if (method === 'getHistoryMessagesByObjectNames') {
                        const { list, hasMore } = data;
                        const messages = list.map((message) => {
                            return tranToV2Message(message);
                        });
                        onSuccessHook(callback.onSuccess, messages, hasMore);
                        return;
                    }
                    callback.onSuccess && onSuccessHook(callback.onSuccess, data);
                    return;
                }
                callback.onError && onErrorHook(callback.onError, code);
            });
        }
        /* ====================== CPP 独有接口增加 ======================== */
        /**
         * 是否有远端未读消息 （ C++ ）
         * @description
        */
        hasRemoteUnreadMessages(token, callback) {
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            // 与旧 V2 一致
            this.assertCPPMode(() => {
                onSuccessHook(callback.onSuccess, false);
            }, 'hasRemoteUnreadMessages', callback);
        }
        /**
         * 设置用户在线状态监听器
        */
        setUserStatusListener(config, listener) {
            this.assertCPPMode(() => {
                this._context.setUserStatusListener(config, listener);
            }, 'setUserStatusListener');
        }
        /**
         * 设置用户在线状态
         * @param status 在线 10、离开 11、忙碌 12
        */
        setUserStatus(status, callback) {
            engine.assert('status', status, engine.AssertRules.NUMBER);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.setUserStatus(status).then((code) => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, true);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'setUserStatus', callback);
        }
        /**
         * 获取用户在线状态
         * @param userId 用户 ID
        */
        getUserStatus(userId, callback) {
            engine.assert('userId', userId, engine.AssertRules.STRING);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.getUserStatus(userId).then(({ code, data }) => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, data);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'getUserStatus', callback);
        }
        /**
         * 加入黑名单
         * @param userId 用户 ID
        */
        addToBlacklist(userId, callback) {
            engine.assert('userId', userId, engine.AssertRules.STRING);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.addToBlacklist(userId).then((code) => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'addToBlacklist', callback);
        }
        /**
         * 将指定用户移除黑名单
         * @param userId 用户 ID
        */
        removeFromBlacklist(userId, callback) {
            engine.assert('userId', userId, engine.AssertRules.STRING);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.removeFromBlacklist(userId).then(code => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'removeFromBlacklist', callback);
        }
        /**
         * 获取黑名单列表
        */
        getBlacklist(callback) {
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.getBlacklist().then(({ code, data }) => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, data);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'getBlacklist', callback);
        }
        /**
         * 获取指定人员在黑名单中的状态
         * @param userId 用户 ID
        */
        getBlacklistStatus(userId, callback) {
            engine.assert('userId', userId, engine.AssertRules.STRING);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.getBlacklistStatus(userId).then(({ code, data }) => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, data);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'getBlacklistStatus', callback);
        }
        /**
         * 向本地插入一条消息，不发送到服务器
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param content 消息体
         * @param callback
        */
        insertMessage(conversationType, targetId, content, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('content.senderUserId', content.senderUserId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._defaultChannelClient.insertMessage(conversationType, targetId, content, callback);
            }, 'insertMessage', callback);
        }
        /**
         * 获取远端历史消息
         * @param conversationType 会话类型
         * @param targetId 会话 ID
         * @param timestamp 获取时间戳, 0 为从当前时间拉取
         * @param count 拉取条数，获取条数, 范围 1 - 20
         * @param options.order 获取顺序, 默认为 0
        */
        getRemoteHistoryMessages(conversationType, targetId, timestamp, count, callback, options = {}) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('timestamp', timestamp, engine.AssertRules.NUMBER, true);
            engine.assert('count', count, engine.AssertRules.NUMBER, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('options.order', options.order, engine.AssertRules.NUMBER);
            this.assertCPPMode(() => {
                this._defaultChannelClient.getRemoteHistoryMessages(conversationType, targetId, timestamp, count, callback, options);
            }, 'getRemoteHistoryMessages', callback);
        }
        /**
         * 删除本地消息
         * @param _ 会话类型，参数无效
         * @param __ 目标 ID，参数无效
         * @param messageIds 消息 ID 数组
         * @param callback
        */
        deleteLocalMessages(_, __, messageIds, callback) {
            engine.assert('messageIds', messageIds, engine.AssertRules.ARRAY, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.deleteMessages(messageIds).then(code => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, true);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'deleteLocalMessages', callback);
        }
        /**
         * 从本地消息数据库中删除某一会话指定时间之前的消息数据
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param timestamp 指定删除该时间戳之前的消息
         * @param cleanSpace 指定删除该时间戳之前的消息。是否清理数据条目所使用的磁盘空间。清理磁盘空间会阻塞进程且耗时较长，不推荐使用。
         * 数据在被抹除的情况下，未清理的磁盘空间会在后续存储操作中复用，且对数据查询无影响
         * @param callback
        */
        deleteLocalMessagesByTimestamp(conversationType, targetId, timestamp, cleanSpace, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('timestamp', timestamp, engine.AssertRules.NUMBER, true);
            engine.assert('cleanSpace', cleanSpace, engine.AssertRules.BOOLEAN);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._defaultChannelClient.deleteLocalMessagesByTimestamp(conversationType, targetId, timestamp, cleanSpace, callback);
            }, 'deleteLocalMessagesByTimestamp', callback);
        }
        /**
         * 清空会话下历史消息
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param callback
        */
        clearMessages(conversationType, targetId, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._defaultChannelClient.clearMessages(conversationType, targetId, callback);
            }, 'clearMessages', callback);
        }
        /**
         * 获取消息
         * @param messageId 本地消息 ID 或 messageUId
        */
        getMessage(messageId, callback) {
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._context.getMessage(messageId).then(({ code, data }) => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, tranToV2Message(data));
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'getMessage', callback);
        }
        /**
         * 设置消息发送状态
        */
        setMessageSentStatus(messageId, sentStatus, callback) {
            engine.assert('messageId', messageId, engine.AssertRules.NUMBER, true);
            engine.assert('sentStatus', sentStatus, engine.AssertRules.NUMBER, true);
            this.assertCPPMode(() => {
                this._context.setMessageSentStatus(messageId, sentStatus).then(code => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, true);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'setMessageSentStatus', callback);
        }
        /**
        * 设置消息接收状态
        */
        setMessageReceivedStatus(messageId, receivedStatus, callback) {
            engine.assert('messageId', messageId, engine.AssertRules.NUMBER, true);
            engine.assert('receivedStatus', receivedStatus, engine.AssertRules.NUMBER, true);
            this.assertCPPMode(() => {
                this._context.setMessageReceivedStatus(messageId, receivedStatus).then(code => {
                    if (code === engine.ErrorCode.SUCCESS) {
                        onSuccessHook(callback.onSuccess, true);
                    }
                    else {
                        onErrorHook(callback.onError, code);
                    }
                });
            }, 'setMessageReceivedStatus', callback);
        }
        /**
         * 设置消息内容
         * @param messageId 本地消息 ID
         * @param content 消息内容
         * @param objectName 消息类型
        */
        setMessageContent(messageId, content, objectName) {
            engine.assert('messageId', messageId, engine.AssertRules.NUMBER, true);
            engine.assert('objectName', objectName, engine.AssertRules.ONLY_STRING, true);
            this.assertCPPMode(() => {
                this._context.setMessageContent(messageId, content, objectName);
            }, 'setMessageContent');
        }
        /**
         * 设置消息搜索字段
         * @param messageId 本地消息 ID
         * @param content 消息内容
         * @param searchFiles 搜索字段
        */
        setMessageSearchField(messageId, content, searchFiles) {
            engine.assert('messageId', messageId, engine.AssertRules.NUMBER, true);
            engine.assert('searchFiles', searchFiles, engine.AssertRules.STRING, true);
            this.assertCPPMode(() => {
                this._context.setMessageSearchField(messageId, content, searchFiles);
            }, 'setMessageSearchField');
        }
        /**
         * 按内容搜索会话
         * @param keyword 关键字
         * @param conversationTypes 会话类型数组
         * @param customMessageTypes 自定义消息类型,若关键字属于自定义消息类型，需传入
        */
        searchConversationByContent(keyword, callback, conversationTypes, customMessageTypes) {
            engine.assert('keyword', keyword, engine.AssertRules.STRING, true);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            engine.assert('conversationTypes', conversationTypes, engine.AssertRules.ARRAY);
            engine.assert('customMessageType', customMessageTypes, engine.AssertRules.ARRAY);
            this.assertCPPMode(() => {
                this._defaultChannelClient.searchConversationByContent(keyword, callback, conversationTypes, customMessageTypes);
            }, 'searchConversationByContent', callback);
        }
        /**
         * 按内容搜索会话内的消息
         * @param keyword 搜索内容
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param timestamp 搜索时间, 搜索该时间之前的消息
         * @param count 获取的数量
        */
        searchMessageByContent(conversationType, targetId, keyword, timestamp, count, total, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('keyword', keyword, engine.AssertRules.STRING, true);
            engine.assert('timestamp', timestamp, engine.AssertRules.NUMBER);
            engine.assert('count', count, engine.AssertRules.NUMBER);
            engine.assert('total', total, engine.AssertRules.NUMBER);
            engine.assert('callback', callback, engine.AssertRules.CALLBACK);
            this.assertCPPMode(() => {
                this._defaultChannelClient.searchMessageByContent(conversationType, targetId, keyword, timestamp, count, total, callback);
            }, 'searchMessageByContent', callback);
        }
        /**
         * 获取会话下所有未读的 @ 消息
         * @param conversationType 会话类型
         * @param targetId 目标 ID
        */
        getUnreadMentionedMessages(conversationType, targetId) {
            if (!this._isCPPMode) {
                logger.error('getUnreadMentionedMessages method is not supported in a browser!');
                return null;
            }
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            return this._defaultChannelClient.getUnreadMentionedMessages(conversationType, targetId);
        }
        /**
         * 清除时间戳前的未读数
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param timestamp 目标 ID
         * @param callback
        */
        clearUnreadCountByTimestamp(conversationType, targetId, timestamp, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            engine.assert('timestamp', timestamp, engine.AssertRules.NUMBER, true);
            this.assertCPPMode(() => {
                this._defaultChannelClient.clearUnreadCountByTimestamp(conversationType, targetId, timestamp, callback);
            }, 'clearUnreadCountByTimestamp', callback);
        }
        /**
         * 获取会话免打扰状态
         * @param conversationType 会话类型
         * @param targetId 目标 ID
         * @param callback
        */
        getConversationNotificationStatus(conversationType, targetId, callback) {
            engine.assert('conversationType', conversationType, engine.AssertRules.NUMBER, true);
            engine.assert('targetId', targetId, engine.AssertRules.STRING, true);
            this.assertCPPMode(() => {
                this._defaultChannelClient.getConversationNotificationStatus(conversationType, targetId, callback);
            }, 'getConversationNotificationStatus', callback);
        }
        /* ====================== CPP 独有接口增加 END ======================== */
        /* ======================== RTC 相关接口增加 ======================= */
        getRTCUserInfoList(room, callback) {
            this._context.getRTCUserInfoList(room.id).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    const users = data === null || data === void 0 ? void 0 : data.users;
                    callback.onSuccess(users);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        getRTCUserList(room, callback) {
            this._context.getRTCUserList(room.id).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(data);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        setRTCUserInfo(room, info, callback) {
            this._context.setRTCUserInfo(room.id, info.key, info.value).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        removeRTCUserInfo(room, info, callback) {
            this._context.removeRTCUserInfo(room.id, info.keys).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        getRTCRoomInfo(room, callback) {
            this._context.getRTCRoomInfo(room.id).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(data);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        // RTC SDK 未使用
        setRTCRoomInfo(room, info, callback) {
            throw engine.todo('setRTCRoomInfo');
        }
        // RTC SDK 未使用
        removeRTCRoomInfo(room, info, callback) {
            throw engine.todo('removeRTCRoomInfo');
        }
        joinRTCRoom(room, callback) {
            const mode = room.mode || 0;
            this._context.joinRTCRoom(room.id, mode).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(data);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        quitRTCRoom(room, callback) {
            this._context.quitRTCRoom(room.id).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        RTCPing(room, callback) {
            const mode = room.mode || 0;
            this._context.rtcPing(room.id, mode).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        setRTCData(roomId, key, value, isInner, apiType, callback, message) {
            this._context.setRTCData(roomId, key, value, isInner, apiType, message).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        getRTCData(roomId, keys, isInner, apiType, callback) {
            this._context.getRTCData(roomId, keys, isInner, apiType).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(data);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        removeRTCData(roomId, keys, isInner, apiType, callback, message) {
            this._context.removeRTCData(roomId, keys, isInner, apiType, message).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        setRTCUserData(roomId, key, value, isInner, callback, message) {
            this.setRTCData(roomId, key, value, isInner, engine.RTCApiType.PERSON, callback, message);
        }
        setRTCUserTotalRes(roomId, message, valueInfo, objectName, callback) {
            this._context.setRTCTotalRes(roomId, message, valueInfo, objectName).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                    return;
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        getRTCUserData(roomId, keys, isInner, callback) {
            this.getRTCData(roomId, keys, isInner, engine.RTCApiType.PERSON, callback);
        }
        removeRTCUserData(roomId, keys, isInner, callback, message) {
            this.removeRTCData(roomId, keys, isInner, engine.RTCApiType.PERSON, callback, message);
        }
        setRTCRoomData(roomId, key, value, isInner, callback, message) {
            this.setRTCData(roomId, key, value, isInner, engine.RTCApiType.ROOM, callback, message);
        }
        getRTCRoomData(roomId, keys, isInner, callback) {
            this.getRTCData(roomId, keys, isInner, engine.RTCApiType.ROOM, callback);
        }
        removeRTCRoomData(roomId, keys, isInner, callback, message) {
            this.removeRTCData(roomId, keys, isInner, engine.RTCApiType.ROOM, callback, message);
        }
        // 信令 SDK 使用 (信令 SDK 暂不维护)
        setRTCOutData(roomId, data, type, callback, message) {
            throw engine.todo('setRTCOutData');
        }
        // 信令 SDK 使用 (信令 SDK 暂不维护)
        getRTCOutData(roomId, userIds, callback) {
            throw engine.todo('getRTCOutData');
        }
        getRTCToken(room, callback) {
            this._context.getRTCToken(room.id, room.mode, room.broadcastType).then(({ code, data }) => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(data);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
        setRTCState(room, content, callback) {
            this._context.setRTCState(room.id, content.report).then(code => {
                if (code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(true);
                }
                callback.onError(code);
            }).catch(callback.onError);
        }
    }

    const RegisterMessage = {};
    let imClient;
    let context;
    const rtcInnerMsgWatcher = [];
    const rtcInnerStatusWatcher = [];
    const rtcInnerWatcher = {
        message(message) {
            rtcInnerMsgWatcher.forEach(item => item(tranToV2Message(message)));
        },
        status(status) {
            rtcInnerStatusWatcher.forEach(item => item(status));
        }
    };
    const CallLibReceivedMsgListener = {};
    var RongIMClient = {
        /**
          * 初始化 IM SDK
          * @param appkey
          * @param _ 该参数已废弃，为保持向前兼容，保留占位参数
          * @param options
          */
        init(appkey, _, options = {}) {
            context = engine.APIContext.init(runtime, {
                appkey,
                apiVersion: "2.8.0-alpha.9",
                navigators: options.navi ? [options.navi] : [],
                miniCMPProxy: [],
                connectionType: (options === null || options === void 0 ? void 0 : options.connectionType) || 'websocket',
                dbPath: options.dbPath,
                logLevel: options === null || options === void 0 ? void 0 : options.logLevel
            });
            if ([0, 1, 2, 3, 4].indexOf(options.logLevel) > -1) {
                logger.set(options.logLevel);
            }
            imClient = new IMClient(context);
        },
        /**
         * 单例模式，用于获取 IMClient 实例
         */
        getInstance() {
            return imClient;
        },
        /**
         * 添加连接状态变更事件监听
         * @param listener
         */
        setConnectionStatusListener(listener) {
            context.assignWatcher({
                connectionState: listener.onChanged
            });
        },
        /**
          * 添加消息监听器
          * @param listener
          */
        setOnReceiveMessageListener(listener) {
            context.assignWatcher({
                message: (message) => {
                    try {
                        let v2Message = tranToV2Message(message);
                        const currentUserId = context.getCurrentUserId();
                        // 处理收到的群回执请求消息
                        handleRRReqMsg(v2Message, currentUserId);
                        // 处理收到的群回执响应消息
                        v2Message = handleRRResMsg(v2Message, currentUserId);
                        listener.onReceived(v2Message, 0, false);
                    }
                    catch (err) {
                        logger.error(err);
                    }
                }
            });
        },
        /**
         * 会话状态监听器
         * @param listener
        */
        setConversationStatusListener(listener) {
            context.assignWatcher({
                conversationState: (conversations) => {
                    try {
                        const updatedConversationStatus = [];
                        conversations.forEach((item) => {
                            let { updatedItems, conversationType, targetId, channelId } = item;
                            updatedItems = updatedItems || {};
                            const { notificationStatus, isTop } = updatedItems;
                            if (notificationStatus && isTop) {
                                updatedConversationStatus.push({
                                    notificationStatus: notificationStatus.val,
                                    isTop: isTop.val,
                                    conversationType,
                                    targetId,
                                    channelId: channelId || '',
                                    updatedTime: notificationStatus.time
                                });
                            }
                        });
                        if (updatedConversationStatus.length > 0) {
                            listener.onChanged(updatedConversationStatus);
                        }
                    }
                    catch (err) {
                        logger.error(err);
                    }
                }
            });
        },
        /**
         * 消息扩展监听
        */
        setMessageExpansionListener(listener) {
            context.assignWatcher({
                expansion: (info) => {
                    try {
                        info.updatedExpansion && listener.onUpdated(info.updatedExpansion);
                        info.deletedExpansion && listener.onDeleted(info.deletedExpansion);
                    }
                    catch (err) {
                        logger.error(err);
                    }
                }
            });
        },
        /**
         * tag监听
         */
        setTagListener(listener) {
            context.assignWatcher({
                tag: () => {
                    listener.onChanged();
                }
            });
        },
        /**
         * 会话中tag状态监听
         */
        setConversationTagListener(listener) {
            context.assignWatcher({
                conversationTagChanged: () => {
                    listener.onChanged();
                }
            });
        },
        /**
          * 连接 IM 服务
          * @param token 用于连接鉴权
          * @param callback 连接状态回调
          */
        connect(token, callback) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield context.connect(token);
                if (res.code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(res.userId);
                }
                else if (res.code === engine.ErrorCode.RC_CONN_USER_OR_PASSWD_ERROR) {
                    callback.onTokenIncorrect();
                }
                else {
                    callback.onError(res.code);
                }
            });
        },
        /**
         * 重连 im 服务
         * @description Web IM 3.0 开始 SDK 内部会进行自动重连，不需要主动调用此方法。此方法建议主动断开连接后，再次链接时调用。
         * @param callback 重连状态回调
         * @param options 该参数已废弃
         */
        reconnect(callback, options) {
            context.reconnect().then(res => {
                if (res.code === engine.ErrorCode.SUCCESS) {
                    callback.onSuccess(res.userId);
                }
                else {
                    callback.onError(res.code);
                }
            }).catch(callback.onError);
        },
        /**
          * 已注册的消息类型定义
          */
        RegisterMessage,
        /**
         * 已注册的消息类型映射
        */
        RegisterMessageTypeMapping,
        /**
         * 根据 messageType 获取对应的消息 objectName 值
         * 若无记录，则返回原字符串
         * @param messageType
         * @todo 优化算法
         */
        getMessageObjectName(messageType) {
            const maps = Object.assign(Object.assign({}, MsgTypeMapping), RegisterMessageTypeMapping);
            return Object.keys(maps).find(objectName => {
                return maps[objectName] === messageType;
            }) || messageType;
        },
        /**
          * 注册自定义消息
          * @param messageType v2 中定义的消息类型，如：TextMessage
          * @param objectName 与移动端对齐的消息结构类型，如：RC:TxtMsg
          * @param mesasgeTag 是否存储或计数标记
          * @param searchProps 消息属性名称列表
          */
        registerMessageType(messageType, objectName, mesasgeTag, searchProps) {
            this.RegisterMessage[messageType] = regMessage(messageType, objectName, mesasgeTag.isPersited, mesasgeTag.isCounted);
            this.RegisterMessageTypeMapping[objectName] = messageType;
            context.registerMessageType(objectName, mesasgeTag.isPersited, mesasgeTag.isCounted, searchProps);
        },
        /**
         * RTC Lib 内部使用消息监听器
        */
        messageWatch(watcher) {
            rtcInnerMsgWatcher.push((message) => {
                try {
                    watcher(message);
                    this._voipProvider.onReceived && this._voipProvider.onReceived(message);
                }
                catch (err) {
                    logger.error(err);
                }
            });
            context.assignWatcher({ rtcInnerWatcher });
        },
        /**
         * RTC Lib 内部使用状态监听器
        */
        statusWatch(watcher) {
            rtcInnerStatusWatcher.push((status) => {
                try {
                    watcher(status);
                }
                catch (err) {
                    logger.error(err);
                }
            });
        },
        /**
         * 兼容 RTC Lib
        */
        MessageType: { UnknownMessage: 'UnknownMessage' },
        /**
         * 兼容 CallLib 消息监听
        */
        _voipProvider: CallLibReceivedMsgListener
    };

    /**
     * 群组内的消息包含的 @ 数据
     */
    class MentionedInfo {
        constructor(type, userIdList, mentionedContent) {
            this.type = type;
            this.userIdList = userIdList;
            this.mentionedContent = mentionedContent;
        }
    }

    class MessageTag {
        constructor(
        /**
         * 是否计数
         */
        isCounted, 
        /**
         * 是否存储
         */
        isPersited) {
            this.isCounted = isCounted;
            this.isPersited = isPersited;
        }
    }

    /**
     * 文本消息
     */
    var TextMessage = regMessage('TextMessage', 'RC:TxtMsg');

    var LocationMessage = regMessage('LocationMessage', 'RC:LBSMsg');

    var TypingStatusMessage = regMessage('TypingStatusMessage', 'RC:TypSts');

    var ImageMessage = regMessage('ImageMessage', 'RC:ImgMsg');

    var RichContentMessage = regMessage('RichContentMessage', 'RC:ImgTextMsg');

    var VoiceMessage = regMessage('VoiceMessage', 'RC:VcMsg');

    var HQVoiceMessage = regMessage('HQVoiceMessage', 'RC:HQVCMsg');

    var FileMessage = regMessage('FileMessage', 'RC:FileMsg');

    var SightMessage = regMessage('SightMessage', 'RC:SightMsg');

    var GIFMessage = regMessage('GIFMessage', 'RC:GIFMsg');

    var ReadReceiptMessage = regMessage('ReadReceiptMessage', 'RC:ReadNtf');

    var ReadReceiptRequestMessage = regMessage('ReadReceiptRequestMessage', 'RC:RRReqMsg');

    var CombineMessage = regMessage('RCCombineMessage', 'RC:CombineMsg');

    class Message {
        constructor(conversationType, targetId, senderUserId, content, objectName, messageType, messageId, messageUId, messageDirection, offLineMessage, sentStatus, sentTime, receivedStatus, receivedTime, canIncludeExpansion, expansion, receiptResponse, disableNotification) {
            this.conversationType = conversationType;
            this.targetId = targetId;
            this.senderUserId = senderUserId;
            this.content = content;
            this.objectName = objectName;
            this.messageType = messageType;
            this.messageId = messageId;
            this.messageUId = messageUId;
            this.messageDirection = messageDirection;
            this.offLineMessage = offLineMessage;
            this.sentStatus = sentStatus;
            this.sentTime = sentTime;
            this.receivedStatus = receivedStatus;
            this.receivedTime = receivedTime;
            this.canIncludeExpansion = canIncludeExpansion;
            this.expansion = expansion;
            this.receiptResponse = receiptResponse;
            this.disableNotification = disableNotification;
        }
    }

    exports.VoIPMediaType = void 0;
    (function (VoIPMediaType) {
        VoIPMediaType[VoIPMediaType["MEDIA_AUDIO"] = 1] = "MEDIA_AUDIO";
        VoIPMediaType[VoIPMediaType["MEDIA_VEDIO"] = 2] = "MEDIA_VEDIO";
        VoIPMediaType[VoIPMediaType["MEDIA_VIDEO"] = 2] = "MEDIA_VIDEO";
    })(exports.VoIPMediaType || (exports.VoIPMediaType = {}));

    const AcceptMessage = regMessage('AcceptMessage', 'RC:VCAccept');
    const RingingMessage = regMessage('RingingMessage', 'RC:VCRinging');
    const SummaryMessage = regMessage('SummaryMessage', 'RC:VCSummary');
    const HungupMessage = regMessage('HungupMessage', 'RC:VCHangup');
    const InviteMessage = regMessage('InviteMessage', 'RC:VCInvite');
    const MediaModifyMessage = regMessage('MediaModifyMessage', 'RC:VCModifyMedia');
    const MemberModifyMessage = regMessage('MemberModifyMessage', 'RC:VCModifyMem');

    var SyncReadStatusMessage = regMessage('lastMessageSendTime', 'RC:SRSMsg');

    var ReferenceMessage = regMessage('ReferenceMessage', 'RC:ReferenceMsg');

    /**
     * 群组 @ 类型
     * V2 与 engine 定义的 MentionedType 不一致，需重新定义
    */
    var MentionedType;
    (function (MentionedType) {
        /**
         * 所有人
        */
        MentionedType[MentionedType["ALL"] = 1] = "ALL";
        /**
         * 部分人
        */
        MentionedType[MentionedType["PART"] = 2] = "PART";
    })(MentionedType || (MentionedType = {}));
    var MentionedType$1 = MentionedType;

    var PublicServiceRichContentMessage = regMessage('PublicServiceRichContentMessage', 'RC:PSImgTxtMsg');

    var PublicServiceMultiRichContentMessage = regMessage('PublicServiceMultiRichContentMessage', 'RC:PSMultiImgTxtMsg');

    const ConnectionState = engine.ConnectResultCode;
    // 2.5 之前的版本对外暴露了两个全局变量，RongIMLib、RongIMClient，此处做兼容
    if (window) {
        window.RongIMClient = RongIMClient;
    }

    Object.defineProperty(exports, 'ConnectionStatus', {
        enumerable: true,
        get: function () {
            return engine.ConnectionStatus;
        }
    });
    Object.defineProperty(exports, 'ConversationType', {
        enumerable: true,
        get: function () {
            return engine.ConversationType;
        }
    });
    Object.defineProperty(exports, 'ErrorCode', {
        enumerable: true,
        get: function () {
            return engine.ErrorCode;
        }
    });
    Object.defineProperty(exports, 'FileType', {
        enumerable: true,
        get: function () {
            return engine.FileType;
        }
    });
    Object.defineProperty(exports, 'MessageDirection', {
        enumerable: true,
        get: function () {
            return engine.MessageDirection;
        }
    });
    Object.defineProperty(exports, 'ReceivedStatus', {
        enumerable: true,
        get: function () {
            return engine.ReceivedStatus;
        }
    });
    Object.defineProperty(exports, 'UploadMethod', {
        enumerable: true,
        get: function () {
            return engine.UploadMethod;
        }
    });
    exports.AcceptMessage = AcceptMessage;
    exports.ConnectionState = ConnectionState;
    exports.FileMessage = FileMessage;
    exports.GIFMessage = GIFMessage;
    exports.GetChatRoomType = GetChatRoomType$1;
    exports.HQVoiceMessage = HQVoiceMessage;
    exports.HungupMessage = HungupMessage;
    exports.ImageMessage = ImageMessage;
    exports.InviteMessage = InviteMessage;
    exports.LocationMessage = LocationMessage;
    exports.MediaModifyMessage = MediaModifyMessage;
    exports.MemberModifyMessage = MemberModifyMessage;
    exports.MentionedInfo = MentionedInfo;
    exports.MentionedType = MentionedType$1;
    exports.Message = Message;
    exports.MessageTag = MessageTag;
    exports.PublicServiceMultiRichContentMessage = PublicServiceMultiRichContentMessage;
    exports.PublicServiceRichContentMessage = PublicServiceRichContentMessage;
    exports.RCCombineMessage = CombineMessage;
    exports.ReadReceiptMessage = ReadReceiptMessage;
    exports.ReadReceiptRequestMessage = ReadReceiptRequestMessage;
    exports.ReadReceiptResponseMessage = ReadReceiptResponseMessage;
    exports.ReferenceMessage = ReferenceMessage;
    exports.RichContentMessage = RichContentMessage;
    exports.RingingMessage = RingingMessage;
    exports.RongIMClient = RongIMClient;
    exports.SentStatus = SentStatus$1;
    exports.SightMessage = SightMessage;
    exports.SummaryMessage = SummaryMessage;
    exports.SyncReadStatusMessage = SyncReadStatusMessage;
    exports.TextMessage = TextMessage;
    exports.TypingStatusMessage = TypingStatusMessage;
    exports.VoiceMessage = VoiceMessage;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
