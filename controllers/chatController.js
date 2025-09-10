import * as chatService from "../services/chat/chatService.js";


export const createChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, isGroup, groupId, participants } = req.body;

    let chatParticipants;
    if (!isGroup) {
      if (!recipientId) {
        return res.status(400).json({ error: "recipientId is required for one-to-one chat." });
      }
      chatParticipants = [userId, recipientId];
    } else {
      if (participants && Array.isArray(participants) && participants.length > 0) {
        chatParticipants = participants;
        if (!chatParticipants.includes(userId)) {
          chatParticipants.push(userId);
        }
      } else {
        chatParticipants = [userId];
      }
    }

    const chat = await chatService.createOrGetChat({ participants: chatParticipants, isGroup, groupId });
    return res.status(201).json(chat);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error creating chat." });
  }
};

/**
 * Retrieve all chats for the logged-in user.
 */
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await chatService.getUserChats(userId);
    return res.json(chats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching user chats." });
  }
};


export const sendMessage = async (req, res) => {
  try {
    console.log("Bot id:" , req.body.overrideSenderId)
    const senderId = req.body.overrideSenderId || req.user.id;
    const { chatId, content, media, messageType } = req.body;

    // const updatedMessageDoc = await chatService.sendMessage({
    //   chatId,
    //   senderId,
    //   content,
    //   media,
    //   messageType,
    // });

    // console.log("updatedMessageDoc",updatedMessageDoc)
    // // The newly added message is assumed to be the last element in updatedMessageDoc.messages.
    // const newMessage = updatedMessageDoc.messages[updatedMessageDoc.messages.length - 1];

    // return res.json(newMessage);
    const newMessage = await chatService.sendMessage({
      chatId,
      senderId,
      content,
      media,
      messageType,
    });

    return res.json(newMessage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error sending message." });
  }
};


/**
 * Retrieve messages for a specific chat.
 */
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ error: "chatId is required." });
    }

    const messageDoc = await chatService.getChatMessages(chatId);
    if (!messageDoc) {
      return res.status(404).json({ error: "No messages found for this chat." });
    }
    return res.json(messageDoc);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching messages." });
  }
};

export const createGroupChat = async(req, res) => {
  try {
    const { communityId, participantIds } = req.body;
    const chat = await chatService.createGroupChat(communityId, participantIds);
    return res.status(200).json(chat);
  } catch (err) {
    console.error("createGroupChat error:", err);
    return res.status(400).json({ error: err.message });
  }
}

// GET /api/chats/group/:communityId
export const getGroupChatsForCommunity = async(req, res) => {
  try {
    const { communityId } = req.params;
    const chats = await chatService.getGroupChatsForCommunity(communityId);
    return res.json(chats);
  } catch (err) {
    console.error("getGroupChatsForCommunity error:", err);
    return res.status(400).json({ error: err.message });
  }
}
