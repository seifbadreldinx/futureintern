import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import InternshipDetailScreen from '../screens/main/InternshipDetailScreen';
import CVBuilderScreen from '../screens/main/CVBuilderScreen';
import ApplicationsScreen from '../screens/main/ApplicationsScreen';
import PointsScreen from '../screens/main/PointsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import HelpCenterScreen from '../screens/main/HelpCenterScreen';
import ContactSupportScreen from '../screens/main/ContactSupportScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/main/TermsOfServiceScreen';
import CompanyOpeningsScreen from '../screens/main/CompanyOpeningsScreen';
import ChatbotScreen from '../screens/main/ChatbotScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { isDark, C } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: C.background,
      card: C.card,
      text: C.text,
      border: C.border,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="InternshipDetail" component={InternshipDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CVBuilder" component={CVBuilderScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Applications" component={ApplicationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Points" component={PointsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CompanyOpenings" component={CompanyOpeningsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
