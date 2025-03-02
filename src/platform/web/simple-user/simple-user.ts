import { Info } from "../../../api/info.js";
import { Invitation } from "../../../api/invitation.js";
import { InvitationAcceptOptions } from "../../../api/invitation-accept-options.js";
import { Inviter } from "../../../api/inviter.js";
import { InviterInviteOptions } from "../../../api/inviter-invite-options.js";
import { InviterOptions } from "../../../api/inviter-options.js";
import { Message } from "../../../api/message.js";
import { Messager } from "../../../api/messager.js";
import { Referral } from "../../../api/referral.js";
import { Registerer } from "../../../api/registerer.js";
import { RegistererOptions } from "../../../api/registerer-options.js";
import { RegistererRegisterOptions } from "../../../api/registerer-register-options.js";
import { RegistererState } from "../../../api/registerer-state.js";
import { RegistererUnregisterOptions } from "../../../api/registerer-unregister-options.js";
import { RequestPendingError } from "../../../api/exceptions/request-pending.js";
import { Session } from "../../../api/session.js";
import { SessionInviteOptions,SessionStateInfo } from "../../../api/session-invite-options.js";
import { SessionState } from "../../../api/session-state.js";
import { UserAgent } from "../../../api/user-agent.js";
import { UserAgentOptions } from "../../../api/user-agent-options.js";
import { UserAgentState } from "../../../api/user-agent-state.js";
import { Logger } from "../../../core/log/logger.js";
import { SessionDescriptionHandler } from "../session-description-handler/session-description-handler.js";
import { SessionDescriptionHandlerOptions } from "../session-description-handler/session-description-handler-options.js";
import { Transport } from "../transport/transport.js";
import { SimpleUserDelegate } from "./simple-user-delegate.js";
import { SimpleUserMediaLocal, SimpleUserOptions ,SimpleUserMediaRemote} from "./simple-user-options.js";

/**
 * A simple SIP user class.
 * @remarks
 * While this class is completely functional for simple use cases, it is not intended
 * to provide an interface which is suitable for most (must less all) applications.
 * While this class has many limitations (for example, it only handles a single concurrent session),
 * it is, however, intended to serve as a simple example of using the SIP.js API.
 * @public
 */
export class SimpleUser {
  /** Delegate. */
  public delegate: SimpleUserDelegate | undefined;

  private attemptingReconnection = false;
  private connectRequested = false;
  private logger: Logger;
  private held = false;
  private options: SimpleUserOptions;
  private registerer: Registerer | undefined = undefined;
  private registerRequested = false;
  public arrCalls:Map<string,Session>= new Map();
  private userAgent: UserAgent;

