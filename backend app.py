from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import texttospeech

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Set your OpenAI API key
openai.api_key = "your-openai-api-key"

# Google Cloud credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/your/google-credentials.json"

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message")
    
    # Call OpenAI GPT-4
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": user_input},
        ],
    )
    
    # Extract the AI's reply
    ai_reply = response["choices"][0]["message"]["content"]
    return jsonify({"reply": ai_reply})

@app.route("/speech-to-text", methods=["POST"])
def speech_to_text():
    audio_file = request.files["audio"]
    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(content=audio_file.read())
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code="en-US",
    )
    response = client.recognize(config=config, audio=audio)
    transcript = response.results[0].alternatives[0].transcript
    return jsonify({"transcript": transcript})

@app.route("/text-to-speech", methods=["POST"])
def text_to_speech():
    text = request.json.get("text")
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Wavenet-D",
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
    )
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config,
    )
    return response.audio_content, 200, {"Content-Type": "audio/mp3"}

if __name__ == "__main__":
    app.run(debug=True)
