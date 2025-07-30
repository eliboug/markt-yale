import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
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

const CATEGORIES = [
  'Electronics',
  'Books',
  'Furniture',
  'Clothing',
  'Sports & Recreation',
  'Home & Garden',
  'Other'
];

const EditListingScreen = ({ route, navigation }) => {
  const { listing } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(listing.imageURL);
  const [hasNewImage, setHasNewImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: listing.title || '',
    description: listing.description || '',
    price: listing.price?.toString() || '',
    category: listing.category || CATEGORIES[0],
    condition: listing.condition || 'Good',
  });

  useEffect(() => {
    navigation.setOptions({
      title: 'Edit Listing',
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#4285f4" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your listing');
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
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    
    return true;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setHasNewImage(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updates = {
        ...formData,
        price: parseFloat(formData.price),
        imageURL: listing.imageURL, // Keep existing image URL initially
      };

      await listingService.updateListingWithImage(
        listing.id,
        updates,
        hasNewImage ? imageUri : null
      );

      Alert.alert(
        'Success',
        'Your listing has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating listing:', error);
      Alert.alert('Error', 'Failed to update listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove the image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setImageUri(null);
            setHasNewImage(true);
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Photo</Text>
          
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Ionicons name="close-circle" size={24} color="#e53e3e" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
              <Ionicons name="camera-outline" size={48} color="#8e8e93" />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </TouchableOpacity>
          )}
          
          {imageUri && (
            <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What are you selling?"
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your item..."
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Price */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Price *</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(text) => updateFormData('price', text)}
                keyboardType="decimal-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonActive
                  ]}
                  onPress={() => updateFormData('category', category)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    formData.category === category && styles.categoryButtonTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Condition */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Condition</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
            >
              {['New', 'Like New', 'Good', 'Fair', 'Poor'].map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.categoryButton,
                    formData.condition === condition && styles.categoryButtonActive
                  ]}
                  onPress={() => updateFormData('condition', condition)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    formData.condition === condition && styles.categoryButtonTextActive
                  ]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#8e8e93',
    fontSize: 16,
  },
  changeImageButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  changeImageText: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#ffffff',
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    paddingLeft: 12,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  categoryContainer: {
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
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
    color: '#4a5568',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditListingScreen;
