import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Share from 'react-native-share';
import {useJournalStore} from '../lib/store';

type RootStackParamList = {
  Main: undefined;
  EntryDetail: {journalId: string};
};

type EntryDetailScreenRouteProp = RouteProp<RootStackParamList, 'EntryDetail'>;
type EntryDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EntryDetail'
>;

export default function EntryDetailScreen() {
  const navigation = useNavigation<EntryDetailScreenNavigationProp>();
  const route = useRoute<EntryDetailScreenRouteProp>();
  const {journalId} = route.params;

  const journals = useJournalStore(state => state.journals);
  const deleteJournal = useJournalStore(state => state.deleteJournal);

  const journal = journals.find(j => j.id === journalId);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteJournal(journalId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDownloadImage = () => {
    // For now, just show an alert - actual download requires CameraRoll
    Alert.alert('Coming Soon', 'Image saved to gallery');
  };

  const handleShareImage = async () => {
    if (!journal?.image_url) {
      Alert.alert('Error', 'No image to share');
      return;
    }

    try {
      await Share.open({
        url: journal.image_url,
        message: 'My journal entry',
      });
    } catch (error) {
      // User cancelled or share failed
      if ((error as {message?: string}).message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share image');
      }
    }
  };

  if (!journal) {
    return (
      <View style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Journal entry not found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {journal.image_url && (
        <View style={styles.imageContainer}>
          <Image source={{uri: journal.image_url}} style={styles.image} />
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageButton, styles.downloadButton]}
              onPress={handleDownloadImage}>
              <Text style={styles.imageButtonText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageButton, styles.shareButton]}
              onPress={handleShareImage}>
              <Text style={styles.imageButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.metaContainer}>
        <Text style={styles.date}>{formatDate(journal.created_at)}</Text>
        <Text style={styles.mood}>Mood: {journal.mood}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.entryText}>{journal.entry_text}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Entry</Text>
        </TouchableOpacity>
      </View>
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
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  imageButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  imageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  downloadButton: {
    backgroundColor: '#3498DB',
  },
  shareButton: {
    backgroundColor: '#9B59B6',
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  metaContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3E50',
    padding: 16,
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  mood: {
    fontSize: 14,
    color: '#2C3E50',
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  textContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3E50',
    padding: 16,
    marginBottom: 20,
  },
  entryText: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'monospace',
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
  },
  button: {
    backgroundColor: '#2C3E50',
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#F4EBD9',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  backButton: {
    backgroundColor: '#2C3E50',
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#F4EBD9',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
