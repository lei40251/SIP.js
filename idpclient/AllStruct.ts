import {CallType,MediaType,APIHEADER,CallDirect,CallState} from "./AllEnum.js"

/**
 * 发起呼叫的参数接口
 * 定义了创建新通话所需的所有必要参数
 */
export interface MakeCallT{
    /** 会话编号，可选 */
    sessnum?: string;
    /** 通话类型，必选 */
    ctype:CallType;
    /** 通话成员列表，必选 */
    members:string;
    /** 是否为MCU会议，可选 */
    isMcuCall?:string;
    /** 媒体类型（音频/视频），必选 */
    isVideo:MediaType;
    /** 默认的SDP信息，可选 */
    defaultsdp?:string;
    /** 主叫方号码，必选 */
    caller:string;
    /** 会话名称，可选 */
    sessname?:string;
    /** 文件ID，用于文件播放类型，可选 */
    FileID?:string;
    /** 操作类型，可选 */
    optype?:number;
  }
  /**
   * 获取视频流参数接口
   * 用于请求获取特定视频流的相关参数
   */
  export interface GetVideoT  {
    /** 源通话ID */
    srccid:string,
    /** 源号码 */
    srcnumber:string,
    /** 会话编号 */
    sessnum:string,
    /** 会话名称 */
    sessname:string,
    /** 被叫列表 */
    calleds:string
  }
  /**
   * API消息头接口
   * 定义了API请求的基本消息结构
   */
  export interface FSAPIHeader{
    /** 消息ID */
    msgid: string;
    /** API消息类型 */
    header: APIHEADER;
    /** 消息体，可选 */
    body?:object;
  }
  /**
   * 通话信息接口
   * 包含了通话过程中的所有相关信息，包括媒体元素、状态等
   */
  export interface MakeCallInfo{
    /** 消息ID，可选 */
    msgid?: string;
    /** 呼叫创建参数，可选 */
    mkinfo?: MakeCallT;
    /** 视频获取信息，可选 */
    getvinfo?:GetVideoT;
    /** 创建时间，可选 */
    mktime?:Date;
    /** 本地视频元素，可选 */
    lvideo?:HTMLVideoElement;
    /** 远端视频元素，可选 */
    rvideo?:HTMLVideoElement;
    /** 远端音频元素，可选 */
    raudio?:HTMLAudioElement;
    /** 通话ID，可选 */
    cid?:string ;
    /** 呼叫ID，可选 */
    callid?:string;
    /** 通话类型，可选 */
    ctype?:CallType;
    /** 通话方向，可选 */
    direction?:CallDirect;
    /** 对方号码，可选 */
    othernum?:string;
    /** 对方名称，可选 */
    othername?:string;
    /** 通话状态，可选 */
    state?:CallState;
    /** 是否自动应答 */
    autoanswer:boolean;
    /** 是否显示屏幕，可选 */
    isshowscreen?:boolean;
    /** 媒体录制器，可选 */
    mediaRecorder?:MediaRecorder;
  }
  /**
   * 视频监控参数接口
   * 用于创建视频监控会话的参数定义
   */
  export interface VideoBugT{
    /** 主叫方号码，可选 */
    caller?: string;
    /** 被叫方号码，必选 */
    called:string;
    /** 编解码器，可选 */
    codec?:string;
  }