# Markt - Yale Student Marketplace App

A cross-platform mobile marketplace app built for Yale University students using React Native (Expo) and Firebase.

## Features

- **🔐 Secure Authentication**: Google SSO restricted to @yale.edu emails only
- **📱 Cross-platform**: Works on both iOS and Android devices
- **🛍️ Item Listings**: Browse, create, edit, and delete marketplace listings
- **💬 Real-time Messaging**: Chat with other users about items
- **❤️ Favorites**: Save items you're interested in
- **🔍 Search & Filter**: Find items by category, price, and keywords
- **📸 Image Upload**: Add photos to your listings
- **🔔 Push Notifications**: Get notified of new messages (ready for implementation)

## Tech Stack

### Frontend
- **React Native** with Expo
- **React Navigation** for navigation
- **expo-image-picker** for photo uploads
- **expo-notifications** for push notifications
- **expo-auth-session** for Google authentication

### Backend (Firebase)
- **Firebase Authentication** with Google sign-in
- **Firestore Database** for real-time data
- **Firebase Storage** for image uploads
- **Firebase Cloud Messaging** for push notifications (optional)

## Project Structure

```
src/
├── screens/
│   ├── auth/
│   │   └── LoginScreen.js          # Google SSO login
│   └── main/
│       ├── FeedScreen.js           # Browse all listings
│       ├── CreateListingScreen.js  # Post new items
│       ├── ItemDetailScreen.js     # View item details
│       ├── MyListingsScreen.js     # Manage your listings
│       ├── SavedListingsScreen.js  # View saved items
│       ├── ChatInboxScreen.js      # All conversations
│       ├── ChatRoomScreen.js       # Individual chat
│       └── ProfileScreen.js        # User profile & settings
├── services/
│   ├── authService.js             # Authentication logic
│   ├── listingService.js          # Listings CRUD operations
│   ├── chatService.js             # Real-time messaging
│   ├── userService.js             # User profile & favorites
│   └── notificationService.js     # Push notifications
└── utils/
    ├── AuthContext.js             # Global auth state
    └── Navigation.js              # App navigation structure
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for Mac) or Android Studio (for Android development)

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project called "markt-yale" (or your preferred name)
3. Enable the following services:
   - **Authentication**: Enable Google sign-in
   - **Firestore Database**: Create in production mode
   - **Storage**: Set up Firebase Storage

#### Firebase Authentication Setup
1. In Firebase Console → Authentication → Sign-in method
2. Enable Google as a sign-in provider
3. Add your OAuth 2.0 client ID (see Google Cloud Console setup below)

#### Firestore Setup
1. In Firebase Console → Firestore Database
2. Create database in production mode
3. Deploy the security rules from `firestore.rules`:
   ```bash
   # Install Firebase CLI if you haven't
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init firestore
   
   # Deploy security rules
   firebase deploy --only firestore:rules
   ```

#### Firebase Storage Setup
1. In Firebase Console → Storage
2. Set up storage rules (update as needed for security)

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Enable Google+ API (required for Google Sign-In)
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure for both iOS and Android:
   - **iOS**: Add your iOS bundle identifier
   - **Android**: Add your Android package name and SHA-1 certificate fingerprint

### 4. Environment Configuration

1. Update `firebase.config.js` with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

2. Update `authService.js` with your Google Client ID:
   ```javascript
   const GOOGLE_CLIENT_ID = 'your-google-client-id';
   ```

### 5. Installation & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on device/simulator:
   - **iOS**: Press `i` or scan QR code with Expo Go app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w` (for testing UI, limited functionality)

## Database Schema

### Users Collection (`users/{uid}`)
```javascript
{
  uid: string,
  name: string,
  email: string,
  photoURL: string,
  createdAt: timestamp,
  favorites: [listingId],
  pushToken?: string
}
```

### Listings Collection (`listings/{listingId}`)
```javascript
{
  userId: string,
  title: string,
  description: string,
  price: number,
  category: string,
  location: string,
  imageURL?: string,
  timestamp: timestamp,
  createdAt: timestamp
}
```

### Chats Collection (`chats/{chatId}`)
```javascript
{
  participants: [userId1, userId2],
  lastMessage: string,
  lastUpdated: timestamp,
  createdAt: timestamp
}
```

### Messages Subcollection (`messages/{chatId}/messages/{messageId}`)
```javascript
{
  senderId: string,
  content: string,
  timestamp: timestamp
}
```

## Security Rules

The app implements strict Firestore security rules:
- Users can only access their own profile data
- Only authenticated @yale.edu users can create listings
- Users can only edit/delete their own listings
- Chat access is restricted to participants only
- Messages can only be read by chat participants

## Development Notes

### Known Limitations
- Edit listing functionality is placeholder (shows alert)
- Push notifications service is implemented but needs server-side component
- No admin panel or content moderation
- Basic error handling (can be enhanced)

### Future Enhancements
- Advanced search and filtering
- User ratings and reviews
- Categories with icons
- Photo gallery for listings
- Location-based search
- In-app purchase handling
- Push notification server implementation
- Admin moderation tools

## Testing

1. Test authentication with @yale.edu email
2. Create, view, edit, and delete listings
3. Test real-time messaging between users
4. Test favorites functionality
5. Verify security rules prevent unauthorized access

## Deployment

### Building for Production

1. **iOS**:
   ```bash
   npx expo build:ios
   ```

2. **Android**:
   ```bash
   npx expo build:android
   ```

3. **App Store Submission**: Follow Expo's guide for app store submission

## Support

For issues or questions:
1. Check Firebase Console for authentication/database errors
2. Check Expo documentation for platform-specific issues
3. Review Firestore security rules for access issues

## License

This project is built for Yale University students. Please follow university guidelines and policies when using this application.

---

**Built with ❤️ for the Yale community**
