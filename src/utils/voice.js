import OpenAI from "openai";
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});
// Automatically start recording when user talks, stop when silent
const transcribeAudio = async (audioBlob) => {
  const startTime = Date.now();
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "gpt-4o-transcribe");
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorText}`
      );
    }
    const data = await response.json();
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    console.log("Received transcription:", data.text);
    console.log(`transcribeAudio duration: ${durationMs.toFixed(2)} ms`);
    return data.text;
  } catch (err) {
    console.error("Error transcribing audio:", err);
    throw err;
  }
};

export const getAnswer = async(prompt, speak) => {
  const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini", // or "gpt-4"
            messages: [
                { role: "system", content: "You are a helpful assistant. You will answer shortly and concisely." },
                { role: "user", content: prompt }
            ],
        })
    });

    const data = await response.json();
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    console.log(`getAnswer duration: ${durationMs.toFixed(2)} ms`);
    await speak(data.choices[0].message.content.trim())
}


async function autoVoiceRecorder(speak = speak) {
  // Ask for microphone access
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  let audioChunks = [];
  let recording = false;

  // Set up audio analysis for voice activity detection
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  const dataArray = new Uint8Array(analyser.fftSize);
  source.connect(analyser);

  let silenceStart = Date.now();
  const SILENCE_THRESHOLD = 10; // Adjust for sensitivity (lower = more sensitive)
  const SILENCE_DURATION = 1500; // ms to stop after silence

  // Handle recorded chunks
  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log("Recording stopped. Audio URL:", audioUrl);
    audioChunks = [];

    // TODO : Transcribe and speak
    const startTime = Date.now();
    const text = await transcribeAudio(audioBlob);
    await getAnswer(text, speak);
    // await speak(answer);
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    console.log(`Total processing time: ${durationMs.toFixed(2)} ms`);
  };

  // Monitor microphone levels to detect talking vs silence
  function detectVoice() {
    analyser.getByteFrequencyData(dataArray);
    const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    if (avgVolume > SILENCE_THRESHOLD) {
      // User is speaking
      silenceStart = Date.now();
      if (!recording) {
        console.log("🎤 Voice detected, recording started...");
        audioChunks = [];
        mediaRecorder.start();
        recording = true;
      }
    } else {
      // Silence detected
      if (recording && Date.now() - silenceStart > SILENCE_DURATION) {
        console.log("🔇 Silence detected, stopping recording...");
        mediaRecorder.stop();
        recording = false;
      }
    }

    requestAnimationFrame(detectVoice);
  }

  detectVoice();
}

export default autoVoiceRecorder;
