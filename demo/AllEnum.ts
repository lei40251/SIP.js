/**
 * 通话类型枚举
 * 定义了系统支持的所有通话类型，包括单呼、组呼、广播、监听等多种业务场景
 *
 * 通话类型的选择会影响呼叫的建立过程、媒体流的处理方式和会话的管理方式：
 * - 单呼/增强单呼：用于两个用户之间的一对一通话
 * - 组呼：支持一对多的群组通话，可以是临时组或固定组
 * - 广播：向多个用户发送单向的音视频流
 * - 监听：用于对特定用户的通话进行监听
 * - 对讲：支持即按即通的半双工通信模式
 * - 视频监控：用于视频监控和远程查看场景
 * - 会议：支持多人音视频会议，可以动态加入/退出成员
 */
export enum CallType {
  /** 未定义的通话类型 */
  CallTypeNone = 0,
  /** 单呼通话，用于两个用户之间的一对一通话 */
  CallTypeSingle,
  /** 临时组呼，用于创建临时群组进行多人通话 */
  CallTypeTmpgroup,
  /** 报告通话，用于发送语音或视频报告信息 */
  CallTypeReport,
  /** 广播通话，用于向多个用户发送单向的音视频流 */
  CallTypeBroadcast,
  /** 临时通话，用于建立临时的点对点通信 */
  CallTypeTemporary,
  /** 强插通话，用于紧急情况下强制接入其他用户的通话 */
  CallTypeInterpose,
  /** 强拆通话，用于紧急情况下强制终止其他用户的通话 */
  CallTypeForceremove,
  /** 监听通话，用于对特定用户的通话进行监听 */
  CallTypeMonitor,
  /** 对讲通话，支持即按即通的半双工通信模式 */
  CallTypeIntercom,
  /** 切换通话，用于在不同通话之间进行切换 */
  CallTypeSwitch,
  /** 紧急通话，用于处理紧急情况的优先级通话 */
  CallTypeUrgent,
  /** 增强单呼通话，提供更多功能特性的一对一通话 */
  CallTypeSingle2,
  /** 临时对讲，用于创建临时的对讲通话 */
  CallTypeTmpintercom,
  /** 视频监控，用于远程视频监控和查看 */
  CallTypeVideobug,
  /** MCU会议，支持多人音视频会议 */
  CallTypeMCUMetting,
  /** SOS紧急求助，用于发送紧急求助信号 */
  CallTypeSOS,
  /** 视频转发，用于将视频流转发给其他用户 */
  CallTypeTransferVideo,
  /** 视频转发到MCU，用于将视频流转发到会议服务器 */
  CallTypeTransferVideoToMcu,
  /** 视频上传，用于上传本地视频流 */
  CallTypeUploadVideo,
  /** 文件播放，用于播放音视频文件 */
  CallTypePlayFile
}
/**
 * 媒体类型枚举
 * 定义了通信支持的媒体类型，用于指定通话中使用的媒体流类型
 */
export enum MediaType {
  /** 未定义的媒体类型 */
  MediaTypeNone = 0,
  /** 音频媒体，用于语音通话 */
  MediaTypeAudio,
  /** 视频媒体，用于视频通话 */
  MediaTypeVideo
}
/**
 * API消息头枚举
 * 定义了系统所有API接口的消息类型，包括会话管理、成员操作、系统管理、GIS定位等功能
 *
 * 消息类型分类说明：
 * 1. 会话管理类API (session.*)：
 *    - createcall: 创建新的通话会话，支持音频和视频呼叫
 *    - createvideobug: 创建视频监控会话
 *    - playfile: 文件播放控制，支持音频和视频文件
 *    - applyspeak: 申请发言权限
 *    - members.getall: 获取会话中的所有成员信息
 *
 * 2. 成员操作类API (operate.*)：
 *    - addmember/delmember: 添加或删除会话成员
 *    - member.speak: 控制成员的发言状态
 *    - member.hear: 控制成员的收听状态
 *    - member.push: 推送媒体流控制
 *    - transfer.video: 视频流转发控制
 *    - forceend.call: 强制结束通话
 *
 * 3. 系统管理类API (system.*)：
 *    - server.logininfo: 获取服务器登录信息
 *
 * 4. GIS定位类API (gis.*)：
 *    - set.trace: 设置位置跟踪参数
 *    - get.emppos: 获取指定用户的位置信息
 *
 * 5. 注册管理类API (reg.ws.*)：
 *    - login/logout: 用户登录和注销
 *    - heartbeat: 心跳保活
 *
 * 6. 数据查询类API (data.get.*)：
 *    - allgroup: 获取所有组信息
 *    - groupemps: 获取组内成员
 *    - empbytype: 按类型查询用户
 *    - query.emps: 按条件查询用户
 *
 * 7. 事件通知类：
 *    - Session.State.Change: 会话状态变更通知
 *    - GIS.Position.Change: 位置信息变更通知
 */
