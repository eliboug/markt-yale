import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const authService = {
  validateYaleEmail(email) {
    return email.toLowerCase().endsWith('@yale.edu');
  },

  async signUp(email, password, displayName) {
    try {
      if (!this.validateYaleEmail(email)) {
        throw new Error('Only @yale.edu email addresses are allowed');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      await this.saveUserProfile(user, displayName);
      
      return {
        user,
        needsEmailVerification: true
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        throw new Error('Please verify your email address before signing in. Check your inbox for a verification email.');
      }

      if (!this.validateYaleEmail(user.email)) {
        await this.signOut();
        throw new Error('Only @yale.edu email addresses are allowed');
      }

      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async resendEmailVerification() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      await sendEmailVerification(user);
      return true;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  async checkEmailVerification() {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      await reload(user);
      return user.emailVerified;
    } catch (error) {
      console.error('Check verification error:', error);
      return false;
    }
  },

  async saveUserProfile(user, displayName = null) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: displayName || user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || null,
          createdAt: new Date(),
          emailVerified: user.emailVerified,
          favorites: []
        });
      } else {
        await setDoc(userRef, {
          emailVerified: user.emailVerified,
          lastLoginAt: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  getCurrentUser() {
    return auth.currentUser;
  }
};
