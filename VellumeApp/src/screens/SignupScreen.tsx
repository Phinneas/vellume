import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {authClient} from '../lib/auth';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;

interface Props {
  navigation: SignupScreenNavigationProp;
  onSignupSuccess: () => void;
}

export default function SignupScreen({navigation, onSignupSuccess}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authClient.signUp(name, email, password);
      onSignupSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vellume</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#2C3E50AA"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#2C3E50AA"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#2C3E50AA"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#F4EBD9" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>
          Already have an account?{' '}
          <Text style={styles.linkTextBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EBD9',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'monospace',
  },
  error: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3E50',
    borderRadius: 0,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2C3E50',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#F4EBD9',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#2C3E50',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  linkTextBold: {
    fontWeight: 'bold',
  },
});
