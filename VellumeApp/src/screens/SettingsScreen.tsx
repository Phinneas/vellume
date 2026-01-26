import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {authClient} from '../lib/auth';
import {useAuthStore} from '../lib/store';

type RootStackParamList = {
  Main: undefined;
  Pricing: undefined;
};

interface Props {
  onSignOut: () => void;
}

export default function SettingsScreen({onSignOut}: Props) {
  const session = authClient.getSession();
  const user = session?.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {subscription, usage, fetchUserData} = useAuthStore();

  const isPremium = subscription?.status === 'active';

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSignOut = async () => {
    await authClient.signOut();
    onSignOut();
  };

  const handleManageSubscription = async () => {
    // Open Stripe customer portal (when implemented)
    // For now, just show an alert
    Linking.openURL('https://billing.stripe.com/p/login/test');
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || 'Unknown'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || 'Unknown'}</Text>
        </View>
      </View>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>

        <View style={[styles.subscriptionCard, isPremium && styles.subscriptionCardPremium]}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionPlan}>
              {isPremium ? '✨ Premium' : 'Free'}
            </Text>
            <View style={[styles.statusBadge, isPremium ? styles.statusActive : styles.statusFree]}>
              <Text style={styles.statusText}>
                {isPremium ? 'Active' : 'Free Tier'}
              </Text>
            </View>
          </View>

          {isPremium ? (
            <>
              <View style={styles.subscriptionDetail}>
                <Text style={styles.detailLabel}>Plan</Text>
                <Text style={styles.detailValue}>
                  {subscription?.plan === 'premium_yearly' ? 'Yearly' : 'Monthly'}
                </Text>
              </View>
              <View style={styles.subscriptionDetail}>
                <Text style={styles.detailLabel}>Renews</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription?.current_period_end)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleManageSubscription}>
                <Text style={styles.manageButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.freeDescription}>
                You have {usage?.limit ?? 3} pixel art generations per week.
              </Text>
              <View style={styles.usageInfo}>
                <Text style={styles.usageText}>
                  Used: {usage?.images_this_week ?? 0}/{usage?.limit ?? 3} this week
                </Text>
              </View>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Pricing')}>
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Premium Benefits */}
        {!isPremium && (
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Premium Benefits</Text>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Unlimited pixel art generations</Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Cloud AI generation (higher quality)</Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Priority processing</Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>Multiple style presets</Text>
            </View>
          </View>
        )}
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EBD9',
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  infoRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3E50',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: '#2C3E50',
    opacity: 0.7,
    marginBottom: 4,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3E50',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  subscriptionCardPremium: {
    borderColor: '#F39C12',
    backgroundColor: '#FFFBF0',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionPlan: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#27AE60',
  },
  statusFree: {
    backgroundColor: '#95A5A6',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  subscriptionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#2C3E50',
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  freeDescription: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  usageInfo: {
    backgroundColor: '#F4EBD9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  usageText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  manageButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2C3E50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  manageButtonText: {
    color: '#2C3E50',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  upgradeButton: {
    backgroundColor: '#2C3E50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#F4EBD9',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(44, 62, 80, 0.2)',
    borderRadius: 12,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    color: '#27AE60',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  signOutButton: {
    backgroundColor: '#E74C3C',
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 40,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
