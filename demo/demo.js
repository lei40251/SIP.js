/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */


//document.write("<script language=javascript src=./dist/ClientDelegate.js></script>");
//var demoutil = __webpack_require__("./dist/demo-utils.js");
//var a = require('./demo-utils.js')
var upload;
const clientcallback= {
    onCallCreated: (sid,jsonstr) => {
      console.log("Call create jsonstr:"+jsonstr)
      WriteLog(`Call create id:`+sid);
      const callid = getInput("callid");
      callid.value=sid;
      if(jsonstr!="")
      {
        let recvinfo= JSON.parse(jsonstr);
        if(recvinfo.ctype==AllEnum.CallType["CallTypeTmpintercom"] || recvinfo.ctype==AllEnum.CallType["CallTypeIntercom"])
        {
          const groupnum = getInput("groupnum");
          if(groupnum)
          {
            groupnum.value=recvinfo.othernum;
          }
        }
      }

    },
    onCallReceived: (sid,jsonstr) => {
      console.log("Call create jsonstr:"+jsonstr)
      WriteLog(`receive call id:`+sid);
      const callid = getInput("callid");
      callid.value=sid;
      let recvinfo= JSON.parse(jsonstr);
      if(recvinfo.ctype==AllEnum.CallType["CallTypeTmpintercom"] || recvinfo.ctype==AllEnum.CallType["CallTypeIntercom"])
      {
        const groupnum = getInput("groupnum");
        if(groupnum)
        {
          groupnum.value=recvinfo.othernum;
        }
      }
  },
    onCallAnswered: (sid,jsonstr) => {
      console.log("Call onCallAnswered jsonstr:"+jsonstr)
      WriteLog(`Call answerid:`+sid);
    },
    onCallHangup: (sid,jsonstr) => {
      console.log("Call onCallHangup jsonstr:"+jsonstr)
      WriteLog(`Call hangup:`+sid);
      const callid = getInput("callid");
      callid.value="";
    },
    onSessionStateChange: (sid,jsonstr) => {
      console.log("Call onSessionStateChange jsonstr:"+jsonstr)
      WriteLog(`Call onSessionStateChange:`+sid);
    },
    onCallHold: (sid,held) => {
      WriteLog(`Call onCallHold:`+sid);
      const holdCheckbox = getInput("hold");
      holdCheckbox.checked = held;
    },
    onMessageReceived: (message) => {
      WriteLog(`message:`+message);
    },
    onAPIReceived: (message) => {
      WriteLog(`API:`+message);
    },
    onRegisteredState: (isreg) => {
        if(isreg)
        {

        }
        else
        {

        }
        WriteLog(`Call onRegisteredState:`+isreg);
    },
    onServerConnectState: (isconn) => {
        if(isconn)
        {

            
        }
        else
        {


        }
        WriteLog(`Call onServerConnectState:`+isconn);
    },
    onFileUploadResult: (filename,result,responsestr) => {
      WriteLog(`filename:`+filename+" result:"+result +" responsestr:"+responsestr);
    },
    onFileUploadprogress: (ffilename,percentage,strspeed,resttime) => {

    },
  };
  function WriteLog(msg)
  {
    const logdev = getTextArea("logdev");
    logdev.value=logdev.value+msg+"\r\n";
  }
  function clearlog()
  {
    const logdev = getTextArea("logdev");
    logdev.value="";
  }
  function Init()
  {
    const serverip = getInput("serverip");
    const serverport = getInput("serverport");
    const userid = getInput("userid");
    const userpwd = getInput("userpwd");
    Client.init(serverip.value,serverport.value,userid.value,userpwd.value);
    Client.connect(clientcallback);
  }

 function Disconnect()
  {
    Client.disconnect();
  } 
  
function Register()
  {
    Client.Register(10);
  } 
  
function UnRegister(){
    Client.UnRegister();
  }
  function ConnectServerWebSocket()
  {
    Client.ConnWebSocket();
  }
  function DisConnectServerWebSocket()
  {
    Client.DisConnWebSocket();
  }
  function Answer()
  {
    const callid = getInput("callid");
    const RemoteaudioElement = getAudio("remoteAudio");
const RemoteVideoElement = getVideo("videoRemote");
const localVideoElement = getVideo("videoLocal");

    Client.Answer(callid.value,localVideoElement,RemoteVideoElement,RemoteaudioElement,false);
  }
  function ScreenAnswer()
  {
    const callid = getInput("callid");
    const RemoteaudioElement = getAudio("remoteAudio");
    const RemoteVideoElement = getVideo("videoRemote");
    const localVideoElement = getVideo("videoLocal");

    Client.Answer(callid.value,localVideoElement,RemoteVideoElement,RemoteaudioElement,true);
  }
  function HangUP()
  {
    const callid = getInput("callid");
    Client.Hangup(callid.value);
  }

