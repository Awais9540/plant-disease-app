import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    name: 'Farmer',
    location: 'Pakistan',
    language: 'English'
  });

  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false
  });

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        settings,
        setSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    return {
      profile: {
        name: 'Farmer',
        location: 'Pakistan'
      },
      settings: {},
      setProfile: () => {},
      setSettings: () => {}
    };
  }

  return context;
};
