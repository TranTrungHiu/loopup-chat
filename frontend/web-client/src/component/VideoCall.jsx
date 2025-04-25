import React, { useRef, useEffect, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from "react-icons/fa";
import "./styles/VideoCall.css";

const VideoCall = ({ localStream, remoteStream, localUserName, remoteUserName, onEndCall }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicMuted;
      });
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isMicMuted, isCameraOff, localStream]);

  const toggleMic = () => {
    setIsMicMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    setIsCameraOff((prev) => !prev);
  };

  return (
    <div className="video-call-container">
      {/* Video Row */}
      <div className="video-row">
        {/* Remote Video */}
        <div className="video-wrapper">
          <video ref={remoteVideoRef} autoPlay className="remote-video" />
          <span className="video-label">{remoteUserName || "Remote User"}</span>
          {!remoteStream && (
            <div className="remote-placeholder">
              <p>Waiting for remote video...</p>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="video-wrapper">
          <video ref={localVideoRef} autoPlay muted className="local-video" />
          <span className="video-label">{localUserName || "You"}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="control-buttons">
        <button
          onClick={toggleMic}
          className={`control-btn ${isMicMuted ? "mic-muted" : "mic-active"}`}
          title={isMicMuted ? "Unmute" : "Mute"}
        >
          {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button
          onClick={toggleCamera}
          className={`control-btn ${isCameraOff ? "camera-off" : "camera-on"}`}
          title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isCameraOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button
          onClick={onEndCall}
          className="control-btn end-call"
          title="End Call"
        >
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;