function SendAPI()
{
  const apimsg = getInput("apimsg");
  Client.SendAPI(apimsg.value);
}
function HoldChange()
{
  const callid = getInput("callid");
  const holdCheckbox = getInput("hold");
  if (holdCheckbox.checked) {
    
    Client.Hold(callid.value).catch((error) => {
      holdCheckbox.checked = false;
      console.error(error);
      alert("Failed to hold call.\n" + error);
    });
  } else {
    // Checkbox is not checked..
    Client.UnHold(callid.value).catch((error) => {
      holdCheckbox.checked = true;
      console.error(error);
      alert("Failed to unhold call.\n" + error);
    });
  }
}
function MuteChange()
{
  const callid = getInput("callid");
  const muteCheckbox = getInput("mute");
  if (muteCheckbox.checked) {
    // Checkbox is checked..
    Client.Mute(callid.value);
    if (Client.IsMuted() === false) {
      muteCheckbox.checked = false;
      alert("Failed to mute call.\n");
    }
  } else {
    // Checkbox is not checked..
    Client.UnMute(callid.value)
    if (Client.IsMuted() === true) {
      muteCheckbox.checked = true;
      alert("Failed to unmute call.\n");
    }
  }
}
function SendDtmf(val)
{
  const callid = getInput("callid");
  Client.SendDTMF(val,callid.value).then(() => {
    const dtmfSpan = getSpan("dtmf");
    dtmfSpan.innerHTML += tone;
  });
}
function takephoto()
{
  const callid = getInput("callid");
  Client.TakePhoto(callid.value,callid.value+".png");
}
function startrecord()
{
  const callid = getInput("callid");
  Client.MediaRecordStart(callid.value,callid.value+'.webm',1000*60);
}
function stoprecord()
{
  const callid = getInput("callid");
  Client.MediaRecordStop(callid.value);
}
function StartUpload()
{
  const uploadFile = getInput("UploadFile");
  upload=Client.httpUploadStart(uploadFile.files[0].name,1,uploadFile.files[0]);
}
function StopUpload()
{
  Client.httpUploadStop(upload);
}
/**
 * call
 */
  function AudioCall()
  {
    const othernum = getInput("othernum");
    const RemoteaudioElement = getAudio("remoteAudio");
    const RemoteVideoElement = getVideo("videoRemote");
    const localVideoElement = getVideo("videoLocal");
    Client.MakeCall(othernum.value,AllEnum.MediaType["MediaTypeAudio"],localVideoElement,RemoteVideoElement,RemoteaudioElement,false);
  }
  function VideoCall()
  {
    const othernum = getInput("othernum");
    const RemoteaudioElement = getAudio("remoteAudio");
    const RemoteVideoElement = getVideo("videoRemote");
    const localVideoElement = getVideo("videoLocal");
    Client.MakeCall(othernum.value,AllEnum.MediaType["MediaTypeVideo"],localVideoElement,RemoteVideoElement,RemoteaudioElement,false);
  }
  function MakeScreenCall()
  {
    const RemoteaudioElement = getAudio("remoteAudio");
    const RemoteVideoElement = getVideo("videoRemote");
    const localVideoElement = getVideo("videoLocal");
    const othernum = getInput("othernum");
    Client.MakeCall(othernum.value,AllEnum.MediaType["MediaTypeVideo"],localVideoElement,RemoteVideoElement,RemoteaudioElement,true);
  }

/**
 * conference
 */
