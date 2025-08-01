import JournalService from '../services/journal/journalService.js'


class JournalController {
    /** List all journal entries for the authenticated user. */
    async listJournals(req, res) {
      try {
        const userId = req.user.id;
        const entries = await JournalService.findByUser(userId);
        return res.json(entries);
      } catch (error) {
        console.error('Error listing journals:', error);
        return res.status(500).json({ error: 'Error fetching journal entries.' });
      }
    }
  
    /** Create a new journal entry for the authenticated user. */
    async createJournal(req, res) {
      try {
        const userId = req.user.id;
        const entryData = req.body;
        const newEntry = await JournalService.create(userId, entryData);
        return res.status(201).json(newEntry);
      } catch (error) {
        console.error('Error creating journal entry:', error);
        return res.status(400).json({ error: error.message });
      }
    }
  
    /** Retrieve a single journal entry by ID (must belong to authenticated user). */
    async getJournal(req, res) {
      try {
        const userId = req.user.id;
        const entryId = req.params.id;
        const entry = await JournalService.getById(entryId, userId);
        if (!entry) {
          return res.status(404).json({ error: 'Journal entry not found.' });
        }
        return res.json(entry);
      } catch (error) {
        console.error('Error fetching journal entry:', error);
        return res.status(500).json({ error: 'Error fetching journal entry.' });
      }
    }
  
    /** Update a journal entry (must belong to authenticated user). */
    async updateJournal(req, res) {
      try {
        const userId = req.user.id;
        const entryId = req.params.id;
        const updates = req.body;
        const updated = await JournalService.update(entryId, userId, updates);
        if (!updated) {
          return res.status(404).json({ error: 'Journal entry not found or unauthorized.' });
        }
        return res.json(updated);
      } catch (error) {
        console.error('Error updating journal entry:', error);
        return res.status(400).json({ error: error.message });
      }
    }
  
    /** Delete a journal entry (must belong to authenticated user). */
    async deleteJournal(req, res) {
      try {
        const userId = req.user.id;
        const entryId = req.params.id;
        const deleted = await JournalService.remove(entryId, userId);
        if (!deleted) {
          return res.status(404).json({ error: 'Journal entry not found or unauthorized.' });
        }
        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting journal entry:', error);
        return res.status(500).json({ error: 'Error deleting journal entry.' });
      }
    }
  }
  
  export default new JournalController();
  