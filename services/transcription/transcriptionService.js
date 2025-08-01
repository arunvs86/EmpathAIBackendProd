import fetch from "node-fetch";
import FormData from "form-data";

class TranscriptionService {
  constructor() {
    if (!process.env.LEMONFOX_API_KEY) {
      throw new Error("Missing LEMONFOX_API_KEY in env");
    }
    this.apiKey = process.env.LEMONFOX_API_KEY;
    this.endpoint = "https://api.lemonfox.ai/v1/audio/transcriptions";
  }

  async transcribe(audioUrl) {
    // build the form-data body
    const form = new FormData();
    form.append("file", audioUrl);
    form.append("response_format", "json");

    const resp = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
      body: form
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("Lemonfox error:", resp.status, body);
      throw new Error("Transcription API error");
    }

    const json = await resp.json();
    return json.text; // or json.transcript depending on their format
  }
}

export default new TranscriptionService();
