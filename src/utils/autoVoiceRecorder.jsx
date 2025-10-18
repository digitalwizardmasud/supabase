import { useState, useRef, useCallback, useEffect } from "react";

function useAutoVoiceRecorder({
  silenceThreshold = 50,
  silenceDuration = 500,
} = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceStartRef = useRef(Date.now());
  const animationFrameRef = useRef(null);
  const isActiveRef = useRef(false);

  // Voice detection loop
  const detectVoice = useCallback(() => {
    if (
      !analyserRef.current ||
      !mediaRecorderRef.current ||
      !isActiveRef.current
    ) {
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    if (avgVolume > silenceThreshold) {
      // Voice detected
      silenceStartRef.current = Date.now();

      if (mediaRecorderRef.current.state === "inactive") {
        console.log("🎤 Voice detected, recording started...");
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    } else {
      // Silence detected
      if (
        mediaRecorderRef.current.state === "recording" &&
        Date.now() - silenceStartRef.current > silenceDuration
      ) {
        console.log("🔇 Silence detected, stopping recording...");
        mediaRecorderRef.current.stop();
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectVoice);
  }, [silenceThreshold, silenceDuration]);

  // Start Transcribing
  const transcribeAudio = useCallback(async (audioBlob) => {
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
      setTranscription(data.text);
      console.log(`transcribeAudio duration: ${durationMs.toFixed(2)} ms`);
      return data;
    } catch (err) {
      console.error("Error transcribing audio:", err);
      throw err;
    }
  }, []);

  // Start function
  const start = useCallback(async () => {
    try {
      setError(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Set up audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Handle recorded data
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log("Recording stopped. Audio URL:", url);
        audioChunksRef.current = [];
        setIsRecording(false);
        transcribeAudio(audioBlob);
      };

      isActiveRef.current = true;
      detectVoice();

      console.log("✅ Auto voice recorder started");
    } catch (err) {
      setError(err.message);
      console.error("Failed to start recorder:", err);
    }
  }, []);

  // Stop function
  const stop = useCallback(() => {
    isActiveRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    console.log("⏹️ Auto voice recorder stopped");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [stop, audioUrl]);

  return {
    isRecording,
    audioUrl,
    error,
    start,
    stop,
    transcription,
  };
}

export default useAutoVoiceRecorder;
