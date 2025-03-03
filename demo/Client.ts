/* eslint-disable no-console */
/**
 * SIP.js 客户端实现
 * 该模块提供了SIP通信的客户端功能，包括呼叫、消息、会议等功能
 *
 * 主要功能包括:
 * - SIP服务器连接和注册：处理与SIP服务器的连接、注册和认证
 * - 音视频呼叫管理：支持音频/视频通话的创建、接听、挂断等操作
 * - 会议管理：支持创建和管理多人音视频会议
 * - 消息收发：支持即时消息的发送和接收
 * - WebSocket通信：提供实时双向通信支持
 * - 媒体控制：支持音视频设备控制、静音、保持等功能
 * - 文件传输：支持文件上传和进度监控
 *
 * 技术特点:
 * - 基于SIP.js库实现标准SIP协议通信
 * - 使用WebRTC实现音视频流传输
 * - 支持HTTPS安全传输
 * - 提供完整的事件回调机制
 */
import { SimpleUser, SimpleUserDelegate, SimpleUserOptions } from "../lib/platform/web/index.js"
import { ClientDelegate } from "./ClientDelegate.js"
import { HttpDelegate } from "./HttpDelegate.js"
import { MakeCallT, FSAPIHeader, MakeCallInfo, VideoBugT, GetVideoT } from "./AllStruct.js"
import { CallType, MediaType, APIHEADER, CallState, AnswerType, SpeakType, HearType, PushVideoType, ECode } from "./AllEnum.js"
import { GetUUID, GetCallType, GetCallDirect, GetCallState } from "./util.js"
import { httpUpload, cancleUploadFile, httpGet } from "./HttpMgr.js"
import { Md5 } from "../src/core/messages/md5.js"

/**
 * 全局变量定义
 */
let webSocketServer: string // WebSocket服务器地址
let displayName: string // 显示名称
let m_serverip: string // 服务器IP
let userurl: string // 用户SIP URL
let pwd: string // 用户密码
let simpleUser: SimpleUser // SIP用户实例
let httpsserverurl: string // HTTPS服务器URL
let clientcallback: ClientDelegate // 客户端回调对象

/**
 * 会话管理相关映射表
 */
let arrMakeCalls: Map<string, MakeCallInfo> = new Map() // 存储呼叫创建请求的信息映射表
let arrSessions: Map<string, MakeCallInfo> = new Map() // 存储活动会话的信息映射表

/**
 * Web服务器配置
 */
let webport: string // Web服务端口号
let recordwebip: string // 录制服务器IP地址
let recordwebport: string // 录制服务器端口号
let ServerWebSocketPATH: string // WebSocket连接路径
let ServerWebSocket: WebSocket | undefined // WebSocket连接实例
let webjcookie: undefined | string | null // Web会话Cookie
// let recordwebcookie:undefined|string|null; // 录制服务器Cookie（未使用）
let ServerWebSocketLoginSuccess: boolean // WebSocket登录状态标志
/**
 * SimpleUser代理对象，处理SIP用户的各种事件回调
 *
 * 该对象包含以下主要回调方法：
 * - onCallCreated: 呼叫创建时的回调
 * - onCallReceived: 收到呼叫时的回调
 * - onCallAnswered: 呼叫被应答时的回调
 * - onCallHangup: 呼叫挂断时的回调
 * - onCallHold: 呼叫保持状态变化时的回调
 * - onServerConnect: 服务器连接成功时的回调
 * - onServerDisconnect: 服务器断开连接时的回调
 * - onMessageReceived: 收到消息时的回调
 */
