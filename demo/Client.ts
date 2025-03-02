/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import { SimpleUser, SimpleUserDelegate, SimpleUserOptions } from "../lib/platform/web/index.js"
import { ClientDelegate } from "./ClientDelegate.js"
import { HttpDelegate } from "./HttpDelegate.js"
import { MakeCallT, FSAPIHeader, MakeCallInfo, VideoBugT, GetVideoT } from "./AllStruct.js"
import { CallType, MediaType, APIHEADER, CallState, AnswerType, SpeakType, HearType, PushVideoType, ECode } from "./AllEnum.js"
import { GetUUID, GetCallType, GetCallDirect, GetCallState } from "./util.js"
import { httpUpload, cancleUploadFile, httpGet } from "./HttpMgr.js"
import { Md5 } from "../src/core/messages/md5.js"
let webSocketServer: string//ygh thechange
let displayName: string
let m_serverip: string
let userurl: string
let pwd: string
let simpleUser: SimpleUser
let httpsserverurl: string
let clientcallback: ClientDelegate
let arrMakeCalls: Map<string, MakeCallInfo> = new Map()
let arrSessions: Map<string, MakeCallInfo> = new Map()
let webport: string
let recordwebip: string
let recordwebport: string
let ServerWebSocketPATH: string
let ServerWebSocket: WebSocket | undefined
let webjcookie: undefined | string | null
// let recordwebcookie:undefined|string|null;
let ServerWebSocketLoginSuccess: boolean
const simpleUserDelegate: SimpleUserDelegate = {
  onCallCreated: (id: string): void => {
    console.log(`[${displayName}] Call created`)
    if (clientcallback && clientcallback.onCallCreated) {
      clientcallback.onCallCreated(id, "")
    }

  },
  onCallReceived: (id: string, sid: string): void => {
    console.log(`[${displayName}] Call received sid:` + sid)
    if (sid) {
      let sidArr = sid.split('.')
      if (sidArr.length > 1) {
        let sessioninfo = arrSessions.get(sidArr[0])
        if (sessioninfo) {
          sessioninfo.callid = id
          sessioninfo.ctype = GetCallType(sidArr[1])
          if (sessioninfo.autoanswer) {
            Answerbycallid(id, sessioninfo.lvideo, sessioninfo.rvideo, sessioninfo.raudio, sessioninfo.isshowscreen)
            console.log('auto answer call')
            if (clientcallback && clientcallback.onCallCreated) {
              clientcallback.onCallCreated(sessioninfo.cid, JSON.stringify(sessioninfo))
            }
            return
          }
        }
        else {
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
    }
    else {
      console.error(`onCallReceived sid is null callid:` + id)
    }
  },
  onCallAnswered: (id: string, sid: string): void => {
    console.log(`[${displayName}] Call answered id:` + id)
    if (sid) {
      let sidArr = sid.split('.')
      if (sidArr.length > 1) {
        let sessioninfo = arrSessions.get(sidArr[0])
        if (sessioninfo) {
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
  onCallHangup: (id: string, sid: string): void => {
    console.log(`[${displayName}] Call hangup sid:` + sid)
    let sidArr = sid.split('.')
    if (sidArr.length > 1) {
      let sessioninfo = arrSessions.get(sidArr[0])
      if (sessioninfo) {
        console.log('auto answer call')
        if (clientcallback && clientcallback.onCallHangup) {
          clientcallback.onCallHangup(sessioninfo.cid, JSON.stringify(sessioninfo))
        }
      }
      else {
        console.error(`onCallHangup not find by sid:` + sidArr[0])
      }
    }
    else {
      console.error(`onCallHangup  sid is null callid:` + id)
    }
  },
  onCallHold: (id: string, held: boolean): void => {
    console.log(`[${displayName}] Call hold ${held}`)
    for (let value of arrSessions.values()) {
      if (value.callid == id) {
        if (clientcallback && clientcallback.onCallHold) {
          clientcallback.onCallHold(value.cid, held)
        }
      }
    }
  },
  onServerConnect: (): void => {
    console.log(`[${displayName}] onServerConnect`)
    if (clientcallback && clientcallback.onServerConnectState) {
      clientcallback.onServerConnectState(true)
    }
  },
  onServerDisconnect: (error?: Error): void => {
    console.error(error)
    if (clientcallback && clientcallback.onServerConnectState) {
      clientcallback.onServerConnectState(false)
    }
  },
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
function TreateMsg(message: string) {
  window.console.log("onMessageReceived:" + message)
  let recvinfo = JSON.parse(message)
  switch (recvinfo["header"]) {
    case APIHEADER.API_SESSION_CREATECALLCB:
    case APIHEADER.API_SESSION_CREATEVIDEOBUGCB:
    case APIHEADER.API_SESSION_CREATEPLAYFILECALLCB:
    case APIHEADER.API_SESSION_APPLYSPEAKCB:
    case APIHEADER.API_OPERATE_TRANSFER_VIDEOCB:
      {
        const msgid = recvinfo["body"][0]["msgid"]
        let mkinfo = arrMakeCalls.get(msgid)
        if (mkinfo) {
          arrMakeCalls.delete(msgid)
          if (recvinfo["code"] == 0) {
            let cid = recvinfo["body"][0]["cid"]
            mkinfo.cid = cid
            let sessioninfo = arrSessions.get(cid)
            console.log("check cid:" + cid)
            if (sessioninfo) {
              mkinfo.callid = sessioninfo.callid
              mkinfo.ctype = sessioninfo.ctype
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
          const newsessioninfo: MakeCallInfo = {
            cid: sid,
            autoanswer: false
          }
          sessioninfo = newsessioninfo
          arrMakeCalls.set(sid, sessioninfo)
        }
        sessioninfo.ctype = GetCallType(recvinfo["body"][0]["type"])
        sessioninfo.othername = recvinfo["body"][0]["othername"]
        sessioninfo.othernum = recvinfo["body"][0]["othernum"]
        sessioninfo.direction = GetCallDirect(recvinfo["body"][0]["direction"])
        if (sessioninfo.state != nowcallstate) {
          sessioninfo.state = nowcallstate
          if (clientcallback && clientcallback.onSessionStateChange) {
            clientcallback.onSessionStateChange(sid, JSON.stringify(sessioninfo))
          }
        }
        if (nowcallstate == CallState.CallStateRelease) {
          arrSessions.delete(sid)
        }
        return
      }
    case APIHEADER.API_SYSTEM_LOGININFOCB:
      {
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

  if (clientcallback && clientcallback.onAPIReceived) {
    clientcallback.onAPIReceived(message)
  }
}
export function init(serverip: string, serverport: string, userid: string, userpwd: string) {
  m_serverip = serverip
  webSocketServer = "wss://" + serverip + ":" + serverport + "/fswebrtc"
  httpsserverurl = "https://" + serverip + ":" + serverport + "/fswebrtc"
  displayName = userid
  userurl = "sip:" + displayName + "@" + serverip
  pwd = userpwd
  // SimpleUser options
  const simpleUserOptions: SimpleUserOptions = {
    aor: userurl,
    delegate: simpleUserDelegate,
    media: {
      constraints: { // This demo is making "video only" calls
        audio: true,
        video: true
      },
      local: {
      },
      remote: {
      }
    },
    userAgentOptions: {
      logLevel: "debug",
      displayName,
      authorizationPassword: pwd
    }
  }
  // SimpleUser construction
  simpleUser = new SimpleUser(webSocketServer, simpleUserOptions)

}
export function connect(callback: ClientDelegate) {
  clientcallback = callback
  simpleUser.connect()
    .then(() => {

      console.log("conn success")
      if (clientcallback && clientcallback.onServerConnectState) {
        clientcallback.onServerConnectState(true)
      }
      return true
    })
    .catch((error: Error) => {

      console.error(`[${simpleUser.id}] failed to connect`)
      console.error(error)
      window.open(httpsserverurl)
      return false
    })
}
export function disconnect() {
  simpleUser
    .disconnect()
    .then(() => {
      if (clientcallback && clientcallback.onServerConnectState) {
        clientcallback.onServerConnectState(false)
      }
    })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to disconnect`)
      console.error(error)
    })
}
export function Register(timeexp: number | undefined) {
  if (timeexp == undefined || timeexp <= 1 || timeexp >= 600) {
    timeexp = 60
  }
  let operate = { expires: timeexp }
  simpleUser.register(operate, {
    // An example of how to get access to a SIP response message for custom handling
    requestDelegate: {
      onReject: (response) => {
        console.warn(`[${simpleUser.id}] REGISTER rejected`)
        let message = `Registration of "${simpleUser.id}" rejected.\n`
        message += `Reason: ${response.message.reasonPhrase}\n`
        console.log(message)
        if (clientcallback && clientcallback.onRegisteredState) {
          clientcallback.onRegisteredState(false)
        }
      }
    }
  })
    .then(() => {
      console.log("register success")
      if (clientcallback && clientcallback.onRegisteredState) {
        clientcallback.onRegisteredState(true)
      }
    })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to register`)
      console.error(error)
      if (clientcallback && clientcallback.onRegisteredState) {
        clientcallback.onRegisteredState(false)
      }
    })
}
export function UnRegister() {
  simpleUser
    .unregister()
    .then(() => {
      if (clientcallback && clientcallback.onRegisteredState) {
        clientcallback.onRegisteredState(false)
      }
    })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to unregister`)
      console.error(error)

    })
}
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
export function DisConnWebSocket() {
  if (ServerWebSocket != undefined) {
    ServerWebSocketLogout()
    ServerWebSocket.close()
    ServerWebSocket = undefined
  }
}
function onWebSocketClose(ev: CloseEvent): void {

  const message = `WebSocket closed  (code: ${ev.code})`
  console.error(message)
  // We are about to transition to disconnected, so clear our web socket
  ServerWebSocket = undefined
}
function onWebSocketError(ev: Event): void {
  console.error("WebSocket error occurred.", ev)
}

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
function onWebSocketOpen(ev: Event): void {
  console.log("WebSocket opened", ev)
  ServerWebSocketLogin("")
}
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
export function SendDTMF(tone: string, sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.sendDTMF(tone, sessioninfo.callid)
  }
  else {
    console.error("SendDTMF find callid error sid:" + sid)
  }
}
export function Hold(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.hold(sessioninfo.callid)
  }
  else {
    console.error("Hold find callid error sid:" + sid)
  }
}
export function UnHold(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.unhold(sessioninfo.callid)
  }
  else {
    console.error("UnHold find callid error sid:" + sid)
  }
}
export function Mute(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.mute(sessioninfo.callid)
  }
  else {
    console.error("Mute find callid error sid:" + sid)
  }
}
export function UnMute(sid: string) {
  let sessioninfo = arrSessions.get(sid)
  if (sessioninfo && sessioninfo.callid) {
    simpleUser.unmute(sessioninfo.callid)
  }
  else {
    console.error("unmute find callid error sid:" + sid)
  }
}
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
export function SendAPI(msg: string): void {
  if (ServerWebSocket != undefined && ServerWebSocketLoginSuccess) {
    console.log("ServerWebSocket send:" + msg)
    ServerWebSocket.send(msg)
  }
  else {
    simpleUser.messageType("sip:api@" + m_serverip, msg, APIHEADER.FSMSGTYPE)
  }
}
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
export function SetMemberUnSpeak(sid: string, number: string): void {
  SetMemberSpeakType(sid, number, SpeakType.SpeakTypeMute)
}
export function SetMemberSpeak(sid: string, number: string): void {
  SetMemberSpeakType(sid, number, SpeakType.SpeakTypeUnmute)
}
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
export function SetMemberUnHear(sid: string, number: string): void {
  SetMemberHearType(sid, number, HearType.HearTypeMute)
}
export function SetMemberHear(sid: string, number: string): void {
  SetMemberHearType(sid, number, HearType.HearTypeUnmute)
}
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
export function SetMemberPush(sid: string, number: string): void {
  SetMemberPushType(sid, number, PushVideoType.PushVideoTypePush)
}
export function SetMemberUnPush(sid: string, number: string): void {
  SetMemberPushType(sid, number, PushVideoType.PushVideoTypeUnpush)
}
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
export function ApplySpeak(groupnum: string, remoteaudio: HTMLAudioElement): void {
  ApplySpeakByType(groupnum, 55, remoteaudio)
}
export function ReleaseSpeak(groupnum: string, remoteaudio: HTMLAudioElement): void {
  ApplySpeakByType(groupnum, 56, remoteaudio)
}
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
export function httpUploadStart(filename: string, ftype: number, file: File): XMLHttpRequest {
  return httpUpload(m_serverip, webport, filename, ftype, file, clientcallback)
}
export function httpUploadStop(xhr: XMLHttpRequest) {
  cancleUploadFile(xhr)
}
export function ClienthttpGet(path: string, httpcallback: HttpDelegate): XMLHttpRequest {
  return httpGet(path, webjcookie, httpcallback)
}



