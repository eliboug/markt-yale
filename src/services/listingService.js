import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export const listingService = {
  async createListing(listingData, imageUri, userId) {
    try {
      let imageURL = null;
      
      // Upload image if provided
      if (imageUri) {
        imageURL = await this.uploadImage(imageUri);
      }

      const listing = {
        ...listingData,
        userId,
        imageURL,
        timestamp: new Date(),
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'listings'), listing);
      return { id: docRef.id, ...listing };
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  },

  async uploadImage(imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileName = `listings/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const imageRef = ref(storage, fileName);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  async getAllListings() {
    try {
      const q = query(collection(db, 'listings'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // Filter out sold items on client side
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(listing => !listing.sold);
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  },

  subscribeToListings(callback) {
    const q = query(collection(db, 'listings'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const listings = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(listing => !listing.sold);
      callback(listings);
    });
  },

  async getListingsByUser(userId) {
    try {
      const q = query(
        collection(db, 'listings'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      // Filter out sold listings - only return active listings for "My Listings"
      const allListings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return allListings.filter(listing => !listing.sold);
    } catch (error) {
      console.error('Error fetching user listings:', error);
      throw error;
    }
  },

  async updateListing(listingId, updates) {
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

  async deleteListing(listingId) {
    try {
      // Get listing to delete associated image
      const listingDoc = await getDoc(doc(db, 'listings', listingId));
      if (listingDoc.exists()) {
        const listingData = listingDoc.data();
        if (listingData.imageURL) {
          // Delete image from storage
          const imageRef = ref(storage, listingData.imageURL);
          try {
            await deleteObject(imageRef);
          } catch (imageError) {
            console.log('Image already deleted or doesn\'t exist');
          }
        }
      }

      await deleteDoc(doc(db, 'listings', listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  async getListing(listingId) {
    try {
      const listingDoc = await getDoc(doc(db, 'listings', listingId));
      if (listingDoc.exists()) {
        return { id: listingDoc.id, ...listingDoc.data() };
      } else {
        throw new Error('Listing not found');
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  },

  async filterListings(category, minPrice, maxPrice) {
    try {
      let q = query(collection(db, 'listings'), orderBy('timestamp', 'desc'));

      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }

      const querySnapshot = await getDocs(q);
      let listings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by price range (client-side for simplicity)
      if (minPrice !== undefined || maxPrice !== undefined) {
        listings = listings.filter(listing => {
          const price = parseFloat(listing.price);
          if (minPrice !== undefined && price < minPrice) return false;
          if (maxPrice !== undefined && price > maxPrice) return false;
          return true;
        });
      }

      return listings;
    } catch (error) {
      console.error('Error filtering listings:', error);
      throw error;
    }
  },

  // Mark listing as sold
  async markAsSold(listingId) {
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        sold: true,
        soldAt: new Date()
      });
    } catch (error) {
      console.error('Error marking listing as sold:', error);
      throw error;
    }
  },

  // Mark listing as available (unsold)
  async markAsAvailable(listingId) {
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        sold: false,
        soldAt: null
      });
    } catch (error) {
      console.error('Error marking listing as available:', error);
      throw error;
    }
  },

  // Get sold listings by user
  async getSoldListingsByUser(userId) {
    try {
      const q = query(
        collection(db, 'listings'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      // Filter sold items on client side and sort by soldAt
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(listing => listing.sold)
        .sort((a, b) => {
          const dateA = a.soldAt ? (a.soldAt.toDate ? a.soldAt.toDate() : new Date(a.soldAt)) : new Date(0);
          const dateB = b.soldAt ? (b.soldAt.toDate ? b.soldAt.toDate() : new Date(b.soldAt)) : new Date(0);
          return dateB - dateA; // Sort by soldAt desc
        });
    } catch (error) {
      console.error('Error fetching sold listings:', error);
      throw error;
    }
  },

  // Update listing with image handling
  async updateListingWithImage(listingId, updates, newImageUri = null) {
    try {
      let imageURL = updates.imageURL;
      
      // If new image provided, upload it
      if (newImageUri) {
        // Delete old image if exists
        if (updates.imageURL) {
          try {
            const oldImageRef = ref(storage, updates.imageURL);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.log('Old image not found or already deleted');
          }
        }
        
        // Upload new image
        imageURL = await this.uploadImage(newImageUri);
      }
      
      const listingRef = doc(db, 'listings', listingId);
      const updateData = {
        ...updates,
        imageURL,
        updatedAt: new Date()
      };
      
      await updateDoc(listingRef, updateData);
      return updateData;
    } catch (error) {
      console.error('Error updating listing with image:', error);
      throw error;
    }
  }
};