const simpleUserDelegate: SimpleUserDelegate = {
  /**
   * 当呼叫创建时触发
   *
   * @param id - 呼叫ID，用于唯一标识一个呼叫会话
   *
   * 处理步骤：
   * 1. 记录日志
   * 2. 如果存在回调函数，通知上层应用呼叫已创建
   */
  onCallCreated: (id: string): void => {
    console.log(`[${displayName}] Call created`)
    if (clientcallback && clientcallback.onCallCreated) {
      clientcallback.onCallCreated(id, "")
    }
  },

  /**
   * 当收到呼叫时触发
   *
   * @param id - 呼叫ID，用于唯一标识一个呼叫会话
   * @param sid - 会话ID，格式为"[会话标识].[呼叫类型]"
   *
   * 处理步骤：
   * 1. 解析会话ID，提取会话标识和呼叫类型
   * 2. 查找现有会话信息
   *    - 如果存在：更新呼叫ID和类型，处理自动应答
   *    - 如果不存在：创建新会话信息
   * 3. 通知上层应用收到新呼叫
   */
  onCallReceived: (id: string, sid: string): void => {
    console.log(`[${displayName}] Call received sid:` + sid)
    if (sid) {
      // 解析会话ID
      let sidArr = sid.split('.')
      if (sidArr.length > 1) {
        // 查找现有会话
        let sessioninfo = arrSessions.get(sidArr[0])
        if (sessioninfo) {
          // 更新现有会话信息
          sessioninfo.callid = id
          sessioninfo.ctype = GetCallType(sidArr[1])
          // 处理自动应答
          if (sessioninfo.autoanswer) {
            Answerbycallid(id, sessioninfo.lvideo, sessioninfo.rvideo, sessioninfo.raudio, sessioninfo.isshowscreen)
            console.log('auto answer call')
            if (clientcallback && clientcallback.onCallCreated) {
              clientcallback.onCallCreated(sessioninfo.cid, JSON.stringify(sessioninfo))
            }
            return
          }
        } else {
          // 创建新会话信息
          const newsessioninfo: MakeCallInfo = {
            callid: id,
            cid: sidArr[0],
            autoanswer: false,
            ctype: GetCallType(sidArr[1])
          }
          arrSessions.set(sidArr[0], newsessioninfo)
          if (clientcallback && clientcallback.onCallReceived) {
            clientcallback.onCallReceived(newsessioninfo.cid, JSON.stringify(newsessioninfo))
          }
        }
      }
    } else {
      console.error(`onCallReceived sid is null callid:` + id)
    }
  },
  /**
   * 当呼叫被应答时触发
   *
   * @param id - 呼叫ID，用于唯一标识一个呼叫会话
   * @param sid - 会话ID，格式为"[会话标识].[呼叫类型]"
   *
   * 处理步骤：
   * 1. 解析会话ID，提取会话标识
   * 2. 查找对应的会话信息
   *    - 如果存在：通知上层应用呼叫已被应答
   *    - 如果不存在：记录错误信息
   */
  onCallAnswered: (id: string, sid: string): void => {
    console.log(`[${displayName}] Call answered id:` + id)
    if (sid) {
      // 解析会话ID
      let sidArr = sid.split('.')
      if (sidArr.length > 1) {
        // 查找会话信息
        let sessioninfo = arrSessions.get(sidArr[0])
        if (sessioninfo) {
          // 通知呼叫应答
          if (clientcallback && clientcallback.onCallAnswered) {
            clientcallback.onCallAnswered(sessioninfo.cid, JSON.stringify(sessioninfo))
          }
        }
        else {
          console.error(`onCallAnswered not find by sid:` + sidArr[0])
        }
      }
    }
    else {
      console.error(`onCallAnswered  sid is null callid:` + id)
    }
  },
  /**
   * 当呼叫挂断时触发
   *
   * @param id - 呼叫ID，用于唯一标识一个呼叫会话
   * @param sid - 会话ID，格式为"[会话标识].[呼叫类型]"
   *
   * 处理步骤：
   * 1. 解析会话ID，提取会话标识
   * 2. 查找对应的会话信息
   *    - 如果存在：通知上层应用呼叫已挂断
   *    - 如果不存在：记录错误信息
   */
  onCallHangup: (id: string, sid: string): void => {
    console.log(`[${displayName}] Call hangup sid:` + sid)
    // 解析会话ID
    let sidArr = sid.split('.')
    if (sidArr.length > 1) {
      // 查找会话信息
      let sessioninfo = arrSessions.get(sidArr[0])
      if (sessioninfo) {
        // 通知呼叫挂断
        console.log('auto answer call')
        if (clientcallback && clientcallback.onCallHangup) {
          clientcallback.onCallHangup(sessioninfo.cid, JSON.stringify(sessioninfo))
        }
      } else {
        console.error(`onCallHangup not find by sid:` + sidArr[0])
      }
    } else {
      console.error(`onCallHangup  sid is null callid:` + id)
    }
  },
  /**
   * 当呼叫保持状态变化时触发
   *
   * @param id - 呼叫ID，用于唯一标识一个呼叫会话
   * @param held - 保持状态
   *              - true: 呼叫被保持
   *              - false: 呼叫取消保持
   *
   * 处理步骤：
   * 1. 遍历所有会话信息
   * 2. 查找匹配呼叫ID的会话
   * 3. 通知上层应用保持状态变化
   */
  onCallHold: (id: string, held: boolean): void => {
    console.log(`[${displayName}] Call hold ${held}`)
    // 遍历查找对应会话
    for (let value of arrSessions.values()) {
      if (value.callid == id) {
        // 通知保持状态变化
        if (clientcallback && clientcallback.onCallHold) {
          clientcallback.onCallHold(value.cid, held)
        }
      }
    }
  },
  /**
   * 当服务器连接成功时触发
   */
  onServerConnect: (): void => {
    console.log(`[${displayName}] onServerConnect`)
    if (clientcallback && clientcallback.onServerConnectState) {
      clientcallback.onServerConnectState(true)
    }
  },
  /**
   * 当服务器断开连接时触发
   * @param error 错误信息
   */
  onServerDisconnect: (error?: Error): void => {
    console.error(error)
    if (clientcallback && clientcallback.onServerConnectState) {
      clientcallback.onServerConnectState(false)
    }
  },
  /**
   * 当收到消息时触发
   * @param contenttype 内容类型
   * @param message 消息内容
   */
  onMessageReceived: (contenttype: string, message: string): void => {
    if (contenttype == APIHEADER.FSMSGRESTYPE) {
      TreateMsg(message)
    }
    else {
      if (clientcallback && clientcallback.onMessageReceived) {
        clientcallback.onMessageReceived(message)
      }
    }

  }
}
/**
 * 处理接收到的消息
 * @param message 消息内容 - JSON格式字符串
 *
 * 消息处理流程：
 * 1. 解析JSON格式消息
 * 2. 根据header字段判断消息类型
 * 3. 根据不同消息类型进行相应处理：
 *    - 会话创建相关消息：处理通话、视频、文件播放等会话的创建结果
 *    - 会话状态变更消息：处理会话状态的变化，并通知上层
 *    - 系统登录信息：处理服务器配置信息的更新
 *    - WebSocket登录消息：处理WebSocket连接的登录状态
 * 4. 对于未识别的消息类型，通过onAPIReceived回调通知上层
 */
