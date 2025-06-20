import React, { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";

const VoiceRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voice-message.webm", {
          type: "audio/webm",
        });

        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const duration = audioBuffer.duration;

        const audioURL = URL.createObjectURL(blob);
        onRecordingComplete(file, audioURL, duration);

        chunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied or error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex justify-end pr-1">
      {!isRecording ? (
        <Mic
          onClick={startRecording}
          className="w-6 h-6 text-purple-600 cursor-pointer hover:text-purple-800 transition-colors"
          title="Start Recording"
        />
      ) : (
        <Square
          onClick={stopRecording}
          className="w-6 h-6 text-red-500 cursor-pointer hover:text-red-700 transition-colors animate-pulse"
          title="Stop Recording"
        />
      )}
    </div>
  );
};

export default VoiceRecorder;
