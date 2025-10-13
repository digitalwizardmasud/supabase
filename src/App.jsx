import "./App.css";

import { useEffect, useRef, useState, } from "react";
import supabase from "./libs/supabase";
import { useSearchParams } from "react-router-dom";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const channelRef = useRef(null);
  const [searchParams] = useSearchParams();
  const channel = searchParams.get("channel") || "test-channel"
  
  useEffect(() => {
    channelRef.current = supabase.channel(channel);
    function messageReceived(data) {
      setMessages((prevMessages) => [...prevMessages, data.payload.message]);
    }
    channelRef.current
      .on(
        "broadcast",
        { event: "shout" }, // Listen for "shout". Can be "*" to listen to all events
        (payload) => messageReceived(payload)
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          setIsSubscribed(true);
        }
      })

    return () => {
      channelRef.current.unsubscribe();
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    setMessages([...messages, input]);
    
    channelRef.current.send({
      type: "broadcast",
      event: "shout",
      payload: { message: input },
    });
    setInput("");
    
  };

  return (
    <div
      className="chat-container"
      style={{
        maxWidth: 400,
        margin: "40px auto",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 24,
        background: "#fff",
        boxShadow: "0 2px 8px #eee",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>Simple Chat</h2>
      <div
        className="chat-messages"
        style={{
          minHeight: 180,
          marginBottom: 16,
          overflowY: "auto",
          background: "#f9f9f9",
          borderRadius: 6,
          padding: 12,
          border: "1px solid #eee",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: "#aaa", textAlign: "center" }}>
            No messages yet.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 8,
                padding: 8,
                background: "#e3f2fd",
                borderRadius: 4,
              }}
            >
              {msg}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            background: "#1976d2",
            color: "#fff",
            border: "none",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
