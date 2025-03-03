# SIP.js 客户端 API 文档

## 概述

该模块提供了SIP通信的客户端功能实现，包括呼叫、消息、会议等功能。

### 主要功能

- SIP服务器连接和注册：处理与SIP服务器的连接、注册和认证
- 音视频呼叫管理：支持音频/视频通话的创建、接听、挂断等操作
- 会议管理：支持创建和管理多人音视频会议
- 消息收发：支持即时消息的发送和接收
- WebSocket通信：提供实时双向通信支持
- 媒体控制：支持音视频设备控制、静音、保持等功能
- 文件传输：支持文件上传和进度监控

### 技术特点

- 基于SIP.js库实现标准SIP协议通信
- 使用WebRTC实现音视频流传输
- 支持HTTPS安全传输
- 提供完整的事件回调机制

## API 参考

### 初始化与连接

#### init(serverip: string, serverport: string, userid: string, userpwd: string)

初始化SIP客户端

参数:

- serverip: SIP服务器IP地址
- serverport: 服务器端口号
- userid: 用户唯一标识
- userpwd: 用户密码

#### connect(callback: ClientDelegate)

连接到SIP服务器

参数:

- callback: 客户端回调对象，用于处理连接状态变化等事件

#### disconnect()

断开与SIP服务器的连接

#### Register(timeexp?: number)

注册到SIP服务器

参数:

- timeexp: 注册超时时间(秒)，取值范围1-600，默认60

#### UnRegister()

注销SIP用户

### WebSocket通信

#### ConnWebSocket()

连接WebSocket服务器

#### DisConnWebSocket()

断开WebSocket连接

#### SendAPI(msg: string)

发送API消息

参数:

- msg: 要发送的消息内容

### 呼叫管理

#### MakeCall(called: string, videotype: MediaType, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean)

发起呼叫

参数:

- called: 被叫号码
- videotype: 媒体类型
- localvideo: 本地视频元素
- remotevideo: 远程视频元素
- remoteaudio: 远程音频元素
- isshowscreen: 是否显示屏幕共享

#### Answer(sid: string, localvideo?: HTMLVideoElement, remotevideo?: HTMLVideoElement, remoteaudio?: HTMLAudioElement, isshowscreen?: boolean)

应答呼叫

参数:

- sid: 会话ID
- localvideo: 本地视频元素(可选)
- remotevideo: 远程视频元素(可选)
- remoteaudio: 远程音频元素(可选)
- isshowscreen: 是否显示屏幕共享(可选)

#### Hangup(sid: string)

挂断呼叫

参数:

- sid: 会话ID

#### SendDTMF(tone: string, sid: string)

发送DTMF信号

参数:

- tone: DTMF音调字符串
- sid: 会话ID

### 媒体控制

#### Hold(sid: string)

保持会话

参数:

- sid: 会话ID

#### UnHold(sid: string)

取消保持会话

参数:

- sid: 会话ID

#### Mute(sid: string)

静音会话

参数:

- sid: 会话ID

#### UnMute(sid: string)

取消静音会话

参数:

- sid: 会话ID

#### IsMuted(sid: string): boolean

检查会话是否处于静音状态

参数:

- sid: 会话ID

返回:

- boolean: 是否静音

### 视频控制

#### TakePhoto(sid: string, pathname: string): boolean

从视频会话中截取照片

参数:

- sid: 会话ID
- pathname: 保存的文件路径

返回:

- boolean: 是否截图成功

#### MediaRecordStart(sid: string, pathname: string): boolean

开始录制视频会话

参数:

- sid: 会话ID
- pathname: 保存的文件路径

返回:

- boolean: 是否开始录制成功

#### MediaRecordStop(sid: string): boolean

停止录制视频会话

参数:

- sid: 会话ID

返回:

- boolean: 是否停止录制成功

### 会议管理

#### CreateConf(called: string, confnum: string, confname: string, videotype: MediaType, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean)

创建会议

参数:

- called: 与会成员
- confnum: 会议号码
- confname: 会议名称
- videotype: 媒体类型
- localvideo: 本地视频元素
- remotevideo: 远程视频元素
- remoteaudio: 远程音频元素
- isshowscreen: 是否显示屏幕共享

#### CreatePlayFileConf(called: string, confnum: string, confname: string, videotype: MediaType, fileid: string, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean)

创建文件播放会议

参数:

- called: 与会成员
- confnum: 会议号码
- confname: 会议名称
- videotype: 媒体类型
- fileid: 文件ID
- localvideo: 本地视频元素
- remotevideo: 远程视频元素
- remoteaudio: 远程音频元素
- isshowscreen: 是否显示屏幕共享

#### CreatePlayFileBroadcast(called: string, confnum: string, confname: string, videotype: MediaType, fileid: string, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean)

创建文件广播会议

参数同 CreatePlayFileConf

### 文件播放控制

#### PlayFile(sid: string, fileid: string, playnum: number)

播放文件

参数:

- sid: 会话ID
- fileid: 文件ID
- playnum: 播放次数

#### PlayFileStop(sid: string, fileid: string)

停止播放文件

参数:

- sid: 会话ID
- fileid: 文件ID

### 视频监控

#### VideoBug(called: string, codec: string, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement)

创建视频监控

参数:

- called: 被监控号码
- codec: 编解码器
- localvideo: 本地视频元素
- remotevideo: 远程视频元素
- remoteaudio: 远程音频元素

#### SetGetCallMemberVideo(cid: string, srcmember: string, sessionnum: string, sessionname: string, strcalleds: string, remotevideo: HTMLVideoElement)

获取会议成员视频

参数:

- cid: 呼叫ID
- srcmember: 源成员号码
- sessionnum: 会话号码
- sessionname: 会话名称
- strcalleds: 目标成员列表
- remotevideo: 远程视频元素

### 其他功能

#### GetEmployeeLoginInfo()

获取员工登录信息

## 事件回调

通过 ClientDelegate 接口提供以下回调事件：

- onCallCreated: 呼叫创建时触发
- onCallReceived: 收到呼叫时触发
- onCallAnswered: 呼叫被应答时触发
- onCallHangup: 呼叫挂断时触发
- onCallHold: 呼叫保持状态变化时触发
- onServerConnect: 服务器连接成功时触发
- onServerDisconnect: 服务器断开连接时触发
- onMessageReceived: 收到消息时触发

## 数据类型

### MediaType

媒体类型枚举

- MediaTypeAudio: 纯音频
- MediaTypeVideo: 音视频

### CallType

呼叫类型枚举

- CallTypeSingle2: 点对点呼叫
- CallTypeTemporary: 临时会议
- CallTypeIntercom: 对讲
- CallTypeTmpintercom: 临时对讲
- CallTypeBroadcast: 广播

### CallState

呼叫状态枚举

- CallStateInit: 初始状态
- CallStateRing: 振铃状态
- CallStateAnswer: 应答状态
- CallStateRelease: 释放状态