
import {ClientDelegate} from "./ClientDelegate.js"
import {HttpDelegate} from "./HttpDelegate.js"
// import { Md5 } from "../src/core/messages/md5.js";
export function httpUpload(serverip:string,serverport:string,filename:string,ftype:number,file:File,clientcallback:ClientDelegate):XMLHttpRequest
{
    let url="https://"+serverip+":"+serverport+"/UpFileServlet"
    let oloaded=0;
    let ot=0;
    let form = new FormData(); // FormData 对象
    form.append("fileType",ftype.toString())
    form.append("fileName",filename)
    form.append("any_file", file); // 文件对象
    let xhr = new XMLHttpRequest();  // XMLHttpRequest 对象
    xhr.open("post", url, true); //post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
    xhr.onload  = (evt) => {
        if(clientcallback && clientcallback.onFileUploadResult)
        {
            clientcallback.onFileUploadResult(filename,true,xhr.response.toString());
        }

        window.console.log(evt)
    }
    xhr.onerror =  (evt) => {
        if(clientcallback && clientcallback.onFileUploadResult)
        {
            clientcallback.onFileUploadResult(filename,false,xhr.response.toString());
        }

        window.console.log(evt)
    }
    xhr.upload.onprogress  =  (evt) =>{
        let percentage="";
        // event.total是需要传输的总字节，event.loaded是已经传输的字节。如果event.lengthComputable不为真，则event.total等于0
        if (evt.lengthComputable) {//
            percentage= Math.round(evt.loaded / evt.total * 100) + "%";
        }
        let nt = new Date().getTime();//获取当前时间
        let pertime = (nt-ot)/1000; //计算出上次调用该方法时到现在的时间差，单位为s
        ot = new Date().getTime(); //重新赋值时间，用于下次计算

        let perload = evt.loaded - oloaded; //计算该分段上传的文件大小，单位b
        oloaded = evt.loaded;//重新赋值已上传文件大小，用以下次计算

        //上传速度计算
        let speed = perload/pertime;//单位b/s
        let bspeed = speed;
        let units = 'b/s';//单位名称
        if(speed/1024>1){
            speed = speed/1024;
            units = 'k/s';
        }
        if(speed/1024>1){
            speed = speed/1024;
            units = 'M/s';
        }
        //剩余时间
        let resttime = ((evt.total-evt.loaded)/bspeed).toFixed(1);
        let strspeed=speed+units;
        if(clientcallback && clientcallback.onFileUploadprogress)
        {
            clientcallback.onFileUploadprogress(filename,percentage,strspeed,resttime);
        }
    }
    xhr.upload.onloadstart = function(){
        ot = new Date().getTime();   //设置开始时间
        oloaded = 0;//设置上传开始时，以上传的文件大小为0
    };
    xhr.send(form); //发送form数据
    return xhr;
}

//取消上传
export function cancleUploadFile(xhr:XMLHttpRequest){
    xhr.abort();
}
export function httpGet(httppath:string,setcookie:undefined|string|null, httpcallback:HttpDelegate):XMLHttpRequest
{
    window.console.log(`httpGet path:[${httppath}]`);
    let xhr = new XMLHttpRequest();
    if(setcookie!=undefined && setcookie!=null && setcookie!="")
    {
        xhr.setRequestHeader("cookie",setcookie)
    }
    // 打开一个GET请求
    xhr.open('GET', httppath, true);

    // 设置请求完成的处理函数
    xhr.onreadystatechange = function () {
        if(xhr.readyState==4)
        {
            if(httpcallback && httpcallback.onResponse)
            {
                httpcallback.onResponse(httppath,xhr);
            }
        }
    };
    // 发送请求
    xhr.send();
    return xhr;
}