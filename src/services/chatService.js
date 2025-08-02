import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  setDoc,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const chatService = {
  async createChat(user1Id, user2Id) {
    try {
      // Check if chat already exists between these users
      const existingChat = await this.findExistingChat(user1Id, user2Id);
      if (existingChat) {
        return existingChat;
      }

      const chatData = {
        participants: [user1Id, user2Id],
        lastMessage: '',
        lastUpdated: new Date(),
        createdAt: new Date()
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      return { id: chatRef.id, ...chatData };
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  },

  async findExistingChat(user1Id, user2Id) {
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains-any', [user1Id, user2Id])
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.participants.includes(user1Id) && data.participants.includes(user2Id)) {
          return { id: doc.id, ...data };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding existing chat:', error);
      throw error;
    }
  },

  async getUserChats(userId) {
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('lastUpdated', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  },

  subscribeToUserChats(userId, callback) {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastUpdated', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(chats);
    });
  },

  async sendMessage(chatId, senderId, content, messageType = 'text', listingData = null) {
    try {
      // Add message to messages subcollection
      const messageData = {
        senderId,
        content,
        timestamp: new Date(),
        type: messageType, // 'text' or 'listing'
        ...(messageType === 'listing' && listingData && {
          listing: {
            id: listingData.id,
            title: listingData.title,
            price: listingData.price,
            imageURL: listingData.imageURL,
            category: listingData.category,
            sellerId: listingData.sellerId,
            sellerName: listingData.sellerName
          }
        })
      };

      await addDoc(collection(db, 'messages', chatId, 'messages'), messageData);

      // Update chat with last message
      const chatRef = doc(db, 'chats', chatId);
      const lastMessageText = messageType === 'listing' 
        ? `📦 Shared: ${listingData?.title || 'a listing'}` 
        : content;
      
      await updateDoc(chatRef, {
        lastMessage: lastMessageText,
        lastUpdated: new Date()
      });

      return messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  subscribeToMessages(chatId, callback) {
    const q = query(
      collection(db, 'messages', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  },

  async getMessages(chatId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'messages', chatId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  async getChatWithUserDetails(chatId) {
    try {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data();
      
      // Get user details for participants
      const participantDetails = await Promise.all(
        chatData.participants.map(async (userId) => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          return userDoc.exists() ? { id: userId, ...userDoc.data() } : null;
        })
      );

      return {
        id: chatDoc.id,
        ...chatData,
        participantDetails: participantDetails.filter(user => user !== null)
      };
    } catch (error) {
      console.error('Error fetching chat with user details:', error);
      throw error;
    }
  }
};
