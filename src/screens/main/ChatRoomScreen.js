import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { useAuth } from '../../utils/AuthContext';
import ListingMessage from '../../components/chat/ListingMessage';
import ListingPicker from '../../components/chat/ListingPicker';

const ChatRoomScreen = ({ route, navigation }) => {
  const { chatId, chatTitle, otherUser, listing } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showListingPicker, setShowListingPicker] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Set navigation title
    navigation.setOptions({
      title: chatTitle || 'Chat',
      headerRight: () => otherUser && (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'User Info',
              `Name: ${otherUser.name}\nEmail: ${otherUser.email}`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color="#4285f4" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, chatTitle, otherUser]);

  useEffect(() => {
    let unsubscribe = null;
    
    if (chatId) {
      // Subscribe to real-time messages
      unsubscribe = chatService.subscribeToMessages(chatId, (messageList) => {
        setMessages(messageList);
        setLoading(false);
        
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          if (flatListRef.current && messageList.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await chatService.sendMessage(chatId, user.uid, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Restore the message if sending failed
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleSendListing = async (listing) => {
    setSending(true);
    try {
      // Get seller name from user profile if needed
      let sellerName = 'Unknown';
      if (listing.userId) {
        try {
          const userProfile = await userService.getUserProfile(listing.userId);
          sellerName = userProfile.displayName || userProfile.email || 'Unknown';
        } catch (error) {
          console.log('Could not fetch seller name, using fallback');
        }
      }

      await chatService.sendMessage(
        chatId, 
        user.uid, 
        `📦 ${listing.title}`, 
        'listing', 
        {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          imageURL: listing.imageURL,
          category: listing.category,
          sellerId: listing.userId || null,
          sellerName: sellerName
        }
      );
    } catch (error) {
      console.error('Error sending listing:', error);
      Alert.alert('Error', 'Failed to send listing. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleListingPress = (listing) => {
    // Navigate to item detail screen
    navigation.navigate('ItemDetail', { listing });
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user.uid;
    const showAvatar = !isMyMessage && (
      index === messages.length - 1 || 
      messages[index + 1]?.senderId !== item.senderId
    );

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar && otherUser?.photoURL ? (
              <Image
                source={{ uri: otherUser.photoURL }}
                style={styles.messageAvatar}
              />
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}
        
        {/* Message Content */}
        {item.type === 'listing' && item.listing ? (
          <ListingMessage 
            listing={item.listing}
            onPress={handleListingPress}
            isMyMessage={isMyMessage}
          />
        ) : (
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          </View>
        )}
        
        {/* Message Time */}
        <Text style={[
          styles.messageTime,
          isMyMessage ? styles.myMessageTime : styles.otherMessageTime
        ]}>
          {formatMessageTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  const renderListingHeader = () => {
    if (!listing) return null;

    return (
      <View style={styles.listingHeader}>
        <View style={styles.listingInfo}>
          {listing.imageURL && (
            <Image source={{ uri: listing.imageURL }} style={styles.listingImage} />
          )}
          <View style={styles.listingDetails}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {listing.title}
            </Text>
            <Text style={styles.listingPrice}>${listing.price}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewListingButton}
          onPress={() => navigation.navigate('ItemDetail', { listing })}
        >
          <Text style={styles.viewListingText}>View Item</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 && styles.emptyMessagesContent
        ]}
        ListHeaderComponent={renderListingHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#e2e8f0" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => setShowListingPicker(true)}
          disabled={sending}
        >
          <Ionicons name="attach" size={24} color="#4285f4" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Listing Picker Modal */}
      <ListingPicker
        visible={showListingPicker}
        onClose={() => setShowListingPicker(false)}
        onSelectListing={handleSendListing}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#4a5568',
    marginTop: 16,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyMessagesContent: {
    flex: 1,
  },
  listingHeader: {
    backgroundColor: '#f7fafc',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listingInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  listingDetails: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38a169',
  },
  viewListingButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewListingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarSpacer: {
    width: 24,
    height: 24,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#4285f4',
    marginLeft: 'auto',
  },
  otherMessageBubble: {
    backgroundColor: '#f7fafc',
    marginRight: 'auto',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#2d3748',
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#8e8e93',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 20,
    fontSize: 16,
    color: '#2d3748',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#4285f4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatRoomScreen;
