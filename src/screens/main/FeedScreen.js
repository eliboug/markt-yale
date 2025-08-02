import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  SafeAreaView,
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
  'Sports & Recreation',
  'Kitchen & Dining',
  'School Supplies',
  'Books & Media',
  'Health & Beauty',
  'Tickets & Events',
  'Other'
];

const FeedScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [courseCodeFilter, setCourseCodeFilter] = useState('');
  const [furnitureTypeFilter, setFurnitureTypeFilter] = useState('');
  const [favorites, setFavorites] = useState([]);
  
  useEffect(() => {
    loadListings();
    loadUserFavorites();
  }, []);

  // Use useMemo to optimize filtering and prevent unnecessary re-renders
  const filteredListings = useMemo(() => {
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

    // Course code filter (for textbooks)
    if (courseCodeFilter && selectedCategory === 'Textbooks') {
      filtered = filtered.filter(item => {
        if (item.category === 'Textbooks' && item.courseCodes) {
          return item.courseCodes.some(code => 
            code.toLowerCase().includes(courseCodeFilter.toLowerCase())
          );
        }
        return false;
      });
    }

    // Furniture type filter (for furniture)
    if (furnitureTypeFilter && selectedCategory === 'Furniture') {
      filtered = filtered.filter(item => {
        return item.category === 'Furniture' && item.furnitureType === furnitureTypeFilter;
      });
    }

    return filtered;
  }, [listings, searchQuery, selectedCategory, priceRange, courseCodeFilter, furnitureTypeFilter]);

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
        
        {/* Course Codes Preview (for Textbooks) */}
        {item.category === 'Textbooks' && item.courseCodes && item.courseCodes.length > 0 && (
          <View style={styles.courseCodesPreview}>
            {item.courseCodes.slice(0, 3).map((code, index) => (
              <View key={index} style={styles.courseCodePreviewChip}>
                <Text style={styles.courseCodePreviewText}>{code}</Text>
              </View>
            ))}
            {item.courseCodes.length > 3 && (
              <Text style={styles.moreCodesText}>+{item.courseCodes.length - 3} more</Text>
            )}
          </View>
        )}
        
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Extract available course codes from current textbook listings
  const availableCourseCodes = useMemo(() => {
    const codes = new Set();
    listings
      .filter(listing => listing.category === 'Textbooks' && listing.courseCodes)
      .forEach(listing => {
        listing.courseCodes.forEach(code => codes.add(code));
      });
    return Array.from(codes).sort();
  }, [listings]);

  // Extract available furniture types from current furniture listings
  const availableFurnitureTypes = useMemo(() => {
    const types = new Set();
    listings
      .filter(listing => listing.category === 'Furniture' && listing.furnitureType)
      .forEach(listing => {
        types.add(listing.furnitureType);
      });
    return Array.from(types).sort();
  }, [listings]);
  
  // Scrollable component for course code selection (only for Textbooks)
  const CourseCodeDropdown = () => {
    if (selectedCategory !== 'Textbooks') return null;
    
    // Group course codes by department prefix (first 4 letters)
    const groupedCourseCodes = {};
    availableCourseCodes.forEach(code => {
      const dept = code.substring(0, 4);
      if (!groupedCourseCodes[dept]) {
        groupedCourseCodes[dept] = [];
      }
      groupedCourseCodes[dept].push(code);
    });
    
    return (
      <View style={styles.courseCodeContainer}>
        <Text style={styles.filterSectionTitle}>Course Code</Text>
        <View style={styles.courseCodeSelectionContainer}>
          <TouchableOpacity 
            style={[styles.courseCodeChip, !courseCodeFilter && styles.courseCodeChipActive]} 
            onPress={() => setCourseCodeFilter('')}
          >
            <Text style={[styles.courseCodeChipText, !courseCodeFilter && styles.courseCodeChipTextActive]}>All</Text>
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseCodeScroll}>
            {Object.keys(groupedCourseCodes).sort().map(dept => (
              <View key={dept} style={styles.deptSection}>
                <Text style={styles.deptHeader}>{dept}</Text>
                <View style={styles.coursesRow}>
                  {groupedCourseCodes[dept].map(code => (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.courseCodeChip,
                        courseCodeFilter === code && styles.courseCodeChipActive
                      ]}
                      onPress={() => setCourseCodeFilter(code)}
                    >
                      <Text 
                        style={[
                          styles.courseCodeChipText,
                          courseCodeFilter === code && styles.courseCodeChipTextActive
                        ]}
                      >
                        {code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  // Scrollable component for furniture type selection (only for Furniture)
  const FurnitureTypeDropdown = () => {
    if (selectedCategory !== 'Furniture') return null;
    
    return (
      <View style={styles.courseCodeContainer}>
        <Text style={styles.filterSectionTitle}>Furniture Type</Text>
        <View style={styles.courseCodeSelectionContainer}>
          <TouchableOpacity 
            style={[styles.courseCodeChip, !furnitureTypeFilter && styles.courseCodeChipActive]} 
            onPress={() => setFurnitureTypeFilter('')}
          >
            <Text style={[styles.courseCodeChipText, !furnitureTypeFilter && styles.courseCodeChipTextActive]}>All</Text>
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseCodeScroll}>
            {availableFurnitureTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.courseCodeChip,
                  furnitureTypeFilter === type && styles.courseCodeChipActive
                ]}
                onPress={() => setFurnitureTypeFilter(type)}
              >
                <Text 
                  style={[
                    styles.courseCodeChipText,
                    furnitureTypeFilter === type && styles.courseCodeChipTextActive
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };
  
  // Clear all filters function
  const clearAllFilters = () => {
    setSelectedCategory('All');
    setPriceRange({ min: '', max: '' });
    setCourseCodeFilter('');
    setFurnitureTypeFilter('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markt</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Ionicons name={showFilters ? "chevron-up" : "filter"} size={24} color="#4285f4" />
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
      
      {/* Inline Filter Section */}
      {showFilters && (
        <View style={styles.filterContainer}>
          {/* Categories */}
          <Text style={styles.filterSectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    // Clear course code filter when switching away from Textbooks
                    if (category !== 'Textbooks') {
                      setCourseCodeFilter('');
                    }
                  }}
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
          
          {/* Course Code Dropdown (only shows for Textbooks) */}
          <CourseCodeDropdown />
          
          {/* Furniture Type Dropdown (only shows for Furniture) */}
          <FurnitureTypeDropdown />
          
          {/* Price Range */}
          <Text style={styles.filterSectionTitle}>Price Range</Text>
          <View style={styles.priceRangeContainer}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min ($)"
              keyboardType="numeric"
              value={priceRange.min}
              onChangeText={(value) => setPriceRange({ ...priceRange, min: value })}
            />
            <Text style={styles.priceRangeSeparator}>to</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max ($)"
              keyboardType="numeric"
              value={priceRange.max}
              onChangeText={(value) => setPriceRange({ ...priceRange, max: value })}
            />
          </View>
          
          {/* Filter Actions */}
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  filterButton: {
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
    maxHeight: '60%', // Reduced from 80% to leave room for keyboard
    paddingBottom: 40, // Added padding to prevent content from being covered
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
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    color: '#333',
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryButtonActive: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#333',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  courseCodeInputContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  courseCodeFilterInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingRight: 30, // Space for the clear button
    fontSize: 16,
    backgroundColor: '#fff',
  },
  clearInputButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -9 }], // Center vertically
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  priceRangeSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#8e8e93',
  },
  clearAllButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  clearButtonText: {
    color: '#4285f4',
    fontWeight: '500',
    fontSize: 14,
  },
  courseCodeContainer: {
    marginVertical: 8,
  },
  courseCodeSelectionContainer: {
    marginTop: 6,
  },
  courseCodeScroll: {
    marginTop: 8,
  },
  deptSection: {
    marginRight: 16,
    marginBottom: 4,
  },
  deptHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  coursesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 160, // Fixed width for department section
  },
  courseCodeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  courseCodeChipActive: {
    backgroundColor: '#4285f4',
  },
  courseCodeChipText: {
    fontSize: 12,
    color: '#333',
  },
  courseCodeChipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  courseCodesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginVertical: 8,
  },
  courseCodePreviewChip: {
    backgroundColor: '#4285f4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  courseCodePreviewText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  moreCodesText: {
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic',
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
