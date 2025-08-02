import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { listingService } from '../../services/listingService';
import { useAuth } from '../../utils/AuthContext';

const ItemDetailScreen = ({ route, navigation }) => {
  const { listing } = route.params;
  const { user } = useAuth();
  const [sellerInfo, setSellerInfo] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactingUser, setContactingUser] = useState(false);

  useEffect(() => {
    loadSellerInfo();
    checkIfFavorited();
  }, []);

  const loadSellerInfo = async () => {
    try {
      if (listing.userId) {
        const seller = await userService.getUserProfile(listing.userId);
        setSellerInfo(seller);
      }
    } catch (error) {
      console.error('Error loading seller info:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async () => {
    try {
      if (user) {
        const favorites = await userService.getUserFavorites(user.uid);
        setIsFavorited(favorites.includes(listing.id));
      }
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        await userService.removeFromFavorites(user.uid, listing.id);
        setIsFavorited(false);
      } else {
        await userService.addToFavorites(user.uid, listing.id);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to contact the seller');
      return;
    }

    if (listing.userId === user.uid) {
      Alert.alert('Notice', 'This is your own listing!');
      return;
    }

    try {
      setContactingUser(true);

      // Create or find existing chat
      const chat = await chatService.createChat(user.uid, listing.userId);
      
      // Navigate to chat room
      navigation.navigate('ChatRoom', {
        chatId: chat.id,
        chatTitle: sellerInfo?.name || 'Chat',
        listing: listing
      });
    } catch (error) {
      console.error('Error contacting seller:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setContactingUser(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this item on Markt: ${listing.title} - $${listing.price}`,
        title: listing.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOwner = user && listing.userId === user.uid;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {listing.imageURL && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: listing.imageURL }} style={styles.image} />
            <View style={styles.imageOverlay}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={toggleFavorite}
              >
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={28}
                  color={isFavorited ? '#ff4757' : '#ffffff'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.content}>
          {/* Title and Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>${listing.price}</Text>
          </View>

          {/* Category and Date */}
          <View style={styles.metaSection}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{listing.category}</Text>
            </View>
            <Text style={styles.dateText}>
              Posted {formatDate(listing.timestamp)}
            </Text>
          </View>

          {/* Course Codes (for Textbooks) */}
          {listing.category === 'Textbooks' && listing.courseCodes && listing.courseCodes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Course Codes</Text>
              <View style={styles.courseCodesContainer}>
                {listing.courseCodes.map((code, index) => (
                  <View key={index} style={styles.courseCodeChip}>
                    <Text style={styles.courseCodeText}>{code}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={20} color="#4a5568" />
              <Text style={styles.locationText}>{listing.location}</Text>
            </View>
          </View>

          {/* Seller Info */}
          {sellerInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller</Text>
              <View style={styles.sellerContainer}>
                {sellerInfo.photoURL ? (
                  <Image
                    source={{ uri: sellerInfo.photoURL }}
                    style={styles.sellerAvatar}
                  />
                ) : (
                  <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                    <Ionicons name="person" size={24} color="#8e8e93" />
                  </View>
                )}
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{sellerInfo.name}</Text>
                  <Text style={styles.sellerEmail}>{sellerInfo.email}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {!isOwner && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.contactButton, contactingUser && styles.contactButtonDisabled]}
            onPress={handleContactSeller}
            disabled={contactingUser}
          >
            {contactingUser ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
                <Text style={styles.contactButtonText}>Message Seller</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isOwner && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              navigation.navigate('EditListing', { listing });
            }}
          >
            <Ionicons name="pencil-outline" size={20} color="#4285f4" />
            <Text style={styles.editButtonText}>Edit Listing</Text>
          </TouchableOpacity>
        </View>
      )}
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
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
  },
  favoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  shareButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
    lineHeight: 32,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38a169',
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryBadge: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    color: '#8e8e93',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#4a5568',
    marginLeft: 8,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  sellerEmail: {
    fontSize: 14,
    color: '#8e8e93',
  },
  courseCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  courseCodeChip: {
    backgroundColor: '#4285f4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  courseCodeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  contactButton: {
    backgroundColor: '#4285f4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  editButtonText: {
    color: '#4285f4',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ItemDetailScreen;
