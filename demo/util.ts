import {CallType,MediaType,APIHEADER,CallDirect,CallState} from "./AllEnum.js"
export  function  GetUUID()
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
export  function  GetCallType(type:string):CallType
{
    switch(type)
    {
        case "1":
            return CallType.CallTypeSingle;
        case "2":
            return CallType.CallTypeTmpgroup;
        case "3":
            return CallType.CallTypeReport;
        case "4":
            return CallType.CallTypeBroadcast;
        case "5":
            return CallType.CallTypeTemporary;
        case "6":
            return CallType.CallTypeInterpose;
        case "7":
            return CallType.CallTypeForceremove;
        case "8":
            return CallType.  CallTypeMonitor;
        case "9":
            return CallType.CallTypeIntercom;
        case "10":
            return CallType.CallTypeSwitch;
        case "11":
            return CallType.CallTypeUrgent;
        case "12":
            return CallType.CallTypeSingle2;
        case "13":
            return CallType.CallTypeTmpintercom;
        case "14":
            return CallType.CallTypeVideobug;
        case "15":
            return CallType.CallTypeMCUMetting;
        case "16":
            return CallType.CallTypeSOS;
        case "17":
            return CallType.CallTypeTransferVideo;
        case "18":
            return CallType.CallTypeTransferVideoToMcu;
        case "19":
            return CallType.CallTypeUploadVideo;
        case "20":
            return CallType.CallTypePlayFile;
        default:
            return CallType.CallTypeNone;
    }
}
export  function  GetCallDirect(type:string):CallDirect
{
    switch(type)
    {
        case "1":
            return CallDirect.CallDirectOut;
        case "2":
            return CallDirect.CallDirectIn;
        default:
            return CallDirect.CallDirectNone;
    }
}
export  function  GetCallState(type:string):CallState
{  
    switch(type)
    {
        case "1":
            return CallState.CallStateInit;
        case "2":
            return CallState.CallStateNormal;
        case "3":
            return CallState.CallStateCallout;
        case "4":
            return CallState.CallStateIncoming;
        case "5":
            return CallState.CallStateRinging;
        case "6":
            return CallState.CallStateConnect;
        case "7":
            return CallState.CallStateHold;
        case "8":
            return CallState.CallStateBusy;
        case "9":
            return CallState.CallStateOffhook;
        case "10":
            return CallState.CallStateRelease;
        case "11":
            return CallState.CallStateUnspeak;
        case "12":
            return CallState.CallStateSpeak;
        case "13":
            return CallState.CallStateQueue;
        case "14":
            return CallState.CallStateUnhold;
        case "15":
            return CallState.CallStateZombie;
        case "16":
            return CallState.CallStateMEDIATIMEOUT;
        case "17":
            return CallState.CallStateNoAnswer;
        case "18":
            return CallState.CallStateRejected;
        case "19":
            return CallState.CallStateKickOut;
        default:
            return CallState.CallStateNone;
    }
}