function AudioConference()
{
  const members = getInput("members");
  const RemoteaudioElement = getAudio("remoteAudio");
  const RemoteVideoElement = getVideo("videoRemote");
  const localVideoElement = getVideo("videoLocal");
  var newDate = new Date();
  var strnum= "1"+newDate.getDate()+newDate.getHours()+newDate.getMinutes()+newDate.getSeconds();
  Client.CreateConf(members.value,strnum,"语音会议",AllEnum.MediaType["MediaTypeAudio"],localVideoElement,RemoteVideoElement,RemoteaudioElement,false);
}
function VideoConference()
{
  const members = getInput("members");
  const RemoteaudioElement = getAudio("remoteAudio");
  const RemoteVideoElement = getVideo("videoRemote");
  const localVideoElement = getVideo("videoLocal");
  var newDate = new Date();
  var strnum= "1"+newDate.getDate()+newDate.getHours()+newDate.getMinutes()+newDate.getSeconds();
  Client.CreateConf(members.value,strnum,"视频会议",AllEnum.MediaType["MediaTypeVideo"],localVideoElement,RemoteVideoElement,RemoteaudioElement,false);
}
function MakeScreenConference()
{
  const RemoteaudioElement = getAudio("remoteAudio");
  const RemoteVideoElement = getVideo("videoRemote");
  const localVideoElement = getVideo("videoLocal");
  const members = getInput("members");
  var newDate = new Date();
  var strnum= "1"+newDate.getDate()+newDate.getHours()+newDate.getMinutes()+newDate.getSeconds();
  Client.CreateConf(members.value,strnum,"投屏会议",AllEnum.MediaType["MediaTypeVideo"],localVideoElement,RemoteVideoElement,RemoteaudioElement,true);
}
function PlayFile()
{
  const callid = getInput("callid");
  const playfileid = getInput("playfileid");
  Client.PlayFile(callid.value, playfileid.value,1);
}
function StopPlayFile()
{
  const callid = getInput("callid");
  const playfileid = getInput("playfileid");
  Client.PlayFileStop(callid.value, playfileid.value);
}
function PlayFileBroadcast()
{
  const members = getInput("members");
  const RemoteaudioElement = getAudio("remoteAudio");
  const RemoteVideoElement = getVideo("videoRemote");
  const localVideoElement = getVideo("videoLocal");
  const playfileid = getInput("playfileid");
  var newDate = new Date();
  var strnum= "1"+newDate.getDate()+newDate.getHours()+newDate.getMinutes()+newDate.getSeconds();
  Client.CreatePlayFileBroadcast(members.value,strnum,"文件广播",AllEnum.MediaType["MediaTypeVideo"],playfileid.value,localVideoElement,RemoteVideoElement,RemoteaudioElement,false);
}
function AddMember()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.AddMember(callid.value,number.value);
}
function delMember()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.DelMember(callid.value,number.value);
}
function SetNotSpeak()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.SetMemberUnSpeak(callid.value,number.value);
}
function SetSpeak()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.SetMemberSpeak(callid.value,number.value);
}
function SetUnHear()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.SetMemberUnHear(callid.value,number.value);
}
function SetHear()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.SetMemberHear(callid.value,number.value);
}
function SetPush()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.SetMemberPush(callid.value,number.value);
}
function SetUnPush()
{
  const callid = getInput("callid");
  const number = getInput("number");
  Client.SetMemberUnPush(callid.value,number.value);
}
function ApplySpeak()
{
  const RemoteaudioElement = getAudio("remoteAudio");
  const groupnum = getInput("groupnum");
  Client.ApplySpeak(groupnum.value,RemoteaudioElement);
}
function ReleaseSpeak()
{
  const RemoteaudioElement = getAudio("remoteAudio");
  const groupnum = getInput("groupnum");
  Client.ReleaseSpeak(groupnum.value,RemoteaudioElement);
}
function FoceEndConf()
{
  const callid = getInput("callid");
  Client.FoceEndConf(callid.value);
}
function froceOPInterpose()
{
  const forceopnumber = getInput("forceopnumber");
  const forceopcid = getInput("forceopcid");
  const localuserid = getInput("userid");
  Client.froceOPCall(AllEnum.CallOpType["CallOpTypeInterpose"],forceopnumber.value,forceopcid.value,localuserid.value);
}
function froceOPMonitor()
{
  const forceopnumber = getInput("forceopnumber");
  const forceopcid = getInput("forceopcid");
  const localuserid = getInput("userid");
  Client.froceOPCall(AllEnum.CallOpType["CallOpTypeMonitor"],forceopnumber.value,forceopcid.value,localuserid.value);
}
function froceOPRemoveOther()
{
  const forceopnumber = getInput("forceopnumber");
  const forceopcid = getInput("forceopcid");
  const localuserid = getInput("userid");
  Client.froceOPCall(AllEnum.CallOpType["CallOpTypeRemoveOther"],forceopnumber.value,forceopcid.value,localuserid.value);
}
function froceOPRemove()
{
  const forceopnumber = getInput("forceopnumber");
  const forceopcid = getInput("forceopcid");
  const localuserid = getInput("userid");
  Client.froceOPCall(AllEnum.CallOpType["CallOpTypeRemove"],forceopnumber.value,forceopcid.value,localuserid.value);
}
function GetCallAllMembers()
{
  const callid = getInput("callid");
  Client.GetCallAllMembers(callid.value);
}
function GetMemberVideo()
{
  const callid = getInput("callid");
  const number = getInput("number");
  var newDate = new Date();
  var strnum= "1"+newDate.getDate()+newDate.getHours()+newDate.getMinutes()+newDate.getSeconds();
  const RemoteVideoElement = getVideo("membervideo1");
  const userid = getInput("userid");
  Client.SetGetCallMemberVideo(callid.value,number.value,strnum,"获取视频",userid.value,RemoteVideoElement);
}
function CreateIntercom()
{
  const RemoteaudioElement = getAudio("remoteAudio");
  const members = getInput("members");
  var newDate = new Date();
  var strnum= "1"+newDate.getDate()+newDate.getHours()+newDate.getMinutes()+newDate.getSeconds();
  Client.CreateTmpIntercom(members.value,strnum,"临时对讲",RemoteaudioElement);
}
function GetServerLoginInfo()
{
  Client.GetEmployeeLoginInfo();
}