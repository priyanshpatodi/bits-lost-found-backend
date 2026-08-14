import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createItem } from '../services/api';

export default function ReportScreen({ navigation }) {
  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [campus, setCampus] = useState('Pilani');
  const [contactEmail, setContactEmail] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !contactEmail) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await createItem({
        title,
        description,
        type,
        location,
        campus,
        contact_email: contactEmail,
        image_url: imageUri, // Attached image URI
      });

      Alert.alert('Success', 'Listing submitted successfully!');
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setContactEmail('');
      setImageUri(null);
      navigation.navigate('Home');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Report Lost or Found Item 📝</Text>

      {/* Type Selector */}
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'lost' && styles.lostActive]}
          onPress={() => setType('lost')}
        >
          <Text style={[styles.typeText, type === 'lost' && styles.whiteText]}>I LOST SOMETHING</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'found' && styles.foundActive]}
          onPress={() => setType('found')}
        >
          <Text style={[styles.typeText, type === 'found' && styles.whiteText]}>I FOUND SOMETHING</Text>
        </TouchableOpacity>
      </View>

      {/* Image Picker */}
      <Text style={styles.label}>Attach Photo (Optional)</Text>
      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        <Text style={styles.imagePickerText}>{imageUri ? '📷 Change Photo' : '📷 Select Photo from Gallery'}</Text>
      </TouchableOpacity>

      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageButton}>
            <Text style={styles.removeImageText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inputs */}
      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} placeholder="e.g. Blue Boat Earphones" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Provide details (color, distinct marks, specific spot)..."
        multiline
        numberOfLines={3}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Location *</Text>
      <TextInput style={styles.input} placeholder="e.g. SAC Gym / BD Mess Table 4" value={location} onChangeText={setLocation} />

      <Text style={styles.label}>Campus</Text>
      <View style={styles.chipRow}>
        {['Pilani', 'Goa', 'Hyderabad', 'Dubai'].map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, campus === c && styles.chipActive]}
            onPress={() => setCampus(c)}
          >
            <Text style={[styles.chipText, campus === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>BITS Email Contact *</Text>
      <TextInput
        style={styles.input}
        placeholder="f2023xxxx@pilani.bits-pilani.ac.in"
        keyboardType="email-address"
        autoCapitalize="none"
        value={contactEmail}
        onChangeText={setContactEmail}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT REPORT</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a1a1a' },
  typeContainer: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  typeButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f0f3f5', alignItems: 'center' },
  lostActive: { backgroundColor: '#e0245e' },
  foundActive: { backgroundColor: '#17bf63' },
  typeText: { fontWeight: 'bold', fontSize: 12, color: '#657786' },
  whiteText: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  imagePickerButton: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#0056b3', borderRadius: 8, padding: 14, alignItems: 'center', backgroundColor: '#f0f7ff' },
  imagePickerText: { color: '#0056b3', fontWeight: 'bold', fontSize: 13 },
  imagePreviewContainer: { marginTop: 10, alignItems: 'center' },
  imagePreview: { width: '100%', height: 160, borderRadius: 8 },
  removeImageButton: { marginTop: 6 },
  removeImageText: { color: '#e0245e', fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fafbfc' },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f3f5' },
  chipActive: { backgroundColor: '#0056b3' },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#0056b3', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});