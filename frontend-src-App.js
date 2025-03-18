import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: input }]);

    // Send message to backend
    const response = await axios.post("http://localhost:5000/chat", {
      message: input,
    });

    // Add AI reply to chat
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: response.data.reply },
    ]);

    // Clear input
    setInput("");
  };

  const recordAudio = async () => {
    setIsListening(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob);

      // Send audio to backend for transcription
      const response = await axios.post("http://localhost:5000/speech-to-text", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInput(response.data.transcript);
      setIsListening(false);
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
  };

  const speak = async (text) => {
    const response = await axios.post(
      "http://localhost:5000/text-to-speech",
      { text },
      { responseType: "blob" }
    );
    const audioUrl = URL.createObjectURL(response.data);
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div style={styles.container}>
      <h1>AI Assistant</h1>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.message(msg.role)}>
            {msg.content}
            {msg.role === "assistant" && (
              <button onClick={() => speak(msg.content)} style={styles.speakButton}>
                🔊
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
        <button onClick={recordAudio} style={styles.voiceButton}>
          {isListening ? "🎤 Listening..." : "🎤"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  chatBox: {
    height: "400px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "10px",
    overflowY: "scroll",
    marginBottom: "20px",
    backgroundColor: "#f9f9f9",
  },
  message: (role) => ({
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "10px",
    backgroundColor: role === "user" ? "#e1f5fe" : "#f5f5f5",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    maxWidth: "70%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }),
  inputContainer: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#4CAF50",
    color: "white",
    cursor: "pointer",
  },
  voiceButton: {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#2196F3",
    color: "white",
    cursor: "pointer",
  },
  speakButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default App;
