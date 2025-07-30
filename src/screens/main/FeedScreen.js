import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listingService } from '../../services/listingService';
import { userService } from '../../services/userService';
import { useAuth } from '../../utils/AuthContext';

const categories = [
  'All',
  'Textbooks',
  'Furniture',
  'Electronics',
  'Clothing',
  'Sports',
  'Other'
];

const FeedScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadListings();
    loadUserFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, searchQuery, selectedCategory, priceRange]);

  const loadListings = async () => {
    try {
      const data = await listingService.getAllListings();
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserFavorites = async () => {
    try {
      if (user) {
        const userFavorites = await userService.getUserFavorites(user.uid);
        setFavorites(userFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Price filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(item => {
        const price = parseFloat(item.price);
        const min = parseFloat(priceRange.min) || 0;
        const max = parseFloat(priceRange.max) || Infinity;
        return price >= min && price <= max;
      });
    }

    setFilteredListings(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
    loadUserFavorites();
  };

  const toggleFavorite = async (listingId) => {
    try {
      const isFavorited = favorites.includes(listingId);
      
      if (isFavorited) {
        await userService.removeFromFavorites(user.uid, listingId);
        setFavorites(favorites.filter(id => id !== listingId));
      } else {
        await userService.addToFavorites(user.uid, listingId);
        setFavorites([...favorites, listingId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const renderListingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => navigation.navigate('ItemDetail', { listing: item })}
    >
      {item.imageURL && (
        <Image source={{ uri: item.imageURL }} style={styles.listingImage} />
      )}
      
      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={favorites.includes(item.id) ? '#ff4757' : '#8e8e93'}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.listingPrice}>${item.price}</Text>
        <Text style={styles.listingCategory}>{item.category}</Text>
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilters}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Categories */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === category && styles.categoryButtonTextActive
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Price Range */}
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min ($)"
                value={priceRange.min}
                onChangeText={(text) => setPriceRange({...priceRange, min: text})}
                keyboardType="numeric"
              />
              <Text style={styles.priceRangeSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max ($)"
                value={priceRange.max}
                onChangeText={(text) => setPriceRange({...priceRange, max: text})}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSelectedCategory('All');
                setPriceRange({ min: '', max: '' });
              }}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markt</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={24} color="#4285f4" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Listings */}
      <FlatList
        data={filteredListings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'All' || priceRange.min || priceRange.max
                ? 'Try adjusting your filters'
                : 'Be the first to post an item!'
              }
            </Text>
          </View>
        }
      />

      <FilterModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
  },
  listContainer: {
    paddingHorizontal: 20,
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
  listingImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  listingContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginRight: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#38a169',
    marginBottom: 4,
  },
  listingCategory: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listingDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#4285f4',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  priceRangeSeparator: {
    marginHorizontal: 12,
    color: '#8e8e93',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginRight: 8,
  },
  clearButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  },
});

export default FeedScreen;
