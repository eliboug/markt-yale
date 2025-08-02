import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { listingService } from '../../services/listingService';
import { useAuth } from '../../utils/AuthContext';

const categories = [
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

const yaleLocations = [
  'Berkeley College',
  'Branford College', 
  'Davenport College',
  'Ezra Stiles College',
  'Jonathan Edwards College',
  'Morse College',
  'Pierson College',
  'Saybrook College',
  'Silliman College',
  'Timothy Dwight College',
  'Trumbull College',
  'Benjamin Franklin College',
  'Pauli Murray College',
  'Grace Hopper College',
  'Off-campus',
  'Old Campus'
];

const furnitureTypes = [
  'Desk',
  'Chair',
  'Bed',
  'Dresser',
  'Bookshelf',
  'Table',
  'Couch/Sofa',
  'Nightstand',
  'Lamp',
  'Storage/Organizer',
  'Mirror',
  'Rug/Carpet',
  'Other Furniture'
];

const CreateListingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    courseCodes: [],
    furnitureType: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showFurnitureTypeDropdown, setShowFurnitureTypeDropdown] = useState(false);
  const [showCourseCodeModal, setShowCourseCodeModal] = useState(false);
  const [currentCourseCode, setCurrentCourseCode] = useState('');

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Course code validation (4 letters + 4 numbers)
  const validateCourseCode = (code) => {
    const courseCodeRegex = /^[A-Za-z]{4}\d{4}$/;
    return courseCodeRegex.test(code.replace(/\s/g, ''));
  };

  const addCourseCode = () => {
    const cleanCode = currentCourseCode.replace(/\s/g, '').toUpperCase();
    if (validateCourseCode(cleanCode)) {
      if (!formData.courseCodes.includes(cleanCode)) {
        setFormData(prev => ({
          ...prev,
          courseCodes: [...prev.courseCodes, cleanCode]
        }));
      }
      setCurrentCourseCode('');
      setShowCourseCodeModal(false);
    } else {
      Alert.alert(
        'Invalid Course Code',
        'Please enter a valid course code (4 letters + 4 numbers, e.g., CHEM1234)'
      );
    }
  };

  const removeCourseCode = (codeToRemove) => {
    setFormData(prev => ({
      ...prev,
      courseCodes: prev.courseCodes.filter(code => code !== codeToRemove)
    }));
  };

  const selectImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to upload an image.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera to take a photo.'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you\'d like to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: selectImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const validateForm = () => {
    // Validate required fields
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }

    if (!formData.price.trim()) {
      Alert.alert('Error', 'Please enter a price');
      return false;
    }
    if (isNaN(parseFloat(formData.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }
    if (!selectedImage) {
      Alert.alert('Error', 'Please add a photo');
      return false;
    }
    // Validate textbook course codes
    if (formData.category === 'Textbooks' && formData.courseCodes.length === 0) {
      Alert.alert('Error', 'Please add at least one course code for textbooks');
      return false;
    }
    // Validate furniture type
    if (formData.category === 'Furniture' && !formData.furnitureType) {
      Alert.alert('Error', 'Please select a furniture type');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      await listingService.createListing(
        formData,
        selectedImage?.uri,
        user.uid
      );

      Alert.alert(
        'Success',
        'Your listing has been posted!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                title: '',
                description: '',
                price: '',
                category: '',
                location: '',
                courseCodes: [],
                furnitureType: ''
              });
              setSelectedImage(null);
              setCurrentCourseCode('');
              
              // Navigate to Feed
              navigation.navigate('Feed');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Listing</Text>
          <Text style={styles.headerSubtitle}>Sell your items to fellow Yale students</Text>
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo *</Text>
          <TouchableOpacity style={styles.imageUpload} onPress={showImageOptions}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imageUploadPlaceholder}>
                <Ionicons name="camera" size={32} color="#8e8e93" />
                <Text style={styles.imageUploadText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {selectedImage && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Organic Chemistry Textbook"
            value={formData.title}
            onChangeText={(text) => updateFormData('title', text)}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe the condition, features, etc."
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price *</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceSymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              value={formData.price}
              onChangeText={(text) => updateFormData('price', text)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text style={[styles.dropdownButtonText, !formData.category && styles.placeholderText]}>
              {formData.category || 'Select a category'}
            </Text>
            <Ionicons 
              name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#8e8e93" 
            />
          </TouchableOpacity>
          
          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView 
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormData('category', category);
                      setShowCategoryDropdown(false);
                      // Reset course codes when changing category
                      if (category !== 'Textbooks') {
                        setFormData(prev => ({ ...prev, courseCodes: [] }));
                      }
                      // Reset furniture type when changing category
                      if (category !== 'Furniture') {
                        setFormData(prev => ({ ...prev, furnitureType: '' }));
                      }
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{category}</Text>
                    {formData.category === category && (
                      <Ionicons name="checkmark" size={20} color="#4285f4" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Course Codes for Textbooks */}
        {formData.category === 'Textbooks' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course Codes *</Text>
            <Text style={styles.sectionSubtitle}>Add course codes (e.g., CHEM1234, MATH1120)</Text>
            
            {/* Display added course codes */}
            {formData.courseCodes.length > 0 && (
              <View style={styles.courseCodesContainer}>
                {formData.courseCodes.map((code, index) => (
                  <View key={index} style={styles.courseCodeChip}>
                    <Text style={styles.courseCodeText}>{code}</Text>
                    <TouchableOpacity
                      onPress={() => removeCourseCode(code)}
                      style={styles.removeCodeButton}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {/* Add course code button */}
            <TouchableOpacity
              style={styles.addCourseCodeButton}
              onPress={() => setShowCourseCodeModal(true)}
            >
              <Ionicons name="add" size={20} color="#4285f4" />
              <Text style={styles.addCourseCodeText}>Add Course Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Furniture Type for Furniture */}
        {formData.category === 'Furniture' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Furniture Type *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowFurnitureTypeDropdown(!showFurnitureTypeDropdown)}
            >
              <Text style={[styles.dropdownButtonText, !formData.furnitureType && styles.placeholderText]}>
                {formData.furnitureType || 'Select furniture type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#8e8e93" />
            </TouchableOpacity>
            
            {showFurnitureTypeDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {furnitureTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownItem}
                      onPress={() => {
                        updateFormData('furnitureType', type);
                        setShowFurnitureTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type}</Text>
                      {formData.furnitureType === type && (
                        <Ionicons name="checkmark" size={20} color="#4285f4" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <Text style={[styles.dropdownButtonText, !formData.location && styles.placeholderText]}>
              {formData.location || 'Select a location'}
            </Text>
            <Ionicons 
              name={showLocationDropdown ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#8e8e93" 
            />
          </TouchableOpacity>
          
          {showLocationDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView 
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {yaleLocations.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormData('location', location);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{location}</Text>
                    {formData.location === location && (
                      <Ionicons name="checkmark" size={20} color="#4285f4" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Post Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Course Code Modal */}
      {showCourseCodeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Course Code</Text>
            <Text style={styles.modalSubtitle}>Enter a 4-letter + 4-number course code</Text>
            
            <TextInput
              style={styles.courseCodeInput}
              placeholder="e.g., CHEM1234"
              value={currentCourseCode}
              onChangeText={setCurrentCourseCode}
              maxLength={8}
              autoCapitalize="characters"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCourseCodeModal(false);
                  setCurrentCourseCode('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={addCourseCode}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4a5568',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  priceSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#38a169',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
  },
  imageUpload: {
    height: 200,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageUploadPlaceholder: {
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 8,
  },
  removeImageButton: {
    alignSelf: 'center',
    marginTop: 12,
  },
  removeImageText: {
    fontSize: 14,
    color: '#e53e3e',
    fontWeight: '500',
  },
  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#2d3748',
  },
  placeholderText: {
    color: '#8e8e93',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2d3748',
  },
  // Course Code Styles
  sectionSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
  },
  courseCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  courseCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285f4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  courseCodeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  removeCodeButton: {
    padding: 2,
  },
  addCourseCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4285f4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  addCourseCodeText: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
    textAlign: 'center',
  },
  courseCodeInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
    backgroundColor: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: '#4285f4',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeImageText: {
    color: '#e53e3e',
    fontSize: 16,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryButtonActive: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#4285f4',
    marginHorizontal: 20,
    marginVertical: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateListingScreen;
