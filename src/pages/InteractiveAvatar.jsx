import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";
import React, { useEffect, useRef, useState } from "react";
import useAutoVoiceRecorder from "../utils/autoVoiceRecorder";
import autoVoiceRecorder from "../utils/voice";
const InteractiveAvatar = () => {
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const avatar = useRef("avatar");
  const videoRef = useRef("video-ref");
  const { start, stopRecording, isRecording, transcription } =
    useAutoVoiceRecorder();

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
    const token = await createToken();
    console.log("Token Data:", token);
    avatar.current = new StreamingAvatar({
      token: token,
    });

    
    avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
      console.log("stream ready:", event);
      // You can display the message in the UI
      videoRef.current.srcObject = event.detail;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(console.error);
      };
    });


    let startTime = 0;
    let endTime = 0;
    avatar.current.on(StreamingEvents.USER_END_MESSAGE, (event) => {
      startTime = Date.now();
      console.log("Avatar start talking:", event);
    });

    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
      endTime = Date.now();
      const durationMs = endTime - startTime;
      console.log(`Avatar talking duration: ${durationMs.toFixed(2)} ms`);
    });
    

  

    const sessionData = await avatar.current.createStartAvatar({
      avatarName: "Judy_Teacher_Standing_public",
      quality: AvatarQuality.Low,
      language: "english",
      knowledgeBase: `
      You are Masud. You will answer about yourself based on the following information:
      - I am a software developer specializing in web and mobile applications.
      - I have experience with React, Node.js, and Python.
      - I enjoy learning new technologies and improving my coding skills.
      - In my free time, I like to read tech blogs and contribute to open source projects.
      - I am passionate about building user-friendly and efficient software solutions.
      `,
    });
    setSessionId(sessionData.session_id);
    console.log("Session started:", sessionData);
  };

  async function terminateAvatarSession() {
    if (!avatar.current || !sessionId) return;
    await avatar.current.stopAvatar();
    videoRef.current.srcObject = null;
    avatar.current = null;
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

  useEffect(() => {
    // const runSpeak = async () => {
    //   await speak(transcription);
    // };
    // if (transcription && avatar.current) {
    //   runSpeak();
    // }
  }, []);

  async function startVoiceChat() {
    if (!avatar.current) return;
    try {
      await avatar.current.startVoiceChat({
        useSilencePrompt: false,
      });
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
          Speak
        </button>
        <button
          className="bg-red-200 px-4 py-1 rounded cursor-pointer"
          onClick={terminateAvatarSession}
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
