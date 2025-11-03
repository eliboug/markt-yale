# Markt - Yale Student Marketplace

A mobile marketplace app for Yale University students built with React Native (Expo) and Firebase.

## Features

- Secure authentication restricted to @yale.edu email addresses
- Cross-platform support for iOS and Android
- Create, browse, and manage marketplace listings
- Real-time messaging between buyers and sellers
- Save favorite items
- Search and filter by category, price, and keywords
- Image upload for listings
- Push notifications for new messages

## Tech Stack

### Frontend
- React Native with Expo
- React Navigation
- expo-image-picker
- expo-notifications
- expo-auth-session

### Backend
- Firebase Authentication
- Firestore Database
- Firebase Storage
- Firebase Cloud Messaging

## Project Structure

```
src/
├── screens/
│   ├── auth/
│   │   └── LoginScreen.js
│   └── main/
│       ├── FeedScreen.js
│       ├── CreateListingScreen.js
│       ├── EditListingScreen.js
│       ├── ItemDetailScreen.js
│       ├── MyListingsScreen.js
│       ├── SavedListingsScreen.js
│       ├── SoldListingsScreen.js
│       ├── ChatInboxScreen.js
│       ├── ChatRoomScreen.js
│       ├── ProfileScreen.js
│       └── NotificationSettingsScreen.js
├── services/
│   ├── authService.js
│   ├── listingService.js
│   ├── chatService.js
│   ├── userService.js
│   └── notificationService.js
├── components/
│   └── chat/
│       ├── ListingMessage.js
│       └── ListingPicker.js
└── utils/
    ├── AuthContext.js
    └── Navigation.js
```

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
