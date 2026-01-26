import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useJournalStore, type Journal} from '../lib/store';

type TabParamList = {
  Write: undefined;
  Gallery: undefined;
  Settings: undefined;
};

type RootStackParamList = {
  Main: undefined;
  EntryDetail: {journalId: string};
};

type GalleryScreenNavigationProp = BottomTabNavigationProp<
  TabParamList,
  'Gallery'
> &
  NativeStackNavigationProp<RootStackParamList>;

export default function GalleryScreen() {
  const navigation = useNavigation<GalleryScreenNavigationProp>();
  const journals = useJournalStore(state => state.journals);
  const isLoading = useJournalStore(state => state.isLoading);
  const loadJournals = useJournalStore(state => state.loadJournals);
  const fetchJournalsFromAPI = useJournalStore(
    state => state.fetchJournalsFromAPI,
  );

  useEffect(() => {
    loadJournals();
    fetchJournalsFromAPI();
  }, [loadJournals, fetchJournalsFromAPI]);

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleJournalPress = (journal: Journal) => {
    // Navigate to entry detail - will be implemented in App.tsx
    navigation.navigate('EntryDetail', {journalId: journal.id});
  };

  const renderJournalItem = ({item}: {item: Journal}) => {
    const firstLetter = item.entry_text.trim().charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleJournalPress(item)}>
        {item.image_url ? (
          <Image source={{uri: item.image_url}} style={styles.cardImage} />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Text style={styles.cardPlaceholderText}>{firstLetter}</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          <Text style={styles.cardText}>{truncateText(item.entry_text)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && journals.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C3E50" />
          <Text style={styles.loadingText}>Loading journals...</Text>
        </View>
      </View>
    );
  }

  if (journals.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emoji}>📝</Text>
          <Text style={styles.title}>No entries yet</Text>
          <Text style={styles.subtitle}>Write your first journal entry!</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Write')}>
            <Text style={styles.buttonText}>Write Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={journals.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )}
        renderItem={renderJournalItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EBD9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
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
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#2C3E50',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#F4EBD9',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  listContent: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3E50',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  cardPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F4EBD9',
    fontFamily: 'monospace',
  },
  cardContent: {
    padding: 12,
  },
  cardDate: {
    fontSize: 12,
    color: '#2C3E50',
    opacity: 0.7,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  cardText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
