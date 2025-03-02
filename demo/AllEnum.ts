export enum CallType {//ygh thechange
  CallTypeNone=0,
  CallTypeSingle,
  CallTypeTmpgroup,
  CallTypeReport,
  CallTypeBroadcast,
  CallTypeTemporary,
  CallTypeInterpose,
  CallTypeForceremove,
  CallTypeMonitor,
  CallTypeIntercom,
  CallTypeSwitch,
  CallTypeUrgent,
  CallTypeSingle2,
  CallTypeTmpintercom,
  CallTypeVideobug,
  CallTypeMCUMetting,
  CallTypeSOS,
  CallTypeTransferVideo,
  CallTypeTransferVideoToMcu,
  CallTypeUploadVideo,
  CallTypePlayFile
}
export enum MediaType
{
  MediaTypeNone=0,
  MediaTypeAudio,
  MediaTypeVideo
}
export enum APIHEADER
{
  FSMSGTYPE="application/jsonapi",
  FSMSGRESTYPE="application/resjsonapi",
  API_SESSION_CREATECALL="session.createcall",
  API_SESSION_CREATECALLCB="session.createcall.CB",
  API_SESSION_CREATEVIDEOBUG="session.createvideobug",
  API_SESSION_CREATEVIDEOBUGCB="session.creatvideobug.CB",
  API_SESSION_CREATEPLAYFILECALL="session.createcall.playfile",
  API_SESSION_CREATEPLAYFILECALLCB="session.createcall.playfile.CB",
  API_SESSION_PLAYFILE ="session.playfile",
  API_SESSION_PLAYFILECB= "session.playfile.CB",
  API_SESSION_PLAYFILESTOP="session.playfile.stop",
  API_SESSION_PLAYFILESTOPCB="session.playfile.stop.CB",
  API_SESSION_APPLYSPEAK= "session.applyspeak",
  API_SESSION_APPLYSPEAKCB ="session.applyspeak.CB",
  API_SESSION_GETALLMEMBERS="session.members.getall",
 API_SESSION_GETALLMEMBERSCB ="session.members.getall.CB",
  
  API_OPERATE_MEMBERADD ="operate.addmember",
  API_OPERATE_MEMBERADDCB ="operate.addmember.CB",
  API_OPERATE_MEMBERDEL ="operate.delmember",
  API_OPERATE_MEMBERDELCB ="operate.delmember.CB",
  API_OPERATE_MEMBER_SPEAK ="operate.member.speak",
  API_OPERATE_MEMBER_SPEAKCB= "operate.member.speak.CB",
  API_OPERATE_MEMBER_HEAR ="operate.member.hear",
  API_OPERATE_MEMBER_HEARCB= "operate.member.hear.CB",
  API_OPERATE_MEMBER_PUSH ="operate.member.push",
  API_OPERATE_MEMBER_PUSHCB= "operate.member.push.CB",
 API_OPERATE_TRANSFER_VIDEO="operate.transfer.video",
 API_OPERATE_TRANSFER_VIDEOCB="operate.transfer.video.CB",
  API_OPERATE_FORCEEND_CALL= "operate.forceend.call",
 API_OPERATE_FORCEEND_CALLCB ="operate.forceend.call.CB",
  API_OPERATE_CALL= "operate.call",
 API_OPERATE_CALLCB ="operate.call.CB",

  API_SYSTEM_LOGININFO="system.server.logininfo",
  API_SYSTEM_LOGININFOCB="system.server.logininfo.CB",

  API_GIS_SET_TRACE="gis.set.trace",
  API_GIS_SET_TRACECB="gis.set.trace.CB",
 API_GIS_GET_EMPPOS ="gis.get.emppos",
 API_GIS_GET_EMPPOSCB ="gis.get.emppos.CB",

 API_REG_WS_LOGIN ="reg.ws.login",
 API_REG_WS_LOGINCB ="reg.ws.login.CB",
 API_REG_WS_HEARTBEAT= "reg.ws.heartbeat",
 API_REG_WS_HEARTBEATCB= "reg.ws.heartbeat.CB",
 API_REG_WS_LOGOUT ="reg.ws.logout",
 API_REG_WS_LOGOUTCB ="reg.ws.logout.CB",
 
