import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../lib/store';
import { API_URL } from '../lib/auth';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Pricing: undefined;
};

type PricingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Pricing'>;
};

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: 'premium_monthly' | 'premium_yearly';
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  savings?: string;
}

const plans: Plan[] = [
  {
    id: 'premium_monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    description: 'Perfect for trying out Premium',
    features: [
      { text: 'Unlimited pixel art generations', included: true },
      { text: 'Cloud AI generation', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Cancel anytime', included: true },
    ],
  },
  {
    id: 'premium_yearly',
    name: 'Yearly',
    price: '$39.99',
    period: '/year',
    description: 'Best value for committed creators',
    features: [
      { text: 'Unlimited pixel art generations', included: true },
      { text: 'Cloud AI generation', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Cancel anytime', included: true },
    ],
    popular: true,
    savings: 'Save 33%',
  },
];

export default function PricingScreen({ navigation }: PricingScreenProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: 'premium_monthly' | 'premium_yearly') => {
    if (!token) {
      navigation.navigate('Login');
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch(`${API_URL}/api/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create checkout session');
      }

      // Open Stripe checkout in browser
      if (data.checkout_url) {
        const supported = await Linking.canOpenURL(data.checkout_url);
        if (supported) {
          await Linking.openURL(data.checkout_url);
        } else {
          Alert.alert('Error', 'Cannot open checkout page');
        }
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ Upgrade to Premium</Text>
          </View>
          <Text style={styles.title}>Unlock Unlimited Creativity</Text>
          <Text style={styles.subtitle}>
            Free users get 3 pixel art generations per week. Upgrade to Premium
            for unlimited creations and cloud AI generation.
          </Text>
        </View>

        {/* Pricing cards */}
        <View style={styles.cardsContainer}>
          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.card,
                plan.popular && styles.cardPopular,
              ]}
            >
              {/* Popular badge */}
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>⚡ Most Popular</Text>
                </View>
              )}

              {/* Plan header */}
              <View style={styles.cardHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>
                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
                <Text style={styles.description}>{plan.description}</Text>
              </View>

              {/* Features */}
              <View style={styles.features}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>

              {/* Subscribe button */}
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  plan.popular && styles.subscribeButtonPopular,
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
              >
                {loading === plan.id ? (
                  <ActivityIndicator color={plan.popular ? '#F4EBD9' : '#2C3E50'} />
                ) : (
                  <Text
                    style={[
                      styles.subscribeButtonText,
                      plan.popular && styles.subscribeButtonTextPopular,
                    ]}
                  >
                    Subscribe
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Free tier info */}
        <View style={styles.freeInfo}>
          <Text style={styles.freeInfoText}>
            Currently on Free tier? You get 3 pixel art generations per week.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.continueLink}>Continue with Free</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EBD9',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#F4EBD9',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#2C3E50',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(44, 62, 80, 0.2)',
    padding: 24,
    marginBottom: 16,
  },
  cardPopular: {
    borderColor: '#2C3E50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#F4EBD9',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 36,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  period: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#2C3E50',
    opacity: 0.6,
  },
  savingsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  savingsText: {
    color: '#2E7D32',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#2C3E50',
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
  },
  features: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkMark: {
    color: '#F4EBD9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#2C3E50',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonPopular: {
    backgroundColor: '#2C3E50',
  },
  subscribeButtonText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  subscribeButtonTextPopular: {
    color: '#F4EBD9',
  },
  freeInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  freeInfoText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#2C3E50',
    opacity: 0.6,
    textAlign: 'center',
  },
  continueLink: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#2C3E50',
    textDecorationLine: 'underline',
    marginTop: 12,
  },
});