function TreateMsg(message: string) {
  window.console.log("onMessageReceived:" + message)
  let recvinfo = JSON.parse(message)
  switch (recvinfo["header"]) {
    // 会话创建相关消息处理
    case APIHEADER.API_SESSION_CREATECALLCB:
    case APIHEADER.API_SESSION_CREATEVIDEOBUGCB:
    case APIHEADER.API_SESSION_CREATEPLAYFILECALLCB:
    case APIHEADER.API_SESSION_APPLYSPEAKCB:
    case APIHEADER.API_OPERATE_TRANSFER_VIDEOCB:
      {
        // 获取消息ID并查找对应的通话信息
        const msgid = recvinfo["body"][0]["msgid"]
        let mkinfo = arrMakeCalls.get(msgid)
        if (mkinfo) {
          arrMakeCalls.delete(msgid)
          if (recvinfo["code"] == 0) {
            // 成功创建会话，更新会话信息
            let cid = recvinfo["body"][0]["cid"]
            mkinfo.cid = cid
            let sessioninfo = arrSessions.get(cid)
            console.log("check cid:" + cid)
            if (sessioninfo) {
              mkinfo.callid = sessioninfo.callid
              mkinfo.ctype = sessioninfo.ctype
              // 自动应答处理
              if (mkinfo.autoanswer) {
                if (mkinfo.callid) {
                  Answerbycallid(mkinfo.callid, mkinfo.lvideo, mkinfo.rvideo, mkinfo.raudio, mkinfo.isshowscreen)
                  console.log('auto answer call')
                }
                if (clientcallback && clientcallback.onCallCreated) {
                  clientcallback.onCallCreated(mkinfo.cid, JSON.stringify(mkinfo))
                }
              }
            }
            arrSessions.set(cid, mkinfo)
            mkinfo.othernum = recvinfo["body"][0]["sessnum"]
            console.log("arrMakeCalls size:" + arrMakeCalls.size + " arrSessions size:" + arrSessions.size)
            return
          }
          else {
            console.error(recvinfo["header"] + "receive errcode:" + recvinfo["code"])
          }
        }
        break
      }
    // 会话状态变更消息处理
    case APIHEADER.EventSessionStateChange:
      {
        let sid = recvinfo["body"][0]["cid"]
        let sessioninfo = arrSessions.get(sid)
        let nowcallstate = GetCallState(recvinfo["body"][0]["state"])
        if (!sessioninfo) {
          if (nowcallstate == CallState.CallStateRelease) {
            console.error("Release call not add")
            return
          }
          // 创建新会话信息
          const newsessioninfo: MakeCallInfo = {
            cid: sid,
            autoanswer: false
          }
          sessioninfo = newsessioninfo
          arrMakeCalls.set(sid, sessioninfo)
        }
        // 更新会话状态信息
        sessioninfo.ctype = GetCallType(recvinfo["body"][0]["type"])
        sessioninfo.othername = recvinfo["body"][0]["othername"]
        sessioninfo.othernum = recvinfo["body"][0]["othernum"]
        sessioninfo.direction = GetCallDirect(recvinfo["body"][0]["direction"])
        if (sessioninfo.state != nowcallstate) {
          sessioninfo.state = nowcallstate
          // 通知状态变更
          if (clientcallback && clientcallback.onSessionStateChange) {
            clientcallback.onSessionStateChange(sid, JSON.stringify(sessioninfo))
          }
        }
        // 释放状态处理
        if (nowcallstate == CallState.CallStateRelease) {
          arrSessions.delete(sid)
        }
        return
      }
    // 系统登录信息处理
    case APIHEADER.API_SYSTEM_LOGININFOCB:
      {
        // 处理登录服务器信息
        let useex = false
        let EXEmployeeLoginSipIP = recvinfo["body"][0]["EXEmployeeLoginSipIP"]
        if (EXEmployeeLoginSipIP != "" && EXEmployeeLoginSipIP == m_serverip) {
          useex = true
        }
        else {
          let EXEmployeeLoginICEIP = recvinfo["body"][0]["EXEmployeeLoginICEIP"]
          if (EXEmployeeLoginICEIP != "" && EXEmployeeLoginICEIP == m_serverip) {
            useex = true
          }
        }

        // 更新服务器配置信息
        if (useex) {
          webport = recvinfo["body"][0]["EXServerWebHttpsPort"]
          recordwebip = recvinfo["body"][0]["EXRecordServerWebIP"]
          recordwebport = recvinfo["body"][0]["EXRecordServerWebPort"]
          ServerWebSocketPATH = recvinfo["body"][0]["EXServerWebSocketPATH"]
        }
        if (webport == undefined || webport == "") {
          webport = recvinfo["body"][0]["ServerWebHttpsPort"]
        }
        if (recordwebip == undefined || recordwebip == "") {
          recordwebip = recvinfo["body"][0]["RecordServerWebIP"]
        }
        if (recordwebport == undefined || recordwebport == "") {
          recordwebport = recvinfo["body"][0]["RecordServerWebPort"]
        }
        if (ServerWebSocketPATH == undefined || ServerWebSocketPATH == "") {
          ServerWebSocketPATH = recvinfo["body"][0]["ServerWebSocketPATH"]
        }
        if (webport == undefined || webport == "") {
          webport = "443"
        }
        return
      }
    // WebSocket登录消息处理
    case APIHEADER.API_REG_WS_LOGINCB:
      {
        if (recvinfo["code"] == ECode.ECodeNone) {
          ServerWebSocketLoginSuccess = true
          console.debug("websocket login success")
        }
        else if (recvinfo["code"] == ECode.ECodeRegisterCheckPwd) {
          ServerWebSocketLogin(recvinfo["body"][0]["checkuuid"])
          return
        }
        break
      }
    default:
      {
        break
      }
  }
  // 其他消息通过回调处理
  if (clientcallback && clientcallback.onAPIReceived) {
    clientcallback.onAPIReceived(message)
  }
}
/**
 * 初始化SIP客户端
 *
 * @param serverip - SIP服务器IP地址，用于建立WebSocket和HTTPS连接
 * @param serverport - 服务器端口号，用于WebSocket和HTTPS服务
 * @param userid - 用户唯一标识，用于SIP注册和显示名称
 * @param userpwd - 用户密码，用于SIP认证
 *
 * 初始化步骤：
 * 1. 设置服务器连接信息
 *    - 保存服务器IP地址
 *    - 构建WebSocket连接URL
 *    - 构建HTTPS服务URL
 * 2. 设置用户信息
 *    - 设置显示名称
 *    - 构建SIP URL
 *    - 保存密码
 * 3. 配置SimpleUser选项
 *    - 设置AOR(Address of Record)
 *    - 配置媒体约束(音频和视频)
 *    - 设置用户代理选项(日志级别、显示名称、认证密码)
 * 4. 创建SimpleUser实例
 */
export function init(serverip: string, serverport: string, userid: string, userpwd: string) {
  // 保存服务器IP地址供后续使用
  m_serverip = serverip
  // 构建WebSocket连接URL
  webSocketServer = "wss://" + serverip + ":" + serverport + "/fswebrtc"
  // 构建HTTPS服务URL
  httpsserverurl = "https://" + serverip + ":" + serverport + "/fswebrtc"
  // 设置用户显示名称
  displayName = userid
  // 构建标准SIP URL
  userurl = "sip:" + displayName + "@" + serverip
  // 保存用户密码
  pwd = userpwd

  // 配置SimpleUser选项
  const simpleUserOptions: SimpleUserOptions = {
    // SIP注册地址
    aor: userurl,
    // 设置事件代理
    delegate: simpleUserDelegate,
    // 媒体配置
    media: {
      // 设置媒体约束
      constraints: {
        audio: true, // 启用音频
        video: true  // 启用视频
      },
      local: {  // 本地媒体配置
      },
      remote: { // 远程媒体配置
      }
    },
    // 用户代理配置
    userAgentOptions: {
      logLevel: "debug",           // 设置日志级别
      displayName,                // 设置显示名称
      authorizationPassword: pwd  // 设置认证密码
    }
  }

  // 创建SimpleUser实例
  simpleUser = new SimpleUser(webSocketServer, simpleUserOptions)
}
/**
 * 连接到SIP服务器
 *
 * @param callback - 客户端回调对象，用于处理连接状态变化等事件
 *
 * 连接步骤：
 * 1. 保存客户端回调对象
 * 2. 调用SimpleUser的connect方法尝试连接
 * 3. 处理连接结果
 *    - 成功：触发连接状态回调
 *    - 失败：记录错误并打开HTTPS URL
 */
export function connect(callback: ClientDelegate) {
  // 保存客户端回调对象
  clientcallback = callback

  // 尝试连接到服务器
  simpleUser.connect()
    .then(() => {
      console.log("conn success")
      // 连接成功，通知回调
      if (clientcallback && clientcallback.onServerConnectState) {
        clientcallback.onServerConnectState(true)
      }
      return true
    })
    .catch((error: Error) => {
      // 连接失败处理
      console.error(`[${simpleUser.id}] failed to connect`)
      console.error(error)
      // 打开HTTPS URL
      window.open(httpsserverurl)
      return false
    })
}
/**
 * 断开与SIP服务器的连接
 *
 * 断开步骤：
 * 1. 调用SimpleUser的disconnect方法断开连接
 * 2. 处理断开结果
 *    - 成功：通过回调通知连接状态变更为false
 *    - 失败：记录错误信息
 */
export function disconnect() {
  // 执行断开连接操作
  simpleUser
    .disconnect()
    .then(() => {
      // 断开成功，通知状态变更
      if (clientcallback && clientcallback.onServerConnectState) {
        clientcallback.onServerConnectState(false)
      }
    })
    .catch((error: Error) => {
      // 断开失败，记录错误
      console.error(`[${simpleUser.id}] failed to disconnect`)
      console.error(error)
    })
}
/**
 * 注册到SIP服务器
 *
 * @param timeexp - 注册超时时间(秒)
 *                - 取值范围：1-600
 *                - 默认值：60
 *                - 超出范围时使用默认值
 *
 * 注册步骤：
 * 1. 验证并设置超时时间
 * 2. 创建注册选项对象
 * 3. 调用SimpleUser的register方法进行注册
 * 4. 处理注册结果
 *    - 成功：通知注册状态变更为true
 *    - 失败：记录错误并通知注册状态变更为false
 *
 * 注册失败处理：
 * - 记录拒绝原因
 * - 通知注册状态变更
 * - 输出错误日志
 */
