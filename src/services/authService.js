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
  // Validate Yale email domain
  // TEMPORARILY DISABLED FOR TESTING - REMEMBER TO RE-ENABLE!
  validateYaleEmail(email) {
    // return email.toLowerCase().endsWith('@yale.edu'); // Original validation
    return true; // Temporarily allow any email for testing
  },

  // Sign up with email and password
  async signUp(email, password, displayName) {
    try {
      // Validate Yale email - TEMPORARILY DISABLED FOR TESTING
      // if (!this.validateYaleEmail(email)) {
      //   throw new Error('Only @yale.edu email addresses are allowed');
      // }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Save user profile to Firestore
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

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        throw new Error('Please verify your email address before signing in. Check your inbox for a verification email.');
      }

      // Validate Yale email (extra security check) - TEMPORARILY DISABLED FOR TESTING
      // if (!this.validateYaleEmail(user.email)) {
      //   await this.signOut();
      //   throw new Error('Only @yale.edu email addresses are allowed');
      // }

      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Resend email verification
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

  // Check if current user's email is verified
  async checkEmailVerification() {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      // Reload user to get latest verification status
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
        // Update email verification status if user already exists
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
