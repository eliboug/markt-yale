import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { useAuth } from '../../utils/AuthContext';

const ChatInboxScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let unsubscribe = null;
    
    if (user) {
      // Subscribe to real-time chat updates
      unsubscribe = chatService.subscribeToUserChats(user.uid, async (chatList) => {
        // Enhance chats with participant details
        const enhancedChats = await Promise.all(
          chatList.map(async (chat) => {
            try {
              // Get the other participant (not the current user)
              const otherParticipantId = chat.participants.find(id => id !== user.uid);
              if (otherParticipantId) {
                const otherUser = await userService.getUserProfile(otherParticipantId);
                return {
                  ...chat,
                  otherUser,
                };
              }
              return chat;
            } catch (error) {
              console.error('Error loading participant details:', error);
              return chat;
            }
          })
        );
        
        setChats(enhancedChats);
        setLoading(false);
        setRefreshing(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // The subscription will automatically refresh the data
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMilliseconds = now - date;
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderChatItem = ({ item }) => {
    const otherUser = item.otherUser;
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatRoom', {
          chatId: item.id,
          chatTitle: otherUser?.name || 'Chat',
          otherUser: otherUser
        })}
      >
        <View style={styles.chatAvatar}>
          {otherUser?.photoURL ? (
            <Image
              source={{ uri: otherUser.photoURL }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#8e8e93" />
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {otherUser?.name || 'Unknown User'}
            </Text>
            <Text style={styles.chatTime}>
              {formatTime(item.lastUpdated)}
            </Text>
          </View>
          
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>

        <View style={styles.chatIndicator}>
          <Ionicons name="chevron-forward" size={16} color="#8e8e93" />
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContainer,
          chats.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation by messaging a seller on any item listing
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Feed')}
            >
              <Text style={styles.browseButtonText}>Browse Items</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'center',
  },
  listContainer: {
    paddingTop: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  chatAvatar: {
    marginRight: 16,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  lastMessage: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 18,
  },
  chatIndicator: {
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatInboxScreen;