export enum APIHEADER {
  /** 标准JSON API消息类型 */
  FSMSGTYPE = "application/jsonapi",
  /** JSON API响应消息类型 */
  FSMSGRESTYPE = "application/resjsonapi",
  /** 创建通话会话请求 */
  API_SESSION_CREATECALL = "session.createcall",
  /** 创建通话会话响应 */
  API_SESSION_CREATECALLCB = "session.createcall.CB",
  /** 创建视频监控请求 */
  API_SESSION_CREATEVIDEOBUG = "session.createvideobug",
  /** 创建视频监控响应 */
  API_SESSION_CREATEVIDEOBUGCB = "session.creatvideobug.CB",
  /** 创建文件播放通话请求 */
  API_SESSION_CREATEPLAYFILECALL = "session.createcall.playfile",
  /** 创建文件播放通话响应 */
  API_SESSION_CREATEPLAYFILECALLCB = "session.createcall.playfile.CB",
  /** 文件播放控制请求 */
  API_SESSION_PLAYFILE = "session.playfile",
  /** 文件播放控制响应 */
  API_SESSION_PLAYFILECB = "session.playfile.CB",
  /** 停止文件播放请求 */
  API_SESSION_PLAYFILESTOP = "session.playfile.stop",
  /** 停止文件播放响应 */
  API_SESSION_PLAYFILESTOPCB = "session.playfile.stop.CB",
  /** 申请发言请求 */
  API_SESSION_APPLYSPEAK = "session.applyspeak",
  /** 申请发言响应 */
  API_SESSION_APPLYSPEAKCB = "session.applyspeak.CB",
  /** 获取所有成员信息请求 */
  API_SESSION_GETALLMEMBERS = "session.members.getall",
  /** 获取所有成员信息响应 */
  API_SESSION_GETALLMEMBERSCB = "session.members.getall.CB",

  /** 添加成员请求 */
  API_OPERATE_MEMBERADD = "operate.addmember",
  /** 添加成员响应 */
  API_OPERATE_MEMBERADDCB = "operate.addmember.CB",
  /** 删除成员请求 */
  API_OPERATE_MEMBERDEL = "operate.delmember",
  /** 删除成员响应 */
  API_OPERATE_MEMBERDELCB = "operate.delmember.CB",
  /** 控制成员发言请求 */
  API_OPERATE_MEMBER_SPEAK = "operate.member.speak",
  /** 控制成员发言响应 */
  API_OPERATE_MEMBER_SPEAKCB = "operate.member.speak.CB",
  /** 控制成员收听请求 */
  API_OPERATE_MEMBER_HEAR = "operate.member.hear",
  /** 控制成员收听响应 */
  API_OPERATE_MEMBER_HEARCB = "operate.member.hear.CB",
  /** 推送媒体流请求 */
  API_OPERATE_MEMBER_PUSH = "operate.member.push",
  /** 推送媒体流响应 */
  API_OPERATE_MEMBER_PUSHCB = "operate.member.push.CB",
  /** 视频转发请求 */
  API_OPERATE_TRANSFER_VIDEO = "operate.transfer.video",
  /** 视频转发响应 */
  API_OPERATE_TRANSFER_VIDEOCB = "operate.transfer.video.CB",
  /** 强制结束通话请求 */
  API_OPERATE_FORCEEND_CALL = "operate.forceend.call",
  /** 强制结束通话响应 */
  API_OPERATE_FORCEEND_CALLCB = "operate.forceend.call.CB",
  /** 通话操作请求 */
  API_OPERATE_CALL = "operate.call",
  /** 通话操作响应 */
  API_OPERATE_CALLCB = "operate.call.CB",

