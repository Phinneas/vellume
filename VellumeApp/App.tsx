import React, {useState, useEffect, useRef} from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, StyleSheet, Alert, Linking} from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import WriteScreen from './src/screens/WriteScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EntryDetailScreen from './src/screens/EntryDetailScreen';
import PricingScreen from './src/screens/PricingScreen';
import {authClient} from './src/lib/auth';
import {useAuthStore} from './src/lib/store';

// Type definitions
type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type TabParamList = {
  Write: undefined;
  Gallery: undefined;
  Settings: undefined;
};

type RootStackParamList = {
  Main: undefined;
  EntryDetail: {journalId: string};
  Pricing: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking = {
  prefixes: ['vellumeapp://'],
  config: {
    screens: {
      Main: {
        screens: {
          Gallery: 'gallery',
          Write: 'write',
          Settings: 'settings',
        },
      },
      Pricing: 'pricing',
      SubscriptionSuccess: 'subscription/success',
      SubscriptionCancel: 'subscription/cancel',
    },
  },
};

// Tab bar icon component
function TabBarIcon({name, focused}: {name: string; focused: boolean}) {
  const icons: Record<string, string> = {
    Write: '✏️',
    Gallery: '🖼️',
    Settings: '⚙️',
  };

  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {icons[name] || '📱'}
    </Text>
  );
}

// Auth Navigator
function AuthNavigator({onAuthSuccess}: {onAuthSuccess: () => void}) {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <AuthStack.Screen name="Login">
        {props => <LoginScreen {...props} onLoginSuccess={onAuthSuccess} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Signup">
        {props => <SignupScreen {...props} onSignupSuccess={onAuthSuccess} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

// Tab Navigator
function TabNavigator({onSignOut}: {onSignOut: () => void}) {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused}) => (
          <TabBarIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#2C3E50',
        tabBarInactiveTintColor: '#2C3E50AA',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: '#2C3E50',
      })}>
      <Tab.Screen name="Write" component={WriteScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main Navigator (includes tabs, entry detail, and pricing)
function MainNavigator({onSignOut}: {onSignOut: () => void}) {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Main" options={{headerShown: false}}>
        {() => <TabNavigator onSignOut={onSignOut} />}
      </RootStack.Screen>
      <RootStack.Screen
        name="EntryDetail"
        component={EntryDetailScreen}
        options={{
          title: 'Journal Entry',
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: '#2C3E50',
        }}
      />
      <RootStack.Screen
        name="Pricing"
        component={PricingScreen}
        options={{
          title: 'Upgrade to Premium',
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: '#2C3E50',
        }}
      />
    </RootStack.Navigator>
  );
}

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const {fetchUserData} = useAuthStore();

  useEffect(() => {
    // Check for existing session on app start
    const session = authClient.getSession();
    setIsLoggedIn(!!session);
    setIsLoading(false);

    // Fetch user data if logged in
    if (session) {
      fetchUserData();
    }
  }, [fetchUserData]);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: {url: string}) => {
      const url = event.url;
      
      // Handle subscription success
      if (url.includes('subscription/success')) {
        Alert.alert(
          "You're now Premium! 🎉",
          'You now have unlimited access to pixel art generation and cloud AI features.',
          [
            {
              text: 'Awesome!',
              onPress: () => {
                // Refresh user data to get updated subscription
                fetchUserData();
                // Navigate to gallery
                if (navigationRef.current) {
                  navigationRef.current.navigate('Main');
                }
              },
            },
          ]
        );
      }
      
      // Handle subscription cancel
      if (url.includes('subscription/cancel')) {
        Alert.alert(
          'Subscription Cancelled',
          'No worries! You can upgrade anytime from Settings.',
          [{text: 'OK'}]
        );
      }
    };

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({url});
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchUserData]);

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    fetchUserData();
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {isLoggedIn ? (
        <MainNavigator onSignOut={handleSignOut} />
      ) : (
        <AuthNavigator onAuthSuccess={handleAuthSuccess} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F4EBD9',
    borderTopWidth: 2,
    borderTopColor: '#2C3E50',
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  tabBarLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 24,
  },
  tabIconFocused: {
    transform: [{scale: 1.1}],
  },
  header: {
    backgroundColor: '#F4EBD9',
    borderBottomWidth: 2,
    borderBottomColor: '#2C3E50',
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#2C3E50',
  },
});
