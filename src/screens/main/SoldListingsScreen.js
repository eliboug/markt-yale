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
import { listingService } from '../../services/listingService';
import { useAuth } from '../../utils/AuthContext';

const SoldListingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [soldListings, setSoldListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);

  useEffect(() => {
    loadSoldListings();
  }, []);

  const loadSoldListings = async () => {
    try {
      if (user) {
        const listings = await listingService.getSoldListingsByUser(user.uid);
        setSoldListings(listings);
      }
    } catch (error) {
      console.error('Error loading sold listings:', error);
      Alert.alert('Error', 'Failed to load sold listings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSoldListings();
    setRefreshing(false);
  };

  const handleReactivateListing = async (listing) => {
    Alert.alert(
      'Reactivate Listing',
      'Are you sure you want to mark this item as available again? It will appear back in the marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            setReactivatingId(listing.id);
            try {
              await listingService.markAsAvailable(listing.id);
              
              // Remove from sold listings
              setSoldListings(prevListings => 
                prevListings.filter(item => item.id !== listing.id)
              );
              
              Alert.alert('Success', 'Listing reactivated and is now available in the marketplace');
            } catch (error) {
              console.error('Error reactivating listing:', error);
              Alert.alert('Error', 'Failed to reactivate listing. Please try again.');
            } finally {
              setReactivatingId(null);
            }
          }
        }
      ]
    );
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

  const renderSoldListingItem = ({ item }) => (
    <View style={styles.listingCard}>
      <TouchableOpacity
        style={styles.listingContent}
        onPress={() => navigation.navigate('ItemDetail', { listing: item })}
      >
        {item.imageURL && (
          <Image source={{ uri: item.imageURL }} style={styles.listingImage} />
        )}
        
        <View style={styles.listingInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>SOLD</Text>
            </View>
          </View>
          <Text style={styles.soldPrice}>${item.price}</Text>
          <Text style={styles.listingCategory}>{item.category}</Text>
          <Text style={styles.listingDate}>
            Posted {formatDate(item.timestamp)}
            {item.soldAt && (
              <Text style={styles.soldDate}>
                {' • Sold ' + formatDate(item.soldAt)}
              </Text>
            )}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.listingActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.reactivateButton]}
          onPress={() => handleReactivateListing(item)}
          disabled={reactivatingId === item.id}
        >
          {reactivatingId === item.id ? (
            <ActivityIndicator size="small" color="#38a169" />
          ) : (
            <Ionicons name="refresh-outline" size={20} color="#38a169" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading sold items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sold Items</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Sold Listings */}
      <FlatList
        data={soldListings}
        renderItem={renderSoldListingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No sold items yet</Text>
            <Text style={styles.emptySubtext}>
              Items you mark as sold will appear here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Feed' })}
            >
              <Text style={styles.browseButtonText}>Browse Marketplace</Text>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  headerRight: {
    width: 40,
  },
  listContainer: {
    paddingBottom: 20,
  },
  listingCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
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
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f7fafc',
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    marginRight: 8,
  },
  soldPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8e8e93',
    marginBottom: 4,
    textDecorationLine: 'line-through',
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
  soldDate: {
    color: '#e53e3e',
    fontWeight: '500',
  },
  soldBadge: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  listingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f7fafc',
  },
  actionButton: {
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
  },
  reactivateButton: {
    backgroundColor: '#c6f6d5',
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
    color: '#2d3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
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

export default SoldListingsScreen;
