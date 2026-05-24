import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';

import RootNavigator from './src/navigation/RootNavigator';
import { ScanProvider } from './src/context/ScanContext';
import { AppProvider } from './src/context/AppContext';
import { ChatbotProvider } from './src/context/ChatbotContext';
import { WeatherProvider } from './src/context/WeatherContext';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ScanProvider>
          <WeatherProvider>
            <ChatbotProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </ChatbotProvider>
          </WeatherProvider>
        </ScanProvider>
      </AppProvider>
    </AuthProvider>
  );
}