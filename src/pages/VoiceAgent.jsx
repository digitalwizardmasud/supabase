import { useEffect, useRef, useState } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
  tool
} from "@openai/agents/realtime";
import { fileSearchTool } from "@openai/agents";
import systemprompt from "./systemprompt";
import { z } from "zod";

const answerDetector = tool({
  name: 'answer_detector',
  description: 'After asking question wait for the user answer, then Validate the answer and mark it out of 10',
  parameters: z.object({ question: z.string(), user_answered: z.string(), actual_answer: z.string(), mark: z.number() }),
  async execute({ question, user_answered, actual_answer, mark }) {
    console.log({ question, user_answered, actual_answer, mark });
  },
});

function VoiceAgent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const session = useRef(null);
  const OPENAI_API_KEY = `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`;
  session.current?.on("audio", (event) => {
    // play your audio
    console.log(audio, "audio");
    const audioBlob = new Blob([event.audio], { type: "audio/wav" }); // adjust type if needed
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    setMessages((prev) => [...prev, input]);
    if(session.current){
      session.current.sendMessage(input);
    }
    setInput("");
  };

  const connectSession = async () => {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: OPENAI_API_KEY,
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
          },
        }),
      }
    );

    const { value: empheral_key } = await response.json();

    const agent = new RealtimeAgent({ name: "My agent", instructions: systemprompt, tools : [answerDetector] });
    const transport = new OpenAIRealtimeWebRTC({
      mediaStream: await navigator.mediaDevices.getUserMedia({ audio: true }),
      audioElement: document.createElement("audio"),
    });
    session.current = new RealtimeSession(agent, {
      transport,
      model: "gpt-realtime",
      config: {
        turnDetection: {
          type: "semantic_vad",
          eagerness: "medium",
          createResponse: true,
          interruptResponse: true,
        },
      },
    });
    await session.current.connect({ apiKey: empheral_key });
  };

  const cutTheCall = async() => {
     if (session?.current?.transport) {
        await session.current.transport.close();
        session.current = null;
    }
  };
  return (
    <div className="flex justify-center items-center flex-col mt-20 max-w-[300px] m-auto">
      <form onSubmit={handleSubmit} className="flex justify-between w-full">
        <input
          className="border px-2 rounded mr-2 flex-1 py-1"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="write .."
        />
        <button type="submit" className="bg-green-100 px-3 rounded">
          send
        </button>
      </form>
      <div className="w-full mt-4 flex gap-4">
        <button
          className=" cursor-pointer bg-green-100 w-full rounded text-sm py-2 "
          onClick={connectSession}
        >
          Connect Session
        </button>
        <button
          className="cursor-pointer bg-red-200 w-full rounded text-sm py-2 "
          onClick={cutTheCall}
        >
          End Session
        </button>
      </div>
    </div>
  );
}

export default VoiceAgent;
