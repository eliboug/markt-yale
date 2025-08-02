import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main Screens
import FeedScreen from '../screens/main/FeedScreen';
import CreateListingScreen from '../screens/main/CreateListingScreen';
import ChatInboxScreen from '../screens/main/ChatInboxScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MyListingsScreen from '../screens/main/MyListingsScreen';
import SavedListingsScreen from '../screens/main/SavedListingsScreen';
import SoldListingsScreen from '../screens/main/SoldListingsScreen';
import EditListingScreen from '../screens/main/EditListingScreen';
import ItemDetailScreen from '../screens/main/ItemDetailScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';

import { useAuth } from './AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4285f4',
        tabBarInactiveTintColor: '#8e8e93',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Create" component={CreateListingScreen} />
      <Tab.Screen name="Messages" component={ChatInboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen}
        options={{ title: 'Item Details' }}
      />
      <Stack.Screen 
        name="ChatRoom" 
        component={ChatRoomScreen}
        options={({ route }) => ({ 
          title: route.params?.chatTitle || 'Chat' 
        })}
      />
      <Stack.Screen 
        name="MyListings" 
        component={MyListingsScreen}
        options={{ title: 'My Listings' }}
      />
      <Stack.Screen 
        name="SavedListings" 
        component={SavedListingsScreen}
        options={{ title: 'Saved Items' }}
      />
      <Stack.Screen 
        name="SoldListings" 
        component={SoldListingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditListing" 
        component={EditListingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const AuthStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You could show a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