  /** 获取服务器登录信息请求 */
  API_SYSTEM_LOGININFO = "system.server.logininfo",
  /** 获取服务器登录信息响应 */
  API_SYSTEM_LOGININFOCB = "system.server.logininfo.CB",

  /** 设置位置跟踪请求 */
  API_GIS_SET_TRACE = "gis.set.trace",
  /** 设置位置跟踪响应 */
  API_GIS_SET_TRACECB = "gis.set.trace.CB",
  /** 获取用户位置请求 */
  API_GIS_GET_EMPPOS = "gis.get.emppos",
  /** 获取用户位置响应 */
  API_GIS_GET_EMPPOSCB = "gis.get.emppos.CB",

  /** WebSocket登录请求 */
  API_REG_WS_LOGIN = "reg.ws.login",
  /** WebSocket登录响应 */
  API_REG_WS_LOGINCB = "reg.ws.login.CB",
  /** WebSocket心跳请求 */
  API_REG_WS_HEARTBEAT = "reg.ws.heartbeat",
  /** WebSocket心跳响应 */
  API_REG_WS_HEARTBEATCB = "reg.ws.heartbeat.CB",
  /** WebSocket注销请求 */
  API_REG_WS_LOGOUT = "reg.ws.logout",
  /** WebSocket注销响应 */
  API_REG_WS_LOGOUTCB = "reg.ws.logout.CB",

  /** 获取所有组信息请求 */
  API_DATA_GET_ALLGROUP = "data.get.allgroup",
  /** 获取所有组信息响应 */
  API_DATA_GET_ALLGROUPCB = "data.get.allgroup.CB",
  /** 获取组内成员请求 */
  API_DATA_GET_GROUPEMPS = "data.get.groupemps",
  /** 获取组内成员响应 */
  API_DATA_GET_GROUPEMPSCB = "data.get.groupemps.CB",
  /** 按类型查询用户请求 */
  API_DATA_GET_EMPSBYTYPE = "data.get.empbytype",
  /** 按类型查询用户响应 */
  API_DATA_GET_EMPSBYTYPECB = "data.get.empbytype.CB",
  /** 按条件查询用户请求 */
  API_DATA_QUERY_EMPS = "data.query.emps",
  /** 按条件查询用户响应 */
  API_DATA_QUERY_EMPSCB = "data.query.emps.CB",

  /** 会话状态变更事件 */
  EventSessionStateChange = "Session.State.Change",
  /** 位置信息变更事件 */
  EventGisPositionChange = "GIS.Position.Change"
}

/**
 * 通话方向枚举
 * 定义了通话的发起和接收方向，用于标识当前用户在通话中的角色
 */
export enum CallDirect {
  /** 未定义的方向 */
  CallDirectNone = 0,
  /** 呼出，表示当前用户是通话发起方 */
  CallDirectOut,
  CallDirectIn
}
/**
 * 通话状态枚举
 * 定义了通话的各个生命周期状态，用于跟踪和管理通话进程
 */
export enum CallState {
  /** 未定义状态 */
  CallStateNone = 0,
  /** 初始化状态，通话创建但尚未建立连接 */
  CallStateInit,
  /** 正常通话状态，通话已建立并正常进行 */
  CallStateNormal,
  /** 呼出状态，正在发起呼叫请求 */
  CallStateCallout,
  /** 来电状态，收到呼叫请求 */
  CallStateIncoming,
  /** 振铃状态，正在等待接听 */
  CallStateRinging,
  /** 已连接状态，通话双方已建立连接 */
  CallStateConnect,
  /** 保持状态，通话被暂时挂起 */
  CallStateHold,
  /** 忙碌状态，被叫方正在通话中 */
  CallStateBusy,
  /** 摘机状态，已接听电话 */
  CallStateOffhook,
  /** 释放状态，通话已结束 */
  CallStateRelease,
  /** 禁言状态，用户被禁止发言 */
  CallStateUnspeak,
  /** 发言状态，用户获得发言权限 */
  CallStateSpeak,
  /** 排队状态，等待可用资源 */
  CallStateQueue,
  /** 取消保持状态，恢复通话 */
  CallStateUnhold,
  /** 僵死状态，通话异常断开 */
  CallStateZombie,
  /** 媒体超时状态，媒体流传输超时 */
  CallStateMEDIATIMEOUT,
  /** 无应答状态，呼叫超时未接听 */
  CallStateNoAnswer,
  /** 拒绝状态，被叫方拒绝接听 */
  CallStateRejected,
  /** 踢出状态，用户被强制退出通话 */
  CallStateKickOut
};

