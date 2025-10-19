import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";
import React, { useEffect, useRef, useState } from "react";
import autoVoiceRecorder from "../utils/voice";
const InteractiveAvatar = () => {
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const avatar = useRef("avatar");
  const videoRef = useRef("video-ref");
  const [messages, setMessages] = useState([]);
  const createToken = async () => {
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": import.meta.env.VITE_HEYGEN,
      },
      body: JSON.stringify({}),
    };

    return fetch("https://api.heygen.com/v1/streaming.create_token", options)
      .then((res) => res.json())
      .then((data) => {
        return data.data.token;
      })
      .catch((err) => console.error("error:" + err));
  };

  const startSession = async () => {
    try{
      const token = await createToken();
    console.log("Token Data:", token);
    avatar.current = new StreamingAvatar({
      token: token,
    });

    avatar.current.on(StreamingEvents.STREAM_READY, async(event) => {
      console.log("stream ready:", event);
      // You can display the message in the UI
      videoRef.current.srcObject = event.detail;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(console.error);
      };
       setMessages([])
    });

    // Calculate Response Time
    let startTime = 0;
    let endTime = 0;
    avatar.current.on(StreamingEvents.USER_END_MESSAGE, () => {
      startTime = Date.now();
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
      endTime = Date.now();
      const durationMs = endTime - startTime;
      console.log(`Avatar talking duration: ${durationMs.toFixed(2)} ms`);
    });

    // Collect All Message Data 
    
    let temp_avatar_messages = [];
    avatar.current.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
      temp_avatar_messages.push(event.detail.message);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      setMessages(prevMessages => [...prevMessages, {type: "avatar_talking", messages: temp_avatar_messages.join(" ")}]);
      temp_avatar_messages = []
    });
    avatar.current.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
      setMessages(prevMessages => [...prevMessages, {type: "user_talking", messages: event.detail.message}])
    });

    const sessionData = await avatar.current.createStartAvatar({
      avatarName: "Silas_CustomerSupport_public",
      quality: AvatarQuality.Low,
      language: "english",
      voice: {
        voiceId: "1DgknvcSIG0FSUMS8HTI",
      },
      knowledgeBase: `
      You are Masud. You will answer about yourself based on the following information:
      - I am a software developer specializing in web and mobile applications.
      - I have experience with React, Node.js, and Python.
      - I enjoy learning new technologies and improving my coding skills.
      - In my free time, I like to read tech blogs and contribute to open source projects.
      - I am passionate about building user-friendly and efficient software solutions.


      You will stop talking immediately when user started talking
      `,
    });
    setSessionId(sessionData.session_id);
    console.log("Session started:", sessionData);
    if(sessionData.session_id){
      await avatar.current.startVoiceChat({
        useSilencePrompt: false,
      });
    }
    }catch(error){
      console.error("Error starting session:", error);
    }
  };

  async function terminateAvatarSession() {
    if (!avatar.current || !sessionId) return;
    await avatar?.current?.stopAvatar();
    if(avatar?.current) { avatar.current = null }
    if(videoRef?.current) { videoRef.current.srcObject = null; }
    console.log("Avatar session terminated.", messages);
  }

  const speak = async (text) => {
    if (avatar.current == null || sessionId == null) return;
    const result = await avatar.current.speak({
      sessionId: sessionId,
      text: text,
      task_type: TaskType.REPEAT,
    });
    console.log("Speak result:", result);
  };

  async function startVoiceChat() {
    if (!avatar.current) return;
    try {
      await avatar.current.startVoiceChat({
        useSilencePrompt: false,
      });
      // await speak()
    } catch (error) {
      console.error("Error starting voice chat:", error);
    }
  }
  // async function startVoiceChat() {
  //   autoVoiceRecorder(speak)
  // }
  return (
    <div>
      <button
        className="cursor-pointer w-100 bg-green-100 py-2 hover:bg-green-200"
        onClick={startSession}
      >
        start
      </button>
      <div className="mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border w-full py-2"
        />
      </div>
      <div className="flex gap-5 m-2">
        <button
          className="bg-green-200 px-4 py-1 rounded cursor-pointer"
          onClick={startVoiceChat}
        >
          Start Voice Chat
        </button>
        <button
          className="bg-red-200 px-4 py-1 rounded cursor-pointer"
          onClick={async()=>await terminateAvatarSession()}
        >
          Terminate
        </button>
      </div>

      <div className="mb-2">
        <video
          ref={(el) => {
            videoRef.current = el;
          }}
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
};

export default InteractiveAvatar;
