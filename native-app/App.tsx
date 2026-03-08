import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';
import './src/global.css';

// Navigation
import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';

import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/ClientAuthContext';
import { OneSignal } from 'react-native-onesignal';

const ONESIGNAL_APP_ID = "4554f523-0919-4c97-9df2-acdd2f459914";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    // OneSignal Initialization
    console.log('OneSignal: Initializing');
    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.Notifications.requestPermission(true);

    // Debug Listeners
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('OneSignal: Notification will display in foreground:', event.getNotification());
    });

    OneSignal.User.pushSubscription.addEventListener('change', (state) => {
      console.log('OneSignal: Push subscription state changed:', JSON.stringify(state.current));
    });

    if (session?.user?.id) {
      console.log('OneSignal: Logging in user', session.user.id);
      OneSignal.login(session.user.id);
    }
  }, [session]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#34d399" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session && session.user ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';

export default function App() {
  useEffect(() => {
    // OneSignal Initialization at root level
    console.log('OneSignal: Initializing');
    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.Notifications.requestPermission(true);
  }, []);

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_KEY} merchantIdentifier="merchant.com.coachency">
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
