import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useJournalStore, useAuthStore} from '../lib/store';
import {authClient, API_URL} from '../lib/auth';

type RootStackParamList = {
  Main: undefined;
  EntryDetail: {journalId: string};
  Pricing: undefined;
};

type WriteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Style presets for cloud AI generation
const STYLE_PRESETS = [
  {id: 'default', name: 'Classic Pixel', description: 'Standard pixel art style'},
  {id: 'gameboy', name: 'Game Boy', description: 'Green monochrome palette'},
  {id: 'nes', name: 'NES', description: '8-bit limited colors'},
  {id: 'commodore', name: 'Commodore 64', description: 'CRT monitor effect'},
];

export default function WriteScreen() {
  const [entry, setEntry] = useState('');
  const [pixelArt, setPixelArt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cloudGenerating, setCloudGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const navigation = useNavigation<WriteScreenNavigationProp>();
  const addJournal = useJournalStore(state => state.addJournal);
  const updateJournal = useJournalStore(state => state.updateJournal);
  const {subscription, usage, fetchUserData} = useAuthStore();

  const isPremium = subscription?.status === 'active';
  const isAtLimit = !isPremium && (usage?.images_this_week ?? 0) >= (usage?.limit ?? 3);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const checkUsageLimit = (): boolean => {
    if (isPremium) return true;
    
    if (isAtLimit) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const handleGeneratePixelArt = async () => {
    if (!entry.trim()) {
      Alert.alert('Error', 'Please enter some text first');
      return;
    }

    if (!checkUsageLimit()) return;

    setGenerating(true);

    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture?.();
        if (uri) {
          setPixelArt(uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate pixel art');
      console.error('ViewShot error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCloudArt = async () => {
    if (!entry.trim()) {
      Alert.alert('Error', 'Please enter some text first');
      return;
    }

    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    setCloudGenerating(true);

    try {
      // First save the journal to get an ID
      const journal = await addJournal(entry, 'neutral');
      
      const token = authClient.getToken();
      const response = await fetch(`${API_URL}/api/images/generate-cloud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entry_text: entry,
          journal_id: journal.id,
          style: selectedStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setShowPaywall(true);
          return;
        }
        throw new Error(data.error?.message || 'Failed to generate cloud art');
      }

      // Update the pixel art with the cloud-generated image
      setPixelArt(data.image_url);
      updateJournal(journal.id, {image_url: data.image_url});
      
      // Refresh usage data
      fetchUserData();
      
      Alert.alert(
        'Success!',
        `Cloud AI generated your pixel art in ${Math.round(data.generation_time_ms / 1000)}s`
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate cloud art'
      );
      console.error('Cloud generation error:', error);
    } finally {
      setCloudGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!entry.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    setSaving(true);

    try {
      await addJournal(entry, 'neutral');
      setEntry('');
      setPixelArt(null);
      navigation.navigate('Main');
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWithImage = async () => {
    if (!entry.trim() || !pixelArt) {
      Alert.alert('Error', 'Please enter text and generate pixel art first');
      return;
    }

    if (!checkUsageLimit()) return;

    setSaving(true);

    try {
      // First save the journal
      const journal = await addJournal(entry, 'neutral');

      // Upload the image
      const token = authClient.getToken();
      const formData = new FormData();
      formData.append('journal_id', journal.id);
      formData.append('image', {
        uri: pixelArt,
        type: 'image/png',
        name: 'pixelart.png',
      } as unknown as Blob);

      const response = await fetch(`${API_URL}/api/images/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update journal with image URL
        updateJournal(journal.id, {image_url: data.image_url});
        // Refresh usage data
        fetchUserData();
      } else if (response.status === 403) {
        setShowPaywall(true);
        return;
      }

      setEntry('');
      setPixelArt(null);
      navigation.navigate('Main');
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal with image');
      console.error('Save with image error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!pixelArt) {
      Alert.alert('Error', 'No image to share');
      return;
    }

    try {
      await Share.open({
        url: pixelArt,
        message: 'My journal entry',
      });
    } catch (error) {
      // User cancelled or share failed
      if ((error as {message?: string}).message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share image');
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Usage indicator for free users */}
      {!isPremium && usage && (
        <View style={styles.usageBar}>
          <Text style={styles.usageText}>
            {usage.images_this_week}/{usage.limit} images this week
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Pricing')}
            style={styles.upgradeLink}>
            <Text style={styles.upgradeLinkText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      <ViewShot
        ref={viewShotRef}
        options={{format: 'png', quality: 1.0}}
        style={styles.viewShot}>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#2C3E50AA"
          value={entry}
          onChangeText={setEntry}
          multiline
          textAlignVertical="top"
        />
      </ViewShot>

      {pixelArt && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Generated Pixel Art</Text>
          <Image source={{uri: pixelArt}} style={styles.previewImage} />
        </View>
      )}

      <View style={styles.buttonContainer}>
        {/* On-device generation */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.generateButton,
            (!entry.trim() || generating || cloudGenerating) && styles.buttonDisabled,
          ]}
          onPress={handleGeneratePixelArt}
          disabled={!entry.trim() || generating || cloudGenerating}>
          {generating ? (
            <ActivityIndicator color="#F4EBD9" />
          ) : (
            <Text style={styles.buttonText}>Generate Pixel Art (Instant)</Text>
          )}
        </TouchableOpacity>

        {/* Cloud AI generation - Premium only */}
        <View>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cloudButton,
              (!entry.trim() || generating || cloudGenerating) && styles.buttonDisabled,
            ]}
            onPress={handleGenerateCloudArt}
            disabled={!entry.trim() || generating || cloudGenerating}>
            {cloudGenerating ? (
              <View style={styles.cloudLoadingContainer}>
                <ActivityIndicator color="#F4EBD9" />
                <Text style={styles.cloudLoadingText}>AI generating... (~5s)</Text>
              </View>
            ) : (
              <View style={styles.cloudButtonContent}>
                <Text style={styles.buttonText}>✨ Cloud AI (Premium)</Text>
                {!isPremium && <Text style={styles.premiumBadge}>PRO</Text>}
              </View>
            )}
          </TouchableOpacity>
          
          {/* Style picker */}
          {isPremium && (
            <TouchableOpacity
              style={styles.stylePickerButton}
              onPress={() => setShowStylePicker(true)}>
              <Text style={styles.stylePickerText}>
                Style: {STYLE_PRESETS.find(s => s.id === selectedStyle)?.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!entry.trim() || saving) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={!entry.trim() || saving}>
          {saving && !pixelArt ? (
            <ActivityIndicator color="#F4EBD9" />
          ) : (
            <Text style={styles.buttonText}>Save</Text>
          )}
        </TouchableOpacity>

        {pixelArt && (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveWithImageButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={handleSaveWithImage}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#F4EBD9" />
              ) : (
                <Text style={styles.buttonText}>Save with Image</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}>
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaywall(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upgrade to Premium</Text>
            <Text style={styles.modalText}>
              {isAtLimit
                ? "You've reached your weekly limit of 3 pixel art generations."
                : 'Cloud AI generation is a premium feature.'}
            </Text>
            <Text style={styles.modalSubtext}>
              Get unlimited pixel art and cloud AI generation for just $4.99/month.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowPaywall(false);
                navigation.navigate('Pricing');
              }}>
              <Text style={styles.modalButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPaywall(false)}>
              <Text style={styles.modalCancelText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Style Picker Modal */}
      <Modal
        visible={showStylePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStylePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.stylePickerModal}>
            <Text style={styles.modalTitle}>Choose Style</Text>
            {STYLE_PRESETS.map(style => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleOption,
                  selectedStyle === style.id && styles.styleOptionSelected,
                ]}
                onPress={() => {
                  setSelectedStyle(style.id);
                  setShowStylePicker(false);
                }}>
                <Text style={styles.styleOptionName}>{style.name}</Text>
                <Text style={styles.styleOptionDesc}>{style.description}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowStylePicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EBD9',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  usageBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  usageText: {
    color: '#F4EBD9',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  upgradeLink: {
    backgroundColor: '#F4EBD9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upgradeLinkText: {
    color: '#2C3E50',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewShot: {
    width: 400,
    height: 400,
    backgroundColor: '#F4EBD9',
    padding: 20,
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3E50',
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'Courier',
  },
  previewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  previewImage: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#2C3E50',
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateButton: {
    backgroundColor: '#3498DB',
  },
  cloudButton: {
    backgroundColor: '#8E44AD',
  },
  cloudButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cloudLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cloudLoadingText: {
    color: '#F4EBD9',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  premiumBadge: {
    backgroundColor: '#F39C12',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stylePickerButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  stylePickerText: {
    color: '#8E44AD',
    fontFamily: 'monospace',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  saveWithImageButton: {
    backgroundColor: '#27AE60',
  },
  shareButton: {
    backgroundColor: '#9B59B6',
  },
  buttonText: {
    color: '#F4EBD9',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#F4EBD9',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 12,
    color: '#2C3E50',
    opacity: 0.7,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#F4EBD9',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  modalCancelButton: {
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#2C3E50',
    fontSize: 14,
    fontFamily: 'monospace',
    textDecorationLine: 'underline',
  },
  stylePickerModal: {
    backgroundColor: '#F4EBD9',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  styleOption: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(44, 62, 80, 0.2)',
    borderRadius: 8,
    marginBottom: 12,
  },
  styleOptionSelected: {
    borderColor: '#8E44AD',
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
  },
  styleOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  styleOptionDesc: {
    fontSize: 12,
    color: '#2C3E50',
    opacity: 0.7,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