export function Register(timeexp: number | undefined) {
  // 验证超时时间范围
  if (timeexp == undefined || timeexp <= 1 || timeexp >= 600) {
    timeexp = 60  // 使用默认值
  }

  // 创建注册选项
  let operate = { expires: timeexp }

  // 执行注册操作
  simpleUser.register(operate, {
    // An example of how to get access to a SIP response message for custom handling
    requestDelegate: {
      // 注册被拒绝的处理
      onReject: (response) => {
        console.warn(`[${simpleUser.id}] REGISTER rejected`)
        let message = `Registration of "${simpleUser.id}" rejected.\n`
        message += `Reason: ${response.message.reasonPhrase}\n`
        console.log(message)
        // 通知注册失败
        if (clientcallback && clientcallback.onRegisteredState) {
          clientcallback.onRegisteredState(false)
        }
      }
    }
  })
    .then(() => {
      // 注册成功处理
      console.log("register success")
      if (clientcallback && clientcallback.onRegisteredState) {
        clientcallback.onRegisteredState(true)
      }
    })
    .catch((error: Error) => {
      // 注册异常处理
      console.error(`[${simpleUser.id}] failed to register`)
      console.error(error)
      if (clientcallback && clientcallback.onRegisteredState) {
        clientcallback.onRegisteredState(false)
      }
    })
}
/**
 * 注销SIP用户
 *
 * 注销步骤：
 * 1. 调用SimpleUser的unregister方法执行注销
 * 2. 处理注销结果
 *    - 成功：通知注册状态变更为false
 *    - 失败：记录错误信息
 */
export function UnRegister() {
  // 执行注销操作
  simpleUser
    .unregister()
    .then(() => {
      // 注销成功，通知状态变更
      if (clientcallback && clientcallback.onRegisteredState) {
        clientcallback.onRegisteredState(false)
      }
    })
    .catch((error: Error) => {
      // 注销失败，记录错误
      console.error(`[${simpleUser.id}] failed to unregister`)
      console.error(error)
    })
}
/**
 * 连接WebSocket服务器
 *
 * 连接步骤：
 * 1. 验证WebSocket路径是否有效
 * 2. 构建WebSocket连接URL
 * 3. 断开现有连接(如果存在)
 * 4. 创建新的WebSocket连接
 * 5. 配置WebSocket选项
 *    - 设置二进制数据类型
 *    - 注册事件监听器(关闭、错误、打开、消息)
 */
export function ConnWebSocket() {
  if (ServerWebSocketPATH == undefined || ServerWebSocketPATH == "") {
    console.error(`[${simpleUser.id}] websocketpath is null`)
    return
  }
  let url = ServerWebSocketPATH + "/websocketapi"
  console.debug(`websocketpath:` + ServerWebSocketPATH)
  DisConnWebSocket()
  ServerWebSocket = new WebSocket(url)
  ServerWebSocket.binaryType = "arraybuffer" // set data type of received binary messages
  ServerWebSocket.addEventListener("close", (ev: CloseEvent) => onWebSocketClose(ev))
  ServerWebSocket.addEventListener("error", (ev: Event) => onWebSocketError(ev))
  ServerWebSocket.addEventListener("open", (ev: Event) => onWebSocketOpen(ev))
  ServerWebSocket.addEventListener("message", (ev: MessageEvent) => onWebSocketMessage(ev))
}
/**
 * 断开WebSocket连接
 *
 * 断开步骤：
 * 1. 检查WebSocket连接是否存在
 * 2. 执行WebSocket注销
 * 3. 关闭WebSocket连接
 * 4. 清除WebSocket实例
 */
export function DisConnWebSocket() {
  if (ServerWebSocket != undefined) {
    ServerWebSocketLogout()
    ServerWebSocket.close()
    ServerWebSocket = undefined
  }
}
/**
 * WebSocket关闭事件处理
 *
 * @param ev - 关闭事件对象，包含关闭状态码和原因
 *
 * 处理步骤：
 * 1. 记录关闭事件信息(包含状态码)
 * 2. 清除WebSocket实例
 */
function onWebSocketClose(ev: CloseEvent): void {
  const message = `WebSocket closed  (code: ${ev.code})`
  console.error(message)
  // We are about to transition to disconnected, so clear our web socket
  ServerWebSocket = undefined
}
/**
 * WebSocket错误事件处理
 *
 * @param ev - 错误事件对象
 *
 * 处理步骤：
 * 1. 记录错误事件信息
 */
function onWebSocketError(ev: Event): void {
  console.error("WebSocket error occurred.", ev)
}

/**
 * WebSocket消息接收处理
 *
 * @param ev - 消息事件对象，包含接收到的数据
 *
 * 处理步骤：
 * 1. 获取消息数据
 * 2. 验证消息有效性
 *    - 检查是否为空消息
 *    - 检查是否为无效格式
 * 3. 处理二进制消息
 *    - 将二进制数据转换为字符串
 * 4. 处理文本消息
 * 5. 调用消息处理函数
 */
function onWebSocketMessage(ev: MessageEvent): void {
  const data = ev.data
  let finishedData: string
  if (/^(\r\n)+$/.test(data)) {
    console.error("error msg")
    return
  }
  if (!data) {
    console.error("Received empty message, discarding...")
    return
  }

  if (typeof data !== "string") {
    // WebSocket binary message.
    try {
      finishedData = new TextDecoder().decode(new Uint8Array(data))
    } catch (err) {
      console.error((err as Error).toString())
      console.error("Received WebSocket binary message failed to be converted into string, message discarded")
      return
    }
  } else {
    // WebSocket text message.
    finishedData = data
  }
  TreateMsg(finishedData)
}
/**
 * WebSocket打开事件处理
 *
 * @param ev - 打开事件对象
 *
 * 处理步骤：
 * 1. 记录连接成功信息
 * 2. 执行WebSocket登录
 */
function onWebSocketOpen(ev: Event): void {
  console.log("WebSocket opened", ev)
  ServerWebSocketLogin("")
}
/**
 * WebSocket登录处理
 *
 * @param checkuuid - 校验UUID，用于密码加密
 *
 * 处理步骤：
 * 1. 构建登录信息
 *    - 设置用户名
 *    - 根据校验UUID生成加密密码
 * 2. 创建登录消息头
 * 3. 发送登录请求
 */
