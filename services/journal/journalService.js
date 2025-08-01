import Journal from '../../models/Journal.js';

class JournalService {
  /** Find all journal entries for a given user, sorted by date descending. */
  async findByUser(userId) {
    return Journal.find({ userId })
      .sort({ date: -1 })
      .exec();
  }

  /** Create a new journal entry. */
  async create(userId, data) {
    const entry = new Journal({
      userId,
      date: data.date || Date.now(),
      title: data.title || '',
      body: data.body,
      mood: data.mood || '😃',
      tags: Array.isArray(data.tags) ? data.tags : [],
      private: typeof data.private === 'boolean' ? data.private : true,
      attachments: Array.isArray(data.attachments) ? data.attachments : [],
      media: Array.isArray(data.media) ? data.media : [], 
    });
    return entry.save();
  }

  /** Retrieve a single journal entry by ID & user. */
  async getById(entryId, userId) {
    return Journal.findOne({ _id: entryId, userId }).exec();
  }

  /** Update a journal entry by ID & user. */
  async update(entryId, userId, updates) {
    const allowed = ['title', 'body', 'mood', 'tags', 'private', 'media', 'date']; 
    const payload = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) payload[key] = updates[key];
    }

    return Journal.findOneAndUpdate(
      { _id: entryId, userId },
      { $set: payload },
      { new: true }
    ).exec();
  }

  /** Delete a journal entry by ID & user. */
  async remove(entryId, userId) {
    return Journal.findOneAndDelete({ _id: entryId, userId }).exec();
  }

  async getByUser(userId) {
    return Journal
      .find({ userId })
      .sort({ date: -1 });
  }

  async countByUser(userId) {
    return Journal.countDocuments({ userId });
  }
  
}

export default new JournalService();
