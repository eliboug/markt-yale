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

const MyListingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [soldToggleId, setSoldToggleId] = useState(null);

  useEffect(() => {
    loadMyListings();
  }, []);

  const loadMyListings = async () => {
    try {
      if (user) {
        const data = await listingService.getListingsByUser(user.uid);
        setListings(data);
      }
    } catch (error) {
      console.error('Error loading my listings:', error);
      Alert.alert('Error', 'Failed to load your listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMyListings();
  };

  const handleDeleteListing = (listing) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteListing(listing.id)
        }
      ]
    );
  };

  const deleteListing = async (listingId) => {
    try {
      setDeletingId(listingId);
      await listingService.deleteListing(listingId);
      
      // Remove from local state
      setListings(listings.filter(listing => listing.id !== listingId));
      
      Alert.alert('Success', 'Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      Alert.alert('Error', 'Failed to delete listing. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditListing = (listing) => {
    navigation.navigate('EditListing', { listing });
  };

  const handleToggleSold = async (listing) => {
    const action = listing.sold ? 'mark as available' : 'mark as sold';
    const actionTitle = listing.sold ? 'Mark as Available' : 'Mark as Sold';
    
    Alert.alert(
      actionTitle,
      `Are you sure you want to ${action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionTitle,
          onPress: async () => {
            setSoldToggleId(listing.id);
            try {
              if (listing.sold) {
                await listingService.markAsAvailable(listing.id);
              } else {
                await listingService.markAsSold(listing.id);
              }
              
              // Update local state
              setListings(prevListings => 
                prevListings.map(item => 
                  item.id === listing.id 
                    ? { ...item, sold: !item.sold, soldAt: !item.sold ? new Date() : null }
                    : item
                )
              );
              
              const message = listing.sold 
                ? 'Listing marked as available and will appear in the marketplace'
                : 'Listing marked as sold and removed from the marketplace';
              
              Alert.alert('Success', message);
            } catch (error) {
              console.error('Error toggling sold status:', error);
              Alert.alert('Error', 'Failed to update listing status. Please try again.');
            } finally {
              setSoldToggleId(null);
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
          <View style={styles.titleRow}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.sold && (
              <View style={styles.soldBadge}>
                <Text style={styles.soldBadgeText}>SOLD</Text>
              </View>
            )}
          </View>
          <Text style={[styles.listingPrice, item.sold && styles.soldPrice]}>
            ${item.price}
          </Text>
          <Text style={styles.listingCategory}>{item.category}</Text>
          <Text style={styles.listingDate}>
            Posted {formatDate(item.timestamp)}
            {item.sold && item.soldAt && (
              <Text style={styles.soldDate}>
                {' • Sold {formatDate(item.soldAt)}'}
              </Text>
            )}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.listingActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditListing(item)}
        >
          <Ionicons name="pencil-outline" size={20} color="#4285f4" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, item.sold ? styles.availableButton : styles.soldButton]}
          onPress={() => handleToggleSold(item)}
          disabled={soldToggleId === item.id}
        >
          {soldToggleId === item.id ? (
            <ActivityIndicator size="small" color={item.sold ? "#38a169" : "#f56500"} />
          ) : (
            <Text style={[
              styles.actionButtonText,
              { color: item.sold ? "#38a169" : "#f56500" }
            ]}>
              {item.sold ? "AVAILABLE" : "SOLD"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteListing(item)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color="#e53e3e" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#e53e3e" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Create' })}
        >
          <Ionicons name="add" size={24} color="#4285f4" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{listings.length}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>
      </View>

      {/* Listings */}
      <FlatList
        data={listings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No listings yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first listing to start selling
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Create' })}
            >
              <Text style={styles.createFirstButtonText}>Create Listing</Text>
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
  addButton: {
    padding: 8,
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
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: '#fed7d7',
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
  createFirstButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  soldBadge: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  soldBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  soldPrice: {
    textDecorationLine: 'line-through',
    color: '#8e8e93',
  },
  soldDate: {
    color: '#e53e3e',
    fontWeight: '500',
  },
  soldButton: {
    backgroundColor: '#fed7d7',
  },
  availableButton: {
    backgroundColor: '#c6f6d5',
  },
});

export default MyListingsScreen;
