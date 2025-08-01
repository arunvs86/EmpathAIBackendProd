import Chat from "../../models/Chat.js";
import Message from "../../models/Message.js";
import Community from "../../models/Community.js";
import { encrypt,decrypt } from "../../utils/encryption.js";


export const createOrGetChat = async ({ participants, isGroup, groupId }) => {
  let chat;

  if (!isGroup && participants.length === 2) {
    chat = await Chat.findOne({ isGroup: false, participants: { $all: participants } });
    if (chat) {
      // ensure a Message doc exists
      let msgDoc = await Message.findOne({ chatId: chat._id });
      if (!msgDoc) {
        await Message.create({ chatId: chat._id, messages: [] });
      }
      return chat;
    }
  }

  // create new chat
  chat = await Chat.create({ participants, isGroup, groupId });

  // **NEW**: bootstrap messages collection
  await Message.create({ chatId: chat._id, messages: [] });

  return chat;
};

/**
 * Retrieve all chats for a given user, then enrich with user details from PostgreSQL.
 */
// export const getUserChats = async (userId) => {
//   // 1) Get the raw chats from MongoDB
//   const chats = await Chat.find({ participants: userId }).sort({ lastMessageAt: -1 });
//   console.log("chats", chats)
//   if (chats.length === 0) return chats;

//   // 2) Gather all participant IDs from these chats
//   const userIdsSet = new Set();
//   for (const chat of chats) {
//     for (const participantId of chat.participants) {
//       userIdsSet.add(participantId);
//     }
//   }
//   const userIdsArray = [...userIdsSet];

//   // 3) Fetch user details from your user microservice (PostgreSQL) via a REST endpoint
//   // e.g., GET /users?ids=uuid1,uuid2,uuid3
//   // Adjust the URL or query param as needed
//   const userRes = await fetch(
//     `http://localhost:5003/users?ids=${userIdsArray.join(",")}`
//   );
//   if (!userRes.ok) {
//     throw new Error("Failed to fetch user details from PostgreSQL");
//   }
//   const users = await userRes.json(); // Expecting an array of user objects: [{ id, username, profile_picture }, ...]

//   // 4) Build a map: userId -> user object
//   const userMap = {};
//   for (const u of users) {
//     userMap[u.id] = u; // e.g. { id: "abc", username: "JohnDoe", ... }
//   }

//   // 5) Enrich each chat's participants with user details
//   // Instead of storing just the ID, store an object { id, username, ... }
//   const enrichedChats = chats.map((chat) => {
//     const c = chat.toObject(); // Convert Mongoose doc to plain object
//     c.participants = c.participants.map((pId) => {
//       const userObj = userMap[pId];
//       return userObj
//         ? { id: userObj.id, username: userObj.username, profile_picture: userObj.profile_picture }
//         : { id: pId, username: "EmpathAIBot" };
//     });
//     return c;
//   });

//   return enrichedChats;
// };

export const getUserChats = async (userId) => {
  // 1) Get the raw chats from MongoDB (skip chats with empty lastMessage)
  const chats = await Chat.find({
    participants: userId,
    lastMessage: { $ne: "" }, // Filter chats with actual messages
  })
    .sort({ lastMessageAt: -1 })
    .lean(); // Lean to work with plain objects early

  if (chats.length === 0) return [];

  // 2) Gather all participant IDs from these chats
  const userIdsSet = new Set();
  for (const chat of chats) {
    for (const participantId of chat.participants) {
      userIdsSet.add(participantId);
    }
  }
  const userIdsArray = [...userIdsSet];

  // 3) Fetch user details from PostgreSQL
  const userRes = await fetch(
    `http://localhost:5003/users?ids=${userIdsArray.join(",")}`
  );
  if (!userRes.ok) {
    throw new Error("Failed to fetch user details from PostgreSQL");
  }
  const users = await userRes.json(); // [{ id, username, profile_picture }, ...]
  const userMap = {};
  for (const u of users) {
    userMap[u.id] = u;
  }

  // 4) Gather group IDs and fetch those communities
  const groupChatIds = chats
    .filter((c) => c.isGroup && c.groupId)
    .map((c) => c.groupId);

  let groupMap = {};
  if (groupChatIds.length > 0) {
    const groups = await Community.find({ _id: { $in: groupChatIds } }).lean();
    groupMap = Object.fromEntries(
      groups.map((g) => [g._id.toString(), { name: g.name, banner_image: g.banner_image }])
    );
  }

  // 5) Enrich each chat
  const enrichedChats = chats.map((chat) => {
    chat.participants = chat.participants.map((pId) => {
      const userObj = userMap[pId];
      return userObj
        ? { id: userObj.id, username: userObj.username, profile_picture: userObj.profile_picture }
        : { id: pId, username: "EmpathAIBot" };
    });

    if (chat.isGroup && chat.groupId) {
      const groupData = groupMap[chat.groupId.toString()];
      if (groupData) {
        chat.groupName = groupData.name;
        chat.groupBanner = groupData.banner_image;
      }
    }

    return chat;
  });

  return enrichedChats;
};