/**
 * 文件类型枚举
 * 定义了系统支持的各种文件类型，用于文件传输和处理
 */
export enum FileType {
  /** 未定义类型 */
  FileTypeNone = 0,
  /** 文本文件 */
  FileTypeText,
  /** 图片文件 */
  FileTypePic,
  /** 语音文件 */
  FileTypeVoice,
  /** 视频文件 */
  FileTypeVideo,
  /** GIS位置信息文件 */
  FileTypeGisinfo,
  /** 音频播放文件 */
  FileTypePlayAudio,
  /** 传真文件 */
  FileTypeFax,
  /** 其他类型文件 */
  FileTypeOther,
  /** 视频播放文件 */
  FileTypePlayVideo,
  /** 视频上传文件 */
  FileTypeUploadVideo,
  /** 通知公告文件 */
  FileTypeNotice
};

/**
 * 应答类型枚举
 * 定义了通话接听的方式，可以是自动接听或手动接听
 */
export enum AnswerType {
  /** 未定义应答类型 */
  AnswerTypeNone = 0,
  /** 自动应答，系统自动接听来电 */
  AnswerTypeAuto,
  /** 手动应答，需要用户手动接听来电 */
  AnswerTypeMan
};

/**
 * 发言类型枚举
 * 定义了用户在通话中的发言状态
 */
export enum SpeakType {
  /** 未定义发言类型 */
  SpeakTypeNone = 0,
  /** 静音状态，禁止发言 */
  SpeakTypeMute,
  /** 取消静音，允许发言 */
  SpeakTypeUnmute
};

/**
 * 收听类型枚举
 * 定义了用户在通话中的收听状态
 */
export enum HearType {
  /** 未定义收听类型 */
  HearTypeNone = 0,
  /** 静音状态，禁止收听 */
  HearTypeMute,
  /** 取消静音，允许收听 */
  HearTypeUnmute
};

/**
 * 视频推送类型枚举
 * 定义了视频流的推送状态
 */
export enum PushVideoType {
  /** 未定义推送类型 */
  PushVideoTypeNone = 0,
  /** 推送状态，正在推送视频流 */
  PushVideoTypePush,
  /** 停止推送状态，已停止视频流推送 */
  PushVideoTypeUnpush
};

/**
 * 通话操作类型枚举
 * 定义了对通话可以进行的各种操作类型
 */
export enum CallOpType {
  /** 未定义操作类型 */
  CallOpTypeNone,
  /** 强插操作，强制接入他人通话 */
  CallOpTypeInterpose,
  /** 监听操作，监听他人通话 */
  CallOpTypeMonitor,
  /** 移除操作，将用户从通话中移除 */
  CallOpTypeRemove,
  /** 移除其他操作，将其他用户从通话中移除 */
  CallOpTypeRemoveOther
};

/**
 * 错误码枚举
 * 定义了系统中可能出现的各种错误状态，包括注册错误、呼叫错误、操作错误等
 */
