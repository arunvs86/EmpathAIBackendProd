// services/letterService.js
import Letter from "../../models/Letter.js";

class LetterService {
  async createLetter(userId, { text, media }) {
    return Letter.create({ userId, text, media });
  }

  async getLettersByUser(userId) {
    return Letter.find({ userId }).sort({ createdAt: -1 });
  }

  async getLetterById(id) {
    const letter = await Letter.findById(id);
    if (!letter) throw new Error("Letter not found.");
    return letter;
  }

  async updateLetter(id, userId, { text, media }) {
    const letter = await Letter.findById(id);
    if (!letter) throw new Error("Letter not found.");
    if (letter.userId !== userId) throw new Error("Unauthorized");
    letter.text = text;
    letter.media = media;
    letter.updatedAt = new Date();
    await letter.save();
    return letter;
  }

  async deleteLetter(id, userId) {
    const letter = await Letter.findById(id);
    if (!letter) throw new Error("Letter not found.");
    if (letter.userId !== userId) throw new Error("Unauthorized");
    await letter.remove();
    return { message: "Letter deleted" };
  }
}

export default new LetterService();