 API_DATA_GET_ALLGROUP ="data.get.allgroup",
 API_DATA_GET_ALLGROUPCB ="data.get.allgroup.CB",
 API_DATA_GET_GROUPEMPS ="data.get.groupemps",
 API_DATA_GET_GROUPEMPSCB= "data.get.groupemps.CB",
 API_DATA_GET_EMPSBYTYPE ="data.get.empbytype",
 API_DATA_GET_EMPSBYTYPECB ="data.get.empbytype.CB",
 API_DATA_QUERY_EMPS ="data.query.emps",
 API_DATA_QUERY_EMPSCB ="data.query.emps.CB",

EventSessionStateChange="Session.State.Change",
EventGisPositionChange="GIS.Position.Change",

}
export enum CallDirect
{
    CallDirectNone=0,
    CallDirectOut,
    CallDirectIn
};
export enum CallState
{
    CallStateNone=0,
    CallStateInit,
    CallStateNormal,
    CallStateCallout,
    CallStateIncoming,
    CallStateRinging,
    CallStateConnect,
    CallStateHold,
    CallStateBusy,
    CallStateOffhook,
    CallStateRelease,
    CallStateUnspeak,
    CallStateSpeak,
    CallStateQueue,
    CallStateUnhold,
    CallStateZombie,
    CallStateMEDIATIMEOUT,
    CallStateNoAnswer,
    CallStateRejected,
    CallStateKickOut
};
export enum FileType
{
    FileTypeNone=0,
    FileTypeText,
    FileTypePic,
    FileTypeVoice,
    FileTypeVideo,
    FileTypeGisinfo,
    FileTypePlayAudio,
    FileTypeFax,
    FileTypeOther,
    FileTypePlayVideo,
    FileTypeUploadVideo,
    FileTypeNotice
};
export enum AnswerType
{
    AnswerTypeNone=0,
    AnswerTypeAuto,
    AnswerTypeMan
};
export enum SpeakType
{
    SpeakTypeNone=0,
    SpeakTypeMute,
    SpeakTypeUnmute
};
export enum HearType
{
    HearTypeNone=0,
    HearTypeMute,
    HearTypeUnmute
};
export enum PushVideoType
{
    PushVideoTypeNone=0,
    PushVideoTypePush,
    PushVideoTypeUnpush
};
export enum CallOpType{
	CallOpTypeNone,
	CallOpTypeInterpose,
	CallOpTypeMonitor,
	CallOpTypeRemove,
	CallOpTypeRemoveOther
};
export enum ECode
{
    ECodeNone = 0,
    ECodeRegisterKickout = 1000,
    ECodeRegisterTimeout = 1001,
    ECodeRegisterNotRegister = 1002,
    ECodeRegisterDisConnect = 1003,
    ECodeRegisterUserIsLogin = 1004,
    ECodeRegisterErrorPwd = 1005,
    ECodeNightNotDTP = 1006,
    ECodeRegisterErrorLicense = 1007,
    ECodeErrParameter = 1008,
    ECodeNotFindReceiver = 1009,
    ECodeNotFindSender = 1010,
    EcodeNotFindPortToUse = 1011,
    EcodeDoEventSockect = 1012,
	ECodeRegisterErrorTime = 1013,
    ECodeRegisterCheckPwd=1014,
    ECodeCallingCaller = 1100,
    ECodeCallingCallee = 1101,
    ECodeCallingType = 1102,
    ECodeCallingSessionNotFound = 1103,
    ECodeCallingTerminalNotFound = 1104,
    ECodeCallingNumberNotRegistered = 1105,
    ECodeCallingUserNotExist = 1106,
    ECodeCallingNoAuth = 1107,
    ECodeCallingOprFailed = 1108,
    ECodeCallingUserNotInGroup = 1109,
    ECodeCallingGroupNotFound = 1110,
    ECodeCallingCallTypeError = 1111,
    ECodeCallingSessionCreateFailed = 1112,
    ECodeOpFaxFailured = 1113,
    ECodeFileNotFound = 1114,
    ECodeNoCid = 1115,
    ECodeNumberBusy = 1116,
    ECodeCallingOperateFailed = 1117,
    ECodeCallingNotHaveFitCall = 1118,
    ECodeNotDTPUser = 1119,
    ECodeSessionStateError = 1120,
    ECodeCanNotCallIntercomGroup = 1121,
    ECodeCallingOperateNotConn = 1122,
    ECodeSendVideoFaild = 1123,
    ECodeNotFindMemberID = 1124,
    ECodeConsoleBind = 1200,
    ECodeErrLicense = 1201,
    ECodeErrCanNotUse = 1202,
    ECodeConsoleBindErrorType = 1203,
    ECodeConsoleBindFristRegist = 1204,
    ECodeNotMCUSession = 1300,
    ECodeIsBinded = 1301,
    ECodeMsgGroupExist = 1400,
    ECodeMsgGroupNotExist = 1401,
    ECodeVideoBugCalledIsVoice = 1500,
    ECodeNotFindPlan = 1600,
    ECodePalyFileAdded = 1700,
    ECodeJsonError = 1800,
    ECodeGroupExist = 1900,
    ECodeGroupNotExist = 1901,
    ECodeApplyTalkFailed = 2000
};