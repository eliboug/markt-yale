import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ListingMessage = ({ listing, onPress, isMyMessage }) => {
  if (!listing) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      isMyMessage ? styles.myListingContainer : styles.otherListingContainer
    ]}>
      <TouchableOpacity 
        style={styles.touchableArea}
        onPress={() => onPress && onPress(listing)}
        activeOpacity={0.8}
      >
        {/* Full Image */}
        {listing.imageURL ? (
          <Image 
            source={{ uri: listing.imageURL }} 
            style={styles.listingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={48} color="#8e8e93" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Item Name Overlay */}
        <View style={styles.titleOverlay}>
          <Text 
            style={styles.listingTitle}
            numberOfLines={2}
          >
            {listing.title || 'Untitled Item'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 2,
    maxWidth: 240,
    minWidth: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  myListingContainer: {
    alignSelf: 'flex-end',
  },
  otherListingContainer: {
    alignSelf: 'flex-start',
  },
  touchableArea: {
    width: '100%',
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f7fafc',
  },
  placeholderImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 8,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default ListingMessage;