function ServerWebSocketLogin(checkuuid: string) {
  const info = {
    username: displayName,
    password: ""
  }
  if (checkuuid != "") {
    console.log("ServerWebSocket checkuuid:" + checkuuid)
    info.password = Md5.hashStr(pwd + checkuuid)
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_REG_WS_LOGIN,
    body: info
  }
  if (ServerWebSocket != undefined) {
    console.log("ServerWebSocket send:" + JSON.stringify(header))
    ServerWebSocket.send(JSON.stringify(header))
  }
  else {
    console.error("serverwebsocket is null")
  }
}
/**
 * WebSocket注销处理
 *
 * 处理步骤：
 * 1. 构建注销信息
 *    - 设置用户名
 * 2. 创建注销消息头
 * 3. 发送注销请求
 */
function ServerWebSocketLogout() {
  const info = {
    username: displayName
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_REG_WS_LOGOUT,
    body: info
  }
  SendAPI(JSON.stringify(header))
}
/**
 * 获取员工登录信息
 *
 * 处理步骤：
 * 1. 创建获取登录信息的消息头
 * 2. 发送获取登录信息请求
 */
export function GetEmployeeLoginInfo() {
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SYSTEM_LOGININFO
  }
  SendAPI(JSON.stringify(header))
}
export function MakeCallold(number: string, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement) {
  let callurl = "sip:" + number + "@" + m_serverip
  let videocall = false
  if (remotevideo) {
    videocall = true
  }
  simpleUser.call(callurl, {
    inviteWithoutSdp: false,
    sessionDescriptionHandlerOptions: {
      constraints: { // This demo is making "video only" calls
        audio: true,
        video: videocall
      },
      local: {
        //video:localvideo
      },
      remote: {
        audio: remoteaudio,
        video: remotevideo
      },
      videoRecvonly: true
    }
  })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to place call`)
      console.error(error)
      alert("Failed to place call.\n" + error)
    })
}
/**
 * 挂断指定会话
 *
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 执行挂断操作
 * 4. 处理可能的错误
 */
export function Hangup(sid: string,) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.hangup(sessioninfo.callid).catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to hangup call`)
      console.error(error)
      alert("Failed to hangup call.\n" + error)
    })
  }
  else {
    console.error("Hangup find callid error sid:" + sid)
  }
}
/**
 * 应答指定会话
 *
 * @param sid - 会话ID
 * @param localvideo - 本地视频元素(可选)
 * @param remotevideo - 远程视频元素(可选)
 * @param remoteaudio - 远程音频元素(可选)
 * @param isshowscreen - 是否显示屏幕共享(可选)
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 调用应答处理函数
 */
export function Answer(sid: string, localvideo?: HTMLVideoElement, remotevideo?: HTMLVideoElement, remoteaudio?: HTMLAudioElement, isshowscreen?: boolean) {
  console.log("Answer now call")
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    Answerbycallid(sessioninfo.callid, localvideo, remotevideo, remoteaudio, isshowscreen)
  }
  else {
    console.error("Answer find callid error sid:" + sid)
  }
}
/**
 * 根据呼叫ID应答呼叫
 *
 * @param callid - 呼叫ID
 * @param localvideo - 本地视频元素(可选)
 * @param remotevideo - 远程视频元素(可选)
 * @param remoteaudio - 远程音频元素(可选)
 * @param isshowscreen - 是否显示屏幕共享(可选)
 *
 * 处理步骤：
 * 1. 判断是否为视频呼叫
 * 2. 配置会话描述选项
 *    - 设置音视频约束
 *    - 配置本地和远程媒体元素
 * 3. 执行应答操作
 * 4. 处理可能的错误
 */
