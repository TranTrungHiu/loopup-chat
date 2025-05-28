import React, { useEffect, useMemo, useState } from "react";
import {
  StreamVideoClient,
  StreamCall,
  StreamCallProvider,
  StreamVideo,
  CallParticipantsList,
} from "@stream-io/video-react-sdk";

const StreamVideoCall = ({ apiKey, userId, userName, token, callId, onLeave }) => {
  const [call, setCall] = useState(null);

  // Khởi tạo client chỉ với apiKey
  const client = useMemo(() => new StreamVideoClient({ apiKey }), [apiKey]);

  // Kết nối user khi token thay đổi
  useEffect(() => {
    let isMounted = true;
    const connect = async () => {
      if (client && userId && token) {
        await client.connectUser({ id: userId, name: userName }, token);
        if (!isMounted) return;
        const callInstance = client.call("default", callId);
        await callInstance.join();
        if (isMounted) setCall(callInstance);
      }
    };
    connect();
    return () => {
      isMounted = false;
      if (call) call.leave();
      client.disconnectUser();
    };
    // eslint-disable-next-line
  }, [client, userId, userName, token, callId]);

  if (!call) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: "40vh" }}>
        Đang kết nối cuộc gọi...
      </div>
    );
  }

  return (
    <StreamCallProvider call={call}>
      <div style={{ width: "100vw", height: "100vh", background: "#222" }}>
        <StreamCall>
          <StreamVideo />
          <CallParticipantsList />
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 1000,
              background: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px"
            }}
            onClick={onLeave}
          >
            Rời cuộc gọi
          </button>
        </StreamCall>
      </div>
    </StreamCallProvider>
  );
};

export default StreamVideoCall;