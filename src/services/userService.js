import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

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
  },

  async uploadProfilePhoto(userId, imageUri) {
    try {
      // Create a unique filename for the profile photo
      const filename = `profile_${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile-photos/${filename}`);
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload the image
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Get current user profile to check for existing photo
      const userProfile = await this.getUserProfile(userId);
      
      // Delete old profile photo if it exists
      if (userProfile?.photoURL) {
        try {
          // Extract filename from old URL to delete it
          const oldPhotoRef = ref(storage, userProfile.photoURL);
          await deleteObject(oldPhotoRef);
        } catch (deleteError) {
          console.log('Old profile photo already deleted or doesn\'t exist');
        }
      }
      
      // Update user profile with new photo URL
      await this.updateUserProfile(userId, { photoURL: downloadURL });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }
};
