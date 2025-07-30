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
  'Sports',
  'Other'
];

const CreateListingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
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
              });
              setSelectedImage(null);
              
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
          <Text style={styles.sectionTitle}>Photo</Text>
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
          <Text style={styles.sectionTitle}>Description *</Text>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonActive
                  ]}
                  onPress={() => updateFormData('category', category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === category && styles.categoryButtonTextActive
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Silliman College, Room 123"
            value={formData.location}
            onChangeText={(text) => updateFormData('location', text)}
            maxLength={100}
          />
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