export enum ECode {
  /** 无错误 */
  ECodeNone = 0,
  /** 用户被踢出 */
  ECodeRegisterKickout = 1000,
  /** 注册超时 */
  ECodeRegisterTimeout = 1001,
  /** 未注册 */
  ECodeRegisterNotRegister = 1002,
  /** 连接断开 */
  ECodeRegisterDisConnect = 1003,
  /** 用户已登录 */
  ECodeRegisterUserIsLogin = 1004,
  /** 密码错误 */
  ECodeRegisterErrorPwd = 1005,
  /** 夜间无DTP */
  ECodeNightNotDTP = 1006,
  /** 许可证错误 */
  ECodeRegisterErrorLicense = 1007,
  /** 参数错误 */
  ECodeErrParameter = 1008,
  /** 未找到接收者 */
  ECodeNotFindReceiver = 1009,
  /** 未找到发送者 */
  ECodeNotFindSender = 1010,
  /** 无可用端口 */
  EcodeNotFindPortToUse = 1011,
  /** 套接字事件错误 */
  EcodeDoEventSockect = 1012,
  /** 时间错误 */
  ECodeRegisterErrorTime = 1013,
  /** 密码校验失败 */
  ECodeRegisterCheckPwd = 1014,
  /** 主叫方错误 */
  ECodeCallingCaller = 1100,
  /** 被叫方错误 */
  ECodeCallingCallee = 1101,
  /** 呼叫类型错误 */
  ECodeCallingType = 1102,
  /** 会话未找到 */
  ECodeCallingSessionNotFound = 1103,
  /** 终端未找到 */
  ECodeCallingTerminalNotFound = 1104,
  /** 号码未注册 */
  ECodeCallingNumberNotRegistered = 1105,
  /** 用户不存在 */
  ECodeCallingUserNotExist = 1106,
  /** 无权限 */
  ECodeCallingNoAuth = 1107,
  /** 操作失败 */
  ECodeCallingOprFailed = 1108,
  /** 用户不在组内 */
  ECodeCallingUserNotInGroup = 1109,
  /** 组未找到 */
  ECodeCallingGroupNotFound = 1110,
  /** 呼叫类型错误 */
  ECodeCallingCallTypeError = 1111,
  /** 会话创建失败 */
  ECodeCallingSessionCreateFailed = 1112,
  /** 传真操作失败 */
  ECodeOpFaxFailured = 1113,
  /** 文件未找到 */
  ECodeFileNotFound = 1114,
  /** 无通话ID */
  ECodeNoCid = 1115,
  /** 号码忙 */
  ECodeNumberBusy = 1116,
  /** 呼叫操作失败 */
  ECodeCallingOperateFailed = 1117,
  /** 无合适的呼叫 */
  ECodeCallingNotHaveFitCall = 1118,
  /** 非DTP用户 */
  ECodeNotDTPUser = 1119,
  /** 会话状态错误 */
  ECodeSessionStateError = 1120,
  /** 无法呼叫对讲组 */
  ECodeCanNotCallIntercomGroup = 1121,
  /** 呼叫操作未连接 */
  ECodeCallingOperateNotConn = 1122,
  /** 发送视频失败 */
  ECodeSendVideoFaild = 1123,
  /** 未找到成员ID */
  ECodeNotFindMemberID = 1124,
  /** 控制台绑定错误 */
  ECodeConsoleBind = 1200,
  /** 许可证错误 */
  ECodeErrLicense = 1201,
  /** 无法使用 */
  ECodeErrCanNotUse = 1202,
  /** 控制台绑定类型错误 */
  ECodeConsoleBindErrorType = 1203,
  /** 控制台首次注册 */
  ECodeConsoleBindFristRegist = 1204,
  /** 非MCU会话 */
  ECodeNotMCUSession = 1300,
  /** 已绑定 */
  ECodeIsBinded = 1301,
  /** 消息组已存在 */
  ECodeMsgGroupExist = 1400,
  /** 消息组不存在 */
  ECodeMsgGroupNotExist = 1401,
  /** 视频监控被叫为语音用户 */
  ECodeVideoBugCalledIsVoice = 1500,
  /** 未找到计划 */
  ECodeNotFindPlan = 1600,
  /** 播放文件已添加 */
  ECodePalyFileAdded = 1700,
  /** JSON解析错误 */
  ECodeJsonError = 1800,
  /** 组已存在 */
  ECodeGroupExist = 1900,
  /** 组不存在 */
  ECodeGroupNotExist = 1901,
  /** 申请通话失败 */
  ECodeApplyTalkFailed = 2000
}