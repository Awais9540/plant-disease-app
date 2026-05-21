import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import { ScanProvider } from './src/context/ScanContext';
import { AppProvider } from './src/context/AppContext';
import { ChatbotProvider } from './src/context/ChatbotContext';
import { WeatherProvider } from './src/context/WeatherContext';

export default function App() {
  return (
    <AppProvider>
      <ScanProvider>
        <WeatherProvider>
          <ChatbotProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          </ChatbotProvider>
        </WeatherProvider>
      </ScanProvider>
    </AppProvider>
  );
}