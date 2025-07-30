import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listingService } from '../../services/listingService';
import { useAuth } from '../../utils/AuthContext';

const ListingPicker = ({ visible, onClose, onSelectListing }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadListings();
    }
  }, [visible]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // Get all listings (not just user's own listings)
      const allListings = await listingService.getAllListings();
      setListings(allListings);
    } catch (error) {
      console.error('Error loading listings:', error);
      Alert.alert('Error', 'Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectListing = (listing) => {
    onSelectListing(listing);
    onClose();
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderListingItem = ({ item }) => {
    const isMyListing = item.sellerId === user?.uid;
    
    return (
      <TouchableOpacity
        style={styles.listingItem}
        onPress={() => handleSelectListing(item)}
        activeOpacity={0.7}
      >
        {/* Image */}
        {item.imageURL ? (
          <Image 
            source={{ uri: item.imageURL }} 
            style={styles.listingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={24} color="#8e8e93" />
          </View>
        )}

        {/* Details */}
        <View style={styles.listingDetails}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.listingPrice}>
            {formatPrice(item.price)}
          </Text>
          
          <View style={styles.listingMeta}>
            <Text style={styles.listingCategory}>
              {item.category}
            </Text>
            <Text style={styles.listingDate}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
          
          {isMyListing && (
            <View style={styles.myListingBadge}>
              <Text style={styles.myListingText}>Your listing</Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color="#8e8e93" 
          style={styles.arrow}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share a Listing</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderListingItem}
            keyExtractor={(item) => item.id}
            style={styles.listingsList}
            contentContainerStyle={styles.listingsContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#e2e8f0" />
                <Text style={styles.emptyText}>No listings available</Text>
                <Text style={styles.emptySubtext}>
                  Create your first listing to share with others
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#718096',
    fontSize: 16,
  },
  listingsList: {
    flex: 1,
  },
  listingsContent: {
    padding: 16,
  },
  listingItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listingDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    lineHeight: 20,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38a169',
    marginTop: 4,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listingCategory: {
    fontSize: 12,
    color: '#718096',
    backgroundColor: '#edf2f7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingDate: {
    fontSize: 12,
    color: '#718096',
  },
  myListingBadge: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  myListingText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  arrow: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default ListingPicker;
