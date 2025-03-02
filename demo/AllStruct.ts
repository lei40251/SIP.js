import {CallType,MediaType,APIHEADER,CallDirect,CallState} from "./AllEnum.js"

export interface MakeCallT{
    sessnum?: string;
    ctype:CallType;
    members:string;
    isMcuCall?:string;
    isVideo:MediaType;
    defaultsdp?:string;
    caller:string;
    sessname?:string;
    FileID?:string;
    optype?:number;
  }
  export interface GetVideoT  {
    srccid:string,
    srcnumber:string,
    sessnum:string,
    sessname:string,
    calleds:string
  }
  export interface FSAPIHeader{
    msgid: string;
    header: APIHEADER;
    body?:object;
  }
  export interface MakeCallInfo{
    msgid?: string;
    mkinfo?: MakeCallT;
    getvinfo?:GetVideoT;
    mktime?:Date;
    lvideo?:HTMLVideoElement;
    rvideo?:HTMLVideoElement;
    raudio?:HTMLAudioElement;
    cid?:string ;
    callid?:string;
    ctype?:CallType;
    direction?:CallDirect;
    othernum?:string;
    othername?:string;
    state?:CallState;
    autoanswer:boolean;
    isshowscreen?:boolean;
    mediaRecorder?:MediaRecorder;
  }
  export interface VideoBugT{
    caller?: string;
    called:string;
    codec?:string;
  }