import React from "react";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  CallControls,
  CallingState,
} from "@stream-io/video-react-sdk";

const StreamVideoCall = ({ apiKey, userId, userName, callId, token, onLeave }) => {
  const client = React.useMemo(
    () =>
      new StreamVideoClient({
        apiKey,
        user: { id: userId, name: userName },
        token,
      }),
    [apiKey, userId, userName, token]
  );

  const call = React.useMemo(() => client.call("default", callId), [client, callId]);

  React.useEffect(() => {
    call.join();
    return () => call.leave();
  }, [call]);

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        <StreamCall call={call}>
          <CallingState />
          <CallControls onLeave={onLeave} />
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};

export default StreamVideoCall;