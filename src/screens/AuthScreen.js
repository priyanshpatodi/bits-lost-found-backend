import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { signUpUser, loginUser } from '../services/api';

export default function AuthScreen({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signUpUser(email, password);
        Alert.alert('Success', 'Account created! Please log in.');
        setIsSignUp(false);
      } else {
        const data = await loginUser(email, password);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      Alert.alert('Auth Error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BITS Lost & Found 🎓</Text>
      <Text style={styles.subtitle}>{isSignUp ? 'Create a student account' : 'Sign in with BITS Email'}</Text>

      <TextInput
        style={styles.input}
        placeholder="f2023xxxx@pilani.bits-pilani.ac.in"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? 'SIGN UP' : 'LOG IN'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
        <Text style={styles.toggleText}>
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0056b3', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#657786', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 8, padding: 14, marginBottom: 12, backgroundColor: '#fafbfc' },
  button: { backgroundColor: '#0056b3', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  toggleBtn: { marginTop: 20, alignItems: 'center' },
  toggleText: { color: '#0056b3', fontWeight: '600', fontSize: 13 },
});