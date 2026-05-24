import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabNavigator from './BottomTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import FertilizerCalculatorScreen from '../screens/FertilizerCalculatorScreen';
import PesticideCalculatorScreen from '../screens/PesticideCalculatorScreen';
import FarmingCalculatorScreen from '../screens/FarmingCalculatorScreen';
import ChatbotScreen from '../screens/ChatbotScreen';

import DiseaseGuideScreen from '../screens/DiseaseGuideScreen';
import SprayScheduleScreen from '../screens/SprayScheduleScreen';
import WeatherScreen from '../screens/WeatherScreen';

import CreatePostScreen from '../screens/community/CreatePostScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';

import { getOnboardingSeen } from '../services/storageService';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [bootState, setBootState] = useState({
    loading: true,
    seen: false,
  });

  useEffect(() => {
    const load = async () => {
      const seen = await getOnboardingSeen();

      setTimeout(() => {
        setBootState({
          loading: false,
          seen,
        });
      }, 2500);
    };

    load();
  }, []);

  if (bootState.loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!bootState.seen && (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}

      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen 
        name="Chatbot" 
        component={ChatbotScreen} 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen name="History" component={HistoryScreen} />

      <Stack.Screen name="FertilizerCalculator" component={FertilizerCalculatorScreen} />
      <Stack.Screen name="PesticideCalculator" component={PesticideCalculatorScreen} />
      <Stack.Screen name="FarmingCalculator" component={FarmingCalculatorScreen} />

      <Stack.Screen name="DiseaseGuide" component={DiseaseGuideScreen} />
      <Stack.Screen name="SpraySchedule" component={SprayScheduleScreen} />
      <Stack.Screen name="WeatherAdvisory" component={WeatherScreen} />
      
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen} 
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
