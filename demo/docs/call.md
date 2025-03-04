# Call.html 按钮功能说明

## 连接和注册功能

### 连接服务器

- 按钮：Connect
- 功能：初始化SIP连接
- 调用函数：`Init()`
- 调用链：
  1. Client.ts: `init(serverip, serverport, userid, userpwd)`
  - 保存服务器配置信息
  - 构建WebSocket和HTTPS URL
  - 配置SimpleUser选项(日志、媒体等)
  - 创建SimpleUser实例
  2. Client.ts: `connect(clientcallback)`
  - 调用SimpleUser.connect()
  - 处理连接成功/失败回调

### 注册

- 按钮：注册
- 功能：向SIP服务器注册用户
- 调用函数：`Register()`
- 调用链：
  1. Client.ts: `Register(timeexp)`
  - 设置注册超时时间
  - 调用SimpleUser.register()
  - 处理注册成功/失败回调

### 注销

- 按钮：注销
- 功能：注销当前用户
- 调用函数：`UnRegister()`
- 调用链：
  1. Client.ts: `UnRegister()`
  - 调用SimpleUser.unregister()
  - 处理注销状态回调

### 断开连接

- 按钮：Disconnect
- 功能：断开与服务器的连接
- 调用函数：`Disconnect()`
- 调用链：
  1. Client.ts: `disconnect()`
  - 调用SimpleUser.disconnect()
  - 更新连接状态

## 配置和WebSocket功能

### 获取配置信息

- 按钮：获取配置信息
- 功能：获取服务器配置信息
- 调用函数：`GetServerLoginInfo()`
- 调用链：
  1. Client.ts: `GetEmployeeLoginInfo()`
  - 发送API请求获取配置

### 连接WebSocket

- 按钮：连接WebSocket
- 功能：建立WebSocket连接
- 调用函数：`ConnectServerWebSocket()`
- 调用链：
  1. Client.ts: `ConnWebSocket()`
  - 构建WebSocket URL
  - 创建WebSocket连接
  - 配置事件监听器

### 断开WebSocket

- 按钮：断开WebSocket
- 功能：断开WebSocket连接
- 调用函数：`DisConnectServerWebSocket()`
- 调用链：
  1. Client.ts: `DisConnWebSocket()`
  - 执行WebSocket注销
  - 关闭连接

## 呼叫功能

### 语音呼叫

- 按钮：语音呼叫
- 功能：发起语音通话
- 调用函数：`AudioCall()`
- 调用链：
  1. Client.ts: `MakeCall(number, MediaTypeAudio, localVideo, remoteVideo, remoteAudio, false)`
  - 构建呼叫信息对象
  - 创建API消息头
  - 保存呼叫信息到映射表
  - 通过SendAPI()发送呼叫请求
  - 服务器响应后创建SIP会话

### 视频呼叫

- 按钮：视频呼叫
- 功能：发起视频通话
- 调用函数：`VideoCall()`
- 调用链：
  1. Client.ts: `MakeCall(number, MediaTypeVideo, localVideo, remoteVideo, remoteAudio, false)`
  - 构建呼叫信息对象
  - 创建API消息头
  - 保存呼叫信息到映射表
  - 通过SendAPI()发送呼叫请求
  - 服务器响应后创建SIP会话

### 挂断

- 按钮：挂断
- 功能：结束当前通话
- 调用函数：`HangUP()`
- 调用链：
  1. Client.ts: `Hangup(sid)`
  - 查找会话信息
  - 调用SimpleUser.hangup()
  - 处理挂断回调

### 接听

- 按钮：接听
- 功能：接听来电
- 调用函数：`Answer()`
- 调用链：
  1. Client.ts: `Answer(sid, localVideo, remoteVideo, remoteAudio)`
  - 查找会话信息
  - 调用Answerbycallid()
  2. Client.ts: `Answerbycallid(callid, ...)`
  - 配置媒体约束
  - 执行应答操作

## 日志功能

### 清空日志

- 按钮：清空
- 功能：清空日志显示区域
- 调用函数：`clearlog()`
- 调用链：
  1. demo.js: `clearlog()`
  - 获取日志文本区域
  - 清空文本内容
