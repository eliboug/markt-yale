import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { listingService } from '../../services/listingService';
import { useAuth } from '../../utils/AuthContext';

const SavedListingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    loadSavedListings();
  }, []);

  const loadSavedListings = async () => {
    try {
      if (user) {
        // Get user's favorite listing IDs
        const favoriteIds = await userService.getUserFavorites(user.uid);
        
        // Get full listing details for each favorite
        const listingPromises = favoriteIds.map(async (id) => {
          try {
            return await listingService.getListing(id);
          } catch (error) {
            // Listing might have been deleted, skip it
            console.log(`Listing ${id} not found, skipping`);
            return null;
          }
        });

        const listings = await Promise.all(listingPromises);
        // Filter out null results (deleted listings)
        const validListings = listings.filter(listing => listing !== null);
        
        setSavedListings(validListings);
      }
    } catch (error) {
      console.error('Error loading saved listings:', error);
      Alert.alert('Error', 'Failed to load saved listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSavedListings();
  };

  const handleRemoveFromSaved = async (listing) => {
    Alert.alert(
      'Remove from Saved',
      `Remove "${listing.title}" from your saved items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromSaved(listing)
        }
      ]
    );
  };

  const removeFromSaved = async (listing) => {
    try {
      setRemovingId(listing.id);
      await userService.removeFromFavorites(user.uid, listing.id);
      
      // Remove from local state
      setSavedListings(savedListings.filter(item => item.id !== listing.id));
    } catch (error) {
      console.error('Error removing from saved:', error);
      Alert.alert('Error', 'Failed to remove from saved items. Please try again.');
    } finally {
      setRemovingId(null);
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

  const renderListingItem = ({ item }) => (
    <View style={styles.listingCard}>
      <TouchableOpacity
        style={styles.listingContent}
        onPress={() => navigation.navigate('ItemDetail', { listing: item })}
      >
        {item.imageURL && (
          <Image source={{ uri: item.imageURL }} style={styles.listingImage} />
        )}
        
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.listingPrice}>${item.price}</Text>
          <Text style={styles.listingCategory}>{item.category}</Text>
          <Text style={styles.listingDate}>
            Posted {formatDate(item.timestamp)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFromSaved(item)}
          disabled={removingId === item.id}
        >
          {removingId === item.id ? (
            <ActivityIndicator size="small" color="#e53e3e" />
          ) : (
            <Ionicons name="heart" size={24} color="#ff4757" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading saved items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Items</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{savedListings.length}</Text>
          <Text style={styles.statLabel}>Saved Items</Text>
        </View>
      </View>

      {/* Saved Listings */}
      <FlatList
        data={savedListings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No saved items</Text>
            <Text style={styles.emptySubtext}>
              Items you save will appear here{'\n'}
              Tap the heart icon on any listing to save it
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Feed' })}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a365d',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f7fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  statLabel: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listingContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  listingInfo: {
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
    marginBottom: 4,
  },
  listingCategory: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listingDate: {
    fontSize: 12,
    color: '#8e8e93',
  },
  removeButton: {
    padding: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
    marginBottom: 8,
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

export default SavedListingsScreen;
