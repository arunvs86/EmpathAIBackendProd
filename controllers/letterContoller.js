// controllers/letterController.js
import letterService from "../services/letter/letterService.js";

class LetterController {
  async create(req, res) {
    try {
      const newLetter = await letterService.createLetter(req.user.id, req.body);
      res.status(201).json(newLetter);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  async listByUser(req, res) {
    try {
      const list = await letterService.getLettersByUser(req.user.id);
      res.json(list);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  async getOne(req, res) {
    try {
      const letter = await letterService.getLetterById(req.params.id);
      res.json(letter);
    } catch (e) { res.status(404).json({ error: e.message }); }
  }

  async update(req, res) {
    try {
      const updated = await letterService.updateLetter(req.params.id, req.user.id, req.body);
      res.json(updated);
    } catch (e) { res.status(403).json({ error: e.message }); }
  }

  async delete(req, res) {
    try {
      const result = await letterService.deleteLetter(req.params.id, req.user.id);
      res.json(result);
    } catch (e) { res.status(403).json({ error: e.message }); }
  }
}

export default new LetterController();
