import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';

import { MainTabParamList } from '../types';
import { Colors, FontSize } from '../constants/theme';

import BrowseScreen from '../screens/main/BrowseScreen';
import SavedScreen from '../screens/main/SavedScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Browse:    { active: 'briefcase',          inactive: 'briefcase-outline' },
  Saved:     { active: 'bookmark',           inactive: 'bookmark-outline' },
  Dashboard: { active: 'grid',               inactive: 'grid-outline' },
  Profile:   { active: 'person-circle',      inactive: 'person-circle-outline' },
};

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
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
      <Tab.Screen name="Browse"    component={BrowseScreen}    options={{ title: 'Browse' }} />
      <Tab.Screen name="Saved"     component={SavedScreen}     options={{ title: 'Saved' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 84 : 64,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
});