export function Answerbycallid(callid: string, localvideo?: HTMLVideoElement, remotevideo?: HTMLVideoElement, remoteaudio?: HTMLAudioElement, isshowscreen?: boolean) {
  let videocall = false
  if (remotevideo) {
    videocall = true
  }
  simpleUser.answer(callid, {
    sessionDescriptionHandlerOptions: {
      constraints: { // This demo is making "video only" calls
        audio: true,
        video: videocall
      },
      local: {
        video: localvideo
      },
      remote: {
        audio: remoteaudio,
        video: remotevideo
      },
      isshowscreen: isshowscreen
    }
  })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to answer call`)
      console.error(error)
      alert("Failed to answer call.\n" + error)
    })
}
/**
 * 发送DTMF信号
 *
 * @param tone - DTMF音调字符串
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 发送DTMF信号
 */
export function SendDTMF(tone: string, sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.sendDTMF(tone, sessioninfo.callid)
  }
  else {
    console.error("SendDTMF find callid error sid:" + sid)
  }
}
/**
 * 保持指定会话
 *
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 执行保持操作
 */
export function Hold(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.hold(sessioninfo.callid)
  }
  else {
    console.error("Hold find callid error sid:" + sid)
  }
}
/**
 * 取消保持指定会话
 *
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 执行取消保持操作
 */
export function UnHold(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.unhold(sessioninfo.callid)
  }
  else {
    console.error("UnHold find callid error sid:" + sid)
  }
}
/**
 * 静音指定会话
 *
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 执行静音操作
 */
export function Mute(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.mute(sessioninfo.callid)
  }
  else {
    console.error("Mute find callid error sid:" + sid)
  }
}
/**
 * 取消静音指定会话
 *
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 执行取消静音操作
 */
export function UnMute(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.unmute(sessioninfo.callid)
  }
  else {
    console.error("unmute find callid error sid:" + sid)
  }
}
/**
 * 检查指定会话是否处于静音状态
 *
 * @param sid - 会话ID
 * @returns 是否静音
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证会话是否存在且有效
 * 3. 检查静音状态
 */
export function IsMuted(sid: string): boolean {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.isMuted(sessioninfo.callid)
  }
  else {
    console.error("IsMuted find callid error sid:" + sid)
  }
  return false
}
/**
 * 从视频会话中截取照片
 *
 * @param sid - 会话ID
 * @param pathname - 保存的文件路径
 * @returns 是否截图成功
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证远程视频元素是否存在
 * 3. 创建Canvas并设置尺寸
 * 4. 将视频帧绘制到Canvas
 * 5. 将Canvas内容转换为图片
 * 6. 创建下载链接并保存
 */
export function TakePhoto(sid: string, pathname: string): boolean {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo) {
    if (sessioninfo.rvideo) {
      let canvas = document.createElement("canvas")
      canvas.width = sessioninfo.rvideo.videoWidth
      canvas.height = sessioninfo.rvideo.videoHeight
      let dd = canvas.getContext("2d")
      if (dd) {
        dd.drawImage(sessioninfo.rvideo, 0, 0,
          sessioninfo.rvideo.videoWidth, sessioninfo.rvideo.videoHeight, 0, 0, canvas.width, canvas.height
        )
      }
      let imgData = canvas.toDataURL("image/png")
      let link = document.createElement("a")
      let blob = dataURLtoBlob(imgData)
      if (blob) {
        let objurl = URL.createObjectURL(blob)
        link.download = pathname
        link.href = objurl
        link.click()
      }
    }
  }
  else {
    console.error("TakePhoto find callid error sid:" + sid)
  }
  return false
}
/**
 * 开始录制视频会话
 *
 * @param sid - 会话ID
 * @param pathname - 保存的文件路径
 * @returns 是否开始录制成功
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证远程视频元素是否存在
 * 3. 获取远程媒体流
 * 4. 创建MediaRecorder实例
 * 5. 配置数据可用事件处理
 *    - 创建数据缓冲区
 *    - 生成视频Blob
 *    - 创建下载链接并保存
 * 6. 开始录制
 */
export function MediaRecordStart(sid: string, pathname: string): boolean {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo) {
    if (sessioninfo.rvideo) {
      let medstream = simpleUser.getremoteMediaStreambycallid(sessioninfo.callid)
      try {
        if (medstream) {
          sessioninfo.mediaRecorder = new MediaRecorder(medstream)
          sessioninfo.mediaRecorder.ondataavailable = (ev) => {
            if (ev && ev.data && ev.data.size > 0) {
              let dataBuffer = []
              dataBuffer.push(ev.data)
              let blob = new Blob(dataBuffer, { type: 'video/webm' })
              let url = window.URL.createObjectURL(blob)
              let a = document.createElement('a')
              a.href = url
              a.style.display = 'none'
              a.download = pathname
              a.click()
            }
          }
          //sessioninfo.mediaRecorder.start(timeslice);
          sessioninfo.mediaRecorder.start()
        }
        else {
          console.error('medstream is null!')
        }
      } catch (err) {
        console.error('Fail to new MediaRecorder!')
        return false
      }
    }
  }
  else {
    console.error("MediaRecordStart find callid error sid:" + sid)
  }
  return false
}
/**
 * 停止录制视频会话
 *
 * @param sid - 会话ID
 * @returns 是否停止录制成功
 *
 * 处理步骤：
 * 1. 查找会话信息
 * 2. 验证MediaRecorder是否存在
 * 3. 停止录制
 * 4. 清除MediaRecorder实例
 */
export function MediaRecordStop(sid: string): boolean {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo) {
    if (sessioninfo.mediaRecorder) {
      sessioninfo.mediaRecorder.stop()
      sessioninfo.mediaRecorder = undefined
    }
  }
  else {
    console.error("MediaRecordStop find callid error sid:" + sid)
  }
  return false
}


/**
 * 将Data URL转换为Blob对象
 *
 * @param dataurl - Data URL字符串
 * @returns Blob对象或undefined
 *
 * 处理步骤：
 * 1. 解析Data URL
 * 2. 提取MIME类型
 * 3. 解码Base64数据
 * 4. 创建Uint8Array存储二进制数据
 * 5. 返回Blob对象
 */
export function dataURLtoBlob(dataurl: string) {
  let arr = dataurl.split(',')
  let arr0 = arr[0].match(/:(.*?);/)
  if (arr0 != null) {
    let mime = arr0[1],
      bstr = atob(arr[1]),
      // 获取解码后的二进制数据的长度，用于后面创建二进制数据容器
      n = bstr.length,
      // 创建一个Uint8Array类型的数组以存放二进制数据
      u8arr = new Uint8Array(n)
      // 将二进制数据存入Uint8Array类型的数组中
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }
}
/**
 * 发送API消息
 *
 * @param msg - 要发送的消息内容
 *
 * 处理步骤：
 * 1. 检查WebSocket连接状态
 * 2. 如果WebSocket可用，通过WebSocket发送消息
 * 3. 如果WebSocket不可用，通过SIP消息发送
 */
export function SendAPI(msg: string): void {
  if (ServerWebSocket != undefined && ServerWebSocketLoginSuccess) {
    console.log("ServerWebSocket send:" + msg)
    ServerWebSocket.send(msg)
  }
  else {
    simpleUser.messageType("sip:api@" + m_serverip, msg, APIHEADER.FSMSGTYPE)
  }
}
/**
 * 发起呼叫
 *
 * @param called - 被叫号码
 * @param videotype - 媒体类型
 * @param localvideo - 本地视频元素
 * @param remotevideo - 远程视频元素
 * @param remoteaudio - 远程音频元素
 * @param isshowscreen - 是否显示屏幕共享
 *
 * 处理步骤：
 * 1. 构建呼叫信息
 * 2. 创建API消息头
 * 3. 保存呼叫信息
 * 4. 发送呼叫请求
 */
export function MakeCall(called: string, videotype: MediaType, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean): void {
  const info: MakeCallT = {
    caller: displayName,
    ctype: CallType.CallTypeSingle2,
    members: called,
    isVideo: videotype
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_CREATECALL,
    body: info
  }
  const callinfo: MakeCallInfo = {
    msgid: header.msgid,
    mkinfo: info,
    mktime: new Date(),
    lvideo: localvideo,
    rvideo: remotevideo,
    autoanswer: true,
    raudio: remoteaudio,
    isshowscreen: isshowscreen
  }
  arrMakeCalls.set(header.msgid, callinfo)
  SendAPI(JSON.stringify(header))
}
/**
 * 创建视频监控
 *
 * @param called - 被监控号码
 * @param codec - 编解码器
 * @param localvideo - 本地视频元素
 * @param remotevideo - 远程视频元素
 * @param remoteaudio - 远程音频元素
 *
 * 处理步骤：
 * 1. 构建监控信息
 * 2. 创建API消息头
 * 3. 保存监控信息
 * 4. 发送监控请求
 */
export function VideoBug(called: string, codec: string, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement): void {
  const info: VideoBugT = {
    caller: displayName,
    called: called,
    codec: "*7*101"
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_CREATEVIDEOBUG,
    body: info
  }
  const mkinfo: MakeCallInfo = {
    msgid: header.msgid,
    mktime: new Date(),
    lvideo: localvideo,
    rvideo: remotevideo,
    raudio: remoteaudio,
    autoanswer: true,
    isshowscreen: false
  }
  arrMakeCalls.set(header.msgid, mkinfo)
  SendAPI(JSON.stringify(header))
}

/**
 * 创建会议
 *
 * @param called - 与会成员
 * @param confnum - 会议号码
 * @param confname - 会议名称
 * @param videotype - 媒体类型
 * @param localvideo - 本地视频元素
 * @param remotevideo - 远程视频元素
 * @param remoteaudio - 远程音频元素
 * @param isshowscreen - 是否显示屏幕共享
 *
 * 处理步骤：
 * 1. 构建会议信息
 * 2. 创建API消息头
 * 3. 保存会议信息
 * 4. 发送创建会议请求
 */
export function CreateConf(called: string, confnum: string, confname: string, videotype: MediaType, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean): void {
  const info: MakeCallT = {
    caller: displayName,
    ctype: CallType.CallTypeTemporary,
    members: called,
    isVideo: videotype,
    sessnum: confnum,
    sessname: confname
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_CREATECALL,
    body: info
  }
  const confkinfo: MakeCallInfo = {
    msgid: header.msgid,
    mkinfo: info,
    mktime: new Date(),
    lvideo: localvideo,
    rvideo: remotevideo,
    autoanswer: true,
    raudio: remoteaudio,
    isshowscreen: isshowscreen
  }
  arrMakeCalls.set(header.msgid, confkinfo)
  SendAPI(JSON.stringify(header))
}
export function CreatePlayFileBroadcast(called: string, confnum: string, confname: string, videotype: MediaType, fileid: string, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean): void {
  CreatePlayFileCall(called, confnum, confname, videotype, fileid, CallType.CallTypeBroadcast, localvideo, remotevideo, remoteaudio, isshowscreen)
}
export function CreatePlayFileConf(called: string, confnum: string, confname: string, videotype: MediaType, fileid: string, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean): void {
  CreatePlayFileCall(called, confnum, confname, videotype, fileid, CallType.CallTypeTemporary, localvideo, remotevideo, remoteaudio, isshowscreen)
}
export function CreatePlayFileCall(called: string, confnum: string, confname: string, videotype: MediaType, fileid: string, calltype: CallType, localvideo: HTMLVideoElement, remotevideo: HTMLVideoElement, remoteaudio: HTMLAudioElement, isshowscreen: boolean): void {
  const info: MakeCallT = {
    caller: displayName,
    ctype: calltype,
    members: called,
    isVideo: videotype,
    sessnum: confnum,
    sessname: confname,
    FileID: fileid
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_CREATEPLAYFILECALL,
    body: info
  }
  const confkinfo: MakeCallInfo = {
    msgid: header.msgid,
    mkinfo: info,
    mktime: new Date(),
    lvideo: localvideo,
    rvideo: remotevideo,
    autoanswer: true,
    raudio: remoteaudio,
    isshowscreen: isshowscreen
  }
  arrMakeCalls.set(header.msgid, confkinfo)
  SendAPI(JSON.stringify(header))
}
export function SetGetCallMemberVideo(cid: string, srcmember: string, sessionnum: string, sessionname: string, strcalleds: string, remotevideo: HTMLVideoElement): void {

  const info: GetVideoT = {
    srccid: cid,
    srcnumber: srcmember,
    sessnum: sessionnum,
    sessname: sessionname,
    calleds: strcalleds
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_TRANSFER_VIDEO,
    body: info
  }
  const confkinfo: MakeCallInfo = {
    msgid: header.msgid,
    getvinfo: info,
    mktime: new Date(),
    rvideo: remotevideo,
    autoanswer: true,
    isshowscreen: false
  }
  arrMakeCalls.set(header.msgid, confkinfo)
  SendAPI(JSON.stringify(header))
}
/**
 *
 * @param sid 呼叫ID
 * @param FileID 文件ID
 * @param playnum 播放次数
 */
/**
 * 播放文件
 *
 * @param sid - 会话ID
 * @param fileid - 文件ID
 * @param playnum - 播放次数
 *
 * 处理步骤：
 * 1. 构建播放信息
 *    - 设置会话ID
 *    - 设置文件ID
 *    - 设置播放次数
 *    - 设置立即播放标志
 * 2. 创建API消息头
 * 3. 发送播放请求
 */
export function PlayFile(sid: string, fileid: string, playnum: number): void {
  const info = {
    cid: sid,
    FileID: fileid,
    RePlayNum: "\"" + playnum + "\"",
    playnow: "1"
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_PLAYFILE,
    body: info
  }
  SendAPI(JSON.stringify(header))
}
/**
 * 停止播放文件
 *
 * @param sid - 会话ID
 * @param fileid - 文件ID
 *
 * 处理步骤：
 * 1. 构建停止播放信息
 * 2. 创建API消息头
 * 3. 发送停止播放请求
 */
export function PlayFileStop(sid: string, fileid: string): void {
  const info = {
    cid: sid,
    FileID: fileid
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_PLAYFILESTOP,
    body: info
  }
  SendAPI(JSON.stringify(header))
}
/**
 * 添加会议成员
 *
 * @param sid - 会话ID
 * @param addnum - 要添加的成员号码
 *
 * 处理步骤：
 * 1. 构建添加成员信息
 *    - 设置会话ID
 *    - 设置应答类型
 *    - 设置成员号码
 *    - 设置发言类型
 * 2. 创建API消息头
 * 3. 发送添加成员请求
 */
export function AddMember(sid: string, addnum: string): void {
  const info = {
    cid: sid,
    astype: AnswerType.AnswerTypeMan,
    number: addnum,
    speakertype: SpeakType.SpeakTypeUnmute
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_MEMBERADD,
    body: info
  }
  SendAPI(JSON.stringify(header))
}
/**
 * 删除会议成员
 *
 * @param sid - 会话ID
 * @param delnum - 要删除的成员号码
 *
 * 处理步骤：
 * 1. 构建删除成员信息
 * 2. 创建API消息头
 * 3. 发送删除成员请求
 */
export function DelMember(sid: string, delnum: string): void {
  const info = {
    cid: sid,
    number: delnum
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_MEMBERDEL,
    body: info
  }
  SendAPI(JSON.stringify(header))
}
/**
 * 设置成员发言类型
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 * @param stype - 发言类型
 *
 * 处理步骤：
 * 1. 构建发言类型设置信息
 * 2. 创建API消息头
 * 3. 发送设置请求
 */
export function SetMemberSpeakType(sid: string, number: string, stype: SpeakType): void {
  const info = {
    cid: sid,
    number: number,
    stype: stype
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_MEMBER_SPEAK,
    body: info
  }
  SendAPI(JSON.stringify(header))
}
/**
 * 禁止成员发言
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 */
export function SetMemberUnSpeak(sid: string, number: string): void {
  SetMemberSpeakType(sid, number, SpeakType.SpeakTypeMute)
}
/**
 * 允许成员发言
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 */
export function SetMemberSpeak(sid: string, number: string): void {
  SetMemberSpeakType(sid, number, SpeakType.SpeakTypeUnmute)
}
/**
 * 设置成员听讲类型
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 * @param htype - 听讲类型
 *
 * 处理步骤：
 * 1. 构建听讲类型设置信息
 * 2. 创建API消息头
 * 3. 发送设置请求
 */
export function SetMemberHearType(sid: string, number: string, htype: HearType): void {
  const info = {
    cid: sid,
    number: number,
    htype: htype
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_MEMBER_HEAR,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 禁止成员听讲
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 */
export function SetMemberUnHear(sid: string, number: string): void {
  SetMemberHearType(sid, number, HearType.HearTypeMute)
}

/**
 * 允许成员听讲
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 */
export function SetMemberHear(sid: string, number: string): void {
  SetMemberHearType(sid, number, HearType.HearTypeUnmute)
}

/**
 * 设置成员视频推送类型
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 * @param ptype - 推送类型
 *
 * 处理步骤：
 * 1. 构建视频推送类型设置信息
 * 2. 创建API消息头
 * 3. 发送设置请求
 */
export function SetMemberPushType(sid: string, number: string, ptype: PushVideoType): void {
  const info = {
    cid: sid,
    number: number,
    ptype: ptype
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_MEMBER_PUSH,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 开启成员视频推送
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 */
export function SetMemberPush(sid: string, number: string): void {
  SetMemberPushType(sid, number, PushVideoType.PushVideoTypePush)
}

/**
 * 关闭成员视频推送
 *
 * @param sid - 会话ID
 * @param number - 成员号码
 */
export function SetMemberUnPush(sid: string, number: string): void {
  SetMemberPushType(sid, number, PushVideoType.PushVideoTypeUnpush)
}

/**
 * 强制结束会议
 *
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 构建结束会议信息
 * 2. 创建API消息头
 * 3. 发送结束会议请求
 */
export function FoceEndConf(sid: string): void {
  const info = {
    cid: sid
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_FORCEEND_CALL,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 强制操作呼叫
 *
 * @param optype - 操作类型
 * @param opnumber - 操作号码
 * @param opcid - 操作会话ID
 * @param localnumber - 本地号码
 *
 * 处理步骤：
 * 1. 构建呼叫操作信息
 *    - 设置操作类型
 *    - 设置主叫号码
 *    - 设置被叫号码
 *    - 设置会话ID
 *    - 设置接收者
 * 2. 创建API消息头
 * 3. 发送操作请求
 */
export function froceOPCall(optype: number, opnumber: string, opcid: string, localnumber: string): void {
  const info = {
    CallOpType: optype,
    caller: localnumber,
    called: opnumber,
    cid: opcid,
    receiver: displayName
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_OPERATE_CALL,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 获取会议所有成员信息
 *
 * @param sid - 会话ID
 *
 * 处理步骤：
 * 1. 构建获取成员信息请求
 * 2. 创建API消息头
 * 3. 发送获取请求
 */
/**
 * 获取会话中的所有成员信息
 * @param sid 会话ID
 */
export function GetCallAllMembers(sid: string): void {
  const info = {
    cid: sid
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_GETALLMEMBERS,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 根据类型申请对讲权限
 * @param groupnum 对讲组号
 * @param optype 操作类型（55:申请发言，56:释放发言）
 * @param remoteaudio 远端音频元素
 */
export function ApplySpeakByType(groupnum: string, optype: number, remoteaudio: HTMLAudioElement): void {
  const info: MakeCallT = {
    caller: displayName,
    ctype: CallType.CallTypeIntercom,
    members: groupnum,
    isVideo: MediaType.MediaTypeAudio,
    optype: optype
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_APPLYSPEAK,
    body: info
  }
  const confkinfo: MakeCallInfo = {
    msgid: header.msgid,
    mkinfo: info,
    mktime: new Date(),
    autoanswer: true,
    raudio: remoteaudio,
    isshowscreen: false
  }
  arrMakeCalls.set(header.msgid, confkinfo)
  SendAPI(JSON.stringify(header))
}

/**
 * 申请对讲发言权限
 * @param groupnum 对讲组号
 * @param remoteaudio 远端音频元素
 */
export function ApplySpeak(groupnum: string, remoteaudio: HTMLAudioElement): void {
  ApplySpeakByType(groupnum, 55, remoteaudio)
}

/**
 * 释放对讲发言权限
 * @param groupnum 对讲组号
 * @param remoteaudio 远端音频元素
 */
export function ReleaseSpeak(groupnum: string, remoteaudio: HTMLAudioElement): void {
  ApplySpeakByType(groupnum, 56, remoteaudio)
}

/**
 * 创建临时对讲会话
 * @param called 被叫成员
 * @param confnum 会议号
 * @param confname 会议名称
 * @param remoteaudio 远端音频元素
 */
export function CreateTmpIntercom(called: string, confnum: string, confname: string, remoteaudio: HTMLAudioElement): void {
  const info: MakeCallT = {
    caller: displayName,
    ctype: CallType.CallTypeTmpintercom,
    members: called,
    isVideo: MediaType.MediaTypeAudio,
    sessnum: confnum,
    sessname: confname
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_SESSION_CREATECALL,
    body: info
  }
  const confkinfo: MakeCallInfo = {
    msgid: header.msgid,
    mkinfo: info,
    mktime: new Date(),
    autoanswer: true,
    raudio: remoteaudio,
    isshowscreen: false
  }
  arrMakeCalls.set(header.msgid, confkinfo)
  SendAPI(JSON.stringify(header))
}

/**
 * 设置GIS跟踪
 * @param opemps 需要跟踪的成员列表
 */
export function SetGisTrace(opemps: string): void {
  const info = {
    type: 1,
    getemp: displayName,
    emps: opemps
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_GIS_SET_TRACE,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 取消GIS跟踪
 * @param opemps 需要取消跟踪的成员列表
 */
export function SetGisUnTrace(opemps: string): void {
  const info = {
    type: 2,
    getemp: displayName,
    emps: opemps
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_GIS_SET_TRACE,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 获取成员GIS位置信息
 * @param getemps 需要获取位置的成员列表
 */
export function GetEmpsGisInfo(getemps: string): void {
  const info = {
    emps: getemps
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_GIS_GET_EMPPOS,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 获取组织架构树
 */
export function GetGroupTree(): void {
  const info = {
    type: -1,
    dnsprefix: "",
    getemp: displayName
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_DATA_GET_ALLGROUP,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 获取组织成员
 * @param groupnum 组织编号
 * @param type 组织类型
 * @param dns DNS前缀
 */
export function GetGroupMember(groupnum: string, type: number, dns: string): void {
  const info = {
    type: type,
    dnsprefix: dns,
    getemp: displayName,
    groupnum: groupnum
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_DATA_GET_GROUPEMPS,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 查询成员信息
 * @param queryinfo 查询条件
 */
export function QueryEmps(queryinfo: string): void {
  const info = {
    queryinfo: queryinfo,
    getemp: displayName
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_DATA_QUERY_EMPS,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 根据类型查询成员
 * @param type 成员类型
 */
export function QueryEmpsByType(type: number): void {
  const info = {
    type: type,
    getemp: displayName
  }
  const header: FSAPIHeader = {
    msgid: GetUUID(),
    header: APIHEADER.API_DATA_GET_EMPSBYTYPE,
    body: info
  }
  SendAPI(JSON.stringify(header))
}

/**
 * 开始HTTP文件上传
 * @param filename 文件名
 * @param ftype 文件类型
 * @param file 文件对象
 * @returns XMLHttpRequest对象
 */
export function httpUploadStart(filename: string, ftype: number, file: File): XMLHttpRequest {
  return httpUpload(m_serverip, webport, filename, ftype, file, clientcallback)
}

/**
 * 停止HTTP文件上传
 * @param xhr XMLHttpRequest对象
 */
export function httpUploadStop(xhr: XMLHttpRequest) {
  cancleUploadFile(xhr)
}

/**
 * 发起HTTP GET请求
 * @param path 请求路径
 * @param httpcall
*/
export function ClienthttpGet(path: string, httpcallback: HttpDelegate): XMLHttpRequest {
  return httpGet(path, webjcookie, httpcallback)
}