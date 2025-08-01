import transcriptionService from "../services/transcription/transcriptionService.js";

class TranscriptionController {
  async transcribeAudio(req, res) {
    try {
      const { audioUrl } = req.body;
      if (!audioUrl) {
        return res.status(400).json({ error: "audioUrl is required" });
      }

      // call into your service
      const transcript = await transcriptionService.transcribe(audioUrl);
      return res.json({ transcript });
    } catch (err) {
      console.error("TranscriptionController:", err);
      return res.status(500).json({ error: "Unable to transcribe audio" });
    }
  }
}

export default new TranscriptionController();
