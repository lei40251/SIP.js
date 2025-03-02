import { MediaStreamFactory } from "./media-stream-factory.js";
import { SessionDescriptionHandlerOptions } from "./session-description-handler-options.js";
import { SessionDescriptionHandler } from "./session-description-handler.js";
/**
 * Function which returns a MediaStreamFactory.
 * @public
 */
export function defaultMediaStreamFactory(): MediaStreamFactory {
  return (constraints: MediaStreamConstraints, sessionDescriptionHandler: SessionDescriptionHandler,
    options?: SessionDescriptionHandlerOptions): Promise<MediaStream> => {
   
    // if no audio or video, return a media stream without tracks
    if (!constraints.audio && !constraints.video) {
      return Promise.resolve(new MediaStream());
    }
    // getUserMedia() is a powerful feature which can only be used in secure contexts; in insecure contexts,
    // navigator.mediaDevices is undefined, preventing access to getUserMedia(). A secure context is, in short,
    // a page loaded using HTTPS or the file:/// URL scheme, or a page loaded from localhost.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Privacy_and_security
    if (navigator.mediaDevices === undefined) {
      return Promise.reject(new Error("Media devices not available in insecure contexts."));
    }
    //ygh thechange getMediaStream
    //console.log("defaultMediaStreamFactory isshowscreen:"+options?.isshowscreen);
    if(options?.isshowscreen)
    {
      if (navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia({audio:true,video: true});
      } 
      /**
      else {
        return navigator.mediaDevices.getUserMedia({audio:true,video: {mediaSource:'screen'}});
      }
       */
    }
   
    return navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints);
  };
}
