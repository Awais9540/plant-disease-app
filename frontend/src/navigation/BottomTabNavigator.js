import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import ToolsScreen from '../screens/ToolsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();

const ScanTabButton = ({ children, onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ top: -20, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        elevation: 8
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          height: 72,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          backgroundColor: '#fff',
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Home') return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
          if (route.name === 'Scan') return <Ionicons name="camera" size={28} color="#fff" />;
          if (route.name === 'Tools') return <MaterialCommunityIcons name="calculator-variant-outline" size={size} color={color} />;
          if (route.name === 'Community') return <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />;
          return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tools" component={ToolsScreen} />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarButton: props => <ScanTabButton {...props} />,
          tabBarLabel: () => null
        }}
      />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
