import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../firebase.config';

export const userService = {
  async addToFavorites(userId, listingId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayUnion(listingId)
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  async removeFromFavorites(userId, listingId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayRemove(listingId)
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async getUserFavorites(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().favorites || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
    }
  }
};