  /**
   * Constructs a new instance of the `SimpleUser` class.
   * @param server - SIP WebSocket Server URL.
   * @param options - Options bucket. See {@link SimpleUserOptions} for details.
   */
  constructor(server: string, options: SimpleUserOptions = {}) {
    // Delegate
    this.delegate = options.delegate;

    // Copy options
    this.options = { ...options };

    // UserAgentOptions
    const userAgentOptions: UserAgentOptions = {
      ...options.userAgentOptions
    };

    // Transport
    if (!userAgentOptions.transportConstructor) {
      userAgentOptions.transportConstructor = Transport;
    }

    // TransportOptions
    if (!userAgentOptions.transportOptions) {
      userAgentOptions.transportOptions = {
        server
      };
    }

    // URI
    if (!userAgentOptions.uri) {
      // If an AOR was provided, convert it to a URI
      if (options.aor) {
        const uri = UserAgent.makeURI(options.aor);
        if (!uri) {
          throw new Error(`Failed to create valid URI from ${options.aor}`);
        }
        userAgentOptions.uri = uri;
      }
    }

    // UserAgent
    this.userAgent = new UserAgent(userAgentOptions);

    // UserAgent's delegate
    this.userAgent.delegate = {
      // Handle connection with server established
      onConnect: (): void => {
        this.logger.log(`[${this.id}] Connected`);
        if (this.delegate && this.delegate.onServerConnect) {
          this.delegate.onServerConnect();
        }
        if (this.registerer && this.registerRequested) {
          this.logger.log(`[${this.id}] Registering...`);
          this.registerer.register().catch((e: Error) => {
            this.logger.error(`[${this.id}] Error occurred registering after connection with server was obtained.`);
            this.logger.error(e.toString());
          });
        }
      },
      // Handle connection with server lost
      onDisconnect: (error?: Error): void => {
        this.logger.log(`[${this.id}] Disconnected`);
        if (this.delegate && this.delegate.onServerDisconnect) {
          this.delegate.onServerDisconnect(error);
        }
        for(let key of this.arrCalls.keys()) {
          this.logger.log(`[${key}] Hanging up...`);
          this.hangup(key) // cleanup hung calls
            .catch((e: Error) => {
              this.logger.error(`[${this.id}] Error occurred hanging up call after connection with server was lost.`);
              this.logger.error(e.toString());
            });
        }
        if (this.registerer) {
          this.logger.log(`[${this.id}] Unregistering...`);
          this.registerer
            .unregister() // cleanup invalid registrations
            .catch((e: Error) => {
              this.logger.error(`[${this.id}] Error occurred unregistering after connection with server was lost.`);
              this.logger.error(e.toString());
            });
        }
        // Only attempt to reconnect if network/server dropped the connection.
        if (error) {
          this.attemptReconnection();
        }
      },
      // Handle incoming invitations
      onInvite: (invitation: Invitation,sid:string): void => {
        this.logger.log(`[${this.id}] Received INVITE`);
        // Use our configured constraints as options for any Inviter created as result of a REFER
        const referralInviterOptions: InviterOptions = {
          sessionDescriptionHandlerOptions: { constraints: this.constraints }
        };
        if(sid && sid!="")
        {
          invitation.sid=sid;
        }
        // Initialize our session
        this.initSession(invitation, referralInviterOptions);
        // Delegate
        if (this.delegate && this.delegate.onCallReceived) {
          this.delegate.onCallReceived(invitation.id,invitation.sid);
        } else {
          this.logger.warn(`[${this.id}] No handler available, rejecting INVITE...`);
          invitation
            .reject()
            .then(() => {
              this.logger.log(`[${this.id}] Rejected INVITE`);
            })
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] Failed to reject INVITE`);
              this.logger.error(error.toString());
            });
        }
      },
      // Handle incoming messages
      onMessage: (message: Message): void => {
        message.accept().then(() => {
          if (this.delegate && this.delegate.onMessageReceived) {
            let contenttype=message.request.getHeader("Content-Type");
            if(contenttype)
            {
              this.delegate.onMessageReceived(contenttype,message.request.body);
            }
            else
            {
              this.delegate.onMessageReceived("",message.request.body);
            }
          }
        });
      }
    };

    // Use the SIP.js logger
    this.logger = this.userAgent.getLogger("sip.SimpleUser");

    // Monitor network connectivity and attempt reconnection when we come online
    window.addEventListener("online", () => {
      this.logger.log(`[${this.id}] Online`);
      this.attemptReconnection();
    });
  }

  /**
   * Instance identifier.
   * @internal
   */
  get id(): string {
    return (this.options.userAgentOptions && this.options.userAgentOptions.displayName) || "Anonymous";
  }

  /** The local media stream. Undefined if call not answered. */
  public getlocalMediaStream(session:Session): MediaStream | undefined {
    const sdh = session?.sessionDescriptionHandler;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error("Session description handler not instance of web SessionDescriptionHandler");
    }
    return sdh.localMediaStream;
  }

  /** The remote media stream. Undefined if call not answered. */
  public getremoteMediaStream(session:Session): MediaStream | undefined {
    const sdh = session?.sessionDescriptionHandler;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error("Session description handler not instance of web SessionDescriptionHandler");
    }
    return sdh.remoteMediaStream;
  }
  public getremoteMediaStreambycallid(callid:string|undefined): MediaStream | undefined {
    if(callid!=undefined)
    {
      const session =this.arrCalls.get(callid);
      if(session)
      {
        const sdh = session?.sessionDescriptionHandler;
        if (!sdh) {
          return undefined;
        }
        if (!(sdh instanceof SessionDescriptionHandler)) {
          throw new Error("Session description handler not instance of web SessionDescriptionHandler");
        }
        return sdh.remoteMediaStream;
      }
    }
    return undefined;
  }
  /**
   * The local audio track, if available.
   * @deprecated Use localMediaStream and get track from the stream.
   */
  public getlocalAudioTrack(session:Session): MediaStreamTrack | undefined {
    return this.getlocalMediaStream(session)?.getTracks().find((track) => track.kind === "audio");
  }

  /**
   * The local video track, if available.
   * @deprecated Use localMediaStream and get track from the stream.
   */
  public getlocalVideoTrack(session:Session): MediaStreamTrack | undefined {
    return this.getlocalMediaStream(session)?.getTracks().find((track) => track.kind === "video");
  }

  /**
   * The remote audio track, if available.
   * @deprecated Use remoteMediaStream and get track from the stream.
   */
  public getremoteAudioTrack(session:Session): MediaStreamTrack | undefined {
    return this.getremoteMediaStream(session)?.getTracks().find((track) => track.kind === "audio");
  }

  /**
   * The remote video track, if available.
   * @deprecated Use remoteMediaStream and get track from the stream.
   */
  public getremoteVideoTrack(session:Session): MediaStreamTrack | undefined {
    return this.getremoteMediaStream(session)?.getTracks().find((track) => track.kind === "video");
  }

  /**
   * Connect.
   * @remarks
   * Start the UserAgent's WebSocket Transport.
   */
  public connect(): Promise<void> {
    this.logger.log(`[${this.id}] Connecting UserAgent...`);
    this.connectRequested = true;
    if (this.userAgent.state !== UserAgentState.Started) {
      return this.userAgent.start();
    }
    return this.userAgent.reconnect();
  }

  /**
   * Disconnect.
   * @remarks
   * Stop the UserAgent's WebSocket Transport.
   */
  public disconnect(): Promise<void> {
    this.logger.log(`[${this.id}] Disconnecting UserAgent...`);
    this.connectRequested = false;
    return this.userAgent.stop();
  }

  /**
   * Return true if connected.
   */
  public isConnected(): boolean {
    return this.userAgent.isConnected();
  }

  /**
   * Start receiving incoming calls.
   * @remarks
   * Send a REGISTER request for the UserAgent's AOR.
   * Resolves when the REGISTER request is sent, otherwise rejects.
   */
  public register(
    registererOptions?: RegistererOptions,
    registererRegisterOptions?: RegistererRegisterOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Registering UserAgent...`);
    this.registerRequested = true;

    if (!this.registerer) {
      this.registerer = new Registerer(this.userAgent, registererOptions);
      this.registerer.stateChange.addListener((state: RegistererState) => {
        switch (state) {
          case RegistererState.Initial:
            break;
          case RegistererState.Registered:
            if (this.delegate && this.delegate.onRegistered) {
              this.delegate.onRegistered();
            }
            break;
          case RegistererState.Unregistered:
            if (this.delegate && this.delegate.onUnregistered) {
              this.delegate.onUnregistered();
            }
            break;
          case RegistererState.Terminated:
            this.registerer = undefined;
            break;
          default:
            throw new Error("Unknown registerer state.");
        }
      });
    }

    return this.registerer.register(registererRegisterOptions).then(() => {
      return;
    });
  }

  /**
   * Stop receiving incoming calls.
   * @remarks
   * Send an un-REGISTER request for the UserAgent's AOR.
   * Resolves when the un-REGISTER request is sent, otherwise rejects.
   */
  public unregister(registererUnregisterOptions?: RegistererUnregisterOptions): Promise<void> {
    this.logger.log(`[${this.id}] Unregistering UserAgent...`);
    this.registerRequested = false;

    if (!this.registerer) {
      return Promise.resolve();
    }

    return this.registerer.unregister(registererUnregisterOptions).then(() => {
      return;
    });
  }

  /**
   * Make an outgoing call.
   * @remarks
   * Send an INVITE request to create a new Session.
   * Resolves when the INVITE request is sent, otherwise rejects.
   * Use `onCallAnswered` delegate method to determine if Session is established.
   * @param destination - The target destination to call. A SIP address to send the INVITE to.
   * @param inviterOptions - Optional options for Inviter constructor.
   * @param inviterInviteOptions - Optional options for Inviter.invite().
   */
  public call(
    destination: string,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Beginning Session...`);

    const target = UserAgent.makeURI(destination);
    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
    }

    // Use our configured constraints as InviterOptions if none provided
    if (!inviterOptions) {
      inviterOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions) {
      inviterOptions.sessionDescriptionHandlerOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions.constraints) {
      inviterOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
    }

    // Create a new Inviter for the outgoing Session
    const inviter = new Inviter(this.userAgent, target, inviterOptions);

    // Send INVITE
    return this.sendInvite(inviter, inviterOptions, inviterInviteOptions).then(() => {
      return;
    });
  }

  /**
   * Hangup a call.
   * @remarks
   * Send a BYE request, CANCEL request or reject response to end the current Session.
   * Resolves when the request/response is sent, otherwise rejects.
   * Use `onCallTerminated` delegate method to determine if and when call is ended.
   */
  public hangup(callid:string): Promise<void> {
    this.logger.log(`[${this.id}] Hangup...`);
    return this.terminate(callid);
  }

  /**
   * Answer an incoming call.
   * @remarks
   * Accept an incoming INVITE request creating a new Session.
   * Resolves with the response is sent, otherwise rejects.
   * Use `onCallAnswered` delegate method to determine if and when call is established.
   * @param invitationAcceptOptions - Optional options for Inviter.accept().
   */
  public answer(callid:string,invitationAcceptOptions?: InvitationAcceptOptions): Promise<void> {
    this.logger.log(`[${this.id}] Accepting Invitation...`);
    const session =this.arrCalls.get(callid);
    if(session)
    {
      if (!(session instanceof Invitation)) {
        return Promise.reject(new Error("Session not instance of Invitation."));
      }
  
      // Use our configured constraints as InvitationAcceptOptions if none provided
      if (!invitationAcceptOptions) {
        invitationAcceptOptions = {};
      }
      if (!invitationAcceptOptions.sessionDescriptionHandlerOptions) {
        invitationAcceptOptions.sessionDescriptionHandlerOptions = {};
      }
      if (!invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints) {
        invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
      }
  
      return session.accept(invitationAcceptOptions);
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
    return Promise.resolve();
  }

  /**
   * Decline an incoming call.
   * @remarks
   * Reject an incoming INVITE request.
   * Resolves with the response is sent, otherwise rejects.
   * Use `onCallTerminated` delegate method to determine if and when call is ended.
   */
  public decline(callid:string): Promise<void> {
    this.logger.log(`[${this.id}] rejecting Invitation...`);
    const session =this.arrCalls.get(callid);
    if(session)
    {
      if (!(session instanceof Invitation)) {
        return Promise.reject(new Error("Session not instance of Invitation."));
      }
      return session.reject();
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
    return Promise.resolve();
  }

  /**
   * Hold call
   * @remarks
   * Send a re-INVITE with new offer indicating "hold".
   * Resolves when the re-INVITE request is sent, otherwise rejects.
   * Use `onCallHold` delegate method to determine if request is accepted or rejected.
   * See: https://tools.ietf.org/html/rfc6337
   */
  public hold(callid:string): Promise<void> {
    this.logger.log(`[${this.id}] holding session...`);
    return this.setHold(true,callid);
  }

  /**
   * Unhold call.
   * @remarks
   * Send a re-INVITE with new offer indicating "unhold".
   * Resolves when the re-INVITE request is sent, otherwise rejects.
   * Use `onCallHold` delegate method to determine if request is accepted or rejected.
   * See: https://tools.ietf.org/html/rfc6337
   */
  public unhold(callid:string): Promise<void> {
    this.logger.log(`[${this.id}] unholding session...`);
    return this.setHold(false,callid);
  }

  /**
   * Hold state.
   * @remarks
   * True if session media is on hold.
   */
  public isHeld(): boolean {
    return this.held;
  }

  /**
   * Mute call.
   * @remarks
   * Disable sender's media tracks.
   */
  public mute(callid:string): void {
    this.logger.log(`[${this.id}] disabling media tracks...`);
    this.setMute(true,callid);
  }

  /**
   * Unmute call.
   * @remarks
   * Enable sender's media tracks.
   */
  public unmute(callid:string): void {
    this.logger.log(`[${this.id}] enabling media tracks...`);
    this.setMute(false,callid);
  }

  /**
   * Mute state.
   * @remarks
   * True if sender's media track is disabled.
   */
  public isMuted(callid:string): boolean {
    const session =this.arrCalls.get(callid);
    if(session)
    {
      return session.muted;
    }
    return false;
  }

  /**
   * Send DTMF.
   * @remarks
   * Send an INFO request with content type application/dtmf-relay.
   * @param tone - Tone to send.
   */
  public sendDTMF(tone: string,callid:string): Promise<void> {
    this.logger.log(`[${this.id}] sending DTMF...`);

    // As RFC 6086 states, sending DTMF via INFO is not standardized...
    //
    // Companies have been using INFO messages in order to transport
    // Dual-Tone Multi-Frequency (DTMF) tones.  All mechanisms are
    // proprietary and have not been standardized.
    // https://tools.ietf.org/html/rfc6086#section-2
    //
    // It is however widely supported based on this draft:
    // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00

    // Validate tone
    if (!/^[0-9A-D#*,]$/.exec(tone)) {
      return Promise.reject(new Error("Invalid DTMF tone."));
    }

    const session =this.arrCalls.get(callid);
    if(session)
    {
      // The UA MUST populate the "application/dtmf-relay" body, as defined
      // earlier, with the button pressed and the duration it was pressed
      // for.  Technically, this actually requires the INFO to be generated
      // when the user *releases* the button, however if the user has still
      // not released a button after 5 seconds, which is the maximum duration
      // supported by this mechanism, the UA should generate the INFO at that
      // time.
      // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00#section-5.3
      this.logger.log(`[${this.id}] Sending DTMF tone: ${tone}`);
      const dtmf = tone;
      const duration = 2000;
      const body = {
        contentDisposition: "render",
        contentType: "application/dtmf-relay",
        content: "Signal=" + dtmf + "\r\nDuration=" + duration
      };
      const requestOptions = { body };

      return session.info({ requestOptions }).then(() => {
        return;
      });
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
    return Promise.resolve();
  }

  /**
   * Send a message.
   * @remarks
   * Send a MESSAGE request.
   * @param destination - The target destination for the message. A SIP address to send the MESSAGE to.
   */
  public message(destination: string, message: string): Promise<void> {
    this.logger.log(`[${this.id}] sending message...`);

    const target = UserAgent.makeURI(destination);
    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
    }
    return new Messager(this.userAgent, target, message).message();
  }
  public messageType(destination: string, message: string,contentType:string): Promise<void> {
    this.logger.log(`[${this.id}] sending message...`);

    const target = UserAgent.makeURI(destination);
    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
    }
    return new Messager(this.userAgent, target, message,contentType).message();
  }
  /** Media constraints. */
  private get constraints(): { audio: boolean; video: boolean } {
    let constraints = { audio: true, video: false }; // default to audio only calls
    if (this.options.media?.constraints) {
      constraints = { ...this.options.media.constraints };
    }
    return constraints;
  }

  /**
   * Attempt reconnection up to `maxReconnectionAttempts` times.
   * @param reconnectionAttempt - Current attempt number.
   */
  private attemptReconnection(reconnectionAttempt = 1): void {
    const reconnectionAttempts = this.options.reconnectionAttempts || 3;
    const reconnectionDelay = this.options.reconnectionDelay || 4;

    if (!this.connectRequested) {
      this.logger.log(`[${this.id}] Reconnection not currently desired`);
      return; // If intentionally disconnected, don't reconnect.
    }

    if (this.attemptingReconnection) {
      this.logger.log(`[${this.id}] Reconnection attempt already in progress`);
    }

    if (reconnectionAttempt > reconnectionAttempts) {
      this.logger.log(`[${this.id}] Reconnection maximum attempts reached`);
      return;
    }

    if (reconnectionAttempt === 1) {
      this.logger.log(`[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying`);
    } else {
      this.logger.log(
        `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying in ${reconnectionDelay} seconds`
      );
    }

    this.attemptingReconnection = true;

    setTimeout(
      () => {
        if (!this.connectRequested) {
          this.logger.log(
            `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - aborted`
          );
          this.attemptingReconnection = false;
          return; // If intentionally disconnected, don't reconnect.
        }
        this.userAgent
          .reconnect()
          .then(() => {
            this.logger.log(
              `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - succeeded`
            );
            this.attemptingReconnection = false;
          })
          .catch((error: Error) => {
            this.logger.log(
              `[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - failed`
            );
            this.logger.error(error.message);
            this.attemptingReconnection = false;
            this.attemptReconnection(++reconnectionAttempt);
          });
      },
      reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000
    );
  }

  /** Helper function to remove media from html elements. */
  private cleanupMedia(local?: SimpleUserMediaLocal,remote?: SimpleUserMediaRemote): void {
      if (local) {
        if (local.video) {
          local.video.srcObject = null;
          local.video.pause();
        }
      }
      if (remote) {
        if (remote.audio) {
          remote.audio.srcObject = null;
          remote.audio.pause();
        }
        if (remote.video) {
          remote.video.srcObject = null;
          remote.video.pause();
        }
      }
    
  }

  /** Helper function to enable/disable media tracks. */
  private enableReceiverTracks(enable: boolean,callid:string): void {
    const session =this.arrCalls.get(callid) ;
    if(session)
    {
      const sessionDescriptionHandler = session.sessionDescriptionHandler;
      if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
        throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
      }

      const peerConnection = sessionDescriptionHandler.peerConnection;
      if (!peerConnection) {
        throw new Error("Peer connection closed.");
      }

      peerConnection.getReceivers().forEach((receiver) => {
        if (receiver.track) {
          receiver.track.enabled = enable;
        }
      });
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
  }

  /** Helper function to enable/disable media tracks. */
  private enableSenderTracks(enable: boolean,callid:string): void {
    const session =this.arrCalls.get(callid) ;
    if(session)
    {
      const sessionDescriptionHandler = session.sessionDescriptionHandler;
      if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
        throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
      }

      const peerConnection = sessionDescriptionHandler.peerConnection;
      if (!peerConnection) {
        throw new Error("Peer connection closed.");
      }

      peerConnection.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.enabled = enable;
        }
      });
    }
  }

  /**
   * Setup session delegate and state change handler.
   * @param session - Session to setup
   * @param referralInviterOptions - Options for any Inviter created as result of a REFER.
   */
  private initSession(session: Session, referralInviterOptions?: InviterOptions): void {
    // Set session
    let sessionid=session?.id;
    this.logger.log(`[${this.id}] new session id is:`+ sessionid);
    // Call session created callback
    if (this.delegate && this.delegate.onCallCreated) {
      this.delegate.onCallCreated(sessionid);
    }

    // Setup session state change handler
    session.stateChange.addListener((info: SessionStateInfo) => {
      this.logger.log(`[${session.id}] session state changed to ${info.state} sid:`+info.sid);
      switch (info.state) {
        case SessionState.Initial:
          break;
        case SessionState.Establishing:
          break;
        case SessionState.Established:
          this.setupLocalMedia(info?.sessionDescriptionHandlerOptions?.local?.video,sessionid);
          this.setupRemoteMedia(info?.sessionDescriptionHandlerOptions?.remote?.video,info?.sessionDescriptionHandlerOptions?.remote?.audio,sessionid);
          if (this.delegate && this.delegate.onCallAnswered) {
            this.delegate.onCallAnswered(info.id,info.sid);
          }
          break;
        case SessionState.Terminating:
        // fall through
        case SessionState.Terminated:
          this.arrCalls.delete(info.id);
          this.cleanupMedia(info?.sessionDescriptionHandlerOptions?.local,info?.sessionDescriptionHandlerOptions?.remote);
          if (this.delegate && this.delegate.onCallHangup) {
            this.delegate.onCallHangup(info.id,info.sid);
          }
          break;
        default:
          throw new Error("Unknown session state.");
      }
    });

    // Setup delegate
    session.delegate = {
      onInfo: (info: Info): void => {
        // As RFC 6086 states, sending DTMF via INFO is not standardized...
        //
        // Companies have been using INFO messages in order to transport
        // Dual-Tone Multi-Frequency (DTMF) tones.  All mechanisms are
        // proprietary and have not been standardized.
        // https://tools.ietf.org/html/rfc6086#section-2
        //
        // It is however widely supported based on this draft:
        // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00

        // FIXME: TODO: We should reject correctly...
        //
        // If a UA receives an INFO request associated with an Info Package that
        // the UA has not indicated willingness to receive, the UA MUST send a
        // 469 (Bad Info Package) response (see Section 11.6), which contains a
        // Recv-Info header field with Info Packages for which the UA is willing
        // to receive INFO requests.
        // https://tools.ietf.org/html/rfc6086#section-4.2.2

        // No delegate
        if (this.delegate?.onCallDTMFReceived === undefined) {
          info.reject();
          return;
        }

        // Invalid content type
        const contentType = info.request.getHeader("content-type");
        if (!contentType || !/^application\/dtmf-relay/i.exec(contentType)) {
          info.reject();
          return;
        }

        // Invalid body
        const body = info.request.body.split("\r\n", 2);
        if (body.length !== 2) {
          info.reject();
          return;
        }

        // Invalid tone
        let tone: string | undefined;
        const toneRegExp = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/;
        if (toneRegExp.test(body[0])) {
          tone = body[0].replace(toneRegExp, "$2");
        }
        if (!tone) {
          info.reject();
          return;
        }

        // Invalid duration
        let duration: number | undefined;
        const durationRegExp = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;
        if (durationRegExp.test(body[1])) {
          duration = parseInt(body[1].replace(durationRegExp, "$2"), 10);
        }
        if (!duration) {
          info.reject();
          return;
        }

        info
          .accept()
          .then(() => {
            if (this.delegate && this.delegate.onCallDTMFReceived) {
              if (!tone || !duration) {
                throw new Error("Tone or duration undefined.");
              }
              this.delegate.onCallDTMFReceived(tone, duration);
            }
          })
          .catch((error: Error) => {
            this.logger.error(error.message);
          });
      },
      onRefer: (referral: Referral): void => {
        referral
          .accept()
          .then(() => this.sendInvite(referral.makeInviter(referralInviterOptions), referralInviterOptions))
          .catch((error: Error) => {
            this.logger.error(error.message);
          });
      }
    };
    this.arrCalls.set(session.id,session);
  }

  /** Helper function to init send then send invite. */
  private sendInvite(
    inviter: Inviter,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {
    // Initialize our session
    this.initSession(inviter, inviterOptions);

    // Clone options for safe keeping
    const options = { ...inviterInviteOptions };
    options.requestDelegate = { ...options.requestDelegate };

    // If utilizing early media, add a handler to catch 183 Session Progress
    // messages and then to play the associated remote media (the early media).
    if (inviterOptions?.earlyMedia) {
      const existingOnProgress = options.requestDelegate.onProgress;
      options.requestDelegate.onProgress = (response) => {
        if (response.message.statusCode === 183) {
          this.setupRemoteMedia(inviterOptions?.sessionDescriptionHandlerOptions?.remote?.video,inviterOptions?.sessionDescriptionHandlerOptions?.remote?.audio,inviter.id);
        }
        existingOnProgress && existingOnProgress(response);
      };
    }

    // Send the INVITE
    return inviter.invite(options).then(() => {
      this.logger.log(`[${this.id}] sent INVITE`);
    });
  }

  /**
   * Puts Session on hold.
   * @param hold - Hold on if true, off if false.
   */
  private setHold(hold: boolean,callid:string): Promise<void> {
    const session =this.arrCalls.get(callid) ;
    if(session)
    {
       // Just resolve if we are already in correct state
      if (this.held === hold) {
        return Promise.resolve();
      }

      const sessionDescriptionHandler = session.sessionDescriptionHandler;
      if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
        throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
      }

      const options: SessionInviteOptions = {
        requestDelegate: {
          onAccept: (): void => {
            this.held = hold;
            this.enableReceiverTracks(!this.held,callid);
            this.enableSenderTracks(!this.held && !session.muted,callid);
            if (this.delegate && this.delegate.onCallHold) {
              this.delegate.onCallHold(callid,this.held);
            }
          },
          onReject: (): void => {
            this.logger.warn(`[${this.id}] re-invite request was rejected`);
            this.enableReceiverTracks(!this.held,callid);
            this.enableSenderTracks(!this.held && !session.muted,callid);
            if (this.delegate && this.delegate.onCallHold) {
              this.delegate.onCallHold(callid,this.held);
            }
          }
        }
      };

      // Session properties used to pass options to the SessionDescriptionHandler:
      //
      // 1) Session.sessionDescriptionHandlerOptions
      //    SDH options for the initial INVITE transaction.
      //    - Used in all cases when handling the initial INVITE transaction as either UAC or UAS.
      //    - May be set directly at anytime.
      //    - May optionally be set via constructor option.
      //    - May optionally be set via options passed to Inviter.invite() or Invitation.accept().
      //
      // 2) Session.sessionDescriptionHandlerOptionsReInvite
      //    SDH options for re-INVITE transactions.
      //    - Used in all cases when handling a re-INVITE transaction as either UAC or UAS.
      //    - May be set directly at anytime.
      //    - May optionally be set via constructor option.
      //    - May optionally be set via options passed to Session.invite().

      const sessionDescriptionHandlerOptions =
        session.sessionDescriptionHandlerOptionsReInvite as SessionDescriptionHandlerOptions;
      sessionDescriptionHandlerOptions.hold = hold;
      session.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;

      // Send re-INVITE
      return session
        .invite(options)
        .then(() => {
          // preemptively enable/disable tracks
          this.enableReceiverTracks(!hold,callid);
          this.enableSenderTracks(!hold && !session.muted,callid);
        })
        .catch((error: Error) => {
          if (error instanceof RequestPendingError) {
            this.logger.error(`[${this.id}] A hold request is already in progress.`);
          }
          throw error;
        });
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
    return Promise.resolve();
  }
  /**
   * Puts Session on mute.
   * @param mute - Mute on if true, off if false.
   */
  private setMute(mute: boolean,callid:string): void {
    const session =this.arrCalls.get(callid) ;
    if(session)
    {
      if (session.state !== SessionState.Established) {
        this.logger.warn(`[${this.id}] An established session is required to enable/disable media tracks`);
        return;
      }

      session.muted = mute;

      this.enableSenderTracks(!this.held && !session.muted,callid);
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
  }

  /** Helper function to attach local media to html elements. */
  private setupLocalMedia(mediaElement:HTMLVideoElement|undefined,callid:string): void {
    const session =this.arrCalls.get(callid) ;
    if(session)
    {
      if (mediaElement) {
        const localStream = this.getlocalMediaStream(session);
        if (!localStream) {
          throw new Error("Local media stream undefiend.");
        }
        mediaElement.srcObject = localStream;
        mediaElement.volume = 0;
        mediaElement.play().catch((error: Error) => {
          this.logger.error(`[${this.id}] Failed to play local media`);
          this.logger.error(error.message);
        });
      }
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
  }

  /** Helper function to attach remote media to html elements. */
  private setupRemoteMedia(videoElement:HTMLVideoElement|undefined,audioElement:HTMLAudioElement|undefined,callid:string): void {

    const session =this.arrCalls.get(callid) ;
    if(session)
    {
      const mediaElement = videoElement || audioElement;

      if (mediaElement) {
        const remoteStream = this.getremoteMediaStream(session);
        if (!remoteStream) {
          throw new Error("Remote media stream undefiend.");
        }
        mediaElement.autoplay = true; // Safari hack, because you cannot call .play() from a non user action
        mediaElement.srcObject = remoteStream;
        mediaElement.play().catch((error: Error) => {
          this.logger.error(`[${this.id}] Failed to play remote media`);
          this.logger.error(error.message);
        });
        remoteStream.onaddtrack = (): void => {
          this.logger.log(`[${this.id}] Remote media onaddtrack`);
          mediaElement.load(); // Safari hack, as it doesn't work otheriwse
          mediaElement.play().catch((error: Error) => {
            this.logger.error(`[${this.id}] Failed to play remote media`);
            this.logger.error(error.message);
          });
        };
      }
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
  }

  /**
   * End a session.
   * @remarks
   * Send a BYE request, CANCEL request or reject response to end the current Session.
   * Resolves when the request/response is sent, otherwise rejects.
   * Use `onCallTerminated` delegate method to determine if and when Session is terminated.
   */
  private terminate(callid:string): Promise<void> {
    this.logger.log(`[${this.id}] Terminating...`);

    const session =this.arrCalls.get(callid) ;
    if(session)
    {
      switch (session.state) {
        case SessionState.Initial:
          if (session instanceof Inviter) {
            return session.cancel().then(() => {
              this.logger.log(`[${this.id}] Inviter never sent INVITE (canceled)`);
            });
          } else if (session instanceof Invitation) {
            return session.reject().then(() => {
              this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
            });
          } else {
            throw new Error("Unknown session type.");
          }
        case SessionState.Establishing:
          if (session instanceof Inviter) {
            return session.cancel().then(() => {
              this.logger.log(`[${this.id}] Inviter canceled (sent CANCEL)`);
            });
          } else if (session instanceof Invitation) {
            return session.reject().then(() => {
              this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
            });
          } else {
            throw new Error("Unknown session type.");
          }
        case SessionState.Established:
          return session.bye().then(() => {
            this.logger.log(`[${this.id}] Session ended (sent BYE)`);
          });
        case SessionState.Terminating:
          break;
        case SessionState.Terminated:
          break;
        default:
          throw new Error("Unknown state");
      }

      this.logger.log(`[${this.id}] Terminating in state ${session.state}, no action taken`);
    }
    else
    {
      this.logger.error(`[${this.id}] can not find call by callid:`+callid);
    }
    return Promise.resolve();
  }
}
