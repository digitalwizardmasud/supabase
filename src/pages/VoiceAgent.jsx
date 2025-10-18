import { useEffect, useRef, useState } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  OpenAIRealtimeWebRTC,
  tool
} from "@openai/agents/realtime";
import { fileSearchTool } from "@openai/agents";
import { z } from "zod";

const systemprompt = `
You are Supabot, You will act like a interviewer. Keep the question and answer short and simple. You will ask the user 2 questions one by one, about the below resume. After asking each question, wait for the user's answer. then call answer_detector and then proceed to ask the next question. After all 2 questions have been asked and answered, conclude the interview with "Thank you for participating in the interview."

Resume:
MD MASUD RANA
Full-stack Developer & AI Agent Specialist
Gaibandha District, Rangpur Division, Bangladesh

Here is the context: 
Contact
8801879866005 (Mobile)
masud.web.developer@gmail.c
om
www.linkedin.com/in/dwmasud
(LinkedIn)
MD MASUD RANA
Full-stack Developer & AI Agent Specialist
Gaibandha District, Rangpur Division, Bangladesh
Top Skills
AI Agents
ExpressJS
MongoDB
Summary
I am Masud, a full-stack developer specializing in Custom website
development, AI development, Web Animation and Responsive
Design. I have been a Full-time web developer since 2020. I build
custom solutions and make idea to business.
Certifications
Money Management
Experience
wesualy
1 year 1 month
Senior Fullstack Developer & AI Specialist
November 2024 - Present (1 year)
Full Stack developer and AI Specialist
October 2024 - Present (1 year 1 month)
Baumkirchen, Tyrol, Austria
I played a key role in developing AI-driven features and SaaS solutions,
working across both frontend and backend development to create innovative
user experiences.
✨ Key Responsibilities:
Frontend Development: Building and optimizing user interfaces for smooth and
interactive experiences.
Backend Development: Developing APIs, managing databases, and creating
core application logic.
Deployment & Maintenance: Ensuring seamless deployment processes and
providing ongoing maintenance for uptime and performance.
AI Feature Integration: Integrating advanced AI tools for Text-to-Image, Image
Enhancement, 2D-to-3D Conversion, and Image-to-Motion to create dynamic,
engaging content.
Page 1 of 3
SaaS Solutions: Designing and implementing scalable SaaS applications to
support business growth and user needs.
User & Token Management: Handling secure user management and token
management systems to ensure a safe and functional environment for users.
My work helped empower users with powerful AI tools and innovative features,
delivering creative and functional solutions through scalable architecture and
reliable performance.
Fiverr
2 years 7 months
Full Stack Engineer & AI Agents Specialist
May 2024 - Present (1 year 6 months)
Full-Stack Developer | AI Integration Specialist
Building smart, scalable web solutions that deliver qualitiful results.
I specialize in developing full-stack applications using the MERN stack
(MongoDB, Express.js, React, Node.js) and Python Flask, with a growing
focus on AI integration to enhance user experience and automate business
processes.
On Fiverr, I’ve worked with clients worldwide, delivering high-quality projects
that combine clean architecture with intelligent features — from chatbots
and automation tools to AI-powered image, video, 3d, motion and Agent
applications.
What I do:
Full-Stack Web Development and Deployment (Frontend, Backend, Devops)
REST APIs & Database Design
AI/ML Integration using OpenAI, LangChain, Gemini, Claude, Agno and more
Scalable, production-ready web apps with admin dashboard
Page 2 of 3
Always learning, always building — let’s connect and create something
amazing!
Full Stack Developer (Level 2)
February 2024 - Present (1 year 9 months)
Promoted to Level 2
Full-stack Developer (Level 1)
August 2023 - Present (2 years 3 months)
Promoted to Level 1
Full-stack Developer
April 2023 - Present (2 years 7 months)
Started Journey
Education
BRAC University, Dhaka
Bachelor of Science - BSc, Computer Engineering · (January 2023 - December
2026)
freeCodeCamp
Computer Software Engineering
`

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
