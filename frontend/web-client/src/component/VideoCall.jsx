import React, { useRef, useEffect, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from "react-icons/fa";

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
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-screen bg-gray-900 p-4 sm:p-8 overflow-hidden">
      {/* Remote Video */}
      <div className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] bg-black rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300">
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-full h-full object-cover rounded-2xl"
        />
        <span className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-sm sm:text-base font-semibold px-3 py-1 rounded-lg animate-slide-in">
          {remoteUserName || "Remote User"}
        </span>
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
            <p className="text-white text-lg sm:text-xl font-medium">Waiting for remote video...</p>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute bottom-4 right-4 w-32 sm:w-48 h-24 sm:h-36 bg-black rounded-xl overflow-hidden shadow-lg border-4 border-gray-700 animate-slide-in">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-full h-full object-cover rounded-xl"
        />
        <span className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs sm:text-sm font-semibold px-2 py-1 rounded">
          {localUserName || "You"}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-4 sm:bottom-8 flex gap-4 sm:gap-6">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-110 ${
            isMicMuted ? "bg-red-500" : "bg-gray-700"
          }`}
          title={isMicMuted ? "Unmute" : "Mute"}
        >
          {isMicMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        </button>
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-110 ${
            isCameraOff ? "bg-red-500" : "bg-gray-700"
          }`}
          title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isCameraOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
        </button>
        <button
          onClick={onEndCall}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-red-600 text-white shadow-lg transition-all duration-300 transform hover:scale-110"
          title="End Call"
        >
          <FaPhoneSlash size={20} />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
