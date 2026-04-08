import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, TouchableOpacity, Text } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MainTabParamList, RootStackParamList } from '../types';
import { FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

import BrowseScreen    from '../screens/main/BrowseScreen';
import CompaniesScreen from '../screens/main/CompaniesScreen';
import SavedScreen     from '../screens/main/SavedScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen   from '../screens/main/ProfileScreen';
import ChatbotFAB      from '../components/ChatbotFAB';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Browse:    { active: 'briefcase',      inactive: 'briefcase-outline' },
  Companies: { active: 'business',       inactive: 'business-outline' },
  Saved:     { active: 'bookmark',       inactive: 'bookmark-outline' },
  Dashboard: { active: 'grid',           inactive: 'grid-outline' },
  Profile:   { active: 'person-circle',  inactive: 'person-circle-outline' },
};




export default function MainNavigator() {
  const { C } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.card,
            borderTopColor: C.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 84 : 64,
          },
          tabBarActiveTintColor: C.primary,
          tabBarInactiveTintColor: C.gray400,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name as keyof MainTabParamList];
            return (
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Browse"    component={BrowseScreen}    options={{ title: 'Internships' }} />
        <Tab.Screen name="Companies" component={CompaniesScreen} options={{ title: 'Companies' }} />
        <Tab.Screen name="Saved"     component={SavedScreen}     options={{ title: 'Saved' }} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
        <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Profile' }} />
      </Tab.Navigator>

      {/* Chatbot FAB — always visible, bottom-right, like the website */}
      <ChatbotFAB bottom={100} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
});