/**
 * Send a message: append the message to the Message document and update the Chat document.
 */
export const sendMessage = async ({ chatId, senderId, content, media, messageType }) => {
  // Append the new message
  const encryptedContent = encrypt(content || ""); // handle null safety

  const messageDoc = await Message.findOneAndUpdate(
    { chatId },
    {
      $push: {
        messages: {
          senderId,
          encryptedContent,
          media: media || [],
          messageType: messageType || "text",
        },
      },
    },
    { new: true ,upsert: true} // create it if it doesn’t already exist}
  );

  const newMessage = messageDoc.messages.at(-1); // ES2022 syntax

  // Decrypt it
  const decryptedContent = decrypt(newMessage.encryptedContent);

  // Add `content` field for frontend
  const result = {
    ...newMessage.toObject(),
    content: decryptedContent,
  };

  // Update the Chat's lastMessage and lastMessageAt fields
  const lastMessageText = content || (media && media[0]) || "";
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: lastMessageText,
    lastMessageAt: new Date(),
  });

  return result;
};

export const getChatMessages = async (chatId) => {
  const messageDoc = await Message.findOne({ chatId });
  if (!messageDoc) {
    // messageDoc = await Message.create({ chatId, messages: [] });
    return null;
  }

  // Convert to plain object immediately
  const enrichedDoc = messageDoc.toObject();

  // If there are no messages, return early with an empty array
  if (!enrichedDoc.messages || enrichedDoc.messages.length === 0) {
    enrichedDoc.messages = [];
    return enrichedDoc;
  }

  // Otherwise, gather sender IDs
  const senderIdsSet = new Set(enrichedDoc.messages.map(m => m.senderId));
  const senderIdsArray = [...senderIdsSet];

  // Fetch user details only if we have senders
  const userRes = await fetch(
    `http://localhost:5003/users?ids=${senderIdsArray.join(",")}`
  );
  if (!userRes.ok) {
    throw new Error("Failed to fetch user details for messages");
  }
  const users = await userRes.json();
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  // Enrich messages
  enrichedDoc.messages = enrichedDoc.messages.map(m => {
    const u = userMap[m.senderId];
    const decryptedContent = m.encryptedContent
      ? decrypt(m.encryptedContent)
      : m.content;

    return {
      ...m,
      content: decryptedContent,
      sender: u
        ? { id: u.id, username: u.username, profile_picture: u.profile_picture }
        : { id: m.senderId, username: "EmpathAIBot" },
    };
  });

  return enrichedDoc;
};

export const createGroupChat = async (communityId, participantIds) => {
  // 1) default participants if none
  if (!participantIds) {
    const community = await Community.findById(communityId).lean();
    if (!community) throw new Error("Community not found");
    participantIds = community.members;
  }

  // 2) lookup existing
  let chat = await Chat.findOne({ isGroup: true, groupId: communityId });
  if (chat) {
    // ensure messages doc
    let msgDoc = await Message.findOne({ chatId: chat._id });
    if (!msgDoc) await Message.create({ chatId: chat._id, messages: [] });
    return chat;
  }

  // 3) create new
  chat = await Chat.create({
    participants: participantIds,
    isGroup: true,
    groupId: communityId,
    lastMessage: "",
    lastMessageAt: Date.now(),
  });

  // **NEW**: bootstrap messages collection
  await Message.create({ chatId: chat._id, messages: [] });

  return chat;
};


export const getGroupChatsForCommunity = async (communityId) => {
  return Chat.find({ isGroup: true, groupId: communityId })
             .sort({ lastMessageAt: -1 })
             .lean();
}


export async function patchMessageTranscript({ chatId, messageId, transcript }) {
  return Message.findOneAndUpdate(
    { chatId, "messages._id": messageId },
    {
      $set: {
        "messages.$.transcript": transcript,
        "messages.$.status": "complete",
      },
    }
  );
}

