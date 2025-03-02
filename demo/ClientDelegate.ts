export interface ClientDelegate {
    /**
     * Called when a call is answered.
     * @remarks
     * Callback for handling establishment of a new Session.
     */
    onCallAnswered?(sid?:string,jsonstr?:string): void;
    /**
     * Called when a call is created.
     * @remarks
     * Callback for handling the creation of a new Session.
     */
    onCallCreated?(sid?:string,jsonstr?:string): void;
    /**
     * Called when a call is received.
     * @remarks
     * Callback for handling incoming INVITE requests.
     * The callback must either accept or reject the incoming call by calling `answer()` or `decline()` respectively.
     */
    onCallReceived?(sid?:string,jsonstr?:string): void;
    /**
     * Called when a call is hung up.
     * @remarks
     * Callback for handling termination of a Session.
     */
    onCallHangup?(sid?:string,jsonstr?:string): void;
    /**
     * Called when a call is put on hold or taken off hold.
     * @remarks
     * Callback for handling re-INVITE responses.
     */
    onCallHold?(sid?:string,held?: boolean): void;
    /**
     * Called when a call receives an incoming DTMF tone.
     * @remarks
     * Callback for handling an incoming INFO request with content type application/dtmf-relay.
     */
    onCallDTMFReceived?(tone: string, duration: number): void;
    /**
     * Called upon receiving a message.
     * @remarks
     * Callback for handling incoming MESSAGE requests.
     * @param message - The message received.
     */
    onMessageReceived?(message: string): void;
    onAPIReceived?(message: string): void;
    /**
     * Called when user is registered to received calls.
     */
    onRegisteredState(isreg:boolean): void;
    /**
     * Called when user is connected to server.
     * @remarks
     * Callback for handling user becomes connected.
     */
    onServerConnectState?(isconn:boolean): void;

    onSessionStateChange?(sid?:string,jsonstr?:string): void;

    onFileUploadResult?(filename:string,result:boolean,responsestr:string):void;
    onFileUploadprogress?(filename:string,percentage:string,strspeed:string,resttime:string):void;

